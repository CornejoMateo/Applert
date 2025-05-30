import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  where,
  limit,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import * as Location from 'expo-location';
import appFireBase from '../Credenciales';
import colors from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import responderRoles from '../constants/responderRoles';
import { categories } from '../constants/categories';

import PanicButtonCard from '../components/PanicButtonCard';
import FilterButton from '../components/FilterButton';
import AlertListItem from '../components/AlertListItem';
import PanicAlertListItem from '../components/PanicAlertListItem';

const db = getFirestore(appFireBase);
const functions = getFunctions(appFireBase);

const cardMargin = 10;
const cardPadding = 16;

const AlertasScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { username } = route.params;
  const { user } = useAuth();

  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState(null);
  const [isSendingPanic, setIsSendingPanic] = useState(false);
  const [panicAlerts, setPanicAlerts] = useState([]);
  const [loadingPanicAlerts, setLoadingPanicAlerts] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [disabledButtons, setDisabledButtons] = useState({});

  const isResponder = username && responderRoles.includes(username);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(status);
      if (status !== 'granted') console.log('Permiso de ubicación denegado');
    })();
  }, []);

  useEffect(() => {
    if (!username || !user) {
      setLoadingAlerts(false);
      if (!loadingPanicAlerts) setIsLoading(false);
      return;
    }
    const notificationsRef = collection(db, 'notifications');
    const field = isResponder ? 'category' : 'userName';
    const value = username;

    const q = query(
      notificationsRef,
      where(field, '==', value),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedAlerts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAlerts(fetchedAlerts);
        setLoadingAlerts(false);
        if (!loadingPanicAlerts) setIsLoading(false);
      },
      (error) => {
        console.error('Error notifications listener: ', error);
        setAlerts([]);
        setLoadingAlerts(false);
        if (!loadingPanicAlerts) setIsLoading(false);
      }
    );
    return unsubscribe;
  }, [isResponder, username, user, loadingPanicAlerts]);

  useEffect(() => {
    if (!username || !user) {
      setLoadingPanicAlerts(false);
      setPanicAlerts([]);
      if (!loadingAlerts) setIsLoading(false);
      return;
    }
    setLoadingPanicAlerts(true);
    const panicAlertsRef = collection(db, 'panicAlerts');
    let q = null;
    if (isResponder) {
      q = query(
        panicAlertsRef,
        where('category', '==', username),
        orderBy('createdAt', 'desc'),
        limit(4)
      );
    } else {
      q = query(
        panicAlertsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(4)
      );
    }
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedPanicAlerts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPanicAlerts(fetchedPanicAlerts);
        setLoadingPanicAlerts(false);
        if (!loadingAlerts) setIsLoading(false);
      },
      (error) => {
        console.error('Error panic alerts listener: ', error);
        setPanicAlerts([]);
        setLoadingPanicAlerts(false);
        if (!loadingAlerts) setIsLoading(false);
      }
    );
    return unsubscribe;
  }, [isResponder, username, user, loadingAlerts]);

  const handlePanicButtonPress = async (category, senderUsername) => {
    if (isSendingPanic) return;
    if (locationPermissionStatus !== 'granted') {
      Alert.alert('Permiso Requerido', 'Necesitamos tu ubicación.', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Abrir Config.',
          onPress: () => Linking.openSettings(),
        },
      ]);
      return;
    }
    Alert.alert(
      `Confirmar Alerta ${category.title}`,
      `¿Enviar alerta a ${category.title} con tu ubicación?`,
      [
        { text: 'Cancelar' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            setIsSendingPanic(true);
            let locationData = null;
            let formattedAddress = 'Ubicación aproximada no disponible';
            try {
              let { status } = await Location.getForegroundPermissionsAsync();
              if (status !== 'granted') throw new Error('Permiso revocado');
              let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeout: 5000,
              });

              locationData = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              };

              try {
                let reverseGeocode = await Location.reverseGeocodeAsync({
                  latitude: locationData.latitude,
                  longitude: locationData.longitude,
                });
                if (reverseGeocode && reverseGeocode.length > 0) {
                  const firstResult = reverseGeocode[0];
                  const street = firstResult.street || '';
                  const streetNumber = firstResult.streetNumber || '';
                  const city = firstResult.city || '';
                  formattedAddress =
                    `${street} ${streetNumber}${street && streetNumber && city ? ',' : ''} ${city}`
                      .trim()
                      .replace(/^,|,$/g, '')
                      .trim();
                  if (!formattedAddress) formattedAddress = 'Dirección cercana obtenida'; // Fallback si no hay datos útiles
                }
              } catch (geoError) {
                console.error('Error en reverseGeocodeAsync:', geoError);
              }
            } catch (error) {
              console.error('Error obteniendo ubicación:', error);
              let alertMessage = 'No se pudo obtener tu ubicación.';
              if (error.code === 'TIMEOUT') {
                alertMessage = 'No se pudo obtener tu ubicación a tiempo. Intenta de nuevo.';
              } else if (error.message === 'Permiso revocado') {
                alertMessage = 'Se necesita permiso de ubicación para enviar la alerta.';
              }
              Alert.alert('Error ubicación', alertMessage);
              // --------------------------------------
              setIsSendingPanic(false);
              return;
            }
            if (!user) {
              Alert.alert('Error', 'Usuario no identificado.');
              setIsSendingPanic(false);
              return;
            }
            const panicAlertData = {
              userId: user.uid,
              userNamePanic: senderUsername || 'Desconocido',
              category: category.id,
              location: locationData,
              address: formattedAddress,
              createdAt: serverTimestamp(),
              status: 'Recibida',
            };
            try {
              await addDoc(collection(db, 'panicAlerts'), panicAlertData);
              Alert.alert('Alerta enviada', `Alerta para ${category.title} enviada.`);
              setDisabledButtons((prev) => ({
                ...prev,
                [category.id]: true,
              }));
              setTimeout(() => {
                setDisabledButtons((prev) => ({
                  ...prev,
                  [category.id]: false,
                }));
              }, 180000);
            } catch (error) {
              console.error('Error guardando alerta: ', error);
              Alert.alert('Error envío', 'No se pudo enviar.');
            } finally {
              setIsSendingPanic(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleSetStatus = (alertId, newStatus, targetUserId) => {
    return new Promise((resolve, reject) => {
      Alert.alert(
        'Confirmar Acción',
        `¿Marcar alerta como "${newStatus}"?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Confirmar',
            style: 'destructive',
            onPress: async () => {
              if (updatingStatusId) return resolve(false);
              setUpdatingStatusId(alertId);

              const updateStatusFunction = httpsCallable(functions, 'updatePanicAlertStatus');
              const dataToSend = {
                alertId,
                newStatus,
                targetUserId,
                responderUsername: username,
              };

              try {
                console.log('Llamando a updatePanicAlertStatus con:', dataToSend);
                const result = await updateStatusFunction(dataToSend);
                console.log('Resultado de la función:', result.data);

                Alert.alert(
                  'Éxito',
                  `Estado actualizado a "${newStatus}". Se notificará al usuario.`
                );

                setPanicAlerts((prevAlerts) =>
                  prevAlerts.map((alert) =>
                    alert.id === alertId ? { ...alert, status: newStatus } : alert
                  )
                );

                resolve(true);
              } catch (error) {
                console.error('Error al llamar a updatePanicAlertStatus:', error);
                const errorMessage =
                  error.details?.message || error.message || 'No se pudo actualizar.';
                Alert.alert('Error', errorMessage);
                resolve(false);
              } finally {
                setUpdatingStatusId(null);
              }
            },
          },
        ],
        { cancelable: true }
      );
    });
  };

  const sortedPanicAlerts = panicAlerts;
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.welcomeText}>
          {`Bienvenido, ${username === 'DefensaCivil' ? 'Defensa Civil' : username || '...'}!`}
        </Text>

        {!isResponder && (
          <>
            <Text style={styles.sectionTitle}>Enviar alerta de pánico</Text>
            <View style={styles.panicContainer}>
              {/* Usamos el componente PanicButtonCard */}
              {categories.map((item) => (
                <PanicButtonCard
                  key={item.id}
                  item={item}
                  onPress={handlePanicButtonPress}
                  isDisabled={isSendingPanic || disabledButtons[item.id]}
                  isInCooldown={!!disabledButtons[item.id]}
                  username={username}
                />
              ))}
            </View>
          </>
        )}
        {isResponder && (
          <View style={styles.filterSectionContainer}>
            <View style={styles.filterContainerFullWidth}>
              {/* Usamos el componente FilterButton */}
              {categories
                .filter((cat) => cat.id === username)
                .map((item) => (
                  <FilterButton
                    key={item.id}
                    item={item}
                    onPress={() =>
                      navigation.navigate('CategoryScreen', {
                        username: username,
                        category: item.id,
                      })
                    }
                    isFullWidth={true}
                    isResponder={isResponder}
                  />
                ))}
            </View>
          </View>
        )}

        <View style={styles.alertsSection}>
          <View style={styles.alertsHeaderContainer}>
            <Text style={styles.sectionTitle}>
              {isResponder ? 'Alertas de pánico' : 'Mis alertas de pánico'}
            </Text>
            {panicAlerts.length > 0 && (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('AllPanicAlertsScreen', {
                    username: username,
                  })
                }
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>Ver todas</Text>
              </TouchableOpacity>
            )}
          </View>
          {loadingPanicAlerts ? (
            <ActivityIndicator
              size="large"
              color={colors.fireDepartment || '#FF3B30'}
              style={{ marginTop: 20 }}
            />
          ) : (
            <View style={styles.panicCardContainer}>
              <FlatList
                data={sortedPanicAlerts}
                // Usamos el componente PanicAlertListItem
                renderItem={({ item }) => (
                  <PanicAlertListItem
                    item={item}
                    isResponder={isResponder}
                    onSetStatus={handleSetStatus}
                    updatingStatusId={updatingStatusId}
                  />
                )}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  <View style={styles.emptyListContainer}>
                    <Text style={styles.noAlertsText}>No hay alertas de pánico.</Text>
                  </View>
                }
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          )}
        </View>

        {!isResponder && (
          <View style={styles.filterSectionContainer}>
            <Text style={styles.sectionTitle}>Filtrar por categoría</Text>
            <View style={styles.filterContainerRow}>
              {/* Usamos el componente FilterButton */}
              {categories.map((item) => (
                <FilterButton
                  key={item.id}
                  item={item}
                  onPress={() =>
                    navigation.navigate('CategoryScreen', {
                      username: username,
                      category: item.id,
                    })
                  }
                  isFullWidth={false}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.alertsSection}>
          <View style={styles.alertsHeaderContainer}>
            <Text style={styles.sectionTitle}>
              {isResponder ? 'Notificaciones recientes' : 'Mis notificaciones recientes'}
            </Text>
            {alerts.length > 0 && (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('CategoryScreen', {
                    username: username,
                    category: null,
                  })
                }
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>Ver todas</Text>
              </TouchableOpacity>
            )}
          </View>
          {loadingAlerts ? (
            <ActivityIndicator
              size="large"
              color={colors.primary || '#007AFF'}
              style={{ marginTop: 20 }}
            />
          ) : (
            <FlatList
              data={alerts}
              // Usamos el componente AlertListItem
              renderItem={({ item }) => <AlertListItem item={item} isResponder={isResponder} />}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <View style={styles.emptyListContainer}>
                  <Text style={styles.noAlertsText}>
                    {isResponder
                      ? 'No tienes notificaciones recientes.'
                      : 'No has enviado notificaciones.'}
                  </Text>
                </View>
              }
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </ScrollView>

      {!isResponder && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('NuevaNotificacion')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-outline" size={32} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background || '#F7F8FA',
  },
  container: {
    paddingBottom: 90,
    paddingHorizontal: cardMargin,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background || '#F7F8FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary || '#666',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    marginLeft: 5,
    color: colors.textPrimary || '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary || '#444',
    marginLeft: 5,
    marginBottom: 12,
    marginTop: 20,
  },
  panicContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  card: {
    height: 130,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: cardMargin + 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
    padding: cardPadding,
  },
  cardText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  filterSectionContainer: {
    marginVertical: 10,
    paddingHorizontal: 5,
  },
  filterContainerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  filterContainerFullWidth: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  filterButtonBase: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    minHeight: 75,
  },
  filterButtonNormal: {
    flex: 1,
    marginHorizontal: 6,
  },
  filterButtonFullWidth: {
    width: '100%',
    paddingVertical: 15,
  },
  filterButtonText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  alertsSection: {
    marginTop: 0,
  },
  alertsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    paddingHorizontal: 5,
  },
  viewAllText: {
    color: colors.primary || '#007AFF',
    fontWeight: '500',
    fontSize: 15,
    marginTop: 9,
  },
  alertItem: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 10,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary || '#333',
    flex: 1,
    marginRight: 8,
    marginLeft: -10,
    marginBottom: 10,
  },
  alertTitleNot: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary || '#333',
    flex: 1,
    marginRight: 8,
    marginLeft: -5,
    marginBottom: 10,
  },
  alertStatus: {
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    color: 'white',
    textAlign: 'center',
    minWidth: 80,
  },
  statusPending: {
    backgroundColor: colors.statusInProgress,
  },

  statusInProgress: {
    backgroundColor: colors.statusInProgress,
  },
  statusFinished: {
    backgroundColor: colors.statusFinished,
  },
  statusUnknown: {
    backgroundColor: colors.statusUnknown,
    color: '#555',
  },
  statusPanic: {
    backgroundColor: colors.fireDepartment,
    color: 'white',
  },
  alertDetails: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 0,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  alertDetailText: {
    marginLeft: 5,
  },
  emptyListContainer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  noAlertsText: {
    textAlign: 'center',
    color: colors.textSecondary || '#888',
    fontSize: 15,
  },
  separator: {
    height: 10,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 35 : 25,
    right: 25,
    backgroundColor: colors.primary || '#007AFF',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  panicAlertItem: {
    borderColor: colors.fireDepartment || '#FF3B30',
    backgroundColor: '#FFF4F4',
    paddingBottom: 5,
  },
  enCaminoAlertItem: {
    borderColor: colors.statusInProgress || '#FFC107',
    backgroundColor: '#FFF8E1',
    paddingBottom: 5,
  },
  finalizadoAlertItem: {
    borderColor: colors.statusFinished || '#34C759',
    backgroundColor: '#F0FFF0',
    paddingBottom: 5,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  enCaminoButton: {},
  finalizadoButton: {},
  actionButtonIcon: {
    marginRight: 5,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  panicCardContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default AlertasScreen;
