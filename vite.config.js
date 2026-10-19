import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {ocrPlugin} from './ocr-server.mjs'
export default defineConfig({plugins:[react(),ocrPlugin()]})
