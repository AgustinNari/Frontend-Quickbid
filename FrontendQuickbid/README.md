# FrontendQuickbid

App móvil del proyecto académico **QuickBid**, desarrollada en React Native con TypeScript.

---

## Requisitos previos

Asegurate de tener instalado lo siguiente antes de continuar:

| Herramienta | Versión mínima | Cómo verificar |
|---|---|---|
| Node.js | 22.11.0 | `node --version` |
| Java JDK | 17 o 21 | `java -version` |
| Android Studio | Cualquier versión reciente | — |
| Git | Cualquier versión | `git --version` |

> **Guía oficial de entorno:** https://reactnative.dev/docs/set-up-your-environment

---

## Configuración de Android

### 1. Instalar el SDK de Android

Desde **Android Studio → SDK Manager**, asegurate de tener instalado:

- **SDK Platform:** Android 14 (API 33) o superior
- **SDK Tools:** Android SDK Build-Tools, NDK (Side by side), CMake

### 2. Configurar variables de entorno

#### Windows

Agregá las siguientes variables de entorno del sistema (buscá "Variables de entorno" en el menú inicio):

```
ANDROID_HOME = C:\Users\<tu-usuario>\AppData\Local\Android\Sdk
```

Y agregá al `PATH`:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
```

#### macOS / Linux

Agregá al final de tu `~/.zshrc` o `~/.bashrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk        # macOS
# export ANDROID_HOME=$HOME/Android/Sdk              # Linux

export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
```

Luego recargá el archivo:
```bash
source ~/.zshrc
```

---

## Instalación del proyecto

```bash
# 1. Clonar el repositorio
git clone https://github.com/AgustinNari/FE-DAI.git
cd FE-DAI/FrontendQuickbid

# 2. Instalar dependencias
npm install
```

---

## Levantar la app

### Opción A — Dispositivo físico (recomendado)

1. Activá **Opciones de desarrollador** en tu celular:
   - Ir a `Ajustes → Acerca del teléfono → Número de compilación` y tocalo 7 veces

2. Activá **Depuración USB** dentro de Opciones de desarrollador

3. Conectá el celular por USB a la PC

4. Verificá que el dispositivo sea reconocido:
   ```bash
   adb devices
   # Debe mostrar tu dispositivo como "device" (no "unauthorized")
   ```

5. En una terminal, iniciá el bundler de Metro:
   ```bash
   npm start
   ```

6. En otra terminal, instalá y lanzá la app:

   **macOS / Linux:**
   ```bash
   npm run android
   ```

   **Windows:**
   ```bash
   cd android && .\gradlew.bat app:installDebug -PreactNativeDevServerPort=8081
   ```
   Luego abrí la app en el celular. Si muestra un error de conexión, ejecutá:
   ```bash
   adb reverse tcp:8081 tcp:8081
   ```

### Opción B — Emulador de Android Studio

1. Abrí Android Studio → `Tools → Device Manager`
2. Creá un Virtual Device: `+ → Create Virtual Device → Pixel 6 → API 33 → Finish`
3. Iniciá el emulador
4. En una terminal, ejecutá:
   ```bash
   npm start
   ```
5. En otra terminal:
   ```bash
   npm run android
   ```

---

## Estructura del proyecto

```
FrontendQuickbid/
├── src/
│   ├── components/
│   │   ├── Card.tsx          # Tarjeta reutilizable
│   │   └── PrimaryButton.tsx # Botón principal reutilizable
│   ├── screens/
│   │   ├── HomeScreen.tsx    # Pantalla principal
│   │   └── DetailsScreen.tsx # Pantalla de detalle
│   └── styles/
│       └── globalStyles.ts   # Estilos globales compartidos
├── App.tsx                   # Punto de entrada y navegación
└── index.js                  # Registro de la app
```

---

## Problemas frecuentes

### "adb no se reconoce como comando"
Las variables de entorno no están configuradas o no se recargaron. Reiniciá la terminal luego de configurar `ANDROID_HOME`.

### Error de conexión en dispositivo físico (Unable to load script)
El celular no puede llegar al bundler de Metro. Ejecutá:
```bash
adb reverse tcp:8081 tcp:8081
```
Y luego recargá la app sacudiendo el celular → **Reload**.

### Windows: "gradlew.bat no se reconoce"
Usá el script alternativo desde la carpeta `android/`:
```bash
cd android && .\gradlew.bat app:installDebug -PreactNativeDevServerPort=8081
```

### Windows: El build crashea (Gradle daemon disappeared)
Puede ser un problema de memoria virtual o interferencia de Windows Defender. Soluciones:
1. Agregá exclusiones en Windows Defender para las carpetas `android/`, el SDK de Android y `~/.gradle`
2. El proyecto ya tiene `org.gradle.daemon=false` configurado para mitigar esto

### Build muy lento
El proyecto compila solo para `arm64-v8a` (dispositivos físicos) y `x86_64` (emuladores). Si el primer build tarda, es normal — descarga el NDK y otras dependencias automáticamente. Los builds siguientes son mucho más rápidos.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el bundler de Metro |
| `npm run android` | Compila e instala en Android (macOS/Linux) |
| `npm run android:win` | Compila e instala en Android (Windows) |
| `npm run lint` | Corre el linter |
| `npm test` | Corre los tests |
