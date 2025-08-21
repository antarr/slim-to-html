# Slim to ERB Converter - VS Code Extension

A powerful VS Code extension that converts Slim template files to ERB format for Ruby on Rails applications. This extension provides seamless conversion with full syntax support, error handling, and batch processing capabilities.

## Features

- **Single File Conversion**: Convert individual .slim files to .erb format
- **Batch Directory Conversion**: Convert all .slim files in a directory recursively
- **Live Preview**: Preview conversions before saving
- **Comprehensive Syntax Support**: Handles all common Slim syntax patterns
- **Error Handling**: Detailed error reporting with actionable feedback
- **Configurable Options**: Customize indentation, backup creation, and output locations
- **VS Code Integration**: Native command palette and context menu support

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press `F5` to open a new VS Code window with the extension loaded
5. Or package with `npm run package` and install the .vsix file

## Usage

### Convert Single File
- Right-click on a .slim file in the explorer → "Convert Slim to ERB"
- Open a .slim file and use Command Palette → "Slim: Convert to ERB"
- Use keyboard shortcut (if configured)

### Preview Conversion
- Right-click on a .slim file → "Preview Slim to ERB Conversion"
- View side-by-side comparison before converting

### Batch Convert Directory
- Right-click on a folder → "Convert Directory (Slim to ERB)"
- Recursively converts all .slim files in the directory

## Supported Slim Syntax

### Basic Tags
```slim
div
p Hello World
h1.title Main Title
```

### Classes and IDs
```slim
div.container
div#main
div.container#main.large
```

### Attributes
```slim
a href="/path" Link Text
img src="image.jpg" alt="Description"
div data-id="123" class="box"
```

### Ruby Code
```slim
- @users.each do |user|
  p= user.name
  
- if logged_in?
  p Welcome!
  
= link_to 'Home', root_path
```

### Comments
```slim
/ HTML comment
/! Preserved comment
```

## Configuration

Access settings via VS Code Preferences → Extensions → Slim to ERB:

- **Indent Size**: Number of spaces for indentation (default: 2)
- **Create Backup**: Create backup files before conversion (default: true)
- **Delete Original**: Delete original .slim files after conversion (default: false)
- **Output Directory**: Custom output directory (default: same as source)

## Examples

### Input (Slim)
```slim
doctype html
html
  head
    title= @page_title
  body.container
    h1.header Welcome
    - if @user
      p.welcome= "Hello, #{@user.name}"
    - else
      p Please log in
```

### Output (ERB)
```erb
<!DOCTYPE html>
<html>
  <head>
    <title><%= @page_title %></title>
  </head>
  <body class="container">
    <h1 class="header">Welcome</h1>
    <% if @user %>
      <p class="welcome"><%= "Hello, #{@user.name}" %></p>
    <% else %>
      <p>Please log in</p>
    <% end %>
  </body>
</html>
```

## Development

### Setup
```bash
npm install
npm run compile
```

### Testing
```bash
npm run test:unit    # Unit tests
npm run test         # Integration tests
npm run lint         # Linting
```

### Building
```bash
npm run package      # Create .vsix package
```

## Architecture

The extension is built with TypeScript and consists of:

- **Parser**: Custom Slim syntax parser with lexical analysis
- **Generator**: ERB output generator with proper formatting
- **Commands**: VS Code command implementations
- **Utils**: File management, error handling, and progress tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run the test suite
5. Submit a pull request

## License

This is free and unencumbered software released into the public domain - see LICENSE file for details.

Anyone is free to copy, modify, publish, use, compile, sell, or distribute this software for any purpose, commercial or non-commercial, and by any means.