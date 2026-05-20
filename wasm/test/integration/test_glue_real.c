// cppcheck-suppress missingInclude
#include "unity.h"
// cppcheck-suppress missingInclude
#include "glue.h"
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <signal.h>

static int g_tty_fd = -1;

static void timeout_handler(int sig) {
    (void)sig;
    const char msg[] = "\nFAIL: Test timed out (1 second)\n";
    if (g_tty_fd >= 0)
        write(g_tty_fd, msg, sizeof(msg) - 1);
    _exit(1);
}

void setUp(void) {
}

void tearDown(void) {
    alarm(0);
    if (g_tty_fd >= 0) {
        close(g_tty_fd);
        g_tty_fd = -1;
    }
}

static const char *commandline_program_source =
    "argv\tIS\t$1\n"
    "\tLOC\t#100\n"
    "Main\tLDOU\t$255,argv,0\n"
    "\tTRAP\t0,Fputs,StdOut\n"
    "\tGETA\t$255,Comma\n"
    "\tTRAP\t0,Fputs,StdOut\n"
    "\tLDOU\t$255,argv,8\n"
    "\tTRAP\t0,Fputs,StdOut\n"
    "\tGETA\t$255,Newline\n"
    "\tTRAP\t0,Fputs,StdOut\n"
    "\tTRAP\t0,Halt,0\n"
    "Comma\tBYTE\t\", \",0,0\n"
    "Newline\tBYTE\t#a,0";

static const char *one_arg_program_source =
    "argv\tIS\t$1\n"
    "\tLOC\t#100\n"
    "Main\tLDOU\t$255,argv,0\n"
    "\tTRAP\t0,Fputs,StdOut\n"
    "\tGETA\t$255,Newline\n"
    "\tTRAP\t0,Fputs,StdOut\n"
    "\tTRAP\t0,Halt,0\n"
    "Newline\tBYTE\t#a,0";

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

static const char *expected_output = "Hello world!\n";
static const char *expected_stderr ="Error message!\n";

static const char*expected_add_two_numbers_listing ="                   \tLOC\t#100\n"
 " ...100: e301001e  Main\tSET\t$1,30\n"
 " ...104: e302000c  \tSET\t$2,12\n"
 " ...108: 20000102  \tADD\t$0,$1,$2\n"
 " ...10c: 00000000  \tTRAP\t0,Halt,0\n"
 "\n"
 "Symbol table:\n"
 " Main = #0000000000000100 (1)\n";

static const char *bad_mmixal_source =
    "\tLOC\t#100\n"
    "Main\tBADOP\t1,2,3\n"
    "\tALSOBAD\t4,5,6\n"
    "\tTRAP\t0,Halt,0\n";

static const char *infinite_loop_source =
    "\tLOC\t#100\n"
    "\tJMP\tMain\n"
    "Hello\tBYTE\t\"hello\",#a,0\n"
    "Main\tGETA\t$255,Hello\n"
    "\tTRAP\t0,Fputs,StdOut\n"
    "\tJMP\tMain\n";

static const char *add_two_numbers_source =
    "\tLOC\t#100\n"
    "Main\tSET\t$1,30\n"
    "\tSET\t$2,12\n"
    "\tADD\t$0,$1,$2\n"
    "\tTRAP\t0,Halt,0\n";

static const char *set_and_negate_source =
    "\tLOC\t#100\n"
    "Main\tSET\t$0,100\n"
    "\tNEG\t$1,0,$0\n"
    "\tTRAP\t0,Halt,0\n";

static const char *expected_assembly_stderr =
    "\"program.mms\", line 2: unknown operation code `BADOP'!\n"
    "\"program.mms\", line 3: unknown operation code `ALSOBAD'!\n"
    "\"program.mms\", line 4: undefined symbol: Main!\n"
    "\"program.mms\", line 4: (3 errors were found.)!\n";

static void test_source_code_pointer_is_non_null(void){
    TEST_ASSERT_NOT_NULL(get_source_code_pointer());

}
static void test_stdout_pointer_is_non_null(void){
    TEST_ASSERT_NOT_NULL(get_stdout_pointer());
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
    char errMsg[get_stderr_size()];
    strcpy(errMsg, (char*)get_stderr_pointer());

    TEST_ASSERT_EQUAL_STRING(expected_assembly_stderr, errMsg);
}

