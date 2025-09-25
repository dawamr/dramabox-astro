import axios, { type AxiosResponse } from "axios";
import type { TokenCache, TokenResponse, ApiHeaders } from "../types/api.js";
import defaultLogger from "../utils/logger.js";
import defaultApiLogger from "../utils/apiLogger.js";

const CACHE_KEY = "dramabox_token_cache";

// Create a logger for this module
const logger = defaultLogger.child('DramaBoxHelper');
const apiLogger = defaultApiLogger.forEndpoint('/api/token');

/**
 * Ambil token dari API atau cache file
 */
export const getToken = async (): Promise<TokenCache> => {
  const startTime = Date.now();
  
  try {
    logger.info('Starting token retrieval process');
    
    // 1. cek apakah ada file cache (only in browser)
    const cache = await readCache();
    if (cache) {
      const expiryDate = new Date(cache.timestamp + 3600_000);
      logger.info('Using cached token', {
        tokenLength: cache.token.length,
        deviceId: cache.deviceId,
        expiresAt: expiryDate.toISOString(),
        remainingTime: `${Math.round((expiryDate.getTime() - Date.now()) / 1000 / 60)} minutes`
      });
      
      // Log successful cache usage
      defaultApiLogger.logDataAccess('read', 'token_cache', {
        source: 'localStorage',
        success: true,
        expiresAt: expiryDate.toISOString()
      });
      
      return cache;
    }

    logger.info('No valid cached token found, fetching new token from API');
    
    // 2. kalau tidak ada atau expired → request baru
    const tokenUrl = typeof window !== 'undefined' ? '/api/token' : 'https://dramabox-api.vercel.app/api/token';
    
    // Log the API request
    const requestId = apiLogger.logRequest({
      method: 'GET',
      url: tokenUrl,
      timestamp: Date.now()
    });
    
    logger.debug('Making token API request', { url: tokenUrl, requestId });
    
    const res: AxiosResponse<TokenResponse> = await axios.get(tokenUrl);
    const requestDuration = Date.now() - startTime;

    logger.info('Token API response received', {
      status: res.status,
      duration: `${requestDuration}ms`,
      responseDataKeys: Object.keys(res.data || {}),
      requestId
    });

    // Validate response structure
    if (!res.data.data || !res.data.data.token || !res.data.data.deviceId) {
      const errorData = {
        status: res.status,
        responseData: res.data,
        missingFields: {
          hasData: !!res.data.data,
          hasToken: !!(res.data.data?.token),
          hasDeviceId: !!(res.data.data?.deviceId)
        }
      };
      
      logger.error('Invalid token response structure', errorData);
      apiLogger.logResponse(requestId, res.status, errorData, requestDuration);
      
      throw new Error("Token atau Device ID tidak ditemukan dari API");
    }

    const tokenData: TokenCache = {
      token: res.data.data.token,
      deviceId: res.data.data.deviceId,
      timestamp: Date.now(),
    };

    logger.info('New token generated successfully', {
      tokenLength: tokenData.token.length,
      deviceId: tokenData.deviceId,
      timestamp: new Date(tokenData.timestamp).toISOString(),
      requestId
    });

    // Log successful API response
    apiLogger.logResponse(requestId, res.status, {
      tokenLength: tokenData.token.length,
      deviceId: tokenData.deviceId
    }, requestDuration);

    // 3. simpan ke file cache
    await saveCache(tokenData);

    // Log total operation performance
    const totalDuration = Date.now() - startTime;
    logger.performance('token_retrieval', totalDuration, {
      source: 'api',
      cached: false
    });

    return tokenData;
    
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    
    logger.error('Failed to retrieve token', {
      error: error.message,
      duration: `${totalDuration}ms`,
      url: typeof window !== 'undefined' ? '/api/token' : 'https://dramabox-api.vercel.app/api/token'
    });
    
    if (error.response) {
      logger.error('Token API error details', {
        status: error.response.status,
        statusText: error.response.statusText,
        responseData: error.response.data,
        headers: error.response.headers
      });
    }
    
    // Log the error to API logger if we have a request context
    if (error.response) {
      defaultApiLogger.logError('unknown', error, {
        operation: 'getToken',
        url: typeof window !== 'undefined' ? '/api/token' : 'https://dramabox-api.vercel.app/api/token'
      });
    }
    
    throw error;
  }
};

/**
 * Generate headers lengkap siap pakai
 */
export const getHeaders = async (): Promise<ApiHeaders> => {
  const startTime = Date.now();
  
  try {
    logger.debug('Starting header generation process');
    
    const { token, deviceId } = await getToken();
    
    logger.debug('Generating headers', {
      tokenLength: token.length,
      deviceId: deviceId,
      environment: typeof window !== 'undefined' ? 'browser' : 'server'
    });

    const headers = typeof window !== 'undefined' ? 
      generateBrowserHeaders(token, deviceId) : 
      generateServerHeaders(token, deviceId);

    const duration = Date.now() - startTime;
    logger.info('Headers generated successfully', {
      headerCount: Object.keys(headers).length,
      duration: `${duration}ms`,
      environment: typeof window !== 'undefined' ? 'browser' : 'server'
    });

    // Log performance
    logger.performance('header_generation', duration, {
      headerCount: Object.keys(headers).length,
      environment: typeof window !== 'undefined' ? 'browser' : 'server'
    });

    return headers;
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Failed to generate headers', {
      error: error.message,
      duration: `${duration}ms`
    });
    throw error;
  }
};

