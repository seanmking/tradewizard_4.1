# TradeWizard 4.0 Core User Flows

This document outlines the primary user journeys through the TradeWizard 4.0 system, defining clear entry and exit points for each step. These flows represent the core value proposition of the application and serve as a guide for implementation priorities.

## Overview of User Journey

The complete user journey follows this progression:

1. **Website Analysis** → 2. **Product Classification** → 3. **Market Selection** → 4. **Capacity Assessment** → 5. **Report Generation**

Each flow can function independently while building toward a comprehensive assessment.

## 1. Website Analysis Flow

**Purpose**: Extract business and product information from a company website to minimize manual data entry.

### Entry Points
- Landing page URL input
- Direct navigation to the "Business Profile" section
- "Start New Assessment" button from dashboard

### Flow Steps

1. **Website Input**
   - User enters business website URL
   - System validates URL format
   - User initiates analysis with "Analyze Website" button
   
2. **Analysis in Progress**
   - System displays loading indicator with percentage
   - Shows helpful tips about export readiness during waiting period
   - Estimated time remaining indicator
   
3. **Extraction Results Review**
   - System presents extracted information in editable format:
     - Business name, location, description
     - Detected products and services
     - Contact information
   - Each extracted item has confidence indicator
   - User can edit, delete, or confirm each item
   
4. **Information Verification**
   - User reviews all extracted information
   - Edits as necessary with inline editing
   - Confirms final information set
   
5. **Business Profile Completion**
   - System saves verified business profile
   - Shows success message with summary
   - Presents button to proceed to next step

### Exit Points
- Proceed to Product Classification
- Save and continue later (creates saved assessment)
- Download business profile as PDF
- Share business profile via link

### Success Criteria
- System successfully extracts relevant business information from 80% of valid websites
- Users can complete verification in under 3 minutes
- Extracted product data is accurate enough to proceed to classification

## 2. Product Classification Flow

**Purpose**: Classify products using Harmonized System (HS) codes to determine export requirements.

### Entry Points
- Direct continuation from Website Analysis
- Navigation from dashboard to "Product Classification" for existing assessment
- Product section in left navigation panel

### Flow Steps

1. **Product Selection**
   - System displays extracted products from website analysis
   - User selects products for export consideration
   - Option to add products manually with "Add Product" button
   
2. **HS Code Classification**
   - For each selected product:
     - System suggests initial HS code possibilities
     - User navigates hierarchical selection (chapter → heading → subheading)
     - Help text explains each level of the hierarchy
   
3. **Cascading Selection Process**
   - User selects HS Chapter (2-digit)
     - System displays relevant headings for selected chapter
   - User selects HS Heading (4-digit)
     - System displays relevant subheadings
   - User selects HS Subheading (6-digit)
     - System confirms final selection with description
   
4. **Classification Review**
   - System displays all classified products with their HS codes
   - User can edit classifications if needed
   - Confirmatory message when all products are classified

### Exit Points
- Proceed to Market Selection
- Save product classifications and continue later
- Return to Website Analysis to add more products
- Download product classification as CSV

### Success Criteria
- Users can classify products with correct HS codes in under 2 minutes per product
- Classification UI provides sufficient guidance for non-experts
- System correctly associates products with appropriate HS code options

## 3. Market Selection Flow

**Purpose**: Select target export markets and understand market-specific requirements.

### Entry Points
- Direct continuation from Product Classification
- Navigation from dashboard to "Target Markets" for existing assessment
- Markets section in left navigation panel

### Flow Steps

1. **Market Selection**
   - System presents map or list of available target markets:
     - UAE
     - UK
     - USA
     - African countries (with multi-select)
   - User selects primary target markets
   
2. **Basic Market Information**
   - For each selected market, system displays:
     - Market size for selected products
     - Basic import requirements
     - Key competitors
   - Information presented in scannable format
   
3. **Market Requirements Review**
   - System analyzes market requirements based on:
     - Selected products (with HS codes)
     - Target markets
   - Displays market-specific certification requirements
   
4. **Requirements Prioritization**
   - System suggests prioritization of requirements based on:
     - Complexity
     - Timeline
     - Cost
   - User can adjust prioritization

