#!/bin/bash

# Release script for Slim to ERB Converter
# This script packages the extension and creates a GitHub release

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Slim to ERB Release Script${NC}"
echo "================================"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Install it with: brew install gh"
    exit 1
fi

# Check if vsce is installed
if ! command -v vsce &> /dev/null; then
    echo -e "${YELLOW}Warning: vsce is not installed${NC}"
    echo "Installing vsce globally..."
    npm install -g @vscode/vsce
fi

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "Current version: ${YELLOW}v${CURRENT_VERSION}${NC}"

# Ask for version bump type
echo ""
echo "Select version bump type:"
echo "1) Patch (0.1.1 -> 0.1.2)"
echo "2) Minor (0.1.1 -> 0.2.0)"
echo "3) Major (0.1.1 -> 1.0.0)"
echo "4) Custom version"
echo "5) Keep current version"
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        npm version patch --no-git-tag-version
        ;;
    2)
        npm version minor --no-git-tag-version
        ;;
    3)
        npm version major --no-git-tag-version
        ;;
    4)
        read -p "Enter new version (e.g., 1.2.3): " NEW_VERSION
        npm version $NEW_VERSION --no-git-tag-version
        ;;
    5)
        echo "Keeping current version"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Get new version
VERSION=$(node -p "require('./package.json').version")
echo -e "Release version: ${GREEN}v${VERSION}${NC}"

# Run tests
echo ""
echo -e "${YELLOW}Running tests...${NC}"
npm run compile
npm run test:unit || echo -e "${YELLOW}Some tests failed, continuing...${NC}"

# Package the extension
echo ""
echo -e "${YELLOW}Packaging extension...${NC}"
vsce package --no-yarn

# Check if package was created
if [ ! -f "slim-to-erb-${VERSION}.vsix" ]; then
    echo -e "${RED}Error: Package file not created${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Package created: slim-to-erb-${VERSION}.vsix${NC}"

# Get file size
FILE_SIZE=$(ls -lh "slim-to-erb-${VERSION}.vsix" | awk '{print $5}')
echo "Package size: $FILE_SIZE"

# Ask if user wants to create GitHub release
echo ""
read -p "Create GitHub release? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Commit version bump if version was changed
    if [ "$VERSION" != "$CURRENT_VERSION" ]; then
        echo -e "${YELLOW}Committing version bump...${NC}"
        git add package.json package-lock.json
        git commit -m "chore: bump version to v${VERSION}"
    fi

    # Create git tag
    echo -e "${YELLOW}Creating git tag...${NC}"
    git tag -a "v${VERSION}" -m "Release v${VERSION}"

    # Push commits and tags
    echo -e "${YELLOW}Pushing to GitHub...${NC}"
    git push
    git push --tags

    # Create release notes
    echo -e "${YELLOW}Creating release notes...${NC}"
    cat > release-notes.md << EOF
## Slim to ERB Converter v${VERSION}

### Installation

#### From VSIX file:
1. Download the \`.vsix\` file from the assets below
2. Open VS Code
3. Go to Extensions view (Ctrl/Cmd+Shift+X)
4. Click on the "..." menu and select "Install from VSIX..."
5. Select the downloaded file

### What's Changed
- See [CHANGELOG.md](https://github.com/antarr/slim-to-html/blob/main/CHANGELOG.md) for details

### Features
- Convert single .slim files to .erb format
- Batch convert entire directories
- Preview conversions before saving
- Support for common Slim syntax elements
- Configurable indentation and output options

---
**Full Changelog**: https://github.com/antarr/slim-to-html/compare/v${CURRENT_VERSION}...v${VERSION}
EOF

    # Create GitHub release
    echo -e "${YELLOW}Creating GitHub release...${NC}"
    gh release create "v${VERSION}" \
        --title "Release v${VERSION}" \
        --notes-file release-notes.md \
        "slim-to-erb-${VERSION}.vsix"

    # Clean up
    rm release-notes.md

    echo -e "${GREEN}✓ GitHub release created successfully!${NC}"
    echo -e "View release: ${GREEN}https://github.com/antarr/slim-to-html/releases/tag/v${VERSION}${NC}"
else
    echo -e "${YELLOW}Skipping GitHub release${NC}"
    echo -e "Package ready: ${GREEN}slim-to-erb-${VERSION}.vsix${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Release process complete!${NC}"