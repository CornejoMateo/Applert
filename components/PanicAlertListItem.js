import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import colors from '../constants/colors';
import { formatTimestamp } from '../utils/formatTimestamp';

// Helper local para estilos de estado (podría ir a utils)
const getStatusStyle = (status, styles) => {
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

const PanicAlertListItem = ({ item, isResponder, onSetStatus, updatingStatusId }) => {
  const navigation = useNavigation();
  const isLoading = updatingStatusId === item.id;
  const isEnCaminoDisabled =
    isLoading || item.status === 'En Camino' || item.status === 'Finalizado';
  const isFinalizadoDisabled = isLoading || item.status === 'Finalizado';
  const { date, time } = formatTimestamp(item.createdAt);

  const displayLocation =
    item.address ||
    (item.location?.latitude
      ? `Lat: ${item.location.latitude.toFixed(4)}, Lon: ${item.location.longitude.toFixed(4)}`
      : 'Ubicación no disponible');

  const cardStatusStyle =
    item.status === 'En Camino'
      ? styles.enCaminoAlertItem
      : item.status === 'Finalizado'
        ? styles.finalizadoAlertItem
        : styles.panicAlertItem;

  // Handler para presionar la alerta (navegar a detalles)
  const handlePress = () => {
    if (item.location) {
      navigation.navigate('PanicAlertDetailScreen', {
        item: item,
        isResponder: isResponder,
        updatingStatusId: updatingStatusId,
        onSetStatus: onSetStatus,
      });
    } else {
      Alert.alert('Ubicación No Disponible', 'No se pueden mostrar detalles sin ubicación.');
    }
  };

  return (
    <View style={[styles.alertItem, cardStatusStyle]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertTitle} numberOfLines={1} ellipsizeMode="tail">
            {isResponder
              ? ` Usuario: ${item.userNamePanic || 'Desconocido'}`
              : ` Enviada a: ${item.category === 'DefensaCivil' ? 'Defensa Civil' : item.category}`}
          </Text>
          <Text style={[styles.alertStatus, getStatusStyle(item.status, styles)]}>
            {item.status || '?'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={14} color="#555" style={styles.icon} />
          <Text style={styles.alertDetails} numberOfLines={2}>
            {displayLocation}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={14} color="#555" style={styles.icon} />
          {date ? (
            <Text style={styles.alertDetails}>{`${date} - ${time}`}</Text>
          ) : (
            <Text style={styles.alertDetails}>{time}</Text>
          )}
        </View>
      </TouchableOpacity>

      {isResponder && (
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.enCaminoButton,
              isEnCaminoDisabled && styles.disabledButton,
            ]}
            onPress={() => onSetStatus(item.id, 'En Camino', item.userId)}
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
            onPress={() => onSetStatus(item.id, 'Finalizado', item.userId)}
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
    </View>
  );
};

const styles = StyleSheet.create({
  alertItem: {
    marginVertical: 0,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1.5,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    paddingBottom: 5,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary || '#333',
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 5,
    marginTop: 1,
  },
  alertDetails: {
    fontSize: 13,
    color: colors.textSecondary || '#666',
  },
  panicAlertItem: {
    borderColor: colors.fireDepartment || '#FF3B30',
    backgroundColor: '#FFF4F4',
  },
  enCaminoAlertItem: {
    borderColor: colors.statusInProgress || '#FFC107',
    backgroundColor: '#FFF8E1',
  },
  finalizadoAlertItem: {
    borderColor: colors.statusFinished || '#34C759',
    backgroundColor: '#F0FFF0',
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
});

export default PanicAlertListItem;
