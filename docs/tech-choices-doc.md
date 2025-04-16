# TradeWizard 4.0 Technology Choices & Standards

This document defines the technology choices and implementation standards for TradeWizard 4.0. It serves as a reference to prevent architectural drift and ensure consistency across the application.

## Core Technology Stack

### Frontend
- **Framework**: Next.js 14.x with React 18.x
- **Language**: TypeScript 5.x
- **Styling**: TailwindCSS with component-based approach
- **Build System**: Built-in Next.js tooling

### Backend
- **Framework**: Next.js API Routes (serverless functions)
- **Language**: TypeScript 5.x
- **Runtime**: Node.js 18.x

### Infrastructure
- **Hosting**: Vercel (preferred) or similar Next.js-optimized platform
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Environment Management**: Vercel environment variables

## State Management

### Approach
- **Primary Method**: React Context API with useReducer
- **Structure**: Domain-specific contexts (assessment, product, UI, etc.)
- **Persistence**: Local storage for session persistence

### Explicit Constraints
- **No Redux**: Avoid the complexity of Redux and its ecosystem
- **No Zustand**: Maintain simplicity with native React state management
- **No Recoil/Jotai/etc.**: Avoid introduction of additional state libraries

### Implementation Guidelines
- Create separate contexts for different domain concerns
- Use TypeScript for strong typing of state and actions
- Implement custom hooks for accessing state and dispatching actions
- Keep context providers as high in the component tree as needed, but no higher

## API Communication

### HTTP Requests
- **Primary Method**: Native fetch API
- **Alternative**: Axios only if fetch capabilities are insufficient
- **Pattern**: Custom hooks for API calls

### Data Fetching Strategy
- Use SWR for data fetching with caching and revalidation
- Implement error retry with exponential backoff
- Create typed response interfaces for all API endpoints

### Real-time Communication
- **Not Initially Required**: No WebSockets in initial implementation
- **Future Options**: If needed, use Socket.io client with clear connection management

## File & Component Organization

### Directory Structure
```
src/
├── components/           # Reusable UI components
│   ├── common/           # Truly shared components
│   ├── layout/           # Layout components including three-panel
│   ├── forms/            # Form components
│   └── [feature]/        # Feature-specific components
├── contexts/             # React Context definitions
├── hooks/                # Custom React hooks
├── pages/                # Next.js pages and API routes
│   ├── api/              # API endpoints
│   └── [routes]/         # Page routes
├── services/             # Business logic services
│   ├── website-analysis/ # Website analysis service
│   ├── product/          # Product classification service
│   ├── market/           # Market assessment service
│   ├── report/           # Report generation service
│   └── ai-agent/         # AI agent/conversation service
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
└── data/                 # Static data (including HS codes CSV)
```

### Component Structure
- Each component in its own file
- Index files for component exports
- Co-located tests with component files
- Styles defined using Tailwind classes

## Data Management

### Local Data
- **HS Codes**: CSV file parsed at build time
- **Static Content**: JSON files imported directly
- **Assets**: Stored in public directory with versioned paths

### User Data
- **Session Storage**: Browser local storage for session persistence
- **Export Format**: JSON for data portability
- **Import Support**: Standardized JSON format

## External Services Integration

### OpenAI
- **Access Method**: Server-side API calls only
- **Prompt Management**: Centralized prompt templates
- **Error Handling**: Graceful fallbacks for AI failures

### Future Integrations
- All external services isolated behind clear adapter interfaces
- API keys stored only in environment variables, never in code
- Rate limiting and usage tracking for paid services

## UI/UX Standards

### Three-Panel Layout
- **Left Panel**: Navigation and assessment progress
- **Center Panel**: Conversation with AI agent "Sarah"
- **Right Panel**: Contextual content, forms, and reports

### Components
- Use established component library for consistent appearance
- **Important**: DO NOT reuse UI components from TradeWizard 3.0
- Maintain accessibility compliance (WCAG 2.1 AA)

