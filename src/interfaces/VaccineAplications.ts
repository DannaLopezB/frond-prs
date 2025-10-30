export interface VaccineApplications {
    applicationId?: number;     // Identificador único para cada aplicación
    cycleLifeId?: number;         // ID de la vacuna
    henId?: number;            // ID del cobertizo
    amount?: number;            // Cantidad de dosis aplicadas
    endDate: string | Date; // Fecha en la que se registró el dato    // Fecha de finalización de la aplicación de la vacuna (allow null)
    costApplication: number;    // Costo de la aplicación de la vacuna
    dateRegistration: string | Date; // Fecha en la que se registró el dato
    quantityBirds: number;  
    nameIto?: string;    // Número de aves vacunadas
    viaApplication?: string;    // Número de aves vacunadas
    email: string;              // Email del responsable o registrado
    active: string;             // Estado: 'A' = Activo, 'I' = Inactivo
    timesInWeeks?: string | null;             // Número de veces que se aplica la vacuna (allow null)
}
