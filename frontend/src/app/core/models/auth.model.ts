// Authentication related models and interfaces

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  type: string;
  email: string;
  role: string;
  expiresIn: number;
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
  ADMIN = 'ADMIN',
  FLEET_MANAGER = 'FLEET_MANAGER',
  DRIVER = 'DRIVER',
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
  sub: string; // email or user ID
  username?: string; // email
  userId?: string; // user ID
  email?: string; // email
  role: string;
  firstName?: string;
  lastName?: string;
  exp: number;
  iat: number;
}
