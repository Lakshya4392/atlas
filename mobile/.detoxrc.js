module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    detox: {
      device: {
        type: 'android.emulator',
        device: {
          avdName: 'Pixel_9a',
        },
      },
      apps: {
        'android.debug': {
          type: 'android.apk',
          binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
          build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
        },
      },
    },
  },
};
