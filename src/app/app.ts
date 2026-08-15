import { Component, OnInit, inject } from '@angular/core';
import { ProductService } from './core/services/product.service';
import { Product } from './core/models/product.model';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly productService = inject(ProductService);

  products: Product[] = [];

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
  this.products = products;
  },
      error: (error) => {
        console.error('Failed to load products:', error);
      }
    });
  }
}
