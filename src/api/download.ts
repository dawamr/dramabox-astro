import { getChapters } from "./chapter.ts";
import { apiRequest } from "./client.ts";

interface DownloadItem {
  chapterName: string;
  videoUrl: string;
}

interface BatchDownloadResponse {
  data: any;
}

/**
 * 📥 Download semua episode dari bookId dalam bentuk array URL
 */
export const batchDownload = async (bookId: string, log: boolean = true): Promise<DownloadItem[]> => {
  if (!bookId) {
    throw new Error("bookId wajib diisi!");
  }

  const chapters = await getChapters(bookId, false);
  const downloadList: DownloadItem[] = [];

  chapters.forEach((chapter) => {
    const videoUrl = chapter.cdnList?.[0]?.url || null;
    if (videoUrl) {
      downloadList.push({
        chapterName: chapter.chapterName,
        videoUrl
      });
    }
  });

  if (log) {
    console.log(`\n=== 📥 DOWNLOAD LIST UNTUK BOOK ${bookId} ===`);
    downloadList.forEach((item, i) => {
      console.log(`${i + 1}. ${item.chapterName}`);
      console.log(`   URL: ${item.videoUrl}`);
    });
    console.log(`\n🎯 Total video yang bisa didownload: ${downloadList.length}`);
  }

  return downloadList;
};

/**
 * 📥 Download beberapa episode sekaligus menggunakan API endpoint
 */
export const batchDownloadChapters = async (
  bookId: string, 
  chapterIdList: string[] = [], 
  log: boolean = true
): Promise<any> => {
  if (!bookId || chapterIdList.length === 0) {
    throw new Error("bookId dan chapterIdList wajib diisi!");
  }

  const data = await apiRequest<BatchDownloadResponse>("/drama-box/chapterv2/batchDownload", {
    bookId,
    chapterIdList
  });

  if (log) {
    console.log(`\n=== 📥 DOWNLOAD CHAPTER BOOK ${bookId} ===`);
    console.log(JSON.stringify(data, null, 2));
  }

  return data;
};