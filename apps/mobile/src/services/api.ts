import {Platform} from 'react-native';

// Single place for all endpoint config. Override the gateway URL here when
// the Cloudflare Worker / tunnel address changes.
export const GATEWAY_URL = 'https://debut-invoice-material-put.trycloudflare.com';

// ponytail: Android emulator maps host localhost to 10.0.2.2; iOS sim uses
// localhost. Add react-native-config here when a real backend URL is needed.
export const API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
