CC = gcc
EMCC = emcc
CFLAGS_COMMON = -Isrc/ -Ibuild/mmixlib
CFLAGS = -Wall -Wextra -Wpedantic -Werror $(CFLAGS_COMMON)
CFLAGS_VENDOR = -w $(CFLAGS_COMMON)
AR = ar
ARFLAGS = cru
RANLIB = ranlib
EMCC_AR = emar
EMCC_RANLIB = emranlib

# ctangle needs this to resolve @i includes (e.g. boilerplate.w)
export CWEBINPUTS = $(CURDIR)/build/mmixlib

# Vendor paths (submodules, read-only)
MMIXWARE = vendor/mmixware
MMIXLIB  = vendor/mmixlib

# Our change file layered on top of Ruckert's mmixallib.ch
MMIXAL_WASM_CH     = src/mmixal-wasm.ch
MMIXAL_COMBINED_CH = $(MMIXLIB_BUILD)/mmixal-combined.ch

# Build directory for ctangle output (keeps vendor clean)
MMIXLIB_BUILD = build/mmixlib

# Test framework paths
UNITY_DIR = vendor/unity/src
CMOCK_DIR = vendor/cmock/src
MOCK_DIR  = test/unit/mocks

UNITY_SRC = $(UNITY_DIR)/unity.c
UNITY_INC = -I$(UNITY_DIR)
CMOCK_SRC = $(CMOCK_DIR)/cmock.c
CMOCK_INC = -I$(CMOCK_DIR)
MOCK_SRC  = $(MOCK_DIR)/mock_mmixlib_wrapper.c $(MOCK_DIR)/mock_io_utils.c

# Glue code object
SRC_OBJS = src/glue.o 

# mmixlib generated sources (from ctangle mmix-sim.w + mmixlib.ch)
LIBSIM = libboot.c     libfinal.c     libload.c     libprint.c       libstats.c \
	libcommand.c  libinit.c      libmem.c      libprofile.c     libtrace.c \
	libdtrap.c    libinteract.c  libmmget.c    libshowbreaks.c  libglobals.c \
	libdump.c     liblibfinal.c  libmmput.c    libshowline.c    libstdin.c \
	libfetch.c    liblibinit.c   libperform.c  libsoption.c

LIBAL  = libmmixal.c libalerror.c
LIBH   = libarith.h libtype.h mmix-io.h

# Full paths in build dir
LIBSIM_SRC = $(addprefix $(MMIXLIB_BUILD)/,$(LIBSIM))
LIBAL_SRC  = $(addprefix $(MMIXLIB_BUILD)/,$(LIBAL))
LIBH_FILES = $(addprefix $(MMIXLIB_BUILD)/,$(LIBH))

# Objects for the static library
LIBSIM_OBJ = $(LIBSIM_SRC:.c=.o)
LIBAL_OBJ  = $(LIBAL_SRC:.c=.o)
LIBEXTRA_OBJ = $(MMIXLIB_BUILD)/mmix-arith.o $(MMIXLIB_BUILD)/mmix-io.o \
               $(MMIXLIB_BUILD)/libname.o $(MMIXLIB_BUILD)/libbase.o
LIBMMIX = $(MMIXLIB_BUILD)/libmmix.a

# Shared header dependency list (used by both native and WASM pattern rules)
MMIXLIB_HDRS = $(MMIXLIB_BUILD)/abstime.h $(MMIXLIB_BUILD)/mmixlib.h \
               $(MMIXLIB_BUILD)/libglobals.h $(MMIXLIB_BUILD)/libmmixal.h \
               $(MMIXLIB_BUILD)/libname.h $(MMIXLIB_BUILD)/libbase.h \
               $(LIBH_FILES) $(MMIXLIB_BUILD)/libconfig.h

.PHONY: all test unit_test wasm analyze clean

all: test

# --- mmixlib build ---

$(MMIXLIB_BUILD):
	mkdir -p $(MMIXLIB_BUILD)

# Copy boilerplate (ctangle needs it before anything else)
$(MMIXLIB_BUILD)/boilerplate.w: $(MMIXWARE)/boilerplate.w | $(MMIXLIB_BUILD)
	cp $< $@

