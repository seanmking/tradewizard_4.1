import React, { createContext, useReducer, useContext, ReactNode, Dispatch } from 'react';

// Example global state type
export interface AppState {
  user?: {
    name: string;
    email: string;
    url: string;
    assessmentId?: string;
  };
  extractedInfo?: any;
  // Add more global state fields as needed
}

const initialState: AppState = {};

type Action =
  | { type: 'SET_USER'; payload: { name: string; email: string; url: string; assessmentId?: string } }
  | { type: 'UPDATE_ASSESSMENT_ID'; payload: string }
  | { type: 'SET_EXTRACTED_INFO'; payload: any };

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'UPDATE_ASSESSMENT_ID':
      return { ...state, user: state.user ? { ...state.user, assessmentId: action.payload } : undefined };
    case 'SET_EXTRACTED_INFO':
      return { ...state, extractedInfo: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<Action>;
}>({ state: initialState, dispatch: () => undefined });

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
