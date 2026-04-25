import { IModuleAdapter } from "./module_adapter.interface"
import ModuleAdapter from './module_adapter'
import moduleFactory from '../wasm/factory'

export default async function moduleAdapterFactory(): Promise<IModuleAdapter | null> {
  const module = await moduleFactory()
  return module !== null ? new ModuleAdapter(module) : null
}
