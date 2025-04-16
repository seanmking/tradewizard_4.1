# TradeWizard 4.0 System Architecture

## Overview

Based on the project blueprint and the experiences with previous versions, TradeWizard 4.0 is designed with a focus on simplicity, modularity, and clear boundaries between components. This architecture document outlines the system design that will support the core functionality while avoiding the complexity pitfalls of previous implementations.

## Architecture Principles

### 1. Separation of Concerns

The architecture strictly separates:
- **Presentation Logic**: UI components and pages
- **Business Logic**: Service layer components  
- **Data Access**: API routes and persistence mechanisms

This separation allows each layer to evolve independently and supports clear testing boundaries.

### 2. Simplified State Management

Unlike previous versions that mixed Redux, Zustand, and other state libraries:
- **Single Source of Truth**: React Context provides the primary state management
- **Unidirectional Data Flow**: State changes flow predictably through the application
- **Minimal Global State**: Only essential data is kept in global state

### 3. Modular Services

Each core feature is implemented as a discrete service:
- **Self-Contained**: Each service has clear input/output contracts
- **Independent Functionality**: Services can be developed and tested in isolation
- **Explicit Dependencies**: Services declare their external dependencies

### 4. API Boundary

All external service interactions happen through a well-defined API layer:
- **API Routes**: Next.js API routes provide a clear server-side execution boundary
- **Consistent Error Handling**: Standardized approach to handling errors
- **Data Transformation**: Raw external data is transformed into application-specific formats

## Component Details

### Frontend Layer

#### Three-Panel Layout

Based on the latest UI design for TradeWizard, the application will implement a three-panel layout:

1. **Left Navigation Panel**
   - **Purpose**: Provide navigation and assessment progress tracking
   - **Responsibilities**:
     - Display assessment progress
     - Provide navigation between sections
     - Show resource links
   - **Technical Approach**:
     - Fixed-width sidebar
     - Highlight current section
     - Collapsible on mobile

2. **Center Conversation Panel**
   - **Purpose**: Host guided conversation for assessment process
   - **Responsibilities**:
     - Display conversation history
     - Show guidance messages and questions
     - Capture user inputs
     - Embed interactive forms within conversation
   - **Technical Approach**:
     - Chat-like interface
     - Progressive disclosure of questions
     - Template-based responses initially
     - Prepared for AI enhancement in later milestone

3. **Right Context Panel**
   - **Purpose**: Display contextual information and forms
   - **Responsibilities**:
     - Show relevant information for current step
     - Display forms for data input
     - Present report content
     - Provide additional resources
   - **Technical Approach**:
     - Context-sensitive content
     - Seamless integration with conversation flow
     - Structured information display

#### UI Components
- **Purpose**: Reusable presentation components
- **Responsibilities**: 
  - Render data in a consistent visual format
  - Handle user interactions
  - Emit events in response to user actions
- **Technical Approach**: 
  - Functional React components with hooks
  - Minimal internal state
  - Clear prop interfaces
- **Important**: Do not reuse components from TradeWizard 3.0

#### Next.js Pages
- **Purpose**: Route-specific page components
- **Responsibilities**:
  - Compose UI components into complete pages
  - Connect to state context
  - Handle page-level logic
- **Technical Approach**:
  - Page-based routing (not app router)
  - Simple layout structure
  - Clear navigation paths

#### Form Components
- **Purpose**: Capture user input across assessment steps
- **Responsibilities**:
  - Validate user input
  - Provide feedback on input errors
  - Submit validated data to services
- **Technical Approach**:
  - React Hook Form for validation
  - Progressive disclosure of fields
  - Step-based form architecture

#### Report Components
- **Purpose**: Generate and display assessment reports
- **Responsibilities**:
  - Render report data in user-friendly format
  - Support export to PDF
  - Provide interactive elements for report exploration
- **Technical Approach**:
  - React-PDF for document generation
  - Modular report sections
  - Print-friendly styling

