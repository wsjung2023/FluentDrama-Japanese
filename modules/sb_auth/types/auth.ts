// SB Auth Types
export interface SBAuthConfig {
  googleClientId?: string;
  googleClientSecret?: string;
  sessionSecret: string;
  database: {
    url: string;
    type: 'postgresql' | 'mysql' | 'sqlite';
  };
  redirectUrls: {
    success: string;
    failure: string;
  };
  appName: string;
}

export interface SBUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isAdmin?: boolean;
  subscriptionTier?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SBAuthState {
  user: SBUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface SBLoginCredentials {
  email: string;
  password: string;
}

export interface SBRegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface SBAuthResult {
  success: boolean;
  user?: SBUser;
  error?: string;
}