import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  // --- DEBUG LOGGING ---
  if (!env.API_KEY) {
      console.warn("\n\n⚠️  -------------------------------------------------------");
      console.warn("⚠️  WARNING: API_KEY not found in .env file!");
      console.warn("⚠️  Please create a .env file in the root directory.");
      console.warn("⚠️  Content should be: API_KEY=AIzaSy...");
      console.warn("⚠️  -------------------------------------------------------\n\n");
  } else {
      console.log("\n\n✅ -------------------------------------------------------");
      console.log(`✅ SUCCESS: API_KEY loaded! (Starts with: ${env.API_KEY.substring(0, 5)}...)`);
      console.log("✅ -------------------------------------------------------\n\n");
  }
  // ---------------------

  return {
    plugins: [react()],
    define: {
      // Vital: Make process.env.API_KEY available in the browser code
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  }
})