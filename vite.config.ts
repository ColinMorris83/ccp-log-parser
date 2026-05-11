import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  appType: 'spa',
  base: '/ccp-log-parser/',
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-mui',
              priority: 3,
              test: (id) => id.includes('node_modules') && id.includes('@mui/'),
            },
            {
              name: 'vendor-mrt',
              priority: 2,
              test: (id) => id.includes('node_modules') && id.includes('material-react-table'),
            },
            {
              name: 'vendor-react',
              priority: 1,
              test: (id) => id.includes('node_modules') && (id.includes('react-dom') || id.includes('/react/')),
            },
          ],
        },
      },
    },
    target: ['esnext'],
  },
  plugins: [react()],
  server: {
    open: true,
    port: 3100,
    strictPort: true,
  },
});
