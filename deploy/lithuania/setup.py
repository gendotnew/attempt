#!/usr/bin/env python3
"""Install only the verified Learn Anything runtime; do not manage shared nginx here."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tarfile

ROOT = Path("/opt/learn-anything")
assert os.geteuid() == 0 and Path.cwd() == ROOT
archive = ROOT / "runtime.tar.gz"
release = json.loads((ROOT / "release.json").read_text())
assert hashlib.sha256(archive.read_bytes()).hexdigest() == release["sha256"]
node = Path("/opt/gen-runtime/node-v24.22.1-linux-x64/bin/node")
assert node.is_file(), "Reviewed Node runtime is missing"

with tarfile.open(archive, "r:gz") as bundle:
    members = bundle.getmembers()
    for member in members:
        path = Path(member.name)
        assert not path.is_absolute() and ".." not in path.parts
        assert path.parts and path.parts[0] == "app"
        assert member.isdir() or member.isfile(), "Only regular files/directories are allowed"
    expanded = sum(member.size for member in members)
    # Keep the shared host reserve, including extraction and a rollback generation.
    assert shutil.disk_usage(ROOT).free > 25 * 1024**3 + expanded * 2 + 10 * 1024**2
    destination = ROOT / "releases" / release["sha256"][:20]
    if not destination.exists():
        temporary = destination.with_suffix(".staging")
        assert not temporary.exists(), "Inspect an unfinished staging directory before retrying"
        temporary.mkdir(parents=True)
        for member in members:
            member.mode = 0o755 if member.isdir() else 0o644
            member.uid = member.gid = 0
            member.uname = member.gname = "root"
        bundle.extractall(temporary, members=members)
        (temporary / "app").rename(destination)
        temporary.rmdir()

if subprocess.run(["id", "learn-anything"], capture_output=True).returncode:
    subprocess.run(["useradd", "--system", "--no-create-home", "--shell", "/usr/sbin/nologin", "learn-anything"], check=True)

dropin = Path("/etc/systemd/system/learn-anything.service.d")
dropin.mkdir(parents=True, exist_ok=True)
(dropin / "sandbox.conf").write_text("""[Unit]
StartLimitIntervalSec=60
StartLimitBurst=5

[Service]
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
RestrictRealtime=true
RestrictNamespaces=true
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6
LockPersonality=true
UMask=0077
MemoryHigh=256M
MemoryMax=384M
MemorySwapMax=0
CPUQuota=150%
TasksMax=80
""")

environment = ROOT / ".env.runtime"
environment.chmod(0o600)
current = ROOT / "current"
if current.is_symlink():
    (ROOT / "previous").write_text(os.readlink(current) + "\n")
next_link = ROOT / "current.next"
assert not next_link.exists() and not next_link.is_symlink()
next_link.symlink_to(destination)
next_link.replace(current)
print("Prepared Learn Anything runtime", destination.name)
