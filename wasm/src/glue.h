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

/*
 * compiles string held in `input_buffer` to machine code results readable from `binary_result`
 * input: size_t len, the length of the mmixal code that has been loaded to the heap
 * preconditions: string-formatted mmixal code is previously stored on the heap
 * postconditions: `get_binary_result_pointer` will return a pointer to the compiled binary
 * `get_binary_result_size` will return the size in bytes of the result
 * `get_listing_pointer` will return a pointer to the string-formatted listing output and 
 * `get_listing_pointer_size` will return the length of the listing 
 */
int assemble_mmixal(size_t len);

/**
 * returns a pointer to to the block of memory containing the machine code to be run on the mmix_sim
 */
unsigned char* get_binary_pointer(void);

/**
 * returns the size in bytes of the allocated block containing the binary result
 */
size_t get_binary_size(void);

size_t get_stderr_size(void);
/**
 * returns a pointer to the start of the information mmix writes to stdout
 * The actual stdout and std error of the application is for developer use.
 * The heap reads and writes are for the virutalized mmix machine.
 * */
unsigned char* get_stdout_pointer(void);

unsigned char* get_source_code_pointer(void);
/**
 * returns size in bytes of material printed to stdout
 */
size_t get_stdout_size(void);

unsigned char* get_stderr_pointer(void);

/*
 * executes the compiled .mmo binary currently on the heap
 * input: size_t executable_size, the size in bytes of the .mmo binary
 * preconditions: compiled .mmo binary is stored on the heap at heap_start;
 *   executable_size is non-zero and within bounds of the allocated heap
 * postconditions: no temporary files remain on disk;
 *   program output is written to stdout/stderr
 * returns: 0 on success, non-zero on failure
 */
int mmix_simulate(size_t executable_size);

#endif /*GLUE_H */
