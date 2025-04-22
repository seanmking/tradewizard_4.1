-- Create or update Assessments table
CREATE TABLE IF NOT EXISTS "Assessments" (
  "id" UUID PRIMARY KEY,
  "source_url" TEXT,
  "raw_content" TEXT,
  "llm_ready" BOOLEAN DEFAULT FALSE,
  "llm_status" TEXT,
  "llm_processed_at" TIMESTAMP WITH TIME ZONE,
  "summary" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Products table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Products" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "assessment_id" UUID REFERENCES "Assessments"("id"),
  "name" TEXT,
  "category" TEXT,
  "estimated_hs_code" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ProductVariants table if it doesn't exist
CREATE TABLE IF NOT EXISTS "ProductVariants" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" UUID REFERENCES "Products"("id"),
  "name" TEXT,
  "description" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Certifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Certifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "assessment_id" UUID REFERENCES "Assessments"("id"),
  "name" TEXT,
  "required_for" TEXT[],
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create MCP Runs table if it doesn't exist
CREATE TABLE IF NOT EXISTS "mcp_runs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "classification_id" UUID REFERENCES "Assessments"("id"),
  "mcp_name" TEXT,
  "mcp_version" TEXT,
  "payload" JSONB,
  "mcp_output" JSONB,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
