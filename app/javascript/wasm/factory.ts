import { createRequire } from "module";
import path from "path";
import { MainModule } from '../types/module'

export default async function moduleFactory(): Promise<MainModule> {
	const stubRequire = createRequire(import.meta.url) as (id: string) => any
	const wasmDirectory = "wasm/build/wasm/mmix.js"
	const workingDirectory = process.cwd() as string
	const absolutePath = path.resolve(workingDirectory, wasmDirectory) as string
	const createMmixModule = stubRequire(absolutePath) as () => Promise<MainModule>
	const module = (await createMmixModule()) as MainModule
	return module
}
