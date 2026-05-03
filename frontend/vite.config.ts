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

  function packageNameFromModule(id: string) {
    const [, modulePath = ''] = id.split('node_modules/');
    if (!modulePath) return null;
    const parts = modulePath.split('/');
    if (parts[0]?.startsWith('@')) {
      return `${parts[0]}/${parts[1] ?? ''}`;
    }
    return parts[0] ?? null;
  }

  return {
    plugins,
    base: resolveBasePath(),
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return;
            const pkg = packageNameFromModule(id);
            if (pkg === '@walletconnect/core' || pkg === '@walletconnect/utils') return 'wc-runtime';
            if (pkg?.startsWith('@walletconnect/')) return `wc-${pkg.split('/')[1]}`;
            if (pkg?.startsWith('@reown/')) return `reown-${pkg.split('/')[1]}`;
            if (pkg?.startsWith('@creit.tech/')) return 'stellar-wallets-kit';
            if (pkg === '@stellar/freighter-api') return 'stellar-freighter';
            if (id.includes('@stellar/stellar-sdk/lib/no-axios/horizon/')) return 'stellar-horizon';
            if (id.includes('@stellar/stellar-sdk/lib/no-axios/rpc/')) return 'stellar-rpc';
            if (id.includes('@stellar/stellar-sdk/lib/no-axios/contract/')) return 'stellar-contract';
            if (id.includes('@stellar/stellar-sdk/lib/no-axios/bindings/')) return 'stellar-bindings';
            if (id.includes('@stellar/stellar-sdk/lib/no-axios/http-client/')) return 'stellar-http';
            if (
              id.includes('@stellar/stellar-sdk/lib/no-axios/federation/') ||
              id.includes('@stellar/stellar-sdk/lib/no-axios/friendbot/') ||
              id.includes('@stellar/stellar-sdk/lib/no-axios/stellartoml/') ||
              id.includes('@stellar/stellar-sdk/lib/no-axios/webauth/')
            ) {
              return 'stellar-extras';
            }
            if (pkg === '@stellar/stellar-sdk') return 'stellar-sdk';
            if (pkg?.startsWith('@stellar/')) return `stellar-${pkg.split('/')[1]}`;
            if (pkg === 'ox') return 'wallet-ox';
            if (pkg === '@noble/hashes' || pkg === '@noble/curves') return 'wallet-noble';
            if (id.includes('@stellar')) return 'stellar';
            if (id.includes('react-router-dom')) return 'router';
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
          },
        },
      },
    },
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
