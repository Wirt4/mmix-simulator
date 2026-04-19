// cppcheck-suppress missingInclude
#include "unity.h"
// cppcheck-suppress missingInclude
#include "glue.h"
#include <string.h>
#include <unistd.h>
#include <fcntl.h>

// necessary for Unity
// cppcheck-suppress unusedFunction
void setUp(void) {
}

// cppcheck-suppress unusedFunction
void tearDown(void) {
}

static const char *stderr_program_source =
    "\tLOC\tData_Segment\n"
    "\tGREG\t@\n"
    "Text\tBYTE\t\"Error message!\",10,0\n"
    "\n"
    "\tLOC\t#100\n"
    "Main\tLDA\t$255,Text\n"
    "\tTRAP\t0,Fputs,StdErr\n"
    "\tTRAP\t0,Halt,0\n";

static const char *hello_world_source =
    "\tLOC\tData_Segment\n"
    "\tGREG\t@\n"
    "Text\tBYTE\t\"Hello world!\",10,0\n"
    "\n"
    "\tLOC\t#100\n"
    "Main\tLDA\t$255,Text\n"
    "\tTRAP\t0,Fputs,StdOut\n"
    "\tTRAP\t0,Halt,0\n";

// static const char*expected_stdout ="Hello world!";
// /* Bytes 4-7 are a timestamp in the .mmo preamble and change each run */
#define TIMESTAMP_OFFSET 4
#define TIMESTAMP_SIZE 4
//
static const unsigned char expected_binary[] = {
    0x98,0x09,0x01,0x01,0x00,0x00,0x00,0x00,0x98,0x01,0x20,0x01,0x00,0x00,0x00,0x00,
    0x48,0x65,0x6c,0x6c,0x6f,0x20,0x77,0x6f,0x72,0x6c,0x64,0x21,0x0a,0x00,0x00,0x00,
    0x98,0x01,0x00,0x01,0x00,0x00,0x01,0x00,0x98,0x06,0x00,0x03,0x70,0x72,0x6f,0x67,
    0x72,0x61,0x6d,0x2e,0x6d,0x6d,0x73,0x00,0x98,0x07,0x00,0x06,0x23,0xff,0xfe,0x00,
    0x00,0x00,0x07,0x01,0x00,0x00,0x00,0x00,0x98,0x0a,0x00,0xfe,0x20,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x98,0x0b,0x00,0x00,
    0x20,0x3a,0x40,0x50,0x10,0x40,0x40,0x20,0x4d,0x20,0x61,0x20,0x69,0x02,0x6e,0x01,
    0x00,0x81,0x10,0x40,0x40,0x20,0x54,0x20,0x65,0x20,0x78,0x09,0x74,0x00,0x82,0x00,
    0x98,0x0c,0x00,0x08
};

static const size_t expected_binary_size = 132;

static const char *expected_listing =
    "                   \tLOC\tData_Segment\n"
    "($254=#20000000    \tGREG\t@\n"
    "         00000000)\n"
    "2000000000000000:  Text\tBYTE\t\"Hello world!\",10,0\n"
    " ...000: 48656c6c\n"
    " ...004: 6f20776f\n"
    " ...008: 726c6421\n"
    " ...00c: 0a00    \n"
    "                   \n"
    "                   \tLOC\t#100\n"
    "0000000000000100:  Main\tLDA\t$255,Text\n"
    " ...100: 23fffe00\n"
    " ...104: 00000701  \tTRAP\t0,Fputs,StdOut\n"
    " ...108: 00000000  \tTRAP\t0,Halt,0\n"
    "                   \n"
    "\n"
    "Symbol table:\n"
    " Main = #0000000000000100 (1)\n"
    " Text = #2000000000000000 (2)\n";

static const char *expected_output = "Hello world!\n";
static const char *expected_stderr ="Error message!\n";

static const char *bad_mmixal_source =
    "\tLOC\t#100\n"
    "Main\tBADOP\t1,2,3\n"
    "\tALSOBAD\t4,5,6\n"
    "\tTRAP\t0,Halt,0\n";

static const char *expected_assembly_stderr =
    "\"program.mms\", line 2: unknown operation code `BADOP'!\n"
    "\"program.mms\", line 3: unknown operation code `ALSOBAD'!\n"
    "\"program.mms\", line 5: undefined symbol: Main!\n"
    "\"program.mms\", line 5: (3 errors were found.)!\n";

static void test_stdout_pointer_is_non_null(void){
    TEST_ASSERT_NOT_NULL(get_stdout_pointer());
}

static void test_source_code_pointer_is_non_null(void){
    TEST_ASSERT_NOT_NULL(get_source_code_pointer());
}

static void test_assemble_mmixal_is_non_null(void){
    int len =(int)strlen(hello_world_source);
    char unsigned *buf = get_source_code_pointer();
    memcpy(buf, hello_world_source, len + 1);
    TEST_ASSERT_EQUAL(0, assemble_mmixal(len));
}

