import { apiRequest } from "./client.ts";
import type { SearchResult } from "../types/api.js";

interface SearchResponse {
  data: {
    suggestList: SearchResult[];
  };
}

interface SearchIndexResponse {
  data: {
    hotVideoList: SearchResult[];
  };
}

/**
 * 🔍 Cari drama berdasarkan keyword
 */
export const searchDrama = async (keyword: string, log: boolean = true): Promise<SearchResult[]> => {
  if (!keyword) {
    throw new Error("Keyword wajib diisi!");
  }

  const data = await apiRequest<SearchResponse>("/drama-box/search/suggest", { keyword });

  const results = data?.data?.suggestList || [];

  if (log) {
    console.log(`\n=== 🔎 HASIL PENCARIAN: "${keyword}" ===`);
    results.forEach((book: SearchResult, i: number) => {
      console.log(`${i + 1}. ${book.bookName} (ID: ${book.bookId})`);
    });
  }

  return results;
};

/**
 * 🔍 Cari drama dengan SearchIndex endpoint
 */
export const searchDramaIndex = async (log: boolean = true): Promise<SearchResult[]> => {
  const data = await apiRequest<SearchIndexResponse>("/drama-box/search/index");

  const results = data?.data?.hotVideoList || [];

  if (log) {
    console.log(`\n=== 🔎 SEARCH INDEX RESULTS ===`);
    results.forEach((book: SearchResult, i: number) => {
      console.log(`${i + 1}. ${book.bookName} (ID: ${book.bookId})`);
    });
  }

  return results;
};