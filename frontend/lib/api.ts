/**
 * Central API configuration
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// In production, we assume the API is on the same domain or a subdomain
// For dev, we use the local uvicorn address
export const API_BASE_URL = IS_PRODUCTION 
  ? (process.env.NEXT_PUBLIC_API_URL || '') 
  : 'http://localhost:8000';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    SIGNUP: `${API_BASE_URL}/auth/signup`,
    UPDATE: `${API_BASE_URL}/auth/update`,
    ME: `${API_BASE_URL}/auth/me`,
  },
  BOT: {
    START: `${API_BASE_URL}/bot/start`,
    STOP: `${API_BASE_URL}/bot/stop`,
    STATUS: `${API_BASE_URL}/bot/status`,
    LOGS: `${API_BASE_URL}/bot/logs`,
    HISTORY: `${API_BASE_URL}/trading/history`,
  },
  ASSISTANT: {
    CHAT: `${API_BASE_URL}/assistant/chat`,
    GUIDE: `${API_BASE_URL}/assistant/chat?mode=guide`,
  },
  ACCOUNT: {
    OVERVIEW: `${API_BASE_URL}/account/overview`,
    VERIFY_KEYS: `${API_BASE_URL}/account/verify-keys`,
  },
  WALLET: {
    BALANCE: `${API_BASE_URL}/wallets/balance`,
    TRANSACTIONS: `${API_BASE_URL}/wallets/history/transactions`,
    WITHDRAW: `${API_BASE_URL}/wallets/withdraw`,
  },
  PAYMENT: {
    CRYPTO_CONFIRM: `${API_BASE_URL}/payment/crypto-confirm`,
  },
  NEWS: {
    ALPHA: `${API_BASE_URL}/news/alpha`,
    LATEST: `${API_BASE_URL}/news/latest`,
    STATUS: `${API_BASE_URL}/news/status`,
  },
  SYSTEM: {
    HEALTH: `${API_BASE_URL}/health`,
    LOGS: `${API_BASE_URL}/api/logs`,
  },
  MARKET: {
    COINGECKO: 'https://api.coingecko.com/api/v3',
  }
};
