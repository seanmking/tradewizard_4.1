import React, { createContext, useReducer, useContext, ReactNode, Dispatch } from 'react';

// Types
export type Product = {
  id: string;
  name: string;
  category?: string;
  estimated_hs_code?: string;
};

export type Certification = {
  name: string;
  required_for: string[];
  cost?: string;
  timeline?: string;
  confidence?: number;
};

interface AssessmentState {
  summary: string;
  products: Product[];
  certifications: Certification[];
  fallbackReason: string | null;
  confirmedProducts: Product[];
  showCompliance: boolean;
}

type AssessmentAction =
  | { type: 'SET_DATA'; payload: Partial<Pick<AssessmentState, 'summary' | 'products' | 'certifications' | 'fallbackReason'>> }
  | { type: 'CONFIRM_PRODUCTS'; payload: Product[] }
  | { type: 'SHOW_COMPLIANCE'; payload: boolean };

const initialState: AssessmentState = {
  summary: '',
  products: [],
  certifications: [],
  fallbackReason: null,
  confirmedProducts: [],
  showCompliance: false,
};

function assessmentReducer(state: AssessmentState, action: AssessmentAction): AssessmentState {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, ...action.payload };
    case 'CONFIRM_PRODUCTS':
      return { ...state, confirmedProducts: action.payload };
    case 'SHOW_COMPLIANCE':
      return { ...state, showCompliance: action.payload };
    default:
      return state;
  }
}

const AssessmentContext = createContext<{
  state: AssessmentState;
  dispatch: Dispatch<AssessmentAction>;
}>({ state: initialState, dispatch: () => null });

export const AssessmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(assessmentReducer, initialState);
  return (
    <AssessmentContext.Provider value={{ state, dispatch }}>
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = () => useContext(AssessmentContext);
