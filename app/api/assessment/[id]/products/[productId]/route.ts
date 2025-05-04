// app/api/assessment/[id]/products/[productId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase'; // Import Supabase admin client

// Define a type for the product update payload (allow partial updates)
interface UpdateProductPayload {
    name?: string;
    category?: string;
    description?: string;
    estimated_hs_code?: string;
    confirmed_hs_code?: string;
    confidence_score?: number;
    user_hidden?: boolean;
    // Add other fields that can be updated
}

/**
 * PATCH handler to update an existing product within the assessment's products JSONB array.
 * @param request NextRequest containing the update data in the body.
 * @param params Object containing route parameters, expecting { id: string, productId: string }.
 * @returns NextResponse with the updated product data or an error message.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string; productId: string } }) {
    const assessmentId = params.id;
    const productId = params.productId;
    console.log(`API: Received PATCH request for assessment ID: ${assessmentId}, Product ID: ${productId}`);
    const client = supabaseAdmin();

    try {
        const updates: UpdateProductPayload = await request.json();
        console.log('API: Received product updates:', updates);

        // 1. Fetch the assessment and its current products array
        const { data: assessmentData, error: fetchError } = await client
            .from('Assessments')
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

        // 2. Find the product to update within the array
        const currentProducts = (Array.isArray(assessmentData.products) ? assessmentData.products : []) as any[];
        const productIndex = currentProducts.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return NextResponse.json({ message: `Product with ID ${productId} not found in assessment ${assessmentId}` }, { status: 404 });
        }

        // 3. Prepare the updated product object
        const originalProduct = currentProducts[productIndex];
        const updatedProduct = {
            ...originalProduct,
            ...updates, // Apply updates from payload
            id: productId, // Ensure ID is not overwritten
            created_at: originalProduct.created_at, // Ensure created_at is not overwritten
            updated_at: new Date().toISOString(), // Update the product's specific updated_at timestamp
        };

        // --- Input Validation for updates (Example) ---
        if (updates.name !== undefined && (typeof updates.name !== 'string' || updates.name.trim() === '')) {
             return NextResponse.json({ message: 'Invalid product name provided' }, { status: 400 });
        }
        if (updates.user_hidden !== undefined && typeof updates.user_hidden !== 'boolean') {
             return NextResponse.json({ message: 'Invalid user_hidden value provided' }, { status: 400 });
        }
        // Add more validation as needed for other fields...
        // --- End Validation ---

        // 4. Create the new array with the updated product
        const updatedProductsArray = [
            ...currentProducts.slice(0, productIndex),
            updatedProduct,
            ...currentProducts.slice(productIndex + 1),
        ];

        // 5. Update the assessment record
        const { data: updateData, error: updateError } = await client
            .from('Assessments')
            .update({
                products: updatedProductsArray,
                updated_at: new Date().toISOString(), // Update the assessment's main timestamp
            })
            .eq('id', assessmentId)
            .select('id') // Optionally select fields
            .single();

        if (updateError) {
            console.error('API: Error updating assessment with modified product:', updateError);
            return NextResponse.json({ message: 'Error updating product within assessment', error: updateError.message }, { status: 500 });
        }

        console.log(`API: Product ${productId} updated successfully in assessment ${assessmentId}. Update result:`, updateData);
        // Return the updated product with group_id
        return NextResponse.json({ ...updatedProduct, group_id: updatedProduct.group_id ?? null }, { status: 200 });

    } catch (error: any) {
        console.error('API: Error processing PATCH request:', error);
         if (error instanceof SyntaxError) {
             return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}

// --- DELETE Handler (Soft Delete Recommendation) ---
// As discussed, PATCH is generally preferred for soft deletes (setting user_hidden: true).
// The current PATCH handler already supports updating user_hidden.
// If a dedicated DELETE endpoint is strictly required for semantic reasons,
// it would likely perform the same logic as PATCH with body { user_hidden: true }.
// export async function DELETE(...) { ... }
