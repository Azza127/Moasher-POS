import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StoreSettingsService } from '../../core/services/store-settings.service';
import { StoreSettings } from '../../core/models/store-settings.model';

import { ProductService } from '../../core/services/product.service';
import { OrderService } from '../../core/services/order.service';
import { CategoryService } from '../../core/services/category.service';
import { PopupService } from '../../core/services/popup.service';

import { Product } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { OrderItem } from '../../core/models/order-item.model';

import { forkJoin } from 'rxjs';


@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.css',
})
export class PosComponent implements OnInit {

  /* SERVICES */

  private readonly productService = inject(ProductService);
  private readonly orderService = inject(OrderService);
  private readonly categoryService = inject(CategoryService);
  private readonly storeSettingsService = inject(StoreSettingsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly popupService = inject(PopupService);


  /* PERSISTED POS SETTINGS */

  private readonly TICKET_STORAGE_KEY = 'pos_ticket';
  private readonly PAYMENT_STORAGE_KEY = 'pos_payment';


  /* DATA */

  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];


  /* CART */

  /*
   * The cart is intentionally NOT stored in localStorage.
   * It is a temporary transaction state.
   *
   * If the POS is closed or the user changes account,
   * the cart starts empty again.
   */
  cart: OrderItem[] = [];

  receiptCart: OrderItem[] = [];


  /* FILTERS */

  selectedCategoryId: string = 'ALL';
  searchQuery: string = '';


  /* PAYMENT */

  paymentMethod: 'Cash' | 'Card' = 'Cash';

  taxRate: number = 0.14;

  currency: string = 'EGP';
  currencySymbol: string = 'EGP';


  /* DATE / TICKET */

  currentDate: Date = new Date();
  currentTicketNumber: string = '';


  /* SUCCESS MODAL */

  showSuccessModal: boolean = false;

  lastOrderTotal: number = 0;
  lastPaymentMethod: string = '';
  lastTicketNumber: string = '';


  /* INIT */

  ngOnInit(): void {
    this.loadTicketNumber();
    this.loadPaymentMethod();
    this.loadStoreSettings();
    this.loadData();
  }


  /* STORE SETTINGS */

  loadStoreSettings(): void {

    this.storeSettingsService
      .getOrLoadSettings()
      .subscribe({

        next: (settings: StoreSettings | null) => {

          if (!settings) {
            return;
          }

          /* TAX */

          this.taxRate = Number(settings.taxRate) / 100;


          /* CURRENCY */

          this.currency = settings.currency;

          this.currencySymbol =
            this.storeSettingsService.getCurrencySymbol(
              settings.currency
            );


          console.log(
            'POS Settings:',
            {
              taxRate: this.taxRate,
              currency: this.currency,
              currencySymbol: this.currencySymbol,
            }
          );


          this.cdr.detectChanges();
        },

        error: (error: unknown) => {

          console.error(
            'Failed to load store settings:',
            error
          );

        },
      });
  }


  /* TICKET NUMBER */

  generateTicketNumber(): void {

    const randomNum =
      Math.floor(1000 + Math.random() * 9000);

    const letters =
      'ABCDEFGHJKLMNPQRSTUVWXYZ';

    const randomChar =
      letters.charAt(
        Math.floor(
          Math.random() * letters.length
        )
      );

    this.currentTicketNumber =
      `#${randomNum}-${randomChar}`;
  }


  saveTicketNumber(): void {

    localStorage.setItem(
      this.TICKET_STORAGE_KEY,
      this.currentTicketNumber
    );
  }


  loadTicketNumber(): void {

    const savedTicket =
      localStorage.getItem(
        this.TICKET_STORAGE_KEY
      );

    if (savedTicket) {

      this.currentTicketNumber =
        savedTicket;

    } else {

      this.generateTicketNumber();

    }
  }


  /* PAYMENT METHOD */

  savePaymentMethod(): void {

    localStorage.setItem(
      this.PAYMENT_STORAGE_KEY,
      this.paymentMethod
    );
  }


