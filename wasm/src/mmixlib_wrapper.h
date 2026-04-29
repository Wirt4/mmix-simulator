#ifndef MMIXLIB_WRAPPER_H
#define MMIXLIB_WRAPPER_H
// mirror of mmixlib so can effectively unit test
#include "mmixlib.h"

/**
 * Assembles an MMIXAL source file into an .mmo object file.
 * inputs: mms_name: path to the source file,
 *         mmo_name: path for the output .mmo file,
 *         mml_name: path for the listing file (may be NULL)
 * outputs: 0 on success, negative on fatal errors,
 *          positive value = number of errors found in the input
 */
int mmixal_w(char *mms_name, char *mmo_name, char *mml_name);

/**
 * Initializes the mmixlib library.
 * preconditions: none
 * postconditions: mmixlib is initialized and ready for use
 */
void mmix_lib_initialize_w(void);

/**
 * Initializes the MMIX simulator state (registers, memory, CPU).
 * preconditions: mmix_lib_initialize_w() has been called
 * postconditions: MMIX simulator state is reset to initial values
 */
void mmix_initialize_w(void);

/**
 * Boots the MMIX simulator, setting the program counter to the entry point.
 * preconditions: mmix_initialize_w() has been called
 * postconditions: program counter is set to boot location, simulator is ready for execution
 */
void mmix_boot_w(void);

/**
 * Loads a compiled .mmo object file into the simulator's memory.
 * input: mmo_file_name: path to the .mmo file
 * preconditions: mmix_boot_w() has been called; the file must exist and be valid .mmo format
 * postconditions: program code is loaded into simulated memory
 */
void mmix_load_file_w(char *mmo_file_name);

/**
 * Fetches the next instruction from simulated memory at the program counter.
 * preconditions: simulator is initialized with a valid program loaded
 * postconditions: global opcode and instruction fields are updated
 */
void mmix_fetch_instruction_w(void);

/**
 * Executes the most recently fetched instruction, modifying registers and memory.
 * preconditions: mmix_fetch_instruction_w() has been called
 * postconditions: simulator state is updated; halted flag may be set if HALT was executed
 */
void mmix_perform_instruction_w(void);

/**
 * Handles dynamic traps triggered during instruction execution (e.g. division by zero).
 * preconditions: simulator is in a state where a dynamic trap has occurred
 * postconditions: trap is handled; resuming flag may be set
 */
void mmix_dynamic_trap_w(void);

/**
 * Finalizes the mmixlib library and releases library resources.
 * preconditions: mmix_lib_initialize_w() was called
 * postconditions: library resources are released
 */
void mmix_lib_finalize_w(void);

/**
 * Finalizes the MMIX simulator and cleans up simulator state.
 * preconditions: simulator was initialized
 * postconditions: simulator state is cleaned up and memory is freed
 */
void mmix_finalize_w(void);

/**
 * Returns the opcode of the most recently fetched instruction.
 * outputs: mmix_opcode enum value representing the decoded instruction
 * preconditions: mmix_fetch_instruction_w() has been called at least once
 */
mmix_opcode get_op(void);

/**
 * Returns 1 if the simulator is halted, 0 if not.
 * preconditions: simulator is in an initialized state
 */
int get_halted(void);

/**
 * Returns 1 if the simulator is in a resumable state (e.g. after a resumable trap), 0 otherwise.
 */
int get_resuming(void);

/**
 * Sets the resuming flag, controlling whether the simulator resumes after a trap.
 * input: value: 1 for true (resume), 0 for false
 */
void set_resuming(int value);
#endif
