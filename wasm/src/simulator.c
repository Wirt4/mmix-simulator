#include <string.h>
#include <unistd.h>
#include "simulator.h"
#include "assert.h"
#include "constants.h"
#include "mmixlib_wrapper.h"
#include "io_utils.h"
#include "type_utils.h"

//PRIVATE
static int g_simulator_initialized = 0;
static char g_current_mmo[FILE_NAME_SIZE];
static unsigned char g_arguments_pointer[MAX_SRC_SIZE];
static octa g_breakpoints[MAX_BREAKPOINT_COUNT];
static int g_current_breakpoint_count = 0;

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

unsigned char * arguments_buffer(void){
	ASSERT(g_arguments_pointer != NULL);
	return g_arguments_pointer;
}

unsigned int get_instruction_pointer(int partition){
	if (!ASSERT(g_simulator_initialized)){
		return 0;
	}
	return get_inst_ptr(partition);
}

/**
 * Returns 32 bits of breakpoint data stored at (ndx)
* inputs: index of breakpoint data to access, partition: which 32-bit partition of the 64-bit value(0 = high, 1 = low) to return
* outputs: the 32-bit value of the specified partition of the breakpoint data stored at (ndx)
* precondition: the simulator is initialized
* postconditions: none
*/
unsigned int get_breakpoint_data(int ndx, int partition){
	//assert ndx is non-negative and less than current breakpoint count
	if (!ASSERT(0 <= ndx && ndx < g_current_breakpoint_count)){
		return 0;
	}
	//get the octa at breakpoint_buffer[ndx] and return the partition
	return get_tetra(g_breakpoints[ndx], partition);
}

/*
 * Sets the count (inner array size) of breakpoints allocated
 * inputs: count, the number of breakpoints to store
 * outputs: 0 on success, -1 on failure
 * preconditions: count is >=0 and <= maximum allowable breakpoints
 * postconditions: inner state of count is updated
*/
int set_breakpoint_count(int count){
	//assert count is non-negative and less than or equal to max allowable breakpoints
	if (!ASSERT(0 <= count && count <= MAX_BREAKPOINT_COUNT)){
		return -1;
	}
	// update private information
	g_current_breakpoint_count = count;
	//return clean
	return 0;
}

/*
 * Stores an octa of breakpoint data at given index
 * inputs: ndx - index at which to store the data, high- upper tetra of data, low - lower tetra of data
 * outputs: 0 on success -1 on failure
 * preconditions: ndx >=0 , ndx < current breakpoint count
 * postcondtions: breakpoint data is stored
*/
int set_breakpoint_data(int ndx, unsigned int high, unsigned int low){
	// assert ndx is non-negative and less than the current number of breakpoints
	if (!ASSERT(0 <= ndx && ndx < g_current_breakpoint_count)){
		return -1;
	}
	// set the octa on the buffer 
	write_octa(&g_breakpoints[ndx], high, low);
	return 0;
}

