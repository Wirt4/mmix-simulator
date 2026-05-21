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

/**
 * Redirects stderr output to a file ("stderr_log.txt").
 * Returns a Redirect struct with exit_code 0 on success, -1 on failure.
 * preconditions: stderr has not already been redirected
 * postconditions: stderr writes to "stderr_log.txt";
 *   original stderr file descriptor is backed up in Redirect.backup_fileno
 */
struct Redirect redirect_stderr(void);

/**
 * Redirects stdout output to a file ("stdout_log.txt").
 * Returns a Redirect struct with exit_code 0 on success, -1 on failure.
 * preconditions: stdout has not already been redirected
 * postconditions: stdout writes to "stdout_log.txt";
 *   original stdout file descriptor is backed up in Redirect.backup_fileno
 */
struct Redirect redirect_stdout(void);
/**
 * Restores stderr to a console logging and flushes the buffer
 * input: the fileno of the backedup stderr
 * output: struct referencing data written to heap, has exit_code 0 on success, -1 on failure
 * preconditions: redirect_std_err has been successfully called
 * postconditions: stderr logs to console normally
*/
struct HeapRef restore_stderr(struct Redirect redirect);

/**
 * Restores stdout to normal console output and flushes the buffer.
 * input: the Redirect struct returned by redirect_stdout()
 * output: struct HeapRef referencing data written to heap, with exit_code 0 on success, -1 on failure
 * preconditions: redirect_stdout has been successfully called
 * postconditions: stdout logs to console normally; "stdout_log.txt" is deleted
 */
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
 * copies information the file to the heap
 * inputs: filename: name of file, heap_pointer: pointer to target heap, buffer_size: allocated space on heap
 * outputs: size of information written on success, 0 on failure
 * preconditions: 
 * 
 * 	filename is non-null
 * 	filename length is < FILE_NAME_SIZE
 * 	tgt is non-null
 * postcondition(s): the contents of the file at filename are written to the heap at tgt
*/
size_t read_to_heap(const char* filename, unsigned char* heap_pointer, size_t buffer_size);

/**
 * void
 * copies src to dest and adds null char at len
 */
void strcopy_and_trim(char* dest, const char*src, int len);

/**
 * copies the delimited args from the source heap to arg_vector
*/
void parse_arg_array(char *arg_vector[], const unsigned char* heap_pointer, size_t arg_count);
#endif
