const { execFileSync } = require('child_process');

function bundledEnvironment(mode, development) {
  const script = `
    const babel = require('@babel/core');
    const vm = require('vm');
    const transformed = babel.transformFileSync('src/api/config.ts');
    const context = { exports: {}, __DEV__: ${development}, console: {info() {}} };
    vm.runInNewContext(transformed.code, context);
    process.stdout.write(JSON.stringify({mode: context.exports.API_MODE, api: context.exports.API_BASE_URL, ws: context.exports.WS_BASE_URL}));
  `;
  return JSON.parse(
    execFileSync(process.execPath, ['-e', script], {
      env: { ...process.env, QUICKBID_API_MODE: mode },
      encoding: 'utf8',
      stdio: 'pipe',
    }),
  );
}

describe('bundled API environment', () => {
  it('keeps public as the default', () => {
    expect(bundledEnvironment('', true).mode).toBe('public');
  });

  it.each([
    ['localReverse', 'localhost'],
    ['emulator', '10.0.2.2'],
  ])('selects %s for REST and WebSocket in development', (mode, host) => {
    expect(bundledEnvironment(mode, true)).toEqual({
      mode,
      api: `http://${host}:8080`,
      ws: `ws://${host}:8080`,
    });
  });

  it.each(['localReverse', 'emulator'])('keeps production public even when Metro receives %s', mode => {
    const environment = bundledEnvironment(mode, false);
    expect(environment.mode).toBe('public');
    expect(environment.api).toMatch(/^https:\/\//);
    expect(environment.ws).toMatch(/^wss:\/\//);
  });

  it('rejects an unknown build environment', () => {
    expect(() => bundledEnvironment('unknown', true)).toThrow();
  });
});
