

Builds

eb7f05c5

EAS Workflows
Automate your builds, submissions, updates, and more with a CI/CD built for app developers.



This build does not count towards your EAS Build usage.

Android Play Store build
bd79306 · Initial commit

Profile

Environment
Runtime version
Version
Fingerprint
Commit
Created by
production
production

1.0.0
 1.0.0 (2)

aec9f83
bd79306

goodfor account icon
goodfor

Build artifact

Status
Start time
Wait time
Queue time

Build time
Total time
Availability


Errored
Jan 10, 2026 5:23 PM
0s
49s
8s
58s
30 days

Logs



Waiting to start
2s

Build is waiting in the queue


Spin up build environment
47s

Creating new worker instance
AMD, 4 vCPUs, 16 GB RAM
Using image "ubuntu-24.04-jdk-17-ndk-r27b" based on "ubuntu-2404-noble-amd64-v20250805"
Installed software:
- NDK 27.1.12297006
- Node.js 20.19.4
- Bun 1.2.20
- Yarn 1.22.22
- pnpm 10.14.0
- npm 10.9.3
- Java 17
- node-gyp 11.3.0
- Maestro 2.0.2
Project environment variables:
  EAS_USE_CACHE=1
  EAS_SAVE_CACHE=0
  __API_SERVER_URL=https://api.expo.dev/
Environment secrets:
  EXPO_TOKEN=********
EAS Build environment variables:
  SHELL=/bin/sh
  NVM_INC=/home/expo/.nvm/versions/node/v20.19.4/include/node
  JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
  MEMORY_PRESSURE_WRITE=c29tZSAyMDAwMDAgMjAwMDAwMAA=
  PWD=/usr/local/eas-build-worker
  LOGNAME=expo
  SYSTEMD_EXEC_PID=1103
  HOME=/home/expo
  LANG=en_US.UTF-8
  MEMORY_PRESSURE_WATCH=/sys/fs/cgroup/system.slice/eas-build-worker.service/memory.pressure
  INVOCATION_ID=cabd7ab9eec64007a2152a12c1dc5adb
  ANDROID_NDK_HOME=/home/expo/Android/Sdk/ndk/27.1.12297006
  NVM_DIR=/home/expo/.nvm
  ANDROID_HOME=/home/expo/Android/Sdk
  USER=expo
  SHLVL=0
  ANDROID_SDK_ROOT=/home/expo/Android/Sdk
  JOURNAL_STREAM=9:8476
  PATH=/home/expo/workingdir/bin:/home/expo/.nvm/versions/node/v20.19.4/bin:/opt/bundletool:/home/expo/Android/Sdk/build-tools/29.0.3:/home/expo/Android/Sdk/build-tools/35.0.0:/home/expo/Android/Sdk/ndk/27.1.12297006:/home/expo/Android/Sdk/cmdline-tools/tools/bin:/home/expo/Android/Sdk/tools:/home/expo/Android/Sdk/tools/bin:/home/expo/Android/Sdk/platform-tools:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin:/home/expo/.bun/bin:/home/expo/.maestro/bin
  LOGGER_LEVEL=info
  NVM_BIN=/home/expo/.nvm/versions/node/v20.19.4/bin
  EAS_BUILD_WORKER_DIR=/home/expo/eas-build-worker
  _=/home/expo/.nvm/versions/node/v20.19.4/bin/node
  CI=1
  MAESTRO_DRIVER_STARTUP_TIMEOUT=120000
  MAESTRO_CLI_NO_ANALYTICS=1
  EAS_BUILD=true
  EAS_BUILD_RUNNER=eas-build
  EAS_BUILD_PLATFORM=android
  NVM_NODEJS_ORG_MIRROR=http://nodejs.production.caches.eas-build.internal
  EAS_BUILD_PROFILE=production
  EAS_BUILD_GIT_COMMIT_HASH=bd79306b6278de50057e105438e443f41bb337b1
  EAS_BUILD_ID=eb7f05c5-6de1-4b74-8927-9d9b04ce4f49
  EAS_BUILD_WORKINGDIR=/home/expo/workingdir/build
  EAS_BUILD_PROJECT_ID=1c13e316-fcb5-40e9-b926-ff615f62bba2
  ANDROID_CCACHE=/usr/bin/ccache
  EAS_BUILD_MAVEN_CACHE_URL=http://maven.production.caches.eas-build.internal
  GRADLE_OPTS=-Dorg.gradle.jvmargs="-XX:MaxMetaspaceSize=1g -Xmx4g -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8" -Dorg.gradle.parallel=true -Dorg.gradle.daemon=false
  EAS_BUILD_ANDROID_VERSION_CODE=2
  EAS_BUILD_USERNAME=goodfor
  __EAS_BUILD_ENVS_DIR=/home/expo/workingdir/env
Builder is ready, starting build


Read package.json
1s

