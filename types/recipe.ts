export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  equipment: string[];
  steps: {
    timestamp: number;
    description: string;
  }[];
} 