#ifndef GLUE_H
#define GLUE_H
#include <stdint.h>
#include <stdio.h>
/*
 * glue.h
 *
 * Public API exported to WASM via Emscripten.
 */

/**
 * Compiles MMIXAL source code to .mmo binary.
 *
 * @param len  Length in bytes of the source code stored at get_source_code_pointer().
 * @pre  MMIXAL source code has been written to the buffer at get_source_code_pointer().
 * @post On success, the .mmo binary is written to disk;
 *       get_stdout_pointer()/get_stdout_size() return the assembler listing.
 *       On failure, get_stderr_pointer()/get_stderr_size() return assembler error output.
 * @returns heapRef to binary on success, non-zero on failure.
 */
int assemble_mmixal(size_t len);

/**
 * Returns the size in bytes of the simulator's stderr output.
 */
size_t get_stderr_size(void);

/**
 * Returns a pointer to the buffer containing the simulator's stdout output.
 *
 * After assemble_mmixal(), this holds the assembler listing.
 * After simulation, this holds the simulated program's stdout.
 */
unsigned char* get_stdout_pointer(void);

/**
 * Returns a pointer to the input buffer for writing MMIXAL source code.
 */
unsigned char* get_source_code_pointer(void);

/**
 * Returns the size in bytes of the stdout output buffer.
 */
size_t get_stdout_size(void);

/**
 * Returns a pointer to the buffer containing the simulator's stderr output.
 */
unsigned char* get_stderr_pointer(void);

/**
 * Executes a compiled .mmo binary.
 *
 * @pre  assemble_mmixal() has been called successfully.
 * @post get_stdout_pointer()/get_stdout_size() return the program's stdout;
 *       get_stderr_pointer()/get_stderr_size() return the program's stderr.
 * @return 0 on success, non-zero on failure.
 */
int mmix_initialize_simulator(void);

/**Performs a specified amount of mmix instructions and redirects the console outputs of those instructions to buffer
 *
 * @param instructions the number of mmix instructions to execute
 * @pre mmix_intialize has been successfully called
 * @post 
 *      state of simulator has advanced by specified instruction state (or exited if)
 *      outputs of performed code are stored in buffers
 */
int mmix_perform_instructions(unsigned int instructions);

/**
 * Cleans up the mmix simulator. Calls teardown methods in mmix and mmixware library. 
 * Removes files or assets created by the user's mmix program, excluding the initial mmo
 * preconditions: the simulator is initialized
 * Returns 0 on success, -1 on failure
*/
int mmix_finalize_simulator(void); 

/*
 * returns 1 if the simulator is halted, 0 if not
 * preconditions: simulator is in an initialized state
 * postconditions: simulator is in an intitialized state
*/
int is_halted(void);


#endif /*GLUE_H */
