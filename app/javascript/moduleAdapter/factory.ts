import { IModuleAdapter } from "./module_adapter.interface"
import ModuleAdapter from './module_adapter'
import moduleFactory from '../wasm/factory'

export default async function moduleAdapterFactory(): Promise<IModuleAdapter> {
  const module = await moduleFactory()
  return new ModuleAdapter(module)
}
