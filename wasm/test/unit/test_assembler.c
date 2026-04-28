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
static const unsigned char *captured_wfh_pointer;
static size_t captured_wfh_len;
static char captured_wfh_filename[64];
static int captured_wfh_call_count;

static int capture_file_util(const char *filename, int cmock_num_calls){
	(void)cmock_num_calls;
	strncpy(captured_filename, filename, sizeof(captured_filename) - 1);
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

static int capture_write_from_heap_args(const unsigned char *pointer, size_t len, const char *filename, int cmock_num_calls) {
	(void)cmock_num_calls;
	captured_wfh_pointer = pointer;
	captured_wfh_len = len;
	strncpy(captured_wfh_filename, filename, sizeof(captured_wfh_filename) - 1);
	captured_wfh_call_count++;
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
// function assemble_source()
void test_assemble_returns_zero_on_success(void) {
	file_exists_IgnoreAndReturn(1);
	remove_file_IgnoreAndReturn(0);
	mmixal_w_IgnoreAndReturn(0);
	write_from_heap_IgnoreAndReturn(0);
	int result = assemble_source(10);
	TEST_ASSERT_EQUAL(0, result);
}

void test_assemble_calls_mmixal_w_with_correct_filenames(void) {
	file_exists_IgnoreAndReturn(1);
	remove_file_IgnoreAndReturn(0);
	capture_call_count = 0;
	mmixal_w_StubWithCallback(capture_mmixal_w_args);
	write_from_heap_IgnoreAndReturn(0);
	assemble_source(10);

	TEST_ASSERT_EQUAL_INT(1, capture_call_count);
	TEST_ASSERT_EQUAL_STRING("program.mms", captured_mms);
	TEST_ASSERT_EQUAL_STRING("program.mmo", captured_mmo);
	TEST_ASSERT_NULL(captured_mml);
}

void test_assemble_calls_write_from_heap_with_correct_args(void) {
	file_exists_IgnoreAndReturn(1);
	remove_file_IgnoreAndReturn(0);
	const size_t src_len = 42;
	unsigned char *src = get_source_code_pointer();

	captured_wfh_call_count = 0;
	write_from_heap_StubWithCallback(capture_write_from_heap_args);
	mmixal_w_IgnoreAndReturn(0);

	assemble_source(src_len);

	TEST_ASSERT_EQUAL_INT(1, captured_wfh_call_count);
	TEST_ASSERT_EQUAL_PTR(src, captured_wfh_pointer);
	TEST_ASSERT_EQUAL(src_len, captured_wfh_len);
	TEST_ASSERT_EQUAL_STRING("program.mms", captured_wfh_filename);
}

void test_assemble_returns_nonzero_on_mmixal_failure(void) {
	file_exists_IgnoreAndReturn(1);
	remove_file_IgnoreAndReturn(0);
	mmixal_w_IgnoreAndReturn(5);
	write_from_heap_IgnoreAndReturn(0);
	int result = assemble_source(10);
	TEST_ASSERT_EQUAL(5, result);
}

void test_assemble_returns_negative_if_size_too_large(void) {
	const size_t oversized = MAX_SRC_SIZE + 1;
	int result = assemble_source(oversized);
	TEST_ASSERT_EQUAL(-1, result);
}

void test_assemble_cleans_up_mms(void) {
	write_from_heap_IgnoreAndReturn(0);
	mmixal_w_IgnoreAndReturn(0);

	capture_call_count = 0;
	file_exists_IgnoreAndReturn(1);
	remove_file_StubWithCallback(capture_file_util);
	assemble_source(100);

	TEST_ASSERT_EQUAL_INT(1, capture_call_count);
	TEST_ASSERT_EQUAL_STRING("program.mms", captured_filename);
}

void test_assemble_skips_remove_when_mms_missing(void) {
	write_from_heap_IgnoreAndReturn(0);
	mmixal_w_IgnoreAndReturn(0);

	file_exists_IgnoreAndReturn(0);
	// remove_file should not be called
	assemble_source(100);
}

void test_assemble_returns_negative_on_teardown_failure(void) {
	write_from_heap_IgnoreAndReturn(0);
	mmixal_w_IgnoreAndReturn(0);
	file_exists_IgnoreAndReturn(1);
	remove_file_IgnoreAndReturn(-1);
	int result = assemble_source(100);
	TEST_ASSERT_EQUAL(-1, result);
}

void test_get_mmo_path_returns_mmo_filename(void) {
	const char *path = get_mmo_path();
	TEST_ASSERT_EQUAL_STRING("program.mmo", path);
}

int main(void) {
	UNITY_BEGIN();
	RUN_TEST(test_get_source_code_pointer_is_non_null);
	RUN_TEST(test_assemble_returns_zero_on_success);
	RUN_TEST(test_assemble_calls_mmixal_w_with_correct_filenames);
	RUN_TEST(test_assemble_calls_write_from_heap_with_correct_args);
	RUN_TEST(test_assemble_returns_nonzero_on_mmixal_failure);
	RUN_TEST(test_assemble_returns_negative_if_size_too_large);
	RUN_TEST(test_assemble_cleans_up_mms);
	RUN_TEST(test_assemble_skips_remove_when_mms_missing);
	RUN_TEST(test_assemble_returns_negative_on_teardown_failure);
	RUN_TEST(test_get_mmo_path_returns_mmo_filename);
	return UNITY_END();
}
