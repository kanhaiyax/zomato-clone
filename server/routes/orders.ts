import { Router, Response } from 'express';
import { db, Order, OrderItem } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';
import { broadcastOrderUpdate } from '../websocket.js';

const router = Router();

// POST /api/orders - Create a new order with server-authoritative price validation
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      restaurantId,
      items,
      deliveryAddress,
      paymentMethod = 'razorpay',
      couponCode,
      deliveryInstructions,
    } = req.body;

    if (!restaurantId || !Array.isArray(items) || items.length === 0 || !deliveryAddress) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant, items array, and delivery address are required.',
      });
    }

    const restaurant = db.getRestaurantById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found.' });
    }

    if (!restaurant.isOpen) {
      return res.status(400).json({
        success: false,
        error: 'This restaurant is currently closed and not accepting orders.',
      });
    }

    // Verify all menu items against database to prevent client price tampering
    let calculatedSubtotal = 0;
    const validatedItems: OrderItem[] = [];

    for (const rawItem of items) {
      const dbItem = db.getMenuItemById(rawItem.menuItemId);
      if (!dbItem || dbItem.restaurantId !== restaurantId) {
        return res.status(400).json({
          success: false,
          error: `Item "${rawItem.name || rawItem.menuItemId}" does not belong to this restaurant.`,
        });
      }
      if (!dbItem.isAvailable) {
        return res.status(400).json({
          success: false,
          error: `Item "${dbItem.name}" is currently sold out.`,
        });
      }

      const qty = Math.max(1, parseInt(rawItem.quantity, 10) || 1);
      const itemCost = dbItem.price * qty;
      calculatedSubtotal += itemCost;

      validatedItems.push({
        menuItemId: dbItem.id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: qty,
        isVegetarian: dbItem.isVegetarian,
      });
    }

    if (calculatedSubtotal < restaurant.minimumOrder) {
      return res.status(400).json({
        success: false,
        error: `Minimum order amount for ${restaurant.name} is ₹${restaurant.minimumOrder}. Current total is ₹${calculatedSubtotal}.`,
      });
    }

    // Server-side calculation of taxes and fees
    const deliveryFee = calculatedSubtotal > 500 ? 0 : 40; // Free delivery above 500
    const tax = Math.round(calculatedSubtotal * 0.05 * 100) / 100; // 5% GST

    // Validate coupon if provided
    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const coupon = db.getCouponByCode(couponCode);
      if (coupon && calculatedSubtotal >= coupon.minimumOrderValue) {
        if (coupon.discountType === 'percentage') {
          discount = (calculatedSubtotal * coupon.discountValue) / 100;
          if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
            discount = coupon.maximumDiscount;
          }
        } else {
          discount = coupon.discountValue;
        }
        discount = Math.min(discount, calculatedSubtotal);
        appliedCoupon = coupon;
        db.updateCoupon(coupon.id, { usageCount: coupon.usageCount + 1 });
      }
    }

    const totalAmount = Math.max(0, Math.round((calculatedSubtotal + deliveryFee + tax - discount) * 100) / 100);

    const now = new Date();
    const orderNumber = `ZOM-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderNumber,
      customerId: req.user!.userId,
      restaurantId,
      items: validatedItems,
      deliveryAddress: {
        type: deliveryAddress.type || 'Home',
        addressLine: deliveryAddress.addressLine,
        landmark: deliveryAddress.landmark || '',
        city: deliveryAddress.city || 'Bengaluru',
        pincode: deliveryAddress.pincode,
      },
      subtotal: calculatedSubtotal,
      deliveryFee,
      tax,
      discount: Math.round(discount * 100) / 100,
      totalAmount,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      paymentMethod: paymentMethod === 'cod' ? 'cod' : 'razorpay',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed', // In test mode razorpay is marked completed on verified simulation
      orderStatus: 'placed',
      statusHistory: [
        {
          status: 'placed',
          timestamp: now.toISOString(),
          note: paymentMethod === 'cod' ? 'Order placed with Cash on Delivery' : 'Order placed and payment authorized',
        },
      ],
      deliveryInstructions: deliveryInstructions?.trim() || '',
      estimatedDeliveryTime: `${restaurant.deliveryTimeMin}-${restaurant.deliveryTimeMax} mins`,
      driverDetails: {
        name: 'Suresh Kumar',
        phone: '+91 98450 44321',
        vehicleNumber: 'KA 01 EK 9102',
        rating: 4.8,
        currentLocation: {
          lat: restaurant.location.lat,
          lng: restaurant.location.lng,
        },
      },
      createdAt: now.toISOString(),
    };

    db.createOrder(newOrder);

    // Broadcast new order event to restaurant owner and admins via WebSocket
    broadcastOrderUpdate(newOrder, 'order:new');

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: newOrder,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ success: false, error: 'Failed to place order.' });
  }
});

// GET /api/orders/my-orders - Customer order history
router.get('/my-orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = db.getOrdersByCustomerId(req.user!.userId);
    // Enrich with restaurant details
    const enriched = orders.map((o) => {
      const rest = db.getRestaurantById(o.restaurantId);
      return {
        ...o,
        restaurantName: rest?.name || 'Restaurant',
        restaurantImage: rest?.image,
        restaurantAddress: rest?.address,
      };
    });

    return res.json({ success: true, orders: enriched });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch customer orders.' });
  }
});

// GET /api/orders/:id - Order details by ID
router.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = db.getOrderById(id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    // Permission check: customer must own the order, or owner of the restaurant, or admin
    const restaurant = db.getRestaurantById(order.restaurantId);
    const isCustomer = order.customerId === req.user!.userId;
    const isOwner = restaurant && restaurant.ownerId === req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isCustomer && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied for this order.' });
    }

    const customer = db.getUserById(order.customerId);

    return res.json({
      success: true,
      order,
      restaurant,
      customer: customer ? { name: customer.name, phone: customer.phone, email: customer.email } : null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch order details.' });
  }
});

// PATCH /api/orders/:id/status - Update order status (Owner or Admin)
router.patch('/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses: Order['orderStatus'][] = [
      'placed',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: [${validStatuses.join(', ')}]`,
      });
    }

    const order = db.getOrderById(id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const restaurant = db.getRestaurantById(order.restaurantId);
    const isOwner = restaurant && restaurant.ownerId === req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized to update order status.' });
    }

    const defaultNotes: Record<Order['orderStatus'], string> = {
      placed: 'Order placed',
      confirmed: `${restaurant?.name || 'Restaurant'} accepted your order`,
      preparing: 'Chef is preparing your fresh meal',
      ready_for_pickup: 'Order is packed and ready for delivery partner',
      out_for_delivery: 'Delivery partner has picked up your order and is on the way',
      delivered: 'Order has been successfully delivered! Enjoy your meal.',
      cancelled: 'Order has been cancelled',
    };

    const newHistoryEntry = {
      status,
      timestamp: new Date().toISOString(),
      note: note || defaultNotes[status as Order['orderStatus']],
    };

    const updates: Partial<Order> = {
      orderStatus: status,
      statusHistory: [...order.statusHistory, newHistoryEntry],
    };

    // If delivered, mark payment as completed if COD
    if (status === 'delivered' && order.paymentMethod === 'cod') {
      updates.paymentStatus = 'completed';
    }

    // Simulate driver movement on out_for_delivery
    if (status === 'out_for_delivery' && order.driverDetails) {
      updates.driverDetails = {
        ...order.driverDetails,
        currentLocation: {
          lat: (restaurant?.location.lat || 12.9716) + 0.005,
          lng: (restaurant?.location.lng || 77.5946) + 0.004,
        },
      };
    }

    const updated = db.updateOrder(id, updates);

    // Broadcast live WebSocket event to tracking page & dashboards
    if (updated) {
      broadcastOrderUpdate(updated, 'order:status_update');
    }

    return res.json({
      success: true,
      message: `Order status updated to ${status}.`,
      order: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update order status.' });
  }
});

// POST /api/orders/:id/cancel - Customer can cancel early orders
router.post('/:id/cancel', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by customer' } = req.body;

    const order = db.getOrderById(id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    if (order.customerId !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized to cancel this order.' });
    }

    if (!['placed', 'confirmed'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        error: `Order cannot be cancelled because it is already ${order.orderStatus.replace('_', ' ')}.`,
      });
    }

    const updated = db.updateOrder(id, {
      orderStatus: 'cancelled',
      paymentStatus: order.paymentStatus === 'completed' ? 'refunded' : 'failed',
      statusHistory: [
        ...order.statusHistory,
        {
          status: 'cancelled',
          timestamp: new Date().toISOString(),
          note: reason,
        },
      ],
    });

    if (updated) {
      broadcastOrderUpdate(updated, 'order:cancelled');
    }

    return res.json({
      success: true,
      message: 'Order cancelled successfully.',
      order: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to cancel order.' });
  }
});

export default router;
