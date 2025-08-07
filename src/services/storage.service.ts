import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class StorageService {
  private cacheKey = "carbon_data";
  private ttl = 5 * 60 * 1000; // 5 min

  public getCache<T>(): T | null {
    const cached = localStorage.getItem(this.cacheKey);

    if (!cached) return null;

    try {
      const { timestamp, data } = JSON.parse(cached);

      if (Date.now() - timestamp < this.ttl) {
        return data as T;
      } else {
        localStorage.removeItem(this.cacheKey);
      }
    } catch (e) {
      console.warn("Error from reading from local storage", e);
      localStorage.removeItem(this.cacheKey);
    }

    return null;
  }

  public setCache<T>(data: T): void {
    const payload = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(this.cacheKey, JSON.stringify(payload));
  }

  public clearCache(): void {
    localStorage.removeItem(this.cacheKey);
  }
}
