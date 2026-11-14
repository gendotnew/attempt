#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# The historical dependency versions remain locked; the server requires no Bun.
npm exec --yes --package=bun@1.1.34 -- bun install --frozen-lockfile --ignore-scripts
npm exec --yes --package=bun@1.1.34 -- bun run --cwd web build
node --test web/scripts/blog.test.mjs
python3 - <<'PY'
import hashlib, json, pathlib, subprocess, tarfile
root = pathlib.Path.cwd()
output = root / 'web/.output'
assert (output / 'server/index.mjs').is_file()
assert json.loads((output / 'nitro.json').read_text())['preset'] == 'node-server'
assert not list(output.rglob('*.node')), 'Build native modules for Linux before packaging'
assert '_protected' not in (root/'web/app/routeTree.gen.ts').read_text(), 'Private routes must be excluded'
functions = json.loads((root/'web/.vinxi/build/server/_server/.vite/manifest.json').read_text())
assert len(functions) == 1 and 'virtual:$vinxi/handler/server' in functions, 'Public site must have no RPC functions'
public = '\n'.join(p.read_text() for p in (output/'public').rglob('*.js'))
assert 'clerk' not in public.lower(), 'Remove obsolete Clerk build environment variables'
target = root/'deploy/lithuania'
archive = target/'runtime.tar.gz'
with tarfile.open(archive, 'w:gz', dereference=True) as bundle:
    bundle.add(output, arcname='app')
release = {'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
           'sourceCommit': subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),
           'runtimeBytes': sum(p.stat().st_size for p in output.rglob('*') if p.is_file())}
(target/'release.json').write_text(json.dumps(release, indent=2)+'\n')
(target/'site.env').write_text('NODE_ENV=production\nHOST=127.0.0.1\nPORT=8810\n')
(target/'site.env').chmod(0o600)
print(json.dumps(release, indent=2))
PY
