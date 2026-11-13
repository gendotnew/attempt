import { createHash } from "node:crypto"
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

export const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
export const origin = "https://learn-anything.xyz"
export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  )
const jsonLd = (value) => JSON.stringify(value).replace(/</g, "\\u003c")
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const arrow =
  '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'

function safeHref(href) {
  if (
    typeof href !== "string" ||
    /[\s\\]/.test(href) ||
    !/^(https:\/\/|\/(?!\/))/.test(href)
  ) {
    throw new Error(`Unsupported blog link: ${href}`)
  }
  return escapeHtml(href)
}

function imageAttributes(image, { eager = false, index = false } = {}) {
  if (
    !/^\/blog\/[a-z0-9-]+\.(webp|png|jpe?g)$/.test(image.src) ||
    !Number.isInteger(image.width) ||
    image.width <= 0 ||
    !Number.isInteger(image.height) ||
    image.height <= 0 ||
    typeof image.alt !== "string" ||
    !image.alt.trim()
  ) {
    throw new Error("Invalid blog image")
  }
  if (
    image.srcset &&
    !image.srcset
      .split(",")
      .every((value) =>
        /^\/blog\/[a-z0-9-]+\.(webp|png|jpe?g) [1-9]\d*w$/.test(value.trim()),
      )
  ) {
    throw new Error("Invalid responsive image sources")
  }
  const sizes = index
    ? "(max-width: 800px) calc(100vw - 40px), (max-width: 1200px) 48vw, 550px"
    : "(max-width: 800px) calc(100vw - 40px), (max-width: 1200px) calc(100vw - 64px), 1096px"
  return `src="${escapeHtml(image.src)}"${image.srcset ? ` srcset="${escapeHtml(image.srcset)}" sizes="${sizes}"` : ""} width="${image.width}" height="${image.height}" alt="${escapeHtml(image.alt)}" decoding="async" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}`
}

const imageSchema = (image) => ({
  "@type": "ImageObject",
  url: origin + image.src,
  contentUrl: origin + image.src,
  width: image.width,
  height: image.height,
  caption: image.caption ?? image.alt,
})

const callToAction = (link, secondary = false) =>
  `<p class="gen-actions"><a class="gen-cta" href="${safeHref(link.href)}">${escapeHtml(link.text)} ${arrow}</a>${secondary ? '<a class="gen-pricing-link" href="https://gen.new/pricing">See plans &amp; credits</a>' : ""}</p>`

export function renderBlock(block) {
  if (block.type === "paragraph") {
    if (block.parts) {
      return `<p>${block.parts.map((part) => (part.href ? `<a href="${safeHref(part.href)}">${escapeHtml(part.text)}</a>` : escapeHtml(part.text))).join("")}</p>`
    }
    return `<p>${escapeHtml(block.text)}</p>`
  }
  if (block.type === "image") {
    return `<figure class="article-screenshot"><img ${imageAttributes(block)}><figcaption>${escapeHtml(block.caption)}</figcaption></figure>`
  }
  if (block.type === "disclosure") {
    return `<p class="disclosure">${escapeHtml(block.text)}</p>`
  }
  if (block.type === "list") {
    return `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
  }
  if (block.type === "prompt") {
    return `<figure class="prompt"><figcaption>${escapeHtml(block.label)}</figcaption><blockquote>${escapeHtml(block.text)}</blockquote></figure>`
  }
  if (block.type === "links") {
    return `<ul class="resource-links">${block.items.map((item) => `<li><a href="${safeHref(item.href)}">${escapeHtml(item.text)}</a> ${escapeHtml(item.description)}</li>`).join("")}</ul>`
  }
  throw new Error(`Unsupported blog block: ${block.type}`)
}

export function validatePost(post) {
  if (!slugPattern.test(post.slug)) {
    throw new Error("Invalid post slug")
  }
  for (const key of ["title", "description", "category", "author", "summary"]) {
    if (typeof post[key] !== "string" || !post[key].trim()) {
      throw new Error(`Missing post ${key}`)
    }
  }
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(post.date) ||
    new Date(post.date).toISOString().slice(0, 10) !== post.date
  ) {
    throw new Error("Invalid post date")
  }
  if (
    !post.intro?.length ||
    !post.sections?.length ||
    !Array.isArray(post.faqs)
  ) {
    throw new Error("Incomplete post")
  }
  const ids = post.sections.map((section) => section.id)
  if (
    new Set(ids).size !== ids.length ||
    ids.includes("questions") ||
    ids.some((id) => !slugPattern.test(id))
  ) {
    throw new Error("Section IDs must be unique safe anchors")
  }
  post.sections.forEach((section) => section.blocks.forEach(renderBlock))
  post.intro.forEach((block) =>
    typeof block === "string" ? escapeHtml(block) : renderBlock(block),
  )
  imageAttributes(post.cover)
  imageAttributes(post.socialImage)
  if (post.startLink) {
    safeHref(post.startLink.href)
  }
  if (post.endLink) {
    safeHref(post.endLink.href)
  }
  return post
}

const dateLabel = (date) =>
  new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`))
