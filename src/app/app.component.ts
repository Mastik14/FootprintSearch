import {
  Component,
  OnInit,
  ElementRef,
  QueryList,
  ViewChildren,
  AfterViewChecked,
  inject,
} from "@angular/core";
import { FootprintService } from "../services/footprint.service";
import type { Country, CountryEmissionsForYear } from "../typings/Country";
import { StorageService } from "../services/storage.service";
import { catchError, of } from "rxjs";
import { colors } from "../constants/constants";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit, AfterViewChecked {
  @ViewChildren("barRef") bars!: QueryList<ElementRef>;

  public intervalId!: ReturnType<typeof setInterval>;
  public countries: Country[] = [];
  public emissionsMap = new Map<string, CountryEmissionsForYear[]>();
  public visibleData: { country: string; carbon: number }[] = [];

  public currentYear = 1970;
  public minYear = Number.MAX_SAFE_INTEGER;
  public maxYear = 2020;
  public displayedMaxCarbon = 1;
  public loading = false;

  private previousRects = new Map<string, DOMRect>();
  private animating = false;

  private animationFrameId: number | null = null;

  private readonly footprintService = inject(FootprintService);
  private readonly storageService = inject(StorageService);

  public ngOnInit(): void {
    this.loading = true;

    const cached = this.storageService.getCache<{
      data: [string, CountryEmissionsForYear[]][];
      minYear: number;
      maxYear: number;
    }>();

    if (cached) {
      this.emissionsMap = new Map(cached.data);
      this.minYear = cached.minYear ?? 1970;
      this.maxYear = cached.maxYear ?? 2020;
      this.loading = false;
      this.startYearInterval();
      return;
    }

    this.footprintService
      .getCountries()
      .pipe(
        catchError((err) => {
          console.error("Error loading countries:", err);
          this.loading = false;
          return of([] as Country[]);
        })
      )
      .subscribe((countries) => {
        if (!countries.length) return;

        this.countries = countries.slice(0, 15);
        let loaded = 0;

        this.countries.forEach(({ countryCode, shortName }) => {
          this.footprintService
            .getCountry(countryCode)
            .pipe(
              catchError((err) => {
                console.error(`Error loading data for ${countryCode}:`, err);

                return of([] as CountryEmissionsForYear[]);
              })
            )
            .subscribe((data) => {
              this.emissionsMap.set(shortName, data);

              data.forEach((d) => {
                if (d.year < this.minYear) this.minYear = d.year;
                if (d.year > this.maxYear) this.maxYear = d.year;
              });

              loaded++;
              if (loaded === this.countries.length) {
                const serialized = Array.from(this.emissionsMap.entries());

                this.storageService.setCache({
                  data: serialized,
                  minYear: this.minYear,
                  maxYear: this.maxYear,
                });

                this.loading = false;
                this.startYearInterval();
              }
            });
        });
      });
  }

  public getMaxCarbon(): number {
    return this.displayedMaxCarbon;
  }

  public getColor(index: number): string {
    return colors[index % colors.length];
  }

  private startYearInterval(): void {
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

  private updateVisibleData(): void {
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

  private savePositions(): void {
    this.previousRects.clear();
    if (!this.bars) return;
    this.bars.forEach((bar, i) => {
      const key = this.visibleData[i]?.country;
      if (key) {
        this.previousRects.set(key, bar.nativeElement.getBoundingClientRect());
      }
    });
  }

  private playFlipAnimation(): void {
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

  private smoothUpdateMaxCarbon(): void {
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
}
