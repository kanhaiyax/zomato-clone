import { Router, Response } from 'express';
import { db, Coupon } from '../db.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Middleware: restrict strictly to admin
router.use(requireAuth);
router.use(requireRole(['admin']));

// GET /api/admin/overview
router.get('/overview', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = db.getUsers();
    const restaurants = db.getRestaurants();
    const orders = db.getOrders();

    const customers = users.filter((u) => u.role === 'customer');
    const owners = users.filter((u) => u.role === 'owner');
    const approvedRestaurants = restaurants.filter((r) => r.approvalStatus === 'approved');
    const pendingRestaurants = restaurants.filter((r) => r.approvalStatus === 'pending');

    const totalRevenue = orders
      .filter((o) => o.paymentStatus === 'completed' || o.orderStatus === 'delivered')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const platformCommission = Math.round(totalRevenue * 0.15 * 100) / 100; // 15% platform take-rate

    return res.json({
      success: true,
      stats: {
        totalGrossVolume: Math.round(totalRevenue * 100) / 100,
        platformCommission,
        totalOrders: orders.length,
        totalUsers: users.length,
        customerCount: customers.length,
        ownerCount: owners.length,
        totalRestaurants: restaurants.length,
        approvedRestaurantsCount: approvedRestaurants.length,
        pendingApprovalsCount: pendingRestaurants.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve admin overview metrics.' });
  }
});

// GET /api/admin/users
router.get('/users', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = db.getUsers().map(({ passwordHash, ...rest }) => rest);
    return res.json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch users.' });
  }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be active or suspended.' });
    }

    const updated = db.updateUser(id, { accountStatus: status });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const { passwordHash, ...safe } = updated;
    return res.json({ success: true, message: `User status changed to ${status}.`, user: safe });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update user status.' });
  }
});

// GET /api/admin/restaurants - All restaurants (including unapproved)
router.get('/restaurants', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const restaurants = db.getRestaurants();
    return res.json({ success: true, restaurants });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch restaurants.' });
  }
});

// PATCH /api/admin/restaurants/:id/approval
router.patch('/restaurants/:id/approval', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be approved, pending, or rejected.' });
    }

    const updated = db.updateRestaurant(id, { approvalStatus: status });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Restaurant not found.' });
    }

    return res.json({
      success: true,
      message: `Restaurant approval status updated to ${status}.`,
      restaurant: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update restaurant approval.' });
  }
});

// GET /api/admin/orders
router.get('/orders', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = db.getOrders();
    const enriched = orders.map((o) => {
      const rest = db.getRestaurantById(o.restaurantId);
      const cust = db.getUserById(o.customerId);
      return {
        ...o,
        restaurantName: rest?.name || 'Restaurant',
        customerName: cust?.name || 'Customer',
        customerEmail: cust?.email,
      };
    });
    return res.json({ success: true, orders: enriched });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch platform orders.' });
  }
});

// GET /api/admin/coupons
router.get('/coupons', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const coupons = db.getCoupons();
    return res.json({ success: true, coupons });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch coupons.' });
  }
});

// POST /api/admin/coupons
router.post('/coupons', (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      code,
      discountType = 'percentage',
      discountValue,
      minimumOrderValue = 200,
      maximumDiscount = 100,
      expiryDate,
      usageLimit = 500,
      description,
    } = req.body;

    if (!code || !discountValue) {
      return res.status(400).json({ success: false, error: 'Code and discountValue are required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = db.getCouponByCode(cleanCode);
    if (existing) {
      return res.status(409).json({ success: false, error: 'A coupon with this code already exists.' });
    }

    const newCoupon: Coupon = {
      id: `cpn_${Date.now()}`,
      code: cleanCode,
      discountType: discountType === 'flat' ? 'flat' : 'percentage',
      discountValue: Number(discountValue),
      minimumOrderValue: Number(minimumOrderValue),
      maximumDiscount: Number(maximumDiscount),
      expiryDate: expiryDate || new Date(Date.now() + 86400000 * 90).toISOString(),
      usageLimit: Number(usageLimit),
      usageCount: 0,
      isActive: true,
      description: description?.trim() || `${cleanCode} special promotion`,
    };

    db.createCoupon(newCoupon);

    return res.status(201).json({
      success: true,
      message: 'Promotional coupon created successfully.',
      coupon: newCoupon,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create coupon.' });
  }
});

// DELETE /api/admin/coupons/:id
router.delete('/coupons/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    db.updateCoupon(id, { isActive: false });
    return res.json({ success: true, message: 'Coupon deactivated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to deactivate coupon.' });
  }
});

export default router;
