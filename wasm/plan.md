# Plan: Fix args clobbering source code buffer

## Problem
`get_args_pointer()` returns `get_source_code_pointer()` — same buffer.
Writing command-line args overwrites source code, so reassembly fails.

## Tasks
- [x] Read test and glue.c to understand the bug
- [x] Add separate args buffer in glue.c, update get_args_pointer and mmix_initialize_simulator
- [x] Run tests to verify fix — all 16 pass
