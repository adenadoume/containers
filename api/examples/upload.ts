// API Route: /api/upload.ts
// File upload to Vercel Blob Storage

import { put, del } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: false, // Disable default body parser for file uploads
  },
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Upload file
    if (req.method === 'POST') {
      // Note: In production, you'd use a proper multipart form parser
      // For simplicity, this example shows the concept
      
      // Get file from request (this is simplified - use 'multiparty' or similar in production)
      const contentType = req.headers['content-type'] || 'application/octet-stream';
      const filename = req.headers['x-filename'] as string || 'file';
      const folder = req.headers['x-folder'] as string || 'documents';
      
      // Upload to Vercel Blob
      const blob = await put(`${folder}/${filename}`, req, {
        access: 'public', // or 'private' depending on your needs
        contentType,
      });

      return res.status(200).json({
        success: true,
        url: blob.url,
        downloadUrl: blob.downloadUrl,
      });
    }

    // Delete file
    if (req.method === 'DELETE') {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      await del(url);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: 'Upload failed',
      message: error.message,
    });
  }
}

// Alternative: Using multiparty for proper multipart form handling
/*
import { put } from '@vercel/blob';
import multiparty from 'multiparty';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new multiparty.Form();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to parse form' });
    }

    const file = files.file[0];
    const folder = fields.folder?.[0] || 'documents';
    
    const blob = await put(`${folder}/${file.originalFilename}`, file.path, {
      access: 'public',
      contentType: file.headers['content-type'],
    });

    return res.status(200).json({ url: blob.url });
  });
}
*/

