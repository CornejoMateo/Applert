export const categories = [
  {
    id: 'Policia',
    title: 'Policía',
    icon: 'shield-outline',
    iconType: 'Ionicons',
    filterIcon: 'shield-outline',
    filterIconType: 'Ionicons',
    color: '#007AFF',
  },
  {
    id: 'Bomberos',
    title: 'Bomberos',
    icon: 'flame-outline',
    iconType: 'Ionicons',
    filterIcon: 'fire',
    filterIconType: 'FontAwesome5',
    color: '#FF3B30',
  },
  {
    id: 'DefensaCivil',
    title: 'Defensa Civil',
    icon: 'construct-outline',
    iconType: 'Ionicons',
    filterIcon: 'construct-outline',
    filterIconType: 'Ionicons',
    color: '#FFA500',
  },
];

export const categoryOptions = categories.map((cat) => ({
  label: cat.title,
  value: cat.id,
}));
