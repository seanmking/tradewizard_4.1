# TradeWizard 4.0: Project Blueprint

## Project Objective

Build an AI-powered export readiness assessment tool that helps South African SMEs evaluate their potential for international trade by analyzing their business website, classifying their products, and providing actionable insights through a simple, guided workflow.

## Core Features & Functionality

### 1. Website Analysis

- User enters business website URL
- System extracts business information and products using LLM (OpenAI)
- Results displayed in editable format for user verification
- Extraction includes business details, product listings, and contact information

### 2. Product Classification

- System suggests HS codes for extracted products
- User can select and refine product classifications through cascading dropdown interface
- Simple hierarchical navigation of HS code options (chapter → heading → subheading)
- Classification results stored for report generation

### 3. Market Assessment

- User selects target export markets (UAE, UK, USA, African countries)
- System provides market-specific insights for selected products
- Production capacity and logistics information collection
- Competitive landscape analysis

### 4. Export Readiness Report

Generates comprehensive PDF report with:
- Business profile summary
- Product classification details with HS codes
- Market-specific requirements and tariff information
- Certification and documentation needs
- Recommended next steps with timeline

## Technical Constraints & Rules

### Architecture Principles

- **Simplicity First**: Implement the simplest solution that works before adding complexity
- **Working Modules**: Each component must be independently testable and functional
- **Clear Interfaces**: Well-defined contracts between system components
- **Progressive Enhancement**: Start with basic functionality, enhance incrementally
- **Fail Gracefully**: Provide meaningful fallbacks when services or features encounter errors

### Technical Decisions

- Next.js for frontend (React, TypeScript)
- Simple state management (React Context for core state)
- API routes for backend processing
- OpenAI API for intelligent extraction and analysis
- PDF generation using React-PDF or similar library
- Modular folder structure organized by feature, not technical layer

### Non-Negotiable Requirements

- Each step must work independently before connecting to subsequent steps
- No premature optimizations or abstractions
- Weekly demos of working functionality
- Explicit error handling at every step
- Comprehensive logging for debugging and analytics
- Test coverage for core functionality

## Development Milestones

### Milestone 1: Core Website Analysis (Week 1-2)

- Landing page with URL input form
- Website content extraction using OpenAI API
  - Extract business name, description, location
  - Identify products and descriptions
  - Basic entity categorization
- Display of extracted data in editable format
- Ability to save extracted information
- **Success Criteria**: Successfully extract and display business and product information from 80% of test websites

### Milestone 2: Basic Product Classification (Week 3-4)

- Product list view with editing capabilities
- Basic HS code lookup and selection interface
- Simple hierarchical selection (chapter → heading → subheading)
- Storage of classification results
- Manual product entry option as fallback
- **Success Criteria**: Users can classify products with correct HS codes in under 2 minutes per product

### Milestone 3: Simple Assessment Flow (Week 5-6)

- Step-by-step navigation through assessment process
- State persistence between steps
- Production capacity and target market selection forms
- Previous export experience data collection
- **Success Criteria**: Complete end-to-end flow with persistent state between steps and page refreshes

### Milestone 4: Basic Reporting (Week 7-8)

- Generation of simple PDF report
- Integration of all previous steps
- Basic recommendations based on inputs
- Exportable and printable format
- **Success Criteria**: Generated reports contain accurate information from all assessment steps

### Milestone 5: AI Enhancement (Week 9-10)

- Enhanced product classification suggestions
- Market-specific insights for selected products
- Compliance requirements by country
- Improved recommendations based on broader data
- **Success Criteria**: AI-generated insights add measurable value based on user feedback

## Technical Architecture

### Frontend

- Next.js application with TypeScript
- Page-based routing following assessment flow
- Component library organized by feature
- Simple context for global state management
- Form validation using React Hook Form

### Backend

- Next.js API routes for serverless functionality
- OpenAI integration for website analysis
- Data persistence layer (initially local, then database)
- PDF generation service

### Integrations

- OpenAI API for website analysis and product identification
- HS Code database/API for product classification
- Country-specific trade requirements databases

## Success Metrics

- User can complete entire assessment in under 15 minutes
- System successfully extracts products from 80%+ of valid business websites
- Generated reports contain actionable, specific recommendations
- System handles errors gracefully with clear user guidance
- Users can navigate the assessment flow without training or guidance

## Conclusion

This blueprint establishes a clear framework for building TradeWizard 4.0 with a focus on incremental delivery of working functionality. By emphasizing simplicity, independent testing of components, and clear interfaces between modules, we aim to avoid the complexity issues that hindered previous versions while delivering a valuable tool for South African SMEs.