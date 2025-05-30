import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import uuid from 'react-native-uuid';
import { getAuth } from 'firebase/auth';
import appFireBase from '../Credenciales';
import { useRoute } from '@react-navigation/native';
import { updateNews } from '../services/firebaseService';

const storage = getStorage(appFireBase);
const auth = getAuth(appFireBase);
const db = getFirestore(appFireBase);

const AddNews = ({ navigation }) => {
  const route = useRoute();
  const { news: existingNews, username } = route.params || {};
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (existingNews) {
      setTitle(existingNews.title);
      setContent(existingNews.content);
      setSelectedImageUri(existingNews.imageUrl);
    }
  }, [existingNews]);

  const handlePickFile = async () => {
    const options = ['Sacar Foto', 'Elegir de la Galería', 'Cancelar'];
    const cancelButtonIndex = 2;

    const handleSelection = async (index) => {
      if (index === 0) await takePhoto();
      if (index === 1) await pickImage();
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
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Campos incompletos', 'Completa el título y contenido.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'Usuario no identificado.');
      return;
    }

    setUploading(true);

    let imageUrl = selectedImageUri;

    if (selectedImageUri && !selectedImageUri.startsWith('https')) {
      try {
        const response = await fetch(selectedImageUri);
        const blob = await response.blob();
        const imageRef = ref(storage, `news_images/${uuid.v4()}`);
        await uploadBytes(imageRef, blob);
        imageUrl = await getDownloadURL(imageRef);
      } catch (error) {
        console.error('Error subiendo imagen:', error);
        Alert.alert('Error', 'No se pudo subir la imagen.');
        setUploading(false);
        return;
      }
    }

    try {
      const newsData = {
        title: title.trim(),
        content: content.trim(),
        imageUrl: imageUrl || null,
        userId: user.uid,
        role: username,
        createdAt: existingNews ? existingNews.createdAt : serverTimestamp(),
        status: true,
        username: username,
      };

      if (existingNews) {
        await updateNews(existingNews.id, newsData);
        Alert.alert('Éxito', 'Noticia actualizada correctamente.');

        if (route.params?.onGoBack) {
          route.params.onGoBack(); // <- IMPORTANTE
        }
      } else {
        const docRef = await addDoc(collection(db, 'news'), newsData);
        const newNews = { ...newsData, id: docRef.id };
        Alert.alert('Éxito', 'Noticia creada correctamente.');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error guardando la noticia:', error);
      Alert.alert('Error', 'No se pudo guardar la noticia.');
    }

    setUploading(false);
  };

  const confirmUpdate = () => {
    Alert.alert('Confirmar actualización', '¿Estás seguro de que querés actualizar esta noticia?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: handleSubmit },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.label}>Título de la noticia</Text>
        <TextInput
          style={styles.input}
          placeholder="Escribe el título"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Contenido</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Escribe el contenido"
          multiline
          numberOfLines={6}
          value={content}
          onChangeText={setContent}
        />

        <TouchableOpacity onPress={handlePickFile} style={styles.imagePicker}>
          <Ionicons name="image-outline" size={24} color="#007AFF" />
          <Text style={styles.imageText}>Seleccionar imagen</Text>
        </TouchableOpacity>

        {selectedImageUri ? (
          <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
        ) : null}

        <TouchableOpacity
          onPress={existingNews ? confirmUpdate : handleSubmit}
          style={styles.button}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>
            {uploading ? 'Guardando...' : existingNews ? 'Actualizar noticia' : 'Publicar noticia'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default AddNews;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#F9F9F9',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  imagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  imageText: {
    color: '#007AFF',
    marginLeft: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    marginTop: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
