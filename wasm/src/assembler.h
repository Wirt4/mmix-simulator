#ifndef ASSEMBLER_H
#define ASSEMBLER_H

#include <stddef.h>
#include <stdint.h>
/*
 * Returns a pointer to preallocated block of memory of size (HEAP_SIZE)
 * A compiled wasm object can't take strings as function arguments
 * */
unsigned char * source_code_buffer(void);

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

/** Returns a pointer to the listing buffer populated by a successful assembly. */
unsigned char* listing_buffer(void);

/** Returns the size in bytes of the last listing, or (size_t)-1 if no assembly has run. */
size_t listing_size(void);

/*
 * Address map entry layout: three packed uint32_t fields
 * (source_line, address_high, address_low), one entry per source line that
 * emitted code, in assembly order.
 */
#define ADDRESS_MAP_ENTRY_SIZE (3 * sizeof(uint32_t))

/** Returns a pointer to the address map buffer populated by a successful assembly. */
unsigned char* address_map_buffer(void);

/** Returns the size in bytes of the last address map, or (size_t)-1 if no assembly has run. */
size_t address_map_size(void);

/**
 * Returns 1 if the last assembly emitted more line/address pairs than the
 * buffer holds (MAX_SRC_SIZE / ADDRESS_MAP_ENTRY_SIZE entries); capture stops
 * at the limit and later lines are unmapped.
 */
int address_map_saturated(void);
#endif
