export interface MovementKardex {
    kardexId: number;
    issueDate: string;
    concept: string;
    documentType: string;
    documentNumber: string;
    cantidadEntrada: number;
    costoUnitarioEntrada: number;
    valorTotalEntrada: number;
    cantidadSalida: number;
    costoUnitarioSalida: number;
    valorTotalSalida: number;
    cantidadSaldo: number;
    costoUnitarioSaldo: number;
    valorTotalSaldo: number;
    observation: string;
    typeKardexId: number;
  }
  