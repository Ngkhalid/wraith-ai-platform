"""Deterministic virtual-shell responses with no host execution capability."""

from __future__ import annotations


EXACT_RESPONSES = {
    "help": "Available demo commands: help, pwd, whoami, id, ls, uname, hostname, history",
    "pwd": "/home/demo",
    "whoami": "demo",
    "id": "uid=1001(demo) gid=1001(demo) groups=1001(demo)",
    "ls": "documents  logs  notes.txt  readme.txt",
    "ls -la": "drwxr-xr-x demo demo .\ndrwxr-xr-x root root ..\n-rw-r--r-- demo demo readme.txt",
    "uname": "Linux",
    "uname -a": "Linux demo-host 6.1.0-sim #1 SMP x86_64 GNU/Linux",
    "hostname": "demo-host",
    "cat /etc/hostname": "demo-host",
    "history": "1  help\n2  pwd\n3  whoami\n4  ls -la",
}


def simulate_shell(command: str) -> tuple[str, int]:
    """Return a fixed response; the supplied text is never run anywhere."""

    normalized = " ".join(command.strip().split())
    lowered = normalized.lower()
    if lowered in EXACT_RESPONSES:
        return EXACT_RESPONSES[lowered], 0
    if lowered.startswith(("curl ", "wget ", "ftp ", "scp ", "ssh ")):
        return "network access is disabled in this deterministic simulator", 126
    if lowered.startswith(("cat ", "head ", "tail ", "find ", "grep ")):
        return "virtual file is not present in the synthetic filesystem", 1
    if lowered.startswith(("python ", "python3 ", "bash ", "sh ", "powershell ")):
        return "interpreters are unavailable in this simulation", 126
    return f"sh: {normalized.split(' ', 1)[0]}: command not found", 127

