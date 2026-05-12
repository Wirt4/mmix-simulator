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
	ASSERT(stderr_ref.size != (size_t)-1);
	return stderr_ref.size;
}

unsigned char* get_stdout_pointer(void){
	unsigned char *heap = get_stdout_heap();
	ASSERT(heap != NULL);
	return heap;
}

unsigned char* get_stderr_pointer(void){
	unsigned char* heap = get_stderr_heap();
	ASSERT(heap != NULL);
	return heap;
}

int assemble_mmixal(size_t len){
	if (!(ASSERT(len > 0) && ASSERT(len < (size_t)MAX_SRC_SIZE))) {
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
	if (!ASSERT(initialized)){
		return -1;
	}
	if (instructions == 0 ){
		return 0;
	}
	struct Redirect stdErrRedirect = redirect_stderr();
	struct Redirect stdOutRedirect = redirect_stdout();
	execute_instructions(instructions);
	stdout_ref = restore_stdout(stdOutRedirect);
	stderr_ref = restore_stderr(stdErrRedirect);
	if (!(ASSERT(stderr_ref.exit_code == 0) && ASSERT(stdout_ref.exit_code == 0))){
		return -1;
	}
	return 0;
}

int mmix_initialize_simulator(void){
	int init = initialize_simulator(mmo);
	ASSERT(init == 0);
	initialized = !init;
	return init;
}

int mmix_finalize_simulator(void){
	int fin = finalize_simulator();
	ASSERT(fin == 0);
	initialized = fin;
	return fin;
}

unsigned int get_register_data(int is_special_register, int index, int partition){
	ASSERT(index > 0);
	if (is_special_register){
		return get_special_register_data(index, partition);
	}
	return get_general_register_data(index, partition);
}

int general_register_count(void){
	const int count = general_registers();
	if (!ASSERT(count >=0)){
		return 0;
	}
	return count;
}

int special_register_count(void){
	const int count = special_registers();
	if (!ASSERT(count >=0)){
		return 0;
	}
	return count;
}

unsigned char* get_source_code_pointer(void){
	unsigned char* buf = source_code_buffer();
	ASSERT(buf != NULL);
	return buf;
}

unsigned char* get_listing_pointer(void){
	unsigned char* buf = listing_buffer();
	ASSERT(buf != NULL);
	return buf;
}

size_t get_listing_size(void){
	size_t size = listing_size();
	ASSERT(size != (size_t)-1);
	return size;
}

int is_halted(void){
	return sim_halted();
}

