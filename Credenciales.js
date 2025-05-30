import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from '@env';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

// Verifica si ya existe una instancia de la aplicación
const appFireBase = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Inicializar Auth con persistencia
const auth = initializeAuth(appFireBase, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Inicializar Firestore con configuración optimizada
const db = initializeFirestore(appFireBase, {
  experimentalForceLongPolling: true, // Ayuda con problemas de conectividad
  cacheSizeBytes: 50 * 1024 * 1024, // 50MB de caché
});

// Habilitar persistencia offline
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistencia fallida: múltiples pestañas abiertas');
  } else if (err.code === 'unimplemented') {
    console.warn('Persistencia no soportada en este navegador');
  }
});

export { appFireBase, auth, db };
