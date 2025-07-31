export const DEV_MODE = false; // ← Flip this to false to disable mode
export const isLocalServer = true; // ← Flip this to false to disable mode
export const autoSetOTP = true; // ← Flip this to false to disable mode
export const External_API_MODE = true; // ← Flip this to false to enable mode

export const BASE_URL = isLocalServer
    ? 'http://192.168.1.166:3005'
    : 'https://resqzone.64bitme.com'; // 🔁 Replace with your base API URL. Does not work with localhost
export const OPENWEATHER_API_KEY =
    External_API_MODE && '90ddd5a724508a3bd03a126fe9053ad0'; // https://home.openweathermap.org/api_keys
export const NEWS_API_KEY =
    External_API_MODE && '0cb5dd3d4c374b2ca475cfcff2e9aaa7'; // https://newsapi.org/register/success
export const OPENCAGE_API_KEY =
    External_API_MODE && 'c3303cfe37e84f0bae66916a43a905e7'; // https://api.opencagedata.com
export const ENCRYPTION_KEY = '12345678901234567890123456789012'; // Must be 32 chars (256-bit)
export const IV_LENGTH = 16;