const readingMinutes = (post) =>
  Math.max(1, Math.ceil(JSON.stringify(post).split(/\s+/).length / 220))
const postPath = (post) => `/blog/${post.slug}/`
const meta = (post) =>
  `<div class="meta"><a class="author-link" href="/">${escapeHtml(post.author)}</a><time datetime="${post.date}">${dateLabel(post.date)}</time><span>${readingMinutes(post)} min read</span></div>`
const topicLinks =
  '<a href="/photography">Photography</a><a href="/design">Design</a><a href="/artificial-intelligence">Artificial intelligence</a>'
const publisher = {
  "@type": "Organization",
  "@id": `${origin}/#organization`,
  name: "Learn Anything",
  url: `${origin}/`,
  logo: { "@type": "ImageObject", url: `${origin}/android-chrome-512x512.png` },
}

function document({
  title,
  description,
  path,
  article,
  schema,
  content,
  version,
  socialImage,
}) {
  const url = origin + path
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="index,follow,max-image-preview:large"><meta name="color-scheme" content="dark">
<link rel="canonical" href="${url}"><link rel="icon" href="/favicon.ico"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/blog/blog.css?v=${version}"><link rel="alternate" type="application/rss+xml" title="Learn Anything Blog" href="/blog/feed.xml">
<meta property="og:type" content="${article ? "article" : "website"}"><meta property="og:site_name" content="Learn Anything"><meta property="og:locale" content="en_US">
<meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${origin}${escapeHtml(socialImage.src)}"><meta property="og:image:type" content="image/${socialImage.src.endsWith(".png") ? "png" : socialImage.src.endsWith(".webp") ? "webp" : "jpeg"}"><meta property="og:image:width" content="${socialImage.width}"><meta property="og:image:height" content="${socialImage.height}"><meta property="og:image:alt" content="${escapeHtml(socialImage.alt)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${origin}${escapeHtml(socialImage.src)}"><meta name="twitter:image:alt" content="${escapeHtml(socialImage.alt)}">
${article ? `<meta property="article:published_time" content="${article.date}"><meta property="article:section" content="${escapeHtml(article.category)}">` : ""}
<script type="application/ld+json">${jsonLd({ "@context": "https://schema.org", "@graph": [publisher, ...schema] })}</script>
</head><body>
<a class="skip-link" href="#main">Skip to content</a><div class="shell">
<header class="site-header"><a class="brand" href="/"><img src="/logo.png" alt="" width="30" height="30">Learn Anything</a><nav aria-label="Main navigation"><a href="/">Explore</a><a href="/blog/"${path === "/blog/" ? ' aria-current="page"' : ""}>Blog</a></nav></header>
${content}
<footer class="site-footer"><p>Learn something. Make something.</p><div><a href="/">Explore topics</a> &nbsp;·&nbsp; <a href="/blog/feed.xml">RSS feed</a></div></footer>
</div></body></html>\n`
}

export function renderIndex(posts, version = "1") {
  const description =
    "Practical guides for curious people. Learn creative skills, explore AI tools, and turn an idea into a project you can finish."
  return document({
    title: "Learning guides & creative practice | Learn Anything Blog",
    description,
    path: "/blog/",
    version,
    socialImage: posts[0].socialImage,
    schema: [
      {
        "@type": "Blog",
        "@id": `${origin}/blog/#blog`,
        name: "Learn Anything Blog",
        description,
        url: `${origin}/blog/`,
        publisher: { "@id": publisher["@id"] },
        blogPost: posts.map((post) => ({
          "@type": "BlogPosting",
          headline: post.title,
          url: origin + postPath(post),
        })),
      },
    ],
    content: `<main id="main"><div class="index-intro"><p class="eyebrow">The Learn Anything blog</p><h1>Learn by making.</h1><p class="lede">Practical guides for curious people. Pick a small project, build a new skill, and see where it takes you.</p></div>
${posts.map((post) => `<article class="featured"><a class="cover-link" href="${postPath(post)}" aria-label="Read ${escapeHtml(post.title)}"><img ${imageAttributes(post.cover, { eager: true, index: true })}></a><div class="feature-copy"><p class="eyebrow">${escapeHtml(post.category)}</p><h2><a href="${postPath(post)}">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.summary)}</p>${meta(post)}<a class="read-link" href="${postPath(post)}">Read the guide ${arrow}</a></div></article>`).join("")}
<div class="topic-strip"><p>Keep exploring</p>${topicLinks}</div></main>`,
  })
}

