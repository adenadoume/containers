// API Route: /api/items/index.ts
// CRUD operations for container items

import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { method } = req;

    // GET all items for a container
    if (method === 'GET') {
      const { containerId } = req.query;

      if (!containerId) {
        return res.status(400).json({ error: 'Container ID is required' });
      }

      const { rows } = await sql`
        SELECT * FROM container_items 
        WHERE container_id = ${containerId as string}
        ORDER BY created_at DESC
      `;

      return res.status(200).json({ items: rows });
    }

    // POST - Create new item
    if (method === 'POST') {
      const {
        containerId,
        referenceCode,
        supplier,
        product,
        cbm,
        cartons,
        grossWeight,
        productCost,
        freightCost,
        client,
        status,
        awaiting,
      } = req.body;

      if (!containerId) {
        return res.status(400).json({ error: 'Container ID is required' });
      }

      const { rows } = await sql`
        INSERT INTO container_items (
          container_id, reference_code, supplier, product, cbm, cartons,
          gross_weight, product_cost, freight_cost, client, status, awaiting
        ) VALUES (
          ${containerId}, ${referenceCode || ''}, ${supplier || ''}, 
          ${product || ''}, ${cbm || 0}, ${cartons || 0},
          ${grossWeight || 0}, ${productCost || 0}, ${freightCost || 0},
          ${client || ''}, ${status || 'Pending'}, ${awaiting || '-'}
        )
        RETURNING *
      `;

      return res.status(201).json({ item: rows[0] });
    }

    // PUT - Update item
    if (method === 'PUT') {
      const { id, ...updateData } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Item ID is required' });
      }

      const { rows } = await sql`
        UPDATE container_items
        SET 
          reference_code = COALESCE(${updateData.referenceCode}, reference_code),
          supplier = COALESCE(${updateData.supplier}, supplier),
          product = COALESCE(${updateData.product}, product),
          cbm = COALESCE(${updateData.cbm}, cbm),
          cartons = COALESCE(${updateData.cartons}, cartons),
          gross_weight = COALESCE(${updateData.grossWeight}, gross_weight),
          product_cost = COALESCE(${updateData.productCost}, product_cost),
          freight_cost = COALESCE(${updateData.freightCost}, freight_cost),
          client = COALESCE(${updateData.client}, client),
          status = COALESCE(${updateData.status}, status),
          awaiting = COALESCE(${updateData.awaiting}, awaiting),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }

      return res.status(200).json({ item: rows[0] });
    }

    // DELETE - Remove item
    if (method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Item ID is required' });
      }

      await sql`DELETE FROM container_items WHERE id = ${id as string}`;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      error: 'Database operation failed',
      message: error.message 
    });
  }
}

