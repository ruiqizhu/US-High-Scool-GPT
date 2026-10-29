import { test } from "node:test";
import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { createHandler } from "../scripts/serve.mjs";
const handler = createHandler();
function request(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const response = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });
    response.writeHead = function (status, headers = {}) {
      this.status = status;
      this.headers = headers;
    };
    response.on("error", reject);
    response.on("finish", () =>
      resolve({
        status: response.status,
        headers: response.headers,
        body: Buffer.concat(chunks).toString(),
      }),
    );
    handler({ url, method }, response);
  });
}
test("静态服务返回可用的中文入口、脚本、样式和安卓图标", async () => {
  for (const file of [
    "/",
    "/styles.css",
    "/app.js",
    "/core.js",
    "/content.js",
    "/sw.js",
    "/manifest.webmanifest",
    "/assets/icon-192.png",
  ]) {
    const result = await request(file);
    assert.equal(result.status, 200, file);
    assert.ok(result.headers["Content-Type"]);
    assert.ok(Number(result.headers["Content-Length"]) > 0);
  }
  assert.match((await request("/")).body, /zh-CN/);
});
test("静态服务支持 HEAD，禁止修改请求与非公开项目文件", async () => {
  const result = await request("/app.js", "HEAD");
  assert.equal(result.status, 200);
  assert.equal(result.body, "");
  assert.equal((await request("/", "POST")).status, 405);
  for (const file of [
    "/README.md",
    "/.git/config",
    "/package.json",
    "/tests/core.test.mjs",
    "/assets/../../auth.json",
    "/%ZZ",
    "/assets/photos/%2e%2e%2f%2e%2e%2fcontent.js",
    "/node_modules/jsdom/package.json",
  ])
    assert.equal((await request(file)).status, 404, file);
});
