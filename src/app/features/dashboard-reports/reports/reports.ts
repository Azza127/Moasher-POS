import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { OrderService } from '../../../core/services/order.service';

import { Product } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';
import { Order } from '../../../core/models/order.model';

import { StatsUtil } from '../../../core/utils/stats.util';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit {

  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly orderService = inject(OrderService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  orders = signal<Order[]>([]);
  loading = signal(true);

  totalSales = computed(() =>
    StatsUtil.totalSales(this.orders())
  );

  ordersCount = computed(() =>
    this.orders().length
  );

  salesByCategory = computed(() =>
    StatsUtil.salesByCategory(
      this.orders(),
      this.products(),
      this.categories()
    )
  );

  topSellingProducts = computed(() =>
    StatsUtil.topSellingProducts(
      this.orders(),
      this.products()
    )
  );

  salesOverTime = computed(() =>
    StatsUtil.salesOverTime(this.orders())
  );

  ngOnInit(): void {
    forkJoin({
  products: this.productService.getProducts(),
  categories: this.categoryService.getCategories(),
  orders: this.orderService.getOrders()
}).subscribe({
      next: (data) => {
        this.products.set(data.products);
        this.categories.set(data.categories);
        this.orders.set(data.orders);
        this.loading.set(false);
      },

      error: (error) => {
        console.error('Error loading reports:', error);
        this.loading.set(false);
      }
    });
  }
}