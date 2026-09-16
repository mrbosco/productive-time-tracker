/// <reference types="vite/client" />

// Without these declarations `import.meta.env.X` is `any`, which trips
// @typescript-eslint/no-unsafe-assignment in src/api/client.ts.
interface ImportMetaEnv {
	readonly VITE_API_BASE_URL: string;
	readonly VITE_ENABLE_MSW?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
