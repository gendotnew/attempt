# Learn Anything on Lithuania

The web application and static blog run on the existing Lithuania host
`46.166.162.95`. The site is public: no Clerk, login, account creation, uploads,
private workspace routes or server mutations are published. Historical account
source is retained behind redirects and excluded from the router; this release
does not migrate or publish anyone's private data.

Public topic guides continue to read the existing Jazz service and public group.
They are not copied into a new database. The default connection values are public
and can optionally be overridden with `VITE_JAZZ_PEER_URL` and
`VITE_JAZZ_GLOBAL_GROUP_ID` when building. Never put a secret in a `VITE_` variable.

## Build and deploy

From the repository root, run `bash deploy/build-release.sh`. This installs the
locked historical dependencies with Bun 1.1.34, builds the `node-server` preset,
tests the blog and creates an ignored, checksummed runtime archive. Node 20.19+
is required for local tooling. No API credentials are needed.

Use the existing operator configuration and pinned Pigeons SSH host key:

```sh
ORBI_INFRA_PIGEONS_BIN="$HOME/.local/bin/pigeons" /path/to/infra/bin/orbi-infra plan deploy/lithuania --host lithuania
ORBI_INFRA_PIGEONS_BIN="$HOME/.local/bin/pigeons" /path/to/infra/bin/orbi-infra deploy deploy/lithuania --host lithuania --yes
```

Only deploy when the owner has requested it. The tool checks both existing host
deployment contracts. `public=false` means this site's shared nginx vhost is
managed separately, not that the website is private. Do not change another
project's units, vhosts, runtime, credentials or storage to make this deploy work.

The service is `learn-anything`, runs as its own system user on loopback port
8810 and uses the already installed, pinned Node 24 runtime. Code is root-owned
and read-only to the service, with a 384 MB memory limit and bounded restarts.
`/opt/learn-anything/current` points to an immutable checksummed generation.
`/opt/learn-anything/previous` records the prior target for rollback. Keep the
25 GiB shared-host free-space reserve; the setup refuses extraction below it.

The reviewed nginx file is `lithuania/learn-anything.nginx`. Install it only after
the origin is tested and a valid certificate for apex and www exists. Test the
complete shared nginx configuration before reloading it. The vhost serves blog,
image, RSS and sitemap files directly, redirects www to the apex, blocks the old
RPC/API endpoints and sends only public GET/HEAD app requests to Node.

TLS uses `/etc/letsencrypt/live/learn-anything.xyz/`. Initial migration may use
manual DNS validation while Vercel still serves the domain. After the cutover,
use `certbot reconfigure --cert-name learn-anything.xyz --webroot
-w /var/lib/learn-anything/acme --preferred-challenges http --deploy-hook 'nginx -t && systemctl reload nginx'
--non-interactive` and verify a dry-run renewal. This replaces the temporary DNS
validation with automatic HTTP renewal. Never disable TLS verification.

Cloudflare: apex A goes to `46.166.162.95`; www CNAME goes to
`learn-anything.xyz`, both proxied. Retain all unrelated subdomain and mail DNS.
Prior web DNS for rollback: apex A `76.76.21.21`, www CNAME
`cname.vercel-dns.com`, both proxied. Keep Vercel intact until the new origin is
verified. Purge the changed page URLs from Cloudflare after the switch.

Verify the homepage, topic search, multiple live topic guides, mobile navigation,
blog article, Gen links, XML/RSS, 404s, retired account redirects, blocked APIs,
origin certificate and public HTTPS. Public guides still depend on the existing
Jazz service. Do not claim the data backend has moved onto this server.
