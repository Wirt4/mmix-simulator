#include <string.h>
#include <unistd.h>
#include "simulator.h"
#include "assert.h"
#include "constants.h"
#include "mmixlib_wrapper.h"
#include "io_utils.h"

//PRIVATE
static int g_simulator_initialized = 0;
static char g_current_mmo[FILE_NAME_SIZE];

static int ends_with_mmo(char*filename){
	if (filename == NULL || strlen(filename) >= FILE_NAME_SIZE){
		return 0;
	}
	int suffixLength = 4;
	char suffix[suffixLength + 1];
	strcopy_and_trim(suffix, filename + strlen(filename) - suffixLength, suffixLength);
	if (strcmp(".mmo", suffix) == 0){
		return 1;
	}
	return 0;
}
//PUBLIC
int initialize_simulator(char* mmo, int arg_count, char *arg_vector[]){
	if (g_simulator_initialized){
		return 0;
	}
	if (!(ASSERT(mmo !=NULL) && ASSERT(strlen(mmo) < FILE_NAME_SIZE))){
		return -1;
	}
	if (!(ASSERT(ends_with_mmo(mmo)) && ASSERT(file_exists(mmo)))){
		return -2;
	}
	if (!ASSERT(arg_count >= 0)){
		return -3;
	}
	if (arg_count > 0 && !ASSERT(arg_vector)){
		return -3;
	}
	strcopy_and_trim(g_current_mmo, mmo, FILE_NAME_SIZE - 1);
	mmix_lib_initialize_w();
	mmix_initialize_w();
	mmix_boot_w();
	mmix_load_file_w(mmo);
	if (arg_count > 0){
		mmix_commandline_w(arg_count, arg_vector);
	}
	g_simulator_initialized = 1;
	return 0;
}

void execute_instructions(unsigned int n){
	if (!ASSERT(g_simulator_initialized)){
		return;
	}
	for (unsigned int i =0; i< n; i++){
		if (get_halted()){
			break;
		}
		if (!get_resuming()){
			mmix_fetch_instruction_w();
		}
		mmix_perform_instruction_w();
		mmix_dynamic_trap_w();
		if (get_op() != RESUME){
			set_resuming(0);
		}
	}
}

int sim_halted(void){
	ASSERT(g_simulator_initialized);
	return get_halted();
}

int finalize_simulator(void){
	// simulator manages its own files, but it's the end user's responsibility to clean their own garbage
	if (!ASSERT(g_simulator_initialized)){
		return -1;
	}
	mmix_finalize_w();
	mmix_lib_finalize_w();
	g_simulator_initialized = 0;
	return 0;
}

unsigned int get_general_register_data(int index, int partition){
	if (get_global_register_start() <= index && index < GENERAL_REGISTER_COUNT){
		return get_global_register_data(index, partition);
	}
	if (0 <= index && index < get_local_register_count()){
		const int offsetIndex = (0 + index) & get_local_ring_mask();
		return get_local_register_data(offsetIndex, partition);
	}
	return 0;
}

unsigned int get_special_register_data(int index, int partition){
	if (0 <= index && index < SPECIAL_REGISTER_COUNT){
		return get_global_register_data(index, partition);
	}
	return 0;
}

int special_registers(void){
	return SPECIAL_REGISTER_COUNT;
}

int general_registers(void){
	return GENERAL_REGISTER_COUNT;
}
