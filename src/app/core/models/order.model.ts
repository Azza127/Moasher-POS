import { OrderItem } from './order-item.model';

export interface Order {
  id?: string;
  ticketNumber?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'Cash' | 'Card';
  status: 'Completed' | 'Pending' | 'Cancelled';
  createdAt: string;
}
