#include "mmixlib_wrapper.h"
#include "mmixlib.h"
#include "type_utils.h"
extern mmix_opcode op;
extern bool halted;
extern bool resuming;

int mmixal_w(char *mms_name, char *mmo_name, char *mml_name){
	return mmixal(mms_name, mmo_name, mml_name);
}
mem_tetra *mem_find_by_partition(unsigned int high, unsigned int low){
	octa addr;
	addr.h = high;
	addr.l = low;
	return mem_find(addr);
}
void set_execution_breakpoint_w(unsigned int addr_high, unsigned int addr_low){
	mem_find_by_partition(addr_high, addr_low)->bkpt |= exec_bit;
}
void clear_execution_breakpoint_w(unsigned int addr_high, unsigned int addr_low){
	mem_find_by_partition(addr_high, addr_low)->bkpt &= ~exec_bit;
}
int has_exec_breakpoint_w(unsigned int addr_high, unsigned int addr_low){
	return (mem_find_by_partition(addr_high, addr_low)->bkpt & exec_bit) ? 1 : 0;
}
//private method, not visible to caller

void mmix_lib_initialize_w(void){
	// lib function signature is int, but the implementation only returns zero
	// keeping functions wrapped to keep consistent level of abstraction
	mmix_lib_initialize();
}

void mmix_initialize_w(void){
	mmix_initialize();
}

void mmix_boot_w(void){
	mmix_boot();
}

void mmix_load_file_w(char* mmo_file_name){
	mmix_load_file(mmo_file_name);
}

mmix_opcode get_op(void){
	return op;
}

int get_halted(void){
	return halted ? 1: 0;
}

void mmix_dynamic_trap_w(void){
	mmix_dynamic_trap();
}

int get_resuming(void){
	return resuming ? 1 : 0;
}

void set_resuming(int value){
	resuming = value == 0? false: true;
}

void mmix_fetch_instruction_w(void){
	mmix_fetch_instruction();
}

void mmix_perform_instruction_w(void){
	mmix_perform_instruction();
}

void mmix_lib_finalize_w(void){
	mmix_lib_finalize();
}

void mmix_finalize_w(void){
	mmix_finalize();
}

int get_local_register_count(void){
	return L;
}

int get_global_register_start(void){
	return G;
}

unsigned int get_local_register_data(int index, int partition){
	return get_tetra(l[index], partition);
}

unsigned int get_global_register_data(int index, int partition){
	return get_tetra(g[index], partition);
}

int get_local_ring_mask(void){
	return lring_mask;
}

void mmix_commandline_w(int argc, char *argv[]){
	mmix_commandline(argc, argv);
}

unsigned int get_inst_ptr(int partition){
	// return get_tetra of the inst_ptr octa
	return get_tetra(inst_ptr, partition);
}
