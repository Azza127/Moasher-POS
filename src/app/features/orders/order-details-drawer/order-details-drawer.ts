import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderService } from '../../../core/services/order.service';
import { Order, OrderItem } from '../../../core/models/order.model';
import { Product } from '../../../core/models/product.model';

interface ResolvedOrderLine {
  item: OrderItem;
  product: Product | null;
}

@Component({
  selector: 'app-order-details-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-details-drawer.html',
  styleUrl: './order-details-drawer.css',
})
export class OrderDetailsDrawer implements OnChanges {
  /** The Order the user clicked on the Orders page. Comes straight from the
   *  existing OrderService data — nothing here is invented. */
  @Input() order: Order | null = null;

  /** The full product catalog, already loaded by the parent via
   *  ProductService.getProducts() — reused here purely to resolve each
   *  order line's productId into real product details (name/image/price). */
  @Input() products: Product[] = [];

  @Output() closed = new EventEmitter<void>();
  @Output() orderUpdated = new EventEmitter<Order>();

  private readonly orderService = inject(OrderService);

  resolvedLines: ResolvedOrderLine[] = [];
  updatingStatus = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['order'] || changes['products']) {
      this.resolveLines();
    }
  }

  private resolveLines(): void {
    if (!this.order) {
      this.resolvedLines = [];
      return;
    }

    this.resolvedLines = (this.order.items || []).map((item) => ({
      item,
      // productId in db.json is a string ("2"), while the Product id is
      // also a string — but OrderItem.productId is typed as number in the
      // model, so we coerce both sides with String(), exactly like
      // pos.component.ts already does when matching cart items to products.
      product:
        this.products.find((p) => String(p.id) === String(item.productId)) ||
        null,
    }));
  }

  // ticketNumber / subtotal / tax / paymentMethod exist on the real order
  // records in db.json but aren't declared on the Order model, so they're
  // read defensively via `any` — same pattern already used in dashboard.ts.

  get ticketNumber(): string {
    if (!this.order) return '';
    return (this.order as any).ticketNumber || `#${this.order.id}`;
  }

  get subtotal(): number {
    const raw = (this.order as any)?.subtotal;
    if (typeof raw === 'number') return raw;
    return (this.order?.items || []).reduce((sum, i) => sum + (i.total || 0), 0);
  }

  get tax(): number {
    const raw = (this.order as any)?.tax;
    return typeof raw === 'number' ? raw : 0;
  }

  get paymentMethod(): string {
    return (this.order as any)?.paymentMethod || '—';
  }

  get canCancel(): boolean {
    return !!this.order && this.order.status !== 'Cancelled' && this.order.status !== 'Completed';
  }

  close(): void {
    this.closed.emit();
  }

  cancelOrder(): void {
    if (!this.order || !this.canCancel || this.updatingStatus) return;

    const confirmed = confirm('Cancel this order? This cannot be undone.');
    if (!confirmed) return;

    const orderId = this.order.id;
    this.updatingStatus = true;

    // Order.id is typed as `number` on the model but the real ids in
    // db.json are strings — cast at the call site rather than changing the
    // shared OrderService signature, mirroring the `as any` id casts
    // already used in pos.component.ts.
    this.orderService.updateOrderStatus(orderId as any, 'Cancelled').subscribe({
      next: () => {
        const updated: Order = { ...this.order!, status: 'Cancelled' };
        this.order = updated;
        this.resolveLines();
        this.updatingStatus = false;
        this.orderUpdated.emit(updated);
      },
      error: (err: unknown) => {
        console.error('Failed to cancel order:', err);
        this.updatingStatus = false;
      },
    });
  }

  printReceipt(): void {
    window.print();
  }

  productImage(product: Product | null): string {
    return product?.image && product.image.trim() !== '' ? product.image : '';
  }
}
