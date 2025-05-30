import 'dotenv/config';

export default {
  expo: {
    name: 'Applert',
    slug: 'applert',
    newArchEnabled: false,
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icono.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/images/icono.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    notification: {
      icon: './assets/images/iconoNot.png',
      iosDisplayInForeground: true,
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      versionCode: 1,
      package: 'com.mateo.juancho.appalert',
      adaptiveIcon: {
        foregroundImage: './assets/images/icono.png',
        backgroundColor: '#ffffff',
      },
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
        /*         firebase: {
          configFile: './google-services.json',
        } */
      },
      permissions: [
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
      ],
    },
    web: {
      favicon: './assets/images/icono.png',
    },
    plugins: [
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Permitir que Applert use tu ubicación para poder enviar tu posición exacta en caso de que presiones un botón de pánico.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/images/iconoNot.png',
          color: '#ffffff',
          sound: true,
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '3bcc5b3a-97af-4d63-afd4-8e59cc992f9c',
      },
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
    owner: 'mateocornejo',
  },
};
