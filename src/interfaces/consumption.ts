export interface Consumption {
    id_consumption: number;
    date: string;
    id_home: number;
    productId: number;
    productType?: string;
    names: string;
    quantity: number;
    weight: number;
    price: number;
    salevalue: number;
    status: string;
}