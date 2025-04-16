# TradeWizard 4.0 - Product Requirements Document

## 1. Executive Summary

TradeWizard 4.0 is an AI-powered export readiness assessment tool designed to help South African SMEs evaluate and prepare for international trade opportunities. Building on lessons learned from previous versions, this iteration focuses on simplicity, modularity, and a user-centric approach to guide businesses through the complexities of export preparation.

The platform analyzes business websites to extract company and product information, assists with HS code classification, provides market-specific insights, and generates comprehensive export readiness reports with actionable recommendations.

## 2. Problem Statement

98% of African SMEs fail in their first export attempt due to:
- Overwhelming complexity of international trade regulations
- Lack of knowledge about market-specific requirements
- Difficulty in correctly classifying products with HS codes
- Insufficient preparation for certification and documentation needs
- Limited understanding of production capacity requirements

## 3. Target Users

**Primary Users:**
- South African small and medium-sized enterprises (SMEs)
- Business owners and managers exploring export opportunities
- Export managers at growth-stage companies
- Trade development advisors working with SMEs

**User Characteristics:**
- Limited experience with international trade procedures
- Varied technical proficiency
- Time-constrained decision-makers
- Need for clear, actionable guidance

## 4. Value Proposition

TradeWizard 4.0 transforms the export assessment process by:
- Reducing manual data entry through AI-powered website analysis
- Simplifying product classification with intuitive HS code selection
- Providing market-specific insights tailored to products and capabilities
- Generating actionable export readiness reports with clear next steps
- Guiding users through a structured, conversation-based assessment

## 5. Key Features & Functionality

### 5.1 Website Analysis

**Description:**
An AI-powered tool that analyzes business websites to extract relevant information for export assessment.

**Requirements:**
- **Input Form**
  - Simple URL input field with validation
  - Clear instructions and expectations
  - Progress indicator during analysis

- **Extraction Capabilities**
  - Business name, location, and description
  - Product listings with descriptions
  - Contact information
  - Industry categorization

- **Review & Verification**
  - Editable results with confidence indicators
  - Ability to add, edit, or remove extracted items
  - Confirmation step for verified information

- **Technical Implementation**
  - OpenAI API integration for content extraction
  - Targeted extraction prompts
  - Error handling for failed extractions
  - Fallback to manual entry

### 5.2 Product Classification

**Description:**
A system to help users properly classify their products using the Harmonized System (HS) codes, critical for determining export requirements.

**Requirements:**
- **Product Management**
  - Display products extracted from website
  - Allow manual addition of products
  - Support editing of product details

- **Classification Interface**
  - Cascading dropdown selection (chapter → heading → subheading)
  - Search functionality for codes and descriptions
  - Hierarchical navigation with explanations
  - Confidence indicators for suggestions

- **HS Code Database**
  - Global 6-digit HS codes in structured format
  - Clear descriptions for each level
  - Searchable by keywords and categories

- **Technical Implementation**
  - CSV-based HS code database initially
  - Custom UI implementation (no reuse from TradeWizard 3.0)
  - Future-proof for country-specific extensions

### 5.3 Market Assessment

**Description:**
A tool to evaluate target export markets and understand market-specific requirements.

**Requirements:**
- **Market Selection**
  - Support for multiple target markets:
    - UAE
    - UK
    - USA
    - African countries (selectable)
  - Clear market categorization and grouping

- **Market Intelligence**
  - Market size and growth trends
  - Competitive landscape
  - Tariff information
  - Trade agreement benefits/restrictions

- **Requirement Analysis**
  - Product-specific certification requirements
  - Documentation needs by market
  - Regulatory compliance information
  - Estimated timeline for market entry

- **Technical Implementation**
  - Country-specific requirement database
  - Integration with HS classification system
  - Structured format for market insights

### 5.4 Production & Capacity Assessment

**Description:**
A tool to evaluate the company's readiness to meet export market demands.

**Requirements:**
- **Production Capacity**
  - Current monthly production volume inputs
  - Manufacturing approach selection
  - Maximum capacity estimation
  - Seasonal variability consideration

- **Export Experience**
  - Previous export history collection
  - Market-specific experience tracking
  - Success/challenge documentation

- **Logistics Assessment**
  - Shipping capabilities evaluation
  - Packaging requirements assessment
  - Warehousing capacity estimation

- **Budget Planning**
  - Export preparation budget allocation
  - Cost estimation for requirements
  - ROI projection guidance

### 5.5 Export Readiness Report

**Description:**
A comprehensive report that synthesizes all assessment data into actionable insights and recommendations.

**Requirements:**
- **Report Components**
  - Business profile summary
  - Product classification details
  - Target market analysis
  - Certification and documentation roadmap
  - Timeline and budget recommendations
  - Action plan with prioritized steps

- **Report Format**
  - Professional PDF document (preferably using React-PDF)
  - On-screen interactive version
  - Modular sections for customization
  - Shareable format

- **Technical Implementation**
  - React-PDF for document generation (preferred)
  - Modular template structure
  - Print-friendly styling

