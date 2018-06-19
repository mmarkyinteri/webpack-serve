const { resolve } = require('path');

const execa = require('execa');
const request = require('supertest');

const cliPath = resolve(__dirname, '../lib/cli.js');

// eslint-disable-next-line no-unused-vars
const pipe = (proc) => {
  proc.stderr.pipe(process.stdout);
  proc.stdout.pipe(process.stdout);
};

const run = (flags) => {
  const args = [cliPath, flags];
  const reReady = /(Compiled successfully)|(Compiled with warnings)/i;
  const proc = execa(...args);

  // pipe(proc);

  proc.ready = new Promise((resolv) => {
    proc.stdout.on('data', (data) => {
      if (reReady.test(data.toString())) {
        resolv();
      }
    });
  });

  return proc;
};

describe('cli', () => {
  test('[config]', () => {
    const config = './test/fixtures/basic/webpack.config.js';
    const proc = run([config]);

    return proc.ready.then(() =>
      request('http://localhost:8080')
        .get('/output.js')
        .expect(200)
        .then(() => proc.kill('SIGINT'))
    );
  });

  test('--config', () => {
    const config = './test/fixtures/basic/webpack.config.js';
    const proc = run(['--config', config, '--port', '8888']);

    return proc.ready.then(() =>
      request('http://localhost:8888')
        .get('/output.js')
        .expect(200)
        .then(() => proc.kill('SIGINT'))
    );
  });

  test('bad config', () => {
    const config = './test/fixtures/invalid.config.js';
    const proc = run([config]);

    return proc.catch((e) => {
      const message = e.message
        .split(/\n\s+at/)[0]
        .replace(
          /\(node:\d+\) ExperimentalWarning: The fs.promises API is experimental\n/,
          ''
        );
      expect(message).toMatchSnapshot();
      expect(proc.exitCode).toBe(1);
    });
  });

  test('config throwing error', () => {
    const config = './test/fixtures/error.config.js';
    const proc = run([config]);

    return proc.catch((e) => {
      const message = e.message.split(/\n\s+at/);
      expect(message[0]).toMatchSnapshot();
      expect(proc.exitCode).toBe(1);
    });
  });
});