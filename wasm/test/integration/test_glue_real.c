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
    mmix_initialize_simulator();
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

    mmix_initialize_simulator();
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

    mmix_initialize_simulator();
    mmix_perform_instructions(100);
    mmix_finalize_simulator();

    // If we reach here, perform_instructions respected the instruction limit.
    // If it didn't, the alarm fires and fails with a timeout message.
    TEST_PASS();
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_source_code_pointer_is_non_null);
    RUN_TEST(test_assemble_mmixal_error);
    RUN_TEST(test_assemble_mmixal_error_output);
    RUN_TEST(test_assemble_mmixal_is_non_null);
    RUN_TEST(test_stdout_pointer_is_non_null);
    RUN_TEST(test_stderr_is_non_null);
    RUN_TEST(test_simulation_error);
    RUN_TEST(test_mmix_simulate_hello_world_std_out);
    RUN_TEST(test_perform_instructions_terminates_on_infinite_loop);
    return UNITY_END();
}
