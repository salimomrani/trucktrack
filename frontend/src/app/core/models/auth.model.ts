// Authentication related models and interfaces

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  email: string;
  role: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
}

export enum UserRole {
  FLEET_MANAGER = 'FLEET_MANAGER',
  DISPATCHER = 'DISPATCHER',
  VIEWER = 'VIEWER'
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string; // email
  username: string; // email
  userId: string; // user ID
  role: string;
  exp: number;
  iat: number;
}
