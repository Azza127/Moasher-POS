import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CategoryService } from '../../core/services/category.service';
import { Category } from '../../core/models/category.model';

@Component({
  selector: 'app-categories',
  imports: [FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly cdr = inject(ChangeDetectorRef);

  categories: Category[] = [];

  newCategoryName = '';

  editingCategoryId: string | null = null;

  showCategoryModal = false;

  showDeleteModal = false;
  categoryToDelete: Category | null = null;

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
      }
    });
  }

  openAddCategory(): void {
    this.newCategoryName = '';
    this.editingCategoryId = null;
    this.showCategoryModal = true;
  }

  openEditCategory(category: Category): void {
    this.newCategoryName = category.name;
    this.editingCategoryId = category.id;
    this.showCategoryModal = true;
  }

  closeCategoryModal(): void {
    this.newCategoryName = '';
    this.editingCategoryId = null;
    this.showCategoryModal = false;
  }

  saveCategory(): void {
    const name = this.newCategoryName.trim();

    if (name === '') {
      return;
    }

    if (this.editingCategoryId !== null) {
      this.categoryService
        .updateCategory(this.editingCategoryId, { name })
        .subscribe({
          next: (updatedCategory) => {
            this.categories = this.categories.map((category) =>
              category.id === updatedCategory.id
                ? updatedCategory
                : category
            );

            this.closeCategoryModal();
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Failed to update category:', error);
          }
        });

      return;
    }

    this.categoryService
      .addCategory({ name })
      .subscribe({
        next: (createdCategory) => {
          this.categories = [
            ...this.categories,
            createdCategory
          ];

          this.closeCategoryModal();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to add category:', error);
        }
      });
  }

  openDeleteCategory(category: Category): void {
    this.categoryToDelete = category;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.categoryToDelete = null;
    this.showDeleteModal = false;
  }

  confirmDeleteCategory(): void {
    if (!this.categoryToDelete) {
      return;
    }

    const categoryId = this.categoryToDelete.id;

    this.categoryService.deleteCategory(categoryId).subscribe({
      next: () => {
        this.categories = this.categories.filter(
          (category) => category.id !== categoryId
        );

        this.categoryToDelete = null;
        this.showDeleteModal = false;

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to delete category:', error);
      }
    });
  }
}

