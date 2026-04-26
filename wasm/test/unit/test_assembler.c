// cppcheck-suppress missingInclude
#include "unity.h"
// cppcheck-suppress missingInclude
#include "assembler.h"
// cppcheck-suppress missingInclude
#include "mock_mmixlib_wrapper.h"
// cppcheck-suppress missingInclude
#include "mock_io_utils.h"
#include <string.h>
#include <ctype.h>
#include "constants.h"
// involved mocking logic

static char captured_mms[64];
static char captured_mmo[64];
static char captured_filename[64];
static char *captured_mml;
static int capture_call_count;
static unsigned char *captured_wfh_pointer;
static size_t captured_wfh_len;
static char captured_wfh_filename[64];
static int captured_wfh_call_count;
static int captured_void_fn_call_count;

static int capture_file_util(char *filename, int cmock_num_calls){
	(void)cmock_num_calls;
	strncpy(captured_filename, filename, sizeof(captured_mms) - 1);
	capture_call_count++;
	return 0;
}

static int capture_mmixal_w_args(char *mms_name, char *mmo_name, char *mml_name, int cmock_num_calls) {
	(void)cmock_num_calls;
	strncpy(captured_mms, mms_name, sizeof(captured_mms) - 1);
	strncpy(captured_mmo, mmo_name, sizeof(captured_mmo) - 1);
	captured_mml = mml_name;
	capture_call_count++;
	return 0;
}

static int capture_write_from_heap_args(unsigned char *pointer, size_t len, char *filename, int cmock_num_calls) {
	(void)cmock_num_calls;
	captured_wfh_pointer = pointer;
	captured_wfh_len = len;
	strncpy(captured_wfh_filename, filename, sizeof(captured_wfh_filename) - 1);
	captured_wfh_call_count++;
	return 0;
}

static int capture_void(int cmock_num_calls){
	(void)cmock_num_calls;
	captured_void_fn_call_count ++;
	return 0;
}

// unity assets
void setUp(void) {
	mock_mmixlib_wrapper_Init();
	mock_io_utils_Init();
}

void tearDown(void) {
	mock_mmixlib_wrapper_Verify();
	mock_mmixlib_wrapper_Destroy();
	mock_io_utils_Verify();
	mock_io_utils_Destroy();
}
// getters
void test_get_source_code_pointer_is_non_null(void) {
	unsigned char *result = get_source_code_pointer();
	TEST_ASSERT_NOT_NULL(result);
}
// function assemble()
void test_assemble_returns_non_null_on_success(void) {
	file_exists_IgnoreAndReturn(1);
	remove_file_IgnoreAndReturn(0);
	restore_stderr_IgnoreAndReturn(0);
	mmixal_w_IgnoreAndReturn(0);
	redirect_stderr_IgnoreAndReturn(0);
	write_from_heap_IgnoreAndReturn(0);
	char *result = assemble(10);
	TEST_ASSERT_NOT_NULL(result);
}

void test_assemble_returns_correctly_formatted_filename_on_success(void) {
	file_exists_IgnoreAndReturn(1);
	remove_file_IgnoreAndReturn(0);
	restore_stderr_IgnoreAndReturn(0);
	mmixal_w_IgnoreAndReturn(0);
	write_from_heap_IgnoreAndReturn(0);
	redirect_stderr_IgnoreAndReturn(0);
	char *result = assemble(10);
	size_t len = strlen(result);

	TEST_ASSERT_GREATER_THAN(11, len); // "program" (7) + at least 1 digit + ".mmo" (4)
	TEST_ASSERT_EQUAL_STRING_LEN("program", result, 7);
	TEST_ASSERT_EQUAL_STRING(".mmo", result + len - 4);

	for (size_t i = 7; i < len - 4; i++) {
		TEST_ASSERT_TRUE_MESSAGE(isdigit((unsigned char)result[i]),
			"Expected only numeric characters between 'program' and '.mmo'");
	}
}

void test_assemble_calls_mmixal_w_with_matching_mms_and_mmo(void) {
	file_exists_IgnoreAndReturn(1);
	remove_file_IgnoreAndReturn(0);
	restore_stderr_IgnoreAndReturn(0);
	redirect_stderr_IgnoreAndReturn(0);
	capture_call_count = 0;
	mmixal_w_StubWithCallback(capture_mmixal_w_args);
	write_from_heap_IgnoreAndReturn(0);
	assemble(10);

	TEST_ASSERT_EQUAL_INT(1, capture_call_count);

	size_t mms_len = strlen(captured_mms);
	size_t mmo_len = strlen(captured_mmo);

	// arg1: program{timestamp}.mms
	TEST_ASSERT_GREATER_THAN(11, mms_len); // "program" (7) + digit(s) + ".mms" (4)
	TEST_ASSERT_EQUAL_STRING_LEN("program", captured_mms, 7);
	TEST_ASSERT_EQUAL_STRING(".mms", captured_mms + mms_len - 4);

	// arg2: program{timestamp}.mmo
	TEST_ASSERT_GREATER_THAN(11, mmo_len);
	TEST_ASSERT_EQUAL_STRING_LEN("program", captured_mmo, 7);
	TEST_ASSERT_EQUAL_STRING(".mmo", captured_mmo + mmo_len - 4);

	// timestamps match
	size_t ts_mms_len = mms_len - 7 - 4;
	size_t ts_mmo_len = mmo_len - 7 - 4;
	TEST_ASSERT_EQUAL(ts_mms_len, ts_mmo_len);
	TEST_ASSERT_EQUAL_STRING_LEN(captured_mms + 7, captured_mmo + 7, ts_mms_len);

	// arg3: NULL
	TEST_ASSERT_NULL(captured_mml);
}

