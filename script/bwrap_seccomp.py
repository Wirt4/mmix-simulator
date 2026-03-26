#!/usr/bin/env python3
"""
bwrap_seccomp.py — Generate a seccomp whitelist filter and run a command
inside a bwrap sandbox with it applied.

Requirements:
    pip install seccomp

Usage:
    python3 bwrap_seccomp.py <command> [args...]

Example:
    python3 bwrap_seccomp.py mmix jailbreak.mmo

The script:
  1. Builds a seccomp whitelist of simple syscalls that mmixal and mmix require. Everything else is killed.
  2. Exports the compiled BPF to a pipe.
  3. Execs bwrap with --seccomp pointing at that pipe, plus sensible
     default sandbox flags.

To discover which syscalls YOUR program needs, run it under strace first:
    strace -f -o trace.log <command>
    awk -F'(' '{print $1}' trace.log | sort -u

Then add any missing syscalls to the ALLOWED list below.
"""

import errno
import fcntl
import os
import sys

import seccomp

# ── Syscall whitelist ────────────────────────────────────────────────
# This covers most simple C/C++ programs. If your program crashes with
# "Bad system call" (SIGSYS), strace it and add the missing syscall here.

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
    "faccessat",
    # runtime internals
    "set_tid_address",
    "set_robust_list",
    "getrandom",
]

COMPILE_ALLOWED = ["openat", "prlimit64", "rseq"]

EXECUTE_ALLOWED = ["prlimit64", "rseq", "rt_sigaction"]


def build_filter(to_compile=False, to_execute=False, verbose=False):
    """Build a seccomp filter that allows only the listed syscalls."""
    # Default action: kill the process on any disallowed syscall.
    # Use ERRNO(EPERM) instead of KILL during debugging if you prefer
    # a non-fatal "Operation not permitted" error.
    if verbose:
        f = seccomp.SyscallFilter(seccomp.ERRNO(errno.EPERM))
    else:
        f = seccomp.SyscallFilter(seccomp.KILL)

    for name in BASE_ALLOWED:
        try:
            f.add_rule(seccomp.ALLOW, name)
        except Exception:
            # Syscall may not exist on this architecture — skip silently.
            pass

    if to_compile:
        for name in COMPILE_ALLOWED:
            try:
                f.add_rule(seccomp.ALLOW, name)
            except Exception:
                # Syscall may not exist on this architecture — skip silently.
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

    # Handle flag logic below
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
    filt = build_filter(to_compile, to_execute, debug)
    # Create a pipe. The read end (r) is what bwrap will consume.
    r, w = os.pipe()
    w_file = os.fdopen(w, "wb")
    filt.export_bpf(w_file)
    w_file.close()

    # Build the bwrap command.
    # Adjust these flags to match your needs. This is a reasonable
    # default for running a simple untrusted binary.
    bwrap_args = [
        "bwrap",
        # Isolation — avoid --unshare-pid because mounting /proc in a new
        # PID namespace fails inside containers ("Can't mount proc").
        "--unshare-user",
        "--unshare-ipc",
        "--unshare-uts",
        "--unshare-cgroup",
        "--unshare-net",
        # prevent user from creating namespace
        # "--disable-userns",
        # Filesystem (read-only system, writable sandbox)
        "--ro-bind",
        "/usr",
        "/usr",
        "--ro-bind",
        "/lib",
        "/lib",
        "--ro-bind",
        "/bin",
        "/bin",
        "--symlink",
        "usr/lib64",
        "/lib64",
        "--ro-bind",
        "/proc",
        "/proc",
        "--dev",
        "/dev",
        "--tmpfs",
        "/tmp",
        # Writable working directory
        "--bind",
        os.getcwd(),
        "/sandbox",
        "--chdir",
        "/sandbox",
        # Security
        "--seccomp",
        str(r),  # the pipe FD with our BPF filter
        "--new-session",  # block terminal injection (TIOCSTI)
        "--die-with-parent",  # kill sandbox if parent dies
        "--",
    ] + command

    # Apply resource limits via prlimit (works with any bubblewrap version).
    bwrap_args = [
        "prlimit",
        f"--as={75 * 1024 * 1024}",   # 75 MB RAM (address space)
        f"--fsize={128 * 1024 * 1024}",  # 128 MB max file size (disk)
    ] + bwrap_args

    # Clear close-on-exec so bwrap inherits the read end of the pipe.
    fcntl.fcntl(r, fcntl.F_SETFD, 0)

    os.execvp(bwrap_args[0], bwrap_args)


if __name__ == "__main__":
    main()
