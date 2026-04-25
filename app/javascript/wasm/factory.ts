import type { MainModule } from '../types/module'
import type MainModuleFactory from '../types/module'

declare const createMmixModule: typeof MainModuleFactory

function isValidDirectory(src: string): boolean {
	const dirRegex = new RegExp("^((/[a-zA-Z0-9._-]+)+|/)$")
	return dirRegex.test(src)
}

function createScriptElement(src: string): HTMLScriptElement | null {
	if (!isValidDirectory(src)) {
		return null
	}
	// creating an HTML element here is a little weird, but other strategies have broken the build
	const script = document.createElement('script')
	if (!(script instanceof HTMLScriptElement)) {
		console.error("did not create script object")
		return null
	}

	script.src = src
	return script
}

async function loadScript(src: string): Promise<boolean> {
	if (!isValidDirectory(src)) {
		console.error(`invalid directory: ${src}`)
		return false
	}

	const script = createScriptElement(src)
	if (script === null) {
		console.error("did not create script object")
		return false
	}

	const loaded = new Promise<void>((resolve, reject) => {
		script.onload = () => { resolve() }
		script.onerror = () => { reject(new Error("did not load script")) }
	})

	try {
		document.head.appendChild(script)
	} catch (error) {
		console.error("could not append script to document head")
		console.error({ error })
		return false
	}

	try {
		await loaded
		return true
	} catch (error) {
		console.error(`could not load script from source: ${src}`)
		console.error({ error })
		return false
	}
}

function resolveFilepath(path: string): string {
	return path.endsWith('.wasm') || path.length === 0 ? '/mmix.wasm' : path
}

export default async function moduleFactory(): Promise<MainModule | null> {
	if (typeof createMmixModule === 'undefined') {
		const scriptLoaded = await loadScript('/mmix.js')
		if (!scriptLoaded) {
			console.error('error loading script')
			return null
		}
	}

	try {
		interface moduleConfig { locateFile: (path: string) => string; }
		const config: moduleConfig = { locateFile: resolveFilepath }
		return await createMmixModule(config)
	} catch (error) {
		console.error("error creating mmixModule")
		console.error({ error })
		return null
	}
}
