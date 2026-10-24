import { Router, Request, Response } from 'express';
import { db, MenuItem } from '../db.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../auth.js';

const router = Router();

// GET /api/menu/restaurant/:restaurantId
router.get('/restaurant/:restaurantId', (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const items = db.getMenuItems(restaurantId);
    return res.json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve menu items.' });
  }
});

// POST /api/menu/restaurant/:restaurantId - Add item (Owner or Admin)
router.post('/restaurant/:restaurantId', requireAuth, requireRole(['owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = db.getRestaurantById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found.' });
    }

    if (req.user!.role !== 'admin' && restaurant.ownerId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to add items to this restaurant.' });
    }

    const {
      name,
      description,
      price,
      image,
      category = 'Main Course',
      isVegetarian = false,
      isAvailable = true,
      preparationTimeMin = 15,
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, error: 'Name and price are required.' });
    }

    const newItem: MenuItem = {
      id: `menu_${Date.now()}`,
      restaurantId,
      name: name.trim(),
      description: description?.trim() || '',
      price: Number(price),
      image: image || '/src/assets/images/hero_food_spread_1792857444168.jpg',
      category: category.trim(),
      isVegetarian: Boolean(isVegetarian),
      isAvailable: Boolean(isAvailable),
      rating: 5.0,
      isBestSeller: false,
      preparationTimeMin: Number(preparationTimeMin) || 15,
      createdAt: new Date().toISOString(),
    };

    db.createMenuItem(newItem);

    return res.status(201).json({
      success: true,
      message: 'Menu item created successfully.',
      item: newItem,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create menu item.' });
  }
});

// PUT /api/menu/:itemId - Edit item
router.put('/:itemId', requireAuth, requireRole(['owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const item = db.getMenuItemById(itemId);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Menu item not found.' });
    }

    const restaurant = db.getRestaurantById(item.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Associated restaurant not found.' });
    }

    if (req.user!.role !== 'admin' && restaurant.ownerId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to update this menu item.' });
    }

    const updates: Partial<MenuItem> = {};
    if (req.body.name !== undefined) updates.name = req.body.name.trim();
    if (req.body.description !== undefined) updates.description = req.body.description.trim();
    if (req.body.price !== undefined) updates.price = Number(req.body.price);
    if (req.body.image !== undefined) updates.image = req.body.image;
    if (req.body.category !== undefined) updates.category = req.body.category.trim();
    if (req.body.isVegetarian !== undefined) updates.isVegetarian = Boolean(req.body.isVegetarian);
    if (req.body.isAvailable !== undefined) updates.isAvailable = Boolean(req.body.isAvailable);
    if (req.body.isBestSeller !== undefined) updates.isBestSeller = Boolean(req.body.isBestSeller);
    if (req.body.preparationTimeMin !== undefined) updates.preparationTimeMin = Number(req.body.preparationTimeMin);

    const updated = db.updateMenuItem(itemId, updates);

    return res.json({
      success: true,
      message: 'Menu item updated successfully.',
      item: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update menu item.' });
  }
});

// PATCH /api/menu/:itemId/toggle-availability
router.patch('/:itemId/toggle-availability', requireAuth, requireRole(['owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const item = db.getMenuItemById(itemId);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Menu item not found.' });
    }

    const restaurant = db.getRestaurantById(item.restaurantId);
    if (req.user!.role !== 'admin' && restaurant?.ownerId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }

    const updated = db.updateMenuItem(itemId, {
      isAvailable: !item.isAvailable,
    });

    return res.json({
      success: true,
      message: `Item marked as ${updated?.isAvailable ? 'available' : 'sold out'}.`,
      item: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to toggle availability.' });
  }
});

// DELETE /api/menu/:itemId
router.delete('/:itemId', requireAuth, requireRole(['owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const item = db.getMenuItemById(itemId);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Menu item not found.' });
    }

    const restaurant = db.getRestaurantById(item.restaurantId);
    if (req.user!.role !== 'admin' && restaurant?.ownerId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to delete this menu item.' });
    }

    db.deleteMenuItem(itemId);

    return res.json({
      success: true,
      message: 'Menu item deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to delete menu item.' });
  }
});

export default router;
