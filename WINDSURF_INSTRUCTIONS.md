# TradeWizard 4.0 Implementation Instructions for Windsurf

## Getting Started

Welcome to the TradeWizard 4.0 project! This document provides specific instructions for Windsurf to implement the system according to the established design and architectural principles.

## Initial Steps

1. **Access the Required Documentation**
   - Review all documentation in the `/docs` directory of this repository:
     - `tradewizard-4-project-blueprint.md`: Core project objectives and constraints
     - `core-user-flows.md`: Detailed user journeys and interaction flows
     - `tech-choices-doc.md`: Technology decisions and implementation standards
     - `system-architecture.md`: Architecture overview and component details
     - `architecture-diagram.mermaid`: Visual representation of system architecture
     - `implementation-guide.md`: Step-by-step implementation guidance

2. **Setup Task-Master-AI**
   - Use Task-Master-AI to break down the implementation tasks based on the provided PRD and implementation documents
   - Structure tasks according to the phased approach described in the implementation guide
   - Maintain clear dependencies between tasks

3. **Important Implementation Guidelines**
   - **DO NOT reuse UI components from TradeWizard 3.0** - This is critical to avoid previous implementation issues
   - Follow the three-panel layout design as specified in the architecture document
   - Use React Context API for state management (not Redux or Zustand)
   - Implement a fresh UI based on the TailwindCSS approach described in the tech choices document
   - Focus on simplicity and working functionality first

## Implementation Flow

Follow this implementation sequence:

1. **Set up the project infrastructure**
   - Initialize Next.js project with TypeScript and TailwindCSS
   - Establish directory structure
   - Configure ESLint and Prettier

2. **Implement the core three-panel layout**
   - Create the layout components
   - Implement responsive behavior
   - Set up navigation flow

3. **Implement basic React Context for state management**
   - Create assessment context
   - Implement UI context
   - Set up persistence with local storage

4. **Begin with the Website Analysis feature**
   - Implement URL input form
   - Create OpenAI integration for website analysis
   - Develop extraction results display and verification UI

5. **Continue with Product Classification and subsequent features**
   - Follow the implementation guide for each phase
   - Deliver working functionality at each milestone

## Communication and Deliverables

For each implementation phase:
1. Provide clear descriptions of implemented features
2. Highlight any technical decisions or adaptations made
3. Confirm adherence to the established architecture and guidelines
4. Include screenshots or demos of working functionality

## Key Principles to Remember

- **Simplicity First**: Implement the simplest solution that works
- **Working Modules**: Each component must function independently
- **Clear Interfaces**: Maintain well-defined contracts between components
- **Progressive Enhancement**: Start with basic functionality, enhance incrementally
- **Fail Gracefully**: Provide meaningful fallbacks for errors

## Getting Help

If you encounter any issues or need clarification:
1. Reference the specific document section related to your question
2. Provide context about what you're trying to implement
3. Suggest potential approaches based on the architecture guidelines

Let's build a clean, maintainable, and effective TradeWizard 4.0 system that avoids the complexity issues of previous versions while delivering an excellent user experience.
