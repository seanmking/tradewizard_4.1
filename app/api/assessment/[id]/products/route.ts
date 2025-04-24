// app/api/assessment/[id]/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, generateUUID } from '@/lib/supabase'; // Import Supabase admin client and UUID generator

// Define a basic type for the product within the API (can be enhanced)
interface NewProductPayload {
    name: string;
    category?: string;
    description?: string;
    estimated_hs_code?: string;
    // Add other fields expected from the client
}

/**
 * POST handler to create a new product and add it to the assessment's products JSONB array.
 * @param request NextRequest containing the product data in the body.
 * @param params Object containing route parameters, expecting { id: string } for assessment ID.
 * @returns NextResponse with the newly created product data or an error message.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const assessmentId = params.id;
    console.log(`API: Received POST request for assessment ID: ${assessmentId}`);
    const client = supabaseAdmin(); // Use admin client for server-side operations

    try {
        const productPayload: NewProductPayload = await request.json();
        console.log('API: Received product payload:', productPayload);

        // 1. Validate incoming payload (basic example)
        if (!productPayload.name || typeof productPayload.name !== 'string' || productPayload.name.trim() === '') {
            return NextResponse.json({ message: 'Invalid product name provided' }, { status: 400 });
        }

        // 2. Fetch the assessment and its current products array
        const { data: assessmentData, error: fetchError } = await client
            .from('Assessments') // Assuming table name is 'Assessments'
            .select('products')
            .eq('id', assessmentId)
            .single();

        if (fetchError) {
            console.error('API: Error fetching assessment:', fetchError);
            return NextResponse.json({ message: 'Error fetching assessment', error: fetchError.message }, { status: 500 });
        }

        if (!assessmentData) {
            return NextResponse.json({ message: `Assessment with ID ${assessmentId} not found` }, { status: 404 });
        }

        // 3. Prepare the new product object
        const currentProducts = (Array.isArray(assessmentData.products) ? assessmentData.products : []) as any[];
        const newProduct = {
            id: generateUUID(), // Generate a unique ID for the product within the JSON array
            ...productPayload,
            name: productPayload.name.trim(), // Ensure name is trimmed
            source: 'manual', 
            user_hidden: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        // 4. Append the new product to the array
        const updatedProductsArray = [...currentProducts, newProduct];

        // 5. Update the assessment record with the new products array
        const { data: updateData, error: updateError } = await client
            .from('Assessments')
            .update({
                products: updatedProductsArray,
                updated_at: new Date().toISOString() // Also update the assessment's updated_at timestamp
            })
            .eq('id', assessmentId)
            .select('id') // Optionally select fields from the updated assessment
            .single(); 

        if (updateError) {
            console.error('API: Error updating assessment with new product:', updateError);
            return NextResponse.json({ message: 'Error adding product to assessment', error: updateError.message }, { status: 500 });
        }

        console.log(`API: Product added successfully to assessment ${assessmentId}. Update result:`, updateData);
        return NextResponse.json(newProduct, { status: 201 }); // Return the newly created product

    } catch (error: any) {
        console.error('API: Error processing POST request:', error);
        // Handle potential JSON parsing errors
        if (error instanceof SyntaxError) {
             return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
