export interface Shed {
    id: number;
    name: string;
    location: string;
    capacity: number;
    chickenType: number;
    inspectionDate: string; // ISO string format
    note: string;
    status: string;
    supplierId: number;
}
