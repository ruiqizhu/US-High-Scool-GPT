import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const code = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
function worker() {
  const handlers = {},
    map = new Map(),
    stored = [],
    flags = { skip: 0, network: 0 };
  const key = (r) =>
    typeof r === "string"
      ? r.replace(/^\.\//, "")
      : new URL(r.url).pathname.slice(1);
  const cache = {
    async addAll(urls) {
      for (const url of urls) {
        const file = url === "./" ? "index.html" : url.slice(2);
        map.set(
          key(url),
          new Response(fs.readFileSync(new URL("../" + file, import.meta.url))),
        );
      }
    },
    async match(r) {
      return map.get(key(r))?.clone();
    },
    async put(r, response) {
      stored.push(key(r));
      map.set(key(r), response);
    },
  };
  const self = {
    location: { origin: "https://example.test" },
    clients: { claim: async () => {} },
    skipWaiting() {
      flags.skip++;
    },
    addEventListener(name, fn) {
      handlers[name] = fn;
    },
  };
  vm.runInNewContext(code, {
    self,
    caches: {
      open: async () => cache,
      keys: async () => [],
      delete: async () => true,
    },
    URL,
    Response,
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: async () => {
      flags.network++;
      throw Error("offline");
    },
  });
  return { handlers, flags, map, stored };
}
test("离线资源包包含新版内容和六张本地图，安装后不自动接管", async () => {
  const w = worker();
  let installed;
  w.handlers.install({ waitUntil: (p) => (installed = p) });
  await installed;
  assert.ok(w.map.has("enrichment.js"));
  assert.ok(w.map.has("assets/photos/campus.jpg"));
  assert.equal(w.flags.skip, 0);
  w.handlers.message({ data: { type: "UNRELATED" } });
  assert.equal(w.flags.skip, 0);
  w.handlers.message({ data: { type: "ACTIVATE_UPDATE" } });
  assert.equal(w.flags.skip, 1);
});
test("缓存核心文件离线直接返回，不缓存网络错误，也不接管外站", async () => {
  const w = worker();
  let installed;
  w.handlers.install({ waitUntil: (p) => (installed = p) });
  await installed;
  let result;
  w.handlers.fetch({
    request: { method: "GET", url: "https://example.test/enrichment.js" },
    respondWith: (p) => (result = p),
  });
  const response = await result;
  assert.equal(response.status, 200);
  assert.match(await response.text(), /schoolFacts/);
  assert.equal(w.flags.network, 0);
  w.handlers.fetch({
    request: { method: "GET", url: "https://example.test/missing.jpg" },
    respondWith: (p) => (result = p),
  });
  assert.equal((await result).type, "error");
  assert.equal(w.stored.length, 0);
  let intercepted = false;
  w.handlers.fetch({
    request: { method: "GET", url: "https://outside.test/x" },
    respondWith() {
      intercepted = true;
    },
  });
  assert.equal(intercepted, false);
});
