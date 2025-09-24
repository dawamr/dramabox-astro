import axios, { type AxiosResponse } from "axios";
import type { ApiResponse } from "../types/api.js";

// Helper umum untuk request API DramaBox
export const apiRequest = async <T = any>(
  endpoint: string, 
  payload: Record<string, any> = {}, 
  method: "get" | "post" | "put" | "delete" = "post"
): Promise<T> => {
  try {
    // Use the proxy route - no need to add auth headers as proxy handles them
    const url = `/api/proxy${endpoint}`;
    
    const response: AxiosResponse<T> = await axios[method](url, payload);
    return response.data;
  } catch (err: any) {
    if (err.response) {
      console.error(`❌ API Error [${endpoint}] →`, err.response.data);
    } else {
      console.error(`❌ Request Error [${endpoint}] →`, err.message);
    }
    throw err; // biar bisa ditangkap di caller
  }
};