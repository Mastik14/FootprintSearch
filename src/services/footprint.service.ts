import { inject, Injectable } from "@angular/core";

import { API_KEY } from "../constants/constants";

import type { Country, CountryEmissionsForYear } from "../typings/Country";

import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class FootprintService {
  private readonly httpClient = inject(HttpClient);

  public getCountries(): Observable<Country[]> {
    return this.httpClient.get<Country[]>(
      "https://api.footprintnetwork.org/v1/countries",
      {
        headers: this.getHeaders(),
      }
    );
  }

  // get a single country by countryCode
  public getCountry(
    countryCode: string
  ): Observable<CountryEmissionsForYear[]> {
    return this.httpClient.get<CountryEmissionsForYear[]>(
      `https://api.footprintnetwork.org/v1/data/${countryCode}/all/EFCpc`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  public getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Basic " + btoa(`asbarn:${API_KEY}`),
    });
  }
}
