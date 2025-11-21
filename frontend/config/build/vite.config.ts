import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// Custom plugin to log browser console messages to terminal
function terminalConsolePlugin() {
  return {
    name: 'terminal-console',
    transform(code: string, id: string) {
      // Only inject into the main entry point
      if (id.includes('src/main.ts')) {
        return {
          code: `
// Intercept console methods to log to terminal via HMR
if (import.meta.hot) {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
  };

  ['log', 'warn', 'error', 'info', 'debug'].forEach((method) => {
    console[method] = (...args) => {
      originalConsole[method](...args);
      import.meta.hot.send('custom:console', {
        type: method,
        args: args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ),
      });
    };
  });

  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    import.meta.hot.send('custom:console', {
      type: 'error',
      args: [\`Uncaught Error: \${event.error?.stack || event.message}\`],
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    import.meta.hot.send('custom:console', {
      type: 'error',
      args: [\`Unhandled Promise Rejection: \${event.reason}\`],
    });
  });
}

${code}`,
          map: null,
        };
      }
    },
    configureServer(server) {
      server.hot.on('custom:console', (data) => {
        const colors = {
          log: '\x1b[0m',    // Reset
          info: '\x1b[36m',   // Cyan
          warn: '\x1b[33m',   // Yellow
          error: '\x1b[31m',  // Red
          debug: '\x1b[35m',  // Magenta
        };
        const reset = '\x1b[0m';
        const color = colors[data.type] || colors.log;
        const prefix = `${color}[${data.type.toUpperCase()}]${reset}`;

        console.log(`${prefix}`, ...data.args);
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), terminalConsolePlugin()],
  // Read environment variables from project root instead of frontend directory
  envDir: path.resolve(__dirname, '../../../'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
      '@/components': path.resolve(__dirname, '../../src/components'),
      '@/lib': path.resolve(__dirname, '../../src/lib'),
      '@/components/ui': path.resolve(__dirname, '../../src/components/ui'),
    },
  },
  css: {
    postcss: './config/build/postcss.config.js',
  },
  server: {
    port: 5173,
    host: true,
  },
})