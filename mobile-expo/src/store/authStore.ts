import { create } from 'zustand';
import { AuthService, TokenService, ApiError, UserInfo, LocationService } from '../services/api';
import { registerForPushNotifications, unregisterPushNotifications } from '../services/notifications';

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

          // Get assigned truck from backend
          let truckId: string | undefined;
          let truckName: string | undefined;
          try {
            const truck = await LocationService.getMyTruck();
            if (truck) {
              truckId = truck.id;
              truckName = truck.truckId;
            }
          } catch (truckError) {
            console.log('Could not fetch assigned truck:', truckError);
          }

          set({
            isAuthenticated: true,
            user: {
              id: userInfo.id,
              email: userInfo.email,
              firstName: userInfo.firstName || userInfo.email.split('@')[0],
              lastName: userInfo.lastName || '',
              role: userInfo.role,
              truckId,
              truckName,
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

      // Get assigned truck from backend
      let truckId: string | undefined;
      let truckName: string | undefined;
      try {
        const truck = await LocationService.getMyTruck();
        if (truck) {
          truckId = truck.id;
          truckName = truck.truckId;
        }
      } catch (truckError) {
        console.log('Could not fetch assigned truck:', truckError);
      }

      set({
        isAuthenticated: true,
        user: {
          id: userInfo?.id || '1',
          email: response.email,
          firstName: userInfo?.firstName || response.email.split('@')[0],
          lastName: userInfo?.lastName || '',
          role: response.role,
          truckId,
          truckName,
        },
        status: 'AVAILABLE',
        isLoading: false,
      });

      // T041: Register push token after successful login
      registerForPushNotifications().catch(err => {
        console.log('Push notification registration failed:', err);
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
    // Unregister push token before logout
    await unregisterPushNotifications();

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
