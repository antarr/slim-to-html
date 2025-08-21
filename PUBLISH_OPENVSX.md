# Publishing to Open VSX Registry (Alternative to VS Code Marketplace)

Open VSX is a vendor-neutral, open-source alternative to the Visual Studio Marketplace.

## Step 1: Create an Open VSX Account

1. Go to https://open-vsx.org/
2. Click "Login" → "Login with GitHub" (easiest option)
3. Authorize the application

## Step 2: Create an Access Token

1. Once logged in, click on your username (top right)
2. Go to "Settings" → "Access Tokens"
3. Click "Generate New Token"
4. Give it a name like "publish-token"
5. Copy the token immediately

## Step 3: Install the Open VSX CLI

```bash
npm install -g ovsx
```

## Step 4: Publish Your Extension

```bash
# Using the .vsix file you already created
ovsx publish slim-to-erb-0.1.0.vsix -p <your-openvsx-token>

# Or create and publish in one step
ovsx publish -p <your-openvsx-token>
```

## Benefits of Open VSX

- ✅ No complex Azure DevOps setup required
- ✅ Works with GitHub authentication
- ✅ Fully open source
- ✅ Used by VS Code alternatives (VSCodium, Gitpod, etc.)
- ✅ Simple token management
- ✅ No organization restrictions

## Your Extension URL

After publishing, your extension will be available at:
```
https://open-vsx.org/extension/antarrb/slim-to-erb
```

## Installing from Open VSX in VS Code

Users can install your extension by:
1. Downloading the .vsix from Open VSX
2. In VS Code: Extensions → "..." → "Install from VSIX..."

## For VS Code Marketplace Later

If you still want to publish to VS Code Marketplace later:
1. You might need to create a Microsoft Azure organization first
2. Or use a different Microsoft account that has organization access
3. Some personal accounts have restrictions on creating "All accessible organizations" tokens