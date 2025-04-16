import React, { createContext, useReducer, useContext, ReactNode, Dispatch } from 'react';

// Example global state type
export interface AppState {
  user?: string;
  // Add more global state fields as needed
}

const initialState: AppState = {};

type Action = { type: 'SET_USER'; payload: string };

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
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
