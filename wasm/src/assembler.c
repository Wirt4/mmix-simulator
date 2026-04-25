#include "assembler.h"
#include <stdio.h>
/*
 * Returns a pointer to preallocated block of memory of size (HEAP_SIZE)
 * A compiled wasm object can't take strings as function arguments
 * */
unsigned char * get_source_code_pointer(void){
	return NULL;
}

/**
 * Calls the mmixal assemble function and returns the name of the created .mmo file if successful, null if error
 * preconditions: source has been written to heap, length is less than HEAP_SIZE
 * postconditions:
 * if assembly is successful:
 * - the listing
 * - an .mmo file has been created 
 * - the function returns the filename
 * is assembly is unsuccessful, 
 * - the sterr printed by the mmixal function has been redirected to the stderr heap (see io_redirect.h)
*/
char* assemble(size_t length){
	printf("the argument is %ui\n", (unsigned int)length);
	return NULL;
}
