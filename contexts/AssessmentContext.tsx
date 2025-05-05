"use client";

import React, { createContext, useContext, useReducer, ReactNode, Dispatch, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { toast } from 'sonner'; // Import toast

// Define the shape of your product data (assuming it exists elsewhere or define basic structure)
// Example - Replace with your actual Product type
export interface Product {
  id: string;
  assessment_id: string;
  name: string;
  category?: string;
  description?: string;
  estimated_hs_code?: string;
  confirmed_hs_code?: string;
  confidence_score?: number;
  classification_confidence?: number;
  materials?: string[];
  parent_id?: string;
  variants?: string[];
  created_at: string;
  updated_at: string;
  // --- Fields for UX --- 
  user_hidden?: boolean;
  source?: 'llm' | 'manual';
  isEditing?: boolean; // UI state flag
  group_id?: string | null;
}

// Add Certification type (basic example)
interface Certification {
  id: string;
  assessment_id: string;
  name: string;
  required_for?: string[]; // Optional array of country codes/names
  // Add other relevant fields
}

// Add Group type
export interface Group {
  id: string;
  name: string;
  productIds: string[];
}

// Define possible assessment statuses
export type AssessmentStatus = 'idle' | 'pending_scrape' | 'scraping' | 'pending_analysis' | 'analyzing' | 'completed' | 'failed' | null;

// --- State Definition --- 
interface AssessmentState {
  currentStep: number; // 1-6
  isLoading: boolean; // For API calls / analysis step
  error: string | null;
  assessmentId: string | null;
  assessmentStatus: AssessmentStatus; // Track the backend status
  pollingIntervalId: number | null; // Store interval ID for cleanup
  companyName: string | null;
  role: string | null;
  websiteUrl: string | null;
  fullName: string;
  roleInBusiness: 'Owner' | 'Manager' | 'Export Lead' | 'Other' | '';
  // Step 2 data
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  productPdfPath?: string;   // Path from Supabase Storage
  companyProfilePath?: string; // Path from Supabase Storage
  // Step 3 data
  exportIntent?: string; // Why exporting?
  exportExperience?: string; // Previous experience details
  exportVisionOptions: string[]; // Selected checkbox reasons
  exportVisionOtherText: string; // Custom text reason
  // Step 4 data
  products: Product[]; 
  groups: Group[];
  // Step 5 data
  targetMarkets: string[]; // e.g., ['USA', 'UAE', 'SADC Region']
  selectedMarkets: string[]; // Add state for selected market codes
  socialLinks: Record<string, string | null> | null;
  certifications: Array<{ name: string; required_for?: string[] }> | null;
  // Step 6 data
  // Data from analysis
  companySummary?: string;
  summary?: string;
  fallbackReason?: string;
  confidence_score: number | null; // Added overall confidence score
}

// --- Action Types --- (using useReducer)
type Action = 
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ASSESSMENT_ID'; payload: string | null }
  | { type: 'UPDATE_FIELD'; payload: { field: keyof AssessmentState; value: any } }
  | { type: 'LOAD_PRODUCTS'; payload: Product[] }
  | { type: 'UPDATE_PRODUCT'; payload: { productId: string; updates: Partial<Product> } }
  | { type: 'ADD_PRODUCT_STATE'; payload: Product } // Only updates local state
  | { type: 'SET_PRODUCT_HIDDEN'; payload: { productId: string; hidden: boolean } }
  | { type: 'UPDATE_PRODUCT_HS_CODE'; payload: { productId: string; hsCode: string } }
  | { type: 'ADD_PRODUCT'; payload: { name: string; category?: string } } // Kept for potential optimistic UI later
  | { type: 'UPDATE_PRODUCT_STATE'; payload: Product } // Replaces a product object in state
  | { type: 'TOGGLE_MARKET'; payload: string } // Adds/Removes a market code
  | { 
      type: 'LOAD_ANALYSIS_RESULTS'; 
      payload: { 
        products: Product[]; 
        summary?: string; 
        certifications?: Array<{ name: string; required_for?: string[] }> | null; 
        confidence_score?: number | null; // Added confidence score to payload
      }
    }
  | { type: 'SET_ASSESSMENT_STATUS'; payload: AssessmentStatus } // Update status from polling
  | { type: 'START_POLLING'; payload: { assessmentId: string } } // Start polling
  | { type: 'STOP_POLLING' } // Stop polling
  | { type: 'TOGGLE_EXPORT_VISION_OPTION'; payload: string } // Toggle checkbox option
  | { type: 'UPDATE_EXPORT_VISION_TEXT'; payload: string }
  | { type: 'LOAD_GROUPS'; payload: Group[] }
  | { type: 'UPDATE_PRODUCT_GROUP'; payload: { productId: string; groupId: string | null } }
  | { type: 'SET_DATA'; payload: { summary: string; products: Product[]; certifications: Array<{ name: string; required_for?: string[] }> | null; fallbackReason: string } };

// --- Initial State --- 
const initialState: AssessmentState = {
  currentStep: 1, 
  isLoading: false,
  error: null,
  assessmentId: null,
  assessmentStatus: null,
  pollingIntervalId: null,
  companyName: null,
  role: null,
  websiteUrl: null,
  fullName: '', // Initialize fullName
  roleInBusiness: '', // Initialize roleInBusiness
  facebookUrl: '',
  instagramUrl: '',
  linkedinUrl: '',
  exportIntent: '',
  products: [], // Initialize products array
  groups: [],   // Initialize groups array
  targetMarkets: [], // Initialize targetMarkets array
  selectedMarkets: [], // Initialize selectedMarkets array
  socialLinks: null,
  certifications: null,
  exportVisionOptions: [], // Initialize as empty array
  exportVisionOtherText: '', // Initialize as empty string
  summary: undefined,
  fallbackReason: undefined,
  confidence_score: null, // Initialize confidence_score
};

// --- Reducer Function ---
function assessmentReducer(state: AssessmentState, action: Action): AssessmentState {
  console.log('Reducer Action:', action.type, 'Payload:', 'payload' in action ? action.payload : 'N/A'); // Add this line
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }; // Reset loading on error
    case 'SET_ASSESSMENT_ID':
      return { ...state, assessmentId: action.payload };
    case 'UPDATE_FIELD':
      return { ...state, [action.payload.field]: action.payload.value };
    case 'LOAD_PRODUCTS':
      return {
        ...state,
        products: action.payload.map((p: any) => ({
          ...p,
          id: p.id || crypto.randomUUID(),
          source: p.source || 'llm',
          group_id: p.group_id ?? null,
        })),
      };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.productId ? { ...p, ...action.payload.updates } : p
        ),
      };
    case 'ADD_PRODUCT_STATE':
        // Ensure we don't add duplicates if optimistic UI was used then real data comes
        // Although in the current flow, ADD_PRODUCT isn't used before this.
        const productExists = state.products.some(p => p.id === action.payload.id);
        if (productExists) {
            // Optionally update the existing one if needed, or just ignore
            console.warn(`ADD_PRODUCT_STATE: Product with ID ${action.payload.id} already exists. Skipping.`);
            return state;
        }
        return {
            ...state,
            products: [...state.products, action.payload],
        };
    case 'SET_PRODUCT_HIDDEN':
         return {
            ...state,
            products: state.products.map(p =>
              p.id === action.payload.productId ? { ...p, user_hidden: action.payload.hidden } : p
            ),
          };
    case 'UPDATE_PRODUCT_HS_CODE':
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.productId
            ? { ...product, confirmed_hs_code: action.payload.hsCode }
            : product
        ),
      };
    case 'ADD_PRODUCT':
      const newProduct: Product = {
        // Note: This ID is temporary and client-side only for React keys.
        // Real ID should be assigned by the backend persistence layer.
        id: crypto.randomUUID(), 
        assessment_id: state.assessmentId ?? '', // Get assessment_id from state
        name: action.payload.name,
        category: action.payload.category,
        // Initialize other fields as needed
        estimated_hs_code: undefined,
        confirmed_hs_code: undefined,
        confidence_score: undefined, // Add other required fields as undefined or default
        description: undefined,
        user_hidden: false,
        created_at: new Date().toISOString(), // Add current timestamp
        updated_at: new Date().toISOString(), // Add current timestamp
      };
      return {
        ...state,
        products: [...state.products, newProduct],
      };
    case 'UPDATE_PRODUCT_STATE':
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.id
            ? { ...product, ...action.payload } // Replace with updated product data
            : product
        ),
      };
    case 'TOGGLE_MARKET':
      const marketCode = action.payload;
      const currentSelection = state.selectedMarkets || [];
      const isSelected = currentSelection.includes(marketCode);
      let newSelection;
      if (isSelected) {
        newSelection = currentSelection.filter(code => code !== marketCode);
      } else {
        // Limit logic primarily handled in component, reducer just adds
        newSelection = [...currentSelection, marketCode];
      }
      return {
        ...state,
        selectedMarkets: newSelection,
      };
    case 'LOAD_ANALYSIS_RESULTS':
      return {
        ...state,
        products: action.payload.products || state.products, // Keep existing if payload is empty
        summary: action.payload.summary || state.summary, // Keep existing if payload is empty
        certifications: action.payload.certifications === undefined ? state.certifications : action.payload.certifications, // Handle null explicitly
        confidence_score: action.payload.confidence_score === undefined ? state.confidence_score : action.payload.confidence_score, // Add confidence score handling
        isLoading: false, // Assuming loading finishes when results are loaded
        error: null, // Clear any previous error
      };
    case 'SET_ASSESSMENT_STATUS':
      // If status is completed or failed, stop loading (unless already stopped by failed)
      const shouldStopLoading = action.payload === 'completed' || action.payload === 'failed';
      return { 
        ...state, 
        assessmentStatus: action.payload,
        isLoading: shouldStopLoading ? false : state.isLoading
      };
    case 'START_POLLING': // Action to signify polling should start (triggered by provider)
      // We don't directly set the intervalId in the reducer, the provider effect handles it
      return { ...state, assessmentId: action.payload.assessmentId, isLoading: true, error: null, assessmentStatus: 'pending_scrape' };
    case 'STOP_POLLING': // Action to signify polling should stop (triggered by provider)
      // Provider effect will clear the actual interval
      // We might stop loading depending on the *reason* for stopping (e.g., completion vs. manual navigation)
      // Let SET_ASSESSMENT_STATUS handle loading for completion/failure.
      return { ...state, pollingIntervalId: null }; 
    case 'TOGGLE_EXPORT_VISION_OPTION':
      const option = action.payload;
      const currentOptions = state.exportVisionOptions;
      const newOptions = currentOptions.includes(option)
        ? currentOptions.filter(item => item !== option)
        : [...currentOptions, option];
      return { ...state, exportVisionOptions: newOptions };
    case 'UPDATE_EXPORT_VISION_TEXT':
        return { ...state, exportVisionOtherText: action.payload };
    case 'LOAD_GROUPS':
      return { ...state, groups: action.payload };
    case 'UPDATE_PRODUCT_GROUP':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.productId
            ? { ...p, group_id: action.payload.groupId }
            : p
        ),
      };
    case 'SET_DATA':
      return {
        ...state,
        summary: action.payload.summary,
        products: action.payload.products,
        certifications: action.payload.certifications,
        fallbackReason: action.payload.fallbackReason,
      };
    default:
      return state;
  }
}

