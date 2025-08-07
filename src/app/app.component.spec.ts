import { Observable, of, throwError } from "rxjs";
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { AppComponent } from "./app.component";
import { FootprintService } from "../services/footprint.service";
import { StorageService } from "../services/storage.service";
import { CountryEmissionsForYear } from "../typings/Country";

describe("AppComponent", () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let footprintServiceSpy: jasmine.SpyObj<FootprintService>;
  let storageServiceSpy: jasmine.SpyObj<StorageService>;

  beforeEach(async () => {
    const footprintSpy = jasmine.createSpyObj("FootprintService", [
      "getCountries",
      "getCountry",
    ]);
    const storageSpy = jasmine.createSpyObj("StorageService", [
      "getCache",
      "setCache",
    ]);

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [
        provideHttpClientTesting(),
        { provide: FootprintService, useValue: footprintSpy },
        { provide: StorageService, useValue: storageSpy },
      ],
    }).compileComponents();

    footprintServiceSpy = TestBed.inject(
      FootprintService
    ) as jasmine.SpyObj<FootprintService>;
    storageServiceSpy = TestBed.inject(
      StorageService
    ) as jasmine.SpyObj<StorageService>;

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (component.intervalId) {
      clearInterval(component.intervalId);
    }
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load data from cache and start interval if cache exists", () => {
    const fakeCache = {
      data: [["US", [{ year: 2000, carbon: 5 }]]],
      minYear: 2000,
      maxYear: 2010,
    };
    storageServiceSpy.getCache.and.returnValue(fakeCache);

    component.ngOnInit();

    expect(component.emissionsMap.size).toBe(1);
    expect(component.minYear).toBe(2000);
    expect(component.maxYear).toBe(2010);
    expect(component.loading).toBeFalse();
    expect(component.intervalId).toBeDefined();
    expect(footprintServiceSpy.getCountries).not.toHaveBeenCalled();
  });

  it("should call getData if no cache", fakeAsync(() => {
    storageServiceSpy.getCache.and.returnValue(null);

    footprintServiceSpy.getCountries.and.returnValue(
      of([
        {
          countryCode: "US",
          shortName: "USA",
          countryName: "United States",
          isoa2: "",
          score: "",
        },
        {
          countryCode: "FR",
          shortName: "FRA",
          countryName: "France",
          isoa2: "",
          score: "",
        },
      ])
    );

    footprintServiceSpy.getCountry.and.callFake((code: string) => {
      if (code === "US") {
        return of([
          {
            year: 2000,
            shortName: "USA",
            countryCode: 1,
            countryName: "United States",
            record: "",
            cropLand: 0,
            grazingLand: 0,
            forestLand: 0,
            fishingGround: 0,
            builtupLand: 0,
            carbon: 10,
            score: "",
            value: 0,
          },
        ]);
      }

      if (code === "FR") {
        return of([
          {
            year: 2000,
            shortName: "FRA",
            countryCode: 2,
            countryName: "France",
            record: "",
            cropLand: 0,
            grazingLand: 0,
            forestLand: 0,
            fishingGround: 0,
            builtupLand: 0,
            carbon: 20,
            score: "",
            value: 0,
          },
        ]);
      }

      return of([]);
    });

    component.ngOnInit();
    tick(1000);

    clearInterval(component.intervalId);
    component.intervalId = null as any;
    fixture.destroy();
  }));

  it("should process data and set visibleData and loading flag", fakeAsync(() => {
    storageServiceSpy.getCache.and.returnValue(null);

    footprintServiceSpy.getCountries.and.returnValue(
      of([
        {
          countryCode: "US",
          shortName: "US",
          countryName: "United States",
          isoa2: "",
          score: "",
        },
        {
          countryCode: "FR",
          shortName: "FR",
          countryName: "France",
          isoa2: "",
          score: "",
        },
      ])
    );

    footprintServiceSpy.getCountry.and.callFake(
      (code: string): Observable<CountryEmissionsForYear[]> => {
        const mockData = (
          shortName: string,
          countryName: string,
          countryCode: number,
          carbon: number
        ): CountryEmissionsForYear[] => [
          {
            year: 2000,
            shortName,
            countryCode,
            countryName,
            record: "",
            cropLand: 0,
            grazingLand: 0,
            forestLand: 0,
            fishingGround: 0,
            builtupLand: 0,
            carbon,
            score: "",
            value: 0,
          },
        ];

        if (code === "US") return of(mockData("US", "United States", 1, 10));
        if (code === "FR") return of(mockData("FR", "France", 2, 20));
        return of([]);
      }
    );

    component.minYear = Number.MAX_SAFE_INTEGER;
    component.maxYear = 0;

    component.ngOnInit();
    tick(1000);

    clearInterval(component.intervalId);

    expect(component.loading).toBeFalse();
    expect(component.emissionsMap.size).toBe(2);
    expect(component.minYear).toBe(2000);
    expect(component.maxYear).toBe(2000);

    component.updateVisibleData();

    expect(component.visibleData.length).toBe(2);
    expect(component.visibleData[0].carbon).toBe(20);
    expect(component.visibleData[1].carbon).toBe(10);
  }));

  it("should handle getCountries error gracefully", fakeAsync(() => {
    storageServiceSpy.getCache.and.returnValue(null);
    footprintServiceSpy.getCountries.and.returnValue(
      throwError(() => new Error("fail"))
    );

    spyOn(console, "error");

    component.ngOnInit();
    tick();

    expect(component.loading).toBeFalse();
    expect(console.error).toHaveBeenCalledWith(
      "Error loading countries:",
      jasmine.any(Error)
    );
  }));

  afterEach(() => {
    if (component && component.intervalId) {
      clearInterval(component.intervalId);
      component.intervalId = null as any;
    }
    fixture.destroy();
  });

  it("should handle getCountry error gracefully", fakeAsync(() => {
    storageServiceSpy.getCache.and.returnValue(null);
    footprintServiceSpy.getCountries.and.returnValue(
      of([
        {
          countryCode: "US",
          shortName: "USA",
          countryName: "United States",
          isoa2: "",
          score: "",
        },
      ])
    );

    footprintServiceSpy.getCountry.and.returnValue(
      throwError(() => new Error("fail"))
    );

    spyOn(console, "error");

    component.ngOnInit();
    tick(1000);

    expect(component.loading).toBeFalse();
    expect(component.emissionsMap.get("USA")).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      "Error loading data for US:",
      jasmine.any(Error)
    );

    clearInterval(component.intervalId);
    component.intervalId = null as any;
    fixture.destroy();
  }));
});
