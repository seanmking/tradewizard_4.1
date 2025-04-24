import { NextRequest, NextResponse } from 'next/server';
// Use createServerClient from @supabase/ssr for server-side operations
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();
  // Create the server client using cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle potential errors if needed
            console.error('Error setting cookie:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle potential errors if needed
             console.error('Error removing cookie:', error);
          }
        },
      },
    }
  );

  const assessmentId = params.id;

  if (!assessmentId) {
    return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 });
  }

  try {
    // Fetch user to ensure they own the assessment (or implement RLS)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update the assessment to mark it as completed
    const { data, error } = await supabase
      .from('Assessments')
      .update({ completed: true, completed_at: new Date().toISOString() }) // Mark as completed
      .eq('id', assessmentId)
      // Optional: Add .eq('user_id', user.id) if you have a user_id column and RLS isn't fully relied upon here
      .select('id') // Select minimal data to confirm update
      .single(); // Expect only one row

    if (error) {
      console.error('Supabase update error:', error);
      // Check for specific errors, e.g., P0001 if RLS prevents update
      if (error.code === 'PGRST116') { // PostgREST error for no rows found/affected
           return NextResponse.json({ error: 'Assessment not found or access denied' }, { status: 404 });
      }
      return NextResponse.json({ error: `Failed to mark assessment as complete: ${error.message}` }, { status: 500 });
    }

    if (!data) {
         return NextResponse.json({ error: 'Assessment not found after update attempt' }, { status: 404 });
    }

    console.log(`Assessment ${assessmentId} marked as complete.`);
    return NextResponse.json({ message: 'Assessment marked as complete', assessmentId: data.id }, { status: 200 });

  } catch (error: any) {
    console.error('Error marking assessment complete:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