// --- Context Definition ---
interface AssessmentContextProps {
  state: AssessmentState;
  dispatch: React.Dispatch<Action>;
  // --- Helper Functions ---
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  // --- Async Actions ---
  triggerAnalysis: () => Promise<void>; // Placeholder for now
  finishAssessment: () => Promise<void>; // Add finishAssessment action
  loadGroups: () => Promise<void>;
  // Placeholder for async actions - will be implemented later
  // Example:
  // triggerAnalysis: () => Promise<void>;
  // addProduct: (newProductData: Omit<Product, 'id' | 'assessment_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const AssessmentContext = createContext<AssessmentContextProps | undefined>(undefined);

// --- Provider Component ---
interface AssessmentProviderProps {
  children: ReactNode;
}

export function AssessmentProvider({ children }: AssessmentProviderProps) {
  const [state, dispatch] = useReducer(assessmentReducer, initialState);
  const router = useRouter(); // Initialize router

  const pollingIntervalIdRef = useRef<NodeJS.Timeout | null>(null); // Use NodeJS.Timeout for Node.js/Next.js
  const pollingCountRef = useRef<number>(0);

  // --- Polling Functions (Memoized) ---
  const stopPolling = useCallback(() => {
    if (pollingIntervalIdRef.current) {
      clearInterval(pollingIntervalIdRef.current);
      pollingIntervalIdRef.current = null;
      console.log('Polling stopped.');
      // Update state to reflect polling stopped if needed
      // dispatch({ type: 'STOP_POLLING' }); // Dispatching here might be redundant if useEffect cleanup handles it
    }
  }, [pollingIntervalIdRef]); // No external dependencies needed if it only uses refs/dispatch

  const checkStatus = useCallback(async () => {
    const currentAssessmentId = state.assessmentId; // Capture ID at the time of check
    if (!currentAssessmentId) {
      console.log('checkStatus called without assessmentId, stopping.');
      stopPolling();
      return;
    }
    console.log(`Polling: Checking status for ${currentAssessmentId}...`);
    try {
      const response = await fetch(`/api/assessment/${currentAssessmentId}/status`);
      if (!response.ok) {
        // Handle non-2xx responses (e.g., 404, 500)
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error(`Polling Error (${response.status}):`, errorData.error || response.statusText);
        dispatch({ type: 'SET_ASSESSMENT_STATUS', payload: 'failed' }); // Set status to failed on error
        dispatch({ type: 'SET_ERROR', payload: `Polling failed: ${errorData.error || response.statusText}` });
        stopPolling();
        return;
      }
      const data: { status: AssessmentStatus } = await response.json();
      console.log(`Polling: Received status: ${data.status}`);
      dispatch({ type: 'SET_ASSESSMENT_STATUS', payload: data.status });

      // If assessment is completed or failed, stop polling
      if (data.status === 'completed' || data.status === 'failed') {
        stopPolling();
        if (data.status === 'completed') {
          // Fetch full assessment data including products, not just status
          try {
            const resultsRes = await fetch(`/api/assessment/${currentAssessmentId}`);
            if (resultsRes.ok) {
              const fullAssessmentData = await resultsRes.json();
              // Assuming the API returns an object like { assessment: { ..., products: [...], certifications: [...] } }
              // Adjust the property access based on the actual API response structure
              const assessmentDetails = fullAssessmentData.assessment || fullAssessmentData;

              // Dispatch SET_DATA with the relevant fields
              dispatch({
                type: 'SET_DATA',
                payload: {
                  summary: assessmentDetails.summary,
                  // Use capitalized names matching the API response from Supabase relation
                  products: assessmentDetails.Products || [], 
                  certifications: assessmentDetails.Certifications || [],
                  fallbackReason: assessmentDetails.fallback_reason,
                  // Add other fields from assessmentDetails if needed by the state
                }
              });
            } else {
              console.error(`Failed to fetch full assessment results: ${resultsRes.status} ${resultsRes.statusText}`);
              // Handle error - maybe set an error state?
            }
          } catch (err) {
            console.error('Error fetching/processing full assessment results:', err);
            // Handle error
          }
          console.log('Assessment completed, moving to next step.');
          goToNextStep(); // Move to Step 4
        } else {
           console.log('Assessment failed.');
           // Error should already be set by the reducer/fetch error handling
        }
      }
    } catch (error: any) {
      console.error('Polling: Network or unexpected error:', error);
      dispatch({ type: 'SET_ASSESSMENT_STATUS', payload: 'failed' });
      dispatch({ type: 'SET_ERROR', payload: `Polling error: ${error.message}` });
      stopPolling();
    }
  }, [state.assessmentId, dispatch, stopPolling]); // Dependencies: id, dispatch, stopPolling

  // --- Effects ---

  // Effect to start/stop polling based on assessment ID and step
  useEffect(() => {
    if (state.assessmentId && state.currentStep === 3) {
      console.log(`Polling started for assessment ID: ${state.assessmentId}`);
      // Reset attempt counter
      pollingCountRef.current = 0;
      stopPolling(); // Clear any existing interval before starting a new one
      checkStatus(); // Initial check immediately
      // Poll every 5 seconds with a max attempts fallback
      pollingIntervalIdRef.current = setInterval(() => {
        pollingCountRef.current += 1;
        if (pollingCountRef.current >= 6) {
          console.warn(`Polling: max attempts reached (${pollingCountRef.current}), stopping and advancing step.`);
          clearInterval(pollingIntervalIdRef.current!);
          pollingIntervalIdRef.current = null;
          // Advance to next step to avoid infinite loading
          dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
        } else {
          checkStatus();
        }
      }, 5000);

      // Cleanup function
      return () => {
        stopPolling();
      };
    }
  }, [state.assessmentId, state.currentStep, checkStatus, stopPolling]);

  // Effect to handle step changes based on assessment status
  useEffect(() => {
    // Logic to move to next step based on assessment status
  }, [state.assessmentStatus]);

  const goToNextStep = () => {
    // Allow going up to step 7 (Summary)
    if (state.currentStep < 7) { 
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    }
    // Add validation logic here if needed before proceeding
  };

  const goToPreviousStep = () => {
    if (state.currentStep > 1) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 });
    }
  };

  // --- Async Actions Implementation (Placeholders) ---
  const triggerAnalysis = async () => {
    console.log("Attempting to trigger analysis...");
    // 1. Set loading state
    dispatch({ type: 'SET_LOADING', payload: true });
    // 2. Get necessary data from state (e.g., websiteUrl, etc.)
    const { websiteUrl, facebookUrl, instagramUrl, linkedinUrl, productPdfPath, companyProfilePath } = state;
    
    try {
        // 3. Make API call to backend endpoint (e.g., /api/assessments/start) 
        // This endpoint should create the Assessment row and trigger background processing
        const response = await fetch('/api/assessment/start', { // **NEW ENDPOINT - Needs to be created**
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                websiteUrl, 
                // Include other fields like socials, file paths if needed by backend
            }),
        });

        if (!response.ok) {
            throw new Error(`Analysis trigger failed: ${response.statusText}`);
        }

        const data = await response.json();
        const newAssessmentId = data.assessmentId; // Assuming API returns the ID

        if (!newAssessmentId) {
            throw new Error('Assessment ID not returned from API');
        }

        // 4. Store the assessment ID
        dispatch({ type: 'SET_ASSESSMENT_ID', payload: newAssessmentId });

        // 5. Move to the loading step
        dispatch({ type: 'SET_STEP', payload: 3 }); 

        // 6. Start polling or listen for updates (Simplified for now - just log)
        console.log(`Analysis started for assessment ID: ${newAssessmentId}. Polling/updates needed.`);
        // Actual polling/update logic will be added later, likely involving checking
        // the assessment status via its ID until llm_status is 'success' or 'error'.
        // For now, we immediately stop loading for demo purposes.
        // dispatch({ type: 'SET_LOADING', payload: false }); // TEMP

    } catch (error: any) {
        console.error("Error triggering analysis:", error);
        dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to start analysis.' });
        // Don't proceed to step 3 on error
    }
    // Note: SET_LOADING(false) might be dispatched later when polling confirms completion/error
  };

  // --- Finish Assessment Action ---
  const finishAssessment = async () => {
    const { assessmentId } = state;
    if (!assessmentId) {
      toast.error('Cannot finish: Assessment ID is missing.');
      console.error('Attempted to finish assessment without an ID.');
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await fetch(`/api/assessment/${assessmentId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // No body needed unless API requires specific confirmation
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to complete assessment (status ${response.status})`);
      }

      console.log(`Assessment ${assessmentId} successfully marked as complete.`);
      toast.success('Great work! Your readiness snapshot is complete.');
      
      // Navigate to dashboard
      router.push('/dashboard'); // Adjust path if needed

      // Optionally reset state or parts of it if needed after finishing
      // dispatch({ type: 'RESET_STATE' }); // Example: Needs implementation

    } catch (error: any) {
      console.error('Error finishing assessment:', error);
      toast.error(`Failed to finish assessment: ${error.message}`);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to finish assessment.' });
    } finally {
      // Ensure loading is always set to false, even on navigation or error
       dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadGroups = async () => {
    if (!state.assessmentId) return;
    const res = await fetch(`/api/classification/groups?assessment_id=${state.assessmentId}`);
    const data: Group[] = await res.json();
    dispatch({ type: 'LOAD_GROUPS', payload: data });
  };

  const value = {
    state,
    dispatch,
    goToNextStep, 
    goToPreviousStep,
    triggerAnalysis, // Provide the async function
    finishAssessment, // Provide the finish function
    loadGroups,
  };

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
}

// --- Custom Hook ---
export function useAssessmentContext() {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error('useAssessmentContext must be used within an AssessmentProvider');
  }
  return context;
}
