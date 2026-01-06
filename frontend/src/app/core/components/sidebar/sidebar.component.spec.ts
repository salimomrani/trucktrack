import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal, computed } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from './sidebar.component';
import { StoreFacade } from '../../../store/store.facade';
import { NavigationService } from '../../services/navigation.service';
import { User, UserRole } from '../../models/auth.model';
import { NavItem } from '../../models/navigation.model';

/**
 * Unit tests for SidebarComponent
 * Feature: Frontend Tests - Critical Components
 * 
 * Tests sidebar component functionality:
 * - Navigation rendering
 * - User display
 * - Logout
 * - Navigation click handling
 */
describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockStoreFacade: jasmine.SpyObj<StoreFacade>;
  let mockNavigationService: jasmine.SpyObj<NavigationService>;

  const mockUser: User = {
    id: '1',
    email: 'admin@trucktrack.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.ADMIN,
    isActive: true
  };

  const mockNavCategories = [
    {
      category: 'main',
      label: 'Principal',
      items: [
        { route: '/map', label: 'Carte', icon: 'map', roles: [] },
        { route: '/alerts', label: 'Alertes', icon: 'notifications', roles: [] }
      ] as NavItem[]
    }
  ];

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    const currentUserSignal = signal(mockUser);
    const isAuthenticatedSignal = signal(true);
    const unreadCountSignal = signal(3);
    
    mockStoreFacade = jasmine.createSpyObj('StoreFacade', ['logout']);
    Object.defineProperty(mockStoreFacade, 'currentUser', {
      get: () => currentUserSignal,
      configurable: true
    });
    Object.defineProperty(mockStoreFacade, 'isAuthenticated', {
      get: () => isAuthenticatedSignal,
      configurable: true
    });
    Object.defineProperty(mockStoreFacade, 'unreadCount', {
      get: () => unreadCountSignal,
      configurable: true
    });
    mockNavigationService = jasmine.createSpyObj('NavigationService', [
      'getSidebarNavigation',
      'getCategoryLabel'
    ], {
      getSidebarNavigation: jasmine.createSpy('getSidebarNavigation').and.returnValue(mockNavCategories),
      getCategoryLabel: jasmine.createSpy('getCategoryLabel').and.returnValue('Principal')
    });

    await TestBed.configureTestingModule({
      imports: [SidebarComponent, RouterTestingModule.withRoutes([]), TranslateModule.forRoot()],
      providers: [
        { provide: StoreFacade, useValue: mockStoreFacade },
        { provide: NavigationService, useValue: mockNavigationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Navigation', () => {
    it('should get navigation categories from service', () => {
      expect(component.navCategories().length).toBe(1);
      expect(component.navCategories()[0].category).toBe('main');
    });

    it('should get category label from service', () => {
      const label = component.getCategoryLabel('main');
      expect(mockNavigationService.getCategoryLabel).toHaveBeenCalledWith('main');
      expect(label).toBe('Principal');
    });

    it('should check if route is alerts route', () => {
      const alertsItem: NavItem = { route: '/alerts', label: 'Alertes', icon: 'notifications', roles: [] };
      const mapItem: NavItem = { route: '/map', label: 'Carte', icon: 'map', roles: [] };
      
      expect(component.isAlertsRoute(alertsItem)).toBe(true);
      expect(component.isAlertsRoute(mapItem)).toBe(false);
    });

    it('should emit navigation click event', () => {
      spyOn(component.navigationClick, 'emit');
      component.onNavClick();
      expect(component.navigationClick.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('User display', () => {
    it('should get current user from store', () => {
      expect(component.currentUser()).toEqual(mockUser);
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
      fixture = TestBed.createComponent(SidebarComponent);
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
      fixture = TestBed.createComponent(SidebarComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component.getUserDisplayName()).toBe('');
    });

    it('should get user initials from first and last name', () => {
      expect(component.getInitials()).toBe('JD');
    });

    it('should get user initials from first name only', () => {
      const currentUserSignal = signal({ ...mockUser, lastName: '' });
      Object.defineProperty(mockStoreFacade, 'currentUser', {
        get: () => currentUserSignal,
        configurable: true
      });
      fixture = TestBed.createComponent(SidebarComponent);
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
      fixture = TestBed.createComponent(SidebarComponent);
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
      fixture = TestBed.createComponent(SidebarComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component.getInitials()).toBe('?');
    });

    it('should get current user role', () => {
      expect(component.currentUserRole()).toBe(UserRole.ADMIN);
    });

    it('should return null role if no user', () => {
      const currentUserSignal = signal(null);
      Object.defineProperty(mockStoreFacade, 'currentUser', {
        get: () => currentUserSignal,
        configurable: true
      });
      fixture = TestBed.createComponent(SidebarComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component.currentUserRole()).toBeNull();
    });
  });

  describe('Notifications badge', () => {
    it('should display unread count', () => {
      expect(component.unreadCount()).toBe(3);
    });

    it('should format badge count correctly', () => {
      expect(component.formatBadge(5)).toBe('5');
      expect(component.formatBadge(99)).toBe('99');
      expect(component.formatBadge(100)).toBe('99+');
      expect(component.formatBadge(150)).toBe('99+');
    });
  });

  describe('Logout', () => {
    it('should logout and navigate to login', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');
      component.logout();
      expect(mockStoreFacade.logout).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});

