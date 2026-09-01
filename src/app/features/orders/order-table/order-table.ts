import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-table.html',
  styleUrl: './order-table.css',
})
export class OrderTable implements OnChanges {
  @Input() orders: Order[] = [];
  @Input() loading = false;
  @Output() orderSelect = new EventEmitter<Order>();

  readonly pageSize = 10;
  currentPage = 1;

  ngOnChanges(changes: SimpleChanges): void {
    // Whenever the (already-filtered) order list changes, jump back to page 1
    // so the user isn't stranded on an out-of-range page.
    if (changes['orders']) {
      this.currentPage = 1;
    }
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.orders.length / this.pageSize));
  }

  get pagedOrders(): Order[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.orders.slice(start, start + this.pageSize);
  }

  get rangeStart(): number {
    return this.orders.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.orders.length);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  select(order: Order): void {
    this.orderSelect.emit(order);
  }

  itemCount(order: Order): number {
    return (order.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0);
  }

  // `ticketNumber` / `paymentMethod` exist in the real db.json records but
  // aren't declared on the Order model, so we read them defensively.
  ticketNumber(order: Order): string {
    return (order as any).ticketNumber || `#${order.id}`;
  }

  paymentMethod(order: Order): string {
    return (order as any).paymentMethod || '—';
  }

  trackByOrderId(_index: number, order: Order): string | number {
    return order.id ?? _index;
  }
}
