import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';

const FilterButton = ({ item, onPress, isFullWidth, isResponder }) => {
  return (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.filterButtonBase,
        isFullWidth ? styles.filterButtonFullWidth : styles.filterButtonNormal,
        { borderColor: item.color },
      ]}
      onPress={!isResponder ? onPress : undefined}
      activeOpacity={0.7}
    >
      {item.filterIconType === 'Ionicons' && (
        <Ionicons name={item.filterIcon} size={20} color={item.color} />
      )}
      {item.filterIconType === 'Feather' && (
        <Feather name={item.filterIcon} size={20} color={item.color} />
      )}
      {item.filterIconType === 'FontAwesome5' && (
        <FontAwesome5 name={item.filterIcon} size={20} color={item.color} />
      )}

      <Text style={[styles.filterButtonText, { color: item.color }]}>{item.title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
});

export default FilterButton;
