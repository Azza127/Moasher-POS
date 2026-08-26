export interface OrderItem {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id?: number;
  customerName?: string;
  items: OrderItem[];
  total: number;
  totalAmount?: number;
  status: 'Completed' | 'Pending' | 'Cancelled';
  createdAt: string;
}