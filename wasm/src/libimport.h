/* libimport.h — embedder-supplied functions imported by the mmixal change file */

/* Consumer for the MMIXAL_LINE_LOC hook (see libconfig.h); defined in assembler.c.
   Records the (source line, address) pair for each source line that emits code. */
extern void add_line_loc(int file_no, int line_no, octa loc);
