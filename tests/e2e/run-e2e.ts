import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';

function waitForServer(port: number, timeoutMs = 120_000) {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    const check = () => {
      const req = http.get({ hostname: '127.0.0.1', port, path: '/', timeout: 2000 }, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error('Server did not start in time'));
        } else {
          setTimeout(check, 1000);
        }
      });
    };
    check();
  });
}

async function runScenario() {
  const migrate = spawnSync('npm', ['run', 'db:migrate'], { stdio: 'inherit' });
  if (migrate.status !== 0) {
    throw new Error('Database migration failed');
  }

  const server = spawn('npm', ['run', 'dev'], {
    env: { ...process.env, PORT: '3000' },
    stdio: 'pipe'
  });

  server.stdout?.on('data', (chunk) => {
    process.stdout.write(`[dev] ${chunk}`);
  });
  server.stderr?.on('data', (chunk) => {
    process.stderr.write(`[dev-err] ${chunk}`);
  });

  try {
    await waitForServer(3000);
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:3000/compose', { waitUntil: 'networkidle' });
    await page.fill('textarea', '明天下午三点前交 CS 作业，优先级高，若冲突改到晚上七点后');
    await page.getByRole('button', { name: '解析任务' }).click();
    await page.waitForSelector('text=解析理由', { timeout: 30_000 });
    await page.getByRole('button', { name: '确认并保存' }).click();
    await page.waitForURL('http://127.0.0.1:3000/', { timeout: 30_000 });
    await page.waitForSelector('text=CS 作业', { timeout: 30_000 });
    await browser.close();
    console.log('E2E scenario completed successfully');
  } finally {
    server.kill('SIGTERM');
  }
}

runScenario().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
