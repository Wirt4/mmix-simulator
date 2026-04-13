#include <assert.h>
#include <stdio.h>
#include <errno.h>
#include <string.h>
#include <stdbool.h>
#include "glue.h"
#include "mmix_interface.h"
// to get frequent asserts without crashing the program
#define ASSERT(e) \
    ((e) ? 1 : (log_error(#e, __FILE__, __LINE__), 0))
#define HEAP_START 0
#define HEAP_SIZE (1 << 24) //16 MiB
static unsigned char g_heap_start[HEAP_SIZE];
static size_t g_bin_len;
static size_t g_listing_len;

static void log_error(const char *expr, const char *file, int line) {
    fprintf(stderr, "Assertion failed: %s (%s:%d)\n", expr, file, line);
}

unsigned char* get_heap_start_pointer(void){
	ASSERT(g_heap_start != NULL);
	return g_heap_start;
}

static FILE* open_file(const char*filename, int isWriteMode){
	if (!(ASSERT(filename !=NULL) && (ASSERT (filename[0]!='\0'))) ){return NULL;}
	const char* modeArg = isWriteMode == true ? "w" : "rb";
	FILE* pointer = fopen(filename, modeArg);
	ASSERT(pointer != NULL);
	return pointer;
}

static int close_file(FILE* pointer){
	if (!ASSERT(pointer != NULL)){return -1;}
	int result = fclose(pointer);
	ASSERT(result == 0);
	return result;
}

static int create_file(const char*filename){
	if (!(ASSERT(filename!=NULL) && ASSERT(filename[0]!='\0'))) {return -1;}
	FILE * filePointer = open_file(filename, true);
	if (!ASSERT(filePointer != NULL)){return -1;}
	int result = close_file(filePointer);
	ASSERT(result == 0);
        return result;
}

static int write_text_to_file(const unsigned char * sourceStart, size_t sourceSize, FILE* destPointer){
	if (!(ASSERT(sourceStart != NULL) && ASSERT(destPointer != NULL) && ASSERT(sourceSize < HEAP_SIZE))) {
		return -1;
	}
	if (sourceSize==0){
		return 0;
	}
	size_t charsWritten = fwrite(sourceStart, sizeof(char), sourceSize + 1, destPointer);
	if (charsWritten < sourceSize +1){
		ASSERT(ferror(destPointer) || feof(destPointer));
		if (ferror(destPointer)){
			perror("Error: file write error");
		}
		if (feof(destPointer)){
			perror("Error: EOF file write error");
		}
		return -1;
	}

	if (!ASSERT(charsWritten > 0)) {return -1;}
	return 0;
}

static int delete_file(const char* filename){
	if (!(ASSERT(filename != NULL) && ASSERT(filename[0] != '\0'))){
		return -1;
	}
	int result = remove(filename);
	ASSERT(result == 0);
	return result;
}

static size_t read_to_heap(const char* filename, unsigned char* heapDest, size_t maxSize){
	if (!(ASSERT(filename != NULL) && ASSERT(filename[0] !='\0') && ASSERT(heapDest != NULL))){
		return (size_t)-1;
	}
	if (!(ASSERT((heapDest < (g_heap_start + HEAP_SIZE))) && ASSERT(heapDest >= g_heap_start))){
		return (size_t)-1;
	}
	FILE* filePointer = open_file(filename, false);
	if (filePointer==NULL){
		fprintf(stderr, "Failed read from %s: %s Does the file exist?\n", filename, strerror(errno));
		return (size_t)-1;
	}
	size_t fileSize = fread(heapDest, 1, maxSize, filePointer);
	int error = ferror(filePointer);
	int closeResult = close_file(filePointer);
	if (!ASSERT(closeResult == 0)){
		return (size_t)-1;
	}
	if (error){
		fprintf(stderr, "Failed read from %s: %s\n", filename, strerror(errno));
		return -1;
	}
	if (!ASSERT(fileSize < maxSize)){
		fprintf(stderr, "Overflow Error: %s has more memory than is available on the heap %s\n", filename, strerror(errno));
		return -1;
	}

	return fileSize;
}

static int copy_heap_to_file(const char* filename, size_t dataSize){
	if (!(ASSERT(filename != NULL) && ASSERT(filename[0]!='\0'))){
		return -1;
	}
	FILE* filePointer = open_file(filename, true);
	if (!ASSERT(filePointer != NULL)){
		return -1;
	}
	int writeResult = write_text_to_file(g_heap_start, dataSize, filePointer);
	if (!ASSERT(writeResult == 0)){
		return -1;
	}
	int fileClose = close_file(filePointer);
	ASSERT(fileClose == 0);
	return fileClose;
}

int assemble_mmixal(size_t len){
	if (!(ASSERT(len > 0) && ASSERT(len < HEAP_SIZE))){
		return -1;
	}
	char* mmsName ="program.mms";
	int writeResult = copy_heap_to_file(mmsName, len);
	if (!ASSERT(writeResult == 0)){
		return -1;
	}
	char * mmoName = "program.mmo";
	char * txtName = "listing.txt";
	int mmoCreate = create_file(mmoName);
	int txtCreate = create_file(txtName);
	if (!(ASSERT(txtCreate == 0) && ASSERT(mmoCreate == 0))){
		return -1;
	}
	int mmixResult = mmixal(mmsName, mmoName, txtName);
	if (!ASSERT(mmixResult == 0)){return -1;}
	g_bin_len = read_to_heap(mmoName, g_heap_start, HEAP_SIZE);
	if (!(ASSERT(g_bin_len < HEAP_SIZE) && ASSERT( g_bin_len > 0))){
		return -1;
	}
	unsigned char *listingStart = g_heap_start + g_bin_len;
	g_listing_len = read_to_heap(txtName, listingStart, HEAP_SIZE-g_bin_len);
	if (!ASSERT(g_bin_len > 0)){
		return -1;
	}
	if (!ASSERT(g_listing_len <= HEAP_SIZE - g_bin_len) ){
		perror("Overflow error with listing");
		return -1;
	}
	int mmsDelete = delete_file(mmsName);
	int mmoDelete = delete_file(mmoName);
	int txtDelete = delete_file(txtName);
	if (!(ASSERT(mmsDelete ==0) && ASSERT(mmoDelete == 0) && ASSERT(txtDelete == 0))){
		return -1;
	}
	return 0; 
}

unsigned char* get_binary_result_pointer(void){
	ASSERT(g_heap_start != NULL);
	return g_heap_start;
}

size_t get_binary_result_size(void){
	if (!(ASSERT(g_bin_len > 0) && ASSERT(g_bin_len < HEAP_SIZE))){
		return (size_t)-1;
	}
	return g_bin_len;
}

unsigned char* get_listing_result_pointer(void){
	if (!ASSERT(g_heap_start != NULL)){
		return NULL;
	}
	unsigned char* result = g_heap_start + g_bin_len;
	if (!ASSERT(result > g_heap_start)){
		return NULL;
	}
	return result;
}

size_t get_listing_result_size(void){
	if (!ASSERT(g_listing_len > 0)){
		return (size_t)-1;
	}
	return g_listing_len;
}

