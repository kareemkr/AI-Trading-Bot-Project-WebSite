# Trading Client Setup Guide

## Why Trading Client Might Not Be Working

### 1. **Missing API Keys** (Most Common)
The trading client needs Binance API keys to:
- Fetch account balance
- Place orders
- Set leverage/margin

**Solution:** Create a `.env` file in the `backend` directory:

```env
# For Testnet (Recommended for testing)
BINANCE_TESTNET_KEY=your_testnet_api_key_here
BINANCE_TESTNET_SECRET=your_testnet_api_secret_here

# For Real Trading (Use with caution!)
BINANCE_KEY=your_real_api_key_here
BINANCE_SECRET=your_real_api_secret_here
```

### 2. **Public Market Data Works Without Keys**
- ✅ Fetching OHLCV data (candles)
- ✅ Getting ticker information
- ✅ Scanning market symbols

These work **without API keys** because they use Binance's public endpoints.

### 3. **What Requires API Keys**
- ❌ Getting account balance
- ❌ Placing orders
- ❌ Setting leverage
- ❌ Managing positions

## How to Get Binance Testnet API Keys

1. Go to: https://testnet.binancefuture.com/
2. Sign up for a testnet account
3. Go to API Management
4. Create new API key
5. Copy the key and secret
6. Add them to your `.env` file

## Testing the Client

### Check if Public Data Works:
```python
from app.trading.binance_client import BinanceClient

client = BinanceClient(testnet=True)
data = client.fetch_ohlcv("BTCUSDT", limit=10)
print(data)  # Should return candle data
```

### Check if Authenticated Works:
```python
balance = client.get_futures_balance("USDT")
print(f"Balance: {balance}")  # Should show balance if keys are set
```

## Current Status

When you start the server, check the console output:
- `[INFO] ✅ Public market data connection working` = Good!
- `[WARNING] ⚠️ Public market data connection failed` = Network/API issue
- `[WARNING] Testnet API keys not found` = Need to add keys to `.env`

## Troubleshooting

1. **"Client not initialized" errors:**
   - Check if `.env` file exists in `backend/` directory
   - Verify API keys are correct
   - Make sure keys don't have extra spaces

2. **"Balance is zero" or "Cannot fetch balance":**
   - API keys might be invalid
   - Keys might not have futures trading permissions
   - For testnet: Make sure you're using testnet keys, not real keys

3. **Network errors:**
   - Check internet connection
   - Binance API might be temporarily down
   - Firewall might be blocking requests

## Quick Fix

If you just want to test the bot **without trading**:
- The bot will still scan markets and generate signals
- It just won't be able to place orders or check balance
- You'll see warnings but the bot will continue running

