// cppcheck-suppress missingInclude
#include "unity.h"
#include <stddef.h>

extern unsigned char *address_map_buffer(void);
extern size_t address_map_size(void);

void setUp(void) {}
void tearDown(void) {}

static void test_address_map_buffer_is_non_null(void) {
    TEST_ASSERT_NOT_NULL(address_map_buffer());
}

static void test_address_map_size_is_sentinel_before_first_assembly(void) {
    // Mirrors listing_size(): (size_t)-1 means "no assembly has run yet".
    TEST_ASSERT_EQUAL_UINT64((size_t)-1, address_map_size());
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_address_map_buffer_is_non_null);
    RUN_TEST(test_address_map_size_is_sentinel_before_first_assembly);
    return UNITY_END();
}
