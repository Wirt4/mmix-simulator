#ifndef IO_UTILS_H
#define IO_UTILS_H

#include <stdio.h>

struct Redirect{
	int exit_code;
	FILE* log_pointer;
	char* filename;
	int backup_fileno;
};
struct HeapRef{
	int exit_code;
	unsigned char * heap_pointer;
	size_t size;
};
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

/**
 * Switches std err from printing to console to logging internally
 * output: fileno of redirected stderr on success, -1 on failure
 * preconditions: stderr prints to console as usual
 * postconditions:
 * 	messages that would be printed to error are added to the buffer
*/
struct Redirect redirect_stderr(void);

/**
 * Restores stderr to a console logging and flushes the buffer
 * input: the fileno of the backedup stderr
 * output: struct referencing data written to heap, has exit_code 0 on success, -1 on failure
 * preconditions: redirect_std_err has been successfully called
 * postconditions: stderr logs to console normally
*/
struct HeapRef restore_stderr(struct Redirect redirect);


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

//possible TODO: a clear_all_files method to use as a garbage collection thing
#endif