### Exit Points
- Proceed to Capacity Assessment
- Save market selections and continue later
- Download market requirements summary
- Return to Product Classification to adjust products

### Success Criteria
- Users can select and compare target markets within 5 minutes
- System provides relevant, actionable market requirements
- Users gain clear understanding of market-specific challenges

## 4. Capacity Assessment Flow

**Purpose**: Evaluate production capacity and logistical readiness for export.

### Entry Points
- Direct continuation from Market Selection
- Navigation from dashboard to "Capacity Assessment" for existing assessment
- Capacity section in left navigation panel

### Flow Steps

1. **Production Capacity Input**
   - User enters current monthly production volume for each product
   - Indicates manufacturing approach (in-house, outsourced, both)
   - Specifies maximum monthly production capacity
   
2. **Export Experience Assessment**
   - User indicates previous export experience (yes/no)
   - If yes, specifies:
     - Previous export markets
     - Products exported
     - Volumes and timeframes
   
3. **Logistics Capability**
   - User provides information about:
     - Shipping methods available
     - Packaging capabilities
     - Warehousing capacity
   - System assesses logistics readiness
   
4. **Budget Allocation**
   - User indicates budget available for export preparation
   - System recommends allocation across:
     - Certification costs
     - Market entry expenses
     - Logistics setup

### Exit Points
- Proceed to Report Generation
- Save capacity assessment and continue later
- Download capacity assessment summary
- Return to previous steps to adjust selections

### Success Criteria
- Users can complete capacity assessment in under 10 minutes
- System provides realistic timeline based on capacity inputs
- Budget recommendations align with market requirements

## 5. Report Generation Flow

**Purpose**: Generate comprehensive export readiness report with actionable insights.

### Entry Points
- Direct continuation from Capacity Assessment
- Navigation from dashboard to "Report" for completed assessment
- Report section in left navigation panel

### Flow Steps

1. **Report Configuration**
   - User selects which sections to include in report
   - Chooses report format (detailed vs. executive summary)
   - Option to include competitive analysis and market trends
   
2. **Report Preview**
   - System generates preliminary report
   - Displays report sections with sample content
   - User can navigate between sections
   
3. **Report Customization**
   - User can add notes to specific sections
   - Option to highlight priority areas
   - Ability to include/exclude specific recommendations
   
4. **Final Report Generation**
   - System compiles complete report
   - Generates PDF with professional formatting
   - Displays download link and on-screen version

### Exit Points
- Download final report as PDF
- Share report via unique link
- Start new assessment
- Return to any previous step to update information

### Success Criteria
- Reports contain accurate, actionable information from all assessment steps
- Generated PDF is professional and clearly formatted
- Users can generate and download report in under 2 minutes

## Key Decision Points

Throughout these flows, there are several critical decision points where users may take different paths:

1. **After Website Analysis**:
   - If website analysis yields insufficient product information → Manual product entry
   - If business details are incomplete → Manual business profile completion

2. **During Product Classification**:
   - If user is uncertain about classification → View help content and examples
   - If product doesn't seem to fit standard categories → Use search function or manual entry

3. **During Market Selection**:
   - If requirements for selected markets are too complex → Consider alternative markets
   - If certification timeline exceeds user expectations → Adjust market priorities

4. **During Capacity Assessment**:
   - If production capacity is insufficient → System recommends capacity expansion strategy
   - If logistics capabilities are inadequate → System suggests logistics partners

5. **During Report Generation**:
   - If assessment is incomplete → System generates partial report with recommendations to complete
   - If user needs specific focus → System allows customization of report sections

## Non-Linear Navigation Support

While the flows are presented linearly, the system supports non-linear navigation:

- Users can move between any completed sections
- Progress is saved automatically at each step
- Previous decisions can be revised with impacts clearly shown
- System maintains state across sessions via local storage

## Conclusion

These core user flows represent the primary value paths through TradeWizard 4.0. By implementing these flows incrementally with clear entry and exit points, the development team can deliver value at each stage while building toward a comprehensive assessment tool.

Implementation should prioritize making each individual flow functional before perfecting all features, allowing for user testing and feedback throughout the development process.