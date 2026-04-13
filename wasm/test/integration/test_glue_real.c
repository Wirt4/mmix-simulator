// cppcheck-suppress missingInclude
#include "unity.h"
// cppcheck-suppress missingInclude
#include "glue.h"
#include <string.h>
// necessary for Unity
// cppcheck-suppress unusedFunction
void setUp(void) {}
// cppcheck-suppress unusedFunction
void tearDown(void) {}

static const char *hello_world_source =
    "\tLOC\tData_Segment\n"
    "\tGREG\t@\n"
    "Text\tBYTE\t\"Hello world!\",10,0\n"
    "\n"
    "\tLOC\t#100\n"
    "Main\tLDA\t$255,Text\n"
    "\tTRAP\t0,Fputs,StdOut\n"
    "\tTRAP\t0,Halt,0\n";

/* Bytes 4-7 are a timestamp in the .mmo preamble and change each run */
#define TIMESTAMP_OFFSET 4
#define TIMESTAMP_SIZE 4

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

static void test_heap_start_pointer_is_non_null(void){
  TEST_ASSERT_NOT_NULL(get_heap_start_pointer());
}

static void test_assemble_mmixal_is_non_null(void){
    int len =(int)strlen(hello_world_source);
    char unsigned *buf = get_heap_start_pointer(); 
    memcpy(buf, hello_world_source, len + 1);
    TEST_ASSERT_EQUAL(0, assemble_mmixal(len));
}

static void test_assemble_mmixal_output_binary(void) {
    int len = (int)strlen(hello_world_source);
    char unsigned *buf = get_heap_start_pointer();
    memcpy(buf, hello_world_source, len + 1);
    assemble_mmixal(len);
    size_t binary_size = get_binary_result_size();
    TEST_ASSERT_EQUAL(sizeof(expected_binary), binary_size);
    unsigned char *binary = get_binary_result_pointer();
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
    char unsigned *buf = get_heap_start_pointer();
    memcpy(buf, hello_world_source, len + 1);
    assemble_mmixal(len);
    size_t listing_size = get_listing_result_size();
    char *listing = (char *)get_listing_result_pointer();
    TEST_ASSERT_NOT_NULL(listing);
    TEST_ASSERT_EQUAL(strlen(expected_listing), listing_size);
    TEST_ASSERT_EQUAL_STRING_LEN(expected_listing, listing, listing_size);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_heap_start_pointer_is_non_null);
    RUN_TEST(test_assemble_mmixal_is_non_null);
    RUN_TEST(test_assemble_mmixal_output_binary);
    RUN_TEST(test_assemble_mmixal_output_listing);
    return UNITY_END();
}
