import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import { getNotifications } from '../services/firebaseService';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import colors from '../constants/colors';
import { formatTimestamp } from '../utils/formatTimestamp';
import responderRoles from '../constants/responderRoles';
import { handleSwipeFilterChange } from '../utils/gestureHandlers';

const CategoryScreen = () => {
  const [filter, setFilter] = useState('Todas');
  const filters = ['Todas', 'Pendiente', 'Resuelto'];
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const route = useRoute();
  const { username, category } = route.params;
  const isResponder = username && responderRoles.includes(username);

  const animateFade = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const getHeaderConfig = () => {
    switch (category) {
      case 'Policia':
        return { title: 'Policía', backgroundColor: '#007AFF' };
      case 'Bomberos':
        return { title: 'Bomberos', backgroundColor: '#FF3B30' };
      case 'DefensaCivil':
        return { title: 'Defensa Civil', backgroundColor: '#FFA500' };
      default:
        return { title: 'Todas', backgroundColor: '#007AFF' };
    }
  };

  useLayoutEffect(() => {
    const { title, backgroundColor } = getHeaderConfig();
    navigation.setOptions({
      title,
      headerStyle: { backgroundColor },
      headerTintColor: '#fff',
    });
  }, [navigation, category]);

  useEffect(() => {
    if (username) {
      const fetchNotifications = async () => {
        let data = null;
        if (category == null) {
          data = await getNotifications(username, null);
        } else {
          data = await getNotifications(username, category);
        }
        setAlerts(data);
        setLoadingAlerts(false);
      };
      fetchNotifications();
    }
  }, [username, category]);

  const filteredAlerts = filter === 'Todas' ? alerts : alerts.filter((n) => n.status === filter);

  const renderAlertItem = ({ item }) => {
    const { date, time } = formatTimestamp(item.createdAt);
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('AlertDetailScreen', { alertId: item.id })}
      >
        <View style={styles.alertItem}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertTitle} numberOfLines={1} ellipsizeMode="tail">
              {item.title || 'Sin Título'}
            </Text>
            <Text
              style={[
                styles.alertStatus,
                item.status === 'Pendiente'
                  ? styles.statusInProgress
                  : item.status === 'En Proceso'
                    ? styles.statusInProgress
                    : item.status === 'Resuelto'
                      ? styles.statusFinished
                      : styles.statusUnknown,
              ]}
            >
              {item.status || 'Desconocido'}
            </Text>
          </View>
          <Text style={styles.alertDetails}>
            {item.category === 'DefensaCivil' ? 'Defensa Civil' : item.category || 'Sin categoría'}
          </Text>
          {date != '' && (
            <Text style={styles.alertDetails}>
              {date} - {time}
            </Text>
          )}
          {date == '' && <Text style={styles.alertDetails}>{time}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  const panRef = useRef();

  const onGestureEvent = (event) => {
    handleSwipeFilterChange(event, filter, filters, setFilter, animateFade);
  };

  if (loadingAlerts) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Cargando notificaciones...</Text>
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
        <View style={{ flex: 1 }}>
          <View style={styles.filterContainer}>
            {filters.map((state) => (
              <TouchableOpacity
                key={state}
                style={[
                  styles.filterButton,
                  filter === state &&
                    (state === 'Todas'
                      ? styles.activeFilterButtonTodas
                      : state === 'Pendiente'
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

          <Animated.View style={{ opacity: fadeAnim, flex: 1, paddingBottom: 40 }}>
            <FlatList
              data={filteredAlerts}
              keyExtractor={(item) => item.id}
              renderItem={renderAlertItem}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={<Text style={styles.noNotiText}>No hay notificaciones.</Text>}
            />
          </Animated.View>

          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('NuevaNotificacion')}
          >
            <Ionicons name="add-outline" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 30,
    backgroundColor: '#f0f4f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  activeFilterButtonTodas: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: '#333',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  alertItem: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
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
    color: '#333',
    flex: 1,
    marginRight: 8,
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
    backgroundColor: colors.statusPending || 'gray',
    color: '#fff',
  },
  statusInProgress: {
    backgroundColor: colors.statusInProgress,
    color: '#fff',
  },
  statusFinished: {
    backgroundColor: colors.statusFinished,
    color: '#fff',
  },
  statusUnknown: {
    backgroundColor: '#9e9e9e',
    color: '#fff',
  },
  alertDetails: {
    fontSize: 14,
    color: '#666',
  },
  noNotiText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
});

export default CategoryScreen;
