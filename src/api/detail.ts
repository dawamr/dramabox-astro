import { apiRequest } from "./client.ts";
import type { DramaDetail } from "../types/api.js";

interface DetailResponse {
  data: DramaDetail;
}

/**
 * 📋 Ambil detail lengkap drama berdasarkan bookId
 */
export const getDramaDetail = async (
  bookId: string, 
  needRecommend: boolean = false, 
  from: string = "book_album", 
  log: boolean = true
): Promise<DramaDetail> => {
  if (!bookId) {
    throw new Error("bookId wajib diisi!");
  }

  const data = await apiRequest<DetailResponse>("/drama-box/chapterv2/detail", {
    needRecommend,
    from,
    bookId
  });

  const detail = data?.data;

  if (log && detail) {
    console.log(`\n=== 📖 DETAIL DRAMA BOOK ${bookId} ===`);
    console.log(JSON.stringify(detail, null, 2));
  }

  return detail;
};