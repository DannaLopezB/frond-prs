export interface Supplier {
    id?: number; // Hacer opcional el id
    ruc: string;
    company: string;
    name: string;
    lastname: string;
    email: string;
    cellphone: string;
    notes: string;
    registerDate: string; 
    status: string;
    typeSupplierId: number;
}