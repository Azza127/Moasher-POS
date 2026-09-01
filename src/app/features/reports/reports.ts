import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  forkJoin,
  of
} from 'rxjs';

import {
  catchError,
  finalize
} from 'rxjs/operators';

import {
  Chart,
  registerables
} from 'chart.js';

import { FormsModule } from '@angular/forms';
import { HostListener } from '@angular/core';

Chart.register(...registerables);

import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { OrderService } from '../../core/services/order.service';

import { Product } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { Order } from '../../core/models/order.model';


/* =========================================================
   INTERFACES
   ========================================================= */

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


/* =========================================================
   COMPONENT
   ========================================================= */

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit {

  private productService =
    inject(ProductService);

  private categoryService =
    inject(CategoryService);

  private orderService =
    inject(OrderService);

  private cdr =
    inject(ChangeDetectorRef);


  /* =======================================================
     DATA
     ======================================================= */

  products: Product[] = [];

  categories: Category[] = [];

  orders: Order[] = [];


  /* =======================================================
     FILTER
     ======================================================= */

  selectedPeriod: string = 'all';

  isPeriodDropdownOpen: boolean = false;


  /* =======================================================
     STATE
     ======================================================= */

  isLoading: boolean = true;

  errorMessage: string = '';


  /* =======================================================
     SUMMARY
     ======================================================= */

  totalSales: number = 0;

  totalOrdersCount: number = 0;


  /* =======================================================
     REPORTS
     ======================================================= */

  categoryReports: CategoryReport[] = [];

  topProducts: TopProductReport[] = [];


  /* =======================================================
     PERIOD DROPDOWN
     ======================================================= */

  togglePeriodDropdown(): void {

    this.isPeriodDropdownOpen =
      !this.isPeriodDropdownOpen;

  }


  selectPeriod(period: string): void {

    this.selectedPeriod = period;

    this.isPeriodDropdownOpen = false;

    this.onPeriodChange();

  }


  getSelectedPeriodLabel(): string {

    switch (this.selectedPeriod) {

      case 'month':
        return '📅 This Month';

      case 'year':
        return '📅 This Year';

      default:
        return '📅 All Time';
    }

  }


  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {

    const target =
      event.target as HTMLElement;

    if (
      !target.closest(
        '.custom-period-dropdown'
      )
    ) {

      this.isPeriodDropdownOpen = false;

    }

  }


  /* =======================================================
     INVENTORY
     ======================================================= */

  inventoryValuation: InventoryValuation = {

    totalCost: 0,

    potentialRevenue: 0,

    totalItemsInStock: 0,

    profitMargin: 0

  };


  /* =======================================================
     CHART INSTANCES
     ======================================================= */

  lineChart: Chart | null = null;

  doughnutChart: Chart | null = null;


  /* =======================================================
     CATEGORY COLORS

     KEEPING YOUR CURRENT CATEGORY COLORS
     ======================================================= */

  categoryColors: string[] = [

    '#12A39F', // Electronics
    '#4F7CAC', // Accessories
    '#8E7DBE', // Stationery
    '#E3A857', // Foods
    '#D96C75', // Clothes
    '#6FA58A', // Drinks
    '#D48A5A', // Perfumes
    '#7C8C9A'  // Cleaning Supplies

  ];


  /* =======================================================
     INIT
     ======================================================= */

  ngOnInit(): void {

    this.loadReportData();

  }


  /* =======================================================
     CATEGORY COLOR
     ======================================================= */

  getCategoryColor(index: number): string {

    return this.categoryColors[
      index % this.categoryColors.length
    ];

  }


  /* =======================================================
     PERIOD CHANGE
     ======================================================= */

  onPeriodChange(): void {

    this.calculateReports();

    setTimeout(() => {

      this.renderLineChart();

      this.renderDoughnutChart();

    }, 50);

  }


  /* =======================================================
     LOAD DATA
     ======================================================= */

  loadReportData(): void {

    this.isLoading = true;

    this.errorMessage = '';


    forkJoin({

      products:

        this.productService
          .getProducts()
          .pipe(
            catchError(() => of([]))
          ),


      categories:

        this.categoryService
          .getCategories()
          .pipe(
            catchError(() => of([]))
          ),


      orders:

        this.orderService
          .getOrders()
          .pipe(
            catchError(() => of([]))
          )

    })
      .pipe(

        finalize(() => {

          this.isLoading = false;

          this.cdr.detectChanges();

        })

      )
      .subscribe({

        next: (res) => {

          this.products =
            res.products || [];


          this.categories =
            res.categories || [];


          this.orders =
            res.orders || [];


          this.calculateReports();

          this.cdr.detectChanges();


          setTimeout(() => {

            this.renderLineChart();

            this.renderDoughnutChart();

          }, 100);

        },


        error: () => {

          this.errorMessage =
            'Unable to load reports data.';

        }

      });

  }


  /* =======================================================
     CALCULATE REPORTS
     ======================================================= */

  private calculateReports(): void {

    const allCompleted =
      this.orders.filter(
        order =>
          order.status === 'Completed'
      );


    const completedOrders =
      this.filterOrdersByPeriod(
        allCompleted
      );


    this.totalOrdersCount =
      completedOrders.length;


    this.totalSales =
      completedOrders.reduce(
        (sum, order) =>
          sum + (order.total || 0),
        0
      );


    this.calculateCategorySales(
      completedOrders
    );


    this.calculateTopProducts(
      completedOrders
    );


    this.calculateInventoryValuation();

  }


  /* =======================================================
     FILTER ORDERS
     ======================================================= */

  private filterOrdersByPeriod(
    completedOrders: Order[]
  ): Order[] {

    const now =
      new Date();


    return completedOrders.filter(
      order => {

        const orderDate =
          new Date(
            order.createdAt
          );


        if (
          this.selectedPeriod === 'month'
        ) {

          return (

            orderDate.getMonth() ===
              now.getMonth() &&

            orderDate.getFullYear() ===
              now.getFullYear()

          );

        }


        if (
          this.selectedPeriod === 'year'
        ) {

          return (

            orderDate.getFullYear() ===
            now.getFullYear()

          );

        }


        return true;

      }
    );

  }


  /* =======================================================
     CATEGORY SALES
     ======================================================= */

  private calculateCategorySales(
    completedOrders: Order[]
  ): void {

    const categorySalesMap =
      new Map<string, number>();


    const productCategoryMap =
      new Map<string, string>();


    this.products.forEach(
      product => {

        productCategoryMap.set(

          String(product.id),

          String(product.categoryId)

        );

      }
    );


    completedOrders.forEach(
      order => {

        (order.items || []).forEach(
          item => {

            const categoryId =
              productCategoryMap.get(
                String(item.productId)
              );


            if (!categoryId) {

              return;

            }


            const currentTotal =
              categorySalesMap.get(
                categoryId
              ) || 0;


            categorySalesMap.set(

              categoryId,

              currentTotal +
              (item.total || 0)

            );

          }
        );

      }
    );


    this.categoryReports =

      this.categories

        .map(category => {

          const sales =
            categorySalesMap.get(
              String(category.id)
            ) || 0;


          const percentage =
            this.totalSales > 0

              ? (
                  sales /
                  this.totalSales
                ) * 100

              : 0;


          return {

            categoryId:
              String(category.id),

            categoryName:
              category.name,

            totalSales:
              sales,

            percentage:
              Number(
                percentage.toFixed(1)
              )

          };

        })

        .filter(
          category =>
            category.totalSales > 0
        );

  }


  /* =======================================================
     TOP PRODUCTS
     ======================================================= */

  private calculateTopProducts(
    completedOrders: Order[]
  ): void {

    const productStatsMap =
      new Map<
        string,
        {
          name: string;
          units: number;
          revenue: number;
        }
      >();


    completedOrders.forEach(
      order => {

        (order.items || []).forEach(
          item => {

            const productId =
              String(item.productId);


            const existing =
              productStatsMap.get(
                productId
              ) || {

                name:
                  item.productName || '',

                units: 0,

                revenue: 0

              };


            productStatsMap.set(

              productId,

              {

                name:
                  item.productName ||
                  existing.name,

                units:
                  existing.units +
                  (item.quantity || 0),

                revenue:
                  existing.revenue +
                  (item.total || 0)

              }

            );

          }
        );

      }
    );


    this.topProducts =

      Array.from(
        productStatsMap.entries()
      )

        .map(
          ([id, stat]) => {

            const sharePercentage =
              this.totalSales > 0

                ? (
                    stat.revenue /
                    this.totalSales
                  ) * 100

                : 0;


            const trendVal =
              Number(
                sharePercentage.toFixed(1)
              );


            return {

              productId:
                id,

              productName:
                stat.name,

              unitsSold:
                stat.units,

              revenue:
                stat.revenue,

              trend:
                trendVal,

              isPositive:
                trendVal >= 0

            };

          }
        )

        .sort(
          (a, b) =>
            b.unitsSold -
            a.unitsSold
        )

        .slice(0, 5);

  }


  /* =======================================================
     INVENTORY VALUATION
     ======================================================= */

  private calculateInventoryValuation(): void {

    let totalCost = 0;

    let potentialRevenue = 0;

    let totalItemsInStock = 0;


    this.products.forEach(
      product => {

        const stock =
          product.stock || 0;


        const price =
          product.price || 0;


        const costPrice =
          product.costPrice ??
          (price * 0.65);


        totalCost +=
          costPrice * stock;


        potentialRevenue +=
          price * stock;


        totalItemsInStock +=
          stock;

      }
    );


    const profitMargin =
      potentialRevenue > 0

        ? (

            (

              potentialRevenue -
              totalCost

            ) /

            potentialRevenue

          ) * 100

        : 0;


    this.inventoryValuation = {

      totalCost,

      potentialRevenue,

      totalItemsInStock,

      profitMargin:
        Number(
          profitMargin.toFixed(1)
        )

    };

  }


  /* =======================================================
     EXPORT CSV
     ======================================================= */

  exportCSV(): void {

    let csvContent =
      'data:text/csv;charset=utf-8,';


    csvContent +=
      'Category Name,Total Sales ($),Percentage (%)\n';


    this.categoryReports.forEach(
      category => {

        csvContent +=

          `"${category.categoryName}",` +
          `${category.totalSales},` +
          `${category.percentage}%\n`;

      }
    );


    csvContent +=
      '\nProduct Name,Units Sold,Revenue ($)\n';


    this.topProducts.forEach(
      product => {

        csvContent +=

          `"${product.productName}",` +
          `${product.unitsSold},` +
          `${product.revenue}\n`;

      }
    );


    const encodedUri =
      encodeURI(csvContent);


    const link =
      document.createElement('a');


    link.setAttribute(
      'href',
      encodedUri
    );


    link.setAttribute(
      'download',
      `Sales_Report_${this.selectedPeriod}.csv`
    );


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

  }


  /* =======================================================
     EXPORT PDF
     ======================================================= */

  exportPDF(): void {

    window.print();

  }


  /* =======================================================
     LINE CHART
     ======================================================= */

  private renderLineChart(): void {

    const canvas =
      document.getElementById(
        'salesLineChart'
      ) as HTMLCanvasElement;


    if (!canvas) {

      return;

    }


    const ctx =
      canvas.getContext('2d');


    if (!ctx) {

      return;

    }


    /* Destroy old chart */

    if (this.lineChart) {

      this.lineChart.destroy();

      this.lineChart = null;

    }


    /* -----------------------------------------------------
       Filter orders according to selected period
       ----------------------------------------------------- */

    const allCompleted =
      this.orders.filter(
        order =>
          order.status === 'Completed'
      );


    const completedOrders =
      this.filterOrdersByPeriod(
        allCompleted
      );


    /* -----------------------------------------------------
       Group sales by date
       ----------------------------------------------------- */

    const salesByDateMap =
      new Map<string, number>();


    completedOrders.forEach(
      order => {

        const dateLabel =
          new Date(
            order.createdAt
          ).toLocaleDateString(
            'en-US',
            {
              month: 'short',
              day: 'numeric'
            }
          );


        const currentSales =
          salesByDateMap.get(
            dateLabel
          ) || 0;


        salesByDateMap.set(

          dateLabel,

          currentSales +
          (order.total || 0)

        );

      }
    );


    let labels =
      Array.from(
        salesByDateMap.keys()
      );


    let dataPoints =
      Array.from(
        salesByDateMap.values()
      );


    /* -----------------------------------------------------
       Empty / single value
       ----------------------------------------------------- */

    if (labels.length === 1) {

      labels = [
        'Start',
        labels[0]
      ];

      dataPoints = [
        0,
        dataPoints[0]
      ];

    }

    else if (
      labels.length === 0
    ) {

      labels = [
        'No Sales Yet'
      ];

      dataPoints = [
        0
      ];

    }


    /* -----------------------------------------------------
       Chart Area Color

       NO RGBA
       NO CSS3 COLORS
       NO OLD GREEN
       ----------------------------------------------------- */

    const chartAreaColor =
      '#E3F3F1';


    /* -----------------------------------------------------
       Chart
       ----------------------------------------------------- */

    this.lineChart =

      new Chart(
        canvas,
        {

          type: 'line',


          data: {

            labels,


            datasets: [

              {

                label:
                  'Revenue',

                data:
                  dataPoints,


                /* Main website teal */

                borderColor:
                  '#12A39F',


                borderWidth:
                  2,


                /* Flat light teal area */

                backgroundColor:
                  chartAreaColor,


                fill:
                  true,


                tension:
                  0.38,


                pointRadius:
                  4,


                pointHoverRadius:
                  5,


                pointBackgroundColor:
                  '#12A39F',


                pointBorderColor:
                  '#FFFFFF',


                pointBorderWidth:
                  2

              }

            ]

          },


          options: {

            responsive:
              true,

            maintainAspectRatio:
              false,


            interaction: {

              intersect:
                false,

              mode:
                'index'

            },


            plugins: {

              legend: {

                display:
                  false

              },


              tooltip: {

                enabled:
                  true,

                backgroundColor:
                  '#26302B',

                titleColor:
                  '#FCFCF8',

                bodyColor:
                  '#FCFCF8',

                borderWidth:
                  0,

                padding:
                  10,

                displayColors:
                  false,


                callbacks: {

                  label:
                    (context) => {

                      const value =
                        context.parsed.y ??
                        0;


                      return (

                        ` Sales: $` +
                        value.toFixed(2)

                      );

                    }

                }

              }

            },


            scales: {

              x: {

                grid: {

                  display:
                    false

                },


                border: {

                  display:
                    false

                },


                ticks: {

                  color:
                    '#8A8178',

                  font: {

                    size:
                      11

                  },

                  padding:
                    8

                }

              },


              y: {

                beginAtZero:
                  true,


                grid: {

                  color:
                    '#E4DED4',

                  lineWidth:
                    1

                },


                border: {

                  display:
                    false

                },


                ticks: {

                  color:
                    '#8A8178',

                  font: {

                    size:
                      11

                  },

                  padding:
                    8,


                  callback:
                    (value) => {

                      return '$' + value;

                    }

                }

              }

            }

          }

        }

      );

  }


  /* =======================================================
     DOUGHNUT CHART
     ======================================================= */

  private renderDoughnutChart(): void {

    const canvas =
      document.getElementById(
        'categoryDoughnutChart'
      ) as HTMLCanvasElement;


    if (!canvas) {

      return;

    }


    if (this.doughnutChart) {

      this.doughnutChart.destroy();

      this.doughnutChart = null;

    }


    const hasCategoryData =
      this.categoryReports.length > 0;


    const labels =
      hasCategoryData

        ? this.categoryReports.map(
            category =>
              category.categoryName
          )

        : ['No Category Sales'];


    const data =
      hasCategoryData

        ? this.categoryReports.map(
            category =>
              category.totalSales
          )

        : [1];


    /* -----------------------------------------------------
       Center Text Plugin
       ----------------------------------------------------- */

    const centerTextPlugin = {

      id:
        'centerText',


      beforeDraw:
        (chart: any) => {

          const {
            width,
            height,
            ctx
          } = chart;


          ctx.save();


          const formattedSales =
            this.totalSales >= 1000

              ? `$${(
                  this.totalSales /
                  1000
                ).toFixed(0)}k`

              : `$${this.totalSales.toFixed(0)}`;


          /* Main value */

          ctx.font =
            '700 24px Inter, sans-serif';


          ctx.fillStyle =
            '#252A27';


          ctx.textAlign =
            'center';


          ctx.textBaseline =
            'middle';


          ctx.fillText(

            formattedSales,

            width / 2,

            height / 2 - 8

          );


          /* Subtitle */

          ctx.font =
            '500 12px Inter, sans-serif';


          ctx.fillStyle =
            '#8A8178';


          ctx.fillText(

            'Total Sales',

            width / 2,

            height / 2 + 15

          );


          ctx.restore();

        }

    };


    /* -----------------------------------------------------
       Doughnut
       ----------------------------------------------------- */

    this.doughnutChart =

      new Chart(
        canvas,
        {

          type:
            'doughnut',


          data: {

            labels,


            datasets: [

              {

                data,


                /* KEEP CATEGORY COLORS EXACTLY AS THEY ARE */

                backgroundColor:

                  hasCategoryData

                    ? this.categoryReports.map(
                        (_, index) =>
                          this.getCategoryColor(
                            index
                          )
                      )

                    : ['#D5D8D0'],


                borderWidth:
                  3,


                borderColor:
                  '#FCFCF8',


                hoverOffset:
                  4

              }

            ]

          },


          options: {

            responsive:
              true,

            maintainAspectRatio:
              false,


            cutout:
              '70%',


            rotation:
              -90,


            plugins: {

              legend: {

                display:
                  false

              },


              tooltip: {

                enabled:
                  true,

                backgroundColor:
                  '#26302B',

                titleColor:
                  '#FCFCF8',

                bodyColor:
                  '#FCFCF8',

                padding:
                  10

              }

            }

          },


          plugins: [

            centerTextPlugin

          ]

        }

      );

  }

}