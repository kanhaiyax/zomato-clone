import { Router, Request, Response } from 'express';
import { db, Restaurant } from '../db.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../auth.js';

const router = Router();

// GET /api/restaurants - Public restaurant discovery with rich search and filtering
router.get('/', (req: Request, res: Response) => {
  try {
    const {
      search = '',
      cuisine = '',
      rating = '0',
      minPrice = '0',
      maxPrice = '10000',
      maxDeliveryTime = '120',
      pureVeg = 'false',
      sort = 'popularity',
      city = '',
      area = '',
    } = req.query;

    let restaurants = db.getRestaurants().filter((r) => r.approvalStatus === 'approved');

    // Filter by search query (name, cuisine, area, or description)
    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      restaurants = restaurants.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisines.some((c) => c.toLowerCase().includes(q)) ||
          r.location.area.toLowerCase().includes(q) ||
          r.location.city.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }

    // Filter by cuisine
    if (cuisine && typeof cuisine === 'string' && cuisine !== 'all') {
      const cLower = cuisine.toLowerCase();
      restaurants = restaurants.filter((r) =>
        r.cuisines.some((c) => c.toLowerCase() === cLower)
      );
    }

    // Filter by rating
    const minRatingNum = parseFloat(rating as string);
    if (!isNaN(minRatingNum) && minRatingNum > 0) {
      restaurants = restaurants.filter((r) => r.averageRating >= minRatingNum);
    }

    // Filter by price range
    const minP = parseFloat(minPrice as string);
    const maxP = parseFloat(maxPrice as string);
    if (!isNaN(minP)) {
      restaurants = restaurants.filter((r) => r.priceForTwo >= minP);
    }
    if (!isNaN(maxP)) {
      restaurants = restaurants.filter((r) => r.priceForTwo <= maxP);
    }

    // Filter by delivery time
    const maxDT = parseInt(maxDeliveryTime as string, 10);
    if (!isNaN(maxDT)) {
      restaurants = restaurants.filter((r) => r.deliveryTimeMax <= maxDT);
    }

    // Filter pure veg
    if (pureVeg === 'true') {
      restaurants = restaurants.filter((r) => r.pureVeg);
    }

    // Filter by city or area
    if (city && typeof city === 'string') {
      restaurants = restaurants.filter(
        (r) => r.location.city.toLowerCase() === city.toLowerCase()
      );
    }
    if (area && typeof area === 'string') {
      restaurants = restaurants.filter(
        (r) => r.location.area.toLowerCase() === area.toLowerCase()
      );
    }

    // Sorting
    if (sort === 'rating') {
      restaurants.sort((a, b) => b.averageRating - a.averageRating);
    } else if (sort === 'deliveryTime') {
      restaurants.sort((a, b) => a.deliveryTimeMin - b.deliveryTimeMin);
    } else if (sort === 'priceLow') {
      restaurants.sort((a, b) => a.priceForTwo - b.priceForTwo);
    } else if (sort === 'priceHigh') {
      restaurants.sort((a, b) => b.priceForTwo - a.priceForTwo);
    } else {
      // Default: popularity / featured
      restaurants.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return b.totalRatings - a.totalRatings;
      });
    }

    return res.json({
      success: true,
      total: restaurants.length,
      restaurants,
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve restaurants.' });
  }
});

// GET /api/restaurants/:id - Details, menu items, and reviews
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const restaurant = db.getRestaurantById(id);

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found.' });
    }

    const menu = db.getMenuItems(id);
    const reviews = db.getReviews(id);

    // Group menu by categories
    const categoriesMap: { [cat: string]: typeof menu } = {};
    menu.forEach((item) => {
      if (!categoriesMap[item.category]) {
        categoriesMap[item.category] = [];
      }
      categoriesMap[item.category].push(item);
    });

    return res.json({
      success: true,
      restaurant,
      menu,
      groupedMenu: categoriesMap,
      reviews,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch restaurant details.' });
  }
});

// POST /api/restaurants - Register restaurant (Owner or Admin)
router.post('/', requireAuth, requireRole(['owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      description,
      address,
      area,
      city = 'Bengaluru',
      lat = 12.9716,
      lng = 77.5946,
      cuisines = [],
      image,
      openingHours = '10:00 AM - 11:00 PM',
      priceForTwo = 500,
      deliveryTimeMin = 25,
      deliveryTimeMax = 40,
      minimumOrder = 150,
      pureVeg = false,
    } = req.body;

    if (!name || !address || !area) {
      return res.status(400).json({ success: false, error: 'Name, address, and area are required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newRestaurant: Restaurant = {
      id: `rest_${Date.now()}`,
      ownerId: req.user!.userId,
      name: name.trim(),
      slug,
      description: description?.trim() || '',
      address: address.trim(),
      location: {
        area: area.trim(),
        city: city.trim(),
        lat: Number(lat),
        lng: Number(lng),
      },
      cuisines: Array.isArray(cuisines) && cuisines.length > 0 ? cuisines : ['North Indian', 'Fast Food'],
      image: image || '/src/assets/images/hero_food_spread_1792857444168.jpg',
      openingHours: openingHours.trim(),
      averageRating: 5.0,
      totalRatings: 1,
      approvalStatus: req.user!.role === 'admin' ? 'approved' : 'pending',
      isOpen: true,
      priceForTwo: Number(priceForTwo),
      deliveryTimeMin: Number(deliveryTimeMin),
      deliveryTimeMax: Number(deliveryTimeMax),
      minimumOrder: Number(minimumOrder),
      pureVeg: Boolean(pureVeg),
      createdAt: new Date().toISOString(),
    };

    db.createRestaurant(newRestaurant);

    return res.status(201).json({
      success: true,
      message:
        req.user!.role === 'admin'
          ? 'Restaurant created and auto-approved.'
          : 'Restaurant submitted for administrative verification.',
      restaurant: newRestaurant,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create restaurant.' });
  }
});

// PUT /api/restaurants/:id - Update restaurant (Owner check or Admin)
router.put('/:id', requireAuth, requireRole(['owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.getRestaurantById(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Restaurant not found.' });
    }

    // Enforce ownership check
    if (req.user!.role !== 'admin' && existing.ownerId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'You are not authorized to edit this restaurant.' });
    }

    const allowedUpdates = [
      'name',
      'description',
      'address',
      'cuisines',
      'image',
      'bannerImage',
      'openingHours',
      'isOpen',
      'priceForTwo',
      'deliveryTimeMin',
      'deliveryTimeMax',
      'minimumOrder',
      'pureVeg',
    ];

    const updates: Partial<Restaurant> = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        (updates as Record<string, unknown>)[key] = req.body[key];
      }
    }

    if (req.body.area || req.body.city) {
      updates.location = {
        ...existing.location,
        ...(req.body.area && { area: req.body.area }),
        ...(req.body.city && { city: req.body.city }),
      };
    }

    const updated = db.updateRestaurant(id, updates);

    return res.json({
      success: true,
      message: 'Restaurant updated successfully.',
      restaurant: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update restaurant.' });
  }
});

// DELETE /api/restaurants/:id
router.delete('/:id', requireAuth, requireRole(['owner', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.getRestaurantById(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Restaurant not found.' });
    }

    if (req.user!.role !== 'admin' && existing.ownerId !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to delete this restaurant.' });
    }

    db.deleteRestaurant(id);

    return res.json({
      success: true,
      message: 'Restaurant removed successfully.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to delete restaurant.' });
  }
});

export default router;
