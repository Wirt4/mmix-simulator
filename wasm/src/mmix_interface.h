#ifndef MMIX_INTERFACE_H
#define MMIX_INTERFACE_H

/*
 * mmix_interface.h
 *
 * Declares the mmixlib functions that the glue code depends on.
 * CMock generates mocks from this header for unit testing.
 * Integration tests link against the real implementations from vendor/mmixlib.
 *
 * Note: mmixlib uses its own bool typedef (enum {false,true}). We avoid
 * redefining it here; glue code uses int for bool-valued returns instead.
 */

typedef unsigned int tetra;
typedef struct { tetra h, l; } octa;

/* Library lifecycle */
int mmix_lib_initialize(void);
int mmix_lib_finalize(void);
int mmix_initialize(void);
int mmix_finalize(void);
void mmix_boot(void);

/* Program loading */
int mmix_load_file(char *mmo_file_name);
int mmix_commandline(int argc, char *argv[]);

/* Instruction execution */
int mmix_fetch_instruction(void);
int mmix_perform_instruction(void);
int mmix_resume(void);

/* Debugging */
void mmix_interact(void);
int mmix_dynamic_trap(void);
void mmix_trace(void);
void mmix_profile(void);
void show_stats(int verbose);

/* Assembler */
int mmixal(char *mms_name, char *mmo_name, char *mml_name);

/* State inspection */
extern int halted;
extern int interrupt;
extern int resuming;
extern octa inst_ptr;
extern tetra inst;
extern octa g[256];
extern octa *l;
extern int G, L, O;

#endif /* MMIX_INTERFACE_H */
