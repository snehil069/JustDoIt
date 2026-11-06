import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('Spawning SpeakUp Server...');
  const server = spawn('node', ['dist/server/src/index.js'], {
    cwd: __dirname,
    stdio: 'inherit',
  });

  // Wait 2 seconds for server to bind
  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    const testProcess = spawn('node', ['test-api.js'], {
      cwd: __dirname,
      stdio: 'inherit',
    });

    testProcess.on('exit', (code) => {
      console.log(`\nTests finished with code: ${code}`);
      server.kill();
      process.exit(code || 0);
    });
  } catch (err) {
    console.error('Error running tests:', err);
    server.kill();
    process.exit(1);
  }
}

main();
