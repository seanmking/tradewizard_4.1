// lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client, ensuring environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseKey) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create a mock client for development if no valid URL is provided
const createMockClient = () => {
  console.warn('Using mock Supabase client. Set up environment variables for full functionality.');
  
  // Generate a random UUID for mock IDs
  const generateMockId = () => {
    return 'mock-' + Math.random().toString(36).substring(2, 15);
  };
  
  // Define types for our mock data
  type MockRecord = Record<string, any>;
  type MockData = {
    [key: string]: MockRecord[];
  };
  
  // Store mock data for development
  const mockData: MockData = {
    Assessments: [],
    Products: [],
    Certifications: []
  };
  
  return {
    from: (tableName: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: () => {
            // For single record lookup
            if (tableName in mockData) {
              const record = mockData[tableName].find((item: MockRecord) => item[column] === value);
              return Promise.resolve({ data: record || null, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          },
          execute: () => {
            // For multiple records lookup
            if (tableName in mockData) {
              const records = mockData[tableName].filter((item: MockRecord) => item[column] === value);
              return Promise.resolve({ data: records, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          }
        }),
        execute: () => {
          // For fetching all records
          if (tableName in mockData) {
            return Promise.resolve({ data: mockData[tableName], error: null });
          }
          return Promise.resolve({ data: [], error: null });
        }
      }),
      insert: (data: any) => ({
        select: (columns?: string) => ({
          single: () => {
            // Generate a mock ID and add to mock data
            const mockId = generateMockId();
            const newRecord = { ...data, id: mockId };
            
            if (tableName in mockData) {
              mockData[tableName].push(newRecord);
            }
            
            return Promise.resolve({ data: newRecord, error: null });
          }
        }),
        execute: () => {
          // For batch inserts
          const records = Array.isArray(data) ? data : [data];
          const newRecords = records.map((record: MockRecord) => ({
            ...record,
            id: record.id || generateMockId()
          }));
          
          if (tableName in mockData) {
            mockData[tableName].push(...newRecords);
          }
          
          return Promise.resolve({ data: newRecords, error: null });
        }
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          execute: () => {
            // Update a record
            if (tableName in mockData) {
              const index = mockData[tableName].findIndex((item: MockRecord) => item[column] === value);
              if (index !== -1) {
                mockData[tableName][index] = { ...mockData[tableName][index], ...data };
              }
            }
            return Promise.resolve({ data: null, error: null });
          }
        }),
        execute: () => Promise.resolve({ data: null, error: null })
      }),
      upsert: (data: any) => ({
        execute: () => {
          // For upsert operations
          const records = Array.isArray(data) ? data : [data];
          const newRecords = records.map((record: MockRecord) => ({
            ...record,
            id: record.id || generateMockId()
          }));
          
          if (tableName in mockData) {
            // For each record, update if exists or insert if not
            newRecords.forEach((record: MockRecord) => {
              if (record.id) {
                const index = mockData[tableName].findIndex((item: MockRecord) => item.id === record.id);
                if (index !== -1) {
                  mockData[tableName][index] = { ...mockData[tableName][index], ...record };
                } else {
                  mockData[tableName].push(record);
                }
              } else {
                mockData[tableName].push({ ...record, id: generateMockId() });
              }
            });
          }
          
          return Promise.resolve({ data: newRecords, error: null });
        }
      })
    })
  };
};

// Singleton pattern for Supabase clients
let _supabase: SupabaseClient | any = null;
let _supabaseAdmin: SupabaseClient | any = null;

// Get the client for browser usage (limited permissions)
export const supabase = (): SupabaseClient | any => {
  if (_supabase) return _supabase;
  
  _supabase = supabaseUrl && supabaseKey 
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          storageKey: 'supabase-auth',
        }
      })
    : createMockClient() as any;
    
  return _supabase;
};

// Get the client for server-side operations (elevated permissions)
export const supabaseAdmin = (): SupabaseClient | any => {
  if (_supabaseAdmin) return _supabaseAdmin;
  
  _supabaseAdmin = supabaseUrl && serviceRoleKey 
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          storageKey: 'supabase-admin-auth',
        }
      })
    : createMockClient() as any;
    
  return _supabaseAdmin;
};

