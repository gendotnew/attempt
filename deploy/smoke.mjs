import assert from "node:assert/strict"

const base = new URL(process.argv[2] || "http://127.0.0.1:8811")
const cases = [
	["/", 200, "I want to learn"],
	["/search", 200, "Learn Anything"],
	["/javascript", 200, "Learn Anything"],
	["/blog/", 200, "Gen.new"],
	["/blog/learn-ai-image-generation/", 200, "AI product photography with Gen.new"],
	["/robots.txt", 200, "Sitemap:"],
	["/sitemap.xml", 200, "<sitemapindex"],
	["/blog-sitemap.xml", 200, "<urlset"],
	["/blog/feed.xml", 200, "<rss"],
	["/blog/no-such-article/", 404],
	["/no-such-topic-404-check", 404],
	["/_server", 404],
	["/_server/retired", 404],
	["/api/search-stream", 404]
]

for (const [path, status, content] of cases) {
	const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(15000) })
	const body = await response.text()
	assert.equal(response.status, status, path)
	if (content) assert.ok(body.includes(content), `${path}: expected content`)
	assert.ok(!response.headers.has("set-cookie"), `${path}: no account session`)
	if (status === 200) assert.ok(!/clerk|sign in to continue/i.test(body), `${path}: no Clerk gate`)
	console.log(`${status} ${path}`)
}

for (const path of ["/sign-in", "/sign-up", "/profile", "/links", "/pages", "/topics", "/community/example"]) {
	const response = await fetch(new URL(path, base), { redirect: "manual" })
	assert.ok([301, 302, 307, 308].includes(response.status), `${path}: retired route must redirect`)
	assert.equal(new URL(response.headers.get("location"), base).pathname, "/")
}

const post = await fetch(new URL("/", base), { method: "POST", body: "read-only-check" })
assert.ok([403, 405].includes(post.status), "Public app must reject mutations")
console.log("PASS: public pages, discovery, 404s, retired routes and mutation boundaries")
