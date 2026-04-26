#ifndef MMIXLIB_WRAPPER_H
#define MMIXLIB_WRAPPER_H
// mirror of mmixlib so can effectively unit test

int mmixal_w(char *mms_name, char *mmo_name, char *mml_name);
/* returns zero on success, 
           negative values on fatal errors, 
		   otherwise the number of errors found in the input
*/
#endif
