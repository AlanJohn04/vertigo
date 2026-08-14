
const PORT = '3000';
const DEFAULT_IP = '192.168.1.34'; // Default fallback for physical mobile devices

const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  try {
    const { Platform } = require('react-native');
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.location && window.location.hostname) {
        return `http://${window.location.hostname}:${PORT}/api`;
      }
      return `http://localhost:${PORT}/api`;
    }
  } catch (e) {
    return `http://localhost:${PORT}/api`;
  }
  
  return `http://${DEFAULT_IP}:${PORT}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

console.log(`Backend API configured at: ${API_BASE_URL}`);
