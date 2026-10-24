import { Router, Request, Response } from 'express';
import { db, Review } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';

const router = Router();

// GET /api/reviews/restaurant/:restaurantId
router.get('/restaurant/:restaurantId', (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const reviews = db.getReviews(restaurantId);
    return res.json({ success: true, reviews });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve reviews.' });
  }
});

// POST /api/reviews
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { restaurantId, orderId, rating, comment } = req.body;

    if (!restaurantId || !rating || !comment) {
      return res.status(400).json({ success: false, error: 'Restaurant ID, rating, and comment are required.' });
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be an integer between 1 and 5.' });
    }

    const restaurant = db.getRestaurantById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found.' });
    }

    const newReview: Review = {
      id: `rev_${Date.now()}`,
      customerId: req.user!.userId,
      customerName: req.fullUser!.name,
      restaurantId,
      orderId,
      rating: ratingNum,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    db.createReview(newReview);

    return res.status(201).json({
      success: true,
      message: 'Thank you for your review!',
      review: newReview,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to submit review.' });
  }
});

export default router;
