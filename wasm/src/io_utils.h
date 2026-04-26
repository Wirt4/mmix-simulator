#ifndef IO_UTILS_H
#define IO_UTILS_H

#include <stdio.h>
/**
 * creates a new file and copies information from the heap to the file
 * inputs: src: pointer to heap source, len: size of data to write, filename: name of file
 * outputs: 0 on success, 1 on failure
 * preconditions: 
 * 	src is non-null
 * 	filename is non-null
 * 	filename length is < FILE_NAME_SIZE
 * 	len <= MAX_SRC_SIZE
 * postcondition(s): a new file of name <filename> is created and filled with the information from heap
*/
int write_from_heap(unsigned char* pointer, size_t len, char* filename);

/**
 * Switches std err from printing to console to logging internally
 * output: 0 on success, -1 on failure
 * preconditions: stderr prints to console as usual
 * postconditions:
 * 	messages that would be printed to error are added to the buffer
*/
int redirect_stderr(void);

/**
 * Restores stderr to a console logging and flushes the buffer
 * output: 0 on success, -1 on failure
 * preconditions: redirect_std_err has been successfully called
 * postconditions: stderr logs to console normally
*/
int restore_stderr(void);

/*
* Returns pointer to the stderr buffer
* outputs: pointer (null if stderr not redirected)
* preconditions: stderr has been successfully redirected
* postconditions: none
* */
unsigned char * get_stderr_pointer(void);

/**
 * Returns size of content written to stderr buffer
 * ouptuts: length of content written
 * preconditions: stderr has been successfully redirected
 * postconditions: none
*/
size_t get_stderr_size(void);

/**
 * wraps file utils or unstd for consistent level of abstraction
 * inputs: char *filename
 * outputs: 1 if file with <filename> exists, 0 if not
 * preconditions: filename is non-null and has length less than FILENAME_SIZE (constants.h)
 * postconditions: none
 */
int file_exists(char *filename);

/**
 * wraps file utils for consistend level of abstraction
 * inputs: char * filename
 * outputs: 0 on success, -1 on failure
 * preconditions: filename is non-null and has length less than FILENAME_SIZE (constants.h)
 * postconditions: none
*/
int remove_file(char *filename);

#endif
