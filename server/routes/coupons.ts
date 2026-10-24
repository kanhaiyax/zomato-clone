import { Router, Request, Response } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/coupons - List active public coupons
router.get('/', (_req: Request, res: Response) => {
  try {
    const coupons = db.getCoupons().filter((c) => c.isActive);
    return res.json({ success: true, coupons });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve promotional coupons.' });
  }
});

// POST /api/coupons/validate - Validate coupon for given cart subtotal
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, error: 'Coupon code is required.' });
    }

    const subtotalNum = Number(subtotal);
    if (isNaN(subtotalNum) || subtotalNum <= 0) {
      return res.status(400).json({ success: false, error: 'A valid cart subtotal is required.' });
    }

    const coupon = db.getCouponByCode(code);
    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Invalid or expired coupon code.' });
    }

    if (new Date(coupon.expiryDate).getTime() < Date.now()) {
      return res.status(400).json({ success: false, error: 'This coupon has expired.' });
    }

    if (coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, error: 'This coupon has reached its maximum redemptions.' });
    }

    if (subtotalNum < coupon.minimumOrderValue) {
      return res.status(400).json({
        success: false,
        error: `Minimum order subtotal of ₹${coupon.minimumOrderValue} required for this coupon.`,
        requiredAmount: coupon.minimumOrderValue,
      });
    }

    let calculatedDiscount = 0;
    if (coupon.discountType === 'percentage') {
      calculatedDiscount = (subtotalNum * coupon.discountValue) / 100;
      if (coupon.maximumDiscount && calculatedDiscount > coupon.maximumDiscount) {
        calculatedDiscount = coupon.maximumDiscount;
      }
    } else {
      // Flat discount
      calculatedDiscount = coupon.discountValue;
    }

    calculatedDiscount = Math.min(calculatedDiscount, subtotalNum);

    return res.json({
      success: true,
      message: `Coupon '${coupon.code}' applied successfully!`,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description,
      },
      discountAmount: Math.round(calculatedDiscount * 100) / 100,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to validate coupon.' });
  }
});

export default router;
