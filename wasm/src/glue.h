#ifndef GLUE_H
#define GLUE_H
#include <stdint.h>
#include <stdio.h>
typedef struct{
    uintptr_t pointer;
    long long size;
}DataOutput;
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
unsigned char* get_binary_result_pointer(void);

/**
 * returns a pointer to the start of the pre-allocated block of memory for reads and writes
 */
unsigned char* get_heap_start_pointer(void);

/**
 * returns the size in bytes of the allocated block containing the binary result
 */
size_t get_binary_result_size(void);

/**
 * returns a pointer to the start of the listing output from the assembler
 */
unsigned char* get_listing_result_pointer(void);

/**
 * returns the size in bytes of the listing output from the assembler
 */
size_t get_listing_result_size(void);


#endif /*GLUE_H */
