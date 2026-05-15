import { Request, Response } from 'express';
import { Readable } from 'stream';
import prisma from '../config/prisma';
import cloudinary from '../config/cloudinary';

// ── Upload to Cloudinary ──
export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Convert buffer to stream for Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'atla_wardrobe' },
      (error, result) => {
        if (error) return res.status(500).json({ success: false, error: error.message });
        res.json({ success: true, url: result?.secure_url });
      }
    );

    Readable.from((req as any).file.buffer).pipe(stream);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
