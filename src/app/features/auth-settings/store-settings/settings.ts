import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { StoreSettingsService } from '../../../core/services/store-settings.service';
import { StoreSettings } from '../../../core/models/store-settings.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsComponent implements OnInit {

  // =========================================
  // SETTINGS
  // =========================================

  settings: StoreSettings = {
    id: 1,
    storeName: '',
    phone: '',
    address: '',
    currency: 'EGP',
    taxRate: 14
  };


  // Keep original settings for discard
  originalSettings: StoreSettings = {
    ...this.settings
  };


  // =========================================
  // VALIDATION
  // =========================================

  fieldErrors: { [key: string]: string } = {};


  // =========================================
  // MESSAGES
  // =========================================

  successMessage = '';
  errorMessage = '';


  // =========================================
  // LOADING
  // =========================================

  isSaving = false;


  // =========================================
  // CONSTRUCTOR
  // =========================================

  constructor(
    private storeSettingsService: StoreSettingsService,
    private cdr: ChangeDetectorRef
  ) {}


  // =========================================
  // INIT
  // =========================================

  ngOnInit(): void {
    this.getSettings();
  }


  // =========================================
  // GET SETTINGS
  // =========================================

  getSettings(): void {

    this.successMessage = '';
    this.errorMessage = '';

    this.storeSettingsService.getSettings().subscribe({

      next: (data: StoreSettings[]) => {

        console.log('Settings response:', data);

        if (data && data.length > 0) {

          this.settings = {
            ...data[0]
          };

          this.originalSettings = {
            ...data[0]
          };

        }

        this.fieldErrors = {};

        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error(
          'Error loading settings:',
          error
        );

        this.showError(
          'Failed to load settings.'
        );

      }

    });

  }


  // =========================================
  // ALLOW LETTERS ONLY
  // =========================================

  allowLettersOnly(event: KeyboardEvent): void {

    const key = event.key;

    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Tab',
      'Home',
      'End'
    ];

    if (allowedKeys.includes(key)) {
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      return;
    }

    if (!/^[A-Za-z\u0600-\u06FF\s]$/.test(key)) {
      event.preventDefault();
    }

  }


  // =========================================
  // ALLOW NUMBERS ONLY
  // =========================================

  allowNumbersOnly(event: KeyboardEvent): void {

    const key = event.key;

    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Tab',
      'Home',
      'End'
    ];

    if (allowedKeys.includes(key)) {
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      return;
    }

    if (!/^[0-9]$/.test(key)) {
      event.preventDefault();
    }

  }


  // =========================================
  // VALIDATE FIELD
  // =========================================

  validateField(field: string): void {

    const value =
      this.settings[
        field as keyof StoreSettings
      ];


    // =========================================
    // STORE NAME
    // =========================================

    if (field === 'storeName') {

      const storeName =
        String(value ?? '').trim();

      if (!storeName) {

        this.fieldErrors[field] =
          'required';

      } else if (
        !/^[A-Za-z\u0600-\u06FF\s]+$/.test(
          storeName
        )
      ) {

        this.fieldErrors[field] =
          'letters';

      } else {

        delete this.fieldErrors[field];

      }

    }


    // =========================================
    // PHONE
    // =========================================

    if (field === 'phone') {

      const phone =
        String(value ?? '').trim();

      if (!phone) {

        this.fieldErrors[field] =
          'required';

      } else if (
        !/^01[0125][0-9]{8}$/.test(phone)
      ) {

        this.fieldErrors[field] =
          'invalid';

      } else {

        delete this.fieldErrors[field];

      }

    }


    // =========================================
    // ADDRESS
    // =========================================

    if (field === 'address') {

      const address =
        String(value ?? '').trim();

      if (!address) {

        this.fieldErrors[field] =
          'required';

      } else {

        delete this.fieldErrors[field];

      }

    }


    // =========================================
    // CURRENCY
    // =========================================

    if (field === 'currency') {

      if (!value) {

        this.fieldErrors[field] =
          'required';

      } else {

        delete this.fieldErrors[field];

      }

    }


    // =========================================
    // TAX RATE
    // =========================================

    if (field === 'taxRate') {

      if (
        value === '' ||
        value === null ||
        value === undefined
      ) {

        this.fieldErrors[field] =
          'required';

        return;
      }

      const tax =
        Number(value);

      if (
        Number.isNaN(tax) ||
        tax < 0 ||
        tax > 100
      ) {

        this.fieldErrors[field] =
          'invalid';

      } else {

        delete this.fieldErrors[field];

      }

    }

  }


  // =========================================
  // VALIDATE ALL
  // =========================================

  validateAll(): boolean {

    this.validateField('storeName');

    this.validateField('phone');

    this.validateField('address');

    this.validateField('currency');

    this.validateField('taxRate');

    return Object.keys(
      this.fieldErrors
    ).length === 0;

  }


  // =========================================
  // CHECK INVALID
  // =========================================

  isFieldInvalid(field: string): boolean {

    return !!this.fieldErrors[field];

  }


  // =========================================
  // GET ERROR
  // =========================================

  getError(field: string): string {

    return this.fieldErrors[field] || '';

  }


  // =========================================
  // SAVE SETTINGS
  // =========================================

  updateSettings(): void {

    // Prevent double click
    if (this.isSaving) {
      return;
    }


    // Clear messages
    this.successMessage = '';
    this.errorMessage = '';


    // Validate
    if (!this.validateAll()) {

      this.showError(
        'Please fix the errors before saving.'
      );

      return;
    }


    // Start loading
    this.isSaving = true;

    this.cdr.detectChanges();


    console.log(
      'Saving settings:',
      this.settings
    );


    // =========================================
    // UPDATE
    // =========================================

    this.storeSettingsService
      .updateSettings(this.settings)
      .subscribe({

        // =====================================
        // SUCCESS
        // =====================================

        next: (data: StoreSettings) => {

          console.log(
            'Settings saved successfully:',
            data
          );


          // Update form with saved data
          this.settings = {
            ...data
          };


          // Update original copy
          this.originalSettings = {
            ...data
          };


          // Clear validation
          this.fieldErrors = {};


          // Stop loading
          this.isSaving = false;


          // SUCCESS MESSAGE
          this.successMessage =
            'Settings saved successfully!';

          this.errorMessage = '';


          this.cdr.detectChanges();


          // Hide success message
          setTimeout(() => {

            this.successMessage = '';

            this.cdr.detectChanges();

          }, 4000);

        },


        // =====================================
        // ERROR
        // =====================================

        error: (error) => {

          console.error(
            'Error saving settings:',
            error
          );


          this.isSaving = false;

          this.successMessage = '';

          this.errorMessage =
            'Failed to save settings. Please try again.';


          this.cdr.detectChanges();


          setTimeout(() => {

            this.errorMessage = '';

            this.cdr.detectChanges();

          }, 5000);

        }

      });

  }


  // =========================================
  // SUCCESS MESSAGE
  // =========================================

  private showSuccess(message: string): void {

    this.errorMessage = '';

    this.successMessage = message;

    this.cdr.detectChanges();


    setTimeout(() => {

      this.successMessage = '';

      this.cdr.detectChanges();

    }, 4000);

  }


  // =========================================
  // ERROR MESSAGE
  // =========================================

  private showError(message: string): void {

    this.successMessage = '';

    this.errorMessage = message;

    this.cdr.detectChanges();


    setTimeout(() => {

      this.errorMessage = '';

      this.cdr.detectChanges();

    }, 5000);

  }


  // =========================================
  // DISCARD CHANGES
  // =========================================

  discardChanges(): void {

    this.settings = {
      ...this.originalSettings
    };

    this.fieldErrors = {};

    this.successMessage = '';
    this.errorMessage = '';

    this.cdr.detectChanges();

  }

}