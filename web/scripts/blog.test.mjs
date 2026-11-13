import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import test from "node:test"
import {
  buildBlog,
  escapeHtml,
  renderBlock,
  renderPost,
  validatePost,
  webRoot,
} from "./build-blog.mjs"

const { posts } = await buildBlog()

test("public article is readable without JavaScript and contains its metadata and contextual links", async () => {
  const post = posts[0]
  const html = await readFile(
    join(webRoot, "public/blog", post.slug, "index.html"),
    "utf8",
  )
  assert.equal((html.match(/<h1>/g) ?? []).length, 1)
  assert.ok(html.includes(`<h1>${escapeHtml(post.title)}</h1>`))
  assert.ok(
    html.includes(
      `<link rel="canonical" href="https://learn-anything.xyz/blog/${post.slug}/">`,
    ),
  )
  assert.ok(html.includes('property="og:type" content="article"'))
  assert.ok(
    html.includes(
      'name="robots" content="index,follow,max-image-preview:large"',
    ),
  )
  assert.ok(html.includes('href="https://gen.new/"'))
  assert.ok(html.includes('href="https://gen.new/ai-product-photography"'))
  assert.ok(html.includes("another project from Learn Anything’s owner"))
  assert.ok(
    html.indexOf('href="https://gen.new/"') <
      html.indexOf('<section id="meet-gen-new"'),
  )
  assert.ok(html.includes(`<title>${escapeHtml(post.seoTitle)}</title>`))
  assert.equal((html.match(/class="gen-cta"/g) ?? []).length, 2)
  assert.ok(!/<script(?! type="application\/ld\+json")/i.test(html))
  assert.ok(!/clerk|jazz|gtag|googletagmanager|noindex/.test(html))
  const graph = JSON.parse(
    html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1],
  )["@graph"]
  assert.equal(
    graph.find((item) => item["@type"] === "BlogPosting").headline,
    post.title,
  )
  assert.equal(
    graph.find((item) => item["@type"] === "BlogPosting").about.url,
    "https://gen.new/",
  )
  assert.equal(
    graph.find((item) => item["@type"] === "BlogPosting").image[0].contentUrl,
    "https://learn-anything.xyz" + post.cover.src,
  )
  assert.equal(
    graph.find((item) => item["@type"] === "BreadcrumbList").itemListElement
      .length,
    3,
  )
  const ids = new Set(
    [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]),
  )
  for (const match of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.has(match[1]), `Missing anchor ${match[1]}`)
  }
})

test("article templates escape content and reject executable or protocol-relative links", () => {
  assert.equal(
    renderBlock({ type: "paragraph", text: '<img src=x onerror="alert(1)">' }),
    "<p>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p>",
  )
  for (const href of [
    "javascript:alert(1)",
    "//example.com",
    "/\\example.com",
    "/path\nmalicious",
    "data:text/html,x",
  ]) {
    assert.throws(() =>
      renderBlock({
        type: "links",
        items: [{ href, text: "test", description: "" }],
      }),
    )
  }
  const html = renderPost({
    ...posts[0],
    title: "</script><script>alert(1)</script>",
  })
  assert.ok(!html.includes("</script><script>"))
  assert.ok(html.includes("\\u003c/script>"))
  assert.throws(() => validatePost({ ...posts[0], slug: "../../escape" }))
  assert.throws(() =>
    renderBlock({
      type: "paragraph",
      parts: [{ text: "unsafe", href: "javascript:alert(1)" }],
    }),
  )
  assert.throws(() =>
    renderBlock({
      type: "image",
      src: '/blog/test.webp" onerror="alert(1)',
      width: 100,
      height: 100,
      alt: "test",
    }),
  )
  assert.throws(() =>
    renderBlock({
      type: "image",
      ...posts[0].cover,
      srcset: "javascript:alert(1) 800w",
    }),
  )
  assert.throws(() =>
    validatePost({
      ...posts[0],
      sections: [posts[0].sections[0], posts[0].sections[0]],
    }),
  )
})

test("blog discovery is present in HTML, the sitemap, RSS and existing site navigation", async () => {
  const publicFile = (name) => readFile(join(webRoot, "public", name), "utf8")
  const index = await publicFile("blog/index.html")
  const sitemap = await publicFile("blog-sitemap.xml")
  const feed = await publicFile("blog/feed.xml")
  assert.ok(index.includes(`href="/blog/${posts[0].slug}/"`))
  assert.ok(
    sitemap.includes(
      `<loc>https://learn-anything.xyz/blog/${posts[0].slug}/</loc>`,
    ),
  )
  assert.ok(feed.includes(escapeHtml(posts[0].title)))
  assert.ok(
    sitemap.includes(
      `<image:loc>https://learn-anything.xyz${posts[0].cover.src}</image:loc>`,
    ),
  )
  assert.ok((await publicFile("sitemap.xml")).includes("<sitemapindex"))
  assert.ok(
    (await publicFile("robots.txt")).includes(
      "Sitemap: https://learn-anything.xyz/sitemap.xml",
    ),
  )
  for (const path of [
    "app/routes/_layout/(landing)/index.tsx",
    "app/components/sidebar/sidebar.tsx",
  ]) {
    assert.ok(
      (await readFile(join(webRoot, path), "utf8")).includes('href="/blog/"'),
    )
  }
})

test("real Gen screenshots have optimized variants, accurate provenance and social metadata", async () => {
  const provenance = JSON.parse(
    await readFile(join(webRoot, "blog/screenshots.json"), "utf8"),
  )
  assert.equal(provenance.source, "https://gen.new/home")
  assert.equal(provenance.paidGenerations, 0)
  assert.ok(provenance.method.includes("Direct Chromium screenshots"))
  const html = await readFile(
    join(webRoot, "public/blog", posts[0].slug, "index.html"),
    "utf8",
  )
  assert.ok(
    html.includes(
      `property="og:image" content="https://learn-anything.xyz${posts[0].socialImage.src}"`,
    ),
  )
  assert.ok(html.includes("srcset="))
  assert.ok(html.includes('loading="lazy"'))
  assert.ok(!html.includes("image-generation-cover"))
  for (const file of provenance.files) {
    const bytes = await readFile(join(webRoot, "public/blog", file.file))
    assert.ok(bytes.length > 0 && bytes.length < 150_000)
    const source = await readFile(join(webRoot, "blog/assets", file.file))
    assert.deepEqual(bytes, source)
  }
  const cover = provenance.files.find((file) =>
    posts[0].cover.src.endsWith(file.file),
  )
  assert.equal(cover.width, posts[0].cover.width)
  assert.equal(cover.height, posts[0].cover.height)
})