  loadPaymentMethod(): void {

    const savedPayment =
      localStorage.getItem(
        this.PAYMENT_STORAGE_KEY
      );

    if (
      savedPayment === 'Cash' ||
      savedPayment === 'Card'
    ) {

      this.paymentMethod =
        savedPayment;

    }
  }


  /* LOAD DATA */

  loadData(): void {

    /* PRODUCTS */

    this.productService
      .getProducts()
      .subscribe({

        next: (data) => {

          this.products =
            data.map((p) => ({
              ...p,
              id: String(p.id),
            }));

          /*
           * No cart restoration here.
           *
           * The cart is temporary and should always
           * start empty when the POS is opened.
           */

          this.filterProducts();

          this.cdr.detectChanges();
        },

        error: (err) => {

          console.error(
            'Error fetching products:',
            err
          );

        },
      });


    /* CATEGORIES */

    this.categoryService
      .getCategories()
      .subscribe({

        next: (data) => {

          this.categories = data;

          this.cdr.detectChanges();
        },

        error: (err) => {

          console.error(
            'Error fetching categories:',
            err
          );

        },
      });
  }


  /* FILTER PRODUCTS */

  filterProducts(): void {

    const query =
      (this.searchQuery || '')
        .trim()
        .toLowerCase();


    this.filteredProducts =
      this.products.filter((product) => {

        const matchesSearch =
          !query ||
          product.name
            .toLowerCase()
            .includes(query) ||
          (
            product.sku &&
            product.sku
              .toLowerCase()
              .includes(query)
          );


        const matchesCategory =
          this.selectedCategoryId === 'ALL' ||
          String(product.categoryId) ===
            String(this.selectedCategoryId);


        return (
          matchesSearch &&
          matchesCategory
        );
      });
  }


  /* SELECT CATEGORY */

  selectCategory(
    categoryId: string
  ): void {

    this.selectedCategoryId =
      categoryId;

    this.filterProducts();
  }


  /* PRODUCT IMAGE */

  getProductImage(
    item: OrderItem
  ): string {

    const product =
      this.products.find(
        (p) =>
          String(p.id) ===
          String(item.productId)
      );

    return (
      product?.image ||
      'https://via.placeholder.com/120x120?text=Product'
    );
  }


  /* ADD TO CART */

  addToCart(
    product: Product
  ): void {

    /* OUT OF STOCK */

    if (product.stock <= 0) {

      this.popupService.showAlert(
        'Product is out of stock!',
        'warning',
        'Out of Stock'
      );

      return;
    }


    /*
     * Reserve one unit locally while the product
     * is inside the current temporary cart.
     */

    product.stock -= 1;


    /* CHECK IF PRODUCT ALREADY EXISTS */

    const existingItem =
      this.cart.find(
        (item) =>
          String(item.productId) ===
          String(product.id)
      );


    if (existingItem) {

      existingItem.quantity += 1;

      existingItem.total =
        existingItem.quantity *
        existingItem.price;

    } else {

      this.cart.push({

        productId:
          product.id as any,

        productName:
          product.name,

        price:
          product.price,

        quantity:
          1,

        total:
          product.price,
      });
    }

    /*
     * IMPORTANT:
     * No localStorage save here.
     *
     * Cart is temporary.
     */
  }


  /* UPDATE QUANTITY */

  updateQuantity(
    item: OrderItem,
    change: number
  ): void {

    const product =
      this.products.find(
        (p) =>
          String(p.id) ===
          String(item.productId)
      );


    /* INCREASE */

    if (change > 0) {

      if (
        product &&
        product.stock > 0
      ) {

        product.stock -= 1;

        item.quantity += 1;

        item.total =
          item.quantity *
          item.price;

      } else {

        this.popupService.showAlert(
          'No more stock available!',
          'warning',
          'Out of Stock'
        );

        return;
      }
    }


    /* DECREASE */

    else if (change < 0) {

      /*
       * Return the removed quantity
       * back to the local stock.
       */

      if (product) {

        product.stock += 1;
      }


      item.quantity -= 1;


      /*
       * Remove the item completely
       * when quantity reaches zero.
       */

      if (item.quantity <= 0) {

        this.cart =
          this.cart.filter(
            (i) =>
              String(i.productId) !==
              String(item.productId)
          );

      } else {

        item.total =
          item.quantity *
          item.price;
      }
    }

    /*
     * No localStorage save.
     */
  }


