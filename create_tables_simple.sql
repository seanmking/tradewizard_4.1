-- Add missing columns to Assessments table if it exists
ALTER TABLE IF EXISTS "Assessments" 
  ADD COLUMN IF NOT EXISTS "llm_status" TEXT,
  ADD COLUMN IF NOT EXISTS "llm_processed_at" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "summary" TEXT;

-- Create Assessments table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Assessments" (
  "id" TEXT PRIMARY KEY,
  "source_url" TEXT,
  "raw_content" TEXT,
  "llm_ready" BOOLEAN DEFAULT FALSE,
  "llm_status" TEXT,
  "llm_processed_at" TIMESTAMP WITH TIME ZONE,
  "summary" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Products table
CREATE TABLE IF NOT EXISTS "Products" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "assessment_id" TEXT REFERENCES "Assessments"("id"),
  "name" TEXT,
  "category" TEXT,
  "estimated_hs_code" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ProductVariants table
CREATE TABLE IF NOT EXISTS "ProductVariants" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "product_id" TEXT REFERENCES "Products"("id"),
  "name" TEXT,
  "description" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Certifications table
CREATE TABLE IF NOT EXISTS "Certifications" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "assessment_id" TEXT REFERENCES "Assessments"("id"),
  "name" TEXT,
  "required_for" TEXT[],
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mcp_runs table
CREATE TABLE IF NOT EXISTS "mcp_runs" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "classification_id" TEXT REFERENCES "Assessments"("id"),
  "mcp_name" TEXT,
  "mcp_version" TEXT,
  "payload" JSONB,
  "mcp_output" JSONB,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
