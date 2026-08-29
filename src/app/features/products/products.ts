import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { PopupService } from '../../core/services/popup.service';

import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';

import { CategoryService } from '../../core/services/category.service';
import { Category } from '../../core/models/category.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, DecimalPipe, RouterLink],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  searchMode: 'name' | 'sku' = 'name';
  userRole = 'Employee';

  get isEmployee(): boolean {
    return this.userRole.trim().toLowerCase() === 'employee';
  }

  private readonly searchSubject = new Subject<string>();
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly popupService = inject(PopupService);
  private readonly cdr = inject(ChangeDetectorRef);

  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];

  searchTerm = '';
  selectedCategoryId: string | null = null;
  showAddForm = false;
  editingProductId: string | null = null;

  showDeleteModal = false;
  productToDelete: Product | null = null;

  showAddCategoryModal = false;
  newCategoryName = '';

  newProduct: Product = {
    id: '',
    name: '',
    description: '',
    sku: '',
    categoryId: '',
    price: 0,
    stock: 0,
    maxStock: 0,
    minStock: 0,
    image: ''
  };

  ngOnInit(): void {
    const user = localStorage.getItem('currentUser');
    if (user) {
      try {
        const currentUser = JSON.parse(user);
        this.userRole = currentUser.role || 'Employee';
      } catch (e) {
        this.popupService.showAlert('Error parsing current user', 'error');
      }
    }
    this.loadProducts();
    this.loadCategories();

    this.searchSubject
      .pipe(debounceTime(400))
      .subscribe((term) => {
        this.searchTerm = term;
        this.applyFilters();
        this.cdr.markForCheck();
      });
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products: Product[]) => {
        this.products = products;
        this.applyFilters();
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        console.error('Failed to load products:', error);
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories: Category[]) => {
        this.categories = categories;
        this.applyFilters();
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        console.error('Failed to load categories:', error);
      }
    });
  }

  showAddProductForm(): void {
    if (this.isEmployee) return;
    this.resetProductForm();
    this.showAddForm = true;
  }

  cancelAddProduct(): void {
    this.resetProductForm();
    this.showAddForm = false;
    this.closeAddCategoryModal();
  }

  cancelEdit(): void {
    this.resetProductForm();
    this.showAddForm = false;
    this.closeAddCategoryModal();
  }

  searchProducts(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  filterByCategory(categoryId: string): void {
    this.selectedCategoryId = categoryId || null;
    this.applyFilters();
  }

  private applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    let filtered = this.products.filter((product) => {
      const searchValue =
        this.searchMode === 'name'
          ? product.name.toLowerCase()
          : product.sku.toLowerCase();

      const matchesSearch = term === '' || searchValue.includes(term);

      const matchesCategory =
        this.selectedCategoryId === null ||
        product.categoryId === this.selectedCategoryId;

      return matchesSearch && matchesCategory;
    });

    if (term !== '') {
      filtered.sort((a, b) => {
        const aValue =
          this.searchMode === 'name'
            ? a.name.toLowerCase()
            : a.sku.toLowerCase();

        const bValue =
          this.searchMode === 'name'
            ? b.name.toLowerCase()
            : b.sku.toLowerCase();

        return aValue.indexOf(term) - bValue.indexOf(term);
      });
    }

    this.filteredProducts = filtered;
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find((c) => c.id === categoryId);
    return category ? category.name : 'Unknown';
  }

  getStockStatus(product: Product): 'optimal' | 'low' | 'out' {
    if (product.stock <= 0) return 'out';
    if (product.stock <= product.minStock) return 'low';
    return 'optimal';
  }

  getStockPercentage(product: Product): number {
    if (product.maxStock <= 0) return 0;
    return Math.min(100, Math.max(0, (product.stock / product.maxStock) * 100));
  }

  startEdit(product: Product): void {
    if (this.isEmployee) return;
    this.editingProductId = product.id;
    this.newProduct = { ...product };
    this.showAddForm = true;
    this.cdr.markForCheck();
  }

  deleteProduct(product: Product): void {
    if (this.isEmployee) return;
    this.productToDelete = product;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.productToDelete = null;
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    if (!this.productToDelete) return;

    const productId = this.productToDelete.id;

    this.productService.deleteProduct(productId).subscribe({
      next: () => {
        this.products = this.products.filter((p) => p.id !== productId);
        this.applyFilters();
        this.productToDelete = null;
        this.showDeleteModal = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        console.error('Failed to delete product:', error);
      }
    });
  }

  addProduct(): void {
    const name = this.newProduct.name.trim();
    const sku = this.newProduct.sku.trim();

    if (
      name === '' ||
      sku === '' ||
      this.newProduct.categoryId === '' ||
      this.newProduct.price <= 0 ||
      this.newProduct.stock < 0 ||
      this.newProduct.maxStock <= 0 ||
      this.newProduct.minStock < 0 ||
      this.newProduct.stock > this.newProduct.maxStock
    ) {
      console.log('Invalid product data');
      return;
    }

    const productToSave: Product = {
      ...this.newProduct,
      name,
      sku
    };

    if (this.editingProductId) {
      this.productService
        .updateProduct(this.editingProductId, productToSave)
        .subscribe({
          next: (updatedProduct: Product) => {
            const normalizedProduct: Product = {
              ...updatedProduct,
              id: String(updatedProduct.id),
              categoryId: String(updatedProduct.categoryId)
            };

            this.products = this.products.map((p) =>
              p.id === normalizedProduct.id ? normalizedProduct : p
            );

            this.applyFilters();
            this.resetProductForm();
            this.showAddForm = false;
            this.cdr.markForCheck();
          },
          error: (error: unknown) => {
            console.error('Failed to update product:', error);
          }
        });
      return;
    }

    this.productService.createProduct(productToSave).subscribe({
      next: (createdProduct: Product) => {
        const normalizedProduct: Product = {
          ...createdProduct,
          id: String(createdProduct.id),
          categoryId: String(createdProduct.categoryId)
        };

        this.products = [...this.products, normalizedProduct];
        this.applyFilters();
        this.resetProductForm();
        this.showAddForm = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        console.error('Failed to create product:', error);
      }
    });
  }

  openAddCategoryModal(): void {
    if (this.isEmployee) return;
    this.newCategoryName = '';
    this.showAddCategoryModal = true;
  }

  closeAddCategoryModal(): void {
    this.newCategoryName = '';
    this.showAddCategoryModal = false;
  }

  saveNewCategory(): void {
    const name = this.newCategoryName.trim();
    if (name === '') return;

    this.categoryService.addCategory({ name }).subscribe({
      next: (createdCategory: Category) => {
        const normalizedCategory: Category = {
          ...createdCategory,
          id: String(createdCategory.id)
        };

        this.categories = [...this.categories, normalizedCategory];
        this.newProduct.categoryId = normalizedCategory.id;
        this.closeAddCategoryModal();
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        console.error('Failed to add category:', error);
      }
    });
  }

  resetProductForm(): void {
    this.newProduct = {
      id: '',
      name: '',
      description: '',
      sku: '',
      categoryId: '',
      price: 0,
      stock: 0,
      maxStock: 0,
      minStock: 0,
      image: ''
    };
    this.editingProductId = null;
  }
}