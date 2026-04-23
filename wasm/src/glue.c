#include <unistd.h>
#include <stdio.h>
#include <errno.h>
#include <string.h>
#include <time.h>
#include "glue.h"
#include "mmixlib.h"

#define ASSERT(e) \
    ((e) ? 1 : (log_error(#e, __FILE__, __LINE__), 0))
#define HEAP_START 0
#define HEAP_SIZE (1 << 24) //16 MiB

static unsigned char g_bin_pointer[HEAP_SIZE];
static unsigned char g_stdout_pointer[HEAP_SIZE];
static unsigned char g_source_code_pointer[HEAP_SIZE];
static unsigned char g_stderr_pointer[HEAP_SIZE];

static size_t g_bin_len;
static size_t g_stdout_len;
static size_t g_stderr_len;

static void log_error(const char *expr, const char *file, int line) {
    fprintf(stderr, "Assertion failed: %s (%s:%d)\n", expr, file, line);
}

static int is_valid_string(const char*string){
	if (!(ASSERT(string != NULL)&& ASSERT(string[0] != '\0'))){
		return 0;
	}
	return 1;
}

// static FILE* open_file(const char*filename, int isWriteMode){
// 	if (!is_valid_string(filename)){
// 		return NULL;
// 	}
// 	const char* modeArg = isWriteMode ? "w" : "rb";
// 	FILE* pointer = fopen(filename, modeArg);
// 	ASSERT(pointer != NULL);
// 	return pointer;
// }

static int create_file(const char*filename){
	if (!is_valid_string(filename)) {
		return -1;
	}
	FILE * filePointer = fopen(filename, "w");
	if (filePointer == NULL){
		return -1;
	}
	int result = fclose(filePointer);
	(void)ASSERT(result == 0);
        return result;
}

static int write_text_to_file(const unsigned char * sourceStart, size_t sourceSize, FILE* destPointer){
	if (
		!(ASSERT(sourceStart != NULL) &&
		ASSERT(destPointer != NULL) &&
		ASSERT(sourceSize < HEAP_SIZE))
	) {
		return -1;
	}
	if (sourceSize==0){
		return 0;
	}
	size_t charsWritten = fwrite(sourceStart, sizeof(char), sourceSize + 1, destPointer);
	if (charsWritten < sourceSize +1){
		(void)ASSERT(ferror(destPointer) || feof(destPointer));
		if (ferror(destPointer)){
			perror("Error: file write error");
		}
		if (feof(destPointer)){
			perror("Error: EOF file write error");
		}
		return -1;
	}

	if (!ASSERT(charsWritten > 0)) {
		return -1;
	}
	return 0;
}

static int write_bytes_to_file(const unsigned char * sourceStart, size_t sourceSize, FILE* destPointer){
	if (
		!(ASSERT(sourceStart != NULL) && 
		ASSERT(destPointer != NULL) && 
		ASSERT(sourceSize < HEAP_SIZE))
	) {
		return -1;
	}
	const int byteSize = 1;
	size_t bytesWritten = fwrite(sourceStart, byteSize, sourceSize, destPointer);

	if (sourceSize==0){
		return 0;
	}

	if (bytesWritten < sourceSize){
		(void)ASSERT(ferror(destPointer) || feof(destPointer));
		if (ferror(destPointer)){
			perror("Error: file write error");
		}
		if (feof(destPointer)){
			perror("Error: EOF file write error");
		}
		return -1;
	}

	if (!ASSERT(bytesWritten > 0)) {
		return -1;
	}
	if (!ASSERT(destPointer != NULL) ){
		return -1;
	}
	return 0;
}

static size_t read_to_heap(const char* filename, unsigned char* heapDest){
	if (! is_valid_string(filename) && ASSERT(heapDest != NULL)){
		return (size_t)-1;
	}
	FILE* filePointer = fopen(filename, "rb");
	if (filePointer==NULL){
		fprintf(stderr, "Failed read from %s: %s Does the file exist?\n", filename, strerror(errno));
		return (size_t)-1;
	}
	size_t fileSize = fread(heapDest, 1, (size_t)HEAP_SIZE, filePointer);
	int error = ferror(filePointer);
	int closeResult = fclose(filePointer);
	if (!ASSERT(closeResult == 0)){
		return (size_t)-1;
	}
	if (error){
		fprintf(stderr, "Failed read from %s: %s\n", filename, strerror(errno));
		return -1;
	}
	if (!ASSERT(fileSize < HEAP_SIZE)){
		fprintf(stderr, "Overflow Error: %s has more memory than is available on the heap %s\n", filename, strerror(errno));
		return -1;
	}
	return fileSize;
}

static int copy_heap_to_file(const char* filename, size_t dataSize){
	if (dataSize == 0){
		return 0;
	}
	if (!is_valid_string(filename)){
		return -1;
	}
	FILE* filePointer = fopen(filename, "w");
	if (filePointer == NULL){
		return -1;
	}
	int writeResult = write_text_to_file(g_source_code_pointer, dataSize, filePointer);
	if (!ASSERT(writeResult == 0)){
		fclose(filePointer);
		return -1;
	}
	int fileClose = fclose(filePointer);
	(void)ASSERT(fileClose == 0);
	return fileClose;
}

static int write_input_to_file(const unsigned char* input_pointer,  size_t input_size, const char* filename){
	if (!is_valid_string(filename)){
		return -1;
	}
	if (!(ASSERT(0 < input_size) && ASSERT(input_size < HEAP_SIZE))){
		return -1;
	}
	FILE* file = fopen(filename, "w");
	if (file == NULL){
		return -1;
	}
	const int fileWrite = write_bytes_to_file(input_pointer, input_size, file);
	if (!ASSERT(fileWrite == 0)){
		fclose(file);
		return -1;
	}
	const int fileClose = fclose(file);
	if (!ASSERT(fileClose==0)){
		return -1;
	}
	return 0;
}

static int init_mmix(char* mmoName){
	if (!is_valid_string(mmoName)){
		return -1;
	}
	const int libInit = mmix_lib_initialize();
	if (!ASSERT(libInit ==0)){
		return -1;
	}
	const int mmixInit = mmix_initialize();
	if (!ASSERT(mmixInit ==0)){
		return -1;
	}
	mmix_boot();
	const int loadFile = mmix_load_file(mmoName);
	if (!ASSERT(loadFile == 0)){
		return -1;
	}
	return 0;
}

static int run_mmix_loop(void){
	//note: stdout and stderr here are redirected as user feedback
	int cur;
	for (cur=0; cur< INT32_MAX; cur++){
		if (halted){
			return 0;
		}
		if (!resuming){
			mmix_fetch_instruction();
		}
		mmix_perform_instruction();
		mmix_dynamic_trap();
		if (resuming && op != RESUME){
			resuming = false;
		}
	}
	(void)ASSERT(cur < INT32_MAX);
	return -2;
}

struct Redirect {
	int success;
	int fileno;
};

static int restore_file_directory(int savedFileDirectory, int targetFileDirectory, FILE* stream){
	if (!(ASSERT(savedFileDirectory >= 0) && ASSERT(targetFileDirectory >=0)&& ASSERT(stream != NULL))){
		return -1;
	}
	int fileFlush = fflush(stream);
	if (!ASSERT(fileFlush==0)){
		return -1;
	}
	int restored = dup2(savedFileDirectory, targetFileDirectory);
	if (!ASSERT(restored >=0)){
		return -1;
	}
	int closed = close(savedFileDirectory);
	if(!ASSERT(closed == 0)){
		return -1;
	}
	return 0;
}

struct Outputs{
	struct Redirect stdoutRedirect;
	struct Redirect stderrRedirect;
	char* stdOutLog;
	char* stdErrLog;
	int success;
};

static int is_valid_outputs(struct Outputs outputs){
	if (!(is_valid_string(outputs.stdOutLog) && is_valid_string(outputs.stdErrLog))){
		return 0;
	}
	return 1;
}

static int restore_output(struct Outputs outputs){
	if (!is_valid_outputs(outputs)){
		return -1;
	}
	int restoredStdOut = restore_file_directory(outputs.stdoutRedirect.fileno, STDOUT_FILENO, stdout);
	int restoredStdError = restore_file_directory(outputs.stderrRedirect.fileno, STDERR_FILENO, stderr);
        if (!(ASSERT(restoredStdOut == 0) && ASSERT(restoredStdError == 0))){
		return -1;
	}
	return 0;
}

static struct Redirect redirect_file_directory(const char* filename, int targetFileDirectory, FILE* stream){
	struct Redirect redirect;
	redirect.success = 0;
	redirect.fileno = -1;
	if (!(is_valid_string(filename) && ASSERT(targetFileDirectory >= 0) && ASSERT(stream != NULL))){
		return redirect;
	}
	int fileFlush = fflush(stream);
	if (!ASSERT(fileFlush == 0)){
		return redirect;
	}
	int savedFd = dup(targetFileDirectory);
	if (!ASSERT(savedFd >= 0)){
		return redirect;
	}
	redirect.fileno = savedFd;
	FILE *capture = fopen(filename, "w");
	if (!ASSERT(capture != NULL)){
		int restored = restore_file_directory(savedFd, targetFileDirectory, stream);
		(void)ASSERT(restored == 0);
	} else {
		int duped = dup2(fileno(capture), targetFileDirectory);
		(void)ASSERT(duped >= 0);
		int closed = fclose(capture);
		(void)ASSERT(closed == 0);
		redirect.success = 1;
	}
	return redirect;
}

static struct Outputs redirect_outputs(void){
	struct Outputs outputs;
	outputs.stdErrLog = "stderr.txt";
	outputs.stdOutLog = "stdout.txt";
	int success = 1;
	struct Redirect stderrCapture = redirect_file_directory(outputs.stdErrLog, STDERR_FILENO, stderr);
	success = stderrCapture.success;
	struct Redirect stdoutCapture = redirect_file_directory(outputs.stdOutLog, STDOUT_FILENO, stdout);
	if (!(ASSERT(success) && ASSERT(stdoutCapture.success))){
		int restored = restore_file_directory(stderrCapture.fileno, STDERR_FILENO, stderr);
		(void)ASSERT(restored == 0);
		success = 0;
	}
	outputs.stderrRedirect = stderrCapture;
	outputs.stdoutRedirect = stdoutCapture;
	outputs.success = success;
	return outputs;
}

static int read_outputs_to_heap(struct Outputs outputs){
	if (!is_valid_outputs(outputs)){
		return -1;
	}
	int result = 0;
	g_stdout_len = read_to_heap(outputs.stdOutLog, g_stdout_pointer);
	if (!ASSERT(g_stdout_len < HEAP_SIZE)){
		result =  -2;
	}
	if (g_stdout_len < HEAP_SIZE){
		g_stdout_pointer[g_stdout_len] = '\0';
	}
	g_stderr_len = read_to_heap(outputs.stdErrLog, g_stderr_pointer);
	if (!ASSERT(g_stderr_len < HEAP_SIZE)){
		result = -2;
	}
	if (g_stderr_len < HEAP_SIZE){
		g_stderr_pointer[g_stderr_len] = '\0';
	}
	return result;
}

static int remove_output_files(struct Outputs outputs){
	if (! is_valid_outputs(outputs)){
		return -1;
	}
	int removedOutputLog = remove(outputs.stdOutLog);
	int removedErrorLog = remove(outputs.stdErrLog);
	if (!(ASSERT(removedOutputLog == 0) && ASSERT(removedErrorLog == 0))){
		return -1;
	}
	return 0;
}

static int close_mmix(void){
	int mmixFinalized = mmix_finalize();
	int mmixLibFinalized  = mmix_lib_finalize();
	if (!ASSERT(mmixFinalized == 0) && ASSERT(mmixLibFinalized ==0)){
		return -1;
	}
	return 0;
}

struct AssemblyFileNames {
	char* mmo;
	char* mms;
	char* listing;
};

static int is_valid_assembly_files(struct AssemblyFileNames files){
	if (ASSERT(is_valid_string(files.mmo)) && ASSERT(is_valid_string(files.mms)) && ASSERT(is_valid_string(files.listing))){
		return 1;
	}
	return 0;
}

static int create_assembly_output_files(struct AssemblyFileNames files){
	if (!is_valid_assembly_files(files)){
		return -1;
	}
	int mmoCreate = create_file(files.mmo);
	int txtCreate = create_file(files.listing);
	if (!(ASSERT(txtCreate == 0) && ASSERT(mmoCreate == 0))){
		return -1;
	}
	return 0;
}

static struct AssemblyFileNames init_assembly_file_names(void){
	struct AssemblyFileNames files;
	files.mmo = "program.mmo";
	files.mms = "program.mms";
	files.listing = "listing.txt";
	return files;
}

static int read_assembly_files_to_heap(struct AssemblyFileNames files){
	if (!is_valid_assembly_files(files)){
		return -1;
	}
	g_bin_len =read_to_heap(files.mmo, g_bin_pointer);
	if (!(ASSERT(g_bin_len < HEAP_SIZE) && ASSERT( g_bin_len > 0))){
		return -1;
	}
	g_stdout_len = read_to_heap(files.listing, g_stdout_pointer);
	if (!ASSERT(g_bin_len > 0)){
		return -1;
	}
	if (!ASSERT(g_stdout_len <= HEAP_SIZE - g_bin_len) ){
		perror("Overflow error with listing");
		return -1;
	}
	return 0;
}

static int delete_output_files(struct AssemblyFileNames files){
	if (!is_valid_assembly_files(files)){
		return -1;
	}
	int mmsDelete = remove(files.mms);
	int mmoDelete = remove(files.mmo);
	int txtDelete = remove(files.listing);
	if (!(ASSERT(mmsDelete ==0) && ASSERT(mmoDelete == 0) && ASSERT(txtDelete == 0))){
		return -1;
	}
	return 0;
}

/** See glue.h */
int mmix_simulate(size_t executable_size){
	if (!(ASSERT(0 < executable_size) && ASSERT(executable_size < HEAP_SIZE))){
		return -1;
	}
	char* mmoName ="program.mmo";
	int fileWrite = write_input_to_file(g_bin_pointer, executable_size, mmoName);
	if (!ASSERT(fileWrite == 0)){
		return -1;
	}
	const int initMMIX = init_mmix(mmoName);
	if (!ASSERT(initMMIX==0)){
		return -1;
	}
        struct Outputs outputs = redirect_outputs();
	if (!ASSERT(outputs.success)){
		return -1;
	}
//set up above
	int mmixLoopRun = run_mmix_loop();
//clean up is below
	int restoredOutputs = restore_output(outputs);
	int result = 0;
	int copiedToHeap = read_outputs_to_heap(outputs);
	int removedOutputFiles = remove_output_files(outputs);
	int removedMMO = remove(mmoName);
	int mmixFinalized = close_mmix();
	if (!(ASSERT(removedOutputFiles == 0) && ASSERT(removedMMO == 0) && ASSERT(restoredOutputs == 0) && ASSERT(mmixFinalized == 0))){
		result = -2;
	}
	if (!(ASSERT(mmixLoopRun==0) && ASSERT(copiedToHeap==0))){
		result = -1;
	}
	return result;
}

/** See glue.h */
size_t get_stderr_size(void){
	return g_stderr_len;
}

/** See glue.h */
unsigned char* get_stdout_pointer(void){
	(void)ASSERT(g_stdout_pointer != NULL);
	return g_stdout_pointer;
}

/** See glue.h */
unsigned char* get_stderr_pointer(void){
	(void)ASSERT(g_stderr_pointer != NULL);
	return g_stderr_pointer;
}

/** See glue.h */
unsigned char* get_source_code_pointer(void){
	(void)ASSERT(g_source_code_pointer != NULL);
	return g_source_code_pointer;
}

/** See glue.h */
int assemble_mmixal(size_t len){
	if (len == 0){
		return 0;
	}
	if (!ASSERT(len < HEAP_SIZE)){
		return -1;
	}
	struct AssemblyFileNames files = init_assembly_file_names();
	int writeResult = copy_heap_to_file(files.mms, len);
	if (!ASSERT(writeResult == 0)){
		return -1;
	}
	int filesCreated = create_assembly_output_files(files);
	if (!ASSERT(filesCreated == 0)){
		return -1;
	}
	struct Outputs outputs = redirect_outputs();
	if (!ASSERT(outputs.success)){
		return -1;
	}
	int mmixResult = mmixal(files.mms, files.mmo, files.listing);
	int heapResult = mmixResult == 0 ? read_assembly_files_to_heap(files): read_outputs_to_heap(outputs);
	int restoredOutputsResult = restore_output(outputs);
	int outputRemoveResult = remove_output_files(outputs);
	int deleteResult = delete_output_files(files);
	if (!(ASSERT(restoredOutputsResult == 0) && ASSERT(outputRemoveResult == 0) && ASSERT(heapResult == 0) && ASSERT(deleteResult == 0))){
		return -1;
	}
	return mmixResult;
}

/** See glue.h */
size_t get_stdout_size(void){
	return g_stdout_len;
}

/** See glue.h */
unsigned char* get_binary_pointer(void){
	(void)ASSERT(g_bin_pointer != NULL);
	return g_bin_pointer;
}

/** See glue.h */
size_t get_binary_size(void){
	if (!(ASSERT(g_bin_len > 0) && ASSERT(g_bin_len < HEAP_SIZE))){
		return (size_t)-1;
	}
	return g_bin_len;
}
