import React, { useState, useEffect } from 'react';
import { Button, Card, Alert, Spinner, TextInput, Badge } from 'flowbite-react';
import { 
  getDramaList, 
  getRecommendedBooks, 
  searchDrama, 
  searchDramaIndex, 
  getDramaDetail, 
  getChapters, 
  batchDownload,
  getToken,
  getHeaders
} from '../api/index.js';
import type { DramaBook, SearchResult, DramaDetail, Chapter } from '../types/api.js';

interface ApiTestProps {
  title?: string;
}

export default function ApiTest({ title = "DramaBox API Test Suite" }: ApiTestProps) {
  // Main data states
  const [dramaList, setDramaList] = useState<any[]>([]);
  const [recommendedBooks, setRecommendedBooks] = useState<DramaBook[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchIndexResults, setSearchIndexResults] = useState<SearchResult[]>([]);
  
  // UI states
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('theater');
  
  // Search state
  const [searchKeyword, setSearchKeyword] = useState<string>('love');
  
  // Token info
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [headers, setHeadersInfo] = useState<any>(null);
  
  // Detail modal states
  const [selectedDrama, setSelectedDrama] = useState<DramaDetail | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [downloadList, setDownloadList] = useState<any[]>([]);
  
  // Video player states
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  // Helper functions
  const setLoadingState = (key: string, state: boolean) => {
    setLoading(prev => ({ ...prev, [key]: state }));
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // API Test Functions
  const testGetToken = async () => {
    try {
      setLoadingState('token', true);
      clearMessages();
      const token = await getToken();
      setTokenInfo(token);
      setSuccess('✅ Token retrieved successfully!');
    } catch (err: any) {
      setError(`❌ Token error: ${err.message}`);
    } finally {
      setLoadingState('token', false);
    }
  };

  const testGetHeaders = async () => {
    try {
      setLoadingState('headers', true);
      clearMessages();
      const headerData = await getHeaders();
      setHeadersInfo(headerData);
      setSuccess('✅ Headers generated successfully!');
    } catch (err: any) {
      setError(`❌ Headers error: ${err.message}`);
    } finally {
      setLoadingState('headers', false);
    }
  };

  const testGetDramaList = async () => {
    try {
      setLoadingState('dramaList', true);
      clearMessages();
      const list = await getDramaList(0, false);
      setDramaList(list);
      setSuccess(`✅ Found ${list.length} drama columns!`);
    } catch (err: any) {
      setError(`❌ Drama list error: ${err.message}`);
    } finally {
      setLoadingState('dramaList', false);
    }
  };

  const testGetRecommendedBooks = async () => {
    try {
      setLoadingState('recommended', true);
      clearMessages();
      const books = await getRecommendedBooks(false);
      setRecommendedBooks(books.slice(0, 12));
      setSuccess(`✅ Found ${books.length} recommended dramas!`);
    } catch (err: any) {
      setError(`❌ Recommended books error: ${err.message}`);
    } finally {
      setLoadingState('recommended', false);
    }
  };

  const testSearchDrama = async () => {
    try {
      setLoadingState('search', true);
      clearMessages();
      const results = await searchDrama(searchKeyword, false);
      setSearchResults(results);
      setSuccess(`✅ Found ${results.length} search results for "${searchKeyword}"!`);
    } catch (err: any) {
      setError(`❌ Search error: ${err.message}`);
    } finally {
      setLoadingState('search', false);
    }
  };

  const testSearchDramaIndex = async () => {
    try {
      setLoadingState('searchIndex', true);
      clearMessages();
      const results = await searchDramaIndex(false);
      setSearchIndexResults(results);
      setSuccess(`✅ Found ${results.length} hot videos!`);
    } catch (err: any) {
      setError(`❌ Search index error: ${err.message}`);
    } finally {
      setLoadingState('searchIndex', false);
    }
  };

  const loadDramaDetail = async (bookId: string) => {
    try {
      setLoadingState('detail', true);
      clearMessages();
      
      const [detail, chapterList] = await Promise.all([
        getDramaDetail(bookId, true, "book_album", false),
        getChapters(bookId, false)
      ]);
      
      setSelectedDrama(detail);
      setChapters(chapterList);
      setShowDetailModal(true);
      setSuccess(`✅ Loaded details for ${detail.bookName}!`);
    } catch (err: any) {
      setError(`❌ Detail error: ${err.message}`);
    } finally {
      setLoadingState('detail', false);
    }
  };

  const testBatchDownload = async (bookId: string) => {
    try {
      setLoadingState('download', true);
      clearMessages();
      const downloads = await batchDownload(bookId, false);
      setDownloadList(downloads);
      setSuccess(`✅ Found ${downloads.length} downloadable episodes!`);
    } catch (err: any) {
      setError(`❌ Download error: ${err.message}`);
    } finally {
      setLoadingState('download', false);
    }
  };

  const playVideo = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setShowVideoModal(true);
    setIsPlaying(false);
  };

  // Video control functions
  const togglePlayPause = () => {
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    if (videoElement) {
      if (videoElement.paused) {
        videoElement.play();
        setIsPlaying(true);
      } else {
        videoElement.pause();
        setIsPlaying(false);
      }
    }
  };

  const playNextEpisode = () => {
    if (!selectedChapter || chapters.length === 0) return;
    
    const currentIndex = chapters.findIndex(ch => ch.chapterId === selectedChapter.chapterId);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < chapters.length) {
      const nextChapter = chapters[nextIndex];
      setSelectedChapter(nextChapter);
      setIsPlaying(false);
    }
  };

  const playPreviousEpisode = () => {
    if (!selectedChapter || chapters.length === 0) return;
    
    const currentIndex = chapters.findIndex(ch => ch.chapterId === selectedChapter.chapterId);
    const prevIndex = currentIndex - 1;
    
    if (prevIndex >= 0) {
      const prevChapter = chapters[prevIndex];
      setSelectedChapter(prevChapter);
      setIsPlaying(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    setControlsTimeout(timeout);
  };

  const handleVideoClick = () => {
    togglePlayPause();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!showVideoModal) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          playPreviousEpisode();
          break;
        case 'ArrowRight':
          e.preventDefault();
          playNextEpisode();
          break;
        case 'Escape':
          e.preventDefault();
          setShowVideoModal(false);
          break;
      }
    };

    if (showVideoModal) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [showVideoModal, selectedChapter, chapters]);

  // Get the best video URL from chapter
  const getBestVideoUrl = (chapter: Chapter): string | null => {
    if (!chapter.cdnList || chapter.cdnList.length === 0) return null;
    
    for (const cdn of chapter.cdnList) {
      if (!cdn.videoPathList || cdn.videoPathList.length === 0) continue;
      
      const nonVipDefault = cdn.videoPathList.find(v => v.isDefault === 1 && v.isVipEquity === 0);
      if (nonVipDefault) return nonVipDefault.videoPath;
      
      const nonVip = cdn.videoPathList.find(v => v.isVipEquity === 0);
      if (nonVip) return nonVip.videoPath;
      
      if (cdn.videoPathList[0]) return cdn.videoPathList[0].videoPath;
    }
    
    return null;
  };

  // Get all available video qualities
  const getVideoQualities = (chapter: Chapter) => {
    if (!chapter.cdnList || chapter.cdnList.length === 0) return [];
    
    const qualities: Array<{quality: number; url: string; isVip: boolean; cdn: string}> = [];
    
    chapter.cdnList.forEach(cdn => {
      if (cdn.videoPathList) {
        cdn.videoPathList.forEach(video => {
          qualities.push({
            quality: video.quality,
            url: video.videoPath,
            isVip: video.isVipEquity === 1,
            cdn: cdn.cdnDomain || 'Unknown CDN'
          });
        });
      }
    });
    
    return qualities.sort((a, b) => {
      if (a.isVip !== b.isVip) return a.isVip ? 1 : -1;
      return b.quality - a.quality;
    });
  };

  // ... existing code ...

  // Tab navigation
  const tabs = [
    { id: 'theater', name: '🎭 Theater List', count: dramaList.length },
    { id: 'recommended', name: '⭐ Recommended', count: recommendedBooks.length },
    { id: 'search', name: '🔍 Search', count: searchResults.length },
    { id: 'searchIndex', name: '🔥 Hot Videos', count: searchIndexResults.length },
    { id: 'auth', name: '🔐 Auth Info', count: tokenInfo ? 1 : 0 }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Comprehensive testing suite for all DramaBox API endpoints
        </p>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button onClick={testGetToken} disabled={loading.token} size="sm" color="blue">
            {loading.token ? <Spinner size="sm" /> : '🔐'} Test Auth
          </Button>
          <Button onClick={testGetDramaList} disabled={loading.dramaList} size="sm" color="green">
            {loading.dramaList ? <Spinner size="sm" /> : '🎭'} Theater List
          </Button>
          <Button onClick={testGetRecommendedBooks} disabled={loading.recommended} size="sm" color="purple">
            {loading.recommended ? <Spinner size="sm" /> : '⭐'} Recommended
          </Button>
          <Button onClick={testSearchDramaIndex} disabled={loading.searchIndex} size="sm" color="red">
            {loading.searchIndex ? <Spinner size="sm" /> : '🔥'} Hot Videos
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Alert color="failure" className="mb-6">
          <span>{error}</span>
        </Alert>
      )}
      
      {success && (
        <Alert color="success" className="mb-6">
          <span>{success}</span>
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.name}
            {tab.count > 0 && (
              <Badge color="blue" size="sm">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Theater List Tab */}
        {activeTab === 'theater' && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">🎭 Drama Theater List</h2>
              <Button onClick={testGetDramaList} disabled={loading.dramaList} size="sm">
                {loading.dramaList ? <Spinner size="sm" /> : 'Load Theater List'}
              </Button>
            </div>
            
            {dramaList.length > 0 ? (
              <div className="space-y-4">
                {dramaList.map((column, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 text-blue-600">
                      📌 {column.title} ({column.bookList?.length || 0} dramas)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {column.bookList?.slice(0, 8).map((book: DramaBook) => (
                        <div key={book.bookId} className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                             onClick={() => loadDramaDetail(book.bookId)}>
                          <h4 className="font-medium text-sm mb-1 line-clamp-1">{book.bookName}</h4>
                          <p className="text-xs text-gray-600 mb-1">ID: {book.bookId}</p>
                          <p className="text-xs text-gray-600">Episodes: {book.chapterCount || 'N/A'}</p>
                          <p className="text-xs text-gray-600">Views: {book.playCount || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Click "Load Theater List" to test the API</p>
            )}
          </Card>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">🔍 Search Dramas</h2>
            </div>
            
            <div className="flex gap-3 mb-4">
              <TextInput
                type="text"
                placeholder="Enter search keyword..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="flex-1"
              />
              <Button onClick={testSearchDrama} disabled={loading.search}>
                {loading.search ? <Spinner size="sm" /> : 'Search'}
              </Button>
            </div>
            
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((result) => (
                  <div key={result.bookId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <img 
                      src={result.cover} 
                      alt={result.bookName}
                      className="w-full h-32 object-cover rounded mb-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/200x120/374151/ffffff?text=No+Image';
                      }}
                    />
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{result.bookName}</h3>
                    <p className="text-xs text-gray-600 mb-1">Author: {result.author}</p>
                    <p className="text-xs text-gray-600 mb-2">Views: {result.inLibraryCount || 'N/A'}</p>
                    <Button onClick={() => loadDramaDetail(result.bookId)} size="xs" className="w-full">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Enter a keyword and click "Search" to test the API</p>
            )}
          </Card>
        )}

        {/* Auth Tab */}
        {activeTab === 'auth' && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">🔐 Authentication Info</h2>
              <div className="flex gap-2">
                <Button onClick={testGetToken} disabled={loading.token} size="sm">
                  {loading.token ? <Spinner size="sm" /> : 'Get Token'}
                </Button>
                <Button onClick={testGetHeaders} disabled={loading.headers} size="sm">
                  {loading.headers ? <Spinner size="sm" /> : 'Get Headers'}
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              {tokenInfo && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">🎫 Token Information</h3>
                  <div className="space-y-2 text-sm font-mono">
                    <p><span className="font-bold">Token:</span> {tokenInfo.token.substring(0, 50)}...</p>
                    <p><span className="font-bold">Device ID:</span> {tokenInfo.deviceId}</p>
                    <p><span className="font-bold">Timestamp:</span> {new Date(tokenInfo.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              )}
              
              {headers && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">📋 Request Headers</h3>
                  <div className="max-h-64 overflow-y-auto">
                    <pre className="text-xs text-gray-700">
                      {JSON.stringify(headers, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Recommended Books Section */}
        {activeTab === 'recommended' && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">⭐ Recommended Dramas</h2>
              <Button 
                onClick={testGetRecommendedBooks} 
                disabled={loading.recommended}
                size="sm"
              >
                {loading.recommended ? <Spinner size="sm" /> : 'Load Recommendations'}
              </Button>
            </div>
            
            {recommendedBooks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedBooks.map((drama) => (
                  <div key={drama.bookId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <img 
                      src={drama.coverWap} 
                      alt={drama.bookName}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                    <h3 className="font-semibold text-sm mb-1">{drama.bookName}</h3>
                    <p className="text-xs text-gray-600 mb-1">ID: {drama.bookId}</p>
                    <p className="text-xs text-gray-600 mb-2">Views: {drama.playCount || 'N/A'}</p>
                    {drama.tags && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {drama.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <Button 
                      onClick={() => loadDramaDetail(drama.bookId)} 
                      disabled={loading.detail}
                      size="xs"
                      className="w-full"
                    >
                      {loading.detail ? <Spinner size="sm" /> : 'View Details'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Click "Load Recommendations" to test the API
              </p>
            )}
          </Card>
        )}
        
        {/* Drama Detail Modal */}
        {showDetailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">{selectedDrama?.bookName || 'Drama Details'}</h2>
                  <Button size="sm" onClick={() => setShowDetailModal(false)} color="gray">
                    ✕
                  </Button>
                </div>
                
                {selectedDrama && (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <img 
                        src={selectedDrama.coverWap} 
                        alt={selectedDrama.bookName}
                        className="w-24 h-32 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{selectedDrama.bookName}</h3>
                        <p className="text-sm text-gray-600 mb-1">ID: {selectedDrama.bookId}</p>
                        <p className="text-sm text-gray-600 mb-1">Episodes: {selectedDrama.chapterCount || 'N/A'}</p>
                        <p className="text-sm text-gray-600 mb-2">Views: {selectedDrama.playCount || 'N/A'}</p>
                        {selectedDrama.introduction && (
                          <p className="text-sm text-gray-700 mb-3">{selectedDrama.introduction}</p>
                        )}
                        {selectedDrama.tags && (
                          <div className="flex flex-wrap gap-1">
                            {selectedDrama.tags.map((tag, idx) => (
                              <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Episodes List */}
                    {chapters.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-3">📺 Episodes ({chapters.length})</h4>
                        <div className="max-h-64 overflow-y-auto">
                          <div className="grid grid-cols-1 gap-2">
                            {chapters.slice(0, 10).map((chapter, idx) => (
                              <div key={chapter.chapterId} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{chapter.chapterName}</p>
                                  <p className="text-xs text-gray-500">Chapter {chapter.chapterIndex}</p>
                                  {chapter.isCharge === 1 && (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-1 inline-block">
                                      Premium
                                    </span>
                                  )}
                                </div>
                                <Button 
                                  onClick={() => playVideo(chapter)}
                                  size="xs"
                                  disabled={!getBestVideoUrl(chapter)}
                                >
                                  ▶️ Play
                                </Button>
                              </div>
                            ))}
                            {chapters.length > 10 && (
                              <p className="text-center text-sm text-gray-500 py-2">
                                ... and {chapters.length - 10} more episodes
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Video Player Modal */}
        {showVideoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">🎬 {selectedChapter?.chapterName || 'Video Player'}</h3>
                  <Button size="sm" onClick={() => setShowVideoModal(false)} color="gray">
                    ✕
                  </Button>
                </div>
                
                {selectedChapter && (
                  <div className="space-y-4">
                    <div className="bg-black rounded-lg overflow-hidden relative"
                         onMouseMove={handleMouseMove}
                         onMouseLeave={() => setShowControls(false)}>
                      {getBestVideoUrl(selectedChapter) ? (
                        <>
                          <video 
                            controls={false}
                            className="w-full h-64 md:h-96"
                            poster={selectedChapter.chapterImg}
                            key={selectedChapter.chapterId}
                            onClick={handleVideoClick}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={() => {
                              setIsPlaying(false);
                              playNextEpisode();
                            }}
                          >
                            <source src={getBestVideoUrl(selectedChapter)!} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                          
                          {/* Video Overlay Controls */}
                          <div className={`absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-opacity duration-300 ${
                            showControls ? 'opacity-100' : 'opacity-0'
                          }`}>
                            <div className="flex items-center space-x-6">
                              {/* Previous Episode Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playPreviousEpisode();
                                }}
                                disabled={chapters.findIndex(ch => ch.chapterId === selectedChapter.chapterId) === 0}
                                className="bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                              
                              {/* Play/Pause Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePlayPause();
                                }}
                                className="bg-black bg-opacity-50 text-white p-4 rounded-full hover:bg-opacity-70 transition-all"
                              >
                                {isPlaying ? (
                                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                              
                              {/* Next Episode Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playNextEpisode();
                                }}
                                disabled={chapters.findIndex(ch => ch.chapterId === selectedChapter.chapterId) === chapters.length - 1}
                                className="bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414zm6 0a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L14.586 10l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          {/* Episode Info Overlay */}
                          <div className={`absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded transition-opacity duration-300 ${
                            showControls ? 'opacity-100' : 'opacity-0'
                          }`}>
                            <p className="text-sm font-medium">{selectedChapter.chapterName}</p>
                            <p className="text-xs opacity-80">
                              Episode {chapters.findIndex(ch => ch.chapterId === selectedChapter.chapterId) + 1} of {chapters.length}
                            </p>
                          </div>
                          
                          {/* Keyboard Shortcuts Help */}
                          <div className={`absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-xs transition-opacity duration-300 ${
                            showControls ? 'opacity-100' : 'opacity-0'
                          }`}>
                            <p className="font-medium mb-1">Keyboard Shortcuts:</p>
                            <p>Space: Play/Pause • ← → : Previous/Next Episode • Esc: Close</p>
                          </div>
                          <div className={`absolute top-4 right-4 transition-opacity duration-300 ${
                            showControls ? 'opacity-100' : 'opacity-0'
                          }`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowVideoModal(false);
                              }}
                              className="bg-black bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition-all"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-64 md:h-96 flex items-center justify-center bg-gray-100">
                          <p className="text-gray-500">❌ Video not available</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Episode Navigation */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{selectedChapter.chapterName}</h4>
                        <div className="flex items-center space-x-2">
                          <Button 
                            onClick={playPreviousEpisode}
                            disabled={chapters.findIndex(ch => ch.chapterId === selectedChapter.chapterId) === 0}
                            size="xs"
                            color="gray"
                          >
                            ⏮️ Previous
                          </Button>
                          <Button 
                            onClick={playNextEpisode}
                            disabled={chapters.findIndex(ch => ch.chapterId === selectedChapter.chapterId) === chapters.length - 1}
                            size="xs"
                            color="blue"
                          >
                            Next ⏭️
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                        <p>Episode {chapters.findIndex(ch => ch.chapterId === selectedChapter.chapterId) + 1} of {chapters.length}</p>
                        <p>Chapter {selectedChapter.chapterIndex + 1}</p>
                        <p>Duration: {selectedChapter.viewingDuration ? `${Math.floor(selectedChapter.viewingDuration / 60)}m ${selectedChapter.viewingDuration % 60}s` : 'N/A'}</p>
                        {selectedChapter.isCharge === 1 && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            💎 Premium
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Video Quality Selector */}
                    {getVideoQualities(selectedChapter).length > 1 && (
                      <div>
                        <h5 className="font-medium mb-2">🎥 Video Quality Options:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {getVideoQualities(selectedChapter).map((video, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{video.quality}p</span>
                                  {video.isVip && (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
                                      VIP
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">{video.cdn}</p>
                              </div>
                              <Button 
                                size="xs"
                                onClick={() => {
                                  const videoElement = document.querySelector('video') as HTMLVideoElement;
                                  if (videoElement && video.url) {
                                    videoElement.src = video.url;
                                    videoElement.load(); // Reload the video element
                                  }
                                }}
                              >
                                Play
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}