### Design System
- Color palette: Primary (purple), Secondary (teal), Neutral (grays)
- Typography: System fonts with clear hierarchy
- Spacing: 4px base unit (0.25rem in Tailwind)
- Consistent border radius and shadow styles

## Code Quality Standards

### TypeScript Usage
- Strict mode enabled
- Explicit return types on functions
- Interface over type where appropriate
- No use of `any` except in extraordinary circumstances

### Testing Strategy
- Jest for unit and integration tests
- React Testing Library for component tests
- Cypress for end-to-end testing
- Minimum 70% code coverage

### Linting & Formatting
- ESLint with Next.js configuration
- Prettier for code formatting
- Husky for pre-commit hooks

## Performance Guidelines

### Bundle Size
- Component-level code splitting
- Dynamic imports for large dependencies
- Regular bundle analysis

### Rendering Optimization
- Use of React.memo for expensive components
- Virtualization for long lists
- Image optimization via Next.js Image component

### Data Loading
- Progressive data loading
- Skeleton states during loading
- Optimistic UI updates

## Security Considerations

### Authentication
- No initial authentication requirement
- Design for future auth integration

### Data Protection
- No PII storage without explicit consent
- Client-side encryption for sensitive data
- Regular security audits

### API Security
- Input validation on all API endpoints
- Rate limiting for public endpoints
- CSRF protection

## Architectural Stability Guidelines

### Critical Technology Decisions

The following technology choices are considered foundational and should not be changed mid-project without a formal review process:

1. **State Management Approach**: React Context API is the designated state management solution
   - ⚠️ **High Risk**: Switching state management libraries mid-project (e.g., to Redux, Zustand, Recoil, etc.) has historically created serious maintenance and reliability issues in previous TradeWizard versions
   - Any proposal to introduce alternative state management must include a comprehensive migration plan and strong justification

2. **UI Component Framework**: TailwindCSS with component-based styling
   - Changing UI frameworks mid-project creates inconsistent visual styling and duplicates implementation effort
   - Component styling approaches should remain consistent throughout the project

3. **API Communication**: Native fetch API with SWR for data fetching
   - Introducing alternative HTTP clients should be avoided unless absolutely necessary
   - API integration patterns should remain consistent throughout the application

4. **Routing Solution**: Next.js page-based routing
   - The routing approach forms the skeleton of the application and should not be changed

### Protocol for Considering Architecture Changes

If a change to core architecture is proposed:

1. **Document Current Pain Points**: Clearly identify specific, measurable issues with the current approach
2. **Evaluate Alternatives**: Compare alternatives including the cost of migration
3. **Assess Partial State Risk**: Explicitly consider the risk of having part of the application on one approach and part on another
4. **Create Migration Plan**: Develop a comprehensive plan for converting all existing code
5. **Formal Review**: Require sign-off from technical lead and product owner before implementation

### Lessons from TradeWizard History

TradeWizard has experienced several disruptive mid-project transitions:
- From React Context to Redux (created inconsistent state management patterns)
- From Redux to Zustand (left the codebase with mixed state management approaches)
- Introduction of additional communication protocols without full integration

These transitions significantly increased technical debt, created confusing developer experiences, and introduced bugs that were difficult to diagnose and fix. The architecture decisions in TradeWizard 4.0 are specifically designed to avoid repeating these issues by emphasizing simplicity and consistency over novelty.

Remember: Maintaining a consistent, well-understood architecture is almost always more valuable than adopting the latest trending libraries.

## Conclusion

These technology choices and standards are designed to ensure TradeWizard 4.0 remains simple, maintainable, and focused on delivering value to users. They explicitly address previous issues with complex state management and architectural drift by establishing clear boundaries and constraints.

All deviations from these standards should be documented and approved through a formal decision process to prevent unintentional complexity creep.