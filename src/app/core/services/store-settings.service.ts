import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  BehaviorSubject,
  Observable,
  timeout
} from 'rxjs';

import {
  StoreSettings
} from '../models/store-settings.model';


@Injectable({
  providedIn: 'root'
})
export class StoreSettingsService {

  private apiUrl =
    'http://localhost:3000/storeSettings';

  private readonly settingsSubject = new BehaviorSubject<StoreSettings | null>(null);

  constructor(
    private http: HttpClient
  ) {
    const cachedSettings = localStorage.getItem('storeSettings');

    if (cachedSettings) {
      try {
        this.settingsSubject.next(JSON.parse(cachedSettings) as StoreSettings);
      } catch {
        localStorage.removeItem('storeSettings');
      }
    }
  }

  getCurrentSettings(): Observable<StoreSettings | null> {
    return this.settingsSubject.asObservable();
  }

  setCurrentSettings(settings: StoreSettings): void {
    this.settingsSubject.next(settings);
    localStorage.setItem('storeSettings', JSON.stringify(settings));
  }

  // =========================================
  // GET SETTINGS
  // =========================================

  getSettings(): Observable<StoreSettings[]> {

    return this.http
      .get<StoreSettings[]>(
        this.apiUrl
      )
      .pipe(
        timeout(5000)
      );

  }


  // =========================================
  // UPDATE SETTINGS
  // =========================================

  updateSettings(
    settings: StoreSettings
  ): Observable<StoreSettings> {

    console.log(
      'PUT URL:',
      `${this.apiUrl}/${settings.id}`
    );

    console.log(
      'PUT DATA:',
      settings
    );


    return this.http
      .put<StoreSettings>(
        `${this.apiUrl}/${settings.id}`,
        settings
      )
      .pipe(
        timeout(5000)
      );

  }

}
