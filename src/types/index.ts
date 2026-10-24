export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'owner' | 'admin';
  savedAddresses: SavedAddress[];
  accountStatus: 'active' | 'suspended';
  createdAt: string;
}

export interface SavedAddress {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  addressLine: string;
  landmark?: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  location: {
    area: string;
    city: string;
    lat: number;
    lng: number;
  };
  cuisines: string[];
  image: string;
  bannerImage?: string;
  openingHours: string;
  averageRating: number;
  totalRatings: number;
  approvalStatus: 'approved' | 'pending' | 'rejected';
  isOpen: boolean;
  priceForTwo: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  minimumOrder: number;
  isFeatured?: boolean;
  pureVeg?: boolean;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isVegetarian: boolean;
  isAvailable: boolean;
  rating?: number;
  isBestSeller?: boolean;
  preparationTimeMin: number;
  createdAt: string;
}

export interface CartItem {
  menuItemId: string;
  restaurantId: string;
  name: string;
  price: number;
  image: string;
  isVegetarian: boolean;
  quantity: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  isVegetarian: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  restaurantName?: string;
  restaurantImage?: string;
  restaurantAddress?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: OrderItem[];
  deliveryAddress: {
    type: string;
    addressLine: string;
    landmark?: string;
    city: string;
    pincode: string;
  };
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  totalAmount: number;
  couponCode?: string;
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  orderStatus:
    | 'placed'
    | 'confirmed'
    | 'preparing'
    | 'ready_for_pickup'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled';
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note: string;
  }>;
  deliveryInstructions?: string;
  driverDetails?: {
    name: string;
    phone: string;
    vehicleNumber: string;
    rating: number;
    currentLocation?: { lat: number; lng: number };
  };
  estimatedDeliveryTime: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minimumOrderValue: number;
  maximumDiscount: number;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
  description: string;
}

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  restaurantId: string;
  orderId?: string;
  rating: number;
  comment: string;
  createdAt: string;
}
