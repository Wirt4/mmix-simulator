#include <stdio.h>
#include "assert.h"

void log_error(const char *expression, const char *filename, int linenumber){
	 fprintf(stderr, "Assertion failed: %s (%s:%d)\n", expression, filename, linenumber);
}

