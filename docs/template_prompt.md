# WWL Web App Project - Claude Prompt Template

## Basic Structure

```markdown
# Task Context
[Brief description of the specific component or feature]

## Current Implementation Status
- Working on: [specific page/component]
- Current phase: [planning/implementation/testing/refinement]
- Related components: [connected features/dependencies]

## Data Model Context
[Relevant sections of the data model]

## Specific Requirements
[Detailed requirements or problems to solve]

## Constraints
- Technical limitations
- Performance requirements
- Security considerations
- Business rules

# Request
[Clear, specific request for Claude]
```

## Tips for Getting Better Responses

### 1. Be Specific About Data
- Reference exact data structures
- Include field names and types
- Mention validation rules
- Specify data relationships

### 2. Provide Implementation Context
- Current codebase state
- Related components
- Recent changes
- Known issues

### 3. Define Clear Boundaries
- Performance requirements
- Browser compatibility needs
- Mobile responsiveness requirements
- Security constraints

### 4. Request Specific Outputs
- Desired code format
- Documentation style
- Testing requirements
- Error handling expectations

### 5. Break Down Complex Requests
- Split into smaller tasks
- Prioritize components
- Define dependencies
- Set clear milestones

## Ready-to-Use Prompt Sentences

### Component Development
- "Please analyze this component's design considering our data model constraints and suggest optimizations for [specific aspect]."
- "Help me implement form validation for [component] that handles these edge cases: [list cases]."
- "Review this component's state management and suggest improvements for better consistency with our data model."
- "Design an error handling system for [component] that gracefully handles these scenarios: [list scenarios]."
- "Implement a responsive layout for [component] that maintains usability across all device sizes."

### Data Processing
- "Design an efficient algorithm for [specific calculation] that handles these edge cases: [list cases]."
- "Optimize this data transformation pipeline for better performance while maintaining data integrity."
- "Implement a caching strategy for [data type] that balances data freshness with performance."
- "Create a robust validation system for [data type] that enforces our business rules."
- "Design a data consistency check system for [specific feature] that prevents [specific issues]."

### State Management
- "Design a state management solution for [feature] that handles these user interactions: [list interactions]."
- "Implement optimistic updates for [action] while maintaining data consistency."
- "Create a state synchronization system between [components] that prevents race conditions."
- "Design a conflict resolution strategy for concurrent updates to [data type]."
- "Implement a real-time state update system for [feature] that handles network interruptions."

### API Integration
- "Design RESTful endpoints for [feature] that support these operations: [list operations]."
- "Implement error handling for [API endpoint] that covers these scenarios: [list scenarios]."
- "Create a rate limiting strategy for [endpoint] that balances user experience with server load."
- "Design a webhook system for [feature] that handles these events: [list events]."
- "Implement a retry mechanism for [API calls] that handles temporary failures gracefully."

### Testing Strategy
- "Create a test suite for [component] that verifies these behaviors: [list behaviors]."
- "Design integration tests for [feature] that validate these workflows: [list workflows]."
- "Implement performance tests for [operation] that verify these metrics: [list metrics]."
- "Create edge case tests for [functionality] that cover these scenarios: [list scenarios]."
- "Design accessibility tests for [component] that verify compliance with [standards]."

### Error Handling
- "Implement a comprehensive error handling system for [feature] that covers: [list scenarios]."
- "Design user-friendly error messages for [actions] that provide clear next steps."
- "Create a error recovery mechanism for [process] that maintains data integrity."
- "Implement a logging system for [feature] that captures these details: [list details]."
- "Design a fallback system for [functionality] when [resource] is unavailable."

### Performance Optimization
- "Analyze performance bottlenecks in [feature] and suggest optimization strategies."
- "Implement lazy loading for [component] that improves initial load time."
- "Design a caching strategy for [data] that reduces server load."
- "Optimize render performance for [component] by reducing unnecessary rerenders."
- "Implement performance monitoring for [feature] that tracks these metrics: [list metrics]."

