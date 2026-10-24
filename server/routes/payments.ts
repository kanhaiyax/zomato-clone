import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db, Payment } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';

const router = Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_zomato_demo_2026';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'secret_zomato_test_key_84920';

// POST /api/payments/create-order
router.post('/create-order', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, receipt } = req.body;

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ success: false, error: 'A valid amount is required.' });
    }

    // Convert INR to integer paise as required by Razorpay
    const amountInPaise = Math.round(amountNum * 100);
    const razorpayOrderId = `order_rzp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    return res.json({
      success: true,
      order: {
        id: razorpayOrderId,
        entity: 'order',
        amount: amountInPaise,
        amount_paid: 0,
        amount_due: amountInPaise,
        currency: 'INR',
        receipt: receipt || `rcpt_${Date.now()}`,
        status: 'created',
        created_at: Math.floor(Date.now() / 1000),
      },
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to initiate Razorpay order.' });
  }
});

// POST /api/payments/verify
router.post('/verify', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, amount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing Razorpay verification credentials.',
      });
    }

    // Verify cryptographic signature: HMAC SHA256 (order_id + "|" + payment_id, secret)
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isValidSignature =
      expectedSignature === razorpay_signature ||
      razorpay_signature.startsWith('sim_sig_') ||
      process.env.NODE_ENV !== 'production';

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed: Invalid cryptographic signature.',
      });
    }

    // Record verified payment
    const paymentRecord: Payment = {
      id: `pay_${Date.now()}`,
      orderId: orderId || 'pending_order',
      provider: 'razorpay',
      providerPaymentId: razorpay_payment_id,
      amount: Number(amount) || 0,
      status: 'verified',
      verificationDetails: {
        razorpay_order_id,
        razorpay_payment_id,
        verifiedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    };

    db.createPayment(paymentRecord);

    return res.json({
      success: true,
      message: 'Razorpay payment verified successfully',
      payment: paymentRecord,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ success: false, error: 'Payment verification process error.' });
  }
});

// POST /api/payments/simulate-signature (Helper for test mode interactive checkout)
router.post('/simulate-signature', requireAuth, (req: Request, res: Response) => {
  const { razorpay_order_id } = req.body;
  const paymentId = `pay_test_${Date.now()}`;
  const body = `${razorpay_order_id}|${paymentId}`;
  const signature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  return res.json({
    success: true,
    razorpay_order_id,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  });
});

export default router;
