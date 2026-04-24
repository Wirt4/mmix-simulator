import type { MainModule } from '../types/module'
import type MainModuleFactory from '../types/module'

declare const createMmixModule: typeof MainModuleFactory

// function loadScript(src: string): Promise<void> {
// 	return new Promise((resolve, reject) => {
// 		const script = document.createElement('script')
// 		script.src = src
// 		script.onload = () => { resolve() }
// 		script.onerror = () => { reject(new Error(`Failed to load script: ${src}`)) }
// 		document.head.appendChild(script)
// 	})
// }

async function loadScript(src: string): Promise<void> {
	const script = document.createElement('script')
	script.src = src
	const loaded = new Promise<void>((resolve, reject) => {
		script.onload = () => resolve()
		script.onerror = () => reject(new Error(`failed to load script: ${src}`))
	})
	document.head.appendChild(script)
	await loaded
}

export default async function moduleFactory(): Promise<MainModule> {
	if (typeof createMmixModule === 'undefined') {
		await loadScript('/mmix.js')
	}
	return createMmixModule({
		locateFile(path: string) {
			if (path.endsWith('.wasm')) {
				return '/mmix.wasm'
			}
			return path
		}
	})
}

