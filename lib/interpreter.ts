// lib/interpreter.ts
import { spawn } from 'child_process';
import path from 'path';
import { getAssessmentById, supabaseAdmin } from './supabase';

/**
 * Runs the MCP interpreter for a given assessment ID
 * This function serves as a bridge between the Next.js frontend and the Python MCP system
 * 
 * @param assessmentId The ID of the assessment to process
 * @returns A promise that resolves when the interpreter has finished processing
 */
export async function runInterpreter(assessmentId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      const projectRoot = process.cwd();
      const pythonExecutablePath = "/usr/local/bin/python3.12"; // Use the correct path from 'which'
      const srcPath = path.join(projectRoot, 'src'); // Path to src directory

      // Prepare the environment for the child process
      const env = { ...process.env };
      // Remove potentially interfering proxy environment variables
      const proxyVars = [
        'HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY',
        'http_proxy', 'https_proxy', 'no_proxy',
        'OPENAI_PROXY', 'OPENAI_HTTP_PROXY', 'OPENAI_HTTPS_PROXY'
      ];

      proxyVars.forEach(varName => {
        delete env[varName];
      });

      // Ensure the Python script can find modules relative to the project root
      // Note: Using projectRoot for PYTHONPATH, assuming imports are relative to root (e.g., src.llm_interpreter)
      env.PYTHONPATH = projectRoot;

      console.log(`Running interpreter for assessment: ${assessmentId}`);

      const pythonProcess = spawn(
        pythonExecutablePath,
        ['-m', 'src.llm_interpreter.run_single', assessmentId], // Use -m to run module
        {
          cwd: projectRoot, // Still run from project root
          env: env, // Pass the cleaned environment
        }
      );

      let stdoutData = '';
      let stderrData = '';

      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
        // Optional: Consider making logging less verbose or conditional later
        console.log(`Interpreter stdout: ${data.toString().trim()}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
        console.error(`Interpreter stderr: ${data.toString().trim()}`);
      });

      pythonProcess.on('close', (code) => {
        console.log(`Interpreter process exited with code ${code}`);
        if (code === 0) {
          console.log('Interpreter completed successfully (based on exit code)');
          // Note: The Python script itself now handles Supabase updates & output printing
          resolve(true);
        } else {
          console.error(`Interpreter failed with code ${code}. Full error output above.`);
          // Consider updating assessment status to 'failed' here as a fallback?
          resolve(false); // Resolve false on failure, don't reject the API call
        }
      });

      pythonProcess.on('error', (error) => {
        console.error(`Failed to start interpreter process: ${error.message}`, error);
        // Update assessment status to 'failed' here?
        reject(error); // Reject the promise on spawn error
      });
    } catch (error) {
      console.error('Synchronous error setting up interpreter spawn:', error);
      reject(error);
    }
  });
}

/**
 * Polls the assessment status until it's processed or times out
 * 
 * @param assessmentId The ID of the assessment to poll
 * @param maxAttempts Maximum number of polling attempts
 * @param intervalMs Interval between polling attempts in milliseconds
 * @returns The processed assessment data or null if timed out
 */
export async function pollAssessmentStatus(
  assessmentId: string, 
  maxAttempts = 20, 
  intervalMs = 1000
) {
  let attempts = 0;
  
  // For mock data, simulate processing delay and return mock results
  if (assessmentId.startsWith('mock-')) {
    console.log(`Using mock data for assessment ${assessmentId}`);
    
    // Wait a bit to simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create mock assessment data
    return {
      id: assessmentId,
      llm_status: 'success',
      summary: 'This is a mock assessment summary for demonstration purposes.',
      source_url: 'https://example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  
  // Real polling logic for actual Supabase data
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const assessment = await getAssessmentById(assessmentId);
      
      // If no assessment found but we have a mock ID, create mock data
      if (!assessment && assessmentId.startsWith('mock-')) {
        return {
          id: assessmentId,
          llm_status: 'success',
          summary: 'This is a mock assessment summary for demonstration purposes.',
          source_url: 'https://example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      // Check if the assessment has been processed
      if (assessment && assessment.llm_status === 'success') {
        console.log(`Assessment ${assessmentId} processed successfully after ${attempts} attempts`);
        return assessment;
      }
      
      // Check if the assessment has failed
      if (assessment && assessment.llm_status === 'failed') {
        console.error(`Assessment ${assessmentId} processing failed`);
        return assessment;
      }
      
      // Check if this is a partial success
      if (assessment && assessment.llm_status === 'partial') {
        console.warn(`Assessment ${assessmentId} processed with partial success`);
        return assessment;
      }
      
      // Wait for the next polling interval
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error) {
      console.error(`Error polling assessment status: ${error}`);
      
      // If we have errors but we're using a mock ID, return mock data
      if (assessmentId.startsWith('mock-')) {
        console.log(`Falling back to mock data for assessment ${assessmentId}`);
        return {
          id: assessmentId,
          llm_status: 'success',
          summary: 'This is a mock assessment summary for demonstration purposes.',
          source_url: 'https://example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      // Continue polling despite errors
    }
  }
  
  console.warn(`Polling timed out for assessment ${assessmentId} after ${maxAttempts} attempts`);
  
  // If we timed out but we're using a mock ID, return mock data anyway
  if (assessmentId.startsWith('mock-')) {
    console.log(`Timed out but using mock data for assessment ${assessmentId}`);
    return {
      id: assessmentId,
      llm_status: 'success',
      summary: 'This is a mock assessment summary for demonstration purposes.',
      source_url: 'https://example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  
  return null;
}
