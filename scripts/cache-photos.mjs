/** 将已注明来源的照片缓存到项目里。无需第三方依赖。 */
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = { window: {} };
vm.runInNewContext(
  await fs.readFile(path.join(root, "content.js"), "utf8"),
  context,
);
vm.runInNewContext(
  await fs.readFile(path.join(root, "enrichment.js"), "utf8"),
  context,
);
const directory = path.join(root, "assets/photos");
await fs.mkdir(directory, { recursive: true });
let failed = 0;
const local = [];
for (const [name, photo] of Object.entries(context.window.GUIDE.photos)) {
  if (!photo.allowCache) {
    console.log("保留远程引用（缓存授权未确认）：" + name);
    continue;
  }
  const file = path.join(directory, name + ".jpg");
  try {
    await fs.access(file);
    local.push(name);
    console.log("已存在：" + name);
    continue;
  } catch {}
  try {
    const response = await fetch(photo.url, {
      signal: AbortSignal.timeout(25000),
      headers: {
        Accept: "image/jpeg,image/png,image/webp",
        "User-Agent": "Yuanxing-Local-Photo-Cache/1.0",
      },
    });
    if (
      !response.ok ||
      !response.headers.get("content-type")?.startsWith("image/")
    )
      throw Error("服务器未返回有效图片（" + response.status + "）");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length < 100 || bytes.length > 15 * 1024 * 1024)
      throw Error("图片大小异常");
    await fs.writeFile(file, bytes);
    local.push(name);
    console.log(`已缓存：${name}（${Math.round(bytes.length / 1024)} KB）`);
  } catch (error) {
    failed++;
    console.error("暂未下载：" + name + " · " + error.message);
  }
}
await fs.writeFile(
  path.join(directory, "sources.json"),
  JSON.stringify(context.window.GUIDE.photos, null, 2) + "\n",
);
await fs.writeFile(
  path.join(root, "assets/photo-index.js"),
  "window.PHOTO_LOCAL = " + JSON.stringify(local) + ";\n",
);
console.log(
  failed
    ? "有 " +
        failed +
        " 张图片未缓存。页面仍会尝试原始来源，失败时显示本地占位图。"
    : "已缓存 " + local.length + " 张照片；授权未确认的官方图片保留远程引用。",
);
process.exitCode = failed ? 1 : 0;
