import { apiRequest } from "./client.ts";
import type { DramaBook } from "../types/api.js";

interface ColumnData {
  title: string;
  bookList: DramaBook[];
}

interface DramaListResponse {
  data: {
    columnVoList: ColumnData[];
  };
}

interface RecommendedBooksResponse {
  data: {
    recommendList: {
      records: (DramaBook & {
        cardType?: number;
        tagCardVo?: {
          tagBooks: DramaBook[];
        };
      })[];
    };
  };
}

// 1️⃣ Ambil daftar drama (theater) with pagination support
export const getDramaList = async (index: number = 0, log: boolean = true): Promise<ColumnData[]> => {
  const data = await apiRequest<DramaListResponse>("/drama-box/he001/theater", {
    isNeedRank: 1,
    index,
    type: 0,
    channelId: 175
  });

  const columnList = data?.data?.columnVoList || [];
  if (log) {
    console.log(`\n=== 🎭 DAFTAR DRAMA (Page: ${index}) ===`);
    columnList.forEach(col => {
      console.log(`\n📌 Column: ${col.title}`);
      col.bookList.forEach(book => {
        console.log(`- ${book.bookName} (ID: ${book.bookId})`);
        console.log(`  🎬 Episodes: ${book.chapterCount}`);
        console.log(`  👀 Views: ${book.playCount}`);
      });
    });
  }

  return columnList;
};

// 2️⃣ Ambil daftar rekomendasi drama
export const getRecommendedBooks = async (log: boolean = true): Promise<DramaBook[]> => {
  const data = await apiRequest<RecommendedBooksResponse>("/drama-box/he001/recommendBook", {
    isNeedRank: 1,
    specialColumnId: 0,
    pageNo: 1
  });

  const rawList = data?.data?.recommendList?.records || [];

  // 🔥 Flatten: kalau cardType = 3 (tagCardVo), ambil tagBooks-nya
  const list = rawList.flatMap(item => {
    if (item.cardType === 3 && item.tagCardVo?.tagBooks) {
      return item.tagCardVo.tagBooks;
    }
    return [item];
  });

  // 🧹 Hapus duplikat berdasarkan bookId
  const uniqueList = list.filter(
    (v, i, arr) => arr.findIndex(b => b.bookId === v.bookId) === i
  );

  if (log) {
    console.log("\n=== ⭐ REKOMENDASI DRAMA ===");
    uniqueList.forEach((book, i) => {
      console.log(`${i + 1}. ${book.bookName} (ID: ${book.bookId})`);
    });
  }

  return uniqueList;
};