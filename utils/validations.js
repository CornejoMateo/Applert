export const validateRegisterData = ({ email, username, password, confirmPassword }) => {
  if (!email || !username || !password || !confirmPassword) {
    return 'Todos los campos son obligatorios';
  }
  if (!email.includes('@') || email.length < 5) {
    return 'Correo electrónico no válido';
  }
  if (username.length < 3 || username.includes(' ')) {
    return 'El nombre de usuario debe tener al menos 3 caracteres y no contener espacios.';
  }
  if (password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  if (password !== confirmPassword) {
    return 'Las contraseñas no coinciden';
  }
  return '';
};
