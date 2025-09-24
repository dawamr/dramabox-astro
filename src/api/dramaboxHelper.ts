import axios, { type AxiosResponse } from "axios";
import type { TokenCache, TokenResponse, ApiHeaders } from "../types/api.js";

const CACHE_KEY = "dramabox_token_cache";

/**
 * Ambil token dari API atau cache file
 */
export const getToken = async (): Promise<TokenCache> => {
  try {
    // 1. cek apakah ada file cache (only in browser)
    const cache = await readCache();
    if (cache) {
      console.log('Using cached token, expires at:', new Date(cache.timestamp + 3600_000).toLocaleString());
      return cache;
    }

    console.log('Fetching new token from API...');
    // 2. kalau tidak ada atau expired → request baru
    // Use local API route to avoid CORS issues
    const tokenUrl = typeof window !== 'undefined' ? '/api/token' : 'https://dramabox-api.vercel.app/api/token';
    const res: AxiosResponse<TokenResponse> = await axios.get(tokenUrl);

    console.log('Token API response status:', res.status);
    console.log('Token API response data keys:', Object.keys(res.data || {}));

    if (!res.data.data || !res.data.data.token || !res.data.data.deviceId) {
      console.error('Invalid token response:', res.data);
      throw new Error("Token atau Device ID tidak ditemukan dari API");
    }

    const tokenData: TokenCache = {
      token: res.data.data.token,
      deviceId: res.data.data.deviceId,
      timestamp: Date.now(),
    };

    console.log('New token generated:', {
      tokenLength: tokenData.token.length,
      deviceId: tokenData.deviceId,
      timestamp: new Date(tokenData.timestamp).toLocaleString()
    });

    // 3. simpan ke file cache
    await saveCache(tokenData);

    return tokenData;
  } catch (error: any) {
    console.error("[ERROR] Gagal mengambil token:", error.message);
    if (error.response) {
      console.error("[ERROR] Token API response:", error.response.data);
      console.error("[ERROR] Token API status:", error.response.status);
    }
    throw error;
  }
};

/**
 * Generate headers lengkap siap pakai
 */
export const getHeaders = async (): Promise<ApiHeaders> => {
  const { token, deviceId } = await getToken();
  
  console.log('Generating headers with token length:', token.length, 'deviceId:', deviceId);

  // Browser-safe headers (exclude unsafe headers that browsers control)
  if (typeof window !== 'undefined') {
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

  // Server-side headers (all headers including unsafe ones)
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
};

/**
 * Baca cache token dari localStorage
 */
async function readCache(): Promise<TokenCache | null> {
  try {
    if (typeof window === 'undefined') {
      return null; // Skip cache during SSR
    }
    
    const data = localStorage.getItem(CACHE_KEY);
    if (!data) {
      return null;
    }
    
    const parsed: TokenCache = JSON.parse(data);

    // cek apakah masih valid (1 jam = 3600 detik)
    if (Date.now() - parsed.timestamp < 3600_000) {
      return parsed;
    }

    // hapus cache yang expired
    localStorage.removeItem(CACHE_KEY);
    return null; // expired
  } catch {
    return null; // data rusak
  }
}

/**
 * Simpan token ke localStorage
 */
async function saveCache(data: TokenCache): Promise<void> {
  try {
    if (typeof window === 'undefined') {
      return; // Skip cache during SSR
    }
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (err: any) {
    console.error("[ERROR] Gagal menyimpan cache:", err.message);
  }
}

export default { getToken, getHeaders };