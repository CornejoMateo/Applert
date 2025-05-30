import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import colors from '../constants/colors';
import { formatTimestamp } from '../utils/formatTimestamp';
import MapView, { Marker } from 'react-native-maps';

const PanicAlertDetailScreen = () => {
  const route = useRoute();
  const { item, isResponder, updatingStatusId, onSetStatus } = route.params || {};
  const [localItem, setLocalItem] = useState(item);

  const [address, setAddress] = useState('Obteniendo dirección...');
  const [addressLoading, setAddressLoading] = useState(true);
  const lat = item?.location?.latitude;
  const lon = item?.location?.longitude;

  const isLoading = updatingStatusId === item.id;
  const isEnCaminoDisabled =
    isLoading || localItem.status === 'En Camino' || localItem.status === 'Finalizado';
  const isFinalizadoDisabled = isLoading || localItem.status === 'Finalizado';
  const [confirmed, setConfirmed] = useState(false);
  const [statusUpdated, setStatusUpdated] = useState(false);

  useEffect(() => {
    setLocalItem(item);
  }, [item]);

  const handleSetStatus = async (newStatus) => {
    try {
      const confirmed = await onSetStatus(localItem.id, newStatus, localItem.userId);
      if (confirmed) {
        setLocalItem((prev) => ({ ...prev, status: newStatus }));
        setStatusUpdated(true);
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado.');
    }
  };

  useEffect(() => {
    if (lat !== undefined && lon !== undefined) {
      const fetchAddress = async () => {
        setAddressLoading(true);
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setAddress('Permiso de ubicación denegado.');
            setAddressLoading(false);
            return;
          }

          let reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: lat,
            longitude: lon,
          });
          if (reverseGeocode && reverseGeocode.length > 0) {
            const firstResult = reverseGeocode[0];
            const street = firstResult.street || '';
            const streetNumber = firstResult.streetNumber || '';
            const city = firstResult.city || '';
            const formattedAddress =
              `${street} ${streetNumber}${street && streetNumber && city ? ',' : ''} ${city}`
                .trim()
                .replace(/,$/, '');
            setAddress(formattedAddress || 'Dirección no encontrada');
          } else {
            setAddress('Dirección no encontrada');
          }
        } catch (error) {
          console.error('Error en reverseGeocodeAsync:', error);
          setAddress('Error al obtener dirección');
        } finally {
          setAddressLoading(false);
        }
      };
      fetchAddress();
    }
  }, [lat, lon]);

  if (!item || !item.location) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          Error: Datos de alerta incompletos o ubicación no disponible.
        </Text>
      </View>
    );
  }

  const { location, userNamePanic, category, createdAt } = localItem;
  const categoryDisplay = category === 'DefensaCivil' ? 'Defensa Civil' : category;
  const { date, time } = formatTimestamp(createdAt);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Recibida':
        return styles.statusPanic;
      case 'En Camino':
        return styles.statusInProgress;
      case 'Finalizado':
        return styles.statusFinished;
      default:
        return styles.statusUnknown;
    }
  };

  const cardStatusStyle =
    localItem.status === 'En Camino'
      ? styles.enCaminoBackground
      : localItem.status === 'Finalizado'
        ? styles.finalizadoBackground
        : styles.recibidaBackground;

  const initialRegion = {
    latitude: lat,
    longitude: lon,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const handleOpenExternalMap = () => {
    if (lat !== undefined && lon !== undefined) {
      const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
      const latLng = `${lat},${lon}`;
      const label = `Alerta de ${item?.userNamePanic || 'Usuario'}`;
      const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`,
      });

      Linking.openURL(url).catch((err) => {
        console.error('Error al abrir mapa externo:', err);
        Alert.alert('Error', 'No se pudo abrir la aplicación de mapas.');
      });
    } else {
      Alert.alert('Ubicación No Disponible', 'No hay coordenadas válidas para abrir en el mapa.');
    }
  };

  return (
    <ScrollView style={[styles.container, cardStatusStyle]}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerta de pánico</Text>
        <Text style={[styles.statusBadge, getStatusStyle(localItem.status)]}>
          {localItem.status || '?'}
        </Text>
      </View>

      <View style={styles.detailSection}>
        <View style={styles.detailRow}>
          <Ionicons
            name="person-outline"
            size={18}
            color={colors.textSecondary}
            style={styles.icon}
          />
          <Text style={styles.detailLabel}>Usuario:</Text>
          <Text style={styles.detailValue}>{userNamePanic || 'Desconocido'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color={colors.textSecondary}
            style={styles.icon}
          />
          <Text style={styles.detailLabel}>Categoría:</Text>
          <Text style={styles.detailValue}>{categoryDisplay}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons
            name="time-outline"
            size={18}
            color={colors.textSecondary}
            style={styles.icon}
          />
          <Text style={styles.detailLabel}>Hora:</Text>
          <Text style={styles.detailValue}>{date ? `${date} - ${time}` : time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons
            name="location-outline"
            size={18}
            color={colors.textSecondary}
            style={styles.icon}
          />
          <Text style={styles.detailLabel}>Ubicación:</Text>
          {addressLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.detailValue} numberOfLines={2}>
              {address}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView style={styles.map} initialRegion={initialRegion} showsUserLocation={true}>
          <Marker
            coordinate={{ latitude: lat, longitude: lon }}
            title={`Alerta de ${userNamePanic || 'Usuario'}`}
            description={date ? `${date} - ${time}` : time}
            pinColor={colors.fireDepartment || 'red'}
          />
        </MapView>
      </View>

      <TouchableOpacity style={styles.externalMapButton} onPress={handleOpenExternalMap}>
        <Ionicons name="map-outline" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.externalMapButtonText}>Abrir mapa</Text>
      </TouchableOpacity>

      {isResponder && (
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.enCaminoButton,
              isEnCaminoDisabled && styles.disabledButton,
            ]}
            onPress={() => handleSetStatus('En Camino')}
            disabled={isEnCaminoDisabled}
            activeOpacity={0.6}
          >
            {isLoading && updatingStatusId === item.id ? (
              <ActivityIndicator size="small" color={colors.statusInProgress || '#FFA500'} />
            ) : (
              <>
                <Ionicons
                  name="car-outline"
                  size={18}
                  color={isEnCaminoDisabled ? '#aaa' : colors.statusInProgress || '#FFA500'}
                  style={styles.actionButtonIcon}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: isEnCaminoDisabled ? '#aaa' : colors.statusInProgress || '#FFA500' },
                  ]}
                >
                  En camino
                </Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.finalizadoButton,
              isFinalizadoDisabled && styles.disabledButton,
            ]}
            onPress={() => handleSetStatus('Finalizado')}
            disabled={isFinalizadoDisabled}
            activeOpacity={0.6}
          >
            {isLoading && updatingStatusId === item.id ? (
              <ActivityIndicator size="small" color={colors.statusFinished || '#34C759'} />
            ) : (
              <>
                <Ionicons
                  name="checkmark-done-outline"
                  size={18}
                  color={isFinalizadoDisabled ? '#aaa' : colors.statusFinished || '#34C759'}
                  style={styles.actionButtonIcon}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: isFinalizadoDisabled ? '#aaa' : colors.statusFinished || '#34C759' },
                  ]}
                >
                  Finalizar
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  recibidaBackground: { backgroundColor: '#FFF4F4' },
  enCaminoBackground: { backgroundColor: '#FFF8E1' },
  finalizadoBackground: { backgroundColor: '#F0FFF0' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: colors.error || 'red', fontSize: 16, textAlign: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  statusBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    color: 'white',
    overflow: 'hidden',
    textAlign: 'center',
    minWidth: 90,
  },
  statusPanic: { backgroundColor: colors.fireDepartment || '#FF3B30', color: 'white' },
  statusInProgress: { backgroundColor: colors.statusInProgress || '#FFA500' },
  statusFinished: { backgroundColor: colors.statusFinished || '#34C759' },
  statusUnknown: { backgroundColor: colors.statusUnknown || '#cccccc', color: '#555' },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 10,
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
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonIcon: {
    marginRight: 5,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon: { marginRight: 10 },
  detailLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
    marginRight: 5,
    minWidth: 75,
  },
  detailValue: { fontSize: 15, color: colors.textPrimary, flexShrink: 1 },
  mapContainer: {
    height: 300,
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'lightgrey',
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  externalMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary || '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  externalMapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PanicAlertDetailScreen;
