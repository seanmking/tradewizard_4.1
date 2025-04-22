// app/api/scrape/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsite } from '@/lib/scraper';
import { createAssessment } from '@/lib/supabase';
import { runInterpreter, pollAssessmentStatus } from '@/lib/interpreter';

export async function POST(req: NextRequest) {
  try {
    // Extract URL from request body
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required', success: false },
        { status: 400 }
      );
    }

    // Basic URL validation
    let processedUrl = url.trim();
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }

    console.log(`Processing website analysis request for URL: ${processedUrl}`);
    
    // Step 1: Scrape the website
    const rawContent = await scrapeWebsite(processedUrl);
    
    // Check if scraping returned an error
    const scrapedData = JSON.parse(rawContent);
    if (scrapedData.error) {
      return NextResponse.json(
        { 
          error: `Error scraping website: ${scrapedData.error}`, 
          success: false 
        },
        { status: 422 }
      );
    }
    
    // Step 2: Create assessment record in Supabase
    try {
      const assessment = await createAssessment({ url: processedUrl, rawContent });
      console.log(`Created assessment with ID: ${assessment.id}`);
      
      // Step 3: Trigger MCP interpreter (non-blocking)
      runInterpreter(assessment.id).catch(error => {
        console.error(`Error running interpreter for assessment ${assessment.id}:`, error);
      });
      
      // Return success response with assessment ID
      return NextResponse.json({ 
        success: true, 
        assessmentId: assessment.id,
        message: 'Website analysis initiated successfully'
      });
    } catch (dbError) {
      console.error('Error creating assessment in database:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to create assessment record', 
          details: dbError instanceof Error ? dbError.message : 'Unknown database error',
          success: false 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing website analysis request:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
        details: error instanceof Error ? error.stack : 'No stack trace available'
      },
      { status: 500 }
    );
  }
}

// Optional: Add a GET endpoint to check assessment status
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const assessmentId = url.searchParams.get('id');
    
    if (!assessmentId) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      );
    }
    
    // Poll for assessment status
    const assessment = await pollAssessmentStatus(assessmentId);
    
    if (!assessment) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Assessment processing in progress or timed out',
          status: 'processing'
        }
      );
    }
    
    return NextResponse.json({
      success: true,
      assessment,
      status: assessment.llm_status || 'unknown'
    });
  } catch (error) {
    console.error('Error checking assessment status:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      },
      { status: 500 }
    );
  }
}
