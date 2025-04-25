import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase'; // Use the admin client helper
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // Force dynamic rendering

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Asynchronous dynamic route parameters
  const { id: assessmentId } = await params;
  // Asynchronous cookies API
  const cookieStore = await cookies();
  // Use the admin client for server-side operations
  const client = supabaseAdmin();

  if (!assessmentId) {
    return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 });
  }

  try {
    console.log(`API: Received GET request to /api/assessment/${assessmentId}/status`);

    const { data, error } = await client
      .from('Assessments')
      .select('status') // Select only the status column
      .eq('id', assessmentId)
      .single(); // Expecting only one result

    if (error) {
      console.error(`API: Error fetching status for assessment ${assessmentId}:`, error);
      // Distinguish between 'not found' and other errors
      if (error.code === 'PGRST116') { // PGRST116: Row not found
         return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch assessment status', details: error.message }, { status: 500 });
    }

    if (!data) {
        return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    console.log(`API: Status for assessment ${assessmentId}: ${data.status}`);
    return NextResponse.json({ status: data.status }, { status: 200 });

  } catch (error: any) {
    console.error(`API: Unexpected error in status endpoint for assessment ${assessmentId}:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}
