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
/*
* returns 1 if filename ends with suffix ".mmo", 0 if not
* inputs: char* filename
* precondtions: filename is non null and small enough for filename size
* postconditions: none
*/
static int ends_with_mmo(char*filename){
	if (filename == NULL || strlen(filename) >= FILE_NAME_SIZE){
		return 0;
	}
	int suffixLength = 4;
	char suffix[suffixLength + 1];
	size_t len = strlen(filename);
	strncpy(suffix, filename + len - suffixLength, suffixLength);
	//have to manually set the null terminator
	suffix[suffixLength] = '\0';
	if (strcmp(".mmo", suffix) == 0){
		return 1;
	}
	return 0;
}
//PUBLIC
int initialize_simulator(char* mmo){
	// check if simulator is initialized
	if (g_simulator_initialized){
		return 0;
	}
	// check if mmo is valid
	if (!ASSERT(mmo !=NULL) || !ASSERT(strlen(mmo) < FILE_NAME_SIZE)){
		return -1;
	}
	//assumes allocation is on stack not heap
	if (!ASSERT(ends_with_mmo(mmo))){
		return -1;
	}
	if (!file_exists(mmo)){
		return -1;
	}
	// set g_current_mmo to mmo
	strncpy(g_current_mmo, mmo, strlen(mmo));
	// start mmixlib
	mmix_lib_initialize_w();
	// start mmix
	mmix_initialize_w();
	mmix_boot_w();
	mmix_load_file_w(mmo);
	// mark initialized as true
	g_simulator_initialized = 1;
	return 0;
}

void execute_instructions(unsigned int n){
	ASSERT(g_simulator_initialized);
	if (!g_simulator_initialized){return;}
	for (unsigned int i =0; i< n; i++){
		if (get_halted()){
			break;
		}
		if (!get_resuming()){
			mmix_fetch_instruction_w();
		}
		mmix_perform_instruction_w();
		mmix_dynamic_trap_w();
		//set "resuming" to false if OPCODE is not "RESUME"
		if (get_op() != RESUME){
			set_resuming(0);
		}
	}
}

int is_halted(void){
	return 0;
}

int finalize_simulator(void){
	/*
	note: had thoughts about cleaning up user-generated files or directories, but I'm trading that off here. 
	The environment is already sandboxed in a WASM, so if it breaks, then it's a browser restart.
	Also, resource management is the job of the programmer, and I'm managing the resources of this program, not the user's.
	So collect your own darn garbage.
	*/
	if (!g_simulator_initialized){
		return -1;
	}
	mmix_finalize_w();
	mmix_lib_finalize_w();
	g_simulator_initialized = 0;
	return 0;
}
