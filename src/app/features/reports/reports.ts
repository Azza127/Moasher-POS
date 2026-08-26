import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
import { FormsModule } from '@angular/forms';

Chart.register(...registerables);

import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { OrderService } from '../../core/services/order.service';

import { Product } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { Order } from '../../core/models/order.model';

export interface CategoryReport {
  categoryId: string;
  categoryName: string;
  totalSales: number;
  percentage: number;
}

export interface TopProductReport {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
  trend: number;       
  isPositive: boolean;  
}

export interface InventoryValuation {
  totalCost: number;
  potentialRevenue: number;
  totalItemsInStock: number;
  profitMargin: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);

  products: Product[] = [];
  categories: Category[] = [];
  orders: Order[] = [];

  selectedPeriod: string = 'all';
  isLoading: boolean = true;
  errorMessage: string = '';

  totalSales: number = 0;
  totalOrdersCount: number = 0;
  categoryReports: CategoryReport[] = [];
  topProducts: TopProductReport[] = [];

inventoryValuation: InventoryValuation = { 
  totalCost: 0, 
  potentialRevenue: 0, 
  totalItemsInStock: 0, 
  profitMargin: 0 
};

  lineChart: any;
  doughnutChart: any;

  // ألوان الأقسام المطابقة لتصميم Figma
  categoryColors: string[] = ['#2563eb', '#334155', '#cbd5e1', '#f59e0b', '#10b981', '#8b5cf6'];

  // 1. فلترة البيانات حسب الفترة الزمنية المحددة
  onPeriodChange(): void {
    this.calculateReports();
    this.renderLineChart();
    this.renderDoughnutChart();
  }

  ngOnInit(): void {
    this.loadReportData();
  }

  getCategoryColor(index: number): string {
    return this.categoryColors[index % this.categoryColors.length];
  }

  loadReportData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      products: this.productService.getProducts().pipe(catchError(() => of([]))),
      categories: this.categoryService.getCategories().pipe(catchError(() => of([]))),
      orders: this.orderService.getOrders().pipe(catchError(() => of([])))
    })
    .pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (res) => {
        this.products = res.products || [];
        this.categories = res.categories || [];
        this.orders = res.orders || [];

        this.calculateReports();
        this.cdr.detectChanges();

        setTimeout(() => {
          this.renderLineChart();
          this.renderDoughnutChart();
        }, 100);
      }
    });
  }

  private calculateReports(): void {
    const allCompleted = this.orders.filter(o => o.status === 'Completed');
    const completedOrders = this.filterOrdersByPeriod(allCompleted); // الفلترة هنا
    
    this.totalOrdersCount = completedOrders.length;
    this.totalSales = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  
    this.calculateCategorySales(completedOrders);
    this.calculateTopProducts(completedOrders);
    this.calculateInventoryValuation();
  }

  private filterOrdersByPeriod(completedOrders: Order[]): Order[] {
    const now = new Date();
    
    return completedOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      
      if (this.selectedPeriod === 'month') {
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      } else if (this.selectedPeriod === 'year') {
        return orderDate.getFullYear() === now.getFullYear();
      }
      
      return true; // 'all'
    });
  }

  // 2. دالة تصدير CSV