static void test_assemble_mmixal_is_non_null(void){
    int len =(int)strlen(hello_world_source);
    char unsigned *buf = get_source_code_pointer();
    memcpy(buf, hello_world_source, len + 1);

    int result = assemble_mmixal(len);

    TEST_ASSERT_EQUAL(0, result);
}

static void test_assemble_mmixal_listing(void){
    int len =(int)strlen(add_two_numbers_source);
    char unsigned *buf = get_source_code_pointer();
    memcpy(buf, add_two_numbers_source, len + 1);

    assemble_mmixal(len);
    char listing[get_listing_size()];
    strcpy(listing, (char*)get_listing_pointer());
    TEST_ASSERT_EQUAL_STRING(expected_add_two_numbers_listing, listing); 
}

static void test_stderr_is_non_null(void){
    TEST_ASSERT_NOT_NULL(get_stderr_pointer());
}

static void test_simulation_error(void) {
    int len = (int)strlen(stderr_program_source);
    unsigned char *buf = get_source_code_pointer();
    memcpy(buf, stderr_program_source, len + 1);
    int assembled = assemble_mmixal(len);
    TEST_ASSERT_EQUAL_INT(0, assembled);

    //TODO replace with the set of three
    mmix_initialize_simulator(0);
    mmix_perform_instructions(10);
    mmix_finalize_simulator();

    size_t stderr_size = get_stderr_size();
    unsigned char *stderr_out = get_stderr_pointer();
    TEST_ASSERT_EQUAL(strlen(expected_stderr), stderr_size);
    TEST_ASSERT_EQUAL_STRING(expected_stderr, stderr_out);
}

static void test_mmix_simulate_hello_world_std_out(void) {
    int len = (int)strlen(hello_world_source);
    unsigned char *buf = get_source_code_pointer();
    memcpy(buf, hello_world_source, len + 1);
    int assembled = assemble_mmixal(len);
    TEST_ASSERT_EQUAL_INT(0, assembled);

    mmix_initialize_simulator(0);
    mmix_perform_instructions(50);
    mmix_finalize_simulator();

    const unsigned char *stdout_out = get_stdout_pointer();
    char output[get_stdout_size()];
    strcpy(output, (char*)stdout_out);

    TEST_ASSERT_EQUAL_STRING(expected_output, output);
}

static void test_perform_instructions_terminates_on_infinite_loop(void) {
    g_tty_fd = dup(STDERR_FILENO);
    signal(SIGALRM, timeout_handler);
    alarm(1);

    int len = (int)strlen(infinite_loop_source);
    unsigned char *buf = get_source_code_pointer();
    memcpy(buf, infinite_loop_source, len + 1);
    int assembled = assemble_mmixal(len);
    TEST_ASSERT_EQUAL_INT(0, assembled);

    mmix_initialize_simulator(0);
    mmix_perform_instructions(100);
    mmix_finalize_simulator();

    // If we reach here, perform_instructions respected the instruction limit.
    // If it didn't, the alarm fires and fails with a timeout message.
    TEST_PASS();
}

static void test_add_two_numbers_register_value(void) {
    int len = (int)strlen(add_two_numbers_source);
    unsigned char *buf = get_source_code_pointer();
    memcpy(buf, add_two_numbers_source, len + 1);
    int assembled = assemble_mmixal(len);
    TEST_ASSERT_EQUAL_INT(0, assembled);

    mmix_initialize_simulator(0);
    mmix_perform_instructions(50);
    mmix_finalize_simulator();

    // $0 = 30 + 12 = 42, fits in low tetra
    unsigned int low = get_register_data(0, 0, 1);
    unsigned int high = get_register_data(0, 0, 0);
    TEST_ASSERT_EQUAL_UINT(42, low);
    TEST_ASSERT_EQUAL_UINT(0, high);
}

