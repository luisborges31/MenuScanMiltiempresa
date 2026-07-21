/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Business {
  id: string;
  name: string;
  logo: string;
  tier: 'free' | 'premium';
  status: 'active' | 'suspended';
  email: string;
  previousTier?: 'free' | 'premium';
  deliveryFee?: number;
}

export interface CRMCustomer {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  ordersCount: number;
  registeredAt?: string;
}

export interface MenuItem {
  id: number;
  businessId: string;
  name: string;
  price: number;
  description: string;
  category: 'Platos' | 'Acompañantes' | 'Bebidas';
  emoji: string;
  image: string;
  available: boolean;
}

export interface Payment {
  method: string;
  sender: string;
  reference: string;
  amount: number;
  status: 'Pendiente' | 'Por Conciliar' | 'Conciliado' | 'Rechazado';
  timestamp: string;
}

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  emoji: string;
}

export interface Order {
  id: string;
  businessId: string;
  customer: string;
  email: string;
  type: 'Mesa' | 'Delivery';
  address: string | null;
  tableNum: string | null;
  phone: string;
  notes: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'Preparando' | 'En Camino' | 'Entregado';
  payment: Payment;
  timestamp: string;
  date: string;
}

export interface Review {
  id: number;
  businessId: string;
  orderId: string;
  customer: string;
  foodRating: number;
  serviceRating: number;
  comment: string;
}

export interface SystemLog {
  timestamp: string;
  event: string;
  type: 'system' | 'auth' | 'billing' | 'alert' | 'security';
}

export interface SecurityTestResult {
  id: string;
  category: string;
  name: string;
  status: 'secure' | 'warning' | 'danger' | 'passed';
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  sqlSnippet?: string;
}