export function renderPost(post, version = "1") {
  const path = postPath(post)
  return document({
    title: post.seoTitle ?? `${post.title} | Learn Anything`,
    description: post.description,
    path,
    article: post,
    version,
    socialImage: post.socialImage,
    schema: [
      {
        "@type": "BlogPosting",
        "@id": `${origin}${path}#article`,
        headline: post.title,
        description: post.description,
        url: origin + path,
        mainEntityOfPage: origin + path,
        datePublished: post.date,
        image: [imageSchema(post.cover)],
        ...(post.product
          ? {
              about: {
                "@type": "SoftwareApplication",
                name: post.product.name,
                url: post.product.url,
                description: post.product.description,
                applicationCategory: "MultimediaApplication",
                operatingSystem: "Web",
              },
            }
          : {}),
        author: { "@id": publisher["@id"] },
        publisher: { "@id": publisher["@id"] },
        articleSection: post.category,
        inLanguage: "en",
        isAccessibleForFree: true,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${origin}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: `${origin}/blog/`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: origin + path,
          },
        ],
      },
    ],
    content: `<main id="main"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/blog/">Blog</a><span aria-hidden="true">/</span><span>AI image generation</span></nav>
<article><header class="article-header"><p class="eyebrow">${escapeHtml(post.category)}</p><h1>${escapeHtml(post.title)}</h1><p class="lede">${escapeHtml(post.summary)}</p>${meta(post)}${post.startLink ? callToAction(post.startLink) : ""}</header>
<figure class="article-cover-figure"><img class="article-cover" ${imageAttributes(post.cover, { eager: true })}><figcaption class="cover-caption">${escapeHtml(post.cover.caption)}</figcaption></figure>
<div class="article-layout"><aside class="toc" aria-label="On this page"><p>In this guide</p><ol>${post.sections.map((section) => `<li><a href="#${section.id}">${escapeHtml(section.title)}</a></li>`).join("")}<li><a href="#questions">Common questions</a></li></ol></aside>
<div class="article-body">${post.intro.map((p) => (typeof p === "string" ? `<p>${escapeHtml(p)}</p>` : renderBlock(p))).join("")}${post.disclosure ? `<p class="disclosure">${escapeHtml(post.disclosure)}</p>` : ""}${post.sections.map((section) => `<section id="${section.id}"><h2>${escapeHtml(section.title)}</h2>${section.blocks.map(renderBlock).join("")}</section>`).join("")}
<section id="questions" class="faq"><h2>Common questions</h2>${post.faqs.map((faq) => `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`).join("")}</section>
${post.endLink ? `<section class="gen-next"><h2>Try it with your own product.</h2><p>Bring your reference into Gen.new and build a visual direction you can keep refining.</p>${callToAction(post.endLink, true)}</section>` : ""}<p class="bottom-note">Build on what you’ve learned. <a href="/blog/">Browse the blog</a> or <a href="/">find your next topic</a>.</p></div></div></article></main>`,
  })
}