# Generate abstime.h (build timestamp)
$(MMIXLIB_BUILD)/abstime.h: $(MMIXWARE)/abstime.w $(MMIXLIB_BUILD)/boilerplate.w | $(MMIXLIB_BUILD)
	cd $(MMIXLIB_BUILD) && ctangle ../../$(MMIXWARE)/abstime.w
	$(CC) -o $(MMIXLIB_BUILD)/abstime $(MMIXLIB_BUILD)/abstime.c
	$(MMIXLIB_BUILD)/abstime > $@

# --- Batch copy rules (replaces individual cp rules) ---

# Headers from vendor/mmixlib → build/mmixlib
MMIXLIB_COPY_HEADERS = mmixlib.h libglobals.h libmmixal.h libname.h libbase.h
$(addprefix $(MMIXLIB_BUILD)/,$(MMIXLIB_COPY_HEADERS)): $(MMIXLIB_BUILD)/%.h: $(MMIXLIB)/%.h | $(MMIXLIB_BUILD)
	cp $< $@

# Headers from src/ → build/mmixlib
$(MMIXLIB_BUILD)/libconfig.h $(MMIXLIB_BUILD)/libimport.h: $(MMIXLIB_BUILD)/%.h: src/%.h | $(MMIXLIB_BUILD)
	cp $< $@

# C files from vendor/mmixlib → build/mmixlib
$(MMIXLIB_BUILD)/libname.c $(MMIXLIB_BUILD)/libbase.c: $(MMIXLIB_BUILD)/%.c: $(MMIXLIB)/%.c | $(MMIXLIB_BUILD)
	cp $< $@

# --- ctangle rules ---

# ctangle mmix-sim.w with mmixlib.ch → simulator library sources
$(LIBSIM_SRC) $(LIBH_FILES) $(MMIXLIB_BUILD)/mmix-sim.c: $(MMIXLIB_BUILD)/boilerplate.w $(MMIXWARE)/mmix-sim.w $(MMIXLIB)/mmixlib.ch $(MMIXLIB_BUILD)/libconfig.h $(MMIXLIB_BUILD)/libimport.h
	cd $(MMIXLIB_BUILD) && ctangle ../../$(MMIXWARE)/mmix-sim.w ../../$(MMIXLIB)/mmixlib.ch

# Merge Ruckert's mmixallib.ch with our wasm fixups via ctie
$(MMIXAL_COMBINED_CH): $(MMIXLIB_BUILD)/boilerplate.w $(MMIXWARE)/mmixal.w $(MMIXLIB)/mmixallib.ch $(MMIXAL_WASM_CH) | $(MMIXLIB_BUILD)
	cd $(MMIXLIB_BUILD) && ctie -c mmixal-combined.ch ../../$(MMIXWARE)/mmixal.w ../../$(MMIXLIB)/mmixallib.ch ../../$(MMIXAL_WASM_CH)

# ctangle mmixal.w with combined change file → assembler library sources
$(LIBAL_SRC): $(MMIXLIB_BUILD)/boilerplate.w $(MMIXWARE)/mmixal.w $(MMIXAL_COMBINED_CH)
	cd $(MMIXLIB_BUILD) && ctangle ../../$(MMIXWARE)/mmixal.w mmixal-combined.ch

# ctangle mmix-arith.w → arithmetic module
$(MMIXLIB_BUILD)/mmix-arith.c: $(MMIXLIB_BUILD)/boilerplate.w $(MMIXWARE)/mmix-arith.w
	cd $(MMIXLIB_BUILD) && ctangle ../../$(MMIXWARE)/mmix-arith.w

# ctangle mmix-io.w with libio.ch → I/O module
$(MMIXLIB_BUILD)/mmix-io.c: $(MMIXLIB_BUILD)/boilerplate.w $(MMIXWARE)/mmix-io.w $(MMIXLIB)/libio.ch
	cd $(MMIXLIB_BUILD) && ctangle ../../$(MMIXWARE)/mmix-io.w ../../$(MMIXLIB)/libio.ch

# --- Compile & archive (native) ---

$(MMIXLIB_BUILD)/%.o: $(MMIXLIB_BUILD)/%.c $(MMIXLIB_HDRS)
	$(CC) $(CFLAGS_VENDOR) -c $< -o $@

$(LIBMMIX): $(LIBSIM_OBJ) $(LIBAL_OBJ) $(LIBEXTRA_OBJ)
	rm -f $@
	$(AR) $(ARFLAGS) $@ $^
	$(RANLIB) $@

