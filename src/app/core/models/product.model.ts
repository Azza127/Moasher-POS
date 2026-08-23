export interface Product {
    id: number;
    name: string;
    sku: string;
    categoryId: number;
    price: number;
    stock: number;
    minStock: number;
    image?: string;
}