import { IModuleAdapter } from "./module_adapter.interface"
import ModuleAdapter from './module_adapter'
import moduleFactory from '../wasm/factory'

/** Creates a module adapter by loading the WASM module. Returns null if loading fails. */
export default async function moduleAdapterFactory(): Promise<IModuleAdapter | null> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const module = await moduleFactory()
  return module !== null ? new ModuleAdapter(module) : null
}
