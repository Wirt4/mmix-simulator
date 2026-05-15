/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-require-imports */
import { describe, it, expect, beforeAll, vi } from "vitest"
import type { MainModule } from "../../wasm/build/wasm/module"
import moduleFactory from "../../app/javascript/wasm/factory"

vi.mock('../../app/javascript/wasm/factory', () => {
  const { createRequire } = require("module")
  const path = require("path")
  const require_ = createRequire(import.meta.url)
  const createMmixModule = require_(
    path.resolve(process.cwd(), "wasm/build/wasm/mmix.js")
  ) as () => Promise<MainModule>
  return { default: () => createMmixModule() }
})

const stderrProgramSource =
  "\tLOC\tData_Segment\n" +
  "\tGREG\t@\n" +
  "Text\tBYTE\t\"I can't do that Dave.\",10,0\n" +
  "\n" +
  "\tLOC\t#100\n" +
  "Main\tLDA\t$255,Text\n" +
  "\tTRAP\t0,Fputs,StdErr\n" +
  "\tTRAP\t0,Halt,0\n"

describe("MMIX WASM Module", () => {
  let Module: MainModule

  beforeAll(async () => {
    const m = await moduleFactory()
    if (m !== null) Module = m
  })

  it("given a source that's syntactically correct and prints to stderr, when it is converted to assembly, then the assemble result will be clean", () => {
    const src: string = stderrProgramSource

    const ptr: number = Module._get_source_code_pointer()
    const encoded: Uint8Array = new TextEncoder().encode(src)
    Module.HEAPU8.set(encoded, ptr)
    Module.HEAPU8[ptr + encoded.length] = 0
    const assemblyResult = Module._assemble_mmixal(encoded.length)

    expect(assemblyResult).toBe(0)
  })

  it("simulating a mmix process captures stderr output", () => {
    const expected = "I can't do that Dave.\n"
    const src = stderrProgramSource

    const ptr: number = Module._get_source_code_pointer()
    const encoded: Uint8Array = new TextEncoder().encode(src)
    Module.HEAPU8.set(encoded, ptr)
    Module.HEAPU8[ptr + encoded.length] = 0
    Module._assemble_mmixal(encoded.length)

    Module._mmix_initialize_simulator()
    Module._mmix_perform_instructions(10)
    const stderrSize: number = Module._get_stderr_size()
    const stderrPtr: number = Module._get_stderr_pointer()
    Module._mmix_finalize_simulator()

    const bytes = (Module.HEAPU8 as Uint8Array).slice(stderrPtr, stderrPtr + stderrSize)
    const stderrOutput: string = new TextDecoder().decode(bytes)

    expect(stderrOutput).toBe(expected)
  })

  it("assemble_mmixal produces nonzero result", () => {
    const badInput = "\tBADOP\t\"Make me a Millionaire\"n"

    const ptr: number = Module._get_source_code_pointer()
    const encoded: Uint8Array = new TextEncoder().encode(badInput)
    Module.HEAPU8.set(encoded, ptr)
    Module.HEAPU8[ptr + encoded.length] = 0
    const result: number = Module._assemble_mmixal(encoded.length)

    expect(result).not.toBe(0)
  })

  it("assemble_mmixal produces correct error output", () => {
    const badInput = "\tBADOP\t\"Make me a Millionaire\"n"
    const stdErrFragment = '"program.mms", line 1: undefined symbol'

    const ptr: number = Module._get_source_code_pointer()
    const encoded: Uint8Array = new TextEncoder().encode(badInput)
    Module.HEAPU8.set(encoded, ptr)
    Module.HEAPU8[ptr + encoded.length] = 0
    Module._assemble_mmixal(encoded.length)
    const stderrSize: number = Module._get_stderr_size()
    const stderrPtr: number = Module._get_stderr_pointer()
    const bytes: Uint8Array = Module.HEAPU8.slice(stderrPtr, stderrPtr + stderrSize)
    const stderrOutput: string = new TextDecoder().decode(bytes)

    expect(stderrOutput).toEqual(expect.stringContaining(stdErrFragment))
  })

  it("add two numbers produces correct listing", () => {
    const src =
      "\tLOC\t#100\n" +
      "Main\tSET\t$1,30\n" +
      "\tSET\t$2,12\n" +
      "\tADD\t$0,$1,$2\n" +
      "\tTRAP\t0,Halt,0\n"

    const expected = "                   \tLOC\t#100\n" +
      " ...100: e301001e  Main\tSET\t$1,30\n" +
      " ...104: e302000c  \tSET\t$2,12\n" +
      " ...108: 20000102  \tADD\t$0,$1,$2\n" +
      " ...10c: 00000000  \tTRAP\t0,Halt,0\n" +
      "\n" +
      "Symbol table:\n" +
      " Main = #0000000000000100 (1)\n"
    const ptr: number = Module._get_source_code_pointer()
    const encoded: Uint8Array = new TextEncoder().encode(src)
    Module.HEAPU8.set(encoded, ptr)
    Module.HEAPU8[ptr + encoded.length] = 0
    Module._assemble_mmixal(encoded.length)
    const listingPtr: number = Module._get_listing_pointer()
    const size: number = Module._get_listing_size()

    const bytes: Uint8Array = Module.HEAPU8.slice(listingPtr, listingPtr + size)
    const listingContent: string = new TextDecoder().decode(bytes)
    expect(listingContent).toEqual(expected)
  })

  it("add two numbers produces correct register value", () => {
    const src =
      "\tLOC\t#100\n" +
      "Main\tSET\t$1,30\n" +
      "\tSET\t$2,12\n" +
      "\tADD\t$0,$1,$2\n" +
      "\tTRAP\t0,Halt,0\n"

    const ptr: number = Module._get_source_code_pointer()
    const encoded: Uint8Array = new TextEncoder().encode(src)
    Module.HEAPU8.set(encoded, ptr)
    Module.HEAPU8[ptr + encoded.length] = 0
    const assembled: number = Module._assemble_mmixal(encoded.length)
    expect(assembled).toBe(0)

    Module._mmix_initialize_simulator()
    Module._mmix_perform_instructions(50)
    Module._mmix_finalize_simulator()

    // $0 = 30 + 12 = 42, fits in low tetra
    const low: number = Module._get_register_data(0, 0, 1)
    const high: number = Module._get_register_data(0, 0, 0)
    expect(low).toBe(42)
    expect(high).toBe(0)
  })

  it("set and negate produces correct register values", () => {
    const src =
      "\tLOC\t#100\n" +
      "Main\tSET\t$0,100\n" +
      "\tNEG\t$1,0,$0\n" +
      "\tTRAP\t0,Halt,0\n"

    const ptr: number = Module._get_source_code_pointer()
    const encoded: Uint8Array = new TextEncoder().encode(src)
    Module.HEAPU8.set(encoded, ptr)
    Module.HEAPU8[ptr + encoded.length] = 0
    const assembled: number = Module._assemble_mmixal(encoded.length)
    expect(assembled).toBe(0)

    Module._mmix_initialize_simulator()
    Module._mmix_perform_instructions(50)
    Module._mmix_finalize_simulator()

    // $0 should be 100 (low tetra)
    const r0Low: number = Module._get_register_data(0, 0, 1)
    expect(r0Low).toBe(100)

    // $1 = NEG 0,100 = -100, which in unsigned 64-bit is 0xFFFFFFFF FFFFFF9C
    // Emscripten returns unsigned int as signed; use >>> 0 to interpret as unsigned
    const r1High: number = Module._get_register_data(0, 1, 0)
    const r1Low: number = Module._get_register_data(0, 1, 1)
    expect(r1High >>> 0).toBe(0xFFFFFFFF)
    expect(r1Low >>> 0).toBe(0xFFFFFF9C)
  })
})
