import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {ocrPlugin} from './ocr-server.mjs'
export default defineConfig({plugins:[react(),ocrPlugin()],build:{rollupOptions:{output:{manualChunks(id){if(/node_modules\/(?:@paddleocr|@techstark|clipper-lib|js-yaml)\//.test(id.replaceAll('\\','/')))return 'score-scan-ocr';if(id.includes('onnxruntime-web'))return 'score-scan-ort';if(id.includes('exceljs'))return 'score-scan-excel'}}}}})
