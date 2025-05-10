import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const websiteId = params.id;

  if (!websiteId) {
    return NextResponse.json({ error: 'Website ID is required' }, { status: 400 });
  }

  // Create a Supabase client with the service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables on server');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('Server: Deleting website with ID:', websiteId);

    // Delete the website using the service role client to bypass RLS
    const { error } = await supabase
      .from('websites')
      .delete()
      .eq('id', websiteId);

    if (error) {
      console.error('Server: Error deleting website:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Server: Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
