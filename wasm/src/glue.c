#include "glue.h"
#include "mmix_interface.h"
#include <stdint.h>

/*
 * allocates memory for the string buffer
 * inputs: integer
 * outputs: pointer to the memory
 */
uint8_t* allocate_input_buffer(int size){
	return 0;
} 

/*
 * frees memory pointed to by p
 * inputs: uint_t pointer p
 * outpus: void
 */
void free_input_buffer(char* p){}

/*
 * compiles string held in `input_buffer` to machine code results accessable from `binary_result`
 * preconditions: string mmixal code is previously set via `allocate_input_buffer`
 * postconditions: `get_binary_result_pointer` will return a pointer to the compiled binary and 
 * `get_binary_result_size` will return the size in bytes of the result 
 */
void assemble_mmixal(){}

/**
 * returns a pointer to to the block of memory containing the machine code to be run on the mmix_sim
 */
int get_binary_result_pointer(){
	return -1;
}

/**
 * returns the size in bytes of the allocated block containing the binary result
 */
int get_binary_result_size(){
	return -1;
}

/**
 * de-allocates the memory pointed to by the argument p
 */
void free_binary_result(unsigned char* p){}
