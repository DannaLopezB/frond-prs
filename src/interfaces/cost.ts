export interface FoodCost {
    idFoodCosts: number;
    weekNumber: string;
    foodType: string;
    gramsPerChicken: string;
    totalKg: number;
    totalCost: number;
    startDate: Date;
    endDate: Date;
    shedName: string;
    shedId: number;
    hensId: number;
    status: string;
}

export interface EditableFoodCost extends FoodCost {
    unitPrice?: string;
}


export interface RequestCost {
    idFoodCosts?: number;
    weekNumber: string;
    foodType: string;
    gramsPerChicken: string;
    unitPrice: string;
    shedName: string;
    quantity:number;
    foodId:number;
    hensId:number;
}
