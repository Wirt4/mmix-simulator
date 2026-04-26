#include "assembler.h"
#include <stdio.h>
#include <stdint.h>
#include <time.h>
#include <string.h>
#include <unistd.h>
#include "constants.h"
#include "mmixlib_wrapper.h"
#include "io_utils.h"


//HIDDEN INFORMATION
static unsigned char g_source_code_pointer[MAX_SRC_SIZE];
static char g_mmo[FILE_NAME_SIZE];
static char g_mms[FILE_NAME_SIZE];

static int create_filenames(void){
	time_t currentTime = time(NULL);
	int max_chars_written;
	if (currentTime == (time_t)(-1)){
		max_chars_written = sprintf(g_mmo, "program00.mmo");
		sprintf(g_mms, "program00.mms");
	}else{
		max_chars_written = sprintf(g_mmo, "program%ju.mmo", (uintmax_t)currentTime);
		sprintf(g_mms, "program%ju.mms", (uintmax_t)currentTime);
	}
	if (max_chars_written < FILE_NAME_SIZE){
		return 0;
	}
	return -1;
}

struct Filenames{
	char* mmo;
	char* mms;
	int exit_code;
};

static struct Filenames setup_assembly(size_t src_len){
	struct Filenames filenames;
	filenames.mmo = NULL;
	filenames.mms = NULL;
	filenames.exit_code = -1;
	if (src_len > MAX_SRC_SIZE){
		return filenames;
	}
	// create "program{timestamp}.mms" and "program.{timestamp}.mmo"
	int created= create_filenames();
	if (created!=0){
		perror(".mms and .mmo files not created");
		return filenames;
	}
	filenames.mmo = g_mmo;
	filenames.mms = g_mms;
	// use length to write from heap to {prefix}.mms
	int written = write_from_heap(get_source_code_pointer(), src_len, filenames.mms);
	if (written!= 0){
		perror("did not write source code to mms");
		return filenames;
	}
	// redirect stderr so user error messages are logged to buffer
	int redirect = redirect_stderr();
	if (redirect != 0){
		perror("did not redirect stderr");
		return filenames;
	}
	filenames.exit_code = 0;
	return filenames;
}

static int teardown_assembly(char* mms){
	int restore = restore_stderr();
	if (restore !=0){
		printf("ERROR: could not restore stderr from buffer to console");
		return -1;
	}
	if (file_exists(mms)){
		return remove_file(mms);	
	}
	return 0;
}

//PUBLIC EXPOSED FUNCTIONS
/*
 * Returns a pointer to preallocated block of memory of size (HEAP_SIZE)
 * A compiled wasm object can't take strings as function arguments
 * */
unsigned char * get_source_code_pointer(void){
	return g_source_code_pointer;
}

/**
 * Calls the mmixal assemble function and returns the name of the created .mmo file if successful, null if error
 * preconditions: source has been written to heap, length is less than HEAP_SIZE
 * postconditions:
 * if assembly is successful:
 * - the listing
 * - an .mmo file has been created 
 * - the function returns the filename
 * is assembly is unsuccessful, 
 * - the sterr printed by the mmixal function has been redirected to the stderr heap (see io_utils.h)
*/
char* assemble(size_t length){
	struct Filenames filenames = setup_assembly(length);
	if (filenames.exit_code != 0){
		perror("could not set up file redirects before assembly");
		return NULL;
	}
	// call the library function to assemble mmixal
	int result = mmixal_w(filenames.mms, filenames.mmo, NULL);
	int teardown = teardown_assembly(filenames.mms);
	if (teardown !=0){
		perror("could not restore state after assembly");
		return NULL;
	}
	// if result and  .mmo are valid, return the .mmo name 
	if (result == 0 && file_exists(filenames.mmo)){
		return filenames.mmo;
	}
	return NULL;
}
