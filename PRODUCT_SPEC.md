# Slim-to-ERB VS Code Extension - Product Specification

## Executive Summary

A VS Code extension that provides seamless conversion from Slim template files (.slim) to ERB template files (.erb) for Ruby on Rails applications. The extension will handle complex Slim syntax including shortcuts, embedded Ruby, and HTML structures while maintaining code integrity and formatting.

## Core Features & Functionality

### MVP Features (Days 1-4)
1. **Single File Conversion**
   - Convert individual .slim files to .erb format
   - Preserve file structure and directory location
   - Handle basic Slim syntax (tags, attributes, text content)
   - Support embedded Ruby code blocks and inline expressions

2. **VS Code Integration**
   - Command palette integration (`Slim: Convert to ERB`)
   - Right-click context menu for .slim files
   - Status bar progress indicator during conversion
   - Error notifications with actionable feedback

3. **Core Syntax Conversion**
   - HTML tags (`div` → `<div>`)
   - Class shortcuts (`.class-name` → `class="class-name"`)
   - ID shortcuts (`#id-name` → `id="id-name"`)
   - Combined shortcuts (`.class#id` → `class="class" id="id"`)
   - Text content and interpolation (`= variable` → `<%= variable %>`)
   - Ruby code blocks (`- if condition` → `<% if condition %>`)

4. **File Management**
   - Auto-save converted files with .erb extension
   - Option to keep or remove original .slim files
   - Backup creation before conversion

### Enhanced Features (Days 5-6)
1. **Batch Directory Conversion**
   - Convert all .slim files in selected directory
   - Recursive subdirectory processing
   - Progress tracking for multiple files
   - Batch operation summary report

2. **Advanced Syntax Support**
   - Nested attribute handling
   - Complex Ruby expressions
   - Conditional attributes
   - Loop constructs and blocks
   - Comment preservation

3. **Configuration Options**
   - Indentation preferences (2 spaces, 4 spaces, tabs)
   - Output formatting style
   - Backup file location
   - Auto-delete original files option

## Technical Architecture Overview

### Technology Stack
- **Language**: TypeScript
- **Framework**: VS Code Extension API
- **Parser**: Custom Slim parser using lexical analysis
- **Testing**: Jest + VS Code Extension Test Runner
- **Build**: webpack + esbuild for optimization
- **Package Manager**: npm

### Core Components

```
src/
├── extension.ts              # Main extension entry point
├── commands/
│   ├── convertFile.ts       # Single file conversion
│   └── convertDirectory.ts  # Batch conversion
├── parser/
│   ├── slimParser.ts        # Core Slim syntax parser
│   ├── erbGenerator.ts      # ERB output generator
│   └── syntaxMappings.ts    # Slim to ERB mapping rules
├── utils/
│   ├── fileManager.ts       # File operations
│   ├── errorHandler.ts      # Error management
│   └── progressTracker.ts   # Progress reporting
└── test/
    ├── unit/                # Unit tests
    └── integration/         # Integration tests
```

### Extension Manifest (package.json)
```json
{
  "contributes": {
    "commands": [
      {
        "command": "slim-to-erb.convertFile",
        "title": "Convert Slim to ERB",
        "category": "Slim"
      }
    ],
    "menus": {
      "explorer/context": [
        {
          "command": "slim-to-erb.convertFile",
          "when": "resourceExtname == .slim"
        }
      ]
    }
  }
}
```

## Key Conversion Challenges & Solutions

### Challenge 1: Slim Shorthand Syntax
**Problem**: `.class#id` → `class="class" id="id"`
**Solution**: Regex-based pattern matching with precedence rules

```typescript
const parseShorthand = (input: string): Attributes => {
  const classMatch = input.match(/\.([a-zA-Z0-9_-]+)/g);
  const idMatch = input.match(/#([a-zA-Z0-9_-]+)/);
  
  return {
    class: classMatch?.map(c => c.slice(1)).join(' '),
    id: idMatch?.[1]
  };
};
```

### Challenge 2: Indentation-Based Nesting
**Problem**: Converting Slim's whitespace-significant structure to ERB
**Solution**: Stack-based parser tracking indentation levels

