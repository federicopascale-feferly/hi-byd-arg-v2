# GitHub Actions: Build Android APK

Workflow automático que genera APKs de debug y release cada vez que hagas push a `main`.

## 🚀 Cómo funciona

1. **Automático en cada push** a `main` o `develop`
2. **Manual**: Ve a GitHub → Actions → "Build Android APK" → Run workflow
3. **Genera 2 APKs**:
   - `app-debug.apk` — para testing (sin firma, se instala en emulador/device)
   - `app-release-unsigned.apk` — para Play Store (necesita firma)

## 📥 Descargar el APK

1. Va a **Actions** en tu repo GitHub
2. Haz click en el último run
3. En "Artifacts" descargás el APK

## 🔑 Para Release (Firma + Play Store)

El APK de release sale sin firma. Para subirlo a Google Play, necesitas:

### 1. Generar keystore (una sola vez)
```bash
keytool -genkey -v -keystore ~/byd-calculator.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias byd-calculator
```

### 2. Agregar secrets a GitHub

Ve a **Settings → Secrets and variables → Actions** y agrega:

```
ANDROID_KEYSTORE_BASE64 = (base64 del archivo .jks)
ANDROID_KEYSTORE_PASSWORD = tu contraseña
ANDROID_KEY_ALIAS = byd-calculator
ANDROID_KEY_PASSWORD = tu contraseña
```

Para convertir el keystore a base64:
```bash
base64 ~/byd-calculator.jks | pbcopy  # En macOS
```

### 3. Actualizar workflow (opcional)

Agrega este step antes del `assembleRelease`:

```yaml
- name: Sign APK
  run: |
    echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > release.jks
    cd android && ./gradlew bundleRelease \
      -Pandroid.injected.signing.store.file=../release.jks \
      -Pandroid.injected.signing.store.password=${{ secrets.ANDROID_KEYSTORE_PASSWORD }} \
      -Pandroid.injected.signing.key.alias=${{ secrets.ANDROID_KEY_ALIAS }} \
      -Pandroid.injected.signing.key.password=${{ secrets.ANDROID_KEY_PASSWORD }}
```

## 📋 Estado del build

- ✅ Tests: Corren antes de buildear
- ✅ TypeScript: Se valida
- ✅ Next.js: Static export a `out/`
- ✅ Capacitor: Sync automático
- ✅ APK: Debug + Release

## 🐛 Si algo falla

Revisa los logs en **Actions** → el run fallido → revisa la sección roja.

Típicamente:
- **Java error** → Android SDK no se instaló bien
- **npm error** → Problema de dependencias
- **Gradle error** → Conflicto de versiones Android

## 📦 Próximo paso: Subir a Play Store

1. Crea cuenta en [Google Play Console](https://play.google.com/console)
2. Crea una app nueva
3. Completa la info (descripciones, screenshots, etc)
4. Sube el APK firmado
5. Espera 2-4 horas a review
6. ¡Live!

Para BYD Store: contactá con su equipo con el APK.
