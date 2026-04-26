// cppcheck-suppress missingInclude
#include "unity.h"
// cppcheck-suppress missingInclude
#include "simulator.h"
// cppcheck-suppress missingInclude
#include "mock_mmixlib_wrapper.h"
#include "mock_io_utils.h"
#include <string.h>
#include "constants.h"

// unity assets
void setUp(void) {
	mock_mmixlib_wrapper_Init();
}

void tearDown(void) {
	mock_mmixlib_wrapper_Verify();
	mock_mmixlib_wrapper_Destroy();
}

// initialize_simulator tests

void test_initialize_returns_negative_on_null_input(void) {
	int result = initialize_simulator(NULL);
	TEST_ASSERT_EQUAL_INT(-1, result);
}

void test_initialize_returns_negative_on_oversized_filename(void) {
	char oversized[FILE_NAME_SIZE + 1];
	memset(oversized, 'a', FILE_NAME_SIZE);
	oversized[FILE_NAME_SIZE] = '\0';
	int result = initialize_simulator(oversized);
	TEST_ASSERT_EQUAL_INT(-1, result);
}

void test_initialize_returns_negative_on_non_mmo_extension(void) {
	int result = initialize_simulator("program.mms");
	TEST_ASSERT_EQUAL_INT(-1, result);
}

void test_initialize_returns_negative_on_empty_string(void) {
	int result = initialize_simulator("");
	TEST_ASSERT_EQUAL_INT(-1, result);
}

void test_initialize_returns_negative_on_nonexistent_file(void) {
	file_exists_ExpectAndReturn("nonexistent.mmo", 0);
	int result = initialize_simulator("nonexistent.mmo");
	TEST_ASSERT_EQUAL_INT(-1, result);
}

void test_initialize_calls_library_setups(void){
	file_exists_ExpectAndReturn("program.mmo", 1);
	mmix_lib_initialize_w_Expect();
	mmix_initialize_w_Expect();
	mmix_boot_w_Expect();
	mmix_load_file_w_Expect("program.mmo");
	initialize_simulator("program.mmo");
}
//execute instructions tests
void test_execute_instructions_does_nothing_with_zero(void){
	execute_instructions(0);
}

void test_execute_instructions_does_nothing_if_mmix_is_halted(void){
	get_halted_ExpectAndReturn(1);	
	execute_instructions(1);
}

void test_execute_instructions_always_calls_perform_instruction_and_dynamic_trap(void){
	get_op_ExpectAndReturn(RESUME);
	get_resuming_ExpectAndReturn(1);
	get_halted_ExpectAndReturn(0);
	mmix_perform_instruction_w_Expect();
	mmix_dynamic_trap_w_Expect();
	
	execute_instructions(1);
}

void test_execute_instrctions_calls_fetch_instruction_if_sim_is_not_resuming(void){
	get_op_ExpectAndReturn(RESUME);
	get_halted_ExpectAndReturn(0);
	get_resuming_ExpectAndReturn(0);
	mmix_fetch_instruction_w_Expect();
	mmix_perform_instruction_w_Expect();
	mmix_dynamic_trap_w_Expect();

	execute_instructions(1);
}

void test_execute_instructions_sets_resuming(void){
	get_halted_ExpectAndReturn(0);
	get_resuming_ExpectAndReturn(1);
	mmix_perform_instruction_w_Expect();
	mmix_dynamic_trap_w_Expect();
	get_op_ExpectAndReturn(DIV);
	set_resuming_Expect(0);

	execute_instructions(1);
}


// finalize_simulator tests

void test_finalize_returns_negative_one(void) {
	int result = finalize_simulator();
	TEST_ASSERT_EQUAL_INT(-1, result);
}

int main(void) {
	UNITY_BEGIN();
	RUN_TEST(test_initialize_returns_negative_on_null_input);
	RUN_TEST(test_initialize_returns_negative_on_oversized_filename);
	RUN_TEST(test_initialize_returns_negative_on_non_mmo_extension);
	RUN_TEST(test_initialize_returns_negative_on_empty_string);
	RUN_TEST(test_finalize_returns_negative_one);
	RUN_TEST(test_initialize_returns_negative_on_nonexistent_file);
	RUN_TEST(test_initialize_calls_library_setups);
	RUN_TEST(test_execute_instructions_does_nothing_with_zero);
	RUN_TEST(test_execute_instructions_does_nothing_if_mmix_is_halted);
	RUN_TEST(test_execute_instructions_always_calls_perform_instruction_and_dynamic_trap);
	RUN_TEST(test_execute_instrctions_calls_fetch_instruction_if_sim_is_not_resuming);
	RUN_TEST(test_execute_instructions_sets_resuming);
	return UNITY_END();
}
