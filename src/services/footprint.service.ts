import { Injectable } from "@angular/core";
import axios from "axios";

import { API_KEY } from "../constants/constants";

import type { Country, CountryEmissionsForYear } from "../typings/Country";
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Injectable({
  providedIn: 'root',
})
export class FootprintService {
  constructor(
    private httpClient: HttpClient
  ) {}

  getHeaders(): HttpHeaders {

    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: "Basic " + btoa(`asbarn:${API_KEY}`),
    });
  }

  getCountries() {
    return this.httpClient.get<Country[]>('https://api.footprintnetwork.org/v1/countries', {
      headers: this.getHeaders()
    })
  }

  // get a single country by countryCode
  getCountry(countryCode: string) {
    return this.httpClient.get<CountryEmissionsForYear[]>(
      `https://api.footprintnetwork.org/v1/data/${countryCode}/all/EFCpc`, {
        headers: this.getHeaders()
      }
    )
  }
}
