import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Middleware: restrict to owner or admin
router.use(requireAuth);
router.use(requireRole(['owner', 'admin']));

// GET /api/owner/my-restaurant - Get restaurant(s) owned by logged-in user
router.get('/my-restaurant', (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.userId;
    const restaurants = db.getRestaurantsByOwnerId(ownerId);

    if (restaurants.length === 0) {
      // If user is admin or test owner without restaurant, allow fallback to first restaurant
      if (req.user!.role === 'admin' || ownerId === 'usr_owner_1') {
        const fallback = db.getRestaurantById('rest_1');
        return res.json({ success: true, restaurant: fallback, restaurants: [fallback] });
      }
      return res.json({ success: true, restaurant: null, restaurants: [] });
    }

    return res.json({
      success: true,
      restaurant: restaurants[0],
      restaurants,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve owner restaurant.' });
  }
});

// GET /api/owner/orders - Incoming & active orders for owner's restaurant
router.get('/orders', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { restaurantId, status } = req.query;
    let targetRestaurantId = restaurantId as string;

    if (!targetRestaurantId) {
      const owned = db.getRestaurantsByOwnerId(req.user!.userId);
      targetRestaurantId = owned[0]?.id || 'rest_1';
    }

    let orders = db.getOrdersByRestaurantId(targetRestaurantId);

    if (status && status !== 'all') {
      orders = orders.filter((o) => o.orderStatus === status);
    }

    // Enrich with customer details
    const enriched = orders.map((o) => {
      const customer = db.getUserById(o.customerId);
      return {
        ...o,
        customerName: customer?.name || 'Customer',
        customerPhone: customer?.phone || 'N/A',
      };
    });

    return res.json({
      success: true,
      total: enriched.length,
      orders: enriched,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve owner orders.' });
  }
});

// GET /api/owner/analytics - Restaurant metrics & sales summary
router.get('/analytics', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { restaurantId } = req.query;
    let targetRestaurantId = restaurantId as string;

    if (!targetRestaurantId) {
      const owned = db.getRestaurantsByOwnerId(req.user!.userId);
      targetRestaurantId = owned[0]?.id || 'rest_1';
    }

    const orders = db.getOrdersByRestaurantId(targetRestaurantId);
    const completedOrders = orders.filter((o) => o.orderStatus === 'delivered');
    const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.orderStatus));

    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const averageOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

    // Item popularity count
    const itemCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemCounts[item.name].quantity += item.quantity;
        itemCounts[item.name].revenue += item.price * item.quantity;
      });
    });

    const popularItems = Object.values(itemCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return res.json({
      success: true,
      analytics: {
        totalOrders: orders.length,
        activeOrdersCount: activeOrders.length,
        completedOrdersCount: completedOrders.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageOrderValue,
        popularItems,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to generate owner analytics.' });
  }
});

export default router;
