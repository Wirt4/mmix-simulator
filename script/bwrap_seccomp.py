#!/usr/bin/env python3
"""
bwrap_seccomp.py — Run a command inside a bwrap sandbox, optionally with a
seccomp whitelist filter.

Usage:
    bwrap-seccomp [-a|--assemble | -e|--execute] <command> [args...]

Example:
    bwrap-seccomp -a mmixal hello.mms
    bwrap-seccomp -e mmix hello.mmo

The script:
  1. Builds a seccomp whitelist of syscalls that mmixal/mmix require (x86_64 only).
  2. Exports the compiled BPF to a pipe.
  3. Execs bwrap with --seccomp pointing at that pipe, plus namespace and
     filesystem isolation.

On arm64/aarch64 the Debian python3-seccomp package generates broken BPF
filters, so seccomp is skipped. Bwrap's namespace isolation and resource
limits still apply.
"""

import fcntl
import os
import platform
import sys

# ── Architecture detection ───────────────────────────────────────────
# The Debian python3-seccomp package produces invalid BPF on aarch64.
# Only enable seccomp on x86_64 where it has been tested.
_arch = platform.machine()
SECCOMP_SUPPORTED = _arch in ("x86_64", "amd64")

if SECCOMP_SUPPORTED:
    import errno
    import seccomp

# ── Syscall whitelist (x86_64 only) ─────────────────────────────────

BASE_ALLOWED = [
    # process
    "execve",
    "exit_group",
    # memory
    "brk",
    "mmap",
    "munmap",
    "mprotect",
    # file I/O
    "openat",
    "read",
    "write",
    "close",
    "fstat",
    "newfstatat",
    "faccessat",
    # runtime internals (x86_64 dynamic linker and glibc)
    "arch_prctl",
    "set_tid_address",
    "set_robust_list",
    "getrandom",
    "futex",
]

COMPILE_ALLOWED = ["openat", "prlimit64", "rseq"]

EXECUTE_ALLOWED = ["prlimit64", "rseq", "rt_sigaction", "lseek", "dup3"]


def build_filter(to_compile=False, to_execute=False, verbose=False):
    """Build a seccomp filter that allows only the listed syscalls."""
    if verbose:
        f = seccomp.SyscallFilter(seccomp.ERRNO(errno.EPERM))
    else:
        f = seccomp.SyscallFilter(seccomp.KILL)

    for name in BASE_ALLOWED:
        try:
            f.add_rule(seccomp.ALLOW, name)
        except Exception:
            pass

    if to_compile:
        for name in COMPILE_ALLOWED:
            try:
                f.add_rule(seccomp.ALLOW, name)
            except Exception:
                pass

    if to_execute:
        for name in EXECUTE_ALLOWED:
            try:
                f.add_rule(seccomp.ALLOW, name)
            except Exception:
                pass

    return f


def main():
    args = sys.argv[1:]

    if not args:
        print(
            f"Usage: {sys.argv[0]} [-a|--assemble | -e|--execute] <command> [args...]",
            file=sys.stderr,
        )
        sys.exit(1)

    to_compile = False
    to_execute = False
    debug = False

    while args and args[0].startswith("-"):
        flag = args.pop(0)

        if flag in ("-a", "--assemble"):
            to_compile = True
        elif flag in ("-e", "--execute"):
            to_execute = True
        elif flag in ("-d", "--debug"):
            debug = True
        else:
            print(f"Unknown flag: {flag}", file=sys.stderr)
            sys.exit(1)

    if to_compile and to_execute:
        print(
            "Error: -a/--assemble and -e/--execute are mutually exclusive",
            file=sys.stderr,
        )
        sys.exit(1)

    command = args

    # Build bwrap arguments.
    bwrap_args = [
        "bwrap",
        "--unshare-user",
        "--unshare-ipc",
        "--unshare-uts",
        "--unshare-cgroup",
        "--unshare-net",
        # Filesystem (read-only system, writable sandbox)
        "--ro-bind", "/usr", "/usr",
        "--ro-bind", "/lib", "/lib",
        "--ro-bind", "/bin", "/bin",
        "--symlink", "usr/lib64", "/lib64",
        "--ro-bind", "/proc", "/proc",
        "--dev", "/dev",
        "--tmpfs", "/tmp",
        # Writable working directory
        "--bind", os.getcwd(), "/sandbox",
        "--chdir", "/sandbox",
        "--new-session",
        "--die-with-parent",
    ]

    # Attach seccomp filter on supported architectures.
    if SECCOMP_SUPPORTED:
        filt = build_filter(to_compile, to_execute, debug)
        r, w = os.pipe()
        w_file = os.fdopen(w, "wb")
        filt.export_bpf(w_file)
        w_file.close()
        fcntl.fcntl(r, fcntl.F_SETFD, 0)
        bwrap_args += ["--seccomp", str(r)]

    bwrap_args += ["--"] + command

    # Apply resource limits via prlimit.
    bwrap_args = [
        "prlimit",
        f"--as={75 * 1024 * 1024}",   # 75 MB RAM (address space)
        f"--fsize={128 * 1024 * 1024}",  # 128 MB max file size (disk)
    ] + bwrap_args

    os.execvp(bwrap_args[0], bwrap_args)


if __name__ == "__main__":
    main()
