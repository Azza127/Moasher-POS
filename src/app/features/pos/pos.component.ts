import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.css',
})
export class PosComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly orderService = inject(OrderService);
  private readonly categoryService = inject(CategoryService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly popupService = inject(PopupService);

  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];

  cart: OrderItem[] = [];
  receiptCart: OrderItem[] = [];

  selectedCategoryId: string = 'ALL';
  searchQuery: string = '';
  paymentMethod: 'Cash' | 'Card' = 'Cash';
  taxRate: number = 0.14;
  currentDate: Date = new Date();

  
  currentTicketNumber: string = '';


  showSuccessModal: boolean = false;
  lastOrderTotal: number = 0;
  lastPaymentMethod: string = '';
  lastTicketNumber: string = '';

  ngOnInit(): void {
    this.generateTicketNumber();
    this.loadData();
  }

  
  generateTicketNumber(): void {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // رقم من 4 خانات
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const randomChar = letters.charAt(Math.floor(Math.random() * letters.length));
    this.currentTicketNumber = `#${randomNum}-${randomChar}`;
  }

  loadData(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data.map((p) => ({ ...p, id: String(p.id) }));
        this.filterProducts();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching products:', err),
    });

    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching categories:', err),
    });
  }

  filterProducts(): void {
    const query = (this.searchQuery || '').trim().toLowerCase();
    this.filteredProducts = this.products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.sku && product.sku.toLowerCase().includes(query));
      const matchesCategory =
        this.selectedCategoryId === 'ALL' ||
        String(product.categoryId) === String(this.selectedCategoryId);
      return matchesSearch && matchesCategory;
    });
  }

  selectCategory(categoryId: string): void {
    this.selectedCategoryId = categoryId;
    this.filterProducts();
  }

  addToCart(product: Product): void {
    if (product.stock <= 0) {
      this.popupService.showAlert('Product is out of stock!', 'warning', 'Out of Stock');
      return;
    }

    product.stock -= 1;
    const existingItem = this.cart.find((item) => String(item.productId) === String(product.id));

    if (existingItem) {
      existingItem.quantity += 1;
      existingItem.total = existingItem.quantity * existingItem.price;
    } else {
      this.cart.push({
        productId: product.id as any,
        productName: product.name,
        price: product.price,
        quantity: 1,
        total: product.price,
      });
    }
  }

  updateQuantity(item: OrderItem, change: number): void {
    const product = this.products.find((p) => String(p.id) === String(item.productId));

    if (change > 0) {
      if (product && product.stock > 0) {
        product.stock -= 1;
        item.quantity += 1;
        item.total = item.quantity * item.price;
      } else {
        this.popupService.showAlert('No more stock available!', 'warning', 'Out of Stock');
      }
    } else if (change < 0) {
      if (product) {
        product.stock += 1;
      }
      item.quantity -= 1;

      if (item.quantity <= 0) {
        this.cart = this.cart.filter((i) => String(i.productId) !== String(item.productId));
      } else {
        item.total = item.quantity * item.price;
      }
    }
  }

  removeFromCart(item: OrderItem): void {
    const product = this.products.find((p) => String(p.id) === String(item.productId));
    if (product) {
      product.stock += item.quantity;
    }
    this.cart = this.cart.filter((i) => String(i.productId) !== String(item.productId));
  }

  clearCart(): void {
    this.cart.forEach((item) => {
      const product = this.products.find((p) => String(p.id) === String(item.productId));
      if (product) {
        product.stock += item.quantity;
      }
    });
    this.cart = [];
  }

  get subtotal(): number {
    return this.cart.reduce((sum, item) => sum + item.total, 0);
  }

  get tax(): number {
    return this.subtotal * this.taxRate;
  }

  get total(): number {
    return this.subtotal + this.tax;
  }

  checkout(): void {
    if (this.cart.length === 0) return;

    this.currentDate = new Date();
    this.lastOrderTotal = this.total;
    this.lastPaymentMethod = this.paymentMethod;
    this.lastTicketNumber = this.currentTicketNumber; 
    this.receiptCart = [...this.cart];

    const newOrder = {
      ticketNumber: this.currentTicketNumber, 
      items: this.cart,
      subtotal: Number(this.subtotal.toFixed(2)),
      tax: Number(this.tax.toFixed(2)),
      total: Number(this.total.toFixed(2)),
      paymentMethod: this.paymentMethod,
      status: 'Completed' as const,
      createdAt: this.currentDate.toISOString(),
    };

    this.orderService.createOrder(newOrder as any).subscribe({
      next: () => {
        const updateRequests = this.cart
          .map((item) => {
            const product = this.products.find((p) => String(p.id) === String(item.productId));
            if (product) {
              const updatedProduct = { ...product, stock: product.stock };
              return this.productService.updateProduct(product.id, updatedProduct as any);
            }
            return null;
          })
          .filter((req) => req !== null);

        forkJoin(updateRequests).subscribe({
          next: () => {
            this.cart = [];
            this.showSuccessModal = true;
            this.cdr.detectChanges();
          },
          error: (err) => console.error('Error updating stocks:', err),
        });
      },
      error: (err) => {
        console.error('Error creating order:', err);
        this.popupService.showAlert('Failed to process checkout!', 'error', 'Checkout Failed');
      },
    });
  }

  printReceipt(): void {
    window.print();
  }

  closeModal(): void {
    this.showSuccessModal = false;
    this.generateTicketNumber(); // توليد رقم تذكرة جديد فور إغلاق النافذة والبدء بطلب جديد
  }
}
