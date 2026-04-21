// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
	{
		ignores: [
			'app/assets/builds',
			'wasm/build'
		]
	},
	eslint.configs.recommended,
	tseslint.configs.recommended,
);
