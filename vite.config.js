import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import fs from "node:fs";
import path from "node:path";

// Cesium のビルド済みアセットの場所
const cesiumSource = "node_modules/cesium/Build/Cesium";
const cesiumBaseUrl = "cesiumStatic";

// 拡張子から MIME type を判定
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".wasm": "application/wasm",
    ".xml": "application/xml",
    ".html": "text/html",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".bin": "application/octet-stream",
    ".ktx2": "image/ktx2",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
  };
  return map[ext] || "application/octet-stream";
}

export default defineConfig({
  define: {
    CESIUM_BASE_URL: JSON.stringify(`/${cesiumBaseUrl}`),
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
      ],
    }),

    // dev サーバーでも /cesiumStatic/* を正しい MIME type で配信する
    {
      name: "cesium-dev-server",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url) return next();

          const urlPath = req.url.split("?")[0];

          if (!urlPath.startsWith(`/${cesiumBaseUrl}/`)) {
            return next();
          }

          const relative = urlPath.replace(`/${cesiumBaseUrl}/`, "");
          const filePath = path.resolve(
            process.cwd(),
            cesiumSource,
            decodeURIComponent(relative)
          );

          fs.stat(filePath, (err, stat) => {
            if (err || !stat.isFile()) {
              return next();
            }

            res.setHeader("Content-Type", getMimeType(filePath));
            fs.createReadStream(filePath).pipe(res);
          });
        });
      },
    },
  ],
});