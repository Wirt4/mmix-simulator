#include <string.h>
#include <unistd.h>
#include "io_utils.h"
#include "constants.h"
#include "assert.h"
//PRIVATE
static int g_stderr_redirected = 0;
static int g_stdout_redirected = 0;
static unsigned char g_stderr_pointer[STD_ERR_SIZE];
static unsigned char g_stdout_pointer[STD_OUT_SIZE];
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
	if (redirected_fileno <0 || original_fileno <0){
		perror("filenos may not be negative");
		return -1;
	}
	if (redirected_fileno == original_fileno){
		perror("filenos may not be the same");
		return -1;
	}
	if (stream == NULL){
		perror("output stream may not be null");
		return -1;
	}
	int flushed = fflush(stream);
	if (flushed !=0){
		perror("issue with file flushing stream");
	}
	int restored = dup2(redirected_fileno, original_fileno);
	if (restored < 0){
		perror("did not restore file directory");
	}	
	int closed = close(redirected_fileno);
	if (closed !=0){
		perror("issue closing redirected fileno");
	}
	return 0;
}

static struct Redirect redirect_stream(struct Redirect redirect, FILE* stream, int target_fileno, int* redirected_flag){
	if (!ASSERT(!*redirected_flag)){return redirect;}
	int streamFlush = fflush(stream);
	if (!ASSERT(streamFlush == 0)){return redirect;}
	redirect.backup_fileno = dup(target_fileno);
	if (!ASSERT(redirect.backup_fileno >= 0)){ return redirect;}
	redirect.log_pointer = fopen(redirect.filename, "w");
	if (!ASSERT(redirect.log_pointer != NULL)){
		return redirect;
	}
	// as far as dup2 goes, the file descriptor _is_ an integer
	int duped = dup2(fileno(redirect.log_pointer), target_fileno);
	if (!ASSERT(duped == target_fileno)){
		fclose(redirect.log_pointer);
		return redirect;
	}
	int closed = fclose(redirect.log_pointer);
	if (!ASSERT(closed == 0)){return redirect;}
	*redirected_flag = 1;
	redirect.exit_code = 0;
	return redirect;
}
static struct Redirect init_redirect(char*logname){
	ASSERT(logname != NULL);
	ASSERT(strlen(logname) < FILE_NAME_SIZE);
	struct Redirect redirect;
	redirect.exit_code = -1;
	redirect.backup_fileno = -1;
	redirect.filename = logname;
	redirect.log_pointer = NULL;
        return redirect;
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
	if (pointer == NULL || filename == NULL ){
		perror("pointer and filename may not be null");
		return -1;
	}
	if ((size_t)(MAX_SRC_SIZE) < len){
		perror("size greater than available heap memory");
		return -1;
	}
	FILE* fileP = fopen(filename, "wb");
	if (fileP == NULL){
		perror("could not open file");
		return -1;
	}
	int success = 0;
	if (len > 0){
		size_t bytesWritten = fwrite(pointer, 1, len, fileP);
		if (bytesWritten != len){
			success = -1;
			if (ferror(fileP)){perror("Error: file write error");}
			if (feof(fileP)){perror("Error: EOF file write error");}
		}
	}
	int closed = fclose(fileP);
	if (closed !=0){
		perror("error closing file");
		return -1;
	}
	return success;
}

struct Redirect redirect_stdout(void){
	return redirect_stream(init_redirect("stdout_log.txt"), stdout, STDOUT_FILENO, &g_stdout_redirected);
}

struct Redirect redirect_stderr(void){
	return redirect_stream(init_redirect("stderr_log.txt"), stderr, STDERR_FILENO, &g_stderr_redirected);
}

static struct HeapRef restore_and_read(struct Redirect redirect, int target_fileno, FILE* stream, int* redirected_flag, unsigned char* heap_buf){
	struct HeapRef ref;
	ref.heap_pointer = NULL;
	ref.size = (size_t)-1;
	ref.exit_code = -1;
	if (!*redirected_flag){return ref;}
	if (redirect.backup_fileno < 0){return ref;}
	const int restored = restore_stream(redirect.backup_fileno, target_fileno, stream);
	if (restored !=0){return ref;}
	*redirected_flag = 0;
	if (redirect.filename == NULL){ return ref;}
	ref.heap_pointer = heap_buf;
	size_t size = read_to_heap(redirect.filename, ref.heap_pointer);
	if (size == (size_t)-1){return ref;}
	ref.size = size;
	ref.exit_code = 0;
	return ref;
}

struct HeapRef restore_stderr(struct Redirect redirect){
	return restore_and_read(redirect, STDERR_FILENO, stderr, &g_stderr_redirected, g_stderr_pointer);
}

struct HeapRef restore_stdout(struct Redirect redirect){
	return restore_and_read(redirect, STDOUT_FILENO, stdout, &g_stdout_redirected, g_stdout_pointer);
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
	if (!ASSERT(filename != NULL)){return -1;}
	return remove(filename);
}

unsigned char* get_stderr_heap(void){
	return g_stderr_pointer;
}

unsigned char* get_stdout_heap(void){
	return g_stdout_pointer;
}

struct HeapRef read_file_to_stdout_heap(const char *filename){
	struct HeapRef ref;
	ref.heap_pointer = g_stdout_pointer;
	ref.size = (size_t)-1;
	ref.exit_code = -1;
	if (filename == NULL) return ref;
	FILE *f = fopen(filename, "rb");
	if (!f) return ref;
	ref.size = fread(g_stdout_pointer, 1, (size_t)STD_OUT_SIZE, f);
	int err = ferror(f);
	fclose(f);
	if (err) return ref;
	if (ref.size < (size_t)STD_OUT_SIZE) g_stdout_pointer[ref.size] = '\0';
	ref.exit_code = 0;
	return ref;
}
