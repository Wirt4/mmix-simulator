import { describe, it, expect, beforeAll } from "vitest"
import path from "path"
import { createRequire } from "module"
import type { MainModule } from "../../app/javascript/types/module"

const require_ = createRequire(import.meta.url)
const createMmixModule = require_(
  path.resolve(process.cwd(), "wasm/build/wasm/mmix.js")
) as () => Promise<MainModule>

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
  let Module: MainModule

  beforeAll(async () => {
    Module = await createMmixModule()
  })

  it("a successfull assemble_mmixal produces a listing output", () => {
    const src: string = helloWorldSource

    const ptr: number = Module._get_source_code_pointer()
    const encoded: Uint8Array = new TextEncoder().encode(src)
    Module.HEAPU8.set(encoded, ptr)
    Module.HEAPU8[ptr + encoded.length] = 0
    Module._assemble_mmixal(encoded.length)
    const stdoutPtr: number = Module._get_stdout_pointer()
    const stdoutSize: number = Module._get_stdout_size()
    const bytes = Module.HEAPU8.slice(stdoutPtr, stdoutPtr + stdoutSize)
    const stdoutText: string = new TextDecoder().decode(bytes)

    expect(stdoutText).toEqual(expect.stringContaining("LOC"))
    expect(stdoutText).toEqual(expect.stringContaining("Text\tBYTE\t\"Greetings Program!"))
  })


  it("given a source that's syntactically correct and  prints to stderr, when it is converted to assembly, then the assemble result will be clean", () => {
    const src: string = stderrProgramSource

    const ptr: number = Module._get_source_code_pointer()
    const encoded: Uint8Array = new TextEncoder().encode(src)
    Module.HEAPU8.set(encoded, ptr)
    Module.HEAPU8[ptr + encoded.length] = 0
    const assemblyResult = Module._assemble_mmixal(encoded.length)

    expect(assemblyResult).toBe(0)
  })

  it("mmix_simulate captures stderr output", () => {
    const expected = "I can't do that Dave.\n"
    const src = stderrProgramSource

    const ptr: number = Module._get_source_code_pointer()
    const encoded: Uint8Array = new TextEncoder().encode(src)
    Module.HEAPU8.set(encoded, ptr)
    Module.HEAPU8[ptr + encoded.length] = 0
    Module._assemble_mmixal(encoded.length)
    const binSize: number = Module._get_binary_size()
    Module._mmix_simulate(binSize)
    const stderrSize: number = Module._get_stderr_size()
    const stderrPtr: number = Module._get_stderr_pointer()
    const bytes = Module.HEAPU8.slice(stderrPtr, stderrPtr + stderrSize)
    const stderrOutput: string = new TextDecoder().decode(bytes)

    expect(stderrOutput).toBe(expected)
  })


  it("mmix_simulate captures stdout output", () => {
    const src = helloWorldSource
    const expected = "Greetings Program!\n"

    const ptr: number = Module._get_source_code_pointer()
    const encoded: Uint8Array = new TextEncoder().encode(src)
    Module.HEAPU8.set(encoded, ptr)
    Module.HEAPU8[ptr + encoded.length] = 0
    Module._assemble_mmixal(encoded.length)
    const binSize: number = Module._get_binary_size()
    Module._mmix_simulate(binSize)
    const stdoutSize: number = Module._get_stdout_size()
    const stdoutPtr: number = Module._get_stdout_pointer()
    const bytes = Module.HEAPU8.slice(stdoutPtr, stdoutPtr + stdoutSize)
    const stdoutOutput: string = new TextDecoder().decode(bytes)

    expect(stdoutOutput).toBe(expected)
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
})
