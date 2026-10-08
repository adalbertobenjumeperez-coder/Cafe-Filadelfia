export interface OptionChoice {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
}

export interface OptionGroup {
  id: string;
  name: string;
  required: boolean;
  minSelect?: number;
  maxSelect?: number; // 1 for single-choice (radio), >1 for multiple choices
  choices: OptionChoice[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  description: string;
  icon?: string;
  imageUrl?: string;
  available: boolean;
  optionGroups: OptionGroup[];
}

export interface SelectedOption {
  groupId: string;
  groupName: string;
  choiceId: string;
  choiceName: string;
  price: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  basePrice: number;
  selectedOptions: SelectedOption[];
  notes?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export type OrderStatus = 'pendiente' | 'preparando' | 'listo' | 'entregado' | 'cancelado';
export type OrderType = 'aqui' | 'llevar';
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

export interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  type: OrderType;
  tableNumber?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tip: number;
  total: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: number;
  updatedAt?: number;
  preparedAt?: number;
  completedAt?: number;
}

export type ActiveTab = 'pos' | 'kds' | 'menu' | 'ventas';
