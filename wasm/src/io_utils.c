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

static size_t get_file_size(FILE *fileP, size_t bufferSize){
	ASSERT(fileP !=NULL);
	ASSERT(bufferSize > 0);
	int seek = fseek(fileP, 0L, SEEK_END);
	ASSERT(seek == 0);
	size_t fileSize = ftell(fileP);
	ASSERT(fileSize <= bufferSize);
	if (fileSize > bufferSize){
		return 0;
	}
	int rewind = fseek(fileP, 0L, SEEK_SET);
	ASSERT(rewind == 0);
	return fileSize;
}

// static size_t read_to_heap(const char* filename, unsigned char* heap_pointer, size_t bufferSize){
// 	if (!(ASSERT(filename != NULL) && ASSERT(heap_pointer != NULL))){ 
// 		return (size_t)-1;
// 	}
// 	FILE *fileP = fopen(filename, "rb");
// 	size_t size = (size_t)-1;
// 	int readError = 0;
// 	if (fileP){
// 		size_t fileSize = get_file_size(fileP, bufferSize);
// 		if (fileSize > 0){
// 			size = fread(heap_pointer, 1, fileSize, fileP);
// 		}else{
// 			size = 0;
// 		}
// 		readError = ferror(fileP);
// 		int closed = fclose(fileP);
// 		ASSERT(closed == 0);
// 	}
// 	int deleted = remove(filename);
// 	ASSERT(deleted == 0);
// 	if (!ASSERT(!readError)){
// 		return (size_t)-1;
// 	}
// 	ASSERT(size <= bufferSize);
// 	//add null terminator
// 	heap_pointer[size] = '\0';
// 	return size;
// }

static int restore_stream(int redirected_fileno, int original_fileno, FILE* stream){
	if (!(ASSERT(redirected_fileno) >=0 && ASSERT(original_fileno >=0))){
		return -1;
	}
	if (!ASSERT(redirected_fileno != original_fileno)){
		return -1;
	}
	if (!ASSERT(stream != NULL)){
		return -1;
	}
	int flushed = fflush(stream);
	ASSERT(flushed == 0);
	int restored = dup2(redirected_fileno, original_fileno);
	ASSERT(restored >=0);
	int closed = close(redirected_fileno);
	ASSERT(closed == 0);
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
int write_from_heap(const unsigned char* pointer, size_t len, const char* filename){
	if (!(ASSERT(pointer != NULL) && ASSERT(filename != NULL)) ){
		return -1;
	}
	if (!ASSERT((size_t)(MAX_SRC_SIZE) >= len)){
		return -1;
	}
	FILE* fileP = fopen(filename, "wb");
	ASSERT(fileP != NULL);
	if (fileP == NULL){
		return -1;
	}
	ASSERT(!ferror(fileP));
	ASSERT(!feof(fileP));
	int success = 0;
		if (len > 0){
			size_t bytesWritten = fwrite(pointer, 1, len, fileP);
			if (bytesWritten != len){
			success = -1;
		}
	}
	int closed = fclose(fileP);
	if(!ASSERT(closed == 0)){
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

static struct HeapRef restore_and_read(
	struct Redirect redirect, 
	int target_fileno, 
	FILE* stream, 
	int* redirected_flag, 
	unsigned char* heap_buf,
	size_t bufferSize
	)
{
	struct HeapRef ref;
	ref.heap_pointer = NULL;
	ref.size = (size_t)-1;
	ref.exit_code = -1;

	if (!ASSERT(*redirected_flag)){
		return ref;
	}
	if (!ASSERT(redirect.backup_fileno >= 0)){
		return ref;
	}
	const int restored = restore_stream(redirect.backup_fileno, target_fileno, stream);
	if (!ASSERT(restored == 0)){
		return ref;
	}
	*redirected_flag = 0;
	if (!ASSERT(redirect.filename != NULL)){ 
		return ref;
	}
	ref.heap_pointer = heap_buf;
	size_t size = read_to_heap(redirect.filename, ref.heap_pointer, bufferSize);
	if (!ASSERT(size != (size_t)-1)){
		return ref;
	}
	ref.size = size;
	ref.exit_code = 0;
	return ref;
}

struct HeapRef restore_stderr(struct Redirect redirect){
	return restore_and_read(redirect, STDERR_FILENO, stderr, &g_stderr_redirected, g_stderr_pointer, (size_t)STD_ERR_SIZE);
}

struct HeapRef restore_stdout(struct Redirect redirect){
	return restore_and_read(redirect, STDOUT_FILENO, stdout, &g_stdout_redirected, g_stdout_pointer, (size_t)STD_OUT_SIZE);
}

int file_exists(const char *filename){
	if (filename == NULL || strlen(filename) > FILE_NAME_SIZE){
		return 0;
	}
	return access(filename, F_OK) == 0? 1: 0;
}

int remove_file(const char *filename){
	if (!ASSERT(filename != NULL)){return -1;}
	return remove(filename);
}

unsigned char* get_stderr_heap(void){
	ASSERT(g_stderr_pointer != NULL);
	return g_stderr_pointer;
}

unsigned char* get_stdout_heap(void){
	ASSERT(g_stdout_pointer != NULL);
	return g_stdout_pointer;
}

void strcopy_and_trim(char* dest, const char*src, int len){
	strncpy(dest, src, len);
	dest[len] = '\0';
}


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
size_t read_to_heap(const char* filename, unsigned char* heap_pointer, size_t buffer_size){
	if (!(ASSERT(filename != NULL) && ASSERT(heap_pointer != NULL))){ 
		return (size_t)-1;
	}
	FILE *fileP = fopen(filename, "rb");
	size_t size = (size_t)-1;
	int readError = 0;
	if (fileP){
		size_t fileSize = get_file_size(fileP, buffer_size);
		if (fileSize > 0){
			size = fread(heap_pointer, 1, fileSize, fileP);
		}else{
			size = 0;
		}
		readError = ferror(fileP);
		int closed = fclose(fileP);
		ASSERT(closed == 0);
	}
	int deleted = remove(filename);
	ASSERT(deleted == 0);
	if (!ASSERT(!readError)){
		return (size_t)-1;
	}
	ASSERT(size <= buffer_size);
	//add null terminator
	heap_pointer[size] = '\0';
	return size;
}


