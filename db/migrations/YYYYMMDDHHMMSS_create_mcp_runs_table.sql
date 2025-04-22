-- /Users/seanking/Projects/tradewizard_4.1/db/migrations/YYYYMMDDHHMMSS_create_mcp_runs_table.sql

-- Create the mcp_runs table to log executions of Model Context Protocols (MCPs)

CREATE TABLE public.mcp_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id uuid REFERENCES public."Assessments"(id) ON DELETE SET NULL,
    classification_id uuid REFERENCES public."Classifications"(id) ON DELETE SET NULL,
    mcp_name text NOT NULL,
    mcp_version text NOT NULL,
    payload jsonb NOT NULL,
    result jsonb NULL, -- Stores the structured result from MCPOutput.result
    confidence float NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    llm_input_prompt text NULL,
    llm_raw_output text NULL, -- Store as text, might contain non-JSON elements
    error text NULL, -- Stores error message if MCP run failed
    started_at timestamptz NOT NULL,
    completed_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Optional: Add indexes for common query patterns
CREATE INDEX idx_mcp_runs_assessment_id ON public.mcp_runs(assessment_id);
CREATE INDEX idx_mcp_runs_classification_id ON public.mcp_runs(classification_id);
CREATE INDEX idx_mcp_runs_mcp_name ON public.mcp_runs(mcp_name);
CREATE INDEX idx_mcp_runs_created_at ON public.mcp_runs(created_at DESC);

-- Add comments to clarify column purpose
COMMENT ON TABLE public.mcp_runs IS 'Logs the execution details of each Model Context Protocol (MCP) run.';
COMMENT ON COLUMN public.mcp_runs.assessment_id IS 'Optional link to the Assessment that triggered or is related to this MCP run.';
COMMENT ON COLUMN public.mcp_runs.classification_id IS 'Optional link to the Classification session related to this MCP run.';
COMMENT ON COLUMN public.mcp_runs.mcp_name IS 'Identifier name of the MCP that was executed (e.g., ''compliance'', ''hs_code'').';
COMMENT ON COLUMN public.mcp_runs.mcp_version IS 'Version of the MCP logic that was executed (e.g., ''1.0.1'').';
COMMENT ON COLUMN public.mcp_runs.payload IS 'The input data dictionary provided to the MCP''s run method.';
COMMENT ON COLUMN public.mcp_runs.result IS 'The structured result object returned by the MCP (part of MCPOutput). Null if run failed.';
COMMENT ON COLUMN public.mcp_runs.confidence IS 'Confidence score (0.0-1.0) returned by the MCP. Null if run failed or not applicable.';
COMMENT ON COLUMN public.mcp_runs.llm_input_prompt IS 'The specific prompt sent to the LLM during this MCP run, if applicable.';
COMMENT ON COLUMN public.mcp_runs.llm_raw_output IS 'The raw, unparsed output received from the LLM during this MCP run, if applicable.';
COMMENT ON COLUMN public.mcp_runs.error IS 'Contains the error message or traceback if the MCP run failed.';
COMMENT ON COLUMN public.mcp_runs.started_at IS 'Timestamp indicating when the MCP execution began.';
COMMENT ON COLUMN public.mcp_runs.completed_at IS 'Timestamp indicating when the MCP execution finished (successfully or with an error).';
COMMENT ON COLUMN public.mcp_runs.created_at IS 'Timestamp automatically generated when the log record was inserted.';

-- Enable Row Level Security (RLS)
ALTER TABLE public.mcp_runs ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policy: Allow users to see their own MCP runs
-- Adjust this policy based on actual access requirements, likely linking through Classification/Assessment owner
-- For now, restricting to service_role bypasses RLS for backend processes.
-- A more refined policy might check ownership via assessment_id or classification_id.
CREATE POLICY "Allow service_role access" ON public.mcp_runs
    FOR ALL
    USING (true); -- Simplistic initial policy; assumes backend uses service_role
    -- WITH CHECK (true);
