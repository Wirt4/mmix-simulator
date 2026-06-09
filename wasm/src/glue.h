#ifndef GLUE_H
#define GLUE_H
#include <stdint.h>
#include <stdio.h>

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define WASM_EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define WASM_EXPORT
#endif

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
WASM_EXPORT int assemble_mmixal(size_t len);

/** Returns the size in bytes of the assembly listing */
WASM_EXPORT size_t get_listing_size(void);

/**
 * Returns a pointer to the buffer containing the listing  (string representation of compiled code)
 * A listing is created by a successful run of `assemble_mmixal`
 */
WASM_EXPORT unsigned char* get_listing_pointer(void);

/**
 * Returns the size in bytes of the simulator's stderr output.
 */
WASM_EXPORT size_t get_stderr_size(void);

/**
 * Returns a pointer to the buffer containing the simulator's stdout output.
 */
WASM_EXPORT unsigned char* get_stdout_pointer(void);

/**
 * Returns a pointer to the input buffer for writing MMIXAL source code.
 */
WASM_EXPORT unsigned char* get_source_code_pointer(void);

/**
 * Returns the size in bytes of the stdout output buffer.
 */
WASM_EXPORT size_t get_stdout_size(void);

/**
 * Returns a pointer to the buffer containing the simulator's stderr output.
 */
WASM_EXPORT unsigned char* get_stderr_pointer(void);

/**
 * Executes a compiled .mmo binary.
 *
 * @params number of arguments from command line, a vector containing those args
 * @pre  assemble_mmixal() has been called successfully, if there are more than 0 args, then they have been set on the heap
 * @post get_stdout_pointer()/get_stdout_size() return the program's stdout;
 *       get_stderr_pointer()/get_stderr_size() return the program's stderr.
 * @return 0 on success, non-zero on failure.
 */
WASM_EXPORT int mmix_initialize_simulator(int arg_count);

/**Performs a specified amount of mmix instructions and redirects the console outputs of those instructions to buffer
 *
 * @param instructions the number of mmix instructions to execute
 * @pre mmix_intialize has been successfully called
 * @post 
 *      state of simulator has advanced by specified instruction state (or exited if)
 *      outputs of performed code are stored in buffers
 */
WASM_EXPORT int mmix_perform_instructions(unsigned int instructions);

/**
 * Cleans up the mmix simulator. Calls teardown methods in mmix and mmixware library. 
 * Removes files or assets created by the user's mmix program, excluding the initial mmo
 * preconditions: the simulator is initialized
 * Returns 0 on success, -1 on failure
*/
WASM_EXPORT int mmix_finalize_simulator(void);

/*
 * returns 1 if the simulator is halted, 0 if not
 * preconditions: simulator is in an initialized state
 * postconditions: simulator is in an intitialized state
*/
WASM_EXPORT int is_halted(void);

/**
 * Returns a tetrabyte (32 bits) of data from the specified register. 
 * @param register_type: 0 for general register, 1 for special register
 * @param index: value 0 through 255 for general or 0 through 31 for special 
 * @param partition: 0 to access higher tetra, 1 to access lower tetra
 * @return unsigned int containing 32 bits of data, 0 on failure
 * */
WASM_EXPORT unsigned int get_register_data(int register_type, int index, int partition);

/**
 * Returns the number of general registers in the MMIX architecture.
 */
WASM_EXPORT int general_register_count(void);

/**
 * Returns the number of special registers in the MMIX architecture.
 */
WASM_EXPORT int special_register_count(void);

/**
 * Returns pointer to the start of args array
 */
WASM_EXPORT unsigned char* get_args_pointer(void);

/*
 * Returns the maximum allowable length of an argument string
*/
WASM_EXPORT int arg_size(void);

/*
 * Returns the address of the next instruction
 * @param partition: 0 to access higher tetra, 1 to access lower tetra
 * @return unsigned int containing 32 bits of data, 0 on failure
 */
WASM_EXPORT unsigned int get_program_counter(int partition);

/*
 * Returns a partition of the address stored at breakpoints[ndx]
 * @param ndx: stored breakpoint to access
 * @param partition: 0 to access higher tetra, 1 to access lower tetra
 * @pre ndx is non-negative
 * @pre ndx is less than breakpoint count
 * @return unsigned int containing 32 bits of data, 0 on failure
 */
WASM_EXPORT unsigned int get_breakpoint(int ndx, int partition);

/*
 * Updates state of breakpoint buffer
 * @param count: the new size of of the breakpoint buffer
 * @pre count is non-negative
 * @pre count <= maximum allowable breakpoints (C config)
 * @post size of allocated breakpoints is adjusted
 * @return 0 on success, -1 on failure
 */
WASM_EXPORT int update_breakpoint_count(int count);

/*
 * Stores an octa in the breakpoint buffer
 * @param ndx: the position on the buffer to write to
 * @param high: the upper tetra to write
 * @param low: the lower tetra to write
 * @return 0 on success: -1 on failure
 * @pre: ndx is non-negative
 * @pre: ndx is less than current breakpoint count
 * @post the full octa is written to the breakpoint buffer
 * */
WASM_EXPORT int set_breakpoint(int ndx, unsigned int high, unsigned int low);

#endif /*GLUE_H */
