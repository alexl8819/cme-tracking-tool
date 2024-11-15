import 'dotenv/config';

export default () => {
  return {
    expo: {
      name: "app",
      slug: "app",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/images/icon.png",
      scheme: "myapp",
      userInterfaceStyle: "automatic",
      splash: {
        image: "./assets/images/splash.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      },
      ios: {
        supportsTablet: true,
        bundleIdentifier: "co.idws.cmetool"
      },
      android: {
        "adaptiveIcon": {
          "foregroundImage": "./assets/images/adaptive-icon.png",
          "backgroundColor": "#ffffff"
        },
        "package": "co.idws.cmetool",
        "permissions": [
          "android.permission.RECORD_AUDIO"
        ]
      },
      web: {
        "bundler": "metro",
        "output": "static",
        "favicon": "./assets/images/favicon.png"
      },
      plugins: [
        "expo-router",
        [
          "expo-image-picker",
          {
            "photosPermission": "The app accesses your photos to let you share them with your friends."
          }
        ],
        [
          "expo-dev-launcher",
          {
            "launchMode": "most-recent"
          }
        ]
      ],
      experiments: {
        typedRoutes: true
      },
      extra: {
        eas: {
          projectId: '8caab34d-2583-4314-a502-5291228ac369'
        },
        supabaseUrl: process.env.SUPABASE_URL,
        apiUrl: process.env.SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_ANON_KEY
      },
    },
  };
};