## 6. User Interface & Experience

### 6.1 Three-Panel Layout

The UI follows a three-panel layout throughout the application:

**Left Navigation Panel**
- Assessment progress tracking
- Section navigation
- Resource links
- Completion status indicators

**Center Conversation Panel**
- Guided conversation interface
- "Sarah" AI agent persona
- Progressive disclosure of questions
- Embedded forms when appropriate
- Clear guidance and help text

**Right Context Panel**
- Context-specific information
- Detailed forms for complex inputs
- Visualization of data
- Supporting documentation
- Relevant statistics and insights

**Panel widths and detailed layout** will be defined in the UI design documentation to be provided.

### 6.2 Conversation-Driven Flow

- Conversational guidance throughout assessment
- Clear questions and suggestions
- Simple, focused inputs at each stage
- Contextual help and explanations
- Quick reply options where appropriate

### 6.3 Progressive Disclosure

- Information presented in logical, manageable chunks
- Complex concepts introduced gradually
- Just-in-time guidance and explanations
- Clear progression between assessment phases

### 6.4 UI Component Reuse

- **No UI components will be reused from TradeWizard 3.0.**
- All UI components will be designed and implemented fresh for TradeWizard 4.0.
- Visual and interaction patterns will align with the new UI design assets (to be provided).

### 6.5 Visual Design

