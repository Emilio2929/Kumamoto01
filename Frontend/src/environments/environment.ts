export const environment = {
  // Proxy dinámico: En local va a 5121, en producción usa un string vacío para que las rutas empiecen por '/api' y pasen por el Proxy de Vercel.
  apiUrl: window.location.hostname === 'localhost' ? 'http://localhost:5121' : ''
};
