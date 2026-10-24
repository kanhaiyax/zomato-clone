import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  role: 'customer' | 'owner' | 'admin';
  savedAddresses: Array<{
    id: string;
    type: 'Home' | 'Work' | 'Other';
    addressLine: string;
    landmark?: string;
    city: string;
    pincode: string;
    isDefault: boolean;
  }>;
  accountStatus: 'active' | 'suspended';
  createdAt: string;
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
  priceForTwo: number; // in INR
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  minimumOrder: number; // in INR
  isFeatured?: boolean;
  pureVeg?: boolean;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number; // in INR
  image: string;
  category: string;
  isVegetarian: boolean;
  isAvailable: boolean;
  rating?: number;
  isBestSeller?: boolean;
  preparationTimeMin: number;
  createdAt: string;
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
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
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

export interface Payment {
  id: string;
  orderId: string;
  provider: 'razorpay' | 'cod';
  providerPaymentId?: string;
  amount: number;
  status: 'pending' | 'verified' | 'failed';
  verificationDetails?: Record<string, unknown>;
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  reviews: Review[];
  coupons: Coupon[];
  payments: Payment[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

class DatabaseEngine {
  private data: DatabaseSchema = {
    users: [],
    restaurants: [],
    menuItems: [],
    orders: [],
    reviews: [],
    coupons: [],
    payments: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure all collections exist
        this.data.users = this.data.users || [];
        this.data.restaurants = this.data.restaurants || [];
        this.data.menuItems = this.data.menuItems || [];
        this.data.orders = this.data.orders || [];
        this.data.reviews = this.data.reviews || [];
        this.data.coupons = this.data.coupons || [];
        this.data.payments = this.data.payments || [];
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.error('Error initializing database:', err);
      this.seedInitialData();
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  public seedInitialData(force = false) {
    if (!force && this.data.users.length > 0) return;

    const salt = bcrypt.genSaltSync(10);
    const customerPasswordHash = bcrypt.hashSync('password123', salt);
    const ownerPasswordHash = bcrypt.hashSync('password123', salt);
    const adminPasswordHash = bcrypt.hashSync('admin123', salt);

    const users: User[] = [
      {
        id: 'usr_customer_1',
        name: 'Alex Johnson',
        email: 'alex@example.com',
        passwordHash: customerPasswordHash,
        phone: '+91 98765 43210',
        role: 'customer',
        accountStatus: 'active',
        savedAddresses: [
          {
            id: 'addr_1',
            type: 'Home',
            addressLine: 'Apt 402, Green Glen Heights, Bellandur',
            landmark: 'Near EcoSpace Tech Park',
            city: 'Bengaluru',
            pincode: '560103',
            isDefault: true,
          },
          {
            id: 'addr_2',
            type: 'Work',
            addressLine: 'Tower 4, 6th Floor, Bagmane Tech Park, CV Raman Nagar',
            city: 'Bengaluru',
            pincode: '560093',
            isDefault: false,
          },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_owner_1',
        name: 'Chef Tariq Al-Mansoor',
        email: 'chef@paradise.com',
        passwordHash: ownerPasswordHash,
        phone: '+91 98450 12345',
        role: 'owner',
        accountStatus: 'active',
        savedAddresses: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_owner_2',
        name: 'Marco Bellini',
        email: 'marco@crustco.com',
        passwordHash: ownerPasswordHash,
        phone: '+91 98450 67890',
        role: 'owner',
        accountStatus: 'active',
        savedAddresses: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_admin_1',
        name: 'Platform Administrator',
        email: 'admin@zomato.com',
        passwordHash: adminPasswordHash,
        phone: '+91 90000 00001',
        role: 'admin',
        accountStatus: 'active',
        savedAddresses: [],
        createdAt: new Date().toISOString(),
      },
    ];

    const heroImage = '/src/assets/images/hero_food_spread_1792857444168.jpg';
    const biryaniImage = '/src/assets/images/curated_biryani_feast_1792857445109.jpg';
    const pizzaImage = '/src/assets/images/artisan_woodfired_pizza_1792857444967.jpg';
    const burgerImage = '/src/assets/images/fresh_gourmet_burger_1792857445422.jpg';

    const restaurants: Restaurant[] = [
      {
        id: 'rest_1',
        ownerId: 'usr_owner_1',
        name: 'Paradise Biryani Heritage',
        slug: 'paradise-biryani-heritage',
        description: 'Authentic royal Nizami dum biryanis, slow-cooked in sealed earthen handis with fragrant saffron and secret family spices.',
        address: '12th Main Road, Indiranagar',
        location: {
          area: 'Indiranagar',
          city: 'Bengaluru',
          lat: 12.9716,
          lng: 77.5946,
        },
        cuisines: ['Biryani', 'Mughlai', 'North Indian', 'Kebab'],
        image: biryaniImage,
        bannerImage: heroImage,
        openingHours: '11:00 AM - 11:30 PM',
        averageRating: 4.8,
        totalRatings: 1420,
        approvalStatus: 'approved',
        isOpen: true,
        priceForTwo: 650,
        deliveryTimeMin: 25,
        deliveryTimeMax: 35,
        minimumOrder: 200,
        isFeatured: true,
        pureVeg: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rest_2',
        ownerId: 'usr_owner_2',
        name: 'Crust & Co. Artisan Pizzeria',
        slug: 'crust-and-co-artisan-pizzeria',
        description: 'Traditional wood-fired sourdough pizzas with 72-hour fermented dough, San Marzano tomatoes, and artisanal buffalo mozzarella.',
        address: '80 Feet Road, Koramangala 4th Block',
        location: {
          area: 'Koramangala',
          city: 'Bengaluru',
          lat: 12.9352,
          lng: 77.6245,
        },
        cuisines: ['Italian', 'Pizza', 'Pasta', 'Desserts'],
        image: pizzaImage,
        bannerImage: heroImage,
        openingHours: '12:00 PM - 11:00 PM',
        averageRating: 4.7,
        totalRatings: 980,
        approvalStatus: 'approved',
        isOpen: true,
        priceForTwo: 800,
        deliveryTimeMin: 20,
        deliveryTimeMax: 30,
        minimumOrder: 250,
        isFeatured: true,
        pureVeg: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rest_3',
        ownerId: 'usr_owner_1',
        name: 'The Urban Smash Burger Lab',
        slug: 'urban-smash-burger-lab',
        description: 'Crispy-edged, ultra-juicy smashed double patties on toasted Japanese milk buns with secret lab sauce and seasoned waffle fries.',
        address: 'Church Street, Shanthala Nagar, Ashok Nagar',
        location: {
          area: 'Church Street',
          city: 'Bengaluru',
          lat: 12.9752,
          lng: 77.6033,
        },
        cuisines: ['American', 'Burgers', 'Fast Food', 'Beverages'],
        image: burgerImage,
        bannerImage: heroImage,
        openingHours: '11:30 AM - 12:00 AM',
        averageRating: 4.6,
        totalRatings: 1120,
        approvalStatus: 'approved',
        isOpen: true,
        priceForTwo: 550,
        deliveryTimeMin: 20,
        deliveryTimeMax: 30,
        minimumOrder: 150,
        isFeatured: true,
        pureVeg: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rest_4',
        ownerId: 'usr_owner_2',
        name: 'Green Bowl & Wellness Kitchen',
        slug: 'green-bowl-and-wellness-kitchen',
        description: '100% vegetarian wholesome grain bowls, organic cold-pressed juices, sourdough toasts, and nutrient-dense farm salads.',
        address: '14th Cross, HSR Layout Sector 3',
        location: {
          area: 'HSR Layout',
          city: 'Bengaluru',
          lat: 12.9116,
          lng: 77.6476,
        },
        cuisines: ['Healthy', 'Salads', 'Pure Veg', 'Smoothies'],
        image: heroImage,
        bannerImage: heroImage,
        openingHours: '08:00 AM - 10:00 PM',
        averageRating: 4.9,
        totalRatings: 640,
        approvalStatus: 'approved',
        isOpen: true,
        priceForTwo: 500,
        deliveryTimeMin: 20,
        deliveryTimeMax: 35,
        minimumOrder: 200,
        isFeatured: false,
        pureVeg: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rest_5',
        ownerId: 'usr_owner_1',
        name: 'Dragon Wok Asian Bistro',
        slug: 'dragon-wok-asian-bistro',
        description: 'Sizzling wok tossed Hakka noodles, crispy crystal dim sums, spicy Schezwan bowls, and fiery Kung Pao delicacies.',
        address: 'MG Road, Halasuru',
        location: {
          area: 'MG Road',
          city: 'Bengaluru',
          lat: 12.9756,
          lng: 77.6186,
        },
        cuisines: ['Asian', 'Chinese', 'Dim Sum', 'Thai'],
        image: heroImage,
        bannerImage: heroImage,
        openingHours: '12:00 PM - 11:30 PM',
        averageRating: 4.5,
        totalRatings: 750,
        approvalStatus: 'approved',
        isOpen: true,
        priceForTwo: 600,
        deliveryTimeMin: 30,
        deliveryTimeMax: 40,
        minimumOrder: 250,
        isFeatured: false,
        pureVeg: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rest_6',
        ownerId: 'usr_owner_2',
        name: 'Royal Sweets & Mithai House',
        slug: 'royal-sweets-and-mithai-house',
        description: 'Pure desi ghee sweets, melt-in-mouth Kaju Katli, freshly fried hot Jalebis with Rabri, and spicy street chats.',
        address: 'Commercial Street, Tasker Town',
        location: {
          area: 'Commercial Street',
          city: 'Bengaluru',
          lat: 12.9822,
          lng: 77.6083,
        },
        cuisines: ['Desserts', 'Mithai', 'Street Food', 'Pure Veg'],
        image: heroImage,
        bannerImage: heroImage,
        openingHours: '09:00 AM - 10:30 PM',
        averageRating: 4.7,
        totalRatings: 1890,
        approvalStatus: 'approved',
        isOpen: true,
        priceForTwo: 350,
        deliveryTimeMin: 15,
        deliveryTimeMax: 25,
        minimumOrder: 150,
        isFeatured: false,
        pureVeg: true,
        createdAt: new Date().toISOString(),
      },
    ];

    const menuItems: MenuItem[] = [
      // Restaurant 1: Paradise Biryani Heritage
      {
        id: 'menu_1_1',
        restaurantId: 'rest_1',
        name: 'Royal Nizami Dum Chicken Biryani',
        description: 'Tender chicken marinated in crushed royal spices and browned shallots, slow-steamed with aged long-grain basmati rice and saffron milk.',
        price: 360,
        image: biryaniImage,
        category: 'Dum Biryanis',
        isVegetarian: false,
        isAvailable: true,
        rating: 4.9,
        isBestSeller: true,
        preparationTimeMin: 20,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_1_2',
        restaurantId: 'rest_1',
        name: 'Mutton Gosht Zafrani Biryani',
        description: 'Succulent prime baby mutton chunks layered with fragrant basmati, mint, saffron, and slow cooked in sealed earthen pot.',
        price: 480,
        image: biryaniImage,
        category: 'Dum Biryanis',
        isVegetarian: false,
        isAvailable: true,
        rating: 4.9,
        isBestSeller: true,
        preparationTimeMin: 25,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_1_3',
        restaurantId: 'rest_1',
        name: 'Paneer Tikka Dum Biryani',
        description: 'Charcoal grilled cottage cheese cubes cooked with aromatic spices, basmati rice, caramelized onions, and fresh cilantro.',
        price: 310,
        image: biryaniImage,
        category: 'Dum Biryanis',
        isVegetarian: true,
        isAvailable: true,
        rating: 4.7,
        isBestSeller: false,
        preparationTimeMin: 18,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_1_4',
        restaurantId: 'rest_1',
        name: 'Murgh Malai Tandoori Tikka (6 pcs)',
        description: 'Boneless chicken cubes marinated in creamy hung curd, cashew paste, green cardamom, and smoked over charcoals.',
        price: 320,
        image: heroImage,
        category: 'Starters & Kebabs',
        isVegetarian: false,
        isAvailable: true,
        rating: 4.8,
        isBestSeller: true,
        preparationTimeMin: 15,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_1_5',
        restaurantId: 'rest_1',
        name: 'Galouti Kebab with Sheermal',
        description: 'Finely minced lamb kebabs with 32 secret spices that melt in your mouth, served with warm saffron-glazed sheermal bread.',
        price: 380,
        image: heroImage,
        category: 'Starters & Kebabs',
        isVegetarian: false,
        isAvailable: true,
        rating: 4.8,
        isBestSeller: false,
        preparationTimeMin: 15,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_1_6',
        restaurantId: 'rest_1',
        name: 'Garlic Butter Naan',
        description: 'Clay-oven baked leavened bread brushed with melted butter and sprinkled with roasted minced garlic and coriander.',
        price: 65,
        image: heroImage,
        category: 'Breads & Curries',
        isVegetarian: true,
        isAvailable: true,
        rating: 4.6,
        isBestSeller: false,
        preparationTimeMin: 8,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_1_7',
        restaurantId: 'rest_1',
        name: 'Murgh Makhani (Butter Chicken)',
        description: 'Tandoor-roasted chicken in a rich, velvety tomato, butter, and cashew gravy infused with dried fenugreek leaves.',
        price: 340,
        image: heroImage,
        category: 'Breads & Curries',
        isVegetarian: false,
        isAvailable: true,
        rating: 4.9,
        isBestSeller: true,
        preparationTimeMin: 15,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_1_8',
        restaurantId: 'rest_1',
        name: 'Shahi Tukda with Rabri',
        description: 'Crisp ghee-fried brioche soaked in fragrant saffron cardamom syrup and topped with thick slow-reduced rabri and pistachios.',
        price: 160,
        image: heroImage,
        category: 'Desserts',
        isVegetarian: true,
        isAvailable: true,
        rating: 4.7,
        isBestSeller: false,
        preparationTimeMin: 10,
        createdAt: new Date().toISOString(),
      },

      // Restaurant 2: Crust & Co. Artisan Pizzeria
      {
        id: 'menu_2_1',
        restaurantId: 'rest_2',
        name: 'Margherita Verace Sourdough Pizza',
        description: 'San Marzano DOP tomato sauce, fresh buffalo mozzarella, hand-torn sweet basil, and extra virgin olive oil on blistered crust.',
        price: 420,
        image: pizzaImage,
        category: 'Wood-Fired Pizzas',
        isVegetarian: true,
        isAvailable: true,
        rating: 4.9,
        isBestSeller: true,
        preparationTimeMin: 15,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_2_2',
        restaurantId: 'rest_2',
        name: 'Spicy Pepperoni & Hot Honey Pizza',
        description: 'Generously topped with crisp cupping pepperoni, fresh mozzarella, pickled jalapenos, and a drizzle of chili-infused wildflower honey.',
        price: 540,
        image: pizzaImage,
        category: 'Wood-Fired Pizzas',
        isVegetarian: false,
        isAvailable: true,
        rating: 4.8,
        isBestSeller: true,
        preparationTimeMin: 16,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_2_3',
        restaurantId: 'rest_2',
        name: 'Wild Mushroom & Black Truffle Pizza',
        description: 'Creamy white base, sautéed porcini and cremini mushrooms, fontina cheese, shaved black truffle oil, and baby arugula.',
        price: 520,
        image: pizzaImage,
        category: 'Wood-Fired Pizzas',
        isVegetarian: true,
        isAvailable: true,
        rating: 4.7,
        isBestSeller: false,
        preparationTimeMin: 15,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_2_4',
        restaurantId: 'rest_2',
        name: 'Creamy Truffle Fettuccine Alfredo',
        description: 'Handmade fresh egg fettuccine tossed in a rich 24-month aged Parmigiano Reggiano and butter cream emulsion with truffle oil.',
        price: 460,
        image: heroImage,
        category: 'Artisan Pastas',
        isVegetarian: true,
        isAvailable: true,
        rating: 4.8,
        isBestSeller: false,
        preparationTimeMin: 18,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_2_5',
        restaurantId: 'rest_2',
        name: 'Crispy Garlic Herb Pull-Apart Bread',
        description: 'Sourdough loaf baked with garlic herb compound butter, shredded mozzarella, and served with warm marinara dipping sauce.',
        price: 240,
        image: heroImage,
        category: 'Appetizers',
        isVegetarian: true,
        isAvailable: true,
        rating: 4.6,
        isBestSeller: false,
        preparationTimeMin: 12,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_2_6',
        restaurantId: 'rest_2',
        name: 'Classic Venetian Tiramisu',
        description: 'Espresso-soaked Savoiardi ladyfingers layered with airy whipped mascarpone cream and dusted with Valrhona cocoa powder.',
        price: 260,
        image: heroImage,
        category: 'Desserts',
        isVegetarian: true,
        isAvailable: true,
        rating: 4.9,
        isBestSeller: true,
        preparationTimeMin: 5,
        createdAt: new Date().toISOString(),
      },

      // Restaurant 3: The Urban Smash Burger Lab
      {
        id: 'menu_3_1',
        restaurantId: 'rest_3',
        name: 'The Classic Double Smash Cheeseburger',
        description: 'Two smashed beef-style patties with lacy crisp crusts, double American cheddar, house dill pickles, minced onions, and signature lab secret sauce on buttered brioche.',
        price: 320,
        image: burgerImage,
        category: 'Signature Smash Burgers',
        isVegetarian: false,
        isAvailable: true,
        rating: 4.8,
        isBestSeller: true,
        preparationTimeMin: 12,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_3_2',
        restaurantId: 'rest_3',
        name: 'Smoky BBQ Bacon & Onion Rings Burger',
        description: 'Double smashed patty, crispy smoked bacon strips, beer-battered onion ring, melted sharp cheddar, and smoky chipotle BBQ sauce.',
        price: 380,
        image: burgerImage,
        category: 'Signature Smash Burgers',
        isVegetarian: false,
        isAvailable: true,
        rating: 4.7,
        isBestSeller: false,
        preparationTimeMin: 14,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_3_3',
        restaurantId: 'rest_3',
        name: 'Crispy Truffle Portobello Veg Burger',
        description: 'Panko-crusted whole Portobello mushroom cap stuffed with molten gouda cheese, truffle aioli, and baby spinach.',
        price: 290,
        image: burgerImage,
        category: 'Signature Smash Burgers',
        isVegetarian: true,
        isAvailable: true,
        rating: 4.6,
        isBestSeller: false,
        preparationTimeMin: 14,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_3_4',
        restaurantId: 'rest_3',
        name: 'Truffle Parmesan Loaded Fries',
        description: 'Crispy skin-on french fries tossed in white truffle oil, grated aged Parmesan, and fresh chopped parsley with garlic mayo.',
        price: 190,
        image: burgerImage,
        category: 'Sides & Shakes',
        isVegetarian: true,
        isAvailable: true,
        rating: 4.7,
        isBestSeller: true,
        preparationTimeMin: 8,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_3_5',
        restaurantId: 'rest_3',
        name: 'Thick Salted Caramel Pretzel Shake',
        description: 'Churned vanilla bean ice cream blended with salted caramel sauce, malt, and topped with crushed salted pretzels.',
        price: 180,
        image: heroImage,
        category: 'Sides & Shakes',
        isVegetarian: true,
        isAvailable: true,
        rating: 4.8,
        isBestSeller: false,
        preparationTimeMin: 5,
        createdAt: new Date().toISOString(),
      },

      // Restaurant 4: Green Bowl & Wellness Kitchen
      {
        id: 'menu_4_1',
        restaurantId: 'rest_4',
        name: 'Mediterranean Quinoa Falafel Bowl',
        description: 'Crispy herb falafels, fluffy tricolor quinoa, creamy beet hummus, cucumber ribbons, Kalamata olives, feta, and lemon tahini dressing.',
        price: 340,
        image: heroImage,
        category: 'Grain Bowls',
        isVegetarian: true,
        isAvailable: true,
        rating: 4.9,
        isBestSeller: true,
        preparationTimeMin: 12,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_4_2',
        restaurantId: 'rest_4',
        name: 'Avocado Tartine with Microgreens',
        description: 'Chunky Hass avocado mash on toasted country sourdough, chili flakes, toasted seeds, microgreens, and cold-pressed olive oil.',
        price: 280,
        image: heroImage,
        category: 'Toast & Wraps',
        isVegetarian: true,
        isAvailable: true,
        rating: 4.7,
        isBestSeller: false,
        preparationTimeMin: 8,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_4_3',
        restaurantId: 'rest_4',
        name: 'Acai Berry Antioxidant Smoothie Bowl',
        description: 'Organic pure acai blended with frozen blueberries and banana, topped with chia seeds, granola clusters, fresh strawberries, and cacao nibs.',
        price: 320,
        image: heroImage,
        category: 'Smoothie Bowls',
        isVegetarian: true,
        isAvailable: true,
        rating: 4.9,
        isBestSeller: true,
        preparationTimeMin: 8,
        createdAt: new Date().toISOString(),
      },

      // Restaurant 5: Dragon Wok Asian Bistro
      {
        id: 'menu_5_1',
        restaurantId: 'rest_5',
        name: 'Steamed Edamame & Truffle Dim Sum (6 pcs)',
        description: 'Translucent steamed crystal dumpling pouches packed with minced edamame beans, water chestnuts, and black truffle essence.',
        price: 340,
        image: heroImage,
        category: 'Dim Sum',
        isVegetarian: true,
        isAvailable: true,
        rating: 4.8,
        isBestSeller: true,
        preparationTimeMin: 15,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_5_2',
        restaurantId: 'rest_5',
        name: 'Spicy Schezwan Chicken Hakka Noodles',
        description: 'Wok tossed hand-pulled noodles with shredded chicken, crunchy bell peppers, spring onions, and house fiery Schezwan chili paste.',
        price: 290,
        image: heroImage,
        category: 'Noodles & Rice',
        isVegetarian: false,
        isAvailable: true,
        rating: 4.6,
        isBestSeller: true,
        preparationTimeMin: 14,
        createdAt: new Date().toISOString(),
      },

      // Restaurant 6: Royal Sweets & Mithai House
      {
        id: 'menu_6_1',
        restaurantId: 'rest_6',
        name: 'Warm Desi Ghee Jalebi with Rabri (250g)',
        description: 'Crisp spiral jalebis fried in pure desi ghee, dipped in saffron syrup, served with thick, creamy reduced milk rabri.',
        price: 210,
        image: heroImage,
        category: 'Mithai & Sweets',
        isVegetarian: true,
        isAvailable: true,
        rating: 4.9,
        isBestSeller: true,
        preparationTimeMin: 10,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'menu_6_2',
        restaurantId: 'rest_6',
        name: 'Signature Silver Leaf Kaju Katli (250g)',
        description: 'Velvety diamond-cut cashew fudge made with premium Goan cashews and pure raw cane sugar, adorned with authentic silver foil.',
        price: 320,
        image: heroImage,
        category: 'Mithai & Sweets',
        isVegetarian: true,
        isAvailable: true,
        rating: 4.8,
        isBestSeller: true,
        preparationTimeMin: 5,
        createdAt: new Date().toISOString(),
      },
    ];

    const coupons: Coupon[] = [
      {
        id: 'cpn_1',
        code: 'WELCOME50',
        discountType: 'percentage',
        discountValue: 50,
        minimumOrderValue: 200,
        maximumDiscount: 100,
        expiryDate: '2026-12-31T23:59:59.000Z',
        usageLimit: 1000,
        usageCount: 124,
        isActive: true,
        description: '50% off up to ₹100 on orders above ₹200 for new & returning foodies.',
      },
      {
        id: 'cpn_2',
        code: 'ZOMATOFEAST',
        discountType: 'flat',
        discountValue: 150,
        minimumOrderValue: 500,
        maximumDiscount: 150,
        expiryDate: '2026-12-31T23:59:59.000Z',
        usageLimit: 500,
        usageCount: 42,
        isActive: true,
        description: 'Flat ₹150 discount on gourmet feasts above ₹500.',
      },
      {
        id: 'cpn_3',
        code: 'FREEFEE',
        discountType: 'flat',
        discountValue: 40,
        minimumOrderValue: 250,
        maximumDiscount: 40,
        expiryDate: '2026-12-31T23:59:59.000Z',
        usageLimit: 2000,
        usageCount: 89,
        isActive: true,
        description: 'Free delivery! Saves ₹40 on orders over ₹250.',
      },
    ];

    const reviews: Review[] = [
      {
        id: 'rev_1',
        customerId: 'usr_customer_1',
        customerName: 'Alex Johnson',
        restaurantId: 'rest_1',
        rating: 5,
        comment: 'Hands down the best Hyderabadi Dum Biryani in Bengaluru! Meat was fork-tender, perfectly spiced, and the earthen pot aroma was unbelievable.',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'rev_2',
        customerId: 'usr_customer_1',
        customerName: 'Sneha Rao',
        restaurantId: 'rest_2',
        rating: 5,
        comment: 'The crust on the Margherita pizza is textbook Neapolitan—puffy, leopard-spotted, and delicious. Arrived piping hot!',
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
      {
        id: 'rev_3',
        customerId: 'usr_customer_1',
        customerName: 'Rohit Verma',
        restaurantId: 'rest_3',
        rating: 4,
        comment: 'Super juicy smash burgers. The secret sauce is addictive. Delivered in 22 minutes.',
        createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      },
    ];

    // Seed one completed sample order and one active sample order
    const orders: Order[] = [
      {
        id: 'ord_sample_live',
        orderNumber: 'ZOM-782194',
        customerId: 'usr_customer_1',
        restaurantId: 'rest_1',
        items: [
          {
            menuItemId: 'menu_1_1',
            name: 'Royal Nizami Dum Chicken Biryani',
            price: 360,
            quantity: 1,
            isVegetarian: false,
          },
          {
            menuItemId: 'menu_1_6',
            name: 'Garlic Butter Naan',
            price: 65,
            quantity: 2,
            isVegetarian: true,
          },
        ],
        deliveryAddress: {
          type: 'Home',
          addressLine: 'Apt 402, Green Glen Heights, Bellandur',
          landmark: 'Near EcoSpace Tech Park',
          city: 'Bengaluru',
          pincode: '560103',
        },
        subtotal: 490,
        deliveryFee: 40,
        tax: 24.5,
        discount: 100,
        totalAmount: 454.5,
        couponCode: 'WELCOME50',
        paymentMethod: 'razorpay',
        paymentStatus: 'completed',
        orderStatus: 'out_for_delivery',
        statusHistory: [
          {
            status: 'placed',
            timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
            note: 'Order placed and payment verified via Razorpay',
          },
          {
            status: 'confirmed',
            timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
            note: 'Paradise Biryani accepted the order',
          },
          {
            status: 'preparing',
            timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
            note: 'Chef is handcrafting your meal in the tandoor',
          },
          {
            status: 'ready_for_pickup',
            timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
            note: 'Order packed in sealed thermal packaging',
          },
          {
            status: 'out_for_delivery',
            timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
            note: 'Delivery partner Ramesh K. is on the way',
          },
        ],
        deliveryInstructions: 'Ring the doorbell and leave at door please',
        razorpayOrderId: 'order_test_9832104928',
        razorpayPaymentId: 'pay_test_8392104928',
        driverDetails: {
          name: 'Ramesh Kumar',
          phone: '+91 99880 11223',
          vehicleNumber: 'KA 03 EV 4821',
          rating: 4.9,
          currentLocation: { lat: 12.9348, lng: 77.6102 },
        },
        estimatedDeliveryTime: '15-20 mins',
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      },
    ];

    this.data = {
      users,
      restaurants,
      menuItems,
      orders,
      reviews,
      coupons,
      payments: [],
    };
    this.save();
  }

  // --- Users ---
  public getUsers() {
    return this.data.users;
  }
  public getUserById(id: string) {
    return this.data.users.find((u) => u.id === id);
  }
  public getUserByEmail(email: string) {
    return this.data.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  }
  public createUser(user: User) {
    this.data.users.push(user);
    this.save();
    return user;
  }
  public updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  // --- Restaurants ---
  public getRestaurants() {
    return this.data.restaurants;
  }
  public getRestaurantById(id: string) {
    return this.data.restaurants.find((r) => r.id === id);
  }
  public getRestaurantsByOwnerId(ownerId: string) {
    return this.data.restaurants.filter((r) => r.ownerId === ownerId);
  }
  public createRestaurant(r: Restaurant) {
    this.data.restaurants.push(r);
    this.save();
    return r;
  }
  public updateRestaurant(id: string, updates: Partial<Restaurant>) {
    const idx = this.data.restaurants.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.data.restaurants[idx] = { ...this.data.restaurants[idx], ...updates };
    this.save();
    return this.data.restaurants[idx];
  }
  public deleteRestaurant(id: string) {
    const idx = this.data.restaurants.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.data.restaurants.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Menu Items ---
  public getMenuItems(restaurantId?: string) {
    if (restaurantId) {
      return this.data.menuItems.filter((m) => m.restaurantId === restaurantId);
    }
    return this.data.menuItems;
  }
  public getMenuItemById(id: string) {
    return this.data.menuItems.find((m) => m.id === id);
  }
  public createMenuItem(item: MenuItem) {
    this.data.menuItems.push(item);
    this.save();
    return item;
  }
  public updateMenuItem(id: string, updates: Partial<MenuItem>) {
    const idx = this.data.menuItems.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    this.data.menuItems[idx] = { ...this.data.menuItems[idx], ...updates };
    this.save();
    return this.data.menuItems[idx];
  }
  public deleteMenuItem(id: string) {
    const idx = this.data.menuItems.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    this.data.menuItems.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Orders ---
  public getOrders() {
    return this.data.orders;
  }
  public getOrderById(id: string) {
    return this.data.orders.find((o) => o.id === id);
  }
  public getOrdersByCustomerId(customerId: string) {
    return this.data.orders.filter((o) => o.customerId === customerId);
  }
  public getOrdersByRestaurantId(restaurantId: string) {
    return this.data.orders.filter((o) => o.restaurantId === restaurantId);
  }
  public createOrder(order: Order) {
    this.data.orders.unshift(order);
    this.save();
    return order;
  }
  public updateOrder(id: string, updates: Partial<Order>) {
    const idx = this.data.orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    this.data.orders[idx] = { ...this.data.orders[idx], ...updates };
    this.save();
    return this.data.orders[idx];
  }

  // --- Reviews ---
  public getReviews(restaurantId?: string) {
    if (restaurantId) {
      return this.data.reviews.filter((r) => r.restaurantId === restaurantId);
    }
    return this.data.reviews;
  }
  public createReview(review: Review) {
    this.data.reviews.unshift(review);
    // Recalculate average rating for restaurant
    const restReviews = this.data.reviews.filter(
      (r) => r.restaurantId === review.restaurantId
    );
    const avg =
      restReviews.reduce((sum, r) => sum + r.rating, 0) / restReviews.length;
    this.updateRestaurant(review.restaurantId, {
      averageRating: parseFloat(avg.toFixed(1)),
      totalRatings: restReviews.length,
    });
    this.save();
    return review;
  }

  // --- Coupons ---
  public getCoupons() {
    return this.data.coupons;
  }
  public getCouponByCode(code: string) {
    return this.data.coupons.find(
      (c) => c.code.toUpperCase() === code.toUpperCase() && c.isActive
    );
  }
  public createCoupon(c: Coupon) {
    this.data.coupons.push(c);
    this.save();
    return c;
  }
  public updateCoupon(id: string, updates: Partial<Coupon>) {
    const idx = this.data.coupons.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.data.coupons[idx] = { ...this.data.coupons[idx], ...updates };
    this.save();
    return this.data.coupons[idx];
  }

  // --- Payments ---
  public createPayment(p: Payment) {
    this.data.payments.push(p);
    this.save();
    return p;
  }
  public getPaymentByOrderId(orderId: string) {
    return this.data.payments.find((p) => p.orderId === orderId);
  }
}

export const db = new DatabaseEngine();
