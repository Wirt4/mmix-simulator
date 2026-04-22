import { describe, it, expect, vi, beforeEach } from "vitest"
import ModuleAdapter from "../../app/javascript/moduleAdapter/module_adapter"
import type { MainModule } from "../../app/javascript/types/module"

describe("Module Adapter", () => {
  let heap: Uint8Array
  let mockModule: MainModule
  let helloWorldSource: string
  beforeEach(() => {
    helloWorldSource =
      "\tLOC\tData_Segment\n" +
      "\tGREG\t@\n" +
      "Text\tBYTE\t\"Greetings Program!\",10,0\n" +
      "\n" +
      "\tLOC\t#100\n" +
      "Main\tLDA\t$255,Text\n" +
      "\tTRAP\t0,Fputs,StdOut\n" +
      "\tTRAP\t0,Halt,0\n"

    heap = new Uint8Array(250)

    mockModule = {
      ccall: vi.fn(),
      cwrap: vi.fn(),
      HEAPU8: heap,
      _mmix_simulate: vi.fn(),
      _get_stderr_size: vi.fn(),
      _get_stdout_pointer: vi.fn(),
      _get_stderr_pointer: vi.fn(),
      _get_source_code_pointer: vi.fn(),
      _assemble_mmixal: vi.fn(),
      _get_stdout_size: vi.fn(),
      _get_binary_pointer: vi.fn(),
      _get_binary_size: vi.fn(),
    }
  })

  it("AssembleMMIXAL writes source code to HEAP8", () => {
    const mockPointer = 9
    vi.spyOn(mockModule, '_get_source_code_pointer').mockReturnValue(mockPointer)
    const encoded: Uint8Array = new TextEncoder().encode(helloWorldSource)
    const heapSpy = vi.spyOn(mockModule.HEAPU8, "set")

    const adapter = new ModuleAdapter(mockModule)
    adapter.assembleMMIXAL(helloWorldSource)

    expect(heapSpy.mock.calls.length).toEqual(1)
    expect(heapSpy.mock.calls).toEqual(expect.arrayContaining([[encoded, mockPointer]]))
  })

  it("Assemble MMIXAL sets a terminating byte in the heap8array", () => {
    const mockHeap = new Uint8Array(260).fill(56) //unknown state of array, could be any old values
    mockModule.HEAPU8 = mockHeap
    const mockPointer = 5
    vi.spyOn(mockModule, '_get_source_code_pointer').mockReturnValue(mockPointer)
    const encodedLength = new TextEncoder().encode(helloWorldSource).length

    const adapter = new ModuleAdapter(mockModule)
    adapter.assembleMMIXAL(helloWorldSource)

    expect(mockHeap[mockPointer + encodedLength]).toBe(0)
  })

  it("AssembleMMIXAL calls _assemble_mmixal with the source length", () => {
    const assembleSpy = vi.spyOn(mockModule, '_assemble_mmixal')
    const encodedLength = new TextEncoder().encode(helloWorldSource).length

    const adapter = new ModuleAdapter(mockModule)
    adapter.assembleMMIXAL(helloWorldSource)

    expect(assembleSpy.mock.calls.length).toBe(1)
    expect(assembleSpy.mock.calls).toEqual(expect.arrayContaining([[encodedLength]]))
  })

  it("getStdOut returns text from stdout", () => {
    const expected = "Junior, you did it."
    const mockHeap = new Uint8Array(260)
    const encoded = new TextEncoder().encode(expected)
    const mockPtr = 10
    mockHeap.set(encoded, mockPtr)
    mockModule.HEAPU8 = mockHeap
    vi.spyOn(mockModule, '_get_stdout_size').mockReturnValue(encoded.length)
    vi.spyOn(mockModule, '_get_stdout_pointer').mockReturnValue(mockPtr)

    const adapter = new ModuleAdapter(mockModule)
    const result = adapter.getStdOut()

    expect(result.length).toEqual(expected.length)
    expect(result).toEqual(expect.stringContaining(expected))
  })

  it("getStdErr returns text from stderr", () => {
    const expected = "South Beach... Is that Like Palm Beach?"
    const mockHeap = new Uint8Array(260)
    const encoded = new TextEncoder().encode(expected)
    const mockPtr = 10
    mockHeap.set(encoded, mockPtr)
    mockModule.HEAPU8 = mockHeap
    vi.spyOn(mockModule, '_get_stderr_size').mockReturnValue(encoded.length)
    vi.spyOn(mockModule, '_get_stderr_pointer').mockReturnValue(mockPtr)

    const adapter = new ModuleAdapter(mockModule)
    const result = adapter.getStdErr()

    expect(result.length).toEqual(expected.length)
    expect(result).toEqual(expect.stringContaining(expected))
  })

  it('simulateMMIXAL passes the binary size to the module simulate method', () => {
    const mockBinSize = 42
    vi.spyOn(mockModule, '_get_binary_size').mockReturnValue(mockBinSize)
    const simSpy = vi.spyOn(mockModule, '_mmix_simulate')

    const adapter = new ModuleAdapter(mockModule)
    adapter.simulateMMIX()

    expect(simSpy.mock.calls.length).toBe(1)
    expect(simSpy.mock.calls).toEqual(expect.arrayContaining([[mockBinSize]]))
  })

  it('if _assemble_mmixal returns non zero, then mmixSimulate returns false', () => {
    vi.spyOn(mockModule, '_assemble_mmixal').mockReturnValue(5)

    const adapter = new ModuleAdapter(mockModule)
    const result = adapter.assembleMMIXAL('stub')

    expect(result).toBe(false)
  })
})
