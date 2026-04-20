Suppress duplicate global definitions in libmmixal.c.
These 5 variables are owned by libglobals.c (simulator side);
the assembler must reference them via extern when linked
into a single library.

@x l.1043
Char *buffer; /* raw input of the current line */
@y
extern Char *buffer; /* raw input of the current line */
@z

@x l.1074
int cur_file; /* index of the current file in |filename| */
@y
extern int cur_file; /* index of the current file in |filename| */
@z

@x l.1174
octa cur_loc; /* current location of assembled output */
@y
extern octa cur_loc; /* current location of assembled output */
@z

@x l.3242
FILE *src_file, *obj_file, *listing_file;
@y
extern FILE *src_file;
FILE *obj_file, *listing_file;
@z

@x l.3244
int buf_size; /* maximum number of characters per line of input */
@y
extern int buf_size; /* maximum number of characters per line of input */
@z
