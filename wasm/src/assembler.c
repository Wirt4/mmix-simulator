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
#define MAX_LISTING_SIZE MAX_SRC_SIZE
//HIDDEN INFORMATION
static unsigned char g_source_code_pointer[MAX_SRC_SIZE];
static unsigned char g_listing_pointer[MAX_LISTING_SIZE];
static char g_mmo[FILE_NAME_SIZE] = "program.mmo";
static char g_mms[FILE_NAME_SIZE] = "program.mms";
static char g_list[FILE_NAME_SIZE] = "listing.txt";
static size_t g_listing_size = (size_t)-1;

static int setup_assembly(size_t src_len){
	if (!ASSERT(src_len <= (size_t)(MAX_SRC_SIZE))){
		return -1;
	}
	int written = write_from_heap(source_code_buffer(), src_len, g_mms);
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

unsigned char * source_code_buffer(void){
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
	int result = mmixal_w(g_mms, g_mmo, g_list);
	if (result == 0){
		g_listing_size = read_to_heap(g_list, g_listing_pointer, (size_t)MAX_LISTING_SIZE);
	}else{
		//no success -> no listing to read
		g_listing_size = 0;
	}
	int teardown = teardown_assembly();
	if (!ASSERT(teardown == 0)){
		return -1;
	}
	return result;
}

size_t listing_size(void){
	ASSERT(g_listing_size != (size_t)-1);
	return g_listing_size;
}

unsigned char* listing_buffer(void){
	ASSERT(g_listing_pointer != NULL);
	return g_listing_pointer;
}
