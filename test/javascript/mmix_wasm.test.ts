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
  "Text\tBYTE\t\"Greetings Program!\",10,0\n" +
  "\n" +
  "\tLOC\t#100\n" +
  "Main\tLDA\t$255,Text\n" +
  "\tTRAP\t0,Fputs,StdOut\n" +
  "\tTRAP\t0,Halt,0\n"

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
  let Module: MmixModule

  beforeAll(async () => {
    Module = await createMmixModule()
  })

  it("a successfull assemble_mmixal produces a listing output", () => {
    const src: string = helloWorldSource

    const ptr: number = Module.cwrap("get_source_code_pointer", "number", [])() as number
    const encoded: Uint8Array = new TextEncoder().encode(src)
    Module.HEAPU8.set(encoded, ptr)
    Module.HEAPU8[ptr + encoded.length] = 0
    Module.cwrap("assemble_mmixal", "number", ["number"])(encoded.length)
    const stdoutPtr: number = Module.cwrap("get_stdout_pointer", "number", [])() as number
    const stdoutSize: number = Module.cwrap("get_stdout_size", "number", [])() as number
    const bytes = Module.HEAPU8.slice(stdoutPtr, stdoutPtr + stdoutSize)
    const stdoutText: string = new TextDecoder().decode(bytes)

    expect(stdoutText).toEqual(expect.stringContaining("LOC"))
    expect(stdoutText).toEqual(expect.stringContaining("Text\tBYTE\t\"Greetings Program!"))
  })


  it("given a source that's syntactically correct and  prints to stderr, when it is converted to assembly, then the assemble result will be clean", () => {
    const src: string = stderrProgramSource

    const ptr: number = Module.cwrap("get_source_code_pointer", "number", [])() as number
    const encoded: Uint8Array = new TextEncoder().encode(src)
    Module.HEAPU8.set(encoded, ptr)
    Module.HEAPU8[ptr + encoded.length] = 0
    const assemblyResult = Module.cwrap("assemble_mmixal", "number", ["number"])(encoded.length) as number

    expect(assemblyResult).toBe(0)
  })

  it("mmix_simulate captures stderr output", () => {
    const expected: string = "I can't do that Dave.\n"
    const src = stderrProgramSource

    const ptr: number = Module.cwrap("get_source_code_pointer", "number", [])() as number
    const encoded: Uint8Array = new TextEncoder().encode(src)
    Module.HEAPU8.set(encoded, ptr)
    Module.HEAPU8[ptr + encoded.length] = 0
    Module.cwrap("assemble_mmixal", "number", ["number"])(encoded.length) as number
    const binSize: number = Module.cwrap("get_binary_size", "number", [])() as number
    Module.cwrap("mmix_simulate", "number", ["number"])(binSize)
    const stderrSize: number = Module.cwrap("get_stderr_size", "number", [])() as number
    const stderrPtr: number = Module.cwrap("get_stderr_pointer", "number", [])() as number
    const bytes = Module.HEAPU8.slice(stderrPtr, stderrPtr + stderrSize)
    const stderrOutput: string = new TextDecoder().decode(bytes)

    expect(stderrOutput).toBe(expected)
  })


  it("mmix_simulate captures stdout output", () => {
    const src = helloWorldSource
    const expected: string = "Greetings Program!\n"

    const ptr: number = Module.cwrap("get_source_code_pointer", "number", [])() as number
    const encoded: Uint8Array = new TextEncoder().encode(src);
    Module.HEAPU8.set(encoded, ptr)
    Module.HEAPU8[ptr + encoded.length] = 0
    Module.cwrap("assemble_mmixal", "number", ["number"])(encoded.length)
    const binSize: number = Module.cwrap("get_binary_size", "number", [])() as number
    Module.cwrap("mmix_simulate", "number", ["number"])(binSize)
    const stdoutSize: number = Module.cwrap("get_stdout_size", "number", [])() as number
    const stdoutPtr: number = Module.cwrap("get_stdout_pointer", "number", [])() as number
    const bytes = Module.HEAPU8.slice(stdoutPtr, stdoutPtr + stdoutSize)
    const stdoutOutput: string = new TextDecoder().decode(bytes)

    expect(stdoutOutput).toBe(expected)
  })

  it("assemble_mmixal produces nonzero result", () => {
    const badInput: string = "\tBADOP\t\"Make me a Millionaire\"n"

    const ptr: number = Module.cwrap("get_source_code_pointer", "number", [])() as number
    const encoded: Uint8Array = new TextEncoder().encode(badInput)
    Module.HEAPU8.set(encoded, ptr)
    Module.HEAPU8[ptr + encoded.length] = 0
    const result: number = Module.cwrap("assemble_mmixal", "number", ["number"])(encoded.length) as number

    expect(result).not.toBe(0)
  })

  it("assemble_mmixal produces correct error output", () => {
    const badInput: string = "\tBADOP\t\"Make me a Millionaire\"n"
    const stdErrFragment: string = '"program.mms", line 1: undefined symbol'

    const ptr: number = Module.cwrap("get_source_code_pointer", "number", [])() as number
    const encoded: Uint8Array = new TextEncoder().encode(badInput)
    Module.HEAPU8.set(encoded, ptr)
    Module.HEAPU8[ptr + encoded.length] = 0
    Module.cwrap("assemble_mmixal", "number", ["number"])(encoded.length)
    const stderrSize: number = Module.cwrap("get_stderr_size", "number", [])() as number
    const stderrPtr: number = Module.cwrap("get_stderr_pointer", "number", [])() as number
    const bytes: Uint8Array = Module.HEAPU8.slice(stderrPtr, stderrPtr + stderrSize)
    const stderrOutput: string = new TextDecoder().decode(bytes)

    expect(stderrOutput).toEqual(expect.stringContaining(stdErrFragment))
  })
})
