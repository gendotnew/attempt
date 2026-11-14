# Learn Anything web

The site is public. Visitors can explore the topic graph, search learning topics,
read public resource guides and browse the blog without an account. Historical
personal-workspace routes redirect home and are excluded from the published
router. No account data is made public.

Install the locked dependencies from the repository root with Bun 1.1.34:

```sh
bun install --frozen-lockfile --ignore-scripts
bun run --cwd web dev
```

The existing public Jazz group and peer have defaults in the application. If you
need a different public dataset, optionally set these **public build values** in
`web/.env.local`:

```dotenv
VITE_JAZZ_PEER_URL=wss://your-public-jazz-peer
VITE_JAZZ_GLOBAL_GROUP_ID=your-public-group-id
```

Clerk and Ronin credentials are not needed or used. Do not add secrets to a
`VITE_` variable; those values are embedded in browser JavaScript.

Production runs as a standalone Node server on Lithuania. See
[the deployment guide](../deploy/README.md). The blog has its own
[content and screenshot guide](blog/README.md).
