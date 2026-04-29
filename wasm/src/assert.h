#ifndef ASSERT_H
#define ASSERT_H
/*
 * below macro returns 1 if e evaluates to true, 
 * else it calls "log_error" with the expression(stringified), filename, and current line number,
 *  then returns false
 * */ 
#define ASSERT(e) \
    ((e) ? 1 : (log_error(#e, __FILE__, __LINE__), 0))

/*
 * Prints a formatted message to stderr
 Intended to be called by ASSERT macro
``
int is_valid_string(const char*string){
	if (!(ASSERT(string != NULL)&& ASSERT(string[0] != '\0'))){
		return 0;
	}
	return 1;
}
``
*/
void log_error(const char *expression, const char *filename, int linenumber);

#endif
