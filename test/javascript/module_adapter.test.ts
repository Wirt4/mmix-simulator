/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-empty-function */
import { describe, it, expect, vi, beforeEach } from "vitest"
import ModuleAdapter from "../../app/javascript/moduleAdapter/module_adapter"
import type { MainModule } from "../../wasm/build/wasm/module"

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
      _get_stderr_size: vi.fn(),
      _get_stdout_pointer: vi.fn(),
      _get_stderr_pointer: vi.fn(),
      _get_source_code_pointer: vi.fn(),
      _assemble_mmixal: vi.fn(),
      _get_stdout_size: vi.fn(),
      _mmix_initialize_simulator: vi.fn(),
      _mmix_finalize_simulator: vi.fn(),
      _mmix_perform_instructions: vi.fn(),
      _is_halted: vi.fn(),
      _general_register_count: vi.fn(),
      _special_register_count: vi.fn(),
      _get_register_data: vi.fn(),
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

  it("intitializeMMIX calls _mmix_initialize_simulator", () => {
    const initSpy = vi.spyOn(mockModule, '_mmix_initialize_simulator').mockReturnValue(0)

    const adapter = new ModuleAdapter(mockModule)
    adapter.intitializeMMIX()

    expect(initSpy).toHaveBeenCalledOnce()
  })

  it("intitializeMMIX logs error when initialization fails", () => {
    vi.spyOn(mockModule, '_mmix_initialize_simulator').mockReturnValue(-1)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

    const adapter = new ModuleAdapter(mockModule)
    adapter.intitializeMMIX()

    expect(errorSpy).toHaveBeenCalledWith("did not initialize simulator")
  })

  it("finalizeMMIX calls _mmix_finalize_simulator", () => {
    const finSpy = vi.spyOn(mockModule, '_mmix_finalize_simulator').mockReturnValue(0)

    const adapter = new ModuleAdapter(mockModule)
    adapter.finalizeMMIX()

    expect(finSpy).toHaveBeenCalledOnce()
  })

  it("finalizeMMIX logs error when finalization fails", () => {
    vi.spyOn(mockModule, '_mmix_finalize_simulator').mockReturnValue(-1)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

    const adapter = new ModuleAdapter(mockModule)
    adapter.finalizeMMIX()

    expect(errorSpy).toHaveBeenCalledWith("did not finalize simulator")
  })

  it("isHalted returns true when _is_halted returns non-zero", () => {
    vi.spyOn(mockModule, '_is_halted').mockReturnValue(1)

    const adapter = new ModuleAdapter(mockModule)

    expect(adapter.isHalted()).toBe(true)
  })

  it("isHalted returns false when _is_halted returns 0", () => {
    vi.spyOn(mockModule, '_is_halted').mockReturnValue(0)

    const adapter = new ModuleAdapter(mockModule)

    expect(adapter.isHalted()).toBe(false)
  })

  it("performInstructions calls _mmix_perform_instructions with the count", () => {
    const perfSpy = vi.spyOn(mockModule, '_mmix_perform_instructions')

    const adapter = new ModuleAdapter(mockModule)
    adapter.performInstructions(42)

    expect(perfSpy).toHaveBeenCalledOnce()
    expect(perfSpy).toHaveBeenCalledWith(42)
  })

  it('if _assemble_mmixal returns non zero, then mmixSimulate returns false', () => {
    vi.spyOn(mockModule, '_assemble_mmixal').mockReturnValue(5)

    const adapter = new ModuleAdapter(mockModule)
    const result = adapter.assembleMMIXAL('stub')

    expect(result).toBe(false)
  })

  it("given _get_register_data returns -1 for high and -100 for low, when getGeneralRegisterValue is called, then it returns  0xFFFFFFFFFFFFFF9C,", () => {
    // mock the calls for _get_register_data: high is all Fs, low is 0xFFFFFF9C
    vi.spyOn(mockModule, '_get_register_data').mockImplementation((t, i, p) => {
      return p == 0 ? -1 : -100
    })
    const expected = "0xffffffffffffff9c"
    const adapter = new ModuleAdapter(mockModule)
    expect(adapter.getGeneralRegisterValue(0)).toEqual(expected)
  })

  it("given _get_register_data returns 0 for high and 100 for low, when getGeneralRegisterValue is called, then it should return 0x64", () => {
    //100 in decimal is 0x64
    vi.spyOn(mockModule, '_get_register_data').mockImplementation((t, i, p) => {
      return p == 0 ? 0 : 100
    })
    const expected = "0x64"

    const adapter = new ModuleAdapter(mockModule)

    expect(adapter.getGeneralRegisterValue(0)).toEqual(expected)
  })

  it("when getGeneralRegisterValue is called, then it should call _get_register_data with the reg_id 0", () => {
    const spy = vi.spyOn(mockModule, '_get_register_data').mockReturnValue(0)
    const adapter = new ModuleAdapter(mockModule)

    adapter.getGeneralRegisterValue(0)
    const expected = 0

    expect(spy).toHaveBeenCalledWith(expected, expect.anything(), expect.anything())
  })

  it("when getGeneralRegisterValue is called with an index, then it should call _get_register_data with the index", () => {
    const spy = vi.spyOn(mockModule, '_get_register_data').mockReturnValue(0)
    const adapter = new ModuleAdapter(mockModule)

    const index = 5
    adapter.getGeneralRegisterValue(index)

    expect(spy).toHaveBeenCalledWith(expect.anything(), index, expect.anything())
  })
  it("when getSpecialRegisterValue is called with a register enum, then it should call _get_register_data with the correct regsiter type and index", () => {
    const spy = vi.spyOn(mockModule, '_get_register_data').mockReturnValue(0)
    const adapter = new ModuleAdapter(mockModule)

    const reg = 0
    const rbIndex = 0
    const expectedType = 1
    adapter.getSpecialRegisterValue(reg)

    expect(spy).toHaveBeenCalledWith(expectedType, rbIndex, expect.anything())
  })

  it("given _get_register_data returns -1 for high and -100 for low, when getSpecialRegisterValue is called, then it returns  0xFFFFFFFFFFFFFF9C,", () => {
    // mock the calls for _get_register_data
    vi.spyOn(mockModule, '_get_register_data').mockImplementation((t, i, p) => {
      return p == 0 ? -1 : -100
    })
    const expected = "0xffffffffffffff9c"
    const adapter = new ModuleAdapter(mockModule)
    expect(adapter.getSpecialRegisterValue(1)).toEqual(expected)
  })
})
