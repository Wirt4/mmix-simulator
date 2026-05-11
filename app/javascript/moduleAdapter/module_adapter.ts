import type { IModuleAdapter } from './module_adapter.interface'
import type { MainModule } from "../../../wasm/build/wasm/module"

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

  public getListing(): string {
    return this._decode_and_return(this._module._get_listing_pointer(), this._module._get_listing_size())
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
    return this._decode_and_return(this._module._get_stdout_pointer(), this._module._get_stdout_size())
  }

  /** Reads and decodes the simulator's stderr buffer from the WASM heap. */
  public getStdErr(): string {
    return this._decode_and_return(this._module._get_stderr_pointer(), this._module._get_stderr_size())
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

  public getGeneralRegisterValue(index: number): string {
    return this.getRegisterValue(RegisterType.GENERAL, index)
  }

  public getSpecialRegisterValue(reg: number) {
    return this.getRegisterValue(RegisterType.SPECIAL, reg)
  }

  get generalRegisterCount(): number {
    return this._module._general_register_count()
  }

  private getRegisterValue(registerType: RegisterType, index: number): string {
    const high = this.getUnsignedRegisterValue(registerType, index, Partition.HIGH)
    const low = this.getUnsignedRegisterValue(registerType, index, Partition.LOW)
    return this.formatRegister(high, low)
  }

  private formatRegister(high: number, low: number): string {
    return `0x${this.toHexString(high, 8)}${this.toHexString(low, 8)}`
  }

  private toHexString(value: number, size: number): string {
    return value.toString(16).padStart(size, '0').toUpperCase()
  }

  private getUnsignedRegisterValue(registerType: RegisterType, index: number, partition: Partition): number {
    //  little unsigned right shift to coerce the return from the module
    return this._module._get_register_data(registerType, index, partition) >>> 0
  }
}