# --- Glue code ---

src/glue.o: src/glue.c src/glue.h $(MMIXLIB_HDRS)
	$(CC) $(CFLAGS) -c $< -o $@

# --- Assembler stub ---

src/assembler.o: src/assembler.c src/assembler.h
	$(CC) $(CFLAGS) -c $< -o $@

# --- Mocks & tests ---

$(MOCK_DIR)/mock_mmixlib_wrapper.c $(MOCK_DIR)/mock_mmixlib_wrapper.h: src/mmixlib_wrapper.h
	mkdir -p $(MOCK_DIR)
	ruby -Ivendor/cmock/lib -e "require 'cmock'; CMock.new({:mock_path => '$(MOCK_DIR)', :plugins => [:ignore, :callback], :mock_prefix => 'mock_'}).setup_mocks(['$<'])"

$(MOCK_DIR)/mock_io_utils.c $(MOCK_DIR)/mock_io_utils.h: src/io_utils.h
	mkdir -p $(MOCK_DIR)
	ruby -Ivendor/cmock/lib -e "require 'cmock'; CMock.new({:mock_path => '$(MOCK_DIR)', :plugins => [:ignore, :callback], :mock_prefix => 'mock_'}).setup_mocks(['$<'])"

unit_test: src/assembler.o $(MOCK_SRC)
	$(CC) $(CFLAGS) $(UNITY_INC) $(CMOCK_INC) -I$(MOCK_DIR) -Isrc/ \
		test/unit/test_assembler.c \
		$(UNITY_SRC) \
		$(CMOCK_SRC) \
		$(MOCK_SRC) \
		src/assembler.o \
		-o test_unit
	./test_unit

test: $(SRC_OBJS) $(LIBMMIX)
	$(CC) $(CFLAGS) $(UNITY_INC) -Isrc/ \
		test/integration/test_glue_real.c \
		$(UNITY_SRC) \
		$(SRC_OBJS) \
		-L$(MMIXLIB_BUILD) -lmmix \
		-o test_integration
	./test_integration

# --- WASM target ---

WASM_BUILD = build/wasm
WASM_OBJ = $(patsubst $(MMIXLIB_BUILD)/%,$(WASM_BUILD)/%,$(LIBSIM_OBJ) $(LIBAL_OBJ) $(LIBEXTRA_OBJ))
WASM_LIBMMIX = $(WASM_BUILD)/libmmix.a

$(WASM_BUILD):
	mkdir -p $(WASM_BUILD)

$(WASM_BUILD)/%.o: $(MMIXLIB_BUILD)/%.c $(MMIXLIB_HDRS) | $(WASM_BUILD)
	$(EMCC) $(CFLAGS_VENDOR) -c $< -o $@

$(WASM_LIBMMIX): $(WASM_OBJ)
	rm -f $@
	$(EMCC_AR) $(ARFLAGS) $@ $^
	$(EMCC_RANLIB) $@

wasm: src/glue.c $(WASM_LIBMMIX)
	$(EMCC) $(CFLAGS) src/glue.c \
		-L$(WASM_BUILD) -lmmix \
		-o $(WASM_BUILD)/mmix.js \
		-sEXPORTED_FUNCTIONS='["_assemble_mmixal","_mmix_simulate","_get_stdout_pointer","_get_source_code_pointer","_get_binary_pointer","_get_stderr_pointer","_get_stdout_size","_get_binary_size","_get_stderr_size"]' \
		-sEXPORTED_RUNTIME_METHODS='["ccall","cwrap","HEAPU8"]' \
		-sMODULARIZE=1 \
		-sEXPORT_NAME='createMmixModule' --emit-tsd module.d.ts
	cp $(WASM_BUILD)/mmix.js $(WASM_BUILD)/mmix.wasm ../public/

analyze:
	cppcheck --enable=all --inline-suppr --check-level=exhaustive --suppress=missingIncludeSystem --suppress=*:test/unit/mocks/* --suppressions-list=cppcheck-suppressions.txt -Ibuild/mmixlib src/ test/
	clang --analyze $(CFLAGS) $(UNITY_INC) src/*.c test/integration/*.c

clean:
	rm -rf $(MMIXLIB_BUILD) $(WASM_BUILD)
	rm -f $(SRC_OBJS) test_integration test_unit
