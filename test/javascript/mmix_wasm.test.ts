import { describe, it, expect, beforeAll } from "vitest"
import path from "path"
import { createRequire } from "module"

interface MmixModule {
  ccall: (name: string, returnType: string, argTypes: string[], args: unknown[]) => unknown
  cwrap: (name: string, returnType: string, argTypes: string[]) => (...args: unknown[]) => unknown
  HEAPU8: Uint8Array
}

const require_ = createRequire(import.meta.url)
const createMmixModule = require_(
  path.resolve(process.cwd(), "wasm/build/wasm/mmix.js")
) as () => Promise<MmixModule>

const helloWorldSource =
  "\tLOC\tData_Segment\n" +
  "\tGREG\t@\n" +
  "Text\tBYTE\t\"Hello world!\",10,0\n" +
  "\n" +
  "\tLOC\t#100\n" +
  "Main\tLDA\t$255,Text\n" +
  "\tTRAP\t0,Fputs,StdOut\n" +
  "\tTRAP\t0,Halt,0\n"

const stderrProgramSource =
  "\tLOC\tData_Segment\n" +
  "\tGREG\t@\n" +
  "Text\tBYTE\t\"Error message!\",10,0\n" +
  "\n" +
  "\tLOC\t#100\n" +
  "Main\tLDA\t$255,Text\n" +
  "\tTRAP\t0,Fputs,StdErr\n" +
  "\tTRAP\t0,Halt,0\n"

const badMmixalSource =
  "\tLOC\t#100\n" +
  "Main\tBADOP\t1,2,3\n" +
  "\tALSOBAD\t4,5,6\n" +
  "\tTRAP\t0,Halt,0\n"

const TIMESTAMP_OFFSET = 4
const TIMESTAMP_SIZE = 4

const expectedBinary = new Uint8Array([
  0x98, 0x09, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x98, 0x01, 0x20, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21, 0x0a, 0x00, 0x00, 0x00,
  0x98, 0x01, 0x00, 0x01, 0x00, 0x00, 0x01, 0x00, 0x98, 0x06, 0x00, 0x03, 0x70, 0x72, 0x6f, 0x67,
  0x72, 0x61, 0x6d, 0x2e, 0x6d, 0x6d, 0x73, 0x00, 0x98, 0x07, 0x00, 0x06, 0x23, 0xff, 0xfe, 0x00,
  0x00, 0x00, 0x07, 0x01, 0x00, 0x00, 0x00, 0x00, 0x98, 0x0a, 0x00, 0xfe, 0x20, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x98, 0x0b, 0x00, 0x00,
  0x20, 0x3a, 0x40, 0x50, 0x10, 0x40, 0x40, 0x20, 0x4d, 0x20, 0x61, 0x20, 0x69, 0x02, 0x6e, 0x01,
  0x00, 0x81, 0x10, 0x40, 0x40, 0x20, 0x54, 0x20, 0x65, 0x20, 0x78, 0x09, 0x74, 0x00, 0x82, 0x00,
  0x98, 0x0c, 0x00, 0x08,
])

const expectedBinarySize = 132

const expectedListing =
  "                   \tLOC\tData_Segment\n" +
  "($254=#20000000    \tGREG\t@\n" +
  "         00000000)\n" +
  "2000000000000000:  Text\tBYTE\t\"Hello world!\",10,0\n" +
  " ...000: 48656c6c\n" +
  " ...004: 6f20776f\n" +
  " ...008: 726c6421\n" +
  " ...00c: 0a00    \n" +
  "                   \n" +
  "                   \tLOC\t#100\n" +
  "0000000000000100:  Main\tLDA\t$255,Text\n" +
  " ...100: 23fffe00\n" +
  " ...104: 00000701  \tTRAP\t0,Fputs,StdOut\n" +
  " ...108: 00000000  \tTRAP\t0,Halt,0\n" +
  "                   \n" +
  "\n" +
  "Symbol table:\n" +
  " Main = #0000000000000100 (1)\n" +
  " Text = #2000000000000000 (2)\n"

const expectedOutput = "Hello world!\n"
const expectedStderr = "Error message!\n"

const expectedAssemblyStderr =
  "\"program.mms\", line 2: unknown operation code `BADOP'!\n" +
  "\"program.mms\", line 3: unknown operation code `ALSOBAD'!\n" +
  "\"program.mms\", line 5: undefined symbol: Main!\n" +
  "\"program.mms\", line 5: (3 errors were found.)!\n"

function writeSource(mod: MmixModule, source: string, getPtr: () => number): number {
  const ptr = getPtr()
  const encoded = new TextEncoder().encode(source)
  mod.HEAPU8.set(encoded, ptr)
  mod.HEAPU8[ptr + encoded.length] = 0
  return encoded.length
}

function readString(mod: MmixModule, ptr: number, size: number): string {
  const bytes = mod.HEAPU8.slice(ptr, ptr + size)
  return new TextDecoder().decode(bytes)
}

