import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl';
import { readFileSync } from 'fs';


import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { resolve } from 'path';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(),],
  server: {
    port: 443,
    host: "0.0.0.0",
    hmr: {
      host: 'tg-mini-app.local',
      port: 443,
    },
    https: {
      key: readFileSync('.cert/localhost-key.pem'),
      cert: readFileSync('.cert/localhost.pem'),
    }
  },
  build: {
    outDir: './docs'
  },
  base: '/ton_slando/'
});
