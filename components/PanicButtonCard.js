import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const cardMargin = 10;
const cardPadding = 16;

const PanicButtonCard = ({ item, onPress, isDisabled, isInCooldown, username }) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDisabled ? '#888' : item.color,
          width: Dimensions.get('window').width - cardMargin * 4,
        },
        isDisabled && styles.disabledButton,
      ]}
      onPress={() => onPress(item, username)}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {isDisabled ? (
        isInCooldown ? (
          <View style={{ alignItems: 'center' }}>
            {item.iconType === 'Ionicons' && <Ionicons name={item.icon} size={45} color="#fff" />}
            <Text style={styles.cooldownText}>No disponible, debe esperar unos minutos</Text>
          </View>
        ) : (
          <ActivityIndicator size="large" color="#fff" />
        )
      ) : (
        <>
          {item.iconType === 'Ionicons' && <Ionicons name={item.icon} size={45} color="#fff" />}
          <Text style={styles.cardText}>{item.title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
  cooldownText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
  },
});

export default PanicButtonCard;
