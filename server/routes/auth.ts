import { Router, Request, Response } from 'express';
import { db, User } from '../db.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
  AuthenticatedRequest,
} from '../auth.js';

const router = Router();

// Store temporary password reset tokens in-memory
const resetTokens = new Map<string, { email: string; expires: number }>();

function sanitizeUser(user: User) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// POST /api/auth/register
router.post('/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role = 'customer' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    const assignedRole: 'customer' | 'owner' | 'admin' =
      ['customer', 'owner', 'admin'].includes(role) ? role : 'customer';

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      phone: phone?.trim() || '',
      role: assignedRole,
      accountStatus: 'active',
      savedAddresses: [],
      createdAt: new Date().toISOString(),
    };

    db.createUser(newUser);

    const token = generateToken({
      userId: newUser.id,
      role: newUser.role,
      email: newUser.email,
    });

    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: sanitizeUser(newUser),
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({ success: false, error: 'This account has been suspended.' });
    }

    const isValid = comparePassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    setAuthCookie(res, token);

    return res.json({
      success: true,
      message: 'Logged in successfully',
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error during login.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  clearAuthCookie(res);
  return res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.fullUser) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }
  return res.json({
    success: true,
    user: sanitizeUser(req.fullUser),
  });
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user!.userId;

    const updated = db.updateUser(userId, {
      ...(name && { name: name.trim() }),
      ...(phone !== undefined && { phone: phone.trim() }),
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: sanitizeUser(updated),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
});

// POST /api/auth/addresses
router.post('/addresses', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type = 'Home', addressLine, landmark, city, pincode, isDefault = false } = req.body;

    if (!addressLine || !city || !pincode) {
      return res.status(400).json({ success: false, error: 'Address line, city, and pincode are required.' });
    }

    const user = req.fullUser!;
    const newAddress = {
      id: `addr_${Date.now()}`,
      type: (['Home', 'Work', 'Other'].includes(type) ? type : 'Home') as 'Home' | 'Work' | 'Other',
      addressLine: addressLine.trim(),
      landmark: landmark?.trim() || '',
      city: city.trim(),
      pincode: pincode.trim(),
      isDefault: isDefault || user.savedAddresses.length === 0,
    };

    let updatedAddresses = [...user.savedAddresses];
    if (newAddress.isDefault) {
      updatedAddresses = updatedAddresses.map((a) => ({ ...a, isDefault: false }));
    }
    updatedAddresses.push(newAddress);

    const updatedUser = db.updateUser(user.id, { savedAddresses: updatedAddresses });

    return res.status(201).json({
      success: true,
      message: 'Address added successfully',
      address: newAddress,
      savedAddresses: updatedUser?.savedAddresses,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to save address.' });
  }
});

// DELETE /api/auth/addresses/:addressId
router.delete('/addresses/:addressId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { addressId } = req.params;
    const user = req.fullUser!;

    const filtered = user.savedAddresses.filter((a) => a.id !== addressId);
    if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
      filtered[0].isDefault = true;
    }

    const updatedUser = db.updateUser(user.id, { savedAddresses: filtered });

    return res.json({
      success: true,
      message: 'Address deleted successfully',
      savedAddresses: updatedUser?.savedAddresses,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to delete address.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    // For security reasons, still return success
    return res.json({
      success: true,
      message: 'If an account with that email exists, password reset instructions have been dispatched.',
    });
  }

  const resetToken = `rst_${Math.random().toString(36).substring(2)}${Date.now()}`;
  resetTokens.set(resetToken, {
    email: user.email,
    expires: Date.now() + 1000 * 60 * 30, // 30 minutes
  });

  return res.json({
    success: true,
    message: 'Password reset link dispatched.',
    demoResetToken: resetToken, // Provided in development for demo purposes
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ success: false, error: 'Token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
  }

  const record = resetTokens.get(token);
  if (!record || record.expires < Date.now()) {
    return res.status(400).json({ success: false, error: 'Reset token is invalid or has expired.' });
  }

  const user = db.getUserByEmail(record.email);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  db.updateUser(user.id, {
    passwordHash: hashPassword(newPassword),
  });

  resetTokens.delete(token);

  return res.json({
    success: true,
    message: 'Password has been reset successfully. Please sign in with your new password.',
  });
});

export default router;
