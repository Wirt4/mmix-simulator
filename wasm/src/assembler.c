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
#define MMO "program.mmo"
#define MMS "program.mms"
#define LISTING "listing.txt"

static unsigned char g_source_code_pointer[MAX_SRC_SIZE];
static unsigned char g_listing_pointer[MAX_LISTING_SIZE];
static size_t g_listing_size = (size_t)-1;

static int setup_assembly(size_t src_len){
	if (!ASSERT(src_len <= (size_t)(MAX_SRC_SIZE))){
		return -1;
	}
	int written = write_from_heap(source_code_buffer(), src_len, MMS);
	if (!ASSERT(written == 0)){
		return -1;
	}
	return 0;
}

static int teardown_assembly(void){
	if (ASSERT(file_exists(MMS))){
		int removed = remove_file(MMS);
		ASSERT(removed ==0 );
		return removed;
	}
	return 0;
}
//PUBLIC INFORMATION
unsigned char * source_code_buffer(void){
	ASSERT(g_source_code_pointer!= NULL);
	return g_source_code_pointer;
}

const char* get_mmo_path(void){
	return MMO;
}

int assemble_source(size_t length){
	if (!(ASSERT(length > 0) && ASSERT (length != (size_t)-1))){
		return -1;
	}
	int assembly_setup =  setup_assembly(length);
	if (!ASSERT (assembly_setup == 0)){
		return -1;
	}
	int result = mmixal_w(MMS, MMO, LISTING);
	if (result == 0){
		g_listing_size = read_to_heap(LISTING, g_listing_pointer, (size_t)MAX_LISTING_SIZE);
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