static void test_set_and_negate_register_value(void) {
    int len = (int)strlen(set_and_negate_source);
    unsigned char *buf = get_source_code_pointer();
    memcpy(buf, set_and_negate_source, len + 1);
    int assembled = assemble_mmixal(len);
    TEST_ASSERT_EQUAL_INT(0, assembled);

    mmix_initialize_simulator(0);
    mmix_perform_instructions(50);
    mmix_finalize_simulator();

    // $0 should be 100 (low tetra)
    unsigned int r0_low = get_register_data(0, 0, 1);
    TEST_ASSERT_EQUAL_UINT(100, r0_low);

    // $1 = NEG 0,100 = -100, which in unsigned 64-bit is 0xFFFFFFFF FFFFFF9C
    unsigned int r1_high = get_register_data(0, 1, 0);
    unsigned int r1_low = get_register_data(0, 1, 1);
    TEST_ASSERT_EQUAL_HEX32(0xFFFFFFFF, r1_high);
    TEST_ASSERT_EQUAL_HEX32(0xFFFFFF9C, r1_low);
}

static void test_commandline_args(void){
    char* expected = "Hello, Clarice\n";
    //get length of hello world code
    int len = (int)strlen(commandline_program_source);
    //use length and source code pointer to write the source to memory
    memcpy(get_source_code_pointer(), commandline_program_source, len + 1);
    assemble_mmixal(len);

    const char *argv[] = {"Hello", "Clarice"};
    unsigned char *pointer = get_args_pointer();

    for (int i = 0; i< 2; i++){
        memcpy(pointer, argv[i], (int)strlen(argv[i]) + 1);
        pointer += arg_size();
    }

    mmix_initialize_simulator(2);
    mmix_perform_instructions(50);
    mmix_finalize_simulator();

    const unsigned char *stdout_out = get_stdout_pointer();
    char result[get_stdout_size()];
    strcpy(result, (char*)stdout_out);

    TEST_ASSERT_EQUAL_STRING(expected, result);
}

static void test_commandline_one_arg(void){
    char* expected = "World\n";
    int len = (int)strlen(one_arg_program_source);
    memcpy(get_source_code_pointer(), one_arg_program_source, len + 1);
    assemble_mmixal(len);

    const char *argv[] = {"World"};
    unsigned char *pointer = get_args_pointer();
    memcpy(pointer, argv[0], (int)strlen(argv[0]) + 1);

    mmix_initialize_simulator(1);
    mmix_perform_instructions(15);
    mmix_finalize_simulator();

    const unsigned char *stdout_out = get_stdout_pointer();
    char result[get_stdout_size()];
    strcpy(result, (char*)stdout_out);

    TEST_ASSERT_EQUAL_STRING(expected, result);
}

static void test_commandline_args_different_data(void){
    char* expected = "Foo, Bar\n";
    int len = (int)strlen(commandline_program_source);
    memcpy(get_source_code_pointer(), commandline_program_source, len + 1);
    assemble_mmixal(len);

    const char *argv[] = {"Foo", "Bar"};
    unsigned char *pointer = get_args_pointer();

    for (int i = 0; i< 2; i++){
        memcpy(pointer, argv[i], (int)strlen(argv[i]) + 1);
        pointer += arg_size();
    }

    mmix_initialize_simulator(2);
    mmix_perform_instructions(15);
    mmix_finalize_simulator();

    const unsigned char *stdout_out = get_stdout_pointer();
    char result[get_stdout_size()];
    strcpy(result, (char*)stdout_out);

    TEST_ASSERT_EQUAL_STRING(expected, result);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_source_code_pointer_is_non_null);
    RUN_TEST(test_assemble_mmixal_error);
    RUN_TEST(test_assemble_mmixal_error_output);
    RUN_TEST(test_assemble_mmixal_is_non_null);
    RUN_TEST(test_assemble_mmixal_listing);
    RUN_TEST(test_stdout_pointer_is_non_null);
    RUN_TEST(test_stderr_is_non_null);
    RUN_TEST(test_simulation_error);
    RUN_TEST(test_mmix_simulate_hello_world_std_out);
    RUN_TEST(test_perform_instructions_terminates_on_infinite_loop);
    RUN_TEST(test_add_two_numbers_register_value);
    RUN_TEST(test_set_and_negate_register_value);
    RUN_TEST(test_commandline_args);
    RUN_TEST(test_commandline_one_arg);
    RUN_TEST(test_commandline_args_different_data);
    return UNITY_END();
}
