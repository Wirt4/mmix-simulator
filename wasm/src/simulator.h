#ifndef SIMULATOR_H
#define SIMULATOR_H

/**
 * Initializes the mmix simulator using mmixware and library tools
 * inputs: name of the mmo file to run
 * outputs: 0 on succes, -1 on failure
 * preconditions: the simulator is not initialized, the named mmo file exists
 * postconditions: the simulator is initialized
*/
int initialize_simulator(char* mmo);

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
int is_halted(void);

/**
 * Cleans up the mmix simulator. Calls teardown methods in mmix and mmixware library. 
 * Removes files or assets created by the user's mmix program, excluding the initial mmo
 * preconditions: the simulator is initialized
 * Returns 0 on success, -1 on failure
*/
int finalize_simulator(void);
#endif
