import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { FootprintService } from "./footprint.service";
import { API_KEY } from "../constants/constants";
import { Country, CountryEmissionsForYear } from "../typings/Country";

describe("FootprintService", () => {
  let service: FootprintService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FootprintService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(FootprintService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return correct headers", () => {
    const headers = service.getHeaders();
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("Authorization")).toBe(
      "Basic " + btoa(`asbarn:${API_KEY}`)
    );
  });

  it("should fetch countries list", () => {
    const mockCountries: Country[] = [
      {
        countryCode: "USA",
        countryName: "United States",
        isoa2: "US",
        score: "80",
        shortName: "USA",
      },
      {
        countryCode: "DEU",
        countryName: "Germany",
        isoa2: "DE",
        score: "85",
        shortName: "Germany",
      },
    ];

    service.getCountries().subscribe((countries) => {
      expect(countries).toEqual(mockCountries);
    });

    const req = httpMock.expectOne(
      "https://api.footprintnetwork.org/v1/countries"
    );
    expect(req.request.method).toBe("GET");
    expect(req.request.headers.get("Authorization")).toBe(
      "Basic " + btoa(`asbarn:${API_KEY}`)
    );
    req.flush(mockCountries);
  });

  it("should fetch country emission data", () => {
    const countryCode = "USA";
    const mockData: CountryEmissionsForYear[] = [
      {
        year: 2000,
        shortName: "USA",
        countryCode: 1,
        countryName: "United States",
        record: "record1",
        cropLand: 1.1,
        grazingLand: 1.2,
        forestLand: 1.3,
        fishingGround: 0.4,
        builtupLand: 0.5,
        carbon: 5.5,
        score: "80",
        value: 8.8,
      },
      {
        year: 2001,
        shortName: "USA",
        countryCode: 1,
        countryName: "United States",
        record: "record2",
        cropLand: 1.1,
        grazingLand: 1.2,
        forestLand: 1.3,
        fishingGround: 0.4,
        builtupLand: 0.5,
        carbon: 6.0,
        score: "81",
        value: 9.0,
      },
    ];

    service.getCountry(countryCode).subscribe((data) => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne(
      `https://api.footprintnetwork.org/v1/data/${countryCode}/all/EFCpc`
    );
    expect(req.request.method).toBe("GET");
    expect(req.request.headers.get("Authorization")).toBe(
      "Basic " + btoa(`asbarn:${API_KEY}`)
    );
    req.flush(mockData);
  });
});
