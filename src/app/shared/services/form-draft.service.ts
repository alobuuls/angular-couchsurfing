import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FormDraftService {
  private readonly STORAGE_KEY = 'guests-create-draft';

  save<T>(data: T): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Could not save form draft:', error);
    }
  }

  get<T>(): T | null {
    try {
      const draft = localStorage.getItem(this.STORAGE_KEY);
      return draft ? (JSON.parse(draft) as T) : null;
    } catch (error) {
      console.error('Could not restore form draft:', error);
      return null;
    }
  }

  exists(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
