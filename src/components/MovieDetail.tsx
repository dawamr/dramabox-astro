import { useState, useEffect, useRef } from 'react';
import { type Drama } from './MovieCard';
import { getDramaDetail, getAllChapters } from '../api/index.js';
import type { DramaDetail, Chapter } from '../types/api.js';

interface MovieDetailProps {
  drama: Drama;
  onBack: () => void;
}

export default function MovieDetail({ drama, onBack }: MovieDetailProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [dramaDetail, setDramaDetail] = useState<DramaDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
  const [episodeListLoading, setEpisodeListLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Fetch drama detail and chapters
    fetchDramaData();
  }, [drama.bookId]);

  // Update selected range when chapter changes
  useEffect(() => {
    if (selectedChapter && chapters.length > 0) {
      const chapterIndex = chapters.findIndex(ch => ch.chapterId === selectedChapter.chapterId);
      if (chapterIndex !== -1) {
        const rangeIndex = Math.floor(chapterIndex / 25);
        setSelectedRangeIndex(rangeIndex);
      }
    }
  }, [selectedChapter, chapters]);

  const fetchDramaData = async () => {
    try {
      setLoading(true);
      
      // First, get drama detail to know total episodes
      const detailData = await getDramaDetail(drama.bookId, true, "book_album", true);
      setDramaDetail(detailData);
      
      // Extract episode metadata from detail API
      const detailEpisodes = (detailData as any)?.list || [];
      const totalEpisodes = detailEpisodes.length;
      console.log('Total episodes from detail API:', totalEpisodes);
      
      if (totalEpisodes === 0) {
        console.warn('No episodes found in detail API');
        setChapters([]);
        return;
      }
      
      // Get all chapters with video URLs using pagination
      const chaptersData = await getAllChapters(drama.bookId, totalEpisodes, true);
      console.log('Chapters from chapters API:', chaptersData.length, 'chapters found');
      
      // Merge detail metadata with chapter video data
      const mergedChapters = chaptersData.map((chapter: Chapter, index: number) => {
        const detailEpisode = detailEpisodes[index];
        if (detailEpisode) {
          // Merge detail metadata into chapter object
          return {
            ...chapter,
            chapterIndex: detailEpisode.chapterIndex,
            isCharge: detailEpisode.isCharge,
            isPay: detailEpisode.isPay || 0,
            chapterSizeVoList: detailEpisode.chapterSizeVoList || []
          };
        }
        return chapter;
      });
      
      console.log('Merged chapters:', mergedChapters.length, 'final episodes');
      setChapters(mergedChapters);
      
      // Set first chapter if available
      if (mergedChapters.length > 0) {
        const firstChapter = mergedChapters[0];
        setSelectedChapter(firstChapter);
        
        // Get video URL from first chapter
        const videoUrl = getBestVideoUrl(firstChapter);
        if (videoUrl) {
          setVideoUrl(videoUrl);
        }
      } else {
        console.warn('No episodes found after merging data');
        setChapters([]);
      }
    } catch (error) {
      console.error('Error fetching drama data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get the best video URL from chapter (from ApiTest.tsx)
  const getBestVideoUrl = (chapter: Chapter): string | null => {
    if (!chapter.cdnList || chapter.cdnList.length === 0) return null;
    
    // Try to find the best video source
    for (const cdn of chapter.cdnList) {
      if (!cdn.videoPathList || cdn.videoPathList.length === 0) continue;
      
      // Prefer non-VIP, default quality videos
      const nonVipDefault = cdn.videoPathList.find(v => v.isDefault === 1 && v.isVipEquity === 0);
      if (nonVipDefault) return nonVipDefault.videoPath;
      
      // Fall back to any non-VIP video
      const nonVip = cdn.videoPathList.find(v => v.isVipEquity === 0);
      if (nonVip) return nonVip.videoPath;
      
      // Last resort: any video
      if (cdn.videoPathList[0]) return cdn.videoPathList[0].videoPath;
    }
    
    return null;
  };

  const handlePlayPause = () => {
    if (selectedChapter && videoUrl && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleChapterSelect = (chapter: Chapter) => {
    console.log('Chapter selected:', chapter.chapterIndex);
    setSelectedChapter(chapter);
    const newVideoUrl = getBestVideoUrl(chapter);
    if (newVideoUrl) {
      setVideoUrl(newVideoUrl);
      setIsPlaying(false); // Reset play state
      setCurrentTime(0); // Reset time
      if (videoRef.current) {
        videoRef.current.load(); // Reload the video with new source
      }
    }
    setShowEpisodeList(false); // Close episode list after selection
  };

  // Get filtered chapters for the current range
  const getFilteredChapters = () => {
    const start = selectedRangeIndex * 25;
    const end = start + 25;
    return chapters.slice(start, end);
  };

  // Handle episode range selection
  const handleRangeSelect = (rangeIndex: number) => {
    setSelectedRangeIndex(rangeIndex);
  };

  // Handle showing episode list with loading
  const handleShowEpisodeList = async () => {
    setEpisodeListLoading(true);
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 300));
    setShowEpisodeList(true);
    setEpisodeListLoading(false);
  };

  // Video control functions
  const playNextEpisode = () => {
    if (!selectedChapter || chapters.length === 0) return;
    
    const currentIndex = chapters.findIndex(ch => ch.chapterId === selectedChapter.chapterId);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < chapters.length) {
      const nextChapter = chapters[nextIndex];
      handleChapterSelect(nextChapter);
    }
  };

  const playPreviousEpisode = () => {
    if (!selectedChapter || chapters.length === 0) return;
    
    const currentIndex = chapters.findIndex(ch => ch.chapterId === selectedChapter.chapterId);
    const prevIndex = currentIndex - 1;
    
    if (prevIndex >= 0) {
      const prevChapter = chapters[prevIndex];
      handleChapterSelect(prevChapter);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    const timeout = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
    setControlsTimeout(timeout);
  };

  // Always show controls when not playing
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
        setControlsTimeout(null);
      }
    }
  }, [isPlaying]);

  const handleVideoClick = () => {
    handlePlayPause();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
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
          if (showEpisodeList) {
            setShowEpisodeList(false);
          } else {
            onBack();
          }
          break;
        case 'KeyE':
          e.preventDefault();
          setShowEpisodeList(!showEpisodeList);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [selectedChapter, chapters, isPlaying, showEpisodeList]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Video Player Area */}
      <div className="relative w-full h-screen flex items-center justify-center bg-gray-900"
           onMouseMove={handleMouseMove}
           onMouseLeave={() => setShowControls(false)}>
        {videoUrl ? (
          <video 
            ref={videoRef}
            className="w-full h-full object-cover"
            poster={drama.coverWap || drama.cover || ''}
            controls={false}
            onClick={handleVideoClick}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(Math.floor(videoRef.current.duration));
              }
            }}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(Math.floor(videoRef.current.currentTime));
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadStart={() => setVideoLoading(true)}
            onCanPlay={() => setVideoLoading(false)}
            onEnded={() => {
              setIsPlaying(false);
              playNextEpisode();
            }}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <div 
            className="w-full h-full bg-cover bg-center bg-gray-800"
            style={{ backgroundImage: `url(${drama.coverWap || drama.cover || ''})` }}
          />
        )}
        
        {/* Video Overlay Controls */}
        <div className={`absolute inset-0 transition-opacity duration-300 z-40 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-50">
            <div className="flex items-center justify-between">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Back button clicked'); // Debug log
                  onBack();
                }}
                className="p-3 hover:bg-white/20 rounded-full transition-colors bg-black/30 backdrop-blur-sm"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {selectedChapter && (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowEpisodeList(true);
                  }}
                  className="text-white text-center hover:bg-white/10 rounded-lg p-2 transition-colors"
                >
                  <h3 className="text-lg font-semibold">{selectedChapter.chapterName}</h3>
                  <p className="text-sm opacity-80">
                    Episode {chapters.findIndex(ch => ch.chapterId === selectedChapter.chapterId) + 1} of {chapters.length}
                  </p>
                </button>
              )}
              
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowEpisodeList(true);
                }}
                className="p-3 hover:bg-white/20 rounded-full transition-colors bg-black/30 backdrop-blur-sm"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Center Controls */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center space-x-8">
              {/* Previous Episode Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playPreviousEpisode();
                }}
                disabled={!selectedChapter || chapters.findIndex(ch => ch.chapterId === selectedChapter.chapterId) === 0}
                className="bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-all disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>
              
              {/* Play/Pause Button */}
              {videoLoading ? (
                <div className="bg-black/50 text-white p-6 rounded-full backdrop-blur-sm">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPause();
                  }}
                  className="bg-black/50 text-white p-6 rounded-full hover:bg-black/70 transition-all backdrop-blur-sm"
                >
                  {isPlaying ? (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
              )}
              
              {/* Next Episode Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playNextEpisode();
                }}
                disabled={!selectedChapter || chapters.findIndex(ch => ch.chapterId === selectedChapter.chapterId) === chapters.length - 1}
                className="bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-all disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="relative w-full h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full transition-all duration-300 cursor-pointer hover:scale-125"
                  style={{ left: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-white text-sm mt-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Movie Info */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {drama.bookName}
                </h2>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="text-gray-300 text-sm">{drama.rating}</span>
                </div>
              </div>

              {/* Episode Navigation */}
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleShowEpisodeList}
                  disabled={episodeListLoading}
                  className="px-3 py-1 bg-white/20 text-white rounded text-sm hover:bg-white/30 transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {episodeListLoading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  )}
                  <span>{episodeListLoading ? 'Loading...' : 'Daftar'}</span>
                </button>
              </div>
            </div>
            
            {/* Keyboard Shortcuts Help */}
            <div className="mt-3 text-center">
              <p className="text-white/60 text-xs">
                Space: Play/Pause • ← →: Previous/Next Episode • E: Episode List • Esc: Back
              </p>
            </div>
          </div>
        </div>

        {/* Episode List Overlay */}
        {showEpisodeList && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end">
            <div className="w-full bg-gradient-to-t from-black via-black/95 to-transparent p-6 rounded-t-3xl transform transition-transform duration-300 ease-out max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-white text-xl font-bold">{dramaDetail?.bookName || drama.bookName}</h2>
                  <p className="text-white/70 text-sm">Semua {chapters.length} Episode</p>
                </div>
                <button 
                  onClick={() => setShowEpisodeList(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Episode Range Filters */}
              <div className="flex space-x-2 mb-6 overflow-x-auto">
                {Array.from({ length: Math.ceil(chapters.length / 25) }, (_, i) => {
                  const start = i * 25 + 1;
                  const end = Math.min((i + 1) * 25, chapters.length);
                  const isActive = selectedRangeIndex === i;
                  
                  return (
                    <button
                      key={i}
                      onClick={() => handleRangeSelect(i)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        isActive 
                          ? 'bg-white text-black' 
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {start === end ? start : `${start}-${end}`}
                    </button>
                  );
                })}
              </div>

              {/* Episode List */}
              <div className="space-y-3">
                {getFilteredChapters().map((chapter, relativeIndex) => {
                  const globalIndex = selectedRangeIndex * 25 + relativeIndex;
                  const isCurrentEpisode = selectedChapter?.chapterId === chapter.chapterId;
                  const isWatched = selectedChapter && chapters.findIndex(ch => ch.chapterId === selectedChapter.chapterId) > globalIndex;
                  
                  return (
                    <button
                      key={`${chapter.chapterId}-${globalIndex}`}
                      onClick={() => handleChapterSelect(chapter)}
                      className={`w-full p-4 rounded-2xl transition-all duration-200 flex items-center space-x-4 ${
                        isCurrentEpisode 
                          ? 'bg-white/20 border border-white/30' 
                          : 'bg-white/10 hover:bg-white/15'
                      }`}
                    >
                      {/* Episode Thumbnail */}
                      <div className="relative flex-shrink-0">
                        <img 
                          src={chapter.chapterImg || drama.coverWap || drama.cover || ''} 
                          alt={chapter.chapterName}
                          className="w-16 h-12 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = drama.coverWap || drama.cover || '';
                          }}
                        />
                        {/* Play icon overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                          {isCurrentEpisode ? (
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          )}
                        </div>
                        {/* Watched indicator */}
                        {isWatched && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-black"></div>
                        )}
                      </div>
                      
                      {/* Episode Info */}
                      <div className="flex-1 text-left">
                        <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">
                          Episode {globalIndex + 1}
                        </h3>
                        <p className="text-white/70 text-xs line-clamp-2 mb-1">
                          {chapter.chapterName}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-white/50">
                          {chapter.viewingDuration && (
                            <span>{Math.floor(chapter.viewingDuration / 60)}m {chapter.viewingDuration % 60}s</span>
                          )}
                          {chapter.isCharge === 1 && (
                            <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                              Premium
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div className="flex items-center space-x-2">
                        {isCurrentEpisode && (
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            <span className="text-white/70 text-xs">Sedang Diputar</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}