  /* REMOVE FROM CART */

  removeFromCart(
    item: OrderItem
  ): void {

    const product =
      this.products.find(
        (p) =>
          String(p.id) ===
          String(item.productId)
      );


    /*
     * Return all units of this item
     * back to the local stock.
     */

    if (product) {

      product.stock +=
        item.quantity;
    }


    this.cart =
      this.cart.filter(
        (i) =>
          String(i.productId) !==
          String(item.productId)
      );

    /*
     * No localStorage save.
     */
  }


  /* CLEAR CART */

  clearCart(): void {

    /*
     * Return all reserved quantities
     * back to the local product stock.
     */

    this.cart.forEach((item) => {

      const product =
        this.products.find(
          (p) =>
            String(p.id) ===
            String(item.productId)
        );


      if (product) {

        product.stock +=
          item.quantity;
      }
    });


    /*
     * Empty the temporary cart.
     */

    this.cart = [];
  }


  /* TOTALS */

  get subtotal(): number {

    return this.cart.reduce(
      (sum, item) =>
        sum + item.total,
      0
    );
  }


  get tax(): number {

    return (
      this.subtotal *
      this.taxRate
    );
  }


  get total(): number {

    return (
      this.subtotal +
      this.tax
    );
  }


  /* CHECKOUT */

  checkout(): void {

    /*
     * Do nothing if there is no cart.
     */

    if (this.cart.length === 0) {

      return;
    }


    /* TRANSACTION INFORMATION */

    this.currentDate =
      new Date();

    this.lastOrderTotal =
      this.total;

    this.lastPaymentMethod =
      this.paymentMethod;

    this.lastTicketNumber =
      this.currentTicketNumber;


    /*
     * Keep a copy for the receipt
     * before clearing the cart.
     */

    this.receiptCart =
      [...this.cart];


    /* CREATE ORDER */

    const newOrder = {

      ticketNumber:
        this.currentTicketNumber,

      items:
        this.cart,

      subtotal:
        Number(
          this.subtotal.toFixed(2)
        ),

      tax:
        Number(
          this.tax.toFixed(2)
        ),

      total:
        Number(
          this.total.toFixed(2)
        ),

      paymentMethod:
        this.paymentMethod,

      status:
        'Completed' as const,

      createdAt:
        this.currentDate.toISOString(),
    };


    /*
     * First save the completed order.
     */

    this.orderService
      .createOrder(newOrder as any)
      .subscribe({

        next: () => {

          /*
           * After successfully creating the order,
           * update the stock in the database.
           */

          const updateRequests =
            this.cart
              .map((item) => {

                const product =
                  this.products.find(
                    (p) =>
                      String(p.id) ===
                      String(item.productId)
                  );


                if (product) {

                  const updatedProduct = {
                    ...product,
                    stock:
                      product.stock,
                  };


                  return this.productService
                    .updateProduct(
                      product.id,
                      updatedProduct as any
                    );

                }


                return null;
              })
              .filter(
                (req) =>
                  req !== null
              );


          /*
           * Wait until all stock updates finish.
           */

          forkJoin(updateRequests)
            .subscribe({

              next: () => {

                /*
                 * Checkout completed successfully.
                 *
                 * The temporary cart is now cleared.
                 */

                this.cart = [];


                this.showSuccessModal =
                  true;


                this.cdr.detectChanges();
              },


              error: (err) => {

                console.error(
                  'Error updating stocks:',
                  err
                );

              },
            });
        },


        error: (err) => {

          console.error(
            'Error creating order:',
            err
          );


          this.popupService.showAlert(
            'Failed to process checkout!',
            'error',
            'Checkout Failed'
          );
        },
      });
  }


  /* PRINT */

  printReceipt(): void {

    window.print();
  }


  /* CLOSE SUCCESS MODAL */

  closeModal(): void {

    this.showSuccessModal =
      false;


    /*
     * Generate a new ticket
     * for the next order.
     */

    this.generateTicketNumber();

    this.saveTicketNumber();
  }
}