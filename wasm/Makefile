CC = gcc
EMCC = emcc
CFLAGS = -Wall -Wextra -Isrc/ -Ibuild/mmixlib
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

# Build directory for ctangle output (keeps vendor clean)
MMIXLIB_BUILD = build/mmixlib

# Test framework paths
UNITY_DIR = vendor/unity/src
CMOCK_DIR = vendor/cmock
MOCK_OUT  = test/unit/mocks

UNITY_SRC = $(UNITY_DIR)/unity.c
UNITY_INC = -I$(UNITY_DIR)

CMOCK_SRC = $(CMOCK_DIR)/src/cmock.c
CMOCK_INC = -I$(CMOCK_DIR)/src

# Glue code objects
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

.PHONY: all test-unit test-integration wasm mocks clean

all: test-unit

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

# ctangle mmixal.w with mmixallib.ch → assembler library sources
$(LIBAL_SRC): $(MMIXLIB_BUILD)/boilerplate.w $(MMIXWARE)/mmixal.w $(MMIXLIB)/mmixallib.ch
	cd $(MMIXLIB_BUILD) && ctangle ../../$(MMIXWARE)/mmixal.w ../../$(MMIXLIB)/mmixallib.ch

# ctangle mmix-arith.w → arithmetic module
$(MMIXLIB_BUILD)/mmix-arith.c: $(MMIXLIB_BUILD)/boilerplate.w $(MMIXWARE)/mmix-arith.w
	cd $(MMIXLIB_BUILD) && ctangle ../../$(MMIXWARE)/mmix-arith.w

# ctangle mmix-io.w with libio.ch → I/O module
$(MMIXLIB_BUILD)/mmix-io.c: $(MMIXLIB_BUILD)/boilerplate.w $(MMIXWARE)/mmix-io.w $(MMIXLIB)/libio.ch
	cd $(MMIXLIB_BUILD) && ctangle ../../$(MMIXWARE)/mmix-io.w ../../$(MMIXLIB)/libio.ch

# --- Compile & archive (native) ---

$(MMIXLIB_BUILD)/%.o: $(MMIXLIB_BUILD)/%.c $(MMIXLIB_HDRS)
	$(CC) $(CFLAGS) -c $< -o $@

$(LIBMMIX): $(LIBSIM_OBJ) $(LIBAL_OBJ) $(LIBEXTRA_OBJ)
	rm -f $@
	$(AR) $(ARFLAGS) $@ $^
	$(RANLIB) $@

# --- Glue code ---

src/glue.o: src/glue.c src/glue.h src/mmix_interface.h
	$(CC) $(CFLAGS) -c $< -o $@

# --- Mocks & tests ---

mocks:
	ruby $(CMOCK_DIR)/lib/cmock.rb -o cmock.yml src/mmix_interface.h

test-unit: mocks $(SRC_OBJS)
	$(CC) $(CFLAGS) $(UNITY_INC) $(CMOCK_INC) -Isrc/ -I$(MOCK_OUT) \
		test/unit/test_glue.c \
		$(MOCK_OUT)/mock_mmix_interface.c \
		$(CMOCK_SRC) \
		$(UNITY_SRC) \
		$(SRC_OBJS) \
		-o test_unit
	./test_unit

test-integration: $(SRC_OBJS) $(LIBMMIX)
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
	$(EMCC) $(CFLAGS) -c $< -o $@

$(WASM_LIBMMIX): $(WASM_OBJ)
	rm -f $@
	$(EMCC_AR) $(ARFLAGS) $@ $^
	$(EMCC_RANLIB) $@

wasm: src/glue.c $(WASM_LIBMMIX)
	$(EMCC) $(CFLAGS) src/glue.c \
		-L$(WASM_BUILD) -lmmix \
		-o $(WASM_BUILD)/mmix.js \
		-sEXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
		-sMODULARIZE=1 \
		-sEXPORT_NAME='createMmixModule'

clean:
	rm -rf $(MMIXLIB_BUILD) $(WASM_BUILD)
	rm -f $(SRC_OBJS) test_unit test_integration
	rm -f $(MOCK_OUT)/mock_mmix_interface.c $(MOCK_OUT)/mock_mmix_interface.h
