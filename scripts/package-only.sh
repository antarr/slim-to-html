#!/bin/bash

# Simple packaging script without release
# Just creates the .vsix file

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}📦 Packaging Slim to ERB Extension${NC}"
echo "===================================="

# Compile TypeScript
echo -e "${YELLOW}Compiling TypeScript...${NC}"
npm run compile

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo -e "Version: ${GREEN}v${VERSION}${NC}"

# Package the extension
echo -e "${YELLOW}Creating VSIX package...${NC}"
vsce package --no-yarn

# Check if package was created
if [ -f "slim-to-erb-${VERSION}.vsix" ]; then
    FILE_SIZE=$(ls -lh "slim-to-erb-${VERSION}.vsix" | awk '{print $5}')
    echo -e "${GREEN}✓ Package created successfully!${NC}"
    echo "  File: slim-to-erb-${VERSION}.vsix"
    echo "  Size: $FILE_SIZE"
    echo ""
    echo "To install locally:"
    echo "  1. Open VS Code"
    echo "  2. Press Cmd+Shift+P"
    echo "  3. Run 'Extensions: Install from VSIX...'"
    echo "  4. Select slim-to-erb-${VERSION}.vsix"
else
    echo -e "${RED}Error: Package creation failed${NC}"
    exit 1
fi