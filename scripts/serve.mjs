import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};
// 只公开应用文件，避免局域网预览时暴露项目其他内容。
const publicFiles = new Set([
  "index.html",
  "styles.css",
  "content.js",
  "enrichment.js",
  "assets/photo-index.js",
  "core.js",
  "app.js",
  "sw.js",
  "manifest.webmanifest",
]);
export function createHandler(baseDirectory = root) {
  return (req, res) => {
    try {
      if (!["GET", "HEAD"].includes(req.method)) {
        res.writeHead(405, { Allow: "GET, HEAD" });
        res.end();
        return;
      }
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const relative = pathname === "/" ? "index.html" : pathname.slice(1);
      const file = path.resolve(baseDirectory, relative);
      const allowed =
        publicFiles.has(relative) ||
        /^assets\/(?:[a-z0-9_-]+\.(?:svg|png)|photos\/[a-z0-9_-]+\.jpg)$/.test(
          relative,
        );
      if (!allowed || !file.startsWith(baseDirectory + path.sep)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const stat = fs.statSync(file);
      if (!stat.isFile()) throw Error();
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
        "Content-Length": stat.size,
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Cache-Control": "no-cache",
      });
      if (req.method === "HEAD") res.end();
      else fs.createReadStream(file).pipe(res);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  const argument = (flag, fallback) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : fallback;
  };
  const host = argument("--host", "127.0.0.1");
  const port = Number(argument("--port", process.env.PORT || "3000"));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("端口须为 1–65535 的整数。");
    process.exit(1);
  }
  const server = http.createServer(createHandler());
  server.on("error", (error) => {
    console.error("无法启动本地服务：" + error.message);
    process.exitCode = 1;
  });
  server.listen(port, host, () => {
    console.log(`远行 · 美高成长指南\n本机打开：http://localhost:${port}`);
    if (host === "0.0.0.0") {
      for (const list of Object.values(os.networkInterfaces()))
        for (const entry of list || [])
          if (entry.family === "IPv4" && !entry.internal)
            console.log(
              `同一 Wi-Fi 的安卓手机可打开：http://${entry.address}:${port}`,
            );
      console.log("局域网 HTTP 适合阅读；离线安装需 HTTPS 或本机 localhost。");
    }
  });
}
