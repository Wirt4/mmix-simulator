#ifndef IO_UTILS_H
#define IO_UTILS_H

#include <stdio.h>
#include "types.h"
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
int write_from_heap(const unsigned char* pointer, size_t len, const char* filename);

struct Redirect redirect_stderr(void);

struct Redirect redirect_stdout(void);
/**
 * Restores stderr to a console logging and flushes the buffer
 * input: the fileno of the backedup stderr
 * output: struct referencing data written to heap, has exit_code 0 on success, -1 on failure
 * preconditions: redirect_std_err has been successfully called
 * postconditions: stderr logs to console normally
*/
struct HeapRef restore_stderr(struct Redirect redirect);

struct HeapRef restore_stdout(struct Redirect redirect);

/**
 * wraps file utils or unstd for consistent level of abstraction
 * inputs: char *filename
 * outputs: 1 if file with <filename> exists, 0 if not
 * preconditions: filename is non-null and has length less than FILENAME_SIZE (constants.h)
 * postconditions: none
 */
int file_exists(const char *filename);

/**
 * wraps file utils for consistend level of abstraction
 * inputs: char * filename
 * outputs: 0 on success, -1 on failure
 * preconditions: filename is non-null and has length less than FILENAME_SIZE (constants.h)
 * postconditions: none
*/
int remove_file(const char *filename);

/**
 * Returns a pointer to the preallocated stderr buffer
 */
unsigned char* get_stderr_heap(void);

/**
 * Returns a pointer to the preallocated stdout buffer
 */
unsigned char* get_stdout_heap(void);

/**
 * Reads a file into the stdout heap buffer.
 * Returns a HeapRef with exit_code 0 on success, -1 on failure.
 * The file is deleted after reading.
 */
struct HeapRef read_file_to_stdout_heap(const char *filename);

#endif
