export interface CreateC1AppConfig {
  projectName: string;
  template: string;
}

export interface AuthCredentials {
  email?: string;
  password?: string;
  token?: string;
}

export interface AuthSession {
  token: string;
  refreshToken?: string;
}

export interface BrowserAuthRequest {
  authUrl: string;
  requestToken: string;
  expiresAt: Date;
}

export interface BrowserAuthResponse {
  token: string;
  expiresAt: Date;
  refreshToken?: string;
}

export interface OAuthConfig {
  issuerUrl: string;
  clientId: string;
  redirectUri?: string;
  scopes?: string[];
}

export interface AuthenticationResult {
  apiKey: string;
  keyId?: string;
  accessToken?: string;
  refreshToken?: string;
  userInfo?: Record<string, unknown> | undefined;
}

export interface ApiKeyResponse {
  key: string;
}

export interface ProjectGenerationOptions {
  name: string;
  template: string;
  directory: string;
}

export interface EnvironmentConfig {
  apiKey: string;
  projectId?: string;
}

export interface CLIOptions {
  projectName?: string;
  template?: "template-c1-component-next" | "template-c1-next";
  debug?: boolean;
  apiKey?: string;
  disableTelemetry?: boolean;
  skipAuth?: boolean;
  nonInteractive?: boolean;
}

export interface StepResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateC1AppStep {
  name: string;
  description: string;
  execute: () => Promise<StepResult>;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Utility types
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
