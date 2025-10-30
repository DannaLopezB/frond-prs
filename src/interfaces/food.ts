export interface Food {
    idFood: number; 
    foodType: string; 
    foodBrand: string; 
    amount: number; 
    packaging: string;
    unitMeasure: string; 
    entryDate: Date; 
    status: string; 
  }
  export interface FoodRequest {
    idFood?: number; 
    foodType: string; 
    foodBrand: string; 
    amount: number; 
    packaging: string;
    unitMeasure: string; 
  }
  
  