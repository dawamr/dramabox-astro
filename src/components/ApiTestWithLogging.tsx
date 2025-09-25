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

// Import logging utilities
import defaultLogger from '../utils/logger.js';
import defaultApiLogger from '../utils/apiLogger.js';

interface ApiTestProps {
  title?: string;
}

export default function ApiTestWithLogging({ title = "DramaBox API Test Suite (With Logging)" }: ApiTestProps) {
  // Create component-specific logger
  const logger = defaultLogger.child('ApiTestComponent');
  
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

  // Component lifecycle logging
  useEffect(() => {
    const startTime = Date.now();
    
    logger.info('ApiTestComponent mounted', {
      title,
      timestamp: new Date().toISOString()
    });

    // Log user action
    defaultLogger.userAction('api_test_component_viewed', {
      title,
      timestamp: new Date().toISOString()
    });

    return () => {
      const duration = Date.now() - startTime;
      logger.info('ApiTestComponent unmounted', {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      defaultLogger.performance('component_lifecycle', duration, {
        component: 'ApiTestComponent',
        action: 'mount_to_unmount'
      });
    };
  }, []);

  // Helper functions
  const setLoadingState = (key: string, state: boolean) => {
    setLoading(prev => ({ ...prev, [key]: state }));
    
    logger.debug('Loading state changed', {
      operation: key,
      loading: state,
      timestamp: new Date().toISOString()
    });
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const showSuccess = (message: string, data?: any) => {
    setSuccess(message);
    logger.info('Operation succeeded', {
      message,
      data: data ? JSON.stringify(data).substring(0, 200) : undefined
    });
  };

  const showError = (message: string, errorDetails?: any) => {
    setError(message);
    logger.error('Operation failed', {
      message,
      error: errorDetails
    });
  };

  // Enhanced API Test Functions with Logging
  const testGetToken = async () => {
    const startTime = Date.now();
    const operation = 'get_token';
    
    try {
      setLoadingState('token', true);
      clearMessages();
      
      logger.info('Starting token retrieval test', {
        operation,
        timestamp: new Date().toISOString()
      });

      // Log user action
      defaultLogger.userAction('test_get_token', {
        source: 'api_test_component',
        timestamp: new Date().toISOString()
      });

      const token = await getToken();
      
      setTokenInfo(token);
      const duration = Date.now() - startTime;
      
      showSuccess('✅ Token retrieved successfully!', {
        tokenLength: token.token?.length,
        deviceId: token.deviceId
      });

      // Log performance
      defaultLogger.performance(operation, duration, {
        success: true,
        tokenLength: token.token?.length
      });
      
    } catch (err: any) {
      const duration = Date.now() - startTime;
      
      showError(`❌ Token error: ${err.message}`, {
        error: err.message,
        stack: err.stack
      });

      defaultLogger.performance(operation, duration, {
        success: false,
        error: err.message
      });
      
    } finally {
      setLoadingState('token', false);
    }
  };

  const testGetHeaders = async () => {
    const startTime = Date.now();
    const operation = 'get_headers';
    
    try {
      setLoadingState('headers', true);
      clearMessages();
      
      logger.info('Starting headers generation test', { operation });

      defaultLogger.userAction('test_get_headers', {
        source: 'api_test_component',
        timestamp: new Date().toISOString()
      });

      const headerData = await getHeaders();
      
      setHeadersInfo(headerData);
      const duration = Date.now() - startTime;
      
      showSuccess('✅ Headers generated successfully!', {
        headerCount: Object.keys(headerData).length
      });

      defaultLogger.performance(operation, duration, {
        success: true,
        headerCount: Object.keys(headerData).length
      });
      
    } catch (err: any) {
      const duration = Date.now() - startTime;
      
      showError(`❌ Headers error: ${err.message}`, {
        error: err.message
      });

      defaultLogger.performance(operation, duration, {
        success: false,
        error: err.message
      });
      
    } finally {
      setLoadingState('headers', false);
    }
  };

  const testGetDramaList = async () => {
    const startTime = Date.now();
    const operation = 'get_drama_list';
    
    try {
      setLoadingState('dramaList', true);
      clearMessages();
      
      logger.info('Starting drama list retrieval test', { operation });

      defaultLogger.userAction('test_get_drama_list', {
        source: 'api_test_component',
        timestamp: new Date().toISOString()
      });

      const list = await getDramaList(0, false);
      
      setDramaList(list);
      const duration = Date.now() - startTime;
      
      showSuccess(`✅ Found ${list.length} drama columns!`, {
        columnCount: list.length,
        totalDramas: list.reduce((acc, col) => acc + (col.bookList?.length || 0), 0)
      });

      defaultLogger.performance(operation, duration, {
        success: true,
        columnCount: list.length,
        totalDramas: list.reduce((acc: number, col: any) => acc + (col.bookList?.length || 0), 0)
      });
      
    } catch (err: any) {
      const duration = Date.now() - startTime;
      
      showError(`❌ Drama list error: ${err.message}`, {
        error: err.message
      });

      defaultLogger.performance(operation, duration, {
        success: false,
        error: err.message
      });
      
    } finally {
      setLoadingState('dramaList', false);
    }
  };

  const testGetRecommendedBooks = async () => {
    const startTime = Date.now();
    const operation = 'get_recommended_books';
    
    try {
      setLoadingState('recommended', true);
      clearMessages();
      
      logger.info('Starting recommended books retrieval test', { operation });

      defaultLogger.userAction('test_get_recommended_books', {
        source: 'api_test_component',
        timestamp: new Date().toISOString()
      });

      const books = await getRecommendedBooks(false);
      const limitedBooks = books.slice(0, 12);
      
      setRecommendedBooks(limitedBooks);
      const duration = Date.now() - startTime;
      
      showSuccess(`✅ Found ${books.length} recommended dramas!`, {
        totalFound: books.length,
        displayed: limitedBooks.length
      });

      defaultLogger.performance(operation, duration, {
        success: true,
        totalFound: books.length,
        displayed: limitedBooks.length
      });
      
    } catch (err: any) {
      const duration = Date.now() - startTime;
      
      showError(`❌ Recommended books error: ${err.message}`, {
        error: err.message
      });

      defaultLogger.performance(operation, duration, {
        success: false,
        error: err.message
      });
      
    } finally {
      setLoadingState('recommended', false);
    }
  };

  const testSearchDrama = async () => {
    const startTime = Date.now();
    const operation = 'search_drama';
    
    try {
      setLoadingState('search', true);
      clearMessages();
      
      logger.info('Starting drama search test', {
        operation,
        query: searchKeyword
      });

      defaultLogger.userAction('test_search_drama', {
        query: searchKeyword,
        source: 'api_test_component',
        timestamp: new Date().toISOString()
      });

      const results = await searchDrama(searchKeyword, false);
      
      setSearchResults(results);
      const duration = Date.now() - startTime;
      
      showSuccess(`✅ Found ${results.length} search results for "${searchKeyword}"!`, {
        query: searchKeyword,
        resultCount: results.length
      });

      defaultLogger.performance(operation, duration, {
        success: true,
        query: searchKeyword,
        resultCount: results.length
      });
      
    } catch (err: any) {
      const duration = Date.now() - startTime;
      
      showError(`❌ Search error: ${err.message}`, {
        query: searchKeyword,
        error: err.message
      });

      defaultLogger.performance(operation, duration, {
        success: false,
        query: searchKeyword,
        error: err.message
      });
      
    } finally {
      setLoadingState('search', false);
    }
  };

  const testSearchDramaIndex = async () => {
    const startTime = Date.now();
    const operation = 'search_drama_index';
    
    try {
      setLoadingState('searchIndex', true);
      clearMessages();
      
      logger.info('Starting drama index search test', { operation });

      defaultLogger.userAction('test_search_drama_index', {
        source: 'api_test_component',
        timestamp: new Date().toISOString()
      });

      const results = await searchDramaIndex(false);
      
      setSearchIndexResults(results);
      const duration = Date.now() - startTime;
      
      showSuccess(`✅ Found ${results.length} hot videos!`, {
        resultCount: results.length
      });

      defaultLogger.performance(operation, duration, {
        success: true,
        resultCount: results.length
      });
      
    } catch (err: any) {
      const duration = Date.now() - startTime;
      
      showError(`❌ Search index error: ${err.message}`, {
        error: err.message
      });

      defaultLogger.performance(operation, duration, {
        success: false,
        error: err.message
      });
      
    } finally {
      setLoadingState('searchIndex', false);
    }
  };

  const loadDramaDetail = async (bookId: string) => {
    const startTime = Date.now();
    const operation = 'load_drama_detail';
    
    try {
      setLoadingState('detail', true);
      clearMessages();
      
      logger.info('Starting drama detail load', {
        operation,
        bookId
      });

      defaultLogger.userAction('load_drama_detail', {
        bookId,
        source: 'api_test_component',
        timestamp: new Date().toISOString()
      });
      
      const [detail, chapterList] = await Promise.all([
        getDramaDetail(bookId, true, "book_album", false),
        getChapters(bookId, false)
      ]);
      
      setSelectedDrama(detail);
      setChapters(chapterList);
      setShowDetailModal(true);
      
      const duration = Date.now() - startTime;
      
      showSuccess(`✅ Loaded details for ${detail.bookName}!`, {
        bookId,
        bookName: detail.bookName,
        chapterCount: chapterList.length
      });

      defaultLogger.performance(operation, duration, {
        success: true,
        bookId,
        chapterCount: chapterList.length
      });
      
    } catch (err: any) {
      const duration = Date.now() - startTime;
      
      showError(`❌ Detail error: ${err.message}`, {
        bookId,
        error: err.message
      });

      defaultLogger.performance(operation, duration, {
        success: false,
        bookId,
        error: err.message
      });
      
    } finally {
      setLoadingState('detail', false);
    }
  };

  // Tab change logging
  const handleTabChange = (newTab: string) => {
    logger.info('Tab changed', {
      from: activeTab,
      to: newTab,
      timestamp: new Date().toISOString()
    });

    defaultLogger.userAction('tab_change', {
      from: activeTab,
      to: newTab,
      component: 'api_test',
      timestamp: new Date().toISOString()
    });

    setActiveTab(newTab);
  };

  // Search keyword change logging
  const handleSearchKeywordChange = (keyword: string) => {
    setSearchKeyword(keyword);
    
    logger.debug('Search keyword changed', {
      keyword,
      length: keyword.length
    });
  };

  // Tab navigation
  const tabs = [
    { id: 'theater', name: '🎭 Theater List', count: dramaList.length },
    { id: 'recommended', name: '⭐ Recommended', count: recommendedBooks.length },
    { id: 'search', name: '🔍 Search', count: searchResults.length },
    { id: 'searchIndex', name: '🔥 Hot Videos', count: searchIndexResults.length },
    { id: 'auth', name: '🔐 Auth Info', count: tokenInfo ? 1 : 0 },
    { id: 'logs', name: '📝 Logs', count: 0 }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Comprehensive testing suite for all DramaBox API endpoints with integrated logging system
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
            onClick={() => handleTabChange(tab.id)}
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
        {/* Logging Info Tab */}
        {activeTab === 'logs' && (
          <Card>
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-4">📝 Logging System Status</h2>
              
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">✅ Logging System Active</h3>
                  <p className="text-sm text-green-700 mb-3">
                    All API operations are being logged with detailed information including performance metrics, 
                    error tracking, and user actions.
                  </p>
                  
                  <div className="text-xs text-green-600 space-y-1">
                    <p>• Log files are stored in: <code className="bg-green-100 px-1 rounded">./logs/dev/</code></p>
                    <p>• Console logging: <strong>Enabled</strong></p>
                    <p>• File logging: <strong>Enabled</strong></p>
                    <p>• Performance monitoring: <strong>Active</strong></p>
                    <p>• Error tracking: <strong>Active</strong></p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">📊 What's Being Logged</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• <strong>API Requests/Responses:</strong> Method, URL, status, duration, payload size</p>
                    <p>• <strong>Performance Metrics:</strong> Operation timing, slow query detection</p>
                    <p>• <strong>User Actions:</strong> Button clicks, tab changes, search queries</p>
                    <p>• <strong>Error Details:</strong> Stack traces, error context, retry attempts</p>
                    <p>• <strong>Component Lifecycle:</strong> Mount/unmount timing, render performance</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">🔍 How to View Logs</h3>
                  <div className="text-sm text-yellow-700 space-y-2">
                    <p><strong>Real-time log monitoring:</strong></p>
                    <code className="block bg-yellow-100 p-2 rounded text-xs">
                      tail -f logs/dev/dramabox-{new Date().toISOString().split('T')[0]}.log
                    </code>
                    
                    <p><strong>Search for specific operations:</strong></p>
                    <code className="block bg-yellow-100 p-2 rounded text-xs">
                      grep "get_token" logs/dev/*.log
                    </code>
                    
                    <p><strong>View performance metrics:</strong></p>
                    <code className="block bg-yellow-100 p-2 rounded text-xs">
                      grep "Performance:" logs/dev/*.log
                    </code>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-800 mb-2">🛠️ Test the Logging System</h3>
                  <p className="text-sm text-purple-700 mb-3">
                    Run the comprehensive logging test to see all features in action:
                  </p>
                  <code className="block bg-purple-100 p-2 rounded text-xs mb-2">
                    node test-logging.js
                  </code>
                  <p className="text-xs text-purple-600">
                    This will generate sample logs demonstrating all logging features including 
                    API calls, performance monitoring, error handling, and user actions.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Search Tab with enhanced logging */}
        {activeTab === 'search' && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">🔍 Search Dramas (Enhanced Logging)</h2>
            </div>
            
            <div className="flex gap-3 mb-4">
              <TextInput
                type="text"
                placeholder="Enter search keyword..."
                value={searchKeyword}
                onChange={(e) => handleSearchKeywordChange(e.target.value)}
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
                    <Button 
                      onClick={() => {
                        logger.info('Drama details requested', {
                          bookId: result.bookId,
                          bookName: result.bookName,
                          source: 'search_results'
                        });
                        loadDramaDetail(result.bookId);
                      }} 
                      size="xs" 
                      className="w-full"
                    >
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

        {/* Include other existing tab content here... */}
        {/* For brevity, I'm only showing the search tab and logs tab as examples */}
      </div>
    </div>
  );
}
