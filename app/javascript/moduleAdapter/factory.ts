import { IModuleAdapter } from "./module_adapter.interface"
import { MainModule } from '../types/module'
import ModuleAdapter from './module_adapter'
import moduleFactory from '../wasm/factory'

export default async function moduleAdapterFactory(): Promise<IModuleAdapter> {
  const module = (await moduleFactory()) as MainModule
  const adapter = new ModuleAdapter(module) as IModuleAdapter
  return adapter
}
