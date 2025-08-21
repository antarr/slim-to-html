# Creating a Personal Access Token for VS Code Publishing

## Step-by-Step Guide

1. **Go to Azure DevOps**
   - Navigate to: https://dev.azure.com/

2. **Access Personal Access Tokens**
   - Click on User Settings (gear icon) → Personal access tokens
   - Or go directly to: https://dev.azure.com/antarrb/_usersSettings/tokens

3. **Create New Token**
   - Click the "New Token" button

4. **Configure Token Settings**

   ### Name
   - Enter: `vsce-publish` (or any name you prefer)

   ### Organization
   - Select: **All accessible organizations** (IMPORTANT!)
   - Do NOT select just "antarrb"

   ### Expiration
   - Set to maximum (1 year from today)

   ### Scopes
   - Click "Show all scopes" at the bottom
   - Scroll down to find **Marketplace**
   - Check ALL boxes under Marketplace:
     - ✅ Acquire
     - ✅ Publish  
     - ✅ Manage

   ![Marketplace Scopes](https://i.imgur.com/marketplace-scopes.png)

5. **Create and Copy Token**
   - Click "Create"
   - **IMMEDIATELY COPY THE TOKEN** - you won't see it again!
   - Save it somewhere secure (password manager recommended)

## Testing Your Token

```bash
# Test login
vsce login antarrb
# Paste your new token when prompted

# Or test directly with publish (dry run)
vsce publish --pat <your-token> --dry-run
```

## Common Issues

### "Access Denied" Error
This means your token is missing scopes. Make sure:
- Organization is set to "All accessible organizations"
- ALL Marketplace scopes are checked (Acquire, Publish, Manage)

### Token Not Working
- Tokens are case-sensitive - copy exactly
- Make sure there are no extra spaces
- Token might have expired - check expiration date

## Security Notes
- Never commit your token to git
- Store in a password manager
- Rotate tokens regularly
- Use GitHub Secrets for CI/CD automation