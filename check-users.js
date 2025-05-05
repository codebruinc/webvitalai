/**
 * Script to check for existing users in the database
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
  console.log('Checking for existing users...');
  
  try {
    // Try to get users from the auth.users table
    // Note: This might not work with the anon key due to permissions
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching users:', error.message);
      
      // Try an alternative approach - check the websites table for user_ids
      console.log('Trying alternative approach - checking websites table...');
      const { data: websites, error: websitesError } = await supabase
        .from('websites')
        .select('user_id')
        .limit(10);
      
      if (websitesError) {
        console.error('Error fetching websites:', websitesError.message);
        throw new Error('Could not fetch user information');
      }
      
      if (websites && websites.length > 0) {
        const userIds = [...new Set(websites.map(website => website.user_id))];
        console.log('Found user IDs from websites table:', userIds);
        return { userIds };
      } else {
        console.log('No websites found');
        return { userIds: [] };
      }
    }
    
    if (users && users.length > 0) {
      console.log(`Found ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}`);
      });
      return { users };
    } else {
      console.log('No users found');
      return { users: [] };
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Run the check
checkUsers()
  .then(result => {
    if ((result.users && result.users.length > 0) || (result.userIds && result.userIds.length > 0)) {
      console.log('\nUsers found. You can use these IDs for testing.');
    } else {
      console.log('\nNo users found. You may need to create a user through the Supabase dashboard.');
    }
  })
  .catch(error => {
    console.error('Check failed:', error);
    process.exit(1);
  });