Using package.json:
{
  "name": "mobile",
  "main": "index",
  "version": "1.0.0",
  "scripts": {
    "postinstall": "patch-package"
  },
  "dependencies": {
    "@clerk/clerk-expo": "^2.19.15",
    "@expo-google-fonts/dev": "^0.4.7",
    "@expo/ngrok": "4.1.3",
    "@expo/vector-icons": "^15.0.2",
    "@gorhom/bottom-sheet": "5.2.6",
    "@react-native-async-storage/async-storage": "^2.2.0",
    "@react-native-community/slider": "5.0.1",
    "@react-native-masked-view/masked-view": "0.3.2",
    "@react-native-picker/picker": "2.11.1",
    "@react-navigation/bottom-tabs": "^7.2.0",
    "@react-navigation/native": "^7.0.14",
    "@shopify/react-native-skia": "2.2.12",
    "@supabase/supabase-js": "^2.90.0",
    "@tanstack/react-query": "^5.72.2",
    "@teovilla/react-native-web-maps": "^0.9.5",
    "@uploadcare/upload-client": "6.14.3",
    "color2k": "^2.0.3",
    "date-fns": "^4.1.0",
    "expo": "54.0.1",
    "expo-audio": "~1.0.10",
    "expo-auth-session": "~7.0.10",
    "expo-av": "~16.0.6",
    "expo-blur": "~15.0.6",
    "expo-build-properties": "~1.0.7",
    "expo-calendar": "~15.0.6",
    "expo-camera": "~17.0.7",
    "expo-clipboard": "~8.0.6",
    "expo-constants": "~18.0.8",
    "expo-contacts": "~15.0.8",
    "expo-crypto": "~15.0.8",
    "expo-device": "~8.0.6",
    "expo-document-picker": "~14.0.6",
    "expo-font": "~14.0.7",
    "expo-gl": "~16.0.6",
    "expo-haptics": "~15.0.6",
    "expo-image": "~3.0.7",
    "expo-image-manipulator": "~14.0.7",
    "expo-image-picker": "~17.0.7",
    "expo-linear-gradient": "~15.0.6",
    "expo-linking": "~8.0.7",
    "expo-location": "~19.0.6",
    "expo-notifications": "~0.32.10",
    "expo-router": "~6.0.0",
    "expo-secure-store": "~15.0.6",
    "expo-sensors": "~15.0.6",
    "expo-splash-screen": "~31.0.8",
    "expo-status-bar": "~3.0.7",
    "expo-symbols": "~1.0.6",
    "expo-system-ui": "~6.0.7",
    "expo-three": "^8.0.0",
    "expo-updates": "~29.0.9",
    "expo-video": "~3.0.11",
    "expo-web-browser": "~15.0.10",
    "html-to-image": "^1.11.13",
    "lodash": "^4.17.21",
    "lucide-react-native": "^0.525.0",
    "moti": "0.30.0",
    "papaparse": "^5.5.3",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.4",
    "react-native-calendars": "https://codeload.github.com/craftworkco/react-native-calendars/tar.gz/ae19e2af74ecdb29d6117ca41fbf41977a10cc23",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-graph": "^1.1.0",
    "react-native-maps": "1.20.1",
    "react-native-purchases": "^9.6.0",
    "react-native-purchases-ui": "^9.6.0",
    "react-native-reanimated": "~4.1.0",
    "react-native-reanimated-carousel": "4.0.2",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-svg": "15.12.1",
    "react-native-url-polyfill": "2.0.0",
    "react-native-web": "^0.21.0",
    "react-native-web-refresh-control": "^1.1.2",
    "react-native-webview": "13.15.0",
    "react-native-worklets": "^0.5.1",
    "serialize-error": "^12.0.0",
    "sonner-native": "^0.21.0",
    "three": "^0.166.0",
    "yup": "^1.6.1",
    "zustand": "5.0.3"
  },
  "devDependencies": {
    "@expo/cli": "^54.0.1",
    "@types/jest": "^30.0.0",
    "@types/react": "~19.1.10",
    "autoprefixer": "10.4.20",
    "jest": "~29.7.0",
    "jest-expo": "~54.0.10",
    "patch-package": "^8.0.0",
    "postcss": "8.5.2",
    "typescript": "~5.9.2"
  },
  "jest": {
    "preset": "jest-expo"
  },
  "private": true
}


Install dependencies
1s

Running "npm ci --include=dev" in /home/expo/workingdir/build directory
npm error code ERESOLVE
npm error ERESOLVE could not resolve
npm error
npm error While resolving: @clerk/clerk-expo@2.19.15
npm error Found: react@19.1.0
npm error node_modules/react
npm error   react@"19.1.0" from the root project
npm error   peer react@">=16.8.0" from @emotion/react@11.11.1
npm error   node_modules/@emotion/react
npm error     @emotion/react@"11.11.1" from @clerk/clerk-js@5.118.0
npm error     node_modules/@clerk/clerk-js
npm error       @clerk/clerk-js@"^5.118.0" from @clerk/clerk-expo@2.19.15
npm error       node_modules/@clerk/clerk-expo
npm error         @clerk/clerk-expo@"^2.19.15" from the root project
npm error   104 more (@emotion/use-insertion-effect-with-fallbacks, ...)
npm error
npm error Could not resolve dependency:
npm error peer react@"^18.0.0 || ~19.0.3 || ~19.1.4 || ~19.2.3 || ~19.3.0-0" from @clerk/clerk-expo@2.19.15
npm error node_modules/@clerk/clerk-expo
npm error   @clerk/clerk-expo@"^2.19.15" from the root project
npm error
npm error Conflicting peer dependency: react@19.2.3
npm error node_modules/react
npm error   peer react@"^18.0.0 || ~19.0.3 || ~19.1.4 || ~19.2.3 || ~19.3.0-0" from @clerk/clerk-expo@2.19.15
npm error   node_modules/@clerk/clerk-expo
npm error     @clerk/clerk-expo@"^2.19.15" from the root project
npm error
npm error Fix the upstream dependency conflict, or retry
npm error this command with --force or --legacy-peer-deps
npm error to accept an incorrect (and potentially broken) dependency resolution.
npm error
npm error
npm error For a full report see:
npm error /home/expo/.npm/_logs/2026-01-10T11_54_09_552Z-eresolve-report.txt
npm error A complete log of this run can be found in: /home/expo/.npm/_logs/2026-01-10T11_54_09_552Z-debug-0.log
npm ci --include=dev exited with non-zero code: 1


Fail job
1s

Build failed

npm ci --include=dev exited with non-zero code: 1