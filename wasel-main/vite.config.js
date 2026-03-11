import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // أثناء التطوير نطبع معلومات الخادم؛ في البناء نخفض الضجيج
  logLevel: command === 'serve' ? 'info' : 'error',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    host: true,       // يتيح الوصول عبر localhost و IP
    port: 5173,       // منفذ ثابت ليتوافق مع Google Console
    strictPort: true  // يفشل إن كان مشغولًا بدل تغييره تلقائيًا
  }
}));