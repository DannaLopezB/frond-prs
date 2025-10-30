import { Details } from "./VaccineDetail";

export interface Vaccine {
    vaccineId?: number; 
    nameVaccine: string;
    typeVaccine: string;
    description?: string | null;
    active: string| null; 
      details?: Details[]; // Add this line to include details

}
