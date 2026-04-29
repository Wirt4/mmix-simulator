/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-argument*/

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
    Module._mmix_simulate(1)
    const stderrSize: number = Module._get_stderr_size()
    const stderrPtr: number = Module._get_stderr_pointer()
    const bytes = Module.HEAPU8.slice(stderrPtr, stderrPtr + stderrSize)
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
})