```typescript
class IndentationTracker {
  private stack: number[] = [];
  
  processLine(line: string, indentLevel: number): string {
    while (this.stack.length > 0 && this.stack[this.stack.length - 1] >= indentLevel) {
      this.stack.pop();
      // Close tags
    }
    this.stack.push(indentLevel);
    // Process current line
  }
}
```

### Challenge 3: Ruby Code Preservation
**Problem**: Maintaining Ruby logic integrity during conversion
**Solution**: Ruby expression detection and passthrough

```typescript
const convertRubyExpression = (line: string): string => {
  if (line.startsWith('= ')) {
    return `<%= ${line.slice(2)} %>`;
  }
  if (line.startsWith('- ')) {
    return `<% ${line.slice(2)} %>`;
  }
  return line;
};
```

## Development Timeline (6-Day Sprint)

### Day 1: Project Setup & Core Architecture
- Initialize VS Code extension project
- Set up TypeScript configuration and build pipeline
- Create basic extension structure and entry points
- Implement VS Code command registration
- Write initial unit test framework

### Day 2: Basic Slim Parser Implementation
- Develop core lexical analyzer for Slim syntax
- Implement HTML tag parsing
- Handle basic class/ID shortcuts
- Create initial ERB output generator
- Test single-line conversions

### Day 3: Ruby Expression Handling
- Implement Ruby code block detection (`- if`, `= variable`)
- Handle embedded Ruby expressions
- Process conditional and loop constructs
- Add text content and interpolation support
- Expand test coverage

### Day 4: File Operations & VS Code Integration
- Implement file reading/writing operations
- Add VS Code UI integration (commands, context menus)
- Create error handling and user feedback
- Implement progress tracking
- Single file conversion MVP complete

### Day 5: Batch Processing & Advanced Features
- Implement directory traversal and batch conversion
- Add configuration options and settings
- Handle complex nested structures
- Implement backup and recovery features
- Performance optimization

### Day 6: Polish, Testing & Packaging
- Comprehensive testing and bug fixes
- User experience improvements
- Documentation and help text
- Extension packaging and marketplace preparation
- Demo preparation and examples

## MVP Feature Set vs Future Enhancements

### MVP (Shipped Day 4)
- Single file conversion
- Basic Slim syntax support
- VS Code command integration
- Error handling and notifications
- Simple configuration options

### Future Enhancements
- Syntax highlighting for converted files
- Live preview of conversion results
- Undo/redo conversion operations
- Integration with Git for change tracking
- Custom conversion rule definitions
- Batch conversion with filtering options
- Performance metrics and analytics
- Support for Haml-to-ERB conversion

## Testing Strategy

### Unit Tests (70% coverage target)
- Parser component testing
- Syntax conversion validation
- File operation testing
- Error handling verification

### Integration Tests
- End-to-end conversion workflows
- VS Code extension API interaction
- File system operations
- Batch processing scenarios

### Manual Testing
- Real-world Slim file conversion
- Complex nested structure handling
- Performance testing with large files
- User experience validation

## Success Metrics

### Technical Metrics
- Conversion accuracy: >95% for common Slim patterns
- Performance: <500ms for files under 1000 lines
- Error rate: <2% for well-formed Slim files
- Test coverage: >80% for core conversion logic

### User Experience Metrics
- Time to first successful conversion: <2 minutes
- User error rate: <5% for basic operations
- Feature adoption: Context menu usage >60%
- User satisfaction: Positive feedback target >80%

## Risk Mitigation

### Technical Risks
- **Complex Slim syntax edge cases**: Incremental parser development with extensive test cases
- **Performance with large files**: Streaming parser implementation and progress tracking
- **VS Code API compatibility**: Use stable API subset and version targeting

### Timeline Risks
- **Scope creep**: Strict MVP definition and feature prioritization
- **Integration complexity**: Early VS Code integration testing
- **Testing overhead**: Automated testing pipeline from Day 1

## Deployment Strategy

### Development Environment
- Local VS Code extension development setup
- Hot reload for rapid iteration
- Integrated debugging and testing

### Distribution
- VS Code Marketplace publication
- GitHub repository for open source collaboration
- Automated CI/CD pipeline for releases
- Version management and update notifications

This specification provides a comprehensive roadmap for building a production-ready Slim-to-ERB VS Code extension within the 6-day rapid development cycle while maintaining quality and user experience standards.