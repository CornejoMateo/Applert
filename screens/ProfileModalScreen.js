// screens/ProfileModalScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { getAuth, signOut } from 'firebase/auth';
import appFireBase from '../Credenciales';

const auth = getAuth(appFireBase);

const ProfileModalScreen = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar la sesión.');
    }
  };

  const handleNavigate = (screen) => {
    navigation.goBack();
    navigation.navigate(screen);
  };

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => navigation.goBack()} />
      <SafeAreaView style={styles.modalContent}>
        <Text style={styles.modalTitle}>Opciones</Text>

        <TouchableOpacity style={styles.optionButton} onPress={handleLogout}>
          <Text style={[styles.optionText, styles.logoutText]}>Cerrar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    alignItems: 'center',
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    marginTop: 15,
  },
  optionButton: {
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 17,
    color: '#007AFF',
  },
  logoutText: {
    color: 'red',
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  cancelText: {
    fontSize: 17,
    color: '#555',
    fontWeight: 'bold',
  },
});

export default ProfileModalScreen;
