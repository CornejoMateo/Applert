import React, { useState, useRef } from 'react';
import {
  Text,
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import appFireBase from '../Credenciales';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { validateRegisterData } from '../utils/validations';

const auth = getAuth(appFireBase);
const db = getFirestore(appFireBase);

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailInputRef = useRef(null);
  const usernameInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const repPasswordInputRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState('');

  const navigation = useNavigation();

  const handleEmailChange = (text) => {
    setEmail(text);
    if (errorMessage) setErrorMessage('');
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (errorMessage) setErrorMessage('');
  };

  const handleUsernameChange = (text) => {
    setUsername(text);
    if (errorMessage) setErrorMessage('');
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    if (errorMessage) setErrorMessage('');
  };

  const registerUser = async () => {
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    const errorMessage = validateRegisterData({ email, username, password, confirmPassword });

    if (errorMessage) {
      setErrorMessage(errorMessage);
      return;
    }

    setLoading(true); // Iniciar carga
    try {
      console.log(`Verificando username: ${trimmedUsername}`);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', trimmedUsername));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setErrorMessage('El nombre de usuario ya está en uso. Por favor, elige otro.');
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        trimmedPassword
      );
      const user = userCredential.user;
      if (username == 'Policia' || username == 'Bomberos' || username == 'DefensaCivil') {
        await setDoc(doc(db, 'users', user.uid), {
          email: trimmedEmail,
          username: trimmedUsername,
          createdAt: new Date(),
          role: username,
        });
      } else {
        await setDoc(doc(db, 'users', user.uid), {
          email: trimmedEmail,
          username: trimmedUsername,
          createdAt: new Date(),
          role: 'Ciudadano',
        });
      }

      await sendEmailVerification(user);

      Alert.alert(
        'Registro Exitoso',
        'Tu cuenta ha sido creada. Se ha enviado un correo de verificación a tu email. Por favor, verifica tu cuenta antes de iniciar sesión.',
        [{ text: 'OK', onPress: () => navigation.replace('Login') }]
      );
    } catch (error) {
      setErrorMessage('Ocurrió un error durante el registro.');
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('El correo electrónico ya está registrado.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage('La contraseña es demasiado débil.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('El formato del correo electrónico no es válido.');
      }
      setLoading(false);
    } finally {
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}
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
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="gray" style={styles.inputIcon} />
              <TextInput
                ref={emailInputRef}
                style={styles.input}
                placeholder="Correo electrónico"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                editable={!loading}
                placeholderTextColor="#888"
                returnKeyType="next"
                onSubmitEditing={() => usernameInputRef.current?.focus()}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="person-circle-outline"
                size={20}
                color="gray"
                style={styles.inputIcon}
              />
              <TextInput
                ref={usernameInputRef}
                style={styles.input}
                placeholder="Nombre de usuario"
                value={username}
                onChangeText={handleUsernameChange}
                autoCapitalize="none"
                editable={!loading}
                placeholderTextColor="#888"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
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
                placeholder="Contraseña (mín. 6 caracteres)"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="password"
                editable={!loading}
                placeholderTextColor="#888"
                returnKeyType="next"
                onSubmitEditing={() => repPasswordInputRef.current?.focus()}
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

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="gray"
                style={styles.inputIcon}
              />
              <TextInput
                ref={repPasswordInputRef}
                style={styles.inputPassword}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry={!confirmPasswordVisible}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="password"
                editable={!loading}
                placeholderTextColor="#888"
                returnKeyType="done"
                onSubmitEditing={registerUser}
              />
              <TouchableOpacity
                onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                disabled={loading}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={confirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>

            {errorMessage !== '' && <Text style={styles.error}>{errorMessage}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={registerUser}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Registrarse</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={loading}
              style={styles.linkContainer}
            >
              <Text style={[styles.linkText, loading && styles.linkTextDisabled]}>
                ¿Ya tienes cuenta? <Text style={styles.linkTextBold}>Inicia sesión</Text>
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
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
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
    backgroundColor: '#E6F0FF', // Más suave
    borderRadius: 100,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 5,
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
