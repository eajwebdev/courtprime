import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vite';

/**
 * Every page component, as its own Vite input.
 *
 * app.blade.php asks for the current page's chunk by source path:
 *
 *     @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
 *
 * so the build has to guarantee a manifest key for every page. Listing only
 * app.tsx did not: pages reached through `import.meta.glob` got their keys as a
 * side effect of Rollup giving each dynamic import its own chunk, which holds
 * right up until a chunk turns out to be shared.
 *
 * welcome.tsx is exactly that case. It lazily imports section-analytics, which
 * statically imports MarketingSection, which Rollup had placed in welcome's own
 * chunk — so the chunk became shared, Vite renamed it `_welcome-*.js`, and the
 * `resources/js/pages/welcome.tsx` key vanished from the manifest. Production
 * answered every request for the landing page with
 * `Unable to locate file in Vite manifest`, while dev — which never reads the
 * manifest — was perfectly happy.
 *
 * Declaring the pages makes each one a real entry, so the key is there because
 * it was asked for rather than because the chunker happened to oblige.
 */
const pageInputs = readdirSync('resources/js/pages', { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
    .map((entry) =>
        join(entry.parentPath ?? entry.path, entry.name)
            .split('\\')
            .join('/'),
    );

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx', ...pageInputs],
            ssr: 'resources/js/ssr.jsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
});
