/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

// HEAP8 is exported from wasm as type "any" and the linter is inconsistent on enforcement
// Since this is the wrapper for a foreign asset, we'll swallow the TSlint style warning here and remember to check the adapter if anything breaks

import type { IModuleAdapter } from './module_adapter.interface'
import type { MainModule } from "../../../wasm/build/wasm/module"

export default class ModuleAdapter implements IModuleAdapter {
  private _module: MainModule

  constructor(module: MainModule) {
    this._module = module
  }

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

  public simulateMMIX(): void {
    this._module._mmix_simulate(1)
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
    } else {
      return new TextDecoder().decode(this._module.HEAPU8.slice(ptr, end))
    }
  }
}
