import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';

// ── Register ──
export const register = async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;
    console.log(`📝 Registration attempt: name="${name}", email="${email}"`);

    if (!email || !name || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword, style: 'Minimalist' },
    });
    console.log(`✅ User created successfully: ${user.id}`);
    
    // Don't send password back to client
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error: any) {
    console.error('❌ Registration failed:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

// ── Login ──
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log(`🔑 Login attempt: email="${email}"`);

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.password) {
      return res.status(400).json({ success: false, error: 'Invalid login method for this user' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    console.log(`✅ Login successful: ${user.name}`);
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error: any) {
    console.error('❌ Login failed:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};
