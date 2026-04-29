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

//TODO: remove argument from mmix_simulate
int mmix_simulate(void){
	int init = initialize_simulator(mmo);
	if (!ASSERT(init == 0)) {
		return -1;
	}

	struct Redirect err_redirect = redirect_stderr();
	struct Redirect std_redirect = redirect_stdout();
	while (!is_halted()){
		execute_instructions(CYCLES_PER_BATCH);
	}
	stdout_ref = restore_stdout(std_redirect);
	stderr_ref = restore_stderr(err_redirect);
	finalize_simulator();
	return 0;
}

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
			//THAT's the util point
			// strncpy(mmo, mmo_path, FILE_NAME_SIZE - 1);
			// mmo[FILE_NAME_SIZE - 1] = '\0';
			strcopy_and_trim(mmo, mmo_path, FILE_NAME_SIZE - 1);
		}
	}

	return result;
}

size_t get_stdout_size(void){
	return stdout_ref.size;
}
