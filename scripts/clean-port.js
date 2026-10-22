// Automatically frees port 3000 from orphaned child processes before dev server boots
const { execSync } = require('child_process');

function freePort(port) {
  if (process.platform === 'win32') {
    try {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = output.trim().split('\n');
      const pids = new Set();
      for (const line of lines) {
        if (line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && pid !== String(process.pid)) {
            pids.add(pid);
          }
        }
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`[clean-port] Cleared orphaned background process ${pid} on port ${port}`);
        } catch {
          // Process already terminated
        }
      }
    } catch {
      // Port is already free
    }
  } else {
    try {
      execSync(`lsof -ti :${port} | xargs kill -9`, { stdio: 'ignore' });
    } catch {
      // Port is already free
    }
  }
}

freePort(3000);
