import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 5173,
    allowedHosts: [
      'sample-buildio-25ebf5ea.onbld.com'
    ]
  }
});
