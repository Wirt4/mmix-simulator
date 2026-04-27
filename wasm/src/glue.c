#include "glue.h"
#include "assembler.h"

/** See glue.h */
int mmix_simulate(size_t executable_size){
	(void)executable_size;
	return -1;
}

/** See glue.h */
size_t get_stderr_size(void){
	return (size_t)-1;
}

/** See glue.h */
unsigned char* get_stdout_pointer(void){
	return NULL;
}

/** See glue.h */
unsigned char* get_stderr_pointer(void){
	return NULL;
}

/** See glue.h */
int assemble_mmixal(size_t len){
	(void)len;
	return -1;
}

/** See glue.h */
size_t get_stdout_size(void){
	return (size_t)-1;
}

/** See glue.h */
unsigned char* get_binary_pointer(void){
	return NULL;
}

/** See glue.h */
size_t get_binary_size(void){
	return (size_t)-1;
}

/** See glue.h */
unsigned char* get_source_code_pointer(void){
	return NULL;
}
