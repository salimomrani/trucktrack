import { create } from 'zustand';
import { AuthService, TokenService, ApiError, UserInfo } from '../services/api';

type DriverStatus = 'AVAILABLE' | 'IN_DELIVERY' | 'ON_BREAK' | 'OFF_DUTY';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  truckId?: string;
  truckName?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  user: User | null;
  status: DriverStatus;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setStatus: (status: DriverStatus) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isInitialized: false,
  user: null,
  status: 'OFF_DUTY',
  isLoading: false,
  error: null,

  initialize: async () => {
    try {
      const token = await TokenService.getToken();
      if (token) {
        // Try to get current user info
        try {
          const userInfo = await AuthService.getCurrentUser();
          set({
            isAuthenticated: true,
            user: {
              id: userInfo.id,
              email: userInfo.email,
              firstName: userInfo.firstName || userInfo.email.split('@')[0],
              lastName: userInfo.lastName || '',
              role: userInfo.role,
              // Truck assigned to driver
              truckId: '00000000-0000-0000-0000-000000000010',
              truckName: 'TRK-001',
            },
            status: 'AVAILABLE',
          });
        } catch (error) {
          // Token expired or invalid
          await TokenService.clearTokens();
        }
      }
    } catch (error) {
      console.log('Init error:', error);
    } finally {
      set({ isInitialized: true });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      // Call real API
      const response = await AuthService.login(email, password);

      // Get full user info
      let userInfo: UserInfo | null = null;
      try {
        userInfo = await AuthService.getCurrentUser();
      } catch {
        // Use data from login response
      }

      set({
        isAuthenticated: true,
        user: {
          id: userInfo?.id || '1',
          email: response.email,
          firstName: userInfo?.firstName || response.email.split('@')[0],
          lastName: userInfo?.lastName || '',
          role: response.role,
          // Truck assigned to driver
          truckId: '00000000-0000-0000-0000-000000000010',
          truckName: 'TRK-001',
        },
        status: 'AVAILABLE',
        isLoading: false,
      });
      return true;
    } catch (error) {
      let errorMessage = 'Connexion echouee';

      if (error instanceof ApiError) {
        switch (error.code) {
          case 'INVALID_CREDENTIALS':
            errorMessage = 'Email ou mot de passe incorrect';
            break;
          case 'RATE_LIMITED':
            errorMessage = 'Trop de tentatives. Reessayez plus tard.';
            break;
          case 'ACCOUNT_DISABLED':
            errorMessage = 'Compte desactive. Contactez un administrateur.';
            break;
          default:
            errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        // Network error
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = 'Erreur reseau. Verifiez votre connexion.';
        } else {
          errorMessage = error.message;
        }
      }

      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await AuthService.logout();
    set({
      isAuthenticated: false,
      user: null,
      status: 'OFF_DUTY',
    });
  },

  setStatus: (status: DriverStatus) => {
    set({ status });
    // TODO: Send status update to backend
  },

  clearError: () => {
    set({ error: null });
  },
}));
