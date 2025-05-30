import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
  TextInput,
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

import appFireBase from '../Credenciales';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const auth = getAuth(appFireBase);
const db = getFirestore(appFireBase);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigation = useNavigation();
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const route = useRoute();

  useEffect(() => {
    const tryAutoLogin = async () => {
      if (route.params?.auto) {
        const email = await AsyncStorage.getItem('email');
        const password = await AsyncStorage.getItem('password');
        if (email && password) {
          handleLogin(email, password);
        }
      }
    };

    tryAutoLogin();
  }, [route.params]);

  useFocusEffect(
    useCallback(() => {
      const focusInput = () => {
        setTimeout(() => {
          emailInputRef.current?.focus();
        }, 100);
      };

      focusInput();
    }, []) // El array vacío asegura que la lógica de foco se prepare una vez por montura del callback
  );

  const handleEmailChange = (text) => {
    setEmail(text);
    if (errorMessage) setErrorMessage('');
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (errorMessage) setErrorMessage('');
  };

  const logueo = async () => {
    const inputEmailOrUsername = email.trim();
    const inputPassword = password.trim();

    if (!inputEmailOrUsername || !inputPassword) {
      setErrorMessage('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    let user = null;

    try {
      let emailToUse = inputEmailOrUsername;
      let username = inputEmailOrUsername;

      if (!emailToUse.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', emailToUse));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          if (userData.email) {
            emailToUse = userData.email;
          } else {
            throw new Error('Datos de usuario incompletos');
          }
        } else {
          throw new Error('Usuario no encontrado');
        }
      }

      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, inputPassword);
      user = userCredential.user; // Asignar user aquí

      if (!user.emailVerified) {
        Alert.alert(
          'Verificación requerida',
          'Por favor, verifica tu correo electrónico para poder iniciar sesión.',
          [
            {
              text: 'OK',
              onPress: () => {
                auth.signOut();
                setLoading(false);
              },
            },
          ]
        );
        return;
      }

      if (username.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', emailToUse));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          if (userData.username) {
            username = userData.username;
          } else {
            throw new Error('Datos de usuario incompletos');
          }
        } else {
          throw new Error('Usuario no encontrado');
        }
      }

      navigation.replace('Home', {
        username: username,
      });
    } catch (error) {
      setErrorMessage('Error al iniciar sesión. Verifica tus credenciales.');
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-email' ||
        error.message === 'Usuario no encontrado'
      ) {
        setErrorMessage('El usuario o correo electrónico no fue encontrado.');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setErrorMessage('La contraseña es incorrecta o la credencial no es válida.');
      } else if (error.message === 'Datos de usuario incompletos') {
        setErrorMessage('Falta información esencial en los datos del usuario.');
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMessage(
          'Demasiados intentos fallidos. Intenta de nuevo más tarde o recupera tu contraseña.'
        );
      }

      const isEmailNotVerifiedError = user && !user.emailVerified;
    } finally {
      if (!user || (user && user.emailVerified)) {
        setLoading(false);
      }
    }
  };

  // --- Función para recuperar contraseña ---
  const recuperarContrasena = () => {
    const currentEmail = email.trim(); // Usa el valor actual del campo email/usuario
    if (!currentEmail) {
      Alert.alert(
        'Recuperar Contraseña',
        'Por favor, ingresa tu correo electrónico en el campo de arriba para recuperar tu contraseña.'
      );
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentEmail)) {
      Alert.alert(
        'Recuperar Contraseña',
        'Por favor, ingresa una dirección de correo electrónico válida.'
      );
      return;
    }

    setLoading(true);
    sendPasswordResetEmail(auth, currentEmail)
      .then(() => {
        Alert.alert(
          'Correo Enviado',
          'Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada (y spam).'
        );
      })
      .catch((error) => {
        console.error('Error al enviar correo de recuperación:', error);
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
          Alert.alert(
            'Error',
            'No se encontró ningún usuario registrado con ese correo electrónico.'
          );
        } else {
          Alert.alert('Error', 'No se pudo enviar el correo de recuperación. Inténtalo de nuevo.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <View style={styles.iconWrapper}>
              <Feather name="user" size={70} color="#007AFF" />
            </View>
            <Text style={styles.title}>Applert</Text>
            <Text style={styles.subtitle}>Municipalidad</Text>
          </View>
          <View style={styles.card}>
            {/* 2. Campo Usuario/Correo */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="gray" style={styles.inputIcon} />
              <TextInput
                ref={emailInputRef}
                style={styles.input}
                value={email}
                onChangeText={handleEmailChange}
                placeholder="Usuario o Correo electrónico"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                blurOnSubmit={false}
                editable={!loading}
                placeholderTextColor="#888"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="gray"
                style={styles.inputIcon}
              />
              <TextInput
                ref={passwordInputRef}
                style={styles.inputPassword}
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Contraseña"
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={logueo}
                editable={!loading}
                placeholderTextColor="#888"
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(!passwordVisible)}
                disabled={loading}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
            {errorMessage !== '' && <Text style={styles.error}>{errorMessage}</Text>}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={logueo}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={recuperarContrasena}
              disabled={loading}
              style={styles.linkContainer}
            >
              <Text style={[styles.linkText, loading && styles.linkTextDisabled]}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={loading}
              style={styles.linkContainer}
            >
              <Text style={[styles.linkText, loading && styles.linkTextDisabled]}>
                ¿No tienes cuenta? <Text style={styles.linkTextBold}>Regístrate aquí</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 15,
    borderRadius: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  title: {
    fontSize: 34,
    marginTop: 20,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 25,
    lineHeight: 22,
    fontWeight: '400',
  },
  icon: {
    marginTop: 10,
  },
  iconWrapper: {
    backgroundColor: '#E6F0FF',
    borderRadius: 100,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'white',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#f9f9f9',
    padding: 25,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginVertical: 10,
    width: '100%',
    height: 55,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  inputPassword: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    paddingLeft: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    minHeight: 50,
  },
  buttonDisabled: {
    backgroundColor: '#A6D2FF',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkContainer: {
    marginTop: 15,
  },
  linkText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 14,
  },
  linkTextDisabled: {
    color: '#A6D2FF',
  },
  linkTextBold: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  error: {
    color: 'red',
    fontStyle: 'italic',
    alignSelf: 'flex-start',
    marginTop: 4,
    marginLeft: 4,
    fontSize: 13,
  },
});
