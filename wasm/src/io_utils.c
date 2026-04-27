#include <string.h>
#include <unistd.h>
#include "io_utils.h"
#include "constants.h"
#include "assert.h"
//PRIVATE
static int g_stderr_redirected = 0;
static unsigned char g_stderr_pointer[STD_ERR_SIZE];
/**
* reads information stored in (filename) to (heap_pointer)
* inputs: filename, heap_pointer
* outputs: number of bytes written if successful, (size_t) -1 on failure
* preconditions: filename is non null and the file exits, heap_pointer is non-null, the contents of the file are within heap allocation
* postconditions: the information is written to the heap, the file is deleted
*/
static size_t read_to_heap(const char* filename, unsigned char* heap_pointer){
	// if filename or heap_pointer are null, return bad
	if (filename == NULL || heap_pointer == NULL){ 
		perror("filename and heap_pointer may not be null");
		return (size_t)-1;
	}
	// open file to read bytes mode
	FILE *fileP = fopen(filename, "rb");
	size_t size = (size_t)-1;
	int readError = 0;
	if (fileP !=NULL){
		// read from file pointer to heap pointer, save the size
		size = fread(heap_pointer, 1, (size_t)STD_ERR_SIZE, fileP);
		//check file pointer for error
		readError = ferror(fileP);
		// close file
		int closed = fclose(fileP);
		if (closed != 0){perror("file not properly closed");}
	}
	// delete file
	int deleted = remove(filename);
	if (deleted !=0){perror("file not properly deleted");}
	// return bad if read error
	if (readError){
		perror("issue reading file");
		return (size_t)-1;
	}
	// if size > STD_ERR_SIZE print an overflow error
	if (size > (size_t)(STD_ERR_SIZE) && size != (size_t)-1){
		perror("overflow: stored stderr is larger than stderr buffer");
	}
	return size;
}

/**
* restores a redirected_fileno to the original fileno and original_stream
* returns 0 on success, 1 on faliure
*/
static int restore_stream(int redirected_fileno, int original_fileno, FILE* stream){
	//assert filenos are non-negative
	if (redirected_fileno <0 || original_fileno <0){
		perror("filenos may not be negative");
		return -1;
	}
	// assert filenos are not equivalent
	if (redirected_fileno == original_fileno){
		perror("filenos may not be the same");
		return -1;
	}
	// assert stream is non-null
	if (stream == NULL){
		perror("output stream may not be null");
		return -1;
	}
	// flush stream
	int flushed = fflush(stream);
	if (flushed !=0){
		perror("issue with file flushing stream");
	}
	// restore the original fileno with dup2
	int restored = dup2(redirected_fileno, original_fileno);
	if (restored < 0){
		perror("did not restore file directory");
	}	
	// close the redirected fileno, it's no longer needed
	int closed = (redirected_fileno);
	if (closed !=0){
		perror("issue closing redirected fileno");
	}
	return 0;
}
//PUBLIC
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
int write_from_heap(const unsigned char* pointer, size_t len, const char* filename){
	// pointer must be non-null
	if (pointer == NULL || filename == NULL ){
		perror("pointer and filename may not be null");
		return -1;
	}
	if ((size_t)(MAX_SRC_SIZE) < len){
		perror("size greater than available heap memory");
		return -1;
	}
	// open a file with filename
	FILE* fileP = fopen(filename, "wb");
	if (fileP == NULL){
		perror("could not open file");
		return -1;
	}
	// copy the buffer to the file
	int success = 0;
	//if there's nothing to write, just create the file
	if (len > 0){
		size_t bytesWritten = fwrite(pointer, 1, len, fileP);
		if (bytesWritten != len){
			success = -1;
			if (ferror(fileP)){perror("Error: file write error");}
			if (feof(fileP)){perror("Error: EOF file write error");}
		}
	}
	// close the file
	int closed = fclose(fileP);
	if (closed !=0){
		perror("error closing file");
		return -1;
	}
	return success;
}

/**
 * Switches std err from printing to console to logging internally
 * output: fileno for redirected stderr, -1 on failure
 * preconditions: stderr prints to console as usual
 * postconditions:
 * 	messages that would be printed to error are added to the buffer
*/
struct Redirect redirect_stderr(void){
	struct Redirect redirect;
	redirect.exit_code = -1;
	redirect.backup_fileno = -1;
	redirect.filename = "stderr_log.txt";
	redirect.log_pointer = NULL;
	if (!ASSERT(!g_stderr_redirected)){return redirect;}
	int streamFlush = fflush(stderr);
	if (!ASSERT(streamFlush == 0)){return redirect;}
	redirect.backup_fileno = dup(STDERR_FILENO);
	if (!ASSERT(redirect.backup_fileno >= 0)){ return redirect;}
	redirect.log_pointer = fopen(redirect.filename, "w");
	if (! ASSERT (redirect.log_pointer != NULL)){
		g_stderr_redirected = 0;
		return redirect;
	}
	int duped = dup2(fileno(redirect.log_pointer), STDERR_FILENO);
	if (!ASSERT(duped == 0)){
		perror("did not redirect stderr");
		fclose(redirect.log_pointer);
		return redirect;
	}
	int closed =fclose(redirect.log_pointer);
	if (!ASSERT(closed == 0)){return redirect;}
	g_stderr_redirected = 1;
	redirect.exit_code = 0;
	return redirect;
}

/**
 * Restores stderr to a console logging and flushes the buffer
 * input: the fileno of the backedup stderr
 * output: heapref struct, exit_code: 0 on success, -1 on failure
 * preconditions: redirect_std_err has been successfully called
 * postconditions: stderr logs to console normally
*/
struct HeapRef restore_stderr(struct Redirect redirect){
	struct HeapRef ref;
	ref.heap_pointer = NULL;
	ref.size = (size_t)-1;
	ref.exit_code = -1;
	if (!g_stderr_redirected){return ref;}
	// assert fileno is non-negative
	if (redirect.backup_fileno < 0){return ref;	}
	//  restore stream with redirect.backup_fileno, STDERR_NO and stderr
	const int restored = restore_stream(redirect.backup_fileno, STDERR_FILENO, stderr);
	// if could not restore, return bad
	if (restored !=0){return ref;}
	// assert filename non null, 
	if (redirect.filename == NULL){ return ref;} 
	// assign the global stderr pointer to ref pointer
	ref.heap_pointer = g_stderr_pointer;
	// call read_to_heap with ref.pointer and redirect.filename
	size_t size = read_to_heap(redirect.filename, ref.heap_pointer);
	// if size invalid, return bad
	if (size == (size_t)-1){return ref;}
	 // assign the returned size to redirect.filename
	ref.size = size;
	// mark success
	ref.exit_code = 0;
	return ref;
}

/**
 * wraps file utils or unstd for consistent level of abstraction
 * inputs: char *filename
 * outputs: 1 if file with <filename> exists, 0 if not
 * preconditions: filename is non-null and has length less than FILENAME_SIZE (constants.h)
 * postconditions: none
 */
int file_exists(const char *filename){
	if (filename == NULL || strlen(filename) > FILE_NAME_SIZE){
		return 0;
	}
	return access(filename, F_OK) == 0? 1: 0;
}

/**
 * wraps file utils for consistend level of abstraction
 * inputs: char * filename
 * outputs: 0 on success, -1 on failure
 * preconditions: filename is non-null and has length less than FILENAME_SIZE (constants.h)
 * postconditions: none
*/
int remove_file(const char *filename){
	if (!ASSERT(filename == NULL)){return -1;}
	return remove(filename);
}
