import {
  Component,
  OnInit,
  signal,
  computed,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ProductService } from '../../core/services/product.service';
import { OrderService } from '../../core/services/order.service';

import { Product } from '../../core/models/product.model';
import { Order } from '../../core/models/order.model';

import { StatsUtil } from '../../core/utils/stats.util';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  private productService =
    inject(ProductService);

  private orderService =
    inject(OrderService);


  /* =========================================================
     DATA
     ========================================================= */

  products =
    signal<Product[]>([]);

  orders =
    signal<Order[]>([]);

  loading =
    signal<boolean>(true);


  /* =========================================================
     KPI
     ========================================================= */

  totalSales =
    computed(() =>
      StatsUtil.totalSales(
        this.orders()
      )
    );


  totalOrders =
    computed(() =>
      this.orders().length
    );


  totalProducts =
    computed(() =>
      this.products().length
    );


  lowStockProducts =
    computed(() =>
      StatsUtil.lowStockProducts(
        this.products()
      )
    );


  lowStockCount =
    computed(() =>
      this.lowStockProducts().length
    );


  recentOrders =
    computed(() =>
      StatsUtil.recentOrders(
        this.orders(),
        5
      )
    );


  /* =========================================================
     SALES TREND + ORDER COUNT
     ========================================================= */

     chartData = computed(() => {

      const orders = [...this.orders()];
  
      if (!orders.length) {
        return [];
      }
  
      /*
       * Use the latest order as the reference date.
       * Show the latest 7 days.
       */
  
      const latestDate = new Date(
        Math.max(
          ...orders.map(order =>
            new Date(order.createdAt).getTime()
          )
        )
      );
  
      const days = [];
  
      for (let i = 6; i >= 0; i--) {
  
        const date = new Date(latestDate);
  
        date.setHours(0, 0, 0, 0);
  
        date.setDate(
          date.getDate() - i
        );
  
        days.push(date);
  
      }
  
  
      return days.map(date => {
  
        const dayOrders = orders.filter(order => {
  
          const orderDate =
            new Date(order.createdAt);
  
          return (
            orderDate.getFullYear() ===
              date.getFullYear() &&
  
            orderDate.getMonth() ===
              date.getMonth() &&
  
            orderDate.getDate() ===
              date.getDate()
          );
  
        });
  
  
        const sales =
          dayOrders.reduce(
            (sum, order) =>
              sum + (Number(order.total) || 0),
            0
          );
  
  
        return {
  
          date,
  
          label:
            date.toLocaleDateString(
              'en-US',
              {
                month: 'short',
                day: 'numeric'
              }
            ),
  
          sales,
  
          orders:
            dayOrders.length
  
        };
  
      });
  
    });
  
  
    chartSalesLabels = computed(() => {
  
      const data = this.chartData();
  
      if (!data.length) {
        return [0, 0, 0, 0];
      }
  
      const maxSales =
        Math.max(
          ...data.map(item => item.sales)
        );
  
  
      if (!maxSales) {
        return [0, 0, 0, 0];
      }
  
  
      return [
        0,
        maxSales * 0.33,
        maxSales * 0.66,
        maxSales
      ];
  
    });
  
  
    private chartMaxSales = computed(() => {
  
      const data = this.chartData();
  
      return data.length
        ? Math.max(
            ...data.map(item => item.sales)
          )
        : 0;
  
    });
  
  
    private chartMaxOrders = computed(() => {
  
      const data = this.chartData();
  
      return data.length
        ? Math.max(
            ...data.map(item => item.orders)
          )
        : 0;
  
    });
  
  
    chartPoints = computed(() => {
  
      const data = this.chartData();
  
      const width = 760;
      const height = 220;
  
      const paddingX = 8;
      const paddingY = 12;
  
      const maxSales =
        this.chartMaxSales() || 1;
  
      const maxOrders =
        this.chartMaxOrders() || 1;
  
  
      if (!data.length) {
        return [];
      }
  
  
      const step =
        data.length > 1
          ? (width - paddingX * 2) /
            (data.length - 1)
          : 0;
  
  
      return data.map((item, index) => {
  
        const x =
          paddingX + (index * step);
  
  
        const salesY =
          height -
          paddingY -
          (
            (item.sales / maxSales) *
            (height - paddingY * 2)
          );
  
  
        const ordersY =
          height -
          paddingY -
          (
            (item.orders / maxOrders) *
            (height - paddingY * 2)
          );
  
  
        return {
  
          ...item,
  
          x,
  
          salesY,
  
          ordersY
  
        };
  
      });
  
    });
  
  
    /*
     * Create a smooth SVG curve.
     */
  
    private createSmoothPath(
      points: Array<{
        x: number;
        y: number;
      }>
    ): string {
  
      if (!points.length) {
        return '';
      }
  
  
      if (points.length === 1) {
  
        return `
          M ${points[0].x}
          ${points[0].y}
        `;
  
      }
  
  
      let path =
        `M ${points[0].x} ${points[0].y}`;
  
  
      for (
        let i = 0;
        i < points.length - 1;
        i++
      ) {
  
        const current =
          points[i];
  
        const next =
          points[i + 1];
  
  
        const midX =
          (current.x + next.x) / 2;
  
  
        path +=
          ` C ${midX} ${current.y},
              ${midX} ${next.y},
              ${next.x} ${next.y}`;
  
      }
  
  
      return path;
  
    }
  
  
    salesPath = computed(() => {
  
      const points =
        this.chartPoints().map(point => ({
          x: point.x,
          y: point.salesY
        }));
  
  
      return this.createSmoothPath(points);
  
    });
  
  
    ordersPath = computed(() => {
  
      const points =
        this.chartPoints().map(point => ({
          x: point.x,
          y: point.ordersY
        }));
  
  
      return this.createSmoothPath(points);
  
    });
  
  
    salesAreaPath = computed(() => {
  
      const points =
        this.chartPoints();
  
  
      if (!points.length) {
        return '';
      }
  
  
      const line =
        this.createSmoothPath(
          points.map(point => ({
            x: point.x,
            y: point.salesY
          }))
        );
  
  
      const last =
        points[points.length - 1];
  
      const first =
        points[0];
  
  
      return `
        ${line}
        L ${last.x} 220
        L ${first.x} 220
        Z
      `;
  
    });
  /* =========================================================
     INIT
     ========================================================= */

  ngOnInit(): void {

    forkJoin({

      products:
        this.productService
          .getProducts(),

      orders:
        this.orderService
          .getOrders()

    }).subscribe({

      next: ({
        products,
        orders
      }) => {

        this.products.set(
          products
        );

        this.orders.set(
          orders
        );

        this.loading.set(
          false
        );

      },

      error: () => {

        this.loading.set(
          false
        );

      }

    });

  }

}