const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';
const USER_EMAIL = 'Example@test.com';
const USER_PASSWORD = 'Password123!';

let authToken = null;
let userId = null;
let categories = [];

// Sample expense data with realistic descriptions and amounts
const sampleExpenses = [
  // Groceries (Essential)
  { categoryName: 'Groceries', amount: 87.43, description: 'Weekly grocery shopping at Safeway', daysAgo: 1 },
  { categoryName: 'Groceries', amount: 15.67, description: 'Quick stop for milk and bread', daysAgo: 3 },
  { categoryName: 'Groceries', amount: 142.85, description: 'Monthly bulk shopping at Costco', daysAgo: 7 },
  { categoryName: 'Groceries', amount: 23.45, description: 'Fresh vegetables from farmers market', daysAgo: 10 },
  { categoryName: 'Groceries', amount: 67.23, description: 'Weekend grocery run', daysAgo: 14 },
  
  // Gas/Transportation (Essential)
  { categoryName: 'Gas', amount: 52.30, description: 'Fill up at Shell station', daysAgo: 2 },
  { categoryName: 'Transportation', amount: 45.00, description: 'Gas for weekend trip', daysAgo: 5 },
  { categoryName: 'Gas', amount: 48.75, description: 'Weekly fuel expense', daysAgo: 9 },
  { categoryName: 'Transportation', amount: 12.50, description: 'Bus fare for downtown', daysAgo: 12 },
  
  // Utilities (Essential)
  { categoryName: 'Utilities', amount: 125.67, description: 'Monthly electricity bill', daysAgo: 15 },
  { categoryName: 'Utilities', amount: 89.32, description: 'Water and sewer bill', daysAgo: 20 },
  
  // Dining Out (Non-Essential)
  { categoryName: 'Dining Out', amount: 28.50, description: 'Lunch at local cafe', daysAgo: 1 },
  { categoryName: 'Dining Out', amount: 67.84, description: 'Dinner date at Italian restaurant', daysAgo: 4 },
  { categoryName: 'Dining Out', amount: 15.25, description: 'Coffee and pastry', daysAgo: 6 },
  { categoryName: 'Dining Out', amount: 42.75, description: 'Pizza delivery for movie night', daysAgo: 8 },
  { categoryName: 'Dining Out', amount: 85.60, description: 'Family dinner at steakhouse', daysAgo: 11 },
  
  // Entertainment (Non-Essential)
  { categoryName: 'Entertainment', amount: 14.99, description: 'Netflix monthly subscription', daysAgo: 3 },
  { categoryName: 'Entertainment', amount: 25.00, description: 'Movie tickets for two', daysAgo: 7 },
  { categoryName: 'Entertainment', amount: 45.00, description: 'Concert tickets', daysAgo: 13 },
  
  // Shopping (Non-Essential)
  { categoryName: 'Shopping', amount: 78.99, description: 'New shirt and jeans at Target', daysAgo: 6 },
  { categoryName: 'Shopping', amount: 156.45, description: 'Winter jacket from department store', daysAgo: 18 },
  { categoryName: 'Shopping', amount: 34.50, description: 'Books from local bookstore', daysAgo: 22 },
  
  // Healthcare (Essential)
  { categoryName: 'Healthcare', amount: 25.00, description: 'Pharmacy prescription pickup', daysAgo: 5 },
  { categoryName: 'Healthcare', amount: 150.00, description: 'Dentist checkup copay', daysAgo: 16 },
  
  // Personal Care (Non-Essential)
  { categoryName: 'Personal Care', amount: 35.00, description: 'Haircut and styling', daysAgo: 9 },
  { categoryName: 'Personal Care', amount: 22.50, description: 'Skincare products', daysAgo: 17 },
  
  // Miscellaneous expenses for variety
  { categoryName: 'Groceries', amount: 94.32, description: 'Special ingredients for dinner party', daysAgo: 25 },
  { categoryName: 'Gas', amount: 51.20, description: 'Road trip fuel stop', daysAgo: 28 },
  { categoryName: 'Dining Out', amount: 19.75, description: 'Quick lunch between meetings', daysAgo: 30 },
];

async function authenticateUser() {
  console.log('🔐 Authenticating user...');
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: USER_EMAIL,
        password: USER_PASSWORD
      })
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    authToken = data.token;
    userId = data.userId;
    console.log('✅ User authenticated successfully');
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    process.exit(1);
  }
}

async function getBudgetCategories() {
  console.log('📋 Fetching budget categories...');
  try {
    const response = await fetch(`${API_BASE_URL}/budgetcategories`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
    }

    categories = await response.json();
    console.log(`✅ Found ${categories.length} budget categories`);
    categories.forEach(cat => console.log(`   - ${cat.name} (${cat.isEssential ? 'Essential' : 'Non-Essential'})`));
  } catch (error) {
    console.error('❌ Error fetching categories:', error.message);
    process.exit(1);
  }
}

async function addExpense(expenseData) {
  const category = categories.find(cat => 
    cat.name.toLowerCase().includes(expenseData.categoryName.toLowerCase()) ||
    expenseData.categoryName.toLowerCase().includes(cat.name.toLowerCase())
  );

  if (!category) {
    console.log(`⚠️  Category not found for: ${expenseData.categoryName}, skipping...`);
    return;
  }

  const expenseDate = new Date();
  expenseDate.setDate(expenseDate.getDate() - expenseData.daysAgo);

  const createRequest = {
    categoryId: category.categoryId,
    amount: expenseData.amount,
    description: expenseData.description,
    expenseDate: expenseDate.toISOString()
  };

  try {
    const response = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createRequest)
    });

    if (!response.ok) {
      throw new Error(`Failed to add expense: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Added: $${expenseData.amount} - ${expenseData.description}`);
    return result;
  } catch (error) {
    console.log(`❌ Failed to add expense: ${expenseData.description} - ${error.message}`);
  }
}

async function addAllExpenses() {
  console.log(`\n💰 Adding ${sampleExpenses.length} sample expenses...`);
  
  for (const expense of sampleExpenses) {
    await addExpense(expense);
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🎉 Finished adding sample expenses!');
}

async function main() {
  console.log('🚀 Starting sample expense data creation...\n');
  
  try {
    await authenticateUser();
    await getBudgetCategories();
    await addAllExpenses();
    
    console.log('\n✨ All done! You can now test the expense viewing functionality.');
    console.log('🌐 Visit your web application to see the sample data in action.');
  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  }
}

main();