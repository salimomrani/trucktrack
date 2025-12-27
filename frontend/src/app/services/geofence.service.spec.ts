import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GeofenceService } from './geofence.service';
import { Geofence, GeofenceZoneType, GeofenceCheckResult, PointCheckResult } from '../models/geofence.model';

/**
 * Unit tests for GeofenceService
 * Feature: 014-frontend-tests
 * T020: Create geofence.service.spec.ts with TestBed + HttpClientTestingModule
 *
 * Tests geofence CRUD and spatial query operations.
 */
describe('GeofenceService', () => {
  let service: GeofenceService;
  let httpMock: HttpTestingController;

  const mockGeofence: Geofence = {
    id: 'geo-1',
    name: 'Depot Zone',
    zoneType: GeofenceZoneType.DEPOT,
    coordinates: [
      [2.3522, 48.8566],
      [2.3522, 48.8600],
      [2.3600, 48.8600],
      [2.3600, 48.8566]
    ],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GeofenceService]
    });

    service = TestBed.inject(GeofenceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAllGeofences', () => {
    it('should fetch all active geofences', () => {
      service.getAllGeofences().subscribe(geofences => {
        expect(geofences.length).toBe(1);
        expect(geofences[0].name).toBe('Depot Zone');
      });

      const req = httpMock.expectOne('http://localhost:8000/location/v1/geofences');
      expect(req.request.method).toBe('GET');
      req.flush([mockGeofence]);
    });
  });

  describe('getGeofence', () => {
    it('should fetch a single geofence by ID', () => {
      service.getGeofence('geo-1').subscribe(geofence => {
        expect(geofence).toEqual(mockGeofence);
      });

      const req = httpMock.expectOne('http://localhost:8000/location/v1/geofences/geo-1');
      expect(req.request.method).toBe('GET');
      req.flush(mockGeofence);
    });
  });

  describe('getGeofencesByType', () => {
    it('should fetch geofences by zone type', () => {
      service.getGeofencesByType(GeofenceZoneType.DEPOT).subscribe(geofences => {
        expect(geofences.length).toBe(1);
        expect(geofences[0].zoneType).toBe(GeofenceZoneType.DEPOT);
      });

      const req = httpMock.expectOne('http://localhost:8000/location/v1/geofences/type/DEPOT');
      expect(req.request.method).toBe('GET');
      req.flush([mockGeofence]);
    });
  });

  describe('createGeofence', () => {
    it('should create a new geofence', () => {
      const newGeofence: Geofence = {
        ...mockGeofence,
        id: undefined,
        name: 'New Zone'
      };

      service.createGeofence(newGeofence).subscribe(created => {
        expect(created.id).toBe('geo-2');
      });

      const req = httpMock.expectOne('http://localhost:8000/location/v1/geofences');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.name).toBe('New Zone');
      req.flush({ ...newGeofence, id: 'geo-2' });
    });
  });

  describe('updateGeofence', () => {
    it('should update an existing geofence', () => {
      const updated = { ...mockGeofence, name: 'Updated Zone' };

      service.updateGeofence('geo-1', updated).subscribe(geofence => {
        expect(geofence.name).toBe('Updated Zone');
      });

      const req = httpMock.expectOne('http://localhost:8000/location/v1/geofences/geo-1');
      expect(req.request.method).toBe('PUT');
      req.flush(updated);
    });
  });

  describe('deleteGeofence', () => {
    it('should delete a geofence', () => {
      service.deleteGeofence('geo-1').subscribe();

      const req = httpMock.expectOne('http://localhost:8000/location/v1/geofences/geo-1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getGeofencesInBounds', () => {
    it('should fetch geofences within map bounds', () => {
      service.getGeofencesInBounds(2.0, 48.0, 3.0, 49.0).subscribe(geofences => {
        expect(geofences.length).toBe(1);
      });

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/location/v1/geofences/bounds' &&
        r.params.get('minLon') === '2' &&
        r.params.get('minLat') === '48' &&
        r.params.get('maxLon') === '3' &&
        r.params.get('maxLat') === '49'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockGeofence]);
    });
  });

  describe('checkPointInGeofences', () => {
    it('should check if point is inside any geofence', () => {
      const mockResult: GeofenceCheckResult = {
        inside: true,
        geofences: [mockGeofence]
      };

      service.checkPointInGeofences(48.8580, 2.3550).subscribe(result => {
        expect(result.inside).toBe(true);
        expect(result.geofences.length).toBe(1);
      });

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/location/v1/geofences/check' &&
        r.params.get('lat') === '48.858' &&
        r.params.get('lon') === '2.355'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResult);
    });
  });

  describe('checkPointInGeofence', () => {
    it('should check if point is inside a specific geofence', () => {
      const mockResult: PointCheckResult = {
        inside: true,
        distanceMeters: 0
      };

      service.checkPointInGeofence('geo-1', 48.8580, 2.3550).subscribe(result => {
        expect(result.inside).toBe(true);
      });

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/location/v1/geofences/geo-1/check' &&
        r.params.get('lat') === '48.858' &&
        r.params.get('lon') === '2.355'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResult);
    });
  });

  describe('searchGeofences', () => {
    it('should search geofences by name', () => {
      service.searchGeofences('Depot').subscribe(result => {
        expect(result.content.length).toBe(1);
      });

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/location/v1/geofences/search' &&
        r.params.get('name') === 'Depot'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ content: [mockGeofence] });
    });
  });

  describe('getMyGeofences', () => {
    it('should fetch user geofences with pagination', () => {
      service.getMyGeofences(0, 10).subscribe(result => {
        expect(result.content.length).toBe(1);
      });

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/location/v1/geofences/my' &&
        r.params.get('page') === '0' &&
        r.params.get('size') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ content: [mockGeofence] });
    });
  });

  describe('findRestrictedZonesNearby', () => {
    it('should find restricted zones near a point', () => {
      service.findRestrictedZonesNearby(48.8580, 2.3550, 500).subscribe(zones => {
        expect(zones.length).toBe(1);
      });

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/location/v1/geofences/restricted/nearby' &&
        r.params.get('lat') === '48.858' &&
        r.params.get('lon') === '2.355' &&
        r.params.get('distance') === '500'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockGeofence]);
    });
  });
});
