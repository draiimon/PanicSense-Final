/**
 * SIMPLE SERVER STARTER FOR RENDER DEPLOYMENT
 * 
 * This is a simple wrapper to directly start the server without
 * requiring any build process. This bypasses the need for vite
 * or other build tools.
 */

import('./server/index-wrapper.js')
  .then(() => {
    console.log('✅ Server started successfully via start-server.js wrapper');
  })
  .catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });