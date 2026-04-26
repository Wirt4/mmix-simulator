#include "mmixlib_wrapper.h"
#include "mmixlib.h"
#include "libglobals.h"

int mmixal_w(char *mms_name, char *mmo_name, char *mml_name){
	return mmixal(mms_name, mmo_name, mml_name);
}

void mmix_lib_initialize_w(void){
	// lib function signature is int, but the implementation only returns zero
	// keeping functions wrapped to keep consistent level of abstraction
	mmix_lib_initialize();
}

void mmix_initialize_w(void){
	mmix_initialize();
}

void mmix_boot_w(void){
	mmix_boot();
}

void mmix_load_file_w(char* mmo_file_name){
	mmix_load_file(mmo_file_name);
}

mmix_opcode get_op(void){
	return op;
}

int get_halted(void){
	return halted ? 1: 0;
}

void mmix_dynamic_trap_w(void){
	mmix_dynamic_trap();
}

int get_resuming(void){
	return resuming ? 1 : 0;
}

void set_resuming(int value){
	resuming = value == 0? false: true;
}

void mmix_fetch_instruction_w(void){
	mmix_fetch_instruction();
}
