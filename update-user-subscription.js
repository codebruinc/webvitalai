const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables.');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file.');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get user ID from command line arguments or use default for testing
const userId = process.argv[2] || null;

// Check if user ID was provided
if (!userId) {
  console.error('Error: No user ID provided.');
  console.error('Usage: node update-user-subscription.js <user-id>');
  console.error('Example: node update-user-subscription.js 8ff0950a-c73d-4efc-8b73-56205b8035e0');
  process.exit(1);
}

async function updateUserSubscription() {
  console.log(`Checking if user ${userId} exists...`);
  
  try {
    // First, check if the user exists in auth.users
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      console.error('Error: User not found in auth.users table.');
      console.error('Details:', userError?.message || 'Unknown error');
      console.error('\nPossible solutions:');
      console.error('1. Verify the user ID is correct');
      console.error('2. Create the user first before adding a subscription');
      process.exit(1);
    }
    
    console.log(`User found: ${user.user.email}`);
    
    // Check if user already has a subscription
    const { data: existingSubscription, error: subCheckError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (subCheckError && !subCheckError.message.includes('No rows found')) {
      console.error('Error checking existing subscription:', subCheckError.message);
      process.exit(1);
    }
    
    if (existingSubscription) {
      console.log('User already has a subscription. Updating to premium...');
      
      // Update existing subscription to premium
      const { data: updatedSub, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_type: 'premium',
          status: 'active',
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select();
      
      if (updateError) {
        console.error('Error updating subscription:', updateError.message);
        process.exit(1);
      }
      
      console.log('Subscription updated successfully!');
      console.log(updatedSub);
    } else {
      console.log('Creating new premium subscription for user...');
      
      // Create new subscription
      const { data: newSub, error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: 'premium',
          status: 'active',
          stripe_customer_id: 'cus_manual_premium',
          stripe_subscription_id: 'sub_manual_premium',
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          cancel_at_period_end: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (insertError) {
        console.error('Error creating subscription:', insertError.message);
        process.exit(1);
      }
      
      console.log('Subscription created successfully!');
      console.log(newSub);
    }
    
    console.log('\nProduction Mode Configuration:');
    console.log('1. Ensure your .env.local file has the following settings:');
    console.log('   NODE_ENV=production');
    console.log('   TESTING_MODE=false');
    console.log('\n2. Make sure all required production variables are set in .env.local:');
    console.log('   - Supabase credentials');
    console.log('   - Stripe API keys');
    console.log('   - Redis configuration');
    console.log('   - Other API keys');
    console.log('\n3. To start the application in production mode:');
    console.log('   npm run build && npm run start');
    console.log('\n4. To set up subscriptions for additional users:');
    console.log('   node update-user-subscription.js <user-id>');
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the function
updateUserSubscription();