void test_assemble_calls_write_from_heap_with_correct_args(void) {
	restore_stderr_IgnoreAndReturn(0);
	redirect_stderr_IgnoreAndReturn(0);
	file_exists_IgnoreAndReturn(1);
	remove_file_IgnoreAndReturn(0);
	//as a given, 42 chars of source code have been written to the buffer
	const size_t src_len = 42;
	unsigned char *src = get_source_code_pointer();

	captured_wfh_call_count = 0;
	write_from_heap_StubWithCallback(capture_write_from_heap_args);
	mmixal_w_IgnoreAndReturn(0);

	assemble(src_len);

	TEST_ASSERT_EQUAL_INT(1, captured_wfh_call_count);
	TEST_ASSERT_EQUAL_PTR(src, captured_wfh_pointer);
	TEST_ASSERT_EQUAL(src_len, captured_wfh_len);

	size_t fn_len = strlen(captured_wfh_filename);
	TEST_ASSERT_GREATER_THAN(4, fn_len);
	TEST_ASSERT_EQUAL_STRING(".mms", captured_wfh_filename + fn_len - 4);
}

void test_assemble_returns_null_on_failure(void){
		file_exists_IgnoreAndReturn(1);
		remove_file_IgnoreAndReturn(0);
		restore_stderr_IgnoreAndReturn(0);
		redirect_stderr_IgnoreAndReturn(0);
		mmixal_w_IgnoreAndReturn(5);
		write_from_heap_IgnoreAndReturn(0);
		char *result = assemble(10);
		TEST_ASSERT_EQUAL(NULL, result);
}

void test_assemble_returns_null_if_size_too_large(void){
	const size_t oversized = MAX_SRC_SIZE + 1;
	TEST_ASSERT_EQUAL(NULL, assemble(oversized));
}

void test_assemble_redirects_std_err(void){
	remove_file_IgnoreAndReturn(0);
	restore_stderr_IgnoreAndReturn(0);
	write_from_heap_IgnoreAndReturn(0);
        mmixal_w_IgnoreAndReturn(2);
	captured_void_fn_call_count = 0;
	redirect_stderr_StubWithCallback(capture_void);
	file_exists_IgnoreAndReturn(1);

	assemble(100);
	
	TEST_ASSERT_EQUAL_INT(1, captured_void_fn_call_count);
}

void test_assemble_restores_std_err(void){
	remove_file_IgnoreAndReturn(0);
	file_exists_IgnoreAndReturn(1);
	write_from_heap_IgnoreAndReturn(0);
        mmixal_w_IgnoreAndReturn(2);
	captured_void_fn_call_count = 0;
	redirect_stderr_IgnoreAndReturn(0);
	restore_stderr_StubWithCallback(capture_void);
	
	assemble(100);
	
	TEST_ASSERT_EQUAL_INT(1, captured_void_fn_call_count);
}

void test_successful_mms_removal(void){
	write_from_heap_IgnoreAndReturn(0);
        mmixal_w_IgnoreAndReturn(2);
	redirect_stderr_IgnoreAndReturn(0);	
	restore_stderr_IgnoreAndReturn(0);

	capture_call_count = 0;
	file_exists_IgnoreAndReturn(1);
	remove_file_StubWithCallback(capture_file_util);
	assemble(100);

	TEST_ASSERT_EQUAL_INT(1, capture_call_count);
//assert the file removed was the mms
	TEST_ASSERT_EQUAL_STRING(".mms", captured_filename + strlen(captured_filename)- 4);

}

void test_two_calls_to_exists(void){
	write_from_heap_IgnoreAndReturn(0);
        mmixal_w_IgnoreAndReturn(0); //success means should check for .mmo existence
	redirect_stderr_IgnoreAndReturn(0);	
	restore_stderr_IgnoreAndReturn(0);
	remove_file_IgnoreAndReturn(0);

	capture_call_count = 0;
	file_exists_StubWithCallback(capture_file_util);
	assemble(100);

	TEST_ASSERT_EQUAL_INT(2, capture_call_count);
}

int main(void) {
	UNITY_BEGIN();
	RUN_TEST(test_get_source_code_pointer_is_non_null);
	RUN_TEST(test_assemble_returns_non_null_on_success);
	RUN_TEST(test_assemble_returns_correctly_formatted_filename_on_success);
	RUN_TEST(test_assemble_calls_mmixal_w_with_matching_mms_and_mmo);
	RUN_TEST(test_assemble_calls_write_from_heap_with_correct_args);
	RUN_TEST(test_assemble_returns_null_on_failure);
	RUN_TEST(test_assemble_returns_null_if_size_too_large);
	RUN_TEST(test_assemble_redirects_std_err);
	RUN_TEST(test_assemble_restores_std_err);
	RUN_TEST(test_successful_mms_removal);
	RUN_TEST(test_two_calls_to_exists);
	return UNITY_END();
}
