/**
 * @file dev.js
 * @description Runs both frontend and backend development servers.
 * Prepends [FRONT] (green) and [BACKEND] (cyan) to logs.
 * Cleans up ports 2020 and 2021 on start and exit to avoid port collisions.
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const os = require('os');

const FRONT_PORT = 2020;
const BACK_PORT = 2021;

const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

const isWindows = os.platform() === 'win32';
const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');
const backendBaseArgs = ['server.js'];
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const nodeCmd = process.execPath;

let backend = null;
let frontend = null;
let isCleaningUp = false;

function killPort(port) {
  try {
    const cmd = isWindows
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} -t`;

    const output = execSync(cmd).toString();
    if (!output) return;

    const pidsToKill = new Set();

    if (isWindows) {
      const lines = output.split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5 && parts[3] === 'LISTENING') {
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') pidsToKill.add(pid);
        }
      }
    } else {
      output.split('\n').filter(Boolean).forEach(pid => pidsToKill.add(pid.trim()));
    }

    for (const pid of pidsToKill) {
      try {
        const killCmd = isWindows ? `taskkill /PID ${pid} /F /T` : `kill -9 ${pid}`;
        execSync(killCmd, { stdio: 'ignore' });
        console.log(`[SYSTEM] 이전 프로세스 정리 완료 (포트 ${port}, PID: ${pid})`);
      } catch (error) {
        // Ignore already-exited processes.
      }
    }
  } catch (error) {
    // Ignore ports that are not in use.
  }
}

function killChildTree(child) {
  if (!child || !child.pid) return;

  try {
    const killCmd = isWindows ? `taskkill /PID ${child.pid} /F /T` : `kill -9 ${child.pid}`;
    execSync(killCmd, { stdio: 'ignore' });
  } catch (error) {
    // Ignore already-exited processes.
  }
}

function prefixLog(data, prefix, color) {
  const lines = data.toString().split('\n');
  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');
    if (line.trim() === '') continue;
    process.stdout.write(`${color}${prefix}${RESET} ${line}\n`);
  }
}

function attachBackendListeners(child) {
  child.stdout.on('data', data => prefixLog(data, '[BACKEND]', CYAN));
  child.stderr.on('data', data => prefixLog(data, '[BACKEND]', CYAN));
  child.on('error', (error) => {
    if (!isCleaningUp) {
      console.error(`[BACKEND] 실행 실패: ${error.message}`);
    }
  });
  child.on('exit', (code, signal) => {
    if (!isCleaningUp && code !== 0 && code !== null) {
      console.log(`[BACKEND] 프로세스가 종료되었습니다. (Exit Code: ${code}${signal ? `, Signal: ${signal}` : ''})`);
    }
  });
}

function attachFrontendListeners(child) {
  child.stdout.on('data', data => prefixLog(data, '[FRONT]', GREEN));
  child.stderr.on('data', data => prefixLog(data, '[FRONT]', GREEN));
  child.on('error', (error) => {
    if (!isCleaningUp) {
      console.error(`[FRONT] 실행 실패: ${error.message}`);
    }
  });
  child.on('exit', (code) => {
    if (!isCleaningUp && code !== 0 && code !== null) {
      console.log(`[FRONT] 프로세스가 종료되었습니다. (Exit Code: ${code})`);
    }
  });
}

function spawnBackend(reason = '초기 시작') {
  killPort(BACK_PORT);

  console.log(`[SYSTEM] 백엔드 시작: ${reason}`);

  try {
    backend = spawn(nodeCmd, backendBaseArgs, {
      cwd: backendDir,
      shell: false,
      windowsHide: isWindows,
    });
  } catch (error) {
    console.error(`[BACKEND] 실행 실패: ${error.message}`);
    return null;
  }

  attachBackendListeners(backend);
}

function spawnFrontend() {
  frontend = spawn(npmCmd, ['run', 'dev'], {
    cwd: frontendDir,
    shell: isWindows,
    windowsHide: isWindows,
  });

  attachFrontendListeners(frontend);
}

function cleanup(reason) {
  if (isCleaningUp) return;
  isCleaningUp = true;

  console.log(`\n[SYSTEM] 서버를 안전하게 종료하고 포트를 정리합니다... (이유: ${reason})`);

  killChildTree(backend);
  killChildTree(frontend);
  killPort(FRONT_PORT);
  killPort(BACK_PORT);

  console.log('[SYSTEM] 종료 완료.');
  process.exit(0);
}

console.log(`\n[SYSTEM] 시작 전 기존 프로세스와 포트 충돌 방지를 위해 ${FRONT_PORT}, ${BACK_PORT} 포트를 정리합니다...`);
killPort(FRONT_PORT);
killPort(BACK_PORT);

console.log('[SYSTEM] 백엔드와 프론트엔드 서버를 시작합니다...\n');
spawnBackend();
spawnFrontend();

process.on('SIGINT', () => cleanup('SIGINT'));
process.on('SIGTERM', () => cleanup('SIGTERM'));