- Clean, professional aesthetic
- Consistent color scheme:
  - Primary: Purple (#6B46C1)
  - Secondary: Teal (#319795)
  - Neutrals: Gray scale (#F9FAFB background)
- Clear visual hierarchy of information
- Mobile-responsive design
- Accessibility compliance (WCAG 2.1 AA)
- **Design assets and style guide will be provided separately.**

## 7. User Flows

### 7.1 Website Analysis Flow

1. User lands on assessment start page
2. User enters business website URL
3. System validates URL format
4. Loading indicator shows analysis progress
5. Extracted information displayed in editable format
6. User reviews, edits, and confirms information
7. System saves verified business profile
8. User proceeds to product classification

**Exit Points:**
- Save and continue later
- Download business profile as PDF
- Share business profile via link

### 7.2 Product Classification Flow

1. System displays extracted products
2. User selects products for export consideration
3. For each product:
   - System suggests initial HS code possibilities
   - User navigates hierarchical selection
   - System confirms final selection
4. System displays all classified products
5. User proceeds to market selection

**Exit Points:**
- Save classifications and continue later
- Return to add more products
- Download classifications as CSV

### 7.3 Market Selection Flow

1. User selects target export markets
2. System displays market information for selected products
3. System analyzes market requirements
4. User reviews and prioritizes requirements
5. User proceeds to capacity assessment

**Exit Points:**
- Save market selections and continue later
- Download market requirements
- Return to adjust product selection

### 7.4 Capacity Assessment Flow

1. User enters production capacity information
2. User provides export experience details
3. User completes logistics capability assessment
4. User indicates budget allocation preferences
5. User proceeds to report generation

**Exit Points:**
- Save assessment and continue later
- Download capacity assessment
- Return to adjust market selection

### 7.5 Report Generation Flow

1. User selects report sections and format
2. System generates preliminary report
3. User customizes report if desired
4. System generates final PDF report
5. User downloads and/or shares report

**Exit Points:**
- Download final report
- Share report via link
- Start new assessment
- Return to update information

## 8. Technical Requirements

### 8.1 Technology Stack

- **Frontend:**
  - Next.js 14.x with React 18.x
  - TypeScript 5.x
  - TailwindCSS for styling
  - React Context API for state management

- **Backend:**
  - Next.js API Routes (serverless functions)
  - Node.js 18.x runtime

- **Infrastructure:**
  - Vercel hosting
  - GitHub Actions for CI/CD
  - Vercel environment variables

### 8.1.1 Code Reuse Strategy

- No UI code will be reused from TradeWizard 3.0.
- Implementation will follow the new UI design assets and guidelines.

### 8.2 External Integrations

- **OpenAI API**
  - Website content extraction
  - Product classification assistance
  - Market insights generation

- **HS Code Database**
  - Initially CSV-based
  - Structured for hierarchical navigation
  - Searchable by keywords

- **Trade Requirements Database**
  - Country-specific requirements
  - Certification information
  - Documentation needs

### 8.3 State Management

- **React Context API**
  - Domain-specific contexts
  - Assessment state
  - Product state
  - UI state

- **Persistence**
  - Local storage for session persistence
  - Import/export functionality for data portability

### 8.4 Performance Requirements

- Initial page load < 3 seconds
- Website analysis completion < 30 seconds
- API responses < 2 seconds (except website analysis)
- PDF generation < 5 seconds
- Complete assessment flow navigable in < 15 minutes

### 8.5 Security Requirements

- No sensitive data in client-side state
- API routes with proper input validation
- Environment variables for API keys
- No PII storage without explicit consent

## 9. Development Approach

### 9.1 Development Milestones

**Milestone 1: Core Website Analysis (Week 1-2)**
- Landing page with URL input
- Website content extraction with OpenAI
- Extraction results display and editing
- Business profile storage

**Milestone 2: Basic Product Classification (Week 3-4)**
- Product list management
- HS code selection interface
- Classification storage
- Manual product entry option

**Milestone 3: Simple Assessment Flow (Week 5-6)**
- End-to-end navigation
- State persistence
- Production capacity assessment
- Target market selection

**Milestone 4: Basic Reporting (Week 7-8)**
- PDF report generation (preferably React-PDF)
- Integration of all assessment data
- Basic recommendations
- Export and sharing options

**Milestone 5: AI Enhancement (Week 9-10)**
- Improved classification suggestions
- Enhanced market insights
- Compliance requirement details
- Advanced recommendations

### 9.2 Quality Assurance

- **Unit Testing**
  - Service logic tests
  - Utility function tests
  - State management tests

- **Component Testing**
  - UI component rendering tests
  - Form validation tests
  - Context provider tests

- **Integration Testing**
  - API endpoint tests
  - Multi-component flows
  - External service integration

- **End-to-End Testing**
  - Complete user journeys
  - Cross-browser compatibility
  - Responsive design testing

### 9.3 Implementation Principles

- **Simplicity First**
  - Implement the simplest solution that works
  - Avoid premature optimization
  - Focus on user value over technical sophistication

- **Independent Modules**
  - Each component must be independently testable
  - Clear interfaces between system components
  - Modular architecture for easier maintenance

- **Progressive Enhancement**
  - Start with basic functionality
  - Enhance incrementally
  - Maintain backwards compatibility

- **Error Handling**
  - Graceful degradation when services fail
  - Clear error messages for users
  - Fallback options for critical features

## 10. Success Metrics

### 10.1 User Experience Metrics

- Assessment completion rate > 70%
- Assessment completion time < 15 minutes
- User satisfaction score > 8/10
- User error rate < 5%
- Return rate > 50%

### 10.2 Technical Performance Metrics

- Website analysis accuracy > 80%
- Product classification precision > 90%
- System uptime > 99.5%
- Error recovery rate > 95%
- Average page load time < 2 seconds

### 10.3 Business Impact Metrics

- Number of completed assessments
- Number of generated reports
- User action on recommendations > 40%
- Reported export success rate
- Partner referral conversion rate

## 11. Future Considerations

### 11.1 Potential Extensions

- User accounts and authentication
- Multi-language support
- Integration with trade promotion agencies
- Advanced business intelligence reporting
- Mobile application version

### 11.1.1 TradeWizard 3.0 Migration Path

For organizations that have implemented TradeWizard 3.0, a migration path will be provided:
- **Data Migration**: Tools to import assessment data from TradeWizard 3.0
- **User Experience**: Guided transition to maintain consistency for existing users
- **Parallel Operation**: Support for running both systems during transition period
- **Component Reuse**: Leveraging refined components from TradeWizard 3.0 while improving architecture
- **Documentation**: Migration guides for administrators and end users

### 11.2 AI Enhancements

- Conversational AI for more natural guidance
- Predictive analytics for export success probability
- Competitor analysis using market data
- Automated follow-up and progress tracking

### 11.3 Integration Opportunities

- Banking and finance partners for export funding
- Logistics providers for shipping quotes
- Certification bodies for direct applications
- Trade insurance providers
- Export documentation platforms

## 12. Constraints and Limitations

- Initial focus on South African SMEs only
- Limited to businesses with online presence
- Fixed target market options (UAE, UK, USA, African countries)
- English language only in initial version
- No integrated payment processing initially

## 13. Documentation Requirements

- User documentation
  - Getting started guide
  - Feature walkthroughs
  - FAQ and troubleshooting

- Technical documentation
  - Architecture overview
  - API documentation
  - Component documentation
  - State management guide

- Maintenance documentation
  - Deployment procedures
  - Monitoring setup
  - Backup and recovery plans

## 14. Glossary of Terms

- **HS Code**: Harmonized System code, an internationally standardized system of names and numbers to classify traded products
- **SME**: Small and Medium-sized Enterprise
- **Export Readiness**: A measure of how prepared a business is to enter international markets
- **MCP**: Model Context Protocol, an architectural pattern from previous versions
- **Sarah**: The conversational AI agent persona used in the assessment process
- **Three-Panel Layout**: The UI design with navigation, conversation, and context panels

## 15. Approvals and Stakeholders

- **Product Owner**: [Name] - Responsible for overall product vision and requirements
- **Technical Advisor**: [Name] - Responsible for technical guidance and implementation oversight
- **Development Team**: Windsurf - Responsible for implementation
- **UX/UI Design**: [Name/Team] - Responsible for user experience and interface design
- **QA Team**: [Name/Team] - Responsible for quality assurance and testing

---

This Product Requirements Document serves as the definitive guide for the development of TradeWizard 4.0. Any changes to these requirements must go through proper change management processes and receive appropriate stakeholder approval.

Version: 1.1
Last Updated: April 16, 2025
