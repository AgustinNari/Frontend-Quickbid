const { spawnSync } = require('child_process');
const path = require('path');
const { getApiMode } = require('./development-environment');

async function main() {
  const [command, mode, ...args] = process.argv.slice(2);
  process.env.QUICKBID_API_MODE = mode;
  getApiMode();
  const cli = path.join(__dirname, '..', 'node_modules', 'react-native', 'cli.js');
  if (command === 'android') {
    let environment;
    try {
      const response = await fetch('http://127.0.0.1:8081/quickbid-environment');
      environment = await response.json();
    } catch {
      throw new Error(`Iniciá primero Metro para ${mode} con el script start correspondiente.`);
    }
    if (environment.mode !== mode) {
      throw new Error(`Metro usa ${environment.mode}; reinicialo en ${mode} antes de instalar.`);
    }
    const serial = process.env.ANDROID_SERIAL;
    if (serial && args.some(arg => arg === '--device' || arg === '--deviceId' || arg.startsWith('--device='))) {
      throw new Error('Usá ANDROID_SERIAL sin --device para seleccionar el mismo dispositivo en ADB y React Native.');
    }
    if (serial) args.unshift('--device', serial);
    const adb = process.env.ANDROID_HOME
      ? path.join(process.env.ANDROID_HOME, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb')
      : 'adb';
    for (const port of mode === 'localReverse' ? [8081, 8080] : [8081]) {
      const result = spawnSync(adb, [...(serial ? ['-s', serial] : []), 'reverse', `tcp:${port}`, `tcp:${port}`], { stdio: 'inherit' });
      if (result.error || result.status !== 0) throw new Error('No se pudo configurar ADB reverse; seleccioná ANDROID_SERIAL.');
    }
  }
  const result = spawnSync(process.execPath, [cli, ...(command === 'start' ? ['start', '--reset-cache'] : ['run-android', '--no-packager']), ...args], { stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
