import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import { Notification, NotificationPage, NotificationStats } from '../models/notification.model';

/**
 * Unit tests for NotificationService
 * Feature: 014-frontend-tests
 * T021: Create notification.service.spec.ts with TestBed + HttpClientTestingModule
 *
 * Tests notification HTTP operations (not WebSocket).
 */
describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  const mockNotification: Notification = {
    id: 'notif-1',
    userId: 'user-1',
    alertRuleId: 'rule-1',
    truckId: 'truck-1',
    notificationType: 'GEOFENCE_ENTER',
    title: 'Geofence Entry',
    message: 'Truck ABC-123 entered Depot Zone',
    severity: 'INFO',
    isRead: false,
    latitude: 48.8566,
    longitude: 2.3522,
    triggeredAt: '2025-12-27T10:00:00Z',
    sentAt: '2025-12-27T10:00:01Z'
  };

  const mockNotificationPage: NotificationPage = {
    content: [mockNotification],
    totalElements: 1,
    totalPages: 1,
    size: 20,
    number: 0,
    last: true,
    first: true,
    empty: false
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationService]
    });

    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getNotifications', () => {
    it('should fetch notifications with default pagination', () => {
      service.getNotifications().subscribe(page => {
        expect(page.content.length).toBe(1);
        expect(page.content[0].title).toBe('Geofence Entry');
      });

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/notification/v1/notifications' &&
        r.params.get('page') === '0' &&
        r.params.get('size') === '20'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockNotificationPage);
    });

    it('should fetch notifications with custom pagination', () => {
      service.getNotifications(2, 50).subscribe();

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/notification/v1/notifications' &&
        r.params.get('page') === '2' &&
        r.params.get('size') === '50'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockNotificationPage);
    });
  });

  describe('getUnreadNotifications', () => {
    it('should fetch unread notifications', () => {
      service.getUnreadNotifications().subscribe(notifications => {
        expect(notifications.length).toBe(1);
        expect(notifications[0].isRead).toBe(false);
      });

      const req = httpMock.expectOne('http://localhost:8000/notification/v1/notifications/unread');
      expect(req.request.method).toBe('GET');
      req.flush([mockNotification]);
    });
  });

  describe('getUnreadCount', () => {
    it('should fetch unread notification count', () => {
      service.getUnreadCount().subscribe(response => {
        expect(response.count).toBe(5);
      });

      const req = httpMock.expectOne('http://localhost:8000/notification/v1/notifications/unread/count');
      expect(req.request.method).toBe('GET');
      req.flush({ count: 5 });
    });
  });

  describe('getNotificationStats', () => {
    it('should fetch notification statistics', () => {
      const mockStats: NotificationStats = {
        unread: 5,
        critical: 2,
        warning: 10,
        info: 50
      };

      service.getNotificationStats().subscribe(stats => {
        expect(stats.unread).toBe(5);
        expect(stats.critical).toBe(2);
      });

      const req = httpMock.expectOne('http://localhost:8000/notification/v1/notifications/stats');
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });
  });

  describe('getNotificationById', () => {
    it('should fetch a single notification by ID', () => {
      service.getNotificationById('notif-1').subscribe(notification => {
        expect(notification).toEqual(mockNotification);
      });

      const req = httpMock.expectOne('http://localhost:8000/notification/v1/notifications/notif-1');
      expect(req.request.method).toBe('GET');
      req.flush(mockNotification);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', () => {
      const readNotification = { ...mockNotification, isRead: true };

      service.markAsRead('notif-1').subscribe(notification => {
        expect(notification.isRead).toBe(true);
      });

      const req = httpMock.expectOne('http://localhost:8000/notification/v1/notifications/notif-1/read');
      expect(req.request.method).toBe('PATCH');
      req.flush(readNotification);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', () => {
      service.markAllAsRead().subscribe(response => {
        expect(response.markedCount).toBe(5);
      });

      const req = httpMock.expectOne('http://localhost:8000/notification/v1/notifications/mark-all-read');
      expect(req.request.method).toBe('POST');
      req.flush({ markedCount: 5 });
    });
  });

  describe('getRecentNotifications', () => {
    it('should fetch recent notifications with default limit', () => {
      service.getRecentNotifications().subscribe(notifications => {
        expect(notifications.length).toBe(1);
      });

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/notification/v1/notifications/recent' &&
        r.params.get('limit') === '100'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockNotification]);
    });

    it('should fetch recent notifications with custom limit', () => {
      service.getRecentNotifications(50).subscribe();

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/notification/v1/notifications/recent' &&
        r.params.get('limit') === '50'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockNotification]);
    });
  });

  describe('getRecentNotificationsPaged', () => {
    it('should fetch recent notifications with pagination', () => {
      service.getRecentNotificationsPaged(1, 10).subscribe(page => {
        expect(page.content.length).toBe(1);
      });

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/notification/v1/notifications/recent/paged' &&
        r.params.get('page') === '1' &&
        r.params.get('size') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockNotificationPage);
    });
  });

  describe('getNotificationsForTruck', () => {
    it('should fetch notifications for a specific truck', () => {
      service.getNotificationsForTruck('truck-1').subscribe(notifications => {
        expect(notifications.length).toBe(1);
        expect(notifications[0].truckId).toBe('truck-1');
      });

      const req = httpMock.expectOne('http://localhost:8000/notification/v1/notifications/truck/truck-1');
      expect(req.request.method).toBe('GET');
      req.flush([mockNotification]);
    });
  });

  describe('unreadCount signal', () => {
    it('should start at 0', () => {
      expect(service.unreadCount()).toBe(0);
    });

    it('should decrement when decrementUnreadCount is called', () => {
      // Set initial count
      service.unreadCount.set(5);
      expect(service.unreadCount()).toBe(5);

      service.decrementUnreadCount();
      expect(service.unreadCount()).toBe(4);
    });

    it('should not go below 0', () => {
      service.unreadCount.set(0);
      service.decrementUnreadCount();
      expect(service.unreadCount()).toBe(0);
    });

    it('should reset to 0 when resetUnreadCount is called', () => {
      service.unreadCount.set(10);
      service.resetUnreadCount();
      expect(service.unreadCount()).toBe(0);
    });
  });
});
