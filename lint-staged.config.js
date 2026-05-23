export default {
  '*.{js,cjs,mjs,jsx,ts,tsx,vue,svelte,json,md,yml,html,md,svg,xml}': ['eslint --fix'],
  '*.{svelte}': ['pnpm run check:svelte'],
};
