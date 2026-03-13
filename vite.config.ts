import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-router': ['react-router-dom'],
                    'vendor-charts': ['recharts'],
                    'vendor-supabase': ['@supabase/supabase-js'],
                    'vendor-icons': ['react-icons'],
                },
            },
        },
    },
    server: {
        proxy: {
            '/api': 'http://localhost:3001',
        },
        watch: {
            ignored: [
                '**/server/**',
                '**/.agent/**',
                '**/.gemini/**',
                '**/node_modules/**',
                '**/db.txt',
                '**/.env',
                '**/stitch-screens/**',
            ],
        },
    },
})