// Helper function to generate UUID
export function generateUUID() {
  // Use crypto.randomUUID() if available (modern browsers, Node.js)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Create a new assessment record in Supabase
export async function createAssessment({ url, rawContent }: { url: string, rawContent: string }) {
  try {
    // Create a fallback mock assessment in case of errors
    const mockAssessment = {
      id: 'mock-' + Math.random().toString(36).substring(2, 15),
      source_url: url,
      raw_content: rawContent,
      llm_ready: true,
      llm_status: 'processing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    try {
      // Generate a UUID for the id field
      const assessmentId = generateUUID();
      
      const { data, error } = await supabaseAdmin()
        .from('Assessments')
        .insert({
          id: assessmentId, // Explicitly set the ID
          source_url: url,
          raw_content: rawContent,
          llm_ready: true,
          trigger_crawler: true, // Ensure crawler is triggered initially
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase error, using mock assessment:', error);
        return mockAssessment;
      }
      
      return data;
    } catch (dbError) {
      console.warn('Database error, using mock assessment:', dbError);
      return mockAssessment;
    }
  } catch (error) {
    console.error('Error creating assessment:', error);
    throw error;
  }
}

// Fetch assessment by ID
export async function getAssessmentById(id: string) {
  // For mock assessments, return mock assessment data
  if (id.startsWith('mock-')) {
    console.log(`Using mock assessment data for ID: ${id}`);
    return {
      id: id,
      source_url: 'https://example.com',
      raw_content: JSON.stringify({
        url: 'https://example.com',
        title: 'Example Website',
        description: 'This is a mock assessment for demonstration purposes.',
        scrapedAt: new Date().toISOString()
      }),
      llm_ready: true,
      llm_status: 'success',
      summary: 'This is a mock assessment summary for demonstration purposes.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  
  // For real assessments, query the database
  try {
    const { data, error } = await supabase()
      .from('Assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // If we get an error but have a mock ID, return mock data as fallback
      if (id.startsWith('mock-')) {
        return {
          id: id,
          source_url: 'https://example.com',
          raw_content: JSON.stringify({
            url: 'https://example.com',
            title: 'Example Website',
            description: 'This is a mock assessment for demonstration purposes.',
            scrapedAt: new Date().toISOString()
          }),
          llm_ready: true,
          llm_status: 'success',
          summary: 'This is a mock assessment summary for demonstration purposes.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching assessment:', error);
    
    // If we encounter an error but have a mock ID, return mock data
    if (id.startsWith('mock-')) {
      return {
        id: id,
        source_url: 'https://example.com',
        raw_content: JSON.stringify({
          url: 'https://example.com',
          title: 'Example Website',
          description: 'This is a mock assessment for demonstration purposes.',
          scrapedAt: new Date().toISOString()
        }),
        llm_ready: true,
        llm_status: 'success',
        summary: 'This is a mock assessment summary for demonstration purposes.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    
    throw error;
  }
}

// Fetch products for an assessment
export async function getProductsByAssessmentId(assessmentId: string) {
  // For mock assessments, return mock product data
  if (assessmentId.startsWith('mock-')) {
    console.log(`Using mock product data for assessment ${assessmentId}`);
    return [
      {
        id: `mock-product-1-${assessmentId}`,
        assessment_id: assessmentId,
        name: 'Frozen Corndogs',
        description: 'Premium quality frozen corndogs made with real beef and pork.',
        category: 'Frozen Foods',
        estimated_hs_code: '1601.00',
        classification: 'Food Products',
        created_at: new Date().toISOString()
      },
      {
        id: `mock-product-2-${assessmentId}`,
        assessment_id: assessmentId,
        name: 'Ready-to-eat Meals',
        description: 'Convenient microwavable meals with various flavor options.',
        category: 'Prepared Foods',
        estimated_hs_code: '2106.90',
        classification: 'Food Products',
        created_at: new Date().toISOString()
      }
    ];
  }
  
  // For real assessments, query the database
  try {
    const { data, error } = await supabase()
      .from('Products')
      .select('*')
      .eq('assessment_id', assessmentId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    // If there's an error but we have a mock ID, return mock data
    if (assessmentId.startsWith('mock-')) {
      return [
        {
          id: `mock-product-1-${assessmentId}`,
          assessment_id: assessmentId,
          name: 'Frozen Corndogs',
          description: 'Premium quality frozen corndogs made with real beef and pork.',
          category: 'Frozen Foods',
          estimated_hs_code: '1601.00',
          classification: 'Food Products',
          created_at: new Date().toISOString()
        },
        {
          id: `mock-product-2-${assessmentId}`,
          assessment_id: assessmentId,
          name: 'Ready-to-eat Meals',
          description: 'Convenient microwavable meals with various flavor options.',
          category: 'Prepared Foods',
          estimated_hs_code: '2106.90',
          classification: 'Food Products',
          created_at: new Date().toISOString()
        }
      ];
    }
    return [];
  }
}

// Fetch certifications for an assessment
export async function getCertificationsByAssessmentId(assessmentId: string) {
  // For mock assessments, return mock certification data
  if (assessmentId.startsWith('mock-')) {
    console.log(`Using mock certification data for assessment ${assessmentId}`);
    return [
      {
        id: `mock-cert-1-${assessmentId}`,
        assessment_id: assessmentId,
        type: 'HACCP',
        required_for: ['UAE', 'UK'],
        estimated_cost: '$2,500 - $5,000',
        created_at: new Date().toISOString()
      },
      {
        id: `mock-cert-2-${assessmentId}`,
        assessment_id: assessmentId,
        type: 'Halal',
        required_for: ['UAE'],
        estimated_cost: '$1,000 - $3,000',
        created_at: new Date().toISOString()
      }
    ];
  }
  
  // For real assessments, query the database
  try {
    const { data, error } = await supabase()
      .from('Certifications')
      .select('*')
      .eq('assessment_id', assessmentId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching certifications:', error);
    // If there's an error but we have a mock ID, return mock data
    if (assessmentId.startsWith('mock-')) {
      return [
        {
          id: `mock-cert-1-${assessmentId}`,
          assessment_id: assessmentId,
          type: 'HACCP',
          required_for: ['UAE', 'UK'],
          estimated_cost: '$2,500 - $5,000',
          created_at: new Date().toISOString()
        },
        {
          id: `mock-cert-2-${assessmentId}`,
          assessment_id: assessmentId,
          type: 'Halal',
          required_for: ['UAE'],
          estimated_cost: '$1,000 - $3,000',
          created_at: new Date().toISOString()
        }
      ];
    }
    return [];
  }
}
