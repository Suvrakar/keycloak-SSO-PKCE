import { generateCodeVerifier, generateCodeChallenge, generateState } from '../utils/pkce';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface UserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name?: string;
  family_name?: string;
}

export interface AuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

class AuthService {
  private readonly keycloakUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly redirectUri: string;

  constructor() {
    this.keycloakUrl = 'https://oneid.ticket-bangla.com';
    this.realm = 'oneid';
    this.clientId = 'react-client';
    this.redirectUri = window.location.origin + '/callback';
  }

  // Step 1: Initiate OAuth 2.0 Authorization Code Flow with PKCE
  async initiateLogin(): Promise<void> {
    try {
      // Generate PKCE parameters
      const codeVerifier = generateCodeVerifier();
      const state = generateState();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Store PKCE parameters securely (sessionStorage for this demo)
      sessionStorage.setItem('code_verifier', codeVerifier);
      sessionStorage.setItem('oauth_state', state);

      // Build authorization URL
      const authUrl = new URL(`${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/auth`);
      
      const params = new URLSearchParams({
        client_id: this.clientId,
        response_type: 'code',
        scope: 'openid email profile',
        redirect_uri: this.redirectUri,
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });

      authUrl.search = params.toString();

      // Redirect to Keycloak
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Failed to initiate login:', error);
      throw new Error('Failed to initiate authentication');
    }
  }

  // Step 2: Handle callback and exchange code for tokens
  async handleCallback(): Promise<{ tokens: TokenResponse; userInfo: UserInfo }> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    // Handle errors
    if (error) {
      const errorDescription = urlParams.get('error_description');
      throw new Error(`Authentication failed: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
    }

    if (!code || !state) {
      throw new Error('Missing authorization code or state parameter');
    }

    // Validate state parameter
    const storedState = sessionStorage.getItem('oauth_state');
    if (storedState !== state) {
      throw new Error('Invalid state parameter - possible CSRF attack');
    }

    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(code);
    
    // Fetch user information
    const userInfo = await this.getUserInfo(tokens.access_token);

    // Clean up temporary data
    sessionStorage.removeItem('code_verifier');
    sessionStorage.removeItem('oauth_state');

    // Store tokens securely
    this.storeTokens(tokens);

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);

    return { tokens, userInfo };
  }

  // Step 3: Exchange authorization code for tokens
  private async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
    const codeVerifier = sessionStorage.getItem('code_verifier');
    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }

    const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      code: code,
      redirect_uri: this.redirectUri,
      code_verifier: codeVerifier
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token exchange failed: ${errorData.error_description || response.statusText}`);
      }

      const tokens: TokenResponse = await response.json();
      return tokens;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  // Step 4: Get user information
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    const userInfoUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`;

    try {
      const response = await fetch(userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }

      const userInfo: UserInfo = await response.json();
      return userInfo;
    } catch (error) {
      console.error('User info error:', error);
      throw new Error('Failed to fetch user information');
    }
  }

  // Step 5: Refresh access token
  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      refresh_token: refreshToken
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString()
      });

      if (!response.ok) {
        // Refresh token is invalid, user needs to re-authenticate
        this.clearTokens();
        throw new Error('Refresh token is invalid');
      }

      const tokens: TokenResponse = await response.json();
      this.storeTokens(tokens);
      return tokens;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  // Step 6: Validate current token
  async validateToken(): Promise<boolean> {
    const accessToken = this.getStoredAccessToken();
    if (!accessToken) {
      return false;
    }

    try {
      const userInfo = await this.getUserInfo(accessToken);
      return !!userInfo.sub;
    } catch (error) {
      // Token might be expired, try to refresh
      try {
        await this.refreshToken();
        return true;
      } catch (refreshError) {
        this.clearTokens();
        return false;
      }
    }
  }

  // Step 7: Logout
  async logout(): Promise<void> {
    const refreshToken = this.getStoredRefreshToken();
    const idToken = sessionStorage.getItem('id_token');
    // Revoke refresh token if available
    if (refreshToken) {
      try {
        const revokeUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/revoke`;
        await fetch(revokeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: this.clientId,
            refresh_token: refreshToken
          }).toString()
        });
      } catch (error) {
        console.warn('Failed to revoke refresh token:', error);
      }
    }

    // Clear stored tokens
    this.clearTokens();

    // Redirect to Keycloak logout
    const logoutUrl = new URL(`${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout`);
    if (idToken) {
      logoutUrl.searchParams.set('id_token_hint', idToken);
    }
    logoutUrl.searchParams.set('post_logout_redirect_uri', window.location.origin);
    window.location.href = logoutUrl.toString();
  }

  // Token storage methods
  private storeTokens(tokens: TokenResponse): void {
    sessionStorage.setItem('access_token', tokens.access_token);
    sessionStorage.setItem('refresh_token', tokens.refresh_token);
    sessionStorage.setItem('token_expires_at', (Date.now() + tokens.expires_in * 1000).toString());
    if ((tokens as any).id_token) {
      sessionStorage.setItem('id_token', (tokens as any).id_token);
    }
  }

  private getStoredAccessToken(): string | null {
    return sessionStorage.getItem('access_token');
  }

  private getStoredRefreshToken(): string | null {
    return sessionStorage.getItem('refresh_token');
  }

  private clearTokens(): void {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('token_expires_at');
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    const expiresAt = sessionStorage.getItem('token_expires_at');
    if (!expiresAt) return true;
    
    // Add 30 second buffer
    return Date.now() > parseInt(expiresAt) - 30000;
  }

  // Get current user info
  async getCurrentUser(): Promise<UserInfo | null> {
    try {
      const accessToken = this.getStoredAccessToken();
      if (!accessToken) return null;

      if (this.isTokenExpired()) {
        await this.refreshToken();
      }

      const newAccessToken = this.getStoredAccessToken();
      if (!newAccessToken) return null;

      return await this.getUserInfo(newAccessToken);
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }
}

export const authService = new AuthService(); 