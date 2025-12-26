const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withReactNativeMaps(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || config?.extra?.googleMapsApiKey;
    if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY not set');

    const app = androidManifest.application[0];
    app['meta-data'] = app['meta-data'] || [];
    const hasKey = app['meta-data'].some(
      (meta) => meta.$['android:name'] === 'com.google.android.geo.API_KEY'
    );
    if (!hasKey) {
      app['meta-data'].push({
        $: {
          'android:name': 'com.google.android.geo.API_KEY',
          'android:value': apiKey,
        },
      });
    }
    return config;
  });
};
