import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ProductService } from '../../../core/services/product.service';
import { OrderService } from '../../../core/services/order.service';
import { Product } from '../../../core/models/product.model';
import { Order } from '../../../core/models/order.model';
import { StatsUtil } from '../../../core/utils/stats.util';

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

  totalSales = computed(() => StatsUtil.totalSales(this.orders()));
  totalOrders = computed(() => this.orders().length);
  totalProducts = computed(() => this.products().length);
  lowStockProducts = computed(() => StatsUtil.lowStockProducts(this.products()));
  lowStockCount = computed(() => this.lowStockProducts().length);
  recentOrders = computed(() => StatsUtil.recentOrders(this.orders(), 5));

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