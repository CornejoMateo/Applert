import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import colors from '../constants/colors';
import { formatTimestamp } from '../utils/formatTimestamp';

// Helper local para obtener estilo de estado (podría ir a utils también)
const getStatusStyle = (status, styles) => {
  switch (status) {
    case 'Pendiente':
    case 'En Proceso':
      return styles.statusInProgress;
    case 'Resuelto':
    case 'Leída':
      return styles.statusFinished;
    default:
      return styles.statusUnknown;
  }
};

const AlertListItem = ({ item, isResponder }) => {
  const navigation = useNavigation();
  const categoryDisplay = item.category === 'DefensaCivil' ? 'Defensa Civil' : item.category;
  const { date, time } = formatTimestamp(item.createdAt);

  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('AlertDetailScreen', { alertId: item.id, alertType: 'notification' })
      }
      activeOpacity={0.7}
    >
      <View style={styles.alertItem}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertTitleNot} numberOfLines={1} ellipsizeMode="tail">
            {isResponder ? item.title : item.title || 'Notif. Sin Título'}
          </Text>
          <Text style={[styles.alertStatus, getStatusStyle(item.status, styles)]}>
            {item.status || '?'}
          </Text>
        </View>
        <Text style={styles.alertDetails}>{`${categoryDisplay}`}</Text>
        {date ? (
          <Text style={styles.alertDetails}>
            {date} - {time}
          </Text>
        ) : (
          <Text style={styles.alertDetails}>{time}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
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
    backgroundColor: colors.statusPending || 'gray',
  },
  statusInProgress: {
    backgroundColor: colors.statusInProgress || '#FFA500',
  },
  statusFinished: {
    backgroundColor: colors.statusFinished || '#34C759',
  },
  statusUnknown: {
    backgroundColor: colors.statusUnknown || '#cccccc',
    color: '#555',
  },
  alertDetails: {
    fontSize: 13,
    color: colors.textSecondary || '#666',
    marginTop: 0,
    marginBottom: 0,
  },
});

export default AlertListItem;
