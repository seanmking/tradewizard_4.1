import { NextRequest, NextResponse } from 'next/server';
import { formatModuleResults } from '@/utils/output_formatter';
import { supabaseAdmin } from '@/lib/supabase'; // Use the admin client helper
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // Force dynamic rendering

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Synchronous dynamic route parameters
  const assessmentId = params.id;
  // Asynchronous cookies API
  const cookieStore = cookies();

  if (!assessmentId) {
    return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 });
  }

  try {
    console.log(`API: Received GET request to /api/assessment/${assessmentId}/status`);

    // Fetch the full assessment record (including products, summary, certifications, etc.)
    const { data, error } = await supabaseAdmin()
      .from('Assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (error) {
      console.error(`API: Error fetching assessment for status endpoint ${assessmentId}:`, error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Assessment not found', fallback_reason: 'Assessment does not exist.' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch assessment', fallback_reason: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Assessment not found', fallback_reason: 'Assessment does not exist.' }, { status: 404 });
    }

    // If the assessment is not processed yet, return a clear pending state
    if (data.llm_ready || !data.llm_processed_at) {
      console.log(`API: Assessment ${assessmentId} is pending analysis.`);
      return NextResponse.json({
        status: 'pending_analysis',
        fallback_reason: 'Assessment is still being processed. Please wait.',
        assessment: data
      }, { status: 200 });
    }

    // Attempt to load the standardized output (assume it is stored in a column or reformat as needed)
    let standardizedOutput = null;
    try {
      // Force recompute standardized output, ignore DB cache
      const mcpOutputs = data.mcp_outputs || {};
      standardizedOutput = formatModuleResults(data, mcpOutputs);
      console.log(`API: Computed standardized output for assessment ${assessmentId}`);
    } catch (err) {
      console.error(`API: Error formatting MCP results for assessment ${assessmentId}:`, err);
      return NextResponse.json({
        error: 'Failed to format assessment results',
        fallback_reason: 'Could not generate output for assessment.',
        assessment: data
      }, { status: 500 });
    }

    // Return the full, latest, LLM-populated data for the assessment
    return NextResponse.json({
      status: 'completed',
      assessment: data,
      ...standardizedOutput
    }, { status: 200 });

  } catch (error) {
    console.error(`API: Unexpected error in status endpoint for assessment ${assessmentId}:`, error);
    let details = 'Unknown error';
    if (error && typeof error === 'object' && 'message' in error) {
      details = (error as { message: string }).message;
    } else if (typeof error === 'string') {
      details = error;
    } else {
      details = JSON.stringify(error);
    }
    return NextResponse.json({ error: 'An unexpected error occurred', details }, { status: 500 });
  }
}