describe("MMIX WASM Module", () => {
  let Module: MmixModule
  let getStdoutPointer: () => number
  let getSourceCodePointer: () => number
  let getBinaryPointer: () => number
  let getStderrPointer: () => number
  let assembleMMIXAL: (len: number) => number
  let mmixSimulate: (size: number) => number
  let getStdoutSize: () => number
  let getBinarySize: () => number
  let getStderrSize: () => number

  beforeAll(async () => {
    Module = await createMmixModule()
    getStdoutPointer = Module.cwrap("get_stdout_pointer", "number", []) as () => number
    getSourceCodePointer = Module.cwrap("get_source_code_pointer", "number", []) as () => number
    getBinaryPointer = Module.cwrap("get_binary_pointer", "number", []) as () => number
    getStderrPointer = Module.cwrap("get_stderr_pointer", "number", []) as () => number
    assembleMMIXAL = Module.cwrap("assemble_mmixal", "number", ["number"]) as (len: number) => number
    mmixSimulate = Module.cwrap("mmix_simulate", "number", ["number"]) as (size: number) => number
    getStdoutSize = Module.cwrap("get_stdout_size", "number", []) as () => number
    getBinarySize = Module.cwrap("get_binary_size", "number", []) as () => number
    getStderrSize = Module.cwrap("get_stderr_size", "number", []) as () => number
  })

  it("stdout pointer is non-null", () => {
    expect(getStdoutPointer()).not.toBe(0)
  })

  it("source code pointer is non-null", () => {
    expect(getSourceCodePointer()).not.toBe(0)
  })

  it("assemble_mmixal returns 0 on valid source", () => {
    const len = writeSource(Module, helloWorldSource, getSourceCodePointer)
    const result = assembleMMIXAL(len)
    expect(result).toBe(0)
  })

  it("assemble_mmixal produces correct binary output", () => {
    const len = writeSource(Module, helloWorldSource, getSourceCodePointer)
    assembleMMIXAL(len)

    const binarySize = getBinarySize()
    expect(binarySize).toBe(expectedBinarySize)

    const binaryPtr = getBinaryPointer()
    const binary = Module.HEAPU8.slice(binaryPtr, binaryPtr + binarySize)

    expect(binary.slice(0, TIMESTAMP_OFFSET)).toEqual(
      expectedBinary.slice(0, TIMESTAMP_OFFSET)
    )
    expect(binary.slice(TIMESTAMP_OFFSET + TIMESTAMP_SIZE)).toEqual(
      expectedBinary.slice(TIMESTAMP_OFFSET + TIMESTAMP_SIZE)
    )
  })

  it("assemble_mmixal produces correct listing output", () => {
    const len = writeSource(Module, helloWorldSource, getSourceCodePointer)
    assembleMMIXAL(len)

    const listingSize = getStdoutSize()
    const listingPtr = getStdoutPointer()
    const listing = readString(Module, listingPtr, listingSize)

    expect(listingSize).toBe(expectedListing.length)
    expect(listing).toBe(expectedListing)
  })

  it("mmix_simulate returns 0 on valid binary", () => {
    const binaryPtr = getBinaryPointer()
    Module.HEAPU8.set(expectedBinary, binaryPtr)

    const result = mmixSimulate(expectedBinarySize)
    expect(result).toBe(0)
  })

  it("mmix_simulate returns non-zero on bad input", () => {
    const result = mmixSimulate(0)
    expect(result).not.toBe(0)
  })

  it("stderr pointer is non-null", () => {
    expect(getStderrPointer()).not.toBe(0)
  })

  it("mmix_simulate captures stderr output", () => {
    const len = writeSource(Module, stderrProgramSource, getSourceCodePointer)
    assembleMMIXAL(len)
    const binSize = getBinarySize()

    mmixSimulate(binSize)

    const stderrSize = getStderrSize()
    const stderrPtr = getStderrPointer()
    const stderrOutput = readString(Module, stderrPtr, stderrSize)

    expect(stderrSize).toBe(expectedStderr.length)
    expect(stderrOutput).toBe(expectedStderr)
  })

  it("mmix_simulate captures stdout output", () => {
    const binaryPtr = getBinaryPointer()
    Module.HEAPU8.set(expectedBinary, binaryPtr)

    mmixSimulate(expectedBinarySize)

    const stdoutSize = getStdoutSize()
    const stdoutPtr = getStdoutPointer()
    const stdoutOutput = readString(Module, stdoutPtr, stdoutSize)

    expect(stdoutSize).toBe(expectedOutput.length)
    expect(stdoutOutput).toBe(expectedOutput)
  })

  it("assemble_mmixal returns 4 on invalid source", () => {
    const len = writeSource(Module, badMmixalSource, getSourceCodePointer)
    const result = assembleMMIXAL(len)
    expect(result).toBe(4)
  })

  it("assemble_mmixal produces correct error output", () => {
    const len = writeSource(Module, badMmixalSource, getSourceCodePointer)
    assembleMMIXAL(len)

    const stderrSize = getStderrSize()
    const stderrPtr = getStderrPointer()
    const stderrOutput = readString(Module, stderrPtr, stderrSize)

    expect(stderrSize).toBe(expectedAssemblyStderr.length)
    expect(stderrOutput).toBe(expectedAssemblyStderr)
  })
})
