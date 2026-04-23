import { MainModule } from '../types/module'

type ModuleFactory = (options?: Record<string, unknown>) => Promise<MainModule>

function loadScript(src: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const script = document.createElement('script')
		script.src = src
		script.onload = () => resolve()
		script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
		document.head.appendChild(script)
	})
}

export default async function moduleFactory(): Promise<MainModule> {
	if (typeof (globalThis as any).createMmixModule === 'undefined') {
		await loadScript('/mmix.js')
	}
	const factory = (globalThis as any).createMmixModule as ModuleFactory
	return await factory({
		locateFile(path: string) {
			if (path.endsWith('.wasm')) {
				return '/mmix.wasm'
			}
			return path
		}
	})
}
