import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define the structure we expect (adjust based on your actual table columns)
type Product = {
  id: string;
  name: string;
  category?: string;
  estimated_hs_code?: string;
  // Add other product fields as needed
};

type Certification = {
  id: string; // Assuming certifications have an ID
  name: string;
  required_for?: string[];
  // Add other certification fields as needed
};

type Assessment = {
  id: string;
  summary?: string;
  fallback_reason?: string;
  status?: string;
  products?: Product[];
  certifications?: Certification[];
  // Add other assessment fields as needed
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Extract ID safely
  const assessmentId = params?.id;

  // Log the extracted ID
  console.log(`API: Received GET request for assessment details. Extracted ID: ${assessmentId}`);

  if (!assessmentId) {
    console.error('API Error: Assessment ID is missing in params.');
    return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 });
  }

  try {
    console.log(`API: Querying Supabase for Assessment ID: ${assessmentId}`);
    const { data: assessmentData, error } = await supabase
      .from('Assessments')
      .select(`
        *,
        Products (*),
        Certifications (*)
      `)
      .eq('id', assessmentId)
      .maybeSingle();

    // Log the raw data returned from Supabase
    console.log('API: Raw data from Supabase:', JSON.stringify(assessmentData, null, 2));

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch assessment data', details: error.message }, { status: 500 });
    }

    if (!assessmentData) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Filter products locally if direct filtering in Supabase query isn't feasible or preferred
    if (assessmentData.Products) {
        assessmentData.Products = assessmentData.Products.filter((product: any) => product.user_hidden !== true);
    }

    // Structure the response consistently, perhaps nesting under an 'assessment' key
    const responsePayload: { assessment: Assessment } = {
        assessment: assessmentData as Assessment
    };

    console.log(`API: Returning assessment details for ${assessmentId}`);
    return NextResponse.json(responsePayload, { status: 200 });

  } catch (err) {
    console.error('API Error fetching assessment details:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
