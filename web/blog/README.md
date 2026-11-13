# Learn Anything blog

Public, prebuilt HTML in the existing site's `web/public` directory. It uses no
Clerk or Jazz connections, tracking scripts, remote fonts, or client JavaScript.
The normal web `dev` and `build` commands regenerate it before running Vinxi.
Use ordinary anchors to enter/leave the blog so the app's topic catch-all does
not intercept navigation.

```sh
cd web
node scripts/build-blog.mjs
node --test scripts/blog.test.mjs
node scripts/preview-blog.mjs
```

The blog-only preview is at `http://127.0.0.1:5196/blog/`. Its root redirects to
the blog, so the Explore link does not preview the app. Existing topic links are
links into the full Learn Anything app and are unavailable in this isolated
preview.

## Editing and adding posts

Edit `posts/*.json`, then run the generator. Post slugs and section anchors must
be unique. Content supports paragraphs with inline links, lists, prompts,
screenshots, resource links, and a disclosure. The renderer escapes all text and permits only internal or HTTPS
links. Add original, relevant guides with concrete exercises; avoid duplicate
articles targeting tiny keyword variations. Do not invent product tests or
independent endorsements. The first guide discloses the shared ownership of Gen.
Dates should reflect actual publication or substantive updates.

`blog.css` and `assets/` are the source assets. The visuals are direct screenshots
of the live public Gen website, not reconstructed interfaces or generated
illustrations. `screenshots.json` records the source URL, capture time, method,
dimensions, and file sizes. The article identifies the Studio showcase as Gen's
existing public demo rather than a newly generated result. No paid API calls
were made to obtain these screenshots.

The cover and body screenshots use WebP with responsive width variants. The
social card uses a 1200×630 JPEG. To update them, capture the actual public site
with tracking blocked, avoid any private conversations or account data, resize
and compress the captures, then update provenance and the post's dimensions,
captions, and alt text. Keep layout and pixels faithful to the real product.
The generator validates local image paths and that every referenced variant is
present. Image URLs are included in the blog sitemap.

The article's title, description, opening paragraph, screenshots, and calls to
action explicitly identify Gen.new. Useful instructions remain in the page;
the links lead to the actual product and relevant product-photo workflow. The
canonical remains on Learn Anything because this is its original article.
BlogPosting `about` identifies Gen as the product discussed, without inventing
ratings, reviews, or test results. There are no site-wide Gen backlinks or hidden
links. Referral visits can be recognized by Gen's existing referring-host journey
tracking, subject to browser privacy controls.

Generated HTML/XML/CSS and optimized images are checked in so the new pages can also be reviewed
or served without the legacy application's dependencies. Commit regenerated
outputs together with content updates. The generator does not delete unrelated
files. When removing a post, remove its generated directory too and arrange an
appropriate redirect if it was previously published.

## Deployment and indexing

The blog generator does not push or deploy. The earlier repository investigation
found failed Vercel deployments and an older live commit. Confirm the owning
Vercel project, root directory, build logs, and existing environment before
releasing; do not replace the current application with the blog-only preview.

The Vinxi/Nitro public-assets directory must be served before the app catch-all.
Unknown `/blog/*` paths are rejected by the root route before authentication
instead of rendering a topic placeholder with a successful status.
After a real build, confirm the generated blog pages, cover, CSS, feed, robots,
and sitemaps are present in the provider's static output. Verify both `/blog`
and `/blog/` reach the index and both forms of the article URL reach the article.
The canonical URLs use trailing slashes. If the host does not resolve directory
indexes, configure scoped redirects/rewrites for these paths; do not add a
site-wide SPA fallback or alter existing topic URLs.

After deployment check anonymous HTML responses, metadata, BlogPosting and
BreadcrumbList JSON-LD, mobile layout, and link navigation. `/robots.txt` and
`/sitemap.xml` currently return the application's HTML on the live site; the
generated files replace those fallbacks with real text and XML. The sitemap
index includes the blog sitemap (which also lists the homepage). Add other
verified public-page sitemaps as the site is improved; it does not enumerate or
remove the existing topic URLs. Submit `/sitemap.xml` in the site's Search
Console and request indexing for the article. Indexing and ranking are not
guaranteed, and technical markup is not a substitute for useful content.
