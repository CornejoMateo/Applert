// AllPanicAlertsScreen.js
import React, { useEffect, useState, useRef, useMemo, useLayoutEffect } from 'react';
import {
  Alert,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Linking,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getFirestore, doc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import appFireBase from '../Credenciales';
import { getPanicAlerts } from '../services/firebaseService';
import { formatTimestamp } from '../utils/formatTimestamp';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import responderRoles from '../constants/responderRoles';
import PanicAlertListItem from '../components/PanicAlertListItem';
import { handleSwipeFilterChange } from '../utils/gestureHandlers';

const db = getFirestore(appFireBase);

const cardMargin = 10;
const cardPadding = 16;

const AllPanicAlertsScreen = () => {
  const route = useRoute();
  const { username } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [panicAlerts, setPanicAlerts] = useState([]);
  const [filter, setFilter] = useState('Recibidas');
  const filters = ['Recibidas', 'En Camino', 'Finalizadas'];
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const navigation = useNavigation();
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const isResponder = username && responderRoles.includes(username);

  useEffect(() => {
    if (username) {
      const fetchAllPanicAlerts = async () => {
        const data = await getPanicAlerts(username);
        setPanicAlerts(data);
        setIsLoading(false);
      };
      fetchAllPanicAlerts();
    }
  }, [username]);

  const animateFade = () => {
    fadeAnim.setValue(0);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const getHeaderConfig = () => {
    switch (username) {
      case 'Policia':
        return { title: 'Policía', backgroundColor: '#007AFF' };
      case 'Bomberos':
        return { title: 'Bomberos', backgroundColor: '#FF3B30' };
      case 'DefensaCivil':
        return { title: 'Defensa Civil', backgroundColor: '#FFA500' };
      default:
        return { title: 'Alertas de panico', backgroundColor: '#007AFF' };
    }
  };

  useLayoutEffect(() => {
    const { title, backgroundColor } = getHeaderConfig();
    navigation.setOptions({
      title,
      headerStyle: { backgroundColor },
      headerTintColor: '#fff',
    });
  }, [navigation, username]);

  const handleSetStatus = async (alertId, newStatus, messageForUser, targetUserId) => {
    return new Promise((resolve, reject) => {
      Alert.alert(
        'Confirmar Acción',
        `¿Marcar alerta como "${newStatus}" y notificar al usuario?`,
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

              const alertDocRef = doc(db, 'panicAlerts', alertId);

              try {
                // Actualiza el estado de la alerta en Firestore
                await updateDoc(alertDocRef, {
                  status: newStatus,
                  statusUpdatedAt: serverTimestamp(),
                });

                // Si se debe enviar una notificación al usuario
                if (targetUserId && messageForUser) {
                  Alert.alert(
                    'Éxito',
                    `Estado actualizado a "${newStatus}" y notificación enviada.`
                  );
                } else {
                  Alert.alert(
                    'Éxito',
                    `Estado actualizado a "${newStatus}". No se envió notificación.`
                  );
                }

                setPanicAlerts((prevAlerts) =>
                  prevAlerts.map((alert) =>
                    alert.id === alertId ? { ...alert, status: newStatus } : alert
                  )
                );
                resolve(true);
              } catch (error) {
                console.error('Error al actualizar/notificar:', error);
                Alert.alert('Error', `No se pudo actualizar. Inténtalo de nuevo.`);
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

  const filteredAlerts = useMemo(() => {
    return panicAlerts.filter((alert) => {
      if (filter === 'Recibidas') return alert.status === 'Recibida';
      if (filter === 'En Camino') return alert.status === 'En Camino';
      if (filter === 'Finalizadas') return alert.status === 'Finalizado';
      return true;
    });
  }, [panicAlerts, filter]);

  const panRef = useRef();

  const onGestureEvent = (event) => {
    handleSwipeFilterChange(event, filter, filters, setFilter, animateFade);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.fireDepartment || '#FF3B30'} />
        <Text>Cargando alertas de pánico...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler
        onHandlerStateChange={onGestureEvent}
        ref={panRef}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View style={{ flex: 1 }}>
          <View style={styles.filterContainer}>
            {filters.map((state) => (
              <TouchableOpacity
                key={state}
                style={[
                  styles.filterButton,
                  filter === state &&
                    (state === 'Recibidas'
                      ? styles.activeFilterButtonRecibidas
                      : state === 'En Camino'
                        ? styles.statusInProgress
                        : styles.statusFinished),
                ]}
                onPress={() => setFilter(state)}
              >
                <Text style={[styles.filterText, filter === state && styles.activeFilterText]}>
                  {state}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={filteredAlerts}
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
              <Text style={{ textAlign: 'center', marginTop: 20 }}>No hay alertas.</Text>
            }
            contentContainerStyle={{ paddingBottom: 20 }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            simultaneousHandlers={panRef}
          />
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    marginVertical: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertItem: {
    backgroundColor: colors.backgroundAlertItem,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderColorAlertItem,
    marginHorizontal: 15,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
    marginLeft: -10,
    marginBottom: 10,
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
  alertStatus: {
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    color: colors.colorAlertStatus,
    textAlign: 'center',
    minWidth: 80,
  },
  panicAlertItem: {
    borderColor: colors.fireDepartment,
    backgroundColor: colors.backgroundPanicAlertItem,
    paddingBottom: 5,
  },
  enCaminoAlertItem: {
    borderColor: colors.statusInProgress,
    backgroundColor: colors.backgroundColorEnCaminoAlertItem,
    paddingBottom: 5,
  },
  finalizadoAlertItem: {
    borderColor: colors.statusFinished,
    backgroundColor: colors.backgroundColorFinalizadoAlertItem,
    paddingBottom: 5,
  },
  statusPending: {
    backgroundColor: colors.statusPending,
  },
  statusInProgress: {
    backgroundColor: colors.statusInProgress,
  },
  statusFinished: {
    backgroundColor: colors.statusFinished,
    color: '#fff',
  },
  statusUnknown: {
    backgroundColor: colors.statusUnknown,
    color: colors.colorStatusUnknown,
  },
  statusPanic: {
    backgroundColor: colors.fireDepartment,
    color: colors.colorAlertStatus,
  },
  noAlertsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
    color: colors.colorStatusUnknown,
    paddingHorizontal: 20,
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
    shadowColor: colors.shadowColorCard,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
    padding: cardPadding,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderColorAlertItem,
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
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  activeFilterButtonRecibidas: {
    backgroundColor: colors.fireDepartment,
    color: colors.colorAlertStatus,
  },
});

export default AllPanicAlertsScreen;
