/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

// HEAP8 is exported from wasm as type "any" and the linter is inconsistent on enforcement
// Since this is the wrapper for a foreign asset, we'll swallow the TSlint style warning here and remember to check the adapter if anything breaks

import type { IModuleAdapter } from './module_adapter.interface'
import { SpecialRegister } from './module_adapter.interface'
import type { MainModule } from "../../../wasm/build/wasm/module"
import { Id64 } from "@itwin/core-bentley"
import type { Id64String } from "@itwin/core-bentley"

enum RegisterType {
  GENERAL = 0,
  SPECIAL = 1
}

enum Partition {
  HIGH = 0,
  LOW = 1
}

export default class ModuleAdapter implements IModuleAdapter {
  private _module: MainModule

  constructor(module: MainModule) {
    this._module = module
  }

  /** Assembles MMIXAL source code by writing it into the WASM heap and invoking the assembler. */
  public assembleMMIXAL(sourceCode: string): boolean {
    if (sourceCode.length === 0) {
      return true
    }

    const encoded: Uint8Array = new TextEncoder().encode(sourceCode)

    if (encoded.length === 0 || encoded.every((value: number) => value === 0)) {
      console.error("encoded source can't be empty")
      return false
    }

    const ptr: number = this._module._get_source_code_pointer()

    if (ptr <= 0) {
      console.error(`mmix module returned inalid pointer for source code (value: ${String(ptr)})`)
      return false
    }

    try {
      this._module.HEAPU8.set(encoded, ptr)
    } catch (error: unknown) {
      console.error("range error writing source code to buffer")
      console.error(error?.toString())
    }

    const len = encoded.length

    if (ptr + len < this._module.HEAPU8.length) {
      this._module.HEAPU8[ptr + len] = 0
    }

    const result = this._module._assemble_mmixal(len)
    return result === 0
  }

  /** Reads and decodes the simulator's stdout buffer from the WASM heap. */
  public getStdOut(): string {
    const ptr = this._module._get_stdout_pointer()

    if (ptr <= 0) {
      console.error("bad value for stdout pointer")
      return "simulator error - check logs"
    }

    const len = this._module._get_stdout_size()

    if (len < 0) {
      console.error("length may not be negative")
      return "simulator error - check logs"
    }

    return this._decode_and_return(ptr, len)
  }

  /** Reads and decodes the simulator's stderr buffer from the WASM heap. */
  public getStdErr(): string {
    const ptr = this._module._get_stderr_pointer()

    if (ptr <= 0) {
      console.error("bad value for stderr pointer")
      return "simulator error - check logs"
    }

    const len = this._module._get_stderr_size()

    if (len < 0) {
      console.error("length may not be negative")
      return "simulator error - check logs"
    }

    return this._decode_and_return(ptr, len)
  }

  /** Initializes the MMIX simulator state via the WASM module. */
  public intitializeMMIX(): void {
    const initialized = this._module._mmix_initialize_simulator();

    if (initialized !== 0) {
      console.error("did not initialize simulator");
    }
  }

  /** Tears down the MMIX simulator and releases WASM resources. */
  public finalizeMMIX(): void {
    const finalized = this._module._mmix_finalize_simulator();

    if (finalized !== 0) {
      console.error("did not finalize simulator")
    }
  }

  /** Returns true if the MMIX simulator has halted execution. */
  public isHalted(): boolean {
    return this._module._is_halted() !== 0;
  }

  /** Executes the given number of MMIX instructions. */
  public performInstructions(instructions: number): void {
    this._module._mmix_perform_instructions(instructions);
  }

  private _decode_and_return(ptr: number, len: number): string {
    if (len === 0) {
      return ""
    }

    if (ptr < 0) {
      console.error("pointer may not be null or negative")
      return "simulator error - see logs"
    }

    if (ptr >= this._module.HEAPU8.length) {
      console.error("pointer out of range")
      return "simulator error - check logs"
    }

    const end = ptr + len

    if (end >= this._module.HEAPU8.length) {
      return new TextDecoder().decode(this._module.HEAPU8.slice(ptr)) + "--truncated"
    }

    return new TextDecoder().decode(this._module.HEAPU8.slice(ptr, end))
  }

  public getGeneralRegisterValue(index: number): Id64String {
    return this.getRegisterValue(RegisterType.GENERAL, index)
  }

  public getSpecialRegisterValue(reg: SpecialRegister) {
    return this.getRegisterValue(RegisterType.SPECIAL, reg)
  }

  get generalRegisterCount(): number {
    return this._module._general_register_count()
  }

  private getRegisterValue(registerType: RegisterType, index: number): string {
    const high = this.getUnsignedRegisterValue(registerType, index, Partition.HIGH)
    const low = this.getUnsignedRegisterValue(registerType, index, Partition.LOW)
    return Id64.fromUint32Pair(low, high)
  }

  private getUnsignedRegisterValue(registerType: RegisterType, index: number, partition: Partition): number {
    //  little unsigned right shift to coerce the return from the module
    return this._module._get_register_data(registerType, index, partition) >>> 0
  }
}
