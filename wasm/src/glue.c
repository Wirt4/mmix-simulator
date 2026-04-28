#include <string.h>
#include <setjmp.h>
#include "glue.h"
#include "simulator.h"
#include "constants.h"
#include "io_utils.h"
#include "assembler.h"

extern jmp_buf mmix_exit;

static struct HeapRef stderr_ref;
static struct HeapRef stdout_ref;
static char mmo[FILE_NAME_SIZE];

int mmix_simulate(size_t executable_size){
	if (executable_size == 0) {return -1;}
	(void)executable_size;

	int exit_code = setjmp(mmix_exit);
	if (exit_code != 0) {
		return -1;
	}

	int init = initialize_simulator(mmo);
	if (init != 0) {return -1;}

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
	return get_stdout_heap();
}

unsigned char* get_stderr_pointer(void){
	return get_stderr_heap();
}

int assemble_mmixal(size_t len){
	if (len == 0 || len >= (size_t)MAX_SRC_SIZE) {return -1;};

	struct Redirect err_redirect = redirect_stderr();
	int result = assemble_source(len);
	stderr_ref = restore_stderr(err_redirect);

	if (result == 0){
		const char *mmo_path = get_mmo_path();
		if (file_exists(mmo_path)){
			strncpy(mmo, mmo_path, FILE_NAME_SIZE - 1);
			mmo[FILE_NAME_SIZE - 1] = '\0';
		}
	}

	return result;
}

size_t get_stdout_size(void){
	return stdout_ref.size;
}
