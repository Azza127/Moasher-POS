import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
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


  constructor(
    private http: HttpClient
  ) {}


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