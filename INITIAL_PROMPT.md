# TradeWizard 4.1 Development Kickoff

## Introduction

Hey Windsurf!

We're starting the implementation of **TradeWizard 4.0** (repository name 4.1), our AI-powered export readiness assessment tool designed specifically for South African SMEs. The project emphasizes simplicity, modularity, and incremental delivery. I've prepared comprehensive documentation to ensure clarity and alignment.

## 📂 Project Repository

I've set up a fresh GitHub repository with all the necessary documentation:

```
https://github.com/seanmking/tradewizard_4.1
```

This is a completely new implementation that avoids the architectural issues of previous versions. Please clone this repository to get started.

## 📑 Documentation Resources

The repository contains detailed documentation in the `/docs` directory:

- `tradewizard-4-project-blueprint.md`: Core project objectives and constraints
- `core-user-flows.md`: Detailed user journeys and interaction flows
- `tech-choices-doc.md`: Technology decisions and implementation standards
- `system-architecture.md`: Architecture overview and component details
- `architecture-diagram.mermaid`: Visual representation of system architecture
- `implementation-guide.md`: Step-by-step implementation guidance

Additionally, there's a `WINDSURF_INSTRUCTIONS.md` file in the root directory with specific implementation guidance for your team.

## 🚩 Critical Instructions

Please read these instructions carefully before starting development:

1. **DO NOT reuse UI components from TradeWizard 3.0** - This is absolutely critical. The UI issues from TradeWizard 3.0 stemmed from attempting to reuse complex components with embedded state management. We're starting fresh with clean, simple components.

2. **Use Task-Master-AI for planning** - As your first step, please use Task-Master-AI to break down the implementation tasks based on the PRD and implementation documents. Structure these according to the phased approach in the implementation guide.

3. **Follow the Three-Panel Layout** - The UI architecture follows a specific three-panel layout (navigation, conversation, and context panels). Implement this consistently across all pages.

4. **Use React Context for state management** - We're standardizing on React Context API with useReducer for state management. No Redux, Zustand, or other state management libraries.

5. **Focus on incremental delivery** - Each milestone should deliver working functionality that can be demonstrated and tested before moving to the next.

## 🎯 Project Objective

Create a straightforward, conversational assessment platform that enables SMEs to:

- Analyze their business websites automatically
- Accurately classify products using Harmonized System (HS) codes
- Identify and evaluate target export markets
- Generate actionable, comprehensive export readiness reports

## 🛠️ Technology Stack

- **Frontend**: Next.js 14.x, React 18.x, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, TypeScript, Node.js
- **State Management**: React Context (no Redux, Zustand, or Recoil)
- **External APIs**: OpenAI API for content extraction and insights
- **PDF Generation**: React-PDF
- **Infrastructure**: Vercel for hosting and deployment

## 🧩 Initial Implementation Tasks

Let's begin with Phase 1 of the implementation plan:

### Task 1: Project Setup
- **Subtask 1.1**: Initialize Next.js 14.x project with TypeScript and TailwindCSS
- **Subtask 1.2**: Set up directory structure according to the implementation guide
- **Subtask 1.3**: Configure ESLint, Prettier, and basic styling
- **Subtask 1.4**: Create initial README.md and documentation structure

### Task 2: Three-Panel UI Layout
Based on the architecture document:
- **Subtask 2.1**: Implement Left Navigation Panel component
- **Subtask 2.2**: Implement Center Conversation Panel component
- **Subtask 2.3**: Implement Right Context Panel component
- **Subtask 2.4**: Create a ThreePanelLayout component that integrates all three panels
- **Subtask 2.5**: Add responsive behavior for different screen sizes

### Task 3: Basic React Context Setup
- **Subtask 3.1**: Implement AssessmentContext for main application state
- **Subtask 3.2**: Create UIContext for managing UI state (panel visibility, current step, etc.)
- **Subtask 3.3**: Add local storage persistence for session state
- **Subtask 3.4**: Create custom hooks for accessing and updating context state

## ✅ Your First Response

Please reply explicitly acknowledging:

1. Your understanding of the project, objectives, and technical constraints
2. Confirmation that you've reviewed all documentation
3. Your implementation plan for the first phase (Tasks 1-3)
4. Any clarification you might need before starting

After your confirmation, we'll proceed with the first implementation phase.

Looking forward to building TradeWizard 4.0 with you!
