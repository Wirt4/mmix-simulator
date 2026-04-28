#ifndef TYPES_H
#define TYPES_H

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
#endif
