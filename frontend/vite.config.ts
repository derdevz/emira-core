import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function resolveBasePath() {
  const explicitBase = process.env.VITE_BASE_PATH;
  if (explicitBase) {
    return explicitBase;
  }

  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) {
    return '/';
  }

  const [, repoName] = repository.split('/');
  if (!repoName || repoName.endsWith('.github.io')) {
    return '/';
  }

  return `/${repoName}/`;
}

// https://vite.dev/config/
export default defineConfig(async () => {
  const plugins = [react(), tailwindcss()];
  try {
    // @ts-expect-error Optional local plugin file is not present in every environment.
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
  } catch {
    // Optional plugin integration is skipped outside the original local setup.
  }
  return {
    plugins,
    base: resolveBasePath(),
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  };
})