/**
 * Generate browser-safe headers
 */
function generateBrowserHeaders(token: string, deviceId: string): ApiHeaders {
  logger.debug('Generating browser-safe headers');
  
  return {
    "Tn": `Bearer ${token}`,
    "Version": "430",
    "Vn": "4.3.0",
    "Userid": "289167621",
    "Cid": "DALPF1057826",
    "Package-Name": "com.storymatrix.drama",
    "Apn": "1",
    "Device-Id": `${deviceId}`,
    "Language": "in",
    "Current-Language": "in",
    "P": "43",
    "Time-Zone": "+0800",
    "md": "Redmi Note 8",
    "Ov": "14",
    "Mf": "XIAOMI",
    "Brand": "Xiaomi",
    "Content-Type": "application/json; charset=UTF-8",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache"
  } as ApiHeaders;
}

/**
 * Generate server-side headers (includes all headers)
 */
function generateServerHeaders(token: string, deviceId: string): ApiHeaders {
  logger.debug('Generating server-side headers (full set)');
  
  return {
    "Host": "sapi.dramaboxdb.com",
    "Tn": `Bearer ${token}`,
    "Version": "430",
    "Vn": "4.3.0",
    "Userid": "289167621",
    "Cid": "DALPF1057826",
    "Package-Name": "com.storymatrix.drama",
    "Apn": "1",
    "Device-Id": `${deviceId}`,
    "Language": "in",
    "Current-Language": "in",
    "P": "43",
    "Time-Zone": "+0800",
    "md": "Redmi Note 8",
    "Ov": "14",
    "Mf": "XIAOMI",
    "Brand": "Xiaomi",
    "Content-Type": "application/json; charset=UTF-8",
    "User-Agent": "okhttp/4.10.0",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
    "Referer": "https://dramaboxdb.com/",
    "Connection": "keep-alive",
    "Cache-Control": "no-cache"
  } as ApiHeaders;
}

/**
 * Baca cache token dari localStorage
 */
async function readCache(): Promise<TokenCache | null> {
  try {
    if (typeof window === 'undefined') {
      logger.debug('Skipping cache read during SSR');
      return null;
    }
    
    logger.debug('Reading token cache from localStorage');
    
    const data = localStorage.getItem(CACHE_KEY);
    if (!data) {
      logger.debug('No cache data found in localStorage');
      return null;
    }
    
    const parsed: TokenCache = JSON.parse(data);
    const now = Date.now();
    const age = now - parsed.timestamp;
    const maxAge = 3600_000; // 1 hour

    logger.debug('Cache data found', {
      age: `${Math.round(age / 1000)} seconds`,
      maxAge: `${Math.round(maxAge / 1000)} seconds`,
      isValid: age < maxAge,
      deviceId: parsed.deviceId
    });

    // cek apakah masih valid (1 jam = 3600 detik)
    if (age < maxAge) {
      logger.info('Using valid cached token', {
        age: `${Math.round(age / 1000)} seconds`,
        remainingTime: `${Math.round((maxAge - age) / 1000)} seconds`
      });
      
      defaultApiLogger.logDataAccess('read', 'token_cache', {
        success: true,
        age: `${Math.round(age / 1000)} seconds`,
        source: 'localStorage'
      });
      
      return parsed;
    }

    logger.info('Cache expired, removing old data', {
      age: `${Math.round(age / 1000)} seconds`,
      maxAge: `${Math.round(maxAge / 1000)} seconds`
    });
    
    // hapus cache yang expired
    localStorage.removeItem(CACHE_KEY);
    
    defaultApiLogger.logDataAccess('delete', 'token_cache', {
      reason: 'expired',
      age: `${Math.round(age / 1000)} seconds`
    });
    
    return null; // expired
    
  } catch (error: any) {
    logger.error('Failed to read cache', {
      error: error.message,
      cacheKey: CACHE_KEY
    });
    
    defaultApiLogger.logDataAccess('read', 'token_cache', {
      success: false,
      error: error.message,
      source: 'localStorage'
    });
    
    // Try to clear corrupted data
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CACHE_KEY);
        logger.info('Cleared corrupted cache data');
      }
    } catch {
      // Ignore cleanup errors
    }
    
    return null; // data rusak
  }
}

/**
 * Simpan token ke localStorage
 */
async function saveCache(data: TokenCache): Promise<void> {
  try {
    if (typeof window === 'undefined') {
      logger.debug('Skipping cache save during SSR');
      return;
    }
    
    logger.debug('Saving token to localStorage cache', {
      deviceId: data.deviceId,
      timestamp: new Date(data.timestamp).toISOString()
    });
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    
    logger.info('Token cache saved successfully', {
      cacheKey: CACHE_KEY,
      deviceId: data.deviceId
    });
    
    defaultApiLogger.logDataAccess('write', 'token_cache', {
      success: true,
      deviceId: data.deviceId,
      destination: 'localStorage'
    });
    
  } catch (error: any) {
    logger.error('Failed to save cache', {
      error: error.message,
      cacheKey: CACHE_KEY,
      deviceId: data.deviceId
    });
    
    defaultApiLogger.logDataAccess('write', 'token_cache', {
      success: false,
      error: error.message,
      destination: 'localStorage'
    });
  }
}

export default { getToken, getHeaders };
