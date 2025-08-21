# Publishing to VS Code Marketplace

## First-Time Setup

### 1. Create a Publisher Account

1. Go to https://marketplace.visualstudio.com/manage
2. Sign in with your Microsoft account
3. Create a new publisher with ID matching your package.json publisher field (e.g., "abyrd")

### 2. Create a Personal Access Token

1. Go to https://dev.azure.com/
2. Click on your profile → Security → Personal Access Tokens
3. Click "New Token"
4. Configure the token:
   - **Name**: vsce-publish
   - **Organization**: Select "All accessible organizations"
   - **Expiration**: Set to 1 year (maximum)
   - **Scopes**: Click "Show all scopes" and select:
     - **Marketplace**:
       - ✅ Acquire
       - ✅ Publish
       - ✅ Manage
5. Click "Create" and copy the token immediately (you won't see it again!)

### 3. Login to VSCE

```bash
vsce login <publisher-name>
# Enter your Personal Access Token when prompted
```

Or use the token directly:
```bash
vsce publish -p <your-personal-access-token>
```

## Publishing Commands

### Package Only (No Publishing)
```bash
vsce package
# Creates a .vsix file locally
```

### Publish to Marketplace
```bash
# Increment patch version and publish
vsce publish patch

# Or publish specific version
vsce publish 1.0.0

# Or use existing .vsix file
vsce publish --packagePath slim-to-erb-0.1.0.vsix
```

## Alternative: Open VSX Registry

For open-source compatibility, also publish to Open VSX:

1. Create account at https://open-vsx.org/
2. Generate access token in your profile settings
3. Install ovsx CLI: `npm install -g ovsx`
4. Publish: `ovsx publish -p <token>`

## GitHub Actions Automation

Add these secrets to your GitHub repository:
- `VSCE_PAT`: Your Azure DevOps Personal Access Token
- `OVSX_PAT`: Your Open VSX Access Token

The release workflow will automatically publish when you create a GitHub release.

## Testing Before Publishing

1. Package the extension: `vsce package`
2. Install locally in VS Code:
   - Open Command Palette (Cmd/Ctrl+Shift+P)
   - Run "Extensions: Install from VSIX..."
   - Select your .vsix file
3. Test all features thoroughly
4. Uninstall test version before publishing

## Checklist Before Publishing

- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Run all tests: `npm test`
- [ ] Test extension locally with .vsix
- [ ] Commit all changes
- [ ] Create git tag: `git tag v0.1.0`
- [ ] Push tag: `git push --tags`

## Common Issues

### "Access Denied" Error
- Make sure your publisher ID in package.json matches your marketplace publisher
- Ensure your PAT has all Marketplace scopes selected
- Verify PAT hasn't expired

### "Publisher not found"
- Create publisher at https://marketplace.visualstudio.com/manage first
- Update package.json with correct publisher ID

### Package Too Large
- Check .vscodeignore file
- Exclude unnecessary files (node_modules, tests, etc.)
- Run `vsce ls` to see what's included