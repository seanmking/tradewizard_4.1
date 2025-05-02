import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase'; // Assuming you have an admin client
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { scrapeWebsite } from '@/lib/scraper';
import { runInterpreter } from '@/lib/interpreter';

// Define the expected payload from the frontend
interface StartAssessmentPayload {
    websiteUrl: string;
    // Add other fields passed from the frontend if needed
    // e.g., facebookUrl?: string;
    // e.g., instagramUrl?: string;
    // e.g., linkedinUrl?: string;
    // e.g., productPdfPath?: string;
    // e.g., companyProfilePath?: string;
}

export async function POST(request: NextRequest) {
    console.log("API: Received POST request to /api/assessment/start");
    const cookieStore = cookies();
    const client = supabaseAdmin(); // Use admin client for creating assessment

    try {
        const payload: StartAssessmentPayload = await request.json();
        console.log('API: Received payload:', payload);

        // 1. Validate payload
        if (!payload.websiteUrl) {
            return NextResponse.json({ message: 'Website URL is required' }, { status: 400 });
        }

        // Normalize and validate URL
        let normalizedUrl = payload.websiteUrl.trim();
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = 'https://' + normalizedUrl;
        }

        // --- User Authentication/Identification (Placeholder) ---
        // In a real app, you'd get the user ID from the session/auth context
        // const { data: { user } } = await supabase.auth.getUser();
        // if (!user) { 
        //     return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
        // }
        // const userId = user.id;
        // For now, let's assume anonymous or a fixed user ID if applicable
        const userId = null; // Replace with actual user ID retrieval later

        // 2. Create a new Assessment record in Supabase
        const { data: newAssessment, error: insertError } = await client
            .from('Assessments')
            .insert({
                // user_id: userId, // Associate with the user if logged in
                source_url: normalizedUrl, // Use the correct column name
                // Add other fields from payload as needed
                // facebook_url: payload.facebookUrl,
                // ... other fields
                status: 'pending_analysis', // Initial status before processing
                llm_ready: true,
                // created_at and updated_at are handled by Supabase defaults
            })
            .select('id') // Select the ID of the newly created assessment
            .single();

        if (insertError) {
            console.error('API: Error creating assessment:', insertError);
            return NextResponse.json({ message: 'Failed to create assessment', error: insertError.message }, { status: 500 });
        }

        if (!newAssessment || !newAssessment.id) {
             console.error('API: Assessment created but ID not returned.');
            return NextResponse.json({ message: 'Assessment created but failed to retrieve ID' }, { status: 500 });
        }

        const assessmentId = newAssessment.id;
        console.log(`API: New assessment created with ID: ${assessmentId}`);

        // Scrape website and save raw content
        const rawContent = await scrapeWebsite(normalizedUrl);
        const { error: updateError } = await client
            .from('Assessments')
            .update({ raw_content: rawContent, llm_ready: true })
            .eq('id', assessmentId);
        if (updateError) console.error('API: Error saving scraped content:', updateError);
        // Run interpreter
        await runInterpreter(assessmentId);

        // ---------------------------------------------------------------------
        // MCP Trigger: Setting llm_ready=true above signals the LLM interpreter
        // module (monitoring Supabase) to pick up this assessment for processing.
        // No explicit trigger call is needed here if that monitor is active.
        // ---------------------------------------------------------------------

        // Return the ID of the newly created assessment
        return NextResponse.json({ assessmentId: assessmentId }, { status: 201 }); // 201 Created

    } catch (error: any) {
        console.error('API: Error processing /api/assessment/start request:', error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
