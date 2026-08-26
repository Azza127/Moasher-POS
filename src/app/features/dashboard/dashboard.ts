import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ProductService } from '../../core/services/product.service';
import { OrderService } from '../../core/services/order.service';
import { Product } from '../../core/models/product.model';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private productService = inject(ProductService);
  private orderService = inject(OrderService);

  products = signal<Product[]>([]);
  orders = signal<Order[]>([]);
  loading = signal<boolean>(true);

  // حساب الإحصائيات مباشرة بدون الاستعانة بـ StatsUtil
  totalSales = computed(() => this.orders().reduce((sum, order: any) => sum + (order.total || order.totalAmount || 0), 0));
  totalOrders = computed(() => this.orders().length);
  totalProducts = computed(() => this.products().length);
  lowStockProducts = computed(() => this.products().filter(p => (p.stock || 0) <= 5));
  lowStockCount = computed(() => this.lowStockProducts().length);
  recentOrders = computed(() => [...this.orders()].slice(-5).reverse());

  ngOnInit(): void {
    forkJoin({
      products: this.productService.getProducts(),
      orders: this.orderService.getOrders()
    }).subscribe({
      next: ({ products, orders }) => {
        this.products.set(products);
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}