export interface UserProfile {
  uid: string;
  email: string;
  businessName: string;
  businessType: string;
  languagePreference: 'English' | 'Yoruba' | 'Pidgin';
  createdAt: any;
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  cartonSize: number;
  packSize: number;
  imageUrl: string;
  hashtags: string[];
  marketingCaption: string;
  category: string;
  lowStockThreshold: number;
  isVisible: boolean;
  createdAt: any;
}

export interface Sale {
  id: string;
  sellerId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitType: 'item' | 'pack' | 'carton';
  totalAmount: number;
  timestamp: any;
}

export interface Order {
  id: string;
  sellerId: string;
  customerName: string;
  customerPhone: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    unitType: string;
  }[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: any;
  updatedAt: any;
}
