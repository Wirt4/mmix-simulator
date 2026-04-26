#ifndef MMIXLIB_WRAPPER_H
#define MMIXLIB_WRAPPER_H
// mirror of mmixlib so can effectively unit test
#include "mmixlib.h"

/* returns zero on success, 
           negative values on fatal errors, 
		   otherwise the number of errors found in the input
*/
int mmixal_w(char *mms_name, char *mmo_name, char *mml_name);

void mmix_lib_initialize_w(void);

void mmix_initialize_w(void);

void mmix_boot_w(void);

void mmix_load_file_w(char *mmo_file_name);

void mmix_fetch_instruction_w(void);

void mmix_perform_instruction_w(void);

void mmix_dynamic_trap_w(void);

mmix_opcode get_op(void);
// 1 if sim is halted, 0 if not
int get_halted(void);
//returns 1 for true, 0 for false
int get_resuming(void);
// value is 1 for true, 0 for false
void set_resuming(int value);
#endif
