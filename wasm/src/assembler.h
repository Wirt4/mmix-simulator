#ifndef ASSEMBLER_H
#define ASSEMBLER_H

#include <stddef.h>
/*
 * Returns a pointer to preallocated block of memory of size (HEAP_SIZE)
 * A compiled wasm object can't take strings as function arguments
 * */
unsigned char * get_source_code_pointer(void);

/**
 * Assembles MMIXAL source code.
 * Returns: 0 on success, positive = error count, negative = fatal error.
 * On success, the .mmo file path is available via get_mmo_path().
 * listing_name: if non-NULL, mmixal writes listing to this file.
 */
int assemble_source(size_t length);

/**
 * Returns the path of the last assembled .mmo file.
 */
const char* get_mmo_path(void);
#endif
