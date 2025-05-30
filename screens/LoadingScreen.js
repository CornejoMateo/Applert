import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import appFireBase from '../Credenciales';
import { collection, getDocs, query, where, getFirestore } from 'firebase/firestore';

const db = getFirestore(appFireBase);
const auth = getAuth(appFireBase);

export default function LoadingScreen({ navigation }) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const emailToUse = user.email;
          const q = query(collection(db, 'users'), where('email', '==', emailToUse));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            const username = userData.username || '';
            navigation.replace('Home', { username });
          } else {
            console.warn('Usuario logueado pero no encontrado en Firestore');
            navigation.replace('Login');
          }
        } else {
          console.log('No hay usuario logueado');
          navigation.replace('Login');
        }
      } catch (e) {
        console.log('Error en LoadingScreen:', e);
        navigation.replace('Login');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
