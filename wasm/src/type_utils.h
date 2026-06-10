#ifndef TYPE_UTILS_H
#define TYPE_UTILS_H
#include "mmixlib.h"
tetra get_tetra(octa payload, int partition);
void write_octa(octa *target, tetra high, tetra low);
#endif
