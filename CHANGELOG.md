# Changelog

All notable changes to the Slim to ERB Converter extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of Slim to ERB Converter
- Basic Slim syntax parsing (tags, classes, IDs)
- Ruby code block conversion (`- if`, `- each`)
- Ruby output conversion (`=`, `p=`)
- Attribute handling
- Comment conversion
- Single file conversion command
- Directory batch conversion
- Preview functionality
- VS Code integration with context menus
- Configurable settings (indent, backup, output directory)
- Comprehensive test suite
- GitHub Actions CI/CD workflows

### Known Issues
- Complex attribute parsing needs refinement
- Some edge cases in nested structures
- Multi-line Ruby blocks need improvement

## [0.1.0] - 2025-01-21

### Added
- Initial project setup
- Core parser and generator implementation
- VS Code extension boilerplate
- Test infrastructure with Jest
- Documentation (README, DEVELOPMENT, PRODUCT_SPEC)
- MIT License (Unlicense - public domain)

---

## Release Instructions

To release a new version:

1. Update this CHANGELOG.md with the new version details
2. Update version in package.json
3. Commit changes: `git commit -am "chore: prepare release v0.x.x"`
4. Create a tag: `git tag v0.x.x`
5. Push: `git push && git push --tags`
6. GitHub Actions will automatically:
   - Run tests
   - Build the extension
   - Create a GitHub release
   - Publish to VS Code Marketplace (if VSCE_PAT secret is set)
   - Publish to Open VSX Registry (if OVSX_PAT secret is set)

## Publishing Tokens

To enable automatic publishing, add these secrets to your GitHub repository:

1. **VSCE_PAT**: Personal Access Token for VS Code Marketplace
   - Get it from: https://dev.azure.com/
   - Create a new Personal Access Token with "Marketplace" scope
   
2. **OVSX_PAT**: Access Token for Open VSX Registry
   - Get it from: https://open-vsx.org/
   - Create account and generate token in settings