# Microsoft Graph API Setup for Mail Functionality

## Overview
The mail page in DriftPro requires Microsoft Graph API credentials to connect to Outlook and provide email functionality.

## Prerequisites
- Microsoft 365 account (work or school account)
- Access to Azure Portal (for app registration)

## Setup Steps

### 1. Register App in Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Fill in the details:
   - **Name**: DriftPro Mail App
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Web - `http://localhost:3000/dashboard/mail`
5. Click "Register"

### 2. Configure API Permissions
1. In your app registration, go to "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Choose "Delegated permissions"
5. Add these permissions:
   - `Mail.Read`
   - `Mail.ReadWrite` 
   - `Mail.Send`
   - `User.Read`
   - `offline_access`
6. Click "Grant admin consent"

### 3. Get Credentials
1. In your app registration, go to "Overview"
2. Copy the **Application (client) ID**
3. Copy the **Directory (tenant) ID**

### 4. Configure Environment Variables
Create a `.env.local` file in the project root with:

```bash
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_MICROSOFT_TENANT_ID=your_tenant_id_here
NEXT_PUBLIC_MICROSOFT_REDIRECT_URI=http://localhost:3000/dashboard/mail
```

### 5. Restart Development Server
After adding the environment variables, restart your development server:

```bash
npm run dev
```

## Troubleshooting

### Common Issues
- **"Cannot find module '@azure/msal-browser'"**: Run `npm install @azure/msal-browser`
- **"uninitialized_public_client_application"**: Check that environment variables are set correctly
- **Authentication failed**: Verify your app registration and permissions

### Testing
1. Navigate to `/dashboard/mail`
2. Click "Prøv å koble til" (Try to connect)
3. You should be redirected to Microsoft login
4. After successful authentication, you'll see your emails

## Security Notes
- Never commit `.env.local` to version control
- Use appropriate redirect URIs for production
- Consider using Azure Key Vault for production credentials
- Regularly review and audit API permissions

## Production Deployment
For production, update the redirect URI to your production domain and ensure all environment variables are properly configured in your hosting platform.


