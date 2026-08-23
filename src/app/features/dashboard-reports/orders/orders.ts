import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class Orders implements OnInit {
  private orderService = inject(OrderService);

  orders = signal<Order[]>([]);
  loading = signal<boolean>(true);
  statusFilter = signal<string>('All');

  filteredOrders = computed(() => {
    const filter = this.statusFilter();
    
   const all = [...this.orders()].sort((a: any, b: any) => {
  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return dateB - dateA;
});

    return filter === 'All' ? all : all.filter((o: any) => o.status === filter);
  });

  ngOnInit(): void {
    // تم التغيير إلى getOrders() هنا
    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error fetching orders:', err);
        this.loading.set(false);
      }
    });
  }

  setFilter(status: string): void {
    this.statusFilter.set(status);
  }
}