import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TruckService } from './truck.service';
import { TruckStatus, TruckListResponse, Truck } from '../models/truck.model';
import { GPSPosition } from '../models/gps-position.model';

/**
 * Unit tests for TruckService
 * Feature: 014-frontend-tests
 * T019: Create truck.service.spec.ts with TestBed + HttpClientTestingModule
 *
 * Tests truck HTTP operations.
 */
describe('TruckService', () => {
  let service: TruckService;
  let httpMock: HttpTestingController;

  const mockTruck: Truck = {
    id: 'truck-1',
    truckId: 'TRUCK-001',
    licensePlate: 'ABC-123',
    status: TruckStatus.ACTIVE,
    driverName: 'John Doe',
    vehicleType: 'semi',
    currentLatitude: 48.8566,
    currentLongitude: 2.3522,
    currentSpeed: 65.5,
    currentHeading: 180,
    lastUpdate: '2025-12-27T10:00:00Z',
    truckGroupId: 'group-1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-12-27T10:00:00Z'
  };

  const mockTruckList: TruckListResponse = {
    content: [mockTruck],
    size: 100,
    number: 0,
    totalElements: 1,
    totalPages: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TruckService]
    });

    service = TestBed.inject(TruckService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getTrucks', () => {
    it('should fetch trucks with default pagination', () => {
      service.getTrucks().subscribe(response => {
        expect(response).toEqual(mockTruckList);
        expect(response.content.length).toBe(1);
      });

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/location/v1/trucks' &&
        r.params.get('page') === '0' &&
        r.params.get('size') === '100'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockTruckList);
    });

    it('should fetch trucks with status filter', () => {
      service.getTrucks(TruckStatus.ACTIVE).subscribe(response => {
        expect(response).toEqual(mockTruckList);
      });

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/location/v1/trucks' &&
        r.params.get('status') === 'ACTIVE'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockTruckList);
    });

    it('should fetch trucks with truckGroupId filter', () => {
      service.getTrucks(undefined, 'group-1').subscribe(response => {
        expect(response).toEqual(mockTruckList);
      });

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/location/v1/trucks' &&
        r.params.get('truckGroupId') === 'group-1'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockTruckList);
    });

    it('should fetch trucks with custom pagination', () => {
      service.getTrucks(undefined, undefined, 2, 50).subscribe();

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/location/v1/trucks' &&
        r.params.get('page') === '2' &&
        r.params.get('size') === '50'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockTruckList);
    });
  });

  describe('getActiveTrucks', () => {
    it('should fetch all active trucks with large page size', () => {
      service.getActiveTrucks().subscribe();

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/location/v1/trucks' &&
        r.params.get('size') === '1000'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockTruckList);
    });
  });

  describe('getTruckById', () => {
    it('should fetch a single truck by ID', () => {
      service.getTruckById('truck-1').subscribe(truck => {
        expect(truck).toEqual(mockTruck);
        expect(truck.licensePlate).toBe('ABC-123');
      });

      const req = httpMock.expectOne('http://localhost:8000/location/v1/trucks/truck-1');
      expect(req.request.method).toBe('GET');
      req.flush(mockTruck);
    });
  });

  describe('getCurrentPosition', () => {
    it('should fetch current position for a truck', () => {
      const mockPosition: GPSPosition = {
        truckId: 'truck-1',
        latitude: 48.8566,
        longitude: 2.3522,
        speed: 65.5,
        heading: 180,
        timestamp: '2025-12-27T10:00:00Z'
      };

      service.getCurrentPosition('truck-1').subscribe(position => {
        expect(position.latitude).toBe(48.8566);
        expect(position.longitude).toBe(2.3522);
      });

      const req = httpMock.expectOne('http://localhost:8000/location/v1/trucks/truck-1/current-position');
      expect(req.request.method).toBe('GET');
      req.flush(mockPosition);
    });
  });

  describe('searchTrucks', () => {
    it('should search trucks by query', () => {
      service.searchTrucks('ABC').subscribe(trucks => {
        expect(trucks.length).toBe(1);
      });

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/location/v1/trucks/search' &&
        r.params.get('q') === 'ABC'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockTruck]);
    });
  });

  describe('getTrucksInBoundingBox', () => {
    it('should fetch trucks within bounding box', () => {
      service.getTrucksInBoundingBox(48.0, 49.0, 2.0, 3.0).subscribe(trucks => {
        expect(trucks.length).toBe(1);
      });

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/location/v1/trucks/bbox' &&
        r.params.get('minLat') === '48' &&
        r.params.get('maxLat') === '49' &&
        r.params.get('minLng') === '2' &&
        r.params.get('maxLng') === '3'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockTruck]);
    });
  });

  describe('getTrucksHistory', () => {
    it('should fetch truck history for all trucks', () => {
      const mockHistory: GPSPosition[] = [
        { truckId: 'truck-1', latitude: 48.8566, longitude: 2.3522, speed: 60, heading: 180, timestamp: '2025-12-27T09:00:00Z' },
        { truckId: 'truck-1', latitude: 48.8600, longitude: 2.3550, speed: 65, heading: 175, timestamp: '2025-12-27T10:00:00Z' }
      ];

      service.getTrucksHistory('2025-12-27T00:00:00Z', '2025-12-27T23:59:59Z').subscribe(history => {
        expect(history.length).toBe(2);
      });

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/location/v1/trucks/history' &&
        r.params.get('startTime') === '2025-12-27T00:00:00Z' &&
        r.params.get('endTime') === '2025-12-27T23:59:59Z' &&
        !r.params.has('truckId')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockHistory);
    });

    it('should fetch truck history for a specific truck', () => {
      service.getTrucksHistory('2025-12-27T00:00:00Z', '2025-12-27T23:59:59Z', 'truck-1').subscribe();

      const req = httpMock.expectOne(r =>
        r.url === 'http://localhost:8000/location/v1/trucks/history' &&
        r.params.get('truckId') === 'truck-1'
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });
});