export async function buildBlog() {
  const source = join(webRoot, "blog")
  const files = (await readdir(join(source, "posts")))
    .filter((file) => file.endsWith(".json"))
    .sort()
  const posts = await Promise.all(
    files.map(async (file) =>
      validatePost(
        JSON.parse(await readFile(join(source, "posts", file), "utf8")),
      ),
    ),
  )
  posts.sort((a, b) => b.date.localeCompare(a.date))
  if (
    new Set(posts.map((post) => post.slug)).size !== posts.length ||
    !posts.length
  ) {
    throw new Error("Blog needs unique posts")
  }
  const css = await readFile(join(source, "blog.css"))
  const version = createHash("sha256").update(css).digest("hex").slice(0, 12)
  const output = join(webRoot, "public")
  const outputs = new Map([
    ["blog/index.html", renderIndex(posts, version)],
    ["blog/blog.css", css],
  ])
  const assets = (await readdir(join(source, "assets"))).filter((name) =>
    /^[a-z0-9-]+\.(webp|png|jpe?g)$/.test(name),
  )
  await Promise.all(
    assets.map(async (name) =>
      outputs.set(`blog/${name}`, await readFile(join(source, "assets", name))),
    ),
  )
  for (const post of posts) {
    const images = [
      post.cover,
      post.socialImage,
      ...post.sections.flatMap((section) =>
        section.blocks.filter((block) => block.type === "image"),
      ),
    ]
    for (const image of images) {
      const paths = [
        image.src,
        ...(image.srcset ?? "")
          .split(",")
          .filter(Boolean)
          .map((value) => value.trim().split(" ")[0]),
      ]
      for (const path of paths) {
        if (!outputs.has(path.slice(1))) {
          throw new Error(`Missing screenshot asset: ${path}`)
        }
      }
    }
  }
  posts.forEach((post) =>
    outputs.set(`blog/${post.slug}/index.html`, renderPost(post, version)),
  )
  const urls = [
    { path: "/" },
    { path: "/blog/" },
    ...posts.map((post) => ({
      path: postPath(post),
      date: post.date,
      images: [
        post.cover,
        ...post.sections.flatMap((section) =>
          section.blocks.filter((block) => block.type === "image"),
        ),
      ],
    })),
  ]
  outputs.set(
    "blog-sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urls.map((url) => `<url><loc>${origin}${url.path}</loc>${url.date ? `<lastmod>${url.date}</lastmod>` : ""}${(url.images ?? []).map((image) => `<image:image><image:loc>${origin}${escapeHtml(image.src)}</image:loc></image:image>`).join("")}</url>`).join("")}</urlset>\n`,
  )
  outputs.set(
    "sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${origin}/blog-sitemap.xml</loc></sitemap></sitemapindex>\n`,
  )
  outputs.set(
    "robots.txt",
    `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
  )
  outputs.set(
    "blog/feed.xml",
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Learn Anything Blog</title><link>${origin}/blog/</link><description>Practical learning guides and creative projects.</description><language>en</language><atom:link href="${origin}/blog/feed.xml" rel="self" type="application/rss+xml"/>${posts.map((post) => `<item><title>${escapeHtml(post.title)}</title><link>${origin}${postPath(post)}</link><guid isPermaLink="true">${origin}${postPath(post)}</guid><pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate><description>${escapeHtml(post.description)}</description></item>`).join("")}</channel></rss>\n`,
  )
  await Promise.all(
    [...outputs].map(async ([path, content]) => {
      await mkdir(dirname(join(output, path)), { recursive: true })
      await writeFile(join(output, path), content)
    }),
  )
  return { posts, paths: [...outputs.keys()] }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const { posts, paths } = await buildBlog()
  console.log(
    `Built ${posts.length} article(s) and ${paths.length} public blog files.`,
  )
}
