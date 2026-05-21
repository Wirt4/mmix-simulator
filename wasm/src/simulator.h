#ifndef SIMULATOR_H
#define SIMULATOR_H

/**
 * Initializes the mmix simulator using mmixware and library tools
 * inputs: name of the mmo file to run, number of arg counts and an array of command-line arguments
 * outputs: 0 on succes, -1 on failure
 * preconditions: the simulator is not initialized, the named mmo file exists
 * postconditions: the simulator is initialized
*/
int initialize_simulator(char* mmo, int arg_count, char *arg_vector[]);

/**
 * Executes N number of instructions in mmix.
 * Exits early if program is halted.
 * inputs: unsigned int n: the number of instructions, or lines of code, to run
 * outputs: none
 * preconditions: the simulator is in an initialized state
 * postconditions: N instructions are executed
 *  The mmix execution can resume at line N or the program is halted
 * */
void execute_instructions(unsigned int n);

/*
 * returns 1 if the simulator is halted, 0 if not
 * preconditions: simulator is in an initialized state
 * postconditions: none
*/
int sim_halted(void);

/**
 * Cleans up the mmix simulator. Calls teardown methods in mmix and mmixware library. 
 * Removes files or assets created by the user's mmix program, excluding the initial mmo
 * preconditions: the simulator is initialized
 * Returns 0 on success, -1 on failure
*/
int finalize_simulator(void);

/**
 * Gets 32 bits of data from a general register.
 * inputs: int index: the register number (0-255),
 *         int partition: which 32-bit partition of the 64-bit register (0 = high, 1 = low)
 * outputs: the 32-bit value of the specified partition
 * preconditions: the simulator is initialized, 0 <= index <= 255, partition is 0 or 1
 * postconditions: none
 */
unsigned int get_general_register_data(int index, int partition);

/**
 * Gets 32 bits of data from a special register.
 * inputs: int index: the special register number,
 *         int partition: which 32-bit partition of the 64-bit register (0 = high, 1 = low)
 * outputs: the 32-bit value of the specified partition
 * preconditions: the simulator is initialized, index is a valid special register number, partition is 0 or 1
 * postconditions: none
 */
unsigned int get_special_register_data(int index, int partition);

/**
 * Returns the number of special registers in the MMIX architecture.
 */
int special_registers(void);

/**
 * Returns the number of general registers in the MMIX architecture.
 */
int general_registers(void);
#endif
