// TypeScript interfaces for DramaBox API responses

export interface BookSource {
  sceneId: string;
  expId: string;
  strategyId: string;
  strategyName: string;
  log_id: string;
}

export interface Corner {
  cornerType: number;
  name: string;
  color: string;
}

export interface Tag {
  id?: number;
  name: string;
  color?: string;
}

export interface DramaBook {
  bookId: string;
  bookName: string;
  coverWap: string;
  chapterCount?: number;
  introduction?: string;
  tags?: string[];
  tagV3s?: Tag[];
  bookSource: BookSource;
  isEntry?: number;
  index?: number;
  corner?: Corner;
  dataFrom?: string;
  cardType?: number;
  markNamesConnectKey?: string;
  algorithmRecomDot?: string;
  playCount?: string;
  bookShelfTime?: number;
  shelfTime?: string;
  inLibrary?: boolean;
  author?: string;
  cover?: string;
  inLibraryCount?: number;
  sort?: number;
  protagonist?: string;
  tagNames?: string[];
}

export interface VideoPathItem {
  quality: number;
  videoPath: string;
  isDefault: number;
  isEntry: number;
  isVipEquity: number;
}

export interface CDNItem {
  cdnDomain?: string;
  isDefault: number;
  videoPathList: VideoPathItem[];
  name?: string;
  url?: string; // Keep for backward compatibility
}

export interface SenseRightsLoadInfo {
  desc: string;
}

export interface Chapter {
  chapterId: string;
  chapterIndex: number;
  isCharge: number;
  chapterName: string;
  cdnList: CDNItem[];
  chapterImg: string;
  chapterType: number;
  senseRightsLoadInfo: SenseRightsLoadInfo;
  viewingDuration: number;
  chargeChapter: boolean;
}

export interface SearchResult {
  bookId: string;
  bookName: string;
  introduction: string;
  author: string;
  cover: string;
  inLibraryCount: number;
  bookSource: BookSource;
  sort: number;
  protagonist: string;
  tagNames: string[];
  markNamesConnectKey: string;
  algorithmRecomDot: string;
  inLibrary: boolean;
}

export interface TokenCache {
  token: string;
  deviceId: string;
  timestamp: number;
}

export interface TokenResponse {
  data: {
    token: string;
    deviceId: string;
  };
}

export interface ApiResponse<T> {
  data: T;
  status?: number;
  message?: string;
}

// API Headers interface
export interface ApiHeaders {
  "Content-Type": string;
  "User-Agent"?: string;
  "Host"?: string;
  "Accept": string;
  "Accept-Language": string;
  "Accept-Encoding"?: string;
  "Referer"?: string;
  "Tn": string;
  "Device-Id": string;
  "Connection"?: string;
  "Cache-Control": string;
  // Add other custom headers for DramaBox API
  "Version"?: string;
  "Vn"?: string;
  "Userid"?: string;
  "Cid"?: string;
  "Package-Name"?: string;
  "Apn"?: string;
  "Language"?: string;
  "Current-Language"?: string;
  "P"?: string;
  "Time-Zone"?: string;
  "md"?: string;
  "Ov"?: string;
  "Mf"?: string;
  "Brand"?: string;
}

// Drama detail interface (extended)
export interface DramaDetail extends DramaBook {
  episodes?: Chapter[];
  rating?: number;
  duration?: string;
  releaseDate?: string;
  genre?: string[];
  cast?: string[];
  director?: string;
  description?: string;
}