-- Add I265 WATER SOFTENER entry to Supabase
-- Based on .cursorrules: I265 = supplier code, WATER SOFTENER = product name
-- Reference code format: "I265 WATER SOFTENER" (supplier code + product name)
-- Invoice file: I265 WATER SOFTENER INVOICE-2025.10.09.pdf

-- TODO: Fill in these values from the PDF:
-- - CBM: 
-- - Cartons: 
-- - Gross Weight (KGs): 
-- - Product Cost: 

INSERT INTO container_items (
  container_name,
  reference_code,
  supplier,
  cbm,
  cartons,
  gross_weight,
  product_cost,
  freight_cost,
  status,
  awaiting,
  production_days,
  production_ready,
  client,
  commercial_invoice
) VALUES (
  'I110.12 NORTH',              -- Which container? Change if needed
  'I265 WATER SOFTENER',         -- Reference code: supplier code + product name
  'I265 Supplier Name',          -- TODO: Fill in supplier name from PDF
  0,                             -- TODO: CBM from PL (Packing List)
  0,                             -- TODO: Cartons from PL
  0,                             -- TODO: Gross Weight (KGs) from PL
  0,                             -- TODO: Product Cost from CI (Commercial Invoice)
  0,                             -- Freight cost (if known)
  'Awaiting Supplier',           -- Current status
  '["Payment", "Documents"]',    -- What's awaiting
  0,                             -- Production days (if known)
  '',                            -- Production ready date
  'AROMA IONIOU SA',             -- Client (from your rules - consignee)
  '{"name": "I265 WATER SOFTENER INVOICE-2025.10.09.pdf", "url": "/I265 WATER SOFTENER INVOICE-2025.10.09.pdf", "type": "application/pdf"}'
);

