#ifndef GLUE_H
#define GLUE_H
#include <stdint.h>
#include <stdio.h>
#include <time.h>
/*
 * glue.h
 *
 * Public API exported to WASM via Emscripten.
 */

/**
 * Compiles MMIXAL source code to .mmo binary.
 *
 * @param len  Length in bytes of the source code stored at get_source_code_pointer().
 * @pre  MMIXAL source code has been written to the buffer at get_source_code_pointer().
 * @post On success, get_binary_pointer()/get_binary_size() return the compiled binary;
 *       get_stdout_pointer()/get_stdout_size() return the assembler listing.
 *       On failure, get_stdout_pointer()/get_stdout_size() return assembler error output.
 * @return 0 on success, non-zero on failure.
 */
int assemble_mmixal(size_t len);

/**
 * Returns a pointer to the buffer containing the compiled .mmo binary.
 */
unsigned char* get_binary_pointer(void);

/**
 * Returns the size in bytes of the compiled .mmo binary.
 */
size_t get_binary_size(void);

/**
 * Returns the size in bytes of the simulator's stderr output.
 */
size_t get_stderr_size(void);

/**
 * Returns a pointer to the buffer containing the simulator's stdout output.
 *
 * After assemble_mmixal(), this holds the assembler listing.
 * After mmix_simulate(), this holds the simulated program's stdout.
 */
unsigned char* get_stdout_pointer(void);

/**
 * Returns a pointer to the input buffer for writing MMIXAL source code.
 */
unsigned char* get_source_code_pointer(void);

/**
 * Returns the size in bytes of the stdout output buffer.
 */
size_t get_stdout_size(void);

/**
 * Returns a pointer to the buffer containing the simulator's stderr output.
 */
unsigned char* get_stderr_pointer(void);

/**
 * Executes a compiled .mmo binary.
 *
 * @param executable_size  Size in bytes of the .mmo binary at get_binary_pointer().
 * @pre  A compiled .mmo binary has been written to the buffer at get_binary_pointer();
 *       executable_size is non-zero and within the allocated heap bounds.
 * @post get_stdout_pointer()/get_stdout_size() return the program's stdout;
 *       get_stderr_pointer()/get_stderr_size() return the program's stderr.
 *       No temporary files remain on disk.
 * @return 0 on success, non-zero on failure.
 */
int mmix_simulate(size_t executable_size);

#endif /*GLUE_H */
