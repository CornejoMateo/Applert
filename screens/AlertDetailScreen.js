import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard,
  SafeAreaView,
  Button,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  getFirestore,
  doc,
  getDoc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext'; // Importa el hook del contexto
import appFireBase from '../Credenciales';
import colors from '../constants/colors';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FlatList as AnimatedFlatList } from 'react-native-gesture-handler'; // Para animar el scroll
import ImageViewing from 'react-native-image-viewing';
import { Image } from 'expo-image';
import { formatTimestamp } from '../utils/formatTimestamp';
import responderRoles from '../constants/responderRoles';

// Inicializar Firestore
const db = getFirestore(appFireBase);

// Placeholder mientras carga la imagen
const placeholderBlurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

const AlertDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { alertId } = route.params;
  const { user, userRole } = useAuth(); // Obtiene el usuario y su rol del contexto

  const [alertData, setAlertData] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loadingAlert, setLoadingAlert] = useState(true);
  const [loadingResponses, setLoadingResponses] = useState(true);
  const [responseText, setResponseText] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const flatListRef = useRef(null); // referencia para el scroll automático
  const [showConfirm, setShowConfirm] = useState(false);

  const [isImageViewVisible, setImageViewVisible] = useState(false);
  const [imagesForViewer, setImagesForViewer] = useState([]);

  const { date, time } = formatTimestamp(alertData?.createdAt);

  useEffect(() => {
    if (!alertId) {
      Alert.alert('Error', 'No se proporcionó ID de alerta.');
      navigation.goBack();
      return;
    }
    setLoadingAlert(true);
    const alertDocRef = doc(db, 'notifications', alertId);

    const unsubscribeAlert = onSnapshot(
      alertDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setAlertData({ id: docSnap.id, ...docSnap.data() });
        } else {
          Alert.alert('Error', 'No se encontró la notificación.');
          navigation.goBack();
        }
        setLoadingAlert(false);
      },
      (error) => {
        Alert.alert('Error', 'No se pudieron cargar los detalles.');
        setLoadingAlert(false);
        navigation.goBack();
      }
    );

    return () => unsubscribeAlert();
  }, [alertId, navigation]);

  useEffect(() => {
    if (!alertId) return;
    setLoadingResponses(true);
    const responsesCollectionRef = collection(db, 'notifications', alertId, 'responses');
    const q = query(responsesCollectionRef, orderBy('createdAt', 'asc'));

    const unsubscribeResponses = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedResponses = [];
        querySnapshot.forEach((doc) => {
          fetchedResponses.push({ id: doc.id, ...doc.data() });
        });
        setResponses(fetchedResponses);
        setLoadingResponses(false);
      },
      (error) => {
        console.error('Error fetching responses: ', error);
        setLoadingResponses(false);
      }
    );

    return () => unsubscribeResponses();
  }, [alertId]);

  const downloadAttachment = async (url, filename) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log('URL no soportada:', url);
      }
    } catch (error) {
      console.log('Error al abrir el archivo:', error);
    }
  };

  const handleSendResponse = async () => {
    const responseTrimmed = responseText.trim().replace(/\s+/g, ' ');
    if (!responseTrimmed || !user?.uid) return;

    setSendingResponse(true);
    Keyboard.dismiss();
    const responsesCollectionRef = collection(db, 'notifications', alertId, 'responses');

    const responderName = user.displayName || user.email?.split('@')[0] || 'Usuario';

    try {
      await addDoc(responsesCollectionRef, {
        text: responseTrimmed,
        userId: user.uid,
        userName: responderName,
        createdAt: serverTimestamp(),
        role: userRole || 'Usuario', // guardamos el rol para colores
      });
      setResponseText('');
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 500);
    } catch (error) {
      console.error('Error sending response: ', error);
      Alert.alert('Error', 'No se pudo enviar la respuesta.');
    } finally {
      setSendingResponse(false);
    }
  };

  const handleMarkAsResolved = async () => {
    setUpdatingStatus(true);
    const alertDocRef = doc(db, 'notifications', alertId);
    try {
      await updateDoc(alertDocRef, {
        status: 'Resuelto',
      });
      Alert.alert('Éxito', 'La notificación ha sido marcada como resuelta.');
    } catch (error) {
      console.error('Error updating status: ', error);
      Alert.alert('Error', 'No se pudo actualizar el estado.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openImageViewer = (imageUrl) => {
    if (imageUrl) {
      setImagesForViewer([{ uri: imageUrl }]);
      setImageViewVisible(true);
    }
  };

  const isImageUrl = (url) => {
    if (!url) return false;
    return /(\.(jpg|jpeg|png|gif|webp))$/i.test(url);
  };

  if (loadingAlert || !alertData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Determina si el usuario actual puede responder/resolver
  const canRespond = userRole && responderRoles.includes(userRole);
  const canResolve =
    userRole && responderRoles.includes(userRole) && alertData.status !== 'Resuelto';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.detailSection}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{alertData.title}</Text>
              <Text style={[styles.statusBadge, getStatusStyle(alertData.status)]}>
                {alertData.status}
              </Text>
            </View>
            {alertData.category == 'DefensaCivil' && (
              <Text style={styles.metadata}>Categoría: Defensa Civil</Text>
            )}
            {alertData.category != 'DefensaCivil' && (
              <Text style={styles.metadata}>Categoría: {alertData.category}</Text>
            )}
            <Text style={styles.metadata}>Reportado por: {alertData.userName}</Text>
            <Text style={styles.metadata}>Hora: {time}</Text>
            {date != '' && <Text style={styles.metadata}>Fecha: {date}</Text>}
            <Text style={styles.descriptionTitle}>Descripción:</Text>
            <Text style={styles.descriptionText}>{alertData.description}</Text>

            {alertData.attachmentUrl && (
              <View style={styles.attachmentSection}>
                <Text style={styles.attachmentTitle}>Imagen Adjunta:</Text>
                <TouchableOpacity
                  onPress={() => openImageViewer(alertData.attachmentUrl)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: alertData.attachmentUrl }}
                    style={styles.attachmentImage}
                    placeholder={placeholderBlurhash}
                    contentFit="cover"
                    transition={300}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <FlatList
            ref={flatListRef}
            data={responses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isCurrentUser = item.userId === user?.uid;
              const backgroundColor = isCurrentUser ? '#E0F7FA' : '#F5F5F5';
              const { date: respDate, time: respTime } = formatTimestamp(item.createdAt);

              const roleColors = {
                Policía: '#2196F3',
                Bomberos: '#F44336',
                DefensaCivil: '#FF9800',
              };
              const userColor = roleColors[item.role] || '#333';

              return (
                <View style={[styles.responseItem, { backgroundColor }]}>
                  <Text style={[styles.responseUser, { color: userColor }]}>
                    {item.userName || 'Usuario'}:
                  </Text>
                  <Text style={styles.responseText}>{item.text}</Text>
                  {respDate ? (
                    <Text style={styles.responseTimestamp}>{`${respDate} - ${respTime}`}</Text>
                  ) : (
                    <Text style={styles.responseTimestamp}>{respTime}</Text>
                  )}
                  {item.attachmentUrl &&
                    (isImageUrl(item.attachmentUrl) ? (
                      <TouchableOpacity onPress={() => {}}>
                        <Image
                          source={{ uri: item.attachmentUrl }}
                          style={styles.responseAttachmentImage}
                          placeholder={placeholderBlurhash}
                          contentFit="cover"
                          transition={100}
                        />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.responseAttachmentButton}
                        onPress={() => handleViewAttachment(item.attachmentUrl)}
                      >
                        <Ionicons name="document-attach-outline" size={16} color={colors.primary} />
                        <Text style={styles.responseAttachmentText}>Ver adjunto</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              );
            }}
            scrollEnabled={false}
          />
        </ScrollView>

        {canRespond && (
          <View style={styles.responseInputContainer}>
            <TextInput
              style={styles.responseInput}
              placeholder="Escribe tu respuesta..."
              value={responseText}
              onChangeText={setResponseText}
              multiline
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (sendingResponse || !responseText.trim()) && styles.buttonDisabled,
              ]}
              onPress={handleSendResponse}
              disabled={sendingResponse || !responseText.trim()}
            >
              {sendingResponse ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        )}

        {canResolve && (
          <TouchableOpacity style={styles.resolveButton} onPress={() => setShowConfirm(true)}>
            <Text style={styles.resolveButtonText}>Marcar como resuelta</Text>
          </TouchableOpacity>
        )}
        {showConfirm && (
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <Text style={{ textAlign: 'center', marginBottom: 16 }}>
                ¿Estás seguro de que querés marcarla como resuelta?
              </Text>
              <View style={styles.buttons}>
                <Button title="Cancelar" color="red" onPress={() => setShowConfirm(false)} />
                <Button
                  title="Confirmar"
                  onPress={async () => {
                    setShowConfirm(false);
                    await handleMarkAsResolved();
                  }}
                />
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      <ImageViewing
        images={imagesForViewer}
        imageIndex={0} // Siempre mostramos la primera (y única) imagen del array
        visible={isImageViewVisible}
        onRequestClose={() => setImageViewVisible(false)}
        FooterComponent={({ imageIndex }) => (
          <View style={styles.imageViewerFooter}>
            <TouchableOpacity onPress={() => setImageViewVisible(false)}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'Pendiente':
      return styles.statusPending;
    case 'En Proceso':
      return styles.statusInProgress;
    case 'Resuelto':
      return styles.statusFinished;
    default:
      return styles.statusUnknown;
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 15, paddingBottom: 20 },
  detailSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', flexShrink: 1, marginRight: 10 },
  statusBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    color: 'white',
    overflow: 'hidden',
    textAlign: 'center',
  },
  statusPending: {
    backgroundColor: colors.statusPending || 'gray',
  },
  statusInProgress: { backgroundColor: '#FFA500' },
  statusFinished: { backgroundColor: '#34C759' },
  statusUnknown: { backgroundColor: '#cccccc', color: '#555' },
  metadata: { fontSize: 13, color: '#666', marginBottom: 3 },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    color: '#444',
  },
  descriptionText: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 15 },
  responsesSection: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#444' },
  responseItem: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  responseUser: { fontWeight: 'bold', fontSize: 14, color: '#333', marginBottom: 3 },
  responseText: { fontSize: 14, color: '#444' },
  responseTimestamp: { fontSize: 11, color: '#999', textAlign: 'right', marginTop: 4 },
  noResponsesText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 15,
    marginTop: 10,
  },
  responseInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  responseInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    fontSize: 15,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 25,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resolveButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 10,
    marginTop: 5,
  },
  resolveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  buttonDisabled: { opacity: 0.5 },
  responseItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  responseUser: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  responseText: {
    fontSize: 14,
    color: '#333',
  },
  responseTimestamp: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '70%',
    textAlign: 'center',
  },
  buttons: {
    marginTop: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attachmentSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  attachmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 10,
  },
  attachmentImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },

  imageViewerFooter: {
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AlertDetailScreen;
