# Development Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Compile TypeScript**
   ```bash
   npm run compile
   ```

3. **Run Tests**
   ```bash
   npm run test:unit
   npm run lint
   ```

4. **Development Mode**
   ```bash
   npm run watch  # Continuous compilation
   ```

5. **Test Extension**
   - Press `F5` in VS Code to open Extension Development Host
   - Open a .slim file
   - Right-click or use Command Palette to test commands

## Project Structure

```
src/
├── extension.ts              # Main extension entry point
├── commands/                 # VS Code command implementations
│   ├── convertFile.ts       # Single file conversion
│   ├── convertDirectory.ts  # Batch conversion
│   └── previewConversion.ts # Preview functionality
├── parser/                  # Core conversion logic
│   ├── slimParser.ts        # Slim syntax parser
│   └── erbGenerator.ts      # ERB output generator
├── utils/                   # Utility modules
│   ├── fileManager.ts       # File operations
│   ├── errorHandler.ts      # Error handling
│   └── progressTracker.ts   # Progress reporting
└── test/                    # Unit tests
    └── parser/              # Parser tests
```

## Commands Available

- **Convert Slim to ERB**: Convert single file
- **Convert Directory (Slim to ERB)**: Batch convert directory
- **Preview Slim to ERB Conversion**: Preview before converting

## Configuration Options

```json
{
  "slimToErb.indentSize": 2,
  "slimToErb.createBackup": true,
  "slimToErb.deleteOriginal": false,
  "slimToErb.outputDirectory": ""
}
```

## Supported Slim Syntax

### ✅ Working Features
- Basic HTML tags (`div`, `p`, `h1`, etc.)
- Class shortcuts (`.container`, `.mt-5`)
- ID shortcuts (`#main`)
- Combined shortcuts (`.container.fluid`, `.box#main`)
- Ruby output (`= variable`, `p= @user.name`)
- Ruby code blocks (`- if condition`)
- Comments (`/ comment`)
- Doctype (`doctype html`)
- Text content (`p Hello World`)

### ⚠️ Partially Working
- Nested structure (basic nesting works, complex nesting needs improvement)
- Explicit attributes (basic parsing implemented, needs refinement)

### ❌ Not Yet Implemented
- Complex attribute expressions
- Multi-line Ruby blocks
- Haml-style attribute hashes
- Inline HTML
- Complex text interpolation

## Development Workflow

### Adding New Features

1. **Write Tests First**
   ```bash
   # Add test to src/test/parser/slimParser.test.ts
   npm run test:unit
   ```

2. **Implement Parser Logic**
   ```typescript
   // Update src/parser/slimParser.ts
   // Add new syntax recognition
   ```

3. **Implement Generator Logic**
   ```typescript
   // Update src/parser/erbGenerator.ts
   // Add ERB output generation
   ```

4. **Test Integration**
   ```bash
   npm run compile
   # Test in VS Code Extension Development Host
   ```

### Debugging

1. **Parser Debug**
   ```javascript
   const { SlimParser } = require('./out/parser/slimParser.js');
   const parser = new SlimParser();
   console.log(parser.parse('your-slim-code'));
   ```

2. **Generator Debug**
   ```javascript
   const { ErbGenerator } = require('./out/parser/erbGenerator.js');
   const generator = new ErbGenerator({ indentSize: 2 });
   console.log(generator.generate(nodes));
   ```

3. **VS Code Extension Debug**
   - Use F5 to launch Extension Development Host
   - Set breakpoints in TypeScript files
   - Use Developer Tools Console

### Common Issues

1. **Compilation Errors**
   ```bash
   npm run compile  # Check TypeScript errors
   npm run lint     # Check style issues
   ```

2. **Test Failures**
   ```bash
   npm run test:unit  # Run unit tests
   # Check test output for specific failures
   ```

3. **Extension Not Loading**
   - Check `package.json` manifest
   - Verify activation events
   - Check VS Code Output panel for errors

## Performance Considerations

- Parser uses single-pass lexical analysis
- Generator builds output incrementally
- File operations use VS Code workspace API
- Progress tracking for batch operations

## Future Improvements

### Priority 1 (Core Functionality)
- Fix nested tag closing logic in ERB generator
- Improve explicit attribute parsing
- Add support for Ruby end statements

### Priority 2 (Enhanced Features)
- Multi-line Ruby block handling
- Better error reporting with line numbers
- Syntax validation and highlighting

### Priority 3 (Quality of Life)
- Undo/redo support
- Live preview panel
- Custom conversion rules
- Integration with other template engines

## Testing Strategy

### Unit Tests
```bash
npm run test:unit
```
- Parser logic testing
- Generator output validation
- Error handling verification

### Integration Tests
```bash
npm run test
```
- VS Code extension API testing
- File system operations
- End-to-end conversion workflows

### Manual Testing
1. Create test .slim files in `examples/`
2. Use extension commands
3. Verify output correctness
4. Test error scenarios

## Packaging and Distribution

```bash
npm run package  # Creates .vsix file
```

Install locally:
```bash
code --install-extension slim-to-erb-0.1.0.vsix
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Slim Template Documentation](http://slim-lang.com/)
- [ERB Documentation](https://docs.ruby-lang.org/en/master/ERB.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)