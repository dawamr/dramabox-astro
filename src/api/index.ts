// DramaBox API - TypeScript version
// Export all API functions for easy importing

// Core utilities
export { getToken, getHeaders } from './dramaboxHelper.ts';
export { apiRequest } from './client.ts';

// API functions
export { getDramaList, getRecommendedBooks } from './drama.ts';
export { getChapters, getAllChapters } from './chapter.ts';
export { searchDrama, searchDramaIndex } from './search.ts';
export { getDramaDetail } from './detail.ts';
export { batchDownload, batchDownloadChapters } from './download.ts';

// Types
export type * from '../types/api.js';