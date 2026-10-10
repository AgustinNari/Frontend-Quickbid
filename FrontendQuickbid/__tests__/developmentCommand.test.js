const fs = require('fs');
const path = require('path');
const vm = require('vm');

async function runCommand(platform, metroMode = 'localReverse', extraArgs = []) {
  const calls = [];
  const processStub = {
    argv: ['node', 'script', 'android', 'localReverse', ...extraArgs],
    env: { ANDROID_HOME: '/sdk', ANDROID_SERIAL: 'emulator-5556' },
    platform,
    execPath: 'node',
  };
  const scriptDirectory = path.resolve(__dirname, '../scripts');
  vm.runInNewContext(fs.readFileSync(path.join(scriptDirectory, 'development-command.js'), 'utf8'), {
    __dirname: scriptDirectory,
    process: processStub,
    console: { error() {} },
    fetch: async () => ({ json: async () => ({ mode: metroMode }) }),
    require(name) {
      if (name === 'child_process') {
        return { spawnSync: (file, args) => { calls.push({ file, args }); return { status: 0 }; } };
      }
      if (name === './development-environment') return { getApiMode() {} };
      return require(name);
    },
  });
  await new Promise(resolve => setImmediate(resolve));
  return { calls, exitCode: processStub.exitCode };
}

it.each(['linux', 'darwin', 'win32'])('uses the %s ADB executable and installs on the reversed device', async platform => {
  const result = await runCommand(platform);
  expect(result.exitCode).toBe(0);
  expect(result.calls).toHaveLength(3);
  expect(result.calls[0].file).toBe(path.join('/sdk', 'platform-tools', platform === 'win32' ? 'adb.exe' : 'adb'));
  expect(result.calls[0].args).toEqual(['-s', 'emulator-5556', 'reverse', 'tcp:8081', 'tcp:8081']);
  expect(result.calls[1].args).toEqual(['-s', 'emulator-5556', 'reverse', 'tcp:8080', 'tcp:8080']);
  expect(result.calls[2].args.slice(1)).toEqual(['run-android', '--no-packager', '--device', 'emulator-5556']);
});

it('stops before reversing ports or installing when Metro uses a different environment', async () => {
  expect(await runCommand('win32', 'public')).toEqual({ calls: [], exitCode: 1 });
});

it('rejects a second device selector before reversing ports or installing', async () => {
  expect(await runCommand('win32', 'localReverse', ['--device', 'another-device'])).toEqual({ calls: [], exitCode: 1 });
});
