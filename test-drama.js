// Test script for drama.ts API functions
import { getDramaList, getRecommendedBooks } from './src/api/drama.ts';

async function testDramaAPI() {
  console.log('🧪 Starting Drama API Tests...\n');
  
  try {
    console.log('1️⃣ Testing getDramaList...');
    console.log('=====================================');
    const dramaList = await getDramaList(true);
    console.log(`✅ getDramaList Success: Found ${dramaList.length} columns`);
    
    // Show summary of first column
    if (dramaList.length > 0) {
      const firstColumn = dramaList[0];
      console.log(`📊 First column "${firstColumn.title}" has ${firstColumn.bookList.length} dramas`);
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ getDramaList Failed:', error.message);
  }

  try {
    console.log('2️⃣ Testing getRecommendedBooks...');
    console.log('=====================================');
    const recommendedBooks = await getRecommendedBooks(true);
    console.log(`✅ getRecommendedBooks Success: Found ${recommendedBooks.length} recommended dramas`);
    
    // Show first few recommendations
    if (recommendedBooks.length > 0) {
      console.log('\n📋 Top 3 Recommendations:');
      recommendedBooks.slice(0, 3).forEach((book, i) => {
        console.log(`${i + 1}. ${book.bookName} (ID: ${book.bookId})`);
      });
    }
    
  } catch (error) {
    console.error('❌ getRecommendedBooks Failed:', error.message);
  }

  console.log('\n🎯 Drama API Tests Completed!');
}

// Run the tests
testDramaAPI().catch(console.error);