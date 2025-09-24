import { apiRequest } from "./client.ts";
import type { Chapter } from "../types/api.js";

interface ChapterResponse {
  data: {
    chapterList: Chapter[];
  };
}

/**
 * 📚 Ambil chapter tertentu dari book ID dengan pagination
 */
export const getChapters = async (bookId: string, log: boolean = true, startIndex: number = 1): Promise<Chapter[]> => {
  if (!bookId) {
    throw new Error("bookId wajib diisi!");
  }

  const data = await apiRequest<ChapterResponse>("/drama-box/chapterv2/batch/load", {
    boundaryIndex: 0,
    comingPlaySectionId: -1,
    index: startIndex,
    currencyPlaySource: "discover_new_rec_new",
    needEndRecommend: 0,
    currencyPlaySourceName: "",
    preLoad: false,
    rid: "",
    pullCid: "",
    loadDirection: 0,
    startUpKey: "",
    bookId
  });

  const chapters = data?.data?.chapterList || [];

  if (log) {
    console.log(`\n=== 🎬 CHAPTER UNTUK BOOK ${bookId} (Index: ${startIndex}) ===`);
    chapters.forEach((ch, i) => {
      const episodeNumber = (startIndex - 1) * 6 + i + 1;
      const videoUrl = ch.cdnList?.[0]?.url || "❌ No URL";
      console.log(`${episodeNumber}. ${ch.chapterName} → ${videoUrl}`);
    });
  }

  return chapters;
};

/**
 * 📚 Ambil semua chapter dari book ID dengan pagination otomatis
 */
export const getAllChapters = async (bookId: string, totalEpisodes: number, log: boolean = true): Promise<Chapter[]> => {
  if (!bookId) {
    throw new Error("bookId wajib diisi!");
  }

  const allChapters: Chapter[] = [];
  const episodesPerPage = 6;
  const totalPages = Math.ceil(totalEpisodes / episodesPerPage);

  if (log) {
    console.log(`\n=== 🎬 MENGAMBIL ${totalEpisodes} EPISODES DALAM ${totalPages} HALAMAN ===`);
  }

  // Fetch all pages of chapters
  for (let page = 1; page <= totalPages; page++) {
    try {
      const chapters = await getChapters(bookId, false, page);
      
      if (chapters && chapters.length > 0) {
        allChapters.push(...chapters);
        
        if (log) {
          console.log(`✅ Halaman ${page}: ${chapters.length} episodes loaded (Total so far: ${allChapters.length})`);
        }
      } else {
        if (log) {
          console.log(`⚠️ Halaman ${page}: No episodes found, stopping pagination`);
        }
        break;
      }
      
      // Add a small delay to avoid rate limiting
      if (page < totalPages) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`❌ Error loading page ${page}:`, error);
      if (log) {
        console.log(`🔄 Continuing with next page despite error...`);
      }
      // Continue with next page instead of breaking
      continue;
    }
  }

  if (log) {
    console.log(`\n=== 📋 TOTAL CHAPTERS LOADED: ${allChapters.length} ===`);
    if (allChapters.length < totalEpisodes) {
      console.log(`⚠️ Warning: Expected ${totalEpisodes} episodes but only loaded ${allChapters.length}`);
    }
  }

  return allChapters;
};