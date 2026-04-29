#include <stdio.h>
#include <stdint.h>
#include <time.h>
#include <string.h>
#include <unistd.h>
#include "assembler.h"
#include "constants.h"
#include "mmixlib_wrapper.h"
#include "io_utils.h"
#include "assert.h"

//HIDDEN INFORMATION
static unsigned char g_source_code_pointer[MAX_SRC_SIZE];
static char g_mmo[FILE_NAME_SIZE] = "program.mmo";
static char g_mms[FILE_NAME_SIZE] = "program.mms";

static int setup_assembly(size_t src_len){
	if (!ASSERT(src_len <= (size_t)(MAX_SRC_SIZE))){
		return -1;
	}
	int written = write_from_heap(get_source_code_pointer(), src_len, g_mms);
	if (!ASSERT(written == 0)){
		return -1;
	}
	return 0;
}

static int teardown_assembly(void){
	if (file_exists(g_mms)){
		return remove_file(g_mms);
	}
	return 0;
}

unsigned char * get_source_code_pointer(void){
	return g_source_code_pointer;
}

const char* get_mmo_path(void){
	return g_mmo;
}

int assemble_source(size_t length){
	int assembly_setup =  setup_assembly(length);
	if (!ASSERT (assembly_setup == 0)){
		return -1;
	}
	// call the library function to assemble mmixal
	int result = mmixal_w(g_mms, g_mmo, NULL);
	int teardown = teardown_assembly();
	if (!ASSERT(teardown == 0)){
		return -1;
	}
	return result;
}
