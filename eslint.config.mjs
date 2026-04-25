// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
	{
		ignores: [
			'app/assets/builds/**',
			'node_modules/**',
			'config/**',
			'wasm/build/**',
			'app/views/pwa/**',
			'app/javascript/types/**',
			'public/*.js',
		]
	},
	eslint.configs.recommended,
	tseslint.configs.strictTypeChecked,
	tseslint.configs.stylisticTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ['eslint.config.mjs', 'vitest.config.ts'],
				},
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
);