static void test_assemble_mmixal_output_binary(void) {
    int len = (int)strlen(hello_world_source);
    char unsigned *buf = get_source_code_pointer();
    memcpy(buf, hello_world_source, len + 1);

    assemble_mmixal(len);
    size_t binary_size = get_binary_size();

    TEST_ASSERT_EQUAL(expected_binary_size, binary_size);
    unsigned char *binary = get_binary_pointer();
    TEST_ASSERT_NOT_NULL(binary);
    /* Compare preamble before timestamp */
    TEST_ASSERT_EQUAL_HEX8_ARRAY(expected_binary, binary, TIMESTAMP_OFFSET);
    /* Compare everything after timestamp */
    TEST_ASSERT_EQUAL_HEX8_ARRAY(
        expected_binary + TIMESTAMP_OFFSET + TIMESTAMP_SIZE,
        binary + TIMESTAMP_OFFSET + TIMESTAMP_SIZE,
        binary_size - TIMESTAMP_OFFSET - TIMESTAMP_SIZE);
}

static void test_assemble_mmixal_output_listing(void){
    int len = (int)strlen(hello_world_source);
    char unsigned *buf = get_source_code_pointer();
    memcpy(buf, hello_world_source, len + 1);

    assemble_mmixal(len);
    size_t listing_size = get_stdout_size();
    char *listing = (char *)get_stdout_pointer();

    TEST_ASSERT_NOT_NULL(listing);
    TEST_ASSERT_EQUAL(strlen(expected_listing), listing_size);
    TEST_ASSERT_EQUAL_STRING(expected_listing, listing);
}

static void test_mmix_simulate_hello_world_clean_return(void){
    char unsigned *buf = get_binary_pointer();
    memcpy(buf, expected_binary, expected_binary_size);
    int result = mmix_simulate(expected_binary_size);
    TEST_ASSERT_EQUAL_INT(0, result);
}

static void test_mmix_simulate_hello_world_bad_input(void){
     int result = mmix_simulate(0);
     TEST_ASSERT_NOT_EQUAL_INT(0, result);
}

static void test_stderr_is_non_null(void){
    TEST_ASSERT_NOT_NULL(get_stderr_pointer());
}

static void test_mmix_simulate_stderr(void) {
    int len = (int)strlen(stderr_program_source);
    unsigned char *buf = get_source_code_pointer();
    memcpy(buf, stderr_program_source, len + 1);
    assemble_mmixal(len);
    size_t bin_size = get_binary_size();
    mmix_simulate(bin_size);
    size_t stderr_size = get_stderr_size();
    unsigned char *stderr = get_stderr_pointer();
    TEST_ASSERT_EQUAL(strlen(expected_stderr), stderr_size);
    TEST_ASSERT_EQUAL_STRING(expected_stderr, stderr);
}

static void  test_mmix_simulate_hello_world_std_out(void) {
    char unsigned *buf = get_binary_pointer();
    memcpy(buf, expected_binary, expected_binary_size);

    mmix_simulate(expected_binary_size);
    char unsigned *stdout = get_stdout_pointer();
    size_t stdout_size = get_stdout_size();
    TEST_ASSERT_EQUAL(strlen(expected_output), stdout_size);
    TEST_ASSERT_EQUAL_STRING(expected_output, stdout);
}

static void test_assemble_mmixal_error(void) {
    int len = (int)strlen(bad_mmixal_source);
    unsigned char *buf = get_source_code_pointer();
    memcpy(buf, bad_mmixal_source, len + 1);

    int result = assemble_mmixal(len);

    TEST_ASSERT_EQUAL_INT(4, result);
}

static void test_assemble_mmixal_error_output(void) {
    int len = (int)strlen(bad_mmixal_source);
    unsigned char *buf = get_source_code_pointer();
    memcpy(buf, bad_mmixal_source, len + 1);

    assemble_mmixal(len);

    size_t stderr_size = get_stderr_size();
    unsigned char *stderr_buf = get_stderr_pointer();
    TEST_ASSERT_EQUAL(strlen(expected_assembly_stderr), stderr_size);
    TEST_ASSERT_EQUAL_STRING(expected_assembly_stderr, stderr_buf);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_stdout_pointer_is_non_null);
    RUN_TEST(test_source_code_pointer_is_non_null);
    RUN_TEST(test_assemble_mmixal_is_non_null);
    RUN_TEST(test_assemble_mmixal_output_binary);
    RUN_TEST(test_assemble_mmixal_output_listing);
    RUN_TEST(test_mmix_simulate_hello_world_clean_return);
    RUN_TEST(test_mmix_simulate_hello_world_bad_input);
    RUN_TEST(test_stderr_is_non_null);
    RUN_TEST(test_mmix_simulate_stderr);
    RUN_TEST(test_mmix_simulate_hello_world_std_out);
    RUN_TEST(test_assemble_mmixal_error);
    RUN_TEST(test_assemble_mmixal_error_output);
    return UNITY_END();
}
