# Keycloak SSO Integration Guide (React + PKCE)

## Overview

This guide explains how to integrate Keycloak as an identity provider in a React Single Page Application (SPA) using the OAuth 2.0 Authorization Code Flow with PKCE (Proof Key for Code Exchange). This is the most secure and recommended approach for browser-based applications.

---

## Prerequisites

- A running Keycloak server (with admin access)
- A Keycloak realm (e.g., `oneid`)
- A Keycloak client configured for your app (e.g., `react-client`)
- A React app (e.g., created with Vite or Create React App)

---

## Keycloak Client Configuration

1. **Create or select a client** in your realm (e.g., `react-client`).
2. **Settings:**
   - **Client ID:** `react-client`
   - **Access Type:** `public`
   - **Standard Flow Enabled:** Yes (checked)
   - **Valid Redirect URIs:**  
     ```
     http://localhost:5174/*
     ```
     (or use a wildcard for dev: `http://localhost:*/callback`)
   - **Web Origins:**  
     ```
     http://localhost:5174
     ```
   - **Direct Access Grants:** Not required
   - **Implicit Flow:** Unchecked
   - **Service Accounts:** Unchecked
3. **Save** your changes.

---

## React App Integration

### 1. **Install Dependencies**

```bash
npm install react-router-dom
```

### 2. **PKCE Utility Functions**

Create `src/utils/pkce.ts`:

```ts
export function generateCodeVerifier(length: number = 128): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += charset.charAt(randomValues[i] % charset.length);
  }
  return result;
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
```

---

### 3. **Auth Service**

Create `src/services/authService.ts` (simplified for clarity):

```ts
import { generateCodeVerifier, generateCodeChallenge, generateState } from '../utils/pkce';

class AuthService {
  private keycloakUrl = 'https://your-keycloak-server.com';
  private realm = 'your-realm';
  private clientId = 'react-client';
  private redirectUri = window.location.origin + '/callback';

  async initiateLogin() {
    const codeVerifier = generateCodeVerifier();
    const state = generateState();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    sessionStorage.setItem('code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      scope: 'openid email profile',
      redirect_uri: this.redirectUri,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    window.location.href = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/auth?${params}`;
  }

  async handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    if (!code || !state) throw new Error('Missing code or state');
    if (sessionStorage.getItem('oauth_state') !== state) throw new Error('Invalid state');

    const codeVerifier = sessionStorage.getItem('code_verifier');
    const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      code,
      redirect_uri: this.redirectUri,
      code_verifier: codeVerifier!
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    const tokens = await response.json();
    if (!response.ok) throw new Error(tokens.error_description || 'Token exchange failed');

    // Store tokens
    sessionStorage.setItem('access_token', tokens.access_token);
    sessionStorage.setItem('refresh_token', tokens.refresh_token);
    sessionStorage.setItem('id_token', tokens.id_token);
    // Clean up
    sessionStorage.removeItem('code_verifier');
    sessionStorage.removeItem('oauth_state');
    window.history.replaceState({}, document.title, window.location.pathname);
    return tokens;
  }

  async logout() {
    const idToken = sessionStorage.getItem('id_token');
    sessionStorage.clear();
    const logoutUrl = new URL(`${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout`);
    if (idToken) logoutUrl.searchParams.set('id_token_hint', idToken);
    logoutUrl.searchParams.set('post_logout_redirect_uri', window.location.origin);
    window.location.href = logoutUrl.toString();
  }
}

export const authService = new AuthService();
```

---

### 4. **React Context and Components**

- Use React Context to provide authentication state and actions.
- Create `Login`, `Callback`, `Dashboard`, and `ProtectedRoute` components.
- In `Callback`, use a `useRef` guard to prevent double execution.

---

### 5. **Routing**

Use `react-router-dom` to define routes for `/login`, `/callback`, `/dashboard`, etc.

---

### 6. **Logout**

Call `authService.logout()` when the user clicks logout. This will redirect to Keycloak's logout endpoint with the required `id_token_hint`.

---

## **Best Practices**

- Always use PKCE for SPAs.
- Store tokens in `sessionStorage` (not `localStorage`) for better security.
- Use a `useRef` guard in your callback handler to prevent double token exchange.
- Never expose a client secret in frontend code.
- Use HTTPS in production.

---

## **Troubleshooting**

- **400 Bad Request / Invalid redirect_uri:**  
  Make sure the redirect URI in Keycloak matches exactly what your app uses.
- **Code not valid / invalid_grant:**  
  Only use the code once. Don't refresh the callback page. Use a single tab.
- **Missing parameters: id_token_hint:**  
  Pass the `id_token` as `id_token_hint` in the logout URL.

---

## **References**

- [Keycloak Docs: Securing Applications](https://www.keycloak.org/docs/latest/securing_apps/)
- [OAuth 2.0 for Browser-Based Apps (RFC 8252)](https://datatracker.ietf.org/doc/html/rfc8252)
- [Keycloak PKCE Support](https://www.keycloak.org/docs/latest/securing_apps/#pkce)

---

## **Summary Flow**

1. User clicks "Sign In with Keycloak".
2. App generates PKCE params, redirects to Keycloak.
3. User authenticates, Keycloak redirects back with code.
4. App exchanges code for tokens using PKCE.
5. App stores tokens, fetches user info, and updates UI.
6. User can log out, which clears tokens and redirects to Keycloak logout.

---

**This guide covers the full secure integration of Keycloak SSO with React using OAuth 2.0 and PKCE.** 