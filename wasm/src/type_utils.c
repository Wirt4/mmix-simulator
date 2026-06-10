#include "type_utils.h"

tetra get_tetra(octa payload, int partition){
	// partition is 0 for higher bits, 1 for lower: reflects big endian architecture
	return partition ? payload.l : payload.h; 
}

void write_octa(octa *target, tetra high, tetra low){
	target->h = high;
	target->l = low;
}
