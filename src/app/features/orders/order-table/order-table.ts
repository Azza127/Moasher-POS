import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Order } from '../../../core/models/order.model';
import { StoreSettingsService } from '../../../core/services/store-settings.service';

@Component({
  selector: 'app-order-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-table.html',
  styleUrl: './order-table.css',
})
export class OrderTable implements OnInit, OnChanges {

  @Input() orders: Order[] = [];
  @Input() loading = false;

  @Output() orderSelect =
    new EventEmitter<Order>();

  private storeSettingsService =
    inject(StoreSettingsService);

  readonly pageSize = 10;

  currentPage = 1;

  currencySymbol = 'EGP';


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.loadStoreSettings();

  }


  // =====================================================
  // LOAD STORE SETTINGS
  // =====================================================

  private loadStoreSettings(): void {

    this.storeSettingsService
      .getOrLoadSettings()
      .subscribe({

        next: (settings) => {

          if (!settings) {
            return;
          }

          this.currencySymbol =
            this.storeSettingsService
              .getCurrencySymbol(
                settings.currency
              );

        },

        error: (error) => {

          console.error(
            'Error loading store settings:',
            error
          );

        }

      });

  }


  // =====================================================
  // INPUT CHANGES
  // =====================================================

  ngOnChanges(
    changes: SimpleChanges
  ): void {

    // Whenever the already-filtered order list changes,
    // jump back to page 1 so the user isn't stranded
    // on an out-of-range page.

    if (changes['orders']) {

      this.currentPage = 1;

    }

  }


  // =====================================================
  // PAGINATION
  // =====================================================

  get totalPages(): number {

    return Math.max(
      1,
      Math.ceil(
        this.orders.length /
        this.pageSize
      )
    );

  }


  get pagedOrders(): Order[] {

    const start =
      (this.currentPage - 1) *
      this.pageSize;

    return this.orders.slice(
      start,
      start + this.pageSize
    );

  }


  get rangeStart(): number {

    return this.orders.length === 0
      ? 0
      : (this.currentPage - 1) *
          this.pageSize + 1;

  }


  get rangeEnd(): number {

    return Math.min(
      this.currentPage *
        this.pageSize,
      this.orders.length
    );

  }


  goToPage(page: number): void {

    if (
      page < 1 ||
      page > this.totalPages
    ) {

      return;

    }

    this.currentPage = page;

  }


  // =====================================================
  // ORDER SELECTION
  // =====================================================

  select(order: Order): void {

    this.orderSelect.emit(order);

  }


  // =====================================================
  // ITEM COUNT
  // =====================================================

  itemCount(order: Order): number {

    return (
      order.items || []
    ).reduce(
      (sum, i) =>
        sum + (i.quantity || 0),
      0
    );

  }


  // =====================================================
  // TICKET NUMBER
  // =====================================================

  ticketNumber(order: Order): string {

    return (
      (order as any).ticketNumber ||
      `#${order.id}`
    );

  }


  // =====================================================
  // PAYMENT METHOD
  // =====================================================

  paymentMethod(order: Order): string {

    return (
      (order as any).paymentMethod ||
      '—'
    );

  }


  // =====================================================
  // TRACK BY
  // =====================================================

  trackByOrderId(
    _index: number,
    order: Order
  ): string | number {

    return order.id ?? _index;

  }

}