### Security Implementation
- "Design an authentication system for [feature] that prevents these vulnerabilities: [list vulnerabilities]."
- "Implement data validation for [input] that prevents injection attacks."
- "Create a permission system for [feature] that enforces these access rules: [list rules]."
- "Design a secure data transmission system for [feature] that protects sensitive information."
- "Implement audit logging for [actions] that tracks these events: [list events]."

### Documentation
- "Create technical documentation for [feature] that includes these aspects: [list aspects]."
- "Write user documentation for [feature] that explains these workflows: [list workflows]."
- "Document the API endpoints for [feature] with request/response examples."
- "Create troubleshooting guides for [common issues] with step-by-step solutions."
- "Write integration guidelines for [feature] that cover these scenarios: [list scenarios]."

Remember to:
1. Replace bracketed placeholders with specific details
2. Add relevant context from your data model
3. Include any specific constraints or requirements
4. Specify desired output format
5. Reference related components or features

# Transition Questions and Request Templates

## Transition to Specific Questions/Requests

### Refinement Questions
```markdown
Given this context, how can I improve my proposition to achieve [specific goal] more effectively? Specifically, I'm looking to enhance:
- [aspect 1]
- [aspect 2]
- [aspect 3]
```

### Alternative Exploration
```markdown
Are there alternative approaches or strategies I should consider for [specific component/feature], given:
1. Our current data model structure
2. The existing page plan
3. [Other relevant constraints]
```

### Implementation Guidance
```markdown
Can you provide step-by-step guidance on implementing [specific feature], considering:
- The current data model architecture
- The need for efficient data access
- [Other technical requirements]
```

### Code Generation Requests
```markdown
Based on this context, could you generate a code snippet using [language/framework] to implement:
1. [specific functionality]
2. Following these requirements:
   - [requirement 1]
   - [requirement 2]
   - [requirement 3]
```

### Validation Requests
```markdown
What are the potential drawbacks or limitations of this approach, specifically regarding:
- Long-term scalability
- System maintainability
- [Other concerns]
```

### Best Practices Inquiry
```markdown
What are the best practices for [specific task] in this context, considering:
- Our data model structure
- Performance requirements
- Security considerations
```

### Optimization Questions
```markdown
How can I optimize [specific component/algorithm] for:
- Better performance with large datasets
- Improved response time
- Reduced resource usage
```

### Clarification Requests
```markdown
I'm unsure about [specific aspect]. Could you explain:
1. How it relates to our current architecture
2. Its impact on [specific feature]
3. Best implementation approaches
```

# Transition Options for Questions and Requests

## Option 1: Seeking Refinement
"Given this context, how can I improve my proposition to achieve the core idea more effectively?"

## Option 2: Seeking Alternatives
"Are there alternative approaches or strategies I should consider, given the data model and page plan?"

## Option 3: Seeking Implementation Guidance
"Can you provide guidance on implementing this proposition, considering the data model and the need for efficient data access?"

## Option 4: Seeking Code Generation
"Based on this, could you generate a code snippet (using [preferred language/framework]) to illustrate [specific functionality]?"

## Option 5: Seeking Validation
"What are the potential drawbacks or limitations of my proposition, considering the long-term scalability and maintainability of the application?"

## Option 6: Seeking Best Practices
"What are the best practices for [specific task, e.g., 'handling concurrent updates to the ranking data'] in this context?"

## Option 7: Seeking Optimization
"How can I optimize the [specific part of the system, e.g., 'pairing algorithm'] for performance, considering the potential for a large number of players and matches?"

## Option 8: Seeking Clarification
"I'm unsure about [specific aspect of the problem]. Can you explain [the aspect] in more detail, considering the project's context?"

## Specific Question/Request
[Elaborate on your question or request, providing as much detail as possible. Be clear about the desired output format (e.g., code snippet, list of suggestions, detailed explanation).]