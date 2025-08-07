import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  const mockKey = 'carbon_data';
  const testData = { foo: 'bar' };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
    localStorage.clear();
    jasmine.clock().install();
  });

  afterEach(() => {
    localStorage.clear();
    jasmine.clock().uninstall();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store and retrieve data from cache if not expired', () => {
    service.setCache(testData);
    const result = service.getCache<typeof testData>();
    expect(result).toEqual(testData);
  });

  it('should return null and remove item if data is expired', () => {
    const now = Date.now();
    jasmine.clock().mockDate(new Date(now));
    service.setCache(testData);

    jasmine.clock().mockDate(new Date(now + 6 * 60 * 1000));

    const result = service.getCache<typeof testData>();
    expect(result).toBeNull();
    expect(localStorage.getItem(mockKey)).toBeNull();
  });

  it('should return null and remove item if data is malformed', () => {
    localStorage.setItem(mockKey, '{ invalid json');
    const result = service.getCache<any>();
    expect(result).toBeNull();
    expect(localStorage.getItem(mockKey)).toBeNull();
  });

  it('should clear cache correctly', () => {
    service.setCache(testData);
    expect(localStorage.getItem(mockKey)).toBeTruthy();

    service.clearCache();
    expect(localStorage.getItem(mockKey)).toBeNull();
  });
});
