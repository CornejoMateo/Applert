import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Keyboard,
  Modal,
  FlatList,
  ActionSheetIOS,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import colors from '../constants/colors';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import appFireBase from '../Credenciales';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { categories } from '../constants/categories';
import { Image } from 'expo-image';

const storage = getStorage(appFireBase);
const auth = getAuth(appFireBase);
const db = getFirestore(appFireBase);

const NewNotification = () => {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists() && docSnap.data().username) {
            setUserName(docSnap.data().username);
          } else {
            setUserName(user.email?.split('@')[0] || 'Anónimo');
          }
        } catch (error) {
          console.error('Error fetching user name:', error);
          setUserName(user.email?.split('@')[0] || 'Anónimo');
        }
      }
    };
    fetchUserName();
  }, []);

  const uploadImageAsync = async (uri) => {
    if (!uri) return null;
    setUploading(true);

    let manipulatedImage;
    try {
      manipulatedImage = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 800 } }], {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      });
    } catch (error) {
      console.error('Error manipulando imagen:', error);
      Alert.alert('Error', 'No se pudo procesar la imagen para subirla.');
      setUploading(false);
      return null;
    }

    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.error(e);
        reject(new TypeError('Network request failed'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', manipulatedImage.uri, true);
      xhr.send(null);
    });

    const fileRef = ref(storage, `attachments/${Date.now()}_${userName || 'user'}.jpg`);
    try {
      await uploadBytes(fileRef, blob);
      blob.close();
      const url = await getDownloadURL(fileRef);
      console.log('Imagen subida, URL:', url);
      setUploading(false);
      return url;
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      Alert.alert('Error', 'No se pudo subir la imagen.');
      setUploading(false);
      return null;
    }
  };

  const handleSendNotification = async () => {
    if (!selectedCategory || !title.trim() || !description.trim()) {
      Alert.alert(
        'Campos incompletos',
        'Por favor, selecciona una categoría y completa el título y la descripción.'
      );
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'No se pudo identificar al usuario. Intenta iniciar sesión de nuevo.');
      return;
    }
    setLoading(true);
    Keyboard.dismiss();

    let finalAttachmentUrl = null;
    if (selectedImageUri) {
      finalAttachmentUrl = await uploadImageAsync(selectedImageUri);
      if (!finalAttachmentUrl) {
        setLoading(false);
        return;
      }
    }

    try {
      const notificationData = {
        category: selectedCategory,
        title: title.trim(),
        description: description.trim(),
        userId: user.uid,
        userName: userName || user.email?.split('@')[0] || 'Anónimo',
        email: user.email,
        createdAt: serverTimestamp(),
        status: 'Pendiente',
        attachmentUrl: finalAttachmentUrl,
      };
      const docRef = await addDoc(collection(db, 'notifications'), notificationData);
      console.log('Notificación guardada con ID: ', docRef.id);
      Alert.alert('Éxito', 'Tu notificación ha sido enviada correctamente.');
      setSelectedCategory('');
      setTitle('');
      setDescription('');
      setSelectedImageUri(null);
      navigation.goBack();
    } catch (error) {
      console.error('Error al guardar la notificación: ', error);
      Alert.alert('Error', 'No se pudo enviar la notificación. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handlePickFile = async () => {
    if (uploading || loading) return;

    const options = ['Sacar Foto', 'Elegir de la Galería', 'Cancelar'];
    const cancelButtonIndex = 2;

    const handleSelection = (index) => {
      if (index === 0) {
        takePhoto();
      } else if (index === 1) {
        pickImage();
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex }, handleSelection);
    } else {
      Alert.alert('Adjuntar Imagen', 'Selecciona una opción', [
        { text: 'Sacar Foto', onPress: takePhoto },
        { text: 'Elegir de Galería', onPress: pickImage },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara para tomar fotos.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setSelectedImageUri(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.categoryWrapper}>
            <Text style={styles.categoryTitle}>Seleccionar categoría</Text>
            <View style={styles.categoriesContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat.id &&
                      (cat.id === 'Policia'
                        ? styles.categoryButtonActivePol
                        : cat.id === 'Bomberos'
                          ? styles.categoryButtonActiveBomb
                          : styles.categoryButtonActiveDef),
                    { borderColor: cat.color },
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                  key={cat.id}
                >
                  {cat.iconType === 'Ionicons' && (
                    <Ionicons
                      name={cat.icon}
                      size={24}
                      color={selectedCategory === cat.id ? 'white' : cat.color}
                    />
                  )}
                  {cat.iconType === 'Feather' && (
                    <Feather
                      name={cat.icon}
                      size={24}
                      color={selectedCategory === cat.id ? 'white' : cat.color}
                    />
                  )}
                  {cat.iconType === 'FontAwesome5' && (
                    <FontAwesome5
                      name={cat.icon}
                      size={24}
                      color={selectedCategory === cat.id ? 'white' : cat.color}
                    />
                  )}

                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === cat.id && styles.categoryTextActive,
                    ]}
                  >
                    {cat.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* Título */}
          <Text style={styles.label}>Título</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="create-outline" size={20} color="gray" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ej: Accidente en Av. Principal"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              placeholderTextColor="#aaa"
              returnKeyType="next"
            />
          </View>

          {/* Descripción */}
          <Text style={styles.label}>Descripción</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={styles.textArea}
              placeholder="Detalla lo sucedido..."
              value={description}
              onChangeText={setDescription}
              multiline={true}
              numberOfLines={5}
              textAlignVertical="top"
              placeholderTextColor="#aaa"
            />
          </View>

          <TouchableOpacity
            style={[styles.attachButton, (uploading || loading) && styles.buttonDisabled]}
            onPress={handlePickFile}
            disabled={uploading || loading}
          >
            <Ionicons
              name={selectedImageUri ? 'checkmark-circle-outline' : 'attach-outline'}
              size={20}
              color={selectedImageUri ? colors.success : '#007AFF'}
              style={styles.inputIcon}
            />
            <Text style={[styles.attachButtonText, selectedImageUri && { color: colors.success }]}>
              {selectedImageUri ? 'Imagen seleccionada' : 'Adjuntar Imagen (opcional)'}
            </Text>
          </TouchableOpacity>

          {selectedImageUri && (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.previewImage}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={removeImage}
                disabled={uploading || loading}
              >
                <Ionicons name="close-circle" size={28} color="rgba(0,0,0,0.6)" />
              </TouchableOpacity>
            </View>
          )}

          {/* Botones */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
              disabled={loading || uploading}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.sendButton,
                (loading || uploading) && styles.buttonDisabled,
              ]}
              onPress={handleSendNotification}
              disabled={loading || uploading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : uploading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 5 }} />
                  <Text style={styles.buttonText}>Subiendo...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Enviar</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  label: { fontSize: 16, fontWeight: '600', color: '#555', marginBottom: 5, marginLeft: 5 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333', height: '100%' },
  textAreaContainer: { minHeight: 120, alignItems: 'flex-start', paddingVertical: 10 },
  textArea: { flex: 1, fontSize: 16, color: '#333', width: '100%' },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 10,
    marginBottom: 15,
    alignSelf: 'center',
  },
  attachButtonText: { color: '#007AFF', fontSize: 15, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginHorizontal: 5,
  },
  cancelButton: { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ccc' },
  sendButton: { backgroundColor: '#007AFF' },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  cancelButtonText: { color: '#555' },
  buttonDisabled: { backgroundColor: '#A6D2FF', opacity: 0.7 },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  categoryWrapper: {
    backgroundColor: '#F7F7F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  categoryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  categoryButtonActiveBomb: {
    backgroundColor: '#E53935',
    borderColor: colors.primary,
  },
  categoryButtonActivePol: {
    backgroundColor: '#1E88E5',
    borderColor: colors.primary,
  },
  categoryButtonActiveDef: {
    backgroundColor: '#FF9800',
    borderColor: colors.primary,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryTextActive: {
    color: 'white',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: Dimensions.get('window').width / 2 - 90,
    backgroundColor: 'white',
    borderRadius: 15,
  },
});

export default NewNotification;
