import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true
            }
        }
    },
    build: {
        outDir: 'build'
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/setupTests.ts'
    }
});
