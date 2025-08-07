import {
  Component,
  OnInit,
  ElementRef,
  QueryList,
  ViewChildren,
  AfterViewChecked,
} from "@angular/core";
import { FootprintService } from "../services/footprint.service";
import type { Country, CountryEmissionsForYear } from "../typings/Country";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit, AfterViewChecked {
  countries: Country[] = [];
  emissionsMap = new Map<string, CountryEmissionsForYear[]>();
  visibleData: { country: string; carbon: number }[] = [];

  currentYear = 1970;
  minYear = Number.MAX_SAFE_INTEGER;
  maxYear = 2020;
  intervalId: any;

  @ViewChildren("barRef") bars!: QueryList<ElementRef>;

  private previousRects = new Map<string, DOMRect>();
  private animating = false;

  displayedMaxCarbon = 1;
  private animationFrameId: any = null;

  constructor(private footprintService: FootprintService) {}

  ngOnInit() {
    const cached = localStorage.getItem("carbon_data");
    if (cached) {
      const { timestamp, data, minYear, maxYear } = JSON.parse(cached);
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        this.emissionsMap = new Map(data);
        this.minYear = minYear ?? 1970;
        this.maxYear = maxYear ?? 2020;
        this.startYearInterval();
        return;
      }
    }

    this.footprintService.getCountries().subscribe((countries) => {
      this.countries = countries.slice(0, 15); // limit 15 countries to avoid 429 error
      let loaded = 0;

      this.countries.forEach(({ countryCode, shortName }) => {
        this.footprintService.getCountry(countryCode).subscribe((data) => {
          this.emissionsMap.set(shortName, data);

          data.forEach((d) => {
            if (d.year < this.minYear) this.minYear = d.year;
            if (d.year > this.maxYear) this.maxYear = d.year;
          });

          loaded++;
          if (loaded === this.countries.length) {
            const serialized = Array.from(this.emissionsMap.entries());
            localStorage.setItem(
              "carbon_data",
              JSON.stringify({
                timestamp: Date.now(),
                data: serialized,
                minYear: this.minYear,
                maxYear: this.maxYear,
              })
            );

            this.startYearInterval();
          }
        });
      });
    });
  }

  startYearInterval() {
    this.currentYear = this.minYear;
    this.updateVisibleData();

    this.intervalId = setInterval(() => {
      this.currentYear++;

      if (this.currentYear > this.maxYear) {
        this.currentYear = this.minYear;
      }

      this.updateVisibleData();
    }, 1000);
  }

  ngAfterViewChecked() {
    if (!this.animating && this.previousRects.size > 0) {
      this.animating = true;
      this.playFlipAnimation();
    }
  }

  updateVisibleData() {
    this.savePositions();

    const updated: { country: string; carbon: number }[] = [];

    this.emissionsMap.forEach((data, countryName) => {
      const yearData = data.find((d) => d.year === this.currentYear);
      if (yearData && yearData.carbon != null) {
        updated.push({
          country: countryName,
          carbon: yearData.carbon,
        });
      }
    });

    this.visibleData = [...updated].sort((a, b) => b.carbon - a.carbon);

    this.smoothUpdateMaxCarbon();
  }

  private savePositions() {
    this.previousRects.clear();
    if (!this.bars) return;
    this.bars.forEach((bar, i) => {
      const key = this.visibleData[i]?.country;
      if (key) {
        this.previousRects.set(key, bar.nativeElement.getBoundingClientRect());
      }
    });
  }

  private playFlipAnimation() {
    if (!this.bars) {
      this.animating = false;
      return;
    }

    const newRects = new Map<string, DOMRect>();
    this.bars.forEach((bar, i) => {
      const key = this.visibleData[i]?.country;
      if (key) {
        newRects.set(key, bar.nativeElement.getBoundingClientRect());
      }
    });

    this.bars.forEach((bar, i) => {
      const key = this.visibleData[i]?.country;
      const oldRect = this.previousRects.get(key);
      const newRect = newRects.get(key);

      if (oldRect && newRect) {
        const deltaX = oldRect.left - newRect.left;
        const deltaY = oldRect.top - newRect.top;

        const element = bar.nativeElement;
        element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        element.style.transition = "transform 0s";

        requestAnimationFrame(() => {
          element.style.transition = "transform 0.8s ease";
          element.style.transform = "";
        });
      }
    });

    this.previousRects.clear();

    setTimeout(() => {
      this.animating = false;
    }, 900);
  }

  private smoothUpdateMaxCarbon() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const targetMax = Math.max(...this.visibleData.map((d) => d.carbon), 1);

    const step = () => {
      const diff = targetMax - this.displayedMaxCarbon;
      if (Math.abs(diff) < 0.01) {
        this.displayedMaxCarbon = targetMax;
        this.animationFrameId = null;
        return;
      }
      this.displayedMaxCarbon += diff * 0.1;
      this.animationFrameId = requestAnimationFrame(step);
    };

    step();
  }

  getMaxCarbon(): number {
    return this.displayedMaxCarbon;
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
      "#795548",
      "#00BCD4",
      "#607D8B",
      "#CDDC39",
      "#673AB7",
      "#3F51B5",
    ];
    return colors[index % colors.length];
  }

  trackByCountry(index: number, item: { country: string }) {
    return item.country;
  }

  trackByCode(index: number, item: any) {
    return item.countryCode;
  }
}
