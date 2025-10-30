export interface EggProduction {
    id: number;
    quantityEggs: number;
    eggsKilo: number;
    priceKilo: number;
    registrationDate: string;
    estado: string;  // 🚨 Requerido
}
