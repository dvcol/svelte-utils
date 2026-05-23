import type { PluginOption } from 'vite';
import type { ViteUserConfig } from 'vitest/config';

import { fileURLToPath, URL } from 'node:url';

import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { checker } from 'vite-plugin-checker';
import { defineConfig } from 'vitest/config';

const isTest = process.env.NODE_ENV === 'test';

const plugins: PluginOption[] = [
  sveltekit(),
  checker({
    typescript: {
      tsconfigPath: 'tsconfig.build.json',
    },
  }),
];

if (isTest) {
  plugins.push(svelteTesting());
}

const config: ViteUserConfig = {
  plugins,
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src/lib', import.meta.url)),
    },
  },
  test: {
    include: ['test/**/*.{test,spec}.{js,ts}'],
    exclude: ['test/setup.test.ts'],
    environment: 'jsdom',
    setupFiles: ['./test/setup.test.ts'],
    alias: {
      '~/': fileURLToPath(new URL('./src/lib', import.meta.url)),
    },
  },
};

export default defineConfig(config);
