import { Product } from '../models/product.model';
import { Order } from '../models/order.model';
import { Category } from '../models/category.model';

export interface CategorySales {
  categoryId: number;
  categoryName: string;
  totalSales: number;
}

export interface ProductSales {
  productId: number;
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface DailySales {
  date: string;
  totalSales: number;
}

export class StatsUtil {
  static totalSales(orders: Order[]): number {
    return orders.reduce((sum, o) => sum + (o.total || 0), 0);
  }

  static lowStockProducts(products: Product[]): Product[] {
    return products.filter(p => p.stock <= p.minStock);
  }

  static recentOrders(orders: Order[], limit = 5): Order[] {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  static salesByCategory(orders: Order[], products: Product[], categories: Category[]): CategorySales[] {
    const productMap = new Map(products.map(p => [p.id, p]));
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    const totals = new Map<number, number>();

    for (const order of orders) {
      for (const item of order.items || []) {
        const product = productMap.get(item.productId);
        if (!product) continue;
        const lineTotal = item.total ?? (item.quantity * item.price);
        totals.set(product.categoryId, (totals.get(product.categoryId) || 0) + lineTotal);
      }
    }

    return Array.from(totals.entries())
      .map(([categoryId, totalSales]) => ({
        categoryId,
        categoryName: categoryMap.get(categoryId)?.name || 'Unknown',
        totalSales
      }))
      .sort((a, b) => b.totalSales - a.totalSales);
  }

  static topSellingProducts(orders: Order[], products: Product[]): ProductSales[] {
    const totals = new Map<number, { name: string; units: number; revenue: number }>();

    for (const order of orders) {
      for (const item of order.items || []) {
        const current = totals.get(item.productId) || { name: item.productName, units: 0, revenue: 0 };
        current.units += item.quantity;
        current.revenue += item.total ?? (item.quantity * item.price);
        totals.set(item.productId, current);
      }
    }

    return Array.from(totals.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        unitsSold: data.units,
        revenue: data.revenue
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold);
  }

  static salesOverTime(orders: Order[]): DailySales[] {
    const totals = new Map<string, number>();

    for (const order of orders) {
      const day = new Date(order.createdAt).toISOString().slice(0, 10);
      totals.set(day, (totals.get(day) || 0) + order.total);
    }

    return Array.from(totals.entries())
      .map(([date, totalSales]) => ({ date, totalSales }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}