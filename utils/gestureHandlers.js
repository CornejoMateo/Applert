import { State } from 'react-native-gesture-handler';

export const handleSwipeFilterChange = (event, filter, filters, setFilter, animateFade) => {
  const { translationX, translationY, state } = event.nativeEvent;

  if (state === State.END && Math.abs(translationX) > Math.abs(translationY)) {
    const currentIndex = filters.indexOf(filter);
    if (translationX > 100 && currentIndex > 0) {
      animateFade();
      setFilter(filters[currentIndex - 1]);
    } else if (translationX < -100 && currentIndex < filters.length - 1) {
      animateFade();
      setFilter(filters[currentIndex + 1]);
    }
  }
};
