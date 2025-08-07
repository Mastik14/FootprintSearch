import { Component, OnInit } from "@angular/core";
import { FootprintService } from "../services/footprint.service";
import type { Country, CountryEmissionsForYear } from "../typings/Country";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  countries: Country[] = [];
  emissionsMap = new Map<string, CountryEmissionsForYear[]>();
  visibleData: { country: string; carbon: number }[] = [];

  currentYear = 1970;
  maxYear = 2020;
  intervalId: any;

  constructor(private footprintService: FootprintService) {}

  ngOnInit() {
    this.footprintService.getCountries().subscribe((countries) => {
      this.countries = countries.slice(0, 10);

      let loaded = 0;

      this.countries.forEach(({ countryCode, shortName }) => {
        this.footprintService.getCountry(countryCode).subscribe((data) => {
          this.emissionsMap.set(shortName, data);

          data.forEach((d) => {
            if (d.year > this.maxYear) {
              this.maxYear = d.year;
            }
          });

          loaded++;
          if (loaded === this.countries.length) {
            this.startYearInterval();
          }
        });
      });
    });
  }

  startYearInterval() {
    this.updateVisibleData();

    this.intervalId = setInterval(() => {
      this.currentYear++;
      if (this.currentYear > this.maxYear) {
        clearInterval(this.intervalId);
        return;
      }

      this.updateVisibleData();
    }, 1000);
  }

  updateVisibleData() {
    const updated: { country: string; carbon: number }[] = [];

    this.emissionsMap.forEach((data, countryName) => {
      const yearData = data.find((d) => d.year === this.currentYear);
      if (yearData) {
        updated.push({
          country: countryName,
          carbon: yearData.carbon,
        });
      }
    });

    this.visibleData = updated.sort((a, b) => b.carbon - a.carbon);
  }

  getMaxCarbon(): number {
    return Math.max(...this.visibleData.map((d) => d.carbon));
  }

  getColor(index: number): string {
    const colors = [
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
      "#9966FF",
      "#FF9F40",
      "#8BC34A",
      "#03A9F4",
      "#E91E63",
      "#9E9E9E",
    ];
    return colors[index % colors.length];
  }

  trackByCountry(index: number, item: { country: string }) {
    return item.country;
  }
}