### Service Layer

#### Conversation Service
- **Purpose**: Simple guided interaction for the assessment process
- **Responsibilities**:
  - Present questions and guidance in a conversational format
  - Provide basic responses based on predefined templates
  - Guide users through the assessment process
  - Coordinate with other services for data needs
- **Technical Approach**:
  - Template-based responses in early implementation
  - Simple state machine for conversation flow
  - Prepared for future AI enhancement (Milestone 5)
  - Clear separation from AI-powered data processing

#### Website Analysis Service
- **Purpose**: Extract business and product information from websites
- **Responsibilities**:
  - Coordinate website content extraction
  - Process raw extraction results
  - Format extracted data for user verification
- **Technical Approach**:
  - OpenAI API integration
  - Targeted extraction prompts
  - Structured parsing of AI responses

#### Product Classification Service
- **Purpose**: Assist with HS code classification of products
- **Responsibilities**:
  - Suggest appropriate HS codes
  - Provide hierarchical navigation of HS options
  - Store final classification decisions
- **Technical Approach**:
  - CSV-based HS code database initially
  - Simple search and filtering capabilities
  - Focus on global codes (6-digit) initially
  - Expandable to country-specific codes later

#### Market Assessment Service
- **Purpose**: Provide market-specific insights
- **Responsibilities**:
  - Collect market selection and requirements
  - Match products to market opportunities
  - Identify market-specific compliance needs
- **Technical Approach**:
  - Country-specific requirements database
  - Targeted market insights
  - Compliance checklist generation

#### Report Generation Service
- **Purpose**: Create comprehensive export readiness reports
- **Responsibilities**:
  - Compile assessment data into report format
  - Generate PDF documents
  - Support report customization
- **Technical Approach**:
  - Template-based generation
  - Modular report sections
  - Clean, professional formatting

### Data Layer

#### Next.js API Routes
- **Purpose**: Server-side processing endpoints
- **Responsibilities**:
  - Handle external API communication
  - Process and transform data
  - Implement business logic requiring server resources
- **Technical Approach**:
  - Function-based API routes
  - Consistent error handling
  - Clear input validation

#### State Management
- **Purpose**: Maintain application state
- **Responsibilities**:
  - Store assessment progress
  - Provide state access to components
  - Persist state across sessions
- **Technical Approach**:
  - React Context for global state
  - Hooks for state access
  - Simple, predictable state updates

#### Data Persistence
- **Purpose**: Store assessment data
- **Responsibilities**:
  - Save assessment progress
  - Store user data securely
  - Support data portability
- **Technical Approach**:
  - Initially local storage
  - Future database integration as needed
  - Clear data model

## External Interfaces

### OpenAI API
- **Purpose**: Intelligent content extraction and analysis
- **Integration Points**:
  - Website Analysis Service for content extraction
  - Product Classification Service for HS code suggestions
  - Market Assessment Service for market insights
- **Resilience Strategy**:
  - Retry mechanism for transient failures
  - Fallback to manual input when AI fails
  - Clear error messages for users

### HS Code Database (CSV)
- **Purpose**: Provide harmonized system codes for product classification
- **Integration Points**:
  - Product Classification Service
- **Technical Approach**:
  - Initial implementation as CSV file
  - Loaded and parsed at build or runtime
  - Structured for efficient search and hierarchy navigation
  - Abstraction layer to allow future API replacement

### Trade Requirements API
- **Purpose**: Provide market-specific trade requirements
- **Integration Points**:
  - Market Assessment Service
- **Technical Approach**:
  - Country-specific endpoint calls
  - Structured requirement data
  - Regular updates for compliance changes

## Data Flow

1. **Conversation-Driven Flow**:
   - User interacts with guided conversation in center panel
   - Structured questions guide user through assessment process
   - Context panel updates with relevant information
   - Navigation panel shows progress
   - Forms embedded in conversation or context panel