exportCSV(): void {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Category Name,Total Sales ($),Percentage (%)\n";

  this.categoryReports.forEach(cat => {
    csvContent += `"${cat.categoryName}",${cat.totalSales},${cat.percentage}%\n`;
  });

  csvContent += "\nProduct Name,Units Sold,Revenue ($)\n";
  this.topProducts.forEach(prod => {
    csvContent += `"${prod.productName}",${prod.unitsSold},${prod.revenue}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Sales_Report_${this.selectedPeriod}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 3. دالة تصدير PDF
exportPDF(): void {
  window.print();
}

  private calculateCategorySales(completedOrders: Order[]): void {
    const categorySalesMap = new Map<string, number>();
    const productCategoryMap = new Map<string, string>();
    
    this.products.forEach(p => productCategoryMap.set(String(p.id), String(p.categoryId)));

    completedOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const catId = productCategoryMap.get(String(item.productId));
        if (catId) {
          const currentTotal = categorySalesMap.get(catId) || 0;
          categorySalesMap.set(catId, currentTotal + item.total);
        }
      });
    });

    this.categoryReports = this.categories.map(cat => {
      const sales = categorySalesMap.get(String(cat.id)) || 0;
      const percentage = this.totalSales > 0 ? (sales / this.totalSales) * 100 : 0;
      return {
        categoryId: String(cat.id),
        categoryName: cat.name,
        totalSales: sales,
        percentage: Number(percentage.toFixed(1))
      };
    }).filter(c => c.totalSales > 0);
  }

  private calculateTopProducts(completedOrders: Order[]): void {
    const productStatsMap = new Map<string, { name: string; units: number; revenue: number }>();

    completedOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const pId = String(item.productId);
        const existing = productStatsMap.get(pId) || { name: item.productName, units: 0, revenue: 0 };
        
        productStatsMap.set(pId, {
          name: item.productName || existing.name,
          units: existing.units + item.quantity,
          revenue: existing.revenue + item.total
        });
      });
    });

    this.topProducts = Array.from(productStatsMap.entries())
      .map(([id, stat]) => {
        // حساب نسبة مشاركة المنتج من إجمالي المبيعات كنسبة Trend ديناميكية
        const sharePercentage = this.totalSales > 0 ? (stat.revenue / this.totalSales) * 100 : 0;
        const trendVal = Number(sharePercentage.toFixed(1));

        return {
          productId: id,
          productName: stat.name,
          unitsSold: stat.units,
          revenue: stat.revenue,
          trend: trendVal,
          isPositive: trendVal >= 0
        };
      })
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);
  }

  private calculateInventoryValuation(): void {
    let totalCost = 0;
    let potentialRevenue = 0;
    let totalItemsInStock = 0;
  
    this.products.forEach(p => {
      const stock = p.stock || 0;
      const price = p.price || 0;
      // إذا لم تكن تكلفة الشراء مجهزة من الـ API، سنفترض مجازاً أنها 65% من سعر البيع
      const costPrice = p.costPrice ?? (price * 0.65); 
  
      totalCost += costPrice * stock;
      potentialRevenue += price * stock;
      totalItemsInStock += stock;
    });
  
    const profitMargin = potentialRevenue > 0 
      ? ((potentialRevenue - totalCost) / potentialRevenue) * 100 
      : 0;
  
    this.inventoryValuation = {
      totalCost,
      potentialRevenue,
      totalItemsInStock,
      profitMargin: Number(profitMargin.toFixed(1))
    };
  }

  private renderLineChart(): void {
    const canvas = document.getElementById('salesLineChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.lineChart) this.lineChart.destroy();

    const completedOrders = this.orders.filter(o => o.status === 'Completed');
    const salesByDateMap = new Map<string, number>();

    completedOrders.forEach(order => {
      const dateLabel = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const currentSales = salesByDateMap.get(dateLabel) || 0;
      salesByDateMap.set(dateLabel, currentSales + (order.total || 0));
    });

    let labels = Array.from(salesByDateMap.keys());
    let dataPoints = Array.from(salesByDateMap.values());

    if (labels.length === 1) {
      labels = ['Start', labels[0]];
      dataPoints = [0, dataPoints[0]];
    } else if (labels.length === 0) {
      labels = ['No Sales Yet'];
      dataPoints = [0];
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, 'rgba(218, 222, 229, 0.65)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    this.lineChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Revenue',
          data: dataPoints,
          borderColor: '#94a3b8',
          borderWidth: 2,
          backgroundColor: gradient,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#2563eb'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.parsed.y ?? 0;
                return ` Sales: $${val.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            border: { dash: [4, 4] },
            grid: { color: '#f1f5f9' },
            ticks: {
              color: '#64748b',
              font: { size: 11 },
              callback: (val) => '$' + val
            }
          }
        }
      }
    });
  }

  private renderDoughnutChart(): void {
    const canvas = document.getElementById('categoryDoughnutChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.doughnutChart) this.doughnutChart.destroy();

    const hasCategoryData = this.categoryReports.length > 0;
    
    const labels = hasCategoryData 
      ? this.categoryReports.map(c => c.categoryName) 
      : ['No Category Sales'];
      
    const data = hasCategoryData 
      ? this.categoryReports.map(c => c.totalSales) 
      : [1];

    const centerTextPlugin = {
      id: 'centerText',
      beforeDraw: (chart: any) => {
        const { width, height, ctx } = chart;
        ctx.save();
        
        const formattedSales = this.totalSales >= 1000 
          ? `$${(this.totalSales / 1000).toFixed(0)}k` 
          : `$${this.totalSales.toFixed(0)}`;
        
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(formattedSales, width / 2, height / 2 - 8);

        ctx.font = '500 12px Inter, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Total Sales', width / 2, height / 2 + 14);

        ctx.restore();
      }
    };

    this.doughnutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: hasCategoryData ? this.categoryColors.slice(0, data.length) : ['#e2e8f0'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '80%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        }
      },
      plugins: [centerTextPlugin]
    });
  }
}