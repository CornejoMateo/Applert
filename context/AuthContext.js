import React, { createContext, useState, useEffect, useContext } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import appFireBase from '../Credenciales';

// Inicializar Firebase Auth y Firestore
const auth = getAuth(appFireBase);
const db = getFirestore(appFireBase);

// Crear el Context
export const AuthContext = createContext();

// Crear el proveedor del Context
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Guarda el objeto de usuario de Firebase Auth
  const [userRole, setUserRole] = useState(null); // Guarda el rol
  const [loading, setLoading] = useState(true); // Para saber si estamos verificando el estado inicial

  useEffect(() => {
    // Listener para cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser); // Actualiza el usuario de Firebase Auth

      if (authUser) {
        console.log('Usuario autenticado:', authUser.uid);
        // Si hay un usuario, busca su documento en Firestore para obtener el rol
        const userDocRef = doc(db, 'users', authUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log('Datos de usuario Firestore:', userData);
            // Asigna el rol o un rol por defecto si no existe
            setUserRole(userData.role || 'Ciudadano');
          } else {
            console.log(
              'Documento de usuario no encontrado en Firestore, asignando rol Ciudadano.'
            );
            // El documento no existe, asigna rol por defecto
            setUserRole('Ciudadano');
          }
        } catch (error) {
          console.error('Error fetching user role from Firestore:', error);
          setUserRole('Ciudadano'); // Asigna rol por defecto en caso de error
        }
      } else {
        console.log('Usuario no autenticado.');
        setUserRole(null); // No hay usuario, no hay rol
      }
      setLoading(false); // Terminamos de cargar el estado inicial
    });

    // Limpiar el listener cuando el componente se desmonte
    return () => unsubscribe();
  }, []); // El array vacío asegura que se ejecute solo al montar

  // Muestra un indicador de carga mientras se verifica el estado de auth inicial
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Provee el usuario, su rol y el estado de carga a los componentes hijos
  return (
    <AuthContext.Provider value={{ user, userRole, loading }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
