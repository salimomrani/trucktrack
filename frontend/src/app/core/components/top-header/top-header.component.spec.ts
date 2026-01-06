import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { TopHeaderComponent } from './top-header.component';
import { ThemeService } from '../../services/theme.service';
import { StoreFacade } from '../../../store/store.facade';
import { User, UserRole } from '../../models/auth.model';

/**
 * Unit tests for TopHeaderComponent
 * Feature: Frontend Tests - Critical Components
 * 
 * Tests header component functionality:
 * - Theme toggle
 * - Notifications dropdown
 * - User menu dropdown
 * - Logout
 * - User display methods
 */
describe('TopHeaderComponent', () => {
  let component: TopHeaderComponent;
  let fixture: ComponentFixture<TopHeaderComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockThemeService: jasmine.SpyObj<ThemeService>;
  let mockStoreFacade: jasmine.SpyObj<StoreFacade>;

  const mockUser: User = {
    id: '1',
    email: 'admin@trucktrack.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.ADMIN,
    isActive: true
  };

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    const isDarkSignal = signal(false);
    mockThemeService = jasmine.createSpyObj('ThemeService', ['toggle']);
    Object.defineProperty(mockThemeService, 'isDark', {
      get: () => isDarkSignal,
      configurable: true
    });
    
    const currentUserSignal = signal(mockUser);
    const unreadCountSignal = signal(5);
    mockStoreFacade = jasmine.createSpyObj('StoreFacade', ['logout']);
    Object.defineProperty(mockStoreFacade, 'currentUser', {
      get: () => currentUserSignal,
      configurable: true
    });
    Object.defineProperty(mockStoreFacade, 'unreadCount', {
      get: () => unreadCountSignal,
      configurable: true
    });

    await TestBed.configureTestingModule({
      imports: [TopHeaderComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: StoreFacade, useValue: mockStoreFacade }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TopHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Theme toggle', () => {
    it('should toggle theme when toggleTheme is called', () => {
      component.toggleTheme();
      expect(mockThemeService.toggle).toHaveBeenCalledTimes(1);
    });

    it('should reflect dark mode state', () => {
      const isDarkSignal = signal(true);
      Object.defineProperty(mockThemeService, 'isDark', {
        get: () => isDarkSignal,
        configurable: true
      });
      fixture = TestBed.createComponent(TopHeaderComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component.isDark()).toBe(true);
    });
  });

  describe('Notifications dropdown', () => {
    it('should toggle notifications dropdown', () => {
      expect(component.notificationsOpen()).toBe(false);
      
      component.toggleNotifications();
      expect(component.notificationsOpen()).toBe(true);
      expect(component.userMenuOpen()).toBe(false);
      
      component.toggleNotifications();
      expect(component.notificationsOpen()).toBe(false);
    });

    it('should close notifications dropdown', () => {
      component.notificationsOpen.set(true);
      component.closeNotifications();
      expect(component.notificationsOpen()).toBe(false);
    });

    it('should display unread count', () => {
      expect(component.unreadCount()).toBe(5);
    });

    it('should format badge count correctly', () => {
      expect(component.formatBadge(5)).toBe('5');
      expect(component.formatBadge(99)).toBe('99');
      expect(component.formatBadge(100)).toBe('99+');
      expect(component.formatBadge(150)).toBe('99+');
    });
  });

  describe('User menu dropdown', () => {
    it('should toggle user menu dropdown', () => {
      expect(component.userMenuOpen()).toBe(false);
      
      component.toggleUserMenu();
      expect(component.userMenuOpen()).toBe(true);
      expect(component.notificationsOpen()).toBe(false);
      
      component.toggleUserMenu();
      expect(component.userMenuOpen()).toBe(false);
    });

    it('should close user menu dropdown', () => {
      component.userMenuOpen.set(true);
      component.closeUserMenu();
      expect(component.userMenuOpen()).toBe(false);
    });
  });

  describe('Sidebar toggle', () => {
    it('should emit toggleSidebar event', () => {
      spyOn(component.toggleSidebar, 'emit');
      component.onToggleSidebar();
      expect(component.toggleSidebar.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('User display methods', () => {
    it('should get user initials from first and last name', () => {
      expect(component.getInitials()).toBe('JD');
    });

    it('should get user initials from first name only', () => {
      const currentUserSignal = signal({ ...mockUser, lastName: '' });
      Object.defineProperty(mockStoreFacade, 'currentUser', {
        get: () => currentUserSignal,
        configurable: true
      });
      fixture = TestBed.createComponent(TopHeaderComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component.getInitials()).toBe('JO');
    });

    it('should get user initials from email if no name', () => {
      const currentUserSignal = signal({ ...mockUser, firstName: '', lastName: '' });
      Object.defineProperty(mockStoreFacade, 'currentUser', {
        get: () => currentUserSignal,
        configurable: true
      });
      fixture = TestBed.createComponent(TopHeaderComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component.getInitials()).toBe('AD');
    });

    it('should return ? if no user', () => {
      const currentUserSignal = signal(null);
      Object.defineProperty(mockStoreFacade, 'currentUser', {
        get: () => currentUserSignal,
        configurable: true
      });
      fixture = TestBed.createComponent(TopHeaderComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component.getInitials()).toBe('?');
    });

    it('should get user display name from full name', () => {
      expect(component.getUserDisplayName()).toBe('John Doe');
    });

    it('should get user display name from email if no name', () => {
      const currentUserSignal = signal({ ...mockUser, firstName: '', lastName: '' });
      Object.defineProperty(mockStoreFacade, 'currentUser', {
        get: () => currentUserSignal,
        configurable: true
      });
      fixture = TestBed.createComponent(TopHeaderComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component.getUserDisplayName()).toBe('admin@trucktrack.com');
    });

    it('should return empty string if no user', () => {
      const currentUserSignal = signal(null);
      Object.defineProperty(mockStoreFacade, 'currentUser', {
        get: () => currentUserSignal,
        configurable: true
      });
      fixture = TestBed.createComponent(TopHeaderComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component.getUserDisplayName()).toBe('');
    });
  });

  describe('Logout', () => {
    it('should logout and navigate to login', () => {
      component.logout();
      expect(component.userMenuOpen()).toBe(false);
      expect(mockStoreFacade.logout).toHaveBeenCalledTimes(1);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});

