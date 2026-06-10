#ifndef CONSTANTS_H
#define CONSTANTS_H

#define MAX_SRC_SIZE 3*(1 << 10) //3 KiB
#define FILE_NAME_SIZE (1 << 6) //64 chars
#define CYCLES_PER_BATCH 1000
#define STD_ERR_SIZE CYCLES_PER_BATCH * (1<<7) //assumes a max of around 128 chars per line
#define STD_OUT_SIZE STD_ERR_SIZE
#define ARG_SIZE FILE_NAME_SIZE
#define MAX_ARG_COUNT 16
#define MAX_BREAKPOINT_COUNT 64
#endif
