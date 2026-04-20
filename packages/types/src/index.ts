export type OrderType = 'DELIVERY';

export interface LocationOption {
  id: string;
  city: string;
  area: string;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricePkr: number;
  imageUrl: string;
  inStock: boolean;
  category?: string;
  stockCount?: number;
  featured?: boolean;
  visible?: boolean;
  createdAt?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CheckoutRequest {
  items: CartItem[];
  locationId: string;
  customerEmail: string;
  couponCode?: string;
}

export type OrderStatus = 'pending' | 'paid' | 'dispatched' | 'delivered' | 'cancelled';
export type UserRole = 'customer' | 'admin';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  customer_email: string;
  customer_id: string | null;
  location_id: string | null;
  stripe_session_id: string | null;
  status: OrderStatus;
  total_pkr: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price_pkr: number;
}

export interface AdminOrder {
  id: string;
  createdAt: string;
  customerEmail: string;
  status: string;
  amountPkr: number;
}

export interface CheckoutResponse {
  url: string;
}
