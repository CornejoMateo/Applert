export const formatTimestamp = (timestamp) => {
  if (!timestamp || typeof timestamp.toDate !== 'function')
    return { date: '', time: 'Fecha desconocida' };

  try {
    const dateObj = timestamp.toDate();
    const now = new Date();
    const diffSeconds = Math.round((now - dateObj) / 1000);

    if (diffSeconds < 5) return { date: '', time: `Ahora mismo` };
    if (diffSeconds < 60) return { date: '', time: `Hace ${diffSeconds} seg` };

    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return { date: '', time: `Hace ${diffMinutes} min` };

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return { date: '', time: `Hace ${diffHours} hs` };

    const time = dateObj.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const diffDays = Math.round(diffHours / 24);
    let dateString = '';
    if (diffDays === 1) {
      dateString = 'Ayer';
    } else {
      const dateStringOpts = {
        day: '2-digit',
        month: '2-digit',
        year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      };
      dateString = dateObj.toLocaleDateString('es-AR', dateStringOpts);
    }

    return { date: dateString, time: time };
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return { date: '', time: 'Fecha inválida' };
  }
};