2. **Website Analysis Flow**:
   - User enters URL in conversation with AI agent
   - Frontend sends URL to API route
   - API calls OpenAI for content extraction
   - Extracted data returned to frontend
   - Data displayed for user verification in context panel
   - AI agent discusses findings with user
   - Verified data stored in application state

3. **Product Classification Flow**:
   - Extracted products displayed in context panel
   - Conversation panel guides classification process
   - User selects product for classification
   - System suggests HS codes from CSV database
   - User navigates hierarchical selection in context panel
   - Help text provides explanation and guidance
   - Final classification stored in application state

4. **Market Assessment Flow**:
   - Conversation panel presents market selection options
   - User selects markets in context panel
   - System retrieves market requirements
   - Requirements matched against product details
   - Assessment results displayed in context panel
   - Informational text explains implications
   - Assessment results stored in application state

5. **Report Generation Flow**:
   - Conversation panel offers to generate report
   - System compiles data from all previous steps
   - Report template populated with assessment data
   - PDF generated for download
   - Report also displayed in context panel
   - Summary text explains key findings

## Technical Constraints & Guidelines

### Performance Constraints
- Initial page load < 3 seconds
- API responses < 2 seconds (except website analysis)
- PDF generation < 5 seconds

### Security Guidelines
- No sensitive data in client-side state
- API routes implement proper validation
- External API keys stored securely in environment variables

### Error Handling Strategy
- Graceful degradation when services fail
- Clear error messages for users
- Automatic retry for transient errors
- Logging of all errors for debugging

### Testing Approach
- Unit tests for service logic
- Component tests for UI elements
- Integration tests for critical flows
- End-to-end tests for complete user journeys

## Implementation Strategy

### Phase 1: Core Structure & Three-Panel Layout
- Setup Next.js application
- Implement three-panel layout
- Create conversation panel with basic guidance
- Setup simple structured conversation flow
- Implement state context
- Setup navigation flow

Note: Advanced AI agent capabilities will be implemented in Milestone 5 (AI Enhancement) after the core functionality is working.

### Phase 2: Website Analysis
- Implement website analysis service
- Create basic OpenAI integration for content extraction
- Build extraction result UI
- Develop user verification interface
- Integrate with simple conversation flow

### Phase 3: Product Classification
- Implement CSV-based HS code database
- Create classification UI with cascading selection
- Build hierarchical navigation
- Develop classification storage
- Integrate with conversation flow

### Phase 4: Market Assessment
- Create market selection interface
- Implement requirements database
- Build assessment logic
- Develop results display
- Integrate with conversation flow

### Phase 5: Report Generation
- Create report templates
- Implement PDF generation
- Build report customization
- Develop export functionality
- Integrate with context panel

## HS Code Implementation

### CSV-Based Approach
- **Data Structure**:
  - Global HS codes (6-digit) in CSV format
  - Hierarchical structure (chapter → heading → subheading)
  - Descriptions for each level
  - Searchable fields

- **User Interface**:
  - Implement fresh cascading UI based on design specifications
  - Maintain explanations and help text
  - Implement search functionality
  - Clear visual indication of selection path

- **Future Expansion**:
  - Abstraction layer for data source
  - Compatible with future country-specific extensions
  - Support for additional metadata (regulations, tariffs)

## Conclusion

This architecture provides a clear foundation for TradeWizard 4.0 development, emphasizing simplicity, modularity, and user-focused functionality. By maintaining strict separation between components and clearly defining interfaces, the system can evolve incrementally while avoiding the complexity issues that affected previous versions.

The architecture prioritizes working functionality over technical sophistication, allowing for rapid development of valuable features while maintaining the ability to enhance and extend the system as requirements evolve.

The three-panel layout provides a consistent, intuitive user experience that balances conversation-driven guidance with contextual information and clear navigation. Building fresh components based on the new design specifications will ensure a coherent and maintainable codebase.