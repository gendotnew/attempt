import { createServer } from "node:http"
import { readFile, stat } from "node:fs/promises"
import { join, resolve, sep } from "node:path"
import { buildBlog, webRoot } from "./build-blog.mjs"

await buildBlog()
const publicRoot = join(webRoot, "public")
const port = Number(process.env.PORT ?? 5196)
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error("Use a valid nonprivileged PORT")
}
const types = {
  html: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  ico: "image/x-icon",
  xml: "application/xml; charset=utf-8",
  txt: "text/plain; charset=utf-8",
}

const server = createServer(async (request, response) => {
  try {
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" })
      response.end()
      return
    }
    const pathname = decodeURIComponent(
      new URL(request.url, `http://127.0.0.1:${port}`).pathname,
    )
    if (pathname === "/") {
      response.writeHead(302, { Location: "/blog/" })
      response.end()
      return
    }
    let path = resolve(publicRoot, `.${pathname}`)
    if (!path.startsWith(publicRoot + sep)) {
      response.writeHead(404)
      response.end()
      return
    }
    if ((await stat(path)).isDirectory()) {
      if (!pathname.endsWith("/")) {
        response.writeHead(308, { Location: `${pathname}/` })
        response.end()
        return
      }
      path = join(path, "index.html")
    }
    const body = await readFile(path)
    response.writeHead(200, {
      "Content-Type":
        types[path.split(".").at(-1)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    })
    response.end(request.method === "HEAD" ? undefined : body)
  } catch {
    response.writeHead(404, {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex",
    })
    response.end(
      '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found</title><body><h1>Page not found</h1><a href="/blog/">Back to the blog</a></body></html>',
    )
  }
})
server.listen(port, "127.0.0.1", () =>
  console.log(
    `Blog preview: http://127.0.0.1:${port}/blog/ (blog only; the existing app is not running here)`,
  ),
)
