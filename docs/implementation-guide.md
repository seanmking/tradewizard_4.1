# TradeWizard 4.0 Implementation Guide

This document provides practical guidance for implementing TradeWizard 4.0, with step-by-step instructions and best practices to ensure a successful development process.

## Getting Started

### Prerequisites

Before beginning implementation, ensure you have the following:

- Node.js 18.x or later installed
- Git for version control
- A code editor (VS Code recommended)
- Access to the TradeWizard 4.1 GitHub repository

### Initial Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/seanmking/tradewizard_4.1.git
   cd tradewizard_4.1
   ```

2. Initialize a new Next.js project:
   ```bash
   npx create-next-app@latest . --typescript --tailwind --eslint
   ```
   
3. Confirm the configurations:
   - Use App Router: **No** (important - use Pages Router)
   - Use TailwindCSS: **Yes**
   - Use ESLint: **Yes**
   - Use src/ directory: **Yes**
   - Default import alias: **@/**

4. Install additional dependencies:
   ```bash
   npm install react-hook-form swr react-pdf @headlessui/react lucide-react
   ```

## Project Structure

Create the following directory structure within the `src` directory:

```
src/
├── components/
│   ├── common/          # Shared UI components
│   ├── layout/          # Three-panel layout components
│   ├── forms/           # Form components
│   ├── conversation/    # Conversation panel components
│   ├── context/         # Context panel components
│   └── navigation/      # Navigation panel components
├── contexts/            # React Context definitions
├── hooks/               # Custom React hooks
├── pages/               # Next.js pages and API routes
│   ├── api/             # API endpoints
│   └── [routes]/        # Page routes
├── services/            # Business logic services
│   ├── website-analysis/
│   ├── product/
│   ├── market/
│   ├── report/
│   └── conversation/
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── data/                # Static data
```

## Implementation Approach

The implementation will follow an incremental approach, with each phase building on the previous one. This ensures that we have working functionality at each step of development.

### Phase 1: Core Structure & Three-Panel Layout

#### Task 1: Project Setup

1. Initialize the basic Next.js project structure as described above
2. Configure ESLint and Prettier for code quality
3. Set up the basic TypeScript configurations
4. Create the initial directory structure

#### Task 2: Three-Panel Layout Implementation

1. Create the layout components:
   - `src/components/layout/ThreePanelLayout.tsx`: Main layout with three panels
   - `src/components/navigation/NavigationPanel.tsx`: Left navigation panel
   - `src/components/conversation/ConversationPanel.tsx`: Center conversation panel
   - `src/components/context/ContextPanel.tsx`: Right context panel

2. Implement responsive behavior:
   - Desktop: Full three-panel layout
   - Tablet: Two panels with toggle
   - Mobile: Single panel with navigation

3. Implement panel resizing and collapsing functionality

#### Task 3: Basic React Context Setup

1. Create the assessment context:
   - `src/contexts/AssessmentContext.tsx`: Main state for assessment flow
   - `src/contexts/UIContext.tsx`: UI state (panel visibility, current step, etc.)

2. Implement persistence with local storage:
   - `src/utils/storage.ts`: Utilities for loading/saving state

3. Create custom hooks for accessing context:
   - `src/hooks/useAssessment.ts`: Hook for assessment state
   - `src/hooks/useUI.ts`: Hook for UI state

### Phase 2: Website Analysis Implementation

#### Task 1: Website Analysis Page

1. Create the initial assessment page:
   - `src/pages/index.tsx`: Landing page with URL input
   - `src/pages/assessment/website-analysis.tsx`: Website analysis page

2. Implement the form for URL input:
   - `src/components/forms/WebsiteUrlForm.tsx`: URL input form
   - Validate URL format
   - Show loading state

#### Task 2: OpenAI Integration

1. Create the OpenAI service:
   - `src/services/website-analysis/openai-service.ts`: Service for OpenAI integration
   - `src/pages/api/analyze-website.ts`: API route for website analysis

2. Implement structured prompting:
   - Create clear business information extraction prompts
   - Define product detection prompts
   - Format results into structured data

#### Task 3: Results Display

1. Create components for displaying extraction results:
   - `src/components/website-analysis/ResultsDisplay.tsx`: Main results container
   - `src/components/website-analysis/BusinessInfoSection.tsx`: Business details
   - `src/components/website-analysis/ProductsList.tsx`: Extracted products

2. Implement verification interface:
   - Allow editing of extracted information
   - Provide confidence indicators
   - Enable manual additions

### Phase 3: Product Classification Implementation

#### Task 1: HS Code Database

1. Create the HS code data structure:
   - `src/data/hs-codes.ts`: HS code types and utilities
   - Import CSV data at build time

2. Implement search functionality:
   - `src/services/product/hs-search.ts`: Search utilities for HS codes
   - Keyword-based and hierarchical search

#### Task 2: Classification UI

1. Create the classification components:
   - `src/components/product/ClassificationView.tsx`: Main classification view
   - `src/components/product/HsCodeSelector.tsx`: Hierarchical selector
   - `src/components/product/ProductCard.tsx`: Product display with classification status

2. Implement the cascading selection interface:
   - Chapter selection (2-digit)
   - Heading selection (4-digit)
   - Subheading selection (6-digit)

#### Task 3: Product Management

1. Extend assessment context for product state:
   - Add product state to assessment context
   - Create product classification actions

2. Implement product persistence:
   - Save classification progress
   - Allow classification revision

### Phase 4: Market Assessment Implementation

(Similar detailed tasks for Market Assessment phase)

### Phase 5: Report Generation Implementation

(Similar detailed tasks for Report Generation phase)

## Best Practices

### TypeScript Usage

- Use strict typing for all components and functions
- Create comprehensive interfaces for data structures
- Leverage TypeScript's type inference where appropriate
- Avoid using `any` type
- Implement discriminated unions for complex state

```typescript
// Example of a well-typed component
interface ProductCardProps {
  product: Product;
  onSelect: (productId: string) => void;
  onEdit: (product: Product) => void;
  isSelected: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onSelect, 
  onEdit, 
  isSelected 
}) => {
  // Component implementation
};
```

### State Management

- Keep state normalized and flat
- Use context selectors to minimize re-renders
- Implement action creators for state updates
- Document state shape with comments
- Use React DevTools to monitor re-renders

```typescript
// Example of a context with reducer
export const AssessmentContext = createContext<{
  state: AssessmentState;
  dispatch: React.Dispatch<AssessmentAction>;
} | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [state, dispatch] = useReducer(assessmentReducer, initialState);
  
  // Load from local storage initially
  useEffect(() => {
    const savedState = localStorage.getItem('assessment');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: 'RESTORE_STATE', payload: parsedState });
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
  }, []);
  
  // Save to local storage on state changes
  useEffect(() => {
    localStorage.setItem('assessment', JSON.stringify(state));
  }, [state]);
  
  return (
    <AssessmentContext.Provider value={{ state, dispatch }}>
      {children}
    </AssessmentContext.Provider>
  );
};
```

### Component Design

- Follow single responsibility principle
- Implement presentational and container components
- Use composition over inheritance
- Leverage React's memoization where appropriate
- Keep components focused and small

### CSS and TailwindCSS

- Use consistent naming conventions
- Create utility classes for repeated patterns
- Use Tailwind's responsive prefixes consistently
- Implement a consistent color scheme
- Extract component classes for reusability

## Testing Strategy

### Component Testing

- Test component rendering and interactions
- Use React Testing Library for component tests
- Focus on user behavior, not implementation details
- Create test utility functions for common patterns

### Service Testing

- Unit test service functions
- Mock external dependencies
- Test error handling and edge cases
- Ensure type safety in tests

### Integration Testing

- Test critical user flows end-to-end
- Verify data persistence and state management
- Test API integrations with mock servers
- Confirm responsive behavior across devices

## Performance Considerations

- Implement lazy loading for large components
- Use React.memo for expensive render components
- Optimize context to prevent unnecessary re-renders
- Implement virtualization for long lists
- Monitor bundle size with analysis tools

## Conclusion

This implementation guide provides a structured approach to building TradeWizard 4.0. By following these guidelines and focusing on incremental development, we can ensure a high-quality, maintainable application that delivers value at each phase of implementation.

Remember the core principles: simplicity first, working modules, clear interfaces, progressive enhancement, and graceful failure handling. These principles should guide all implementation decisions throughout the development process.