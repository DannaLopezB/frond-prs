export interface UtilityDiary {
  id: number;
  idSale: number;
  idFood: number;
  cuidado: number;
  costoAdicional: number;
  gananciaDiaria: number;
  fecha: string;
  estado: string; // o Date si prefieres
}