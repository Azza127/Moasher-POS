import { OrderItem } from './order-item.model';

export interface Order {
    id: number;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: 'Cash' | 'Card';
    status: 'Completed' | 'Cancelled';
    createdAt: string;
}