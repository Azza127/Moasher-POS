export interface OrderItem {
    productId: number;
    productName: string;
    price: number;
    quantity: number;
    total: number;
    image?: string;
}