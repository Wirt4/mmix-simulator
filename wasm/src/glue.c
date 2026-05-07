#include <string.h>
#include "glue.h"
#include "simulator.h"
#include "constants.h"
#include "io_utils.h"
#include "assembler.h"
#include "assert.h"

static struct HeapRef stderr_ref;
static struct HeapRef stdout_ref;
static char mmo[FILE_NAME_SIZE];
static int initialized = 0;

size_t get_stderr_size(void){
	return stderr_ref.size;
}

unsigned char* get_stdout_pointer(void){
	ASSERT(get_stdout_heap() != NULL);
	return get_stdout_heap();
}

unsigned char* get_stderr_pointer(void){
	ASSERT(get_stdout_heap() != NULL);
	return get_stderr_heap();
}

int assemble_mmixal(size_t len){
	if (!ASSERT(len != 0 && len < (size_t)MAX_SRC_SIZE)) {
		return -1;
	};

	struct Redirect err_redirect = redirect_stderr();
	int result = assemble_source(len);
	stderr_ref = restore_stderr(err_redirect);

	if (result == 0){
		const char *mmo_path = get_mmo_path();
		if (file_exists(mmo_path)){
			strcopy_and_trim(mmo, mmo_path, FILE_NAME_SIZE - 1);
		}
	}

	return result;
}

size_t get_stdout_size(void){
	return stdout_ref.size;
}

int mmix_perform_instructions(unsigned int instructions){
	// check if code is assembled
	// check if sim initialized
	if (!ASSERT(initialized)){
		return -1;
	}
	// if instructions == 0, do nothing
	if (instructions == 0 ){
		return 0;
	}
	// redirect stdout and stderr
	struct Redirect stdErrRedirect = redirect_stderr();
	struct Redirect stdOutRedirect = redirect_stdout();
        // call execute_instructions 
	execute_instructions(instructions);
	// restore stdout and stderr
	stdout_ref = restore_stdout(stdOutRedirect);
	stderr_ref = restore_stderr(stdErrRedirect);
	// check restoration of streams
	if (!(ASSERT(stderr_ref.exit_code == 0) && ASSERT(stdout_ref.exit_code == 0))){
		return -1;
	}
	// return clean
	return 0;
}

int mmix_initialize_simulator(void){
	int init = initialize_simulator(mmo);
	ASSERT(init == 0);
	initialized = init == 0 ? 1: 0;
	return init;
}

int mmix_finalize_simulator(void){
	int fin = finalize_simulator();
	ASSERT(fin == 0);
	if (fin==0){
		initialized = 0;
	}
	return fin;
}

unsigned int get_register_data(int register_type, int index, int partition){
	if (register_type){
		return get_special_register_data(index, partition);
	}
	return get_general_register_data(index, partition);
}
