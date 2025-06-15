export const DEV_MODE = true; // ← Flip this to false to disable mock mode
export const External_API_MODE = false; // ← Flip this to false to disable mock mode

export const BASE_URL = DEV_MODE
    ? 'http://192.168.1.99:3005'
    : 'https://resqzone.64bitme.com'; // 🔁 Replace with your base API URL. Does not work with localhost
export const OPENWEATHER_API_KEY =
    External_API_MODE && '90ddd5a724508a3bd03a126fe9053ad0'; // https://home.openweathermap.org/api_keys
export const NEWS_API_KEY =
    External_API_MODE && '0cb5dd3d4c374b2ca475cfcff2e9aaa7'; // https://newsapi.org/register/success
export const ENCRYPTION_KEY = '12345678901234567890123456789012'; // Must be 32 chars (256-bit)
export const IV_LENGTH = 16;
