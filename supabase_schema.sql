-- Containers Planning App Database Schema for Supabase

-- Table for container list
CREATE TABLE IF NOT EXISTS containers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for container items
CREATE TABLE IF NOT EXISTS container_items (
  id BIGSERIAL PRIMARY KEY,
  container_name VARCHAR(100) NOT NULL REFERENCES containers(name) ON DELETE CASCADE,
  reference_code VARCHAR(100),
  supplier TEXT,
  product TEXT,
  cbm DECIMAL(10,2) DEFAULT 0,
  cartons INTEGER DEFAULT 0,
  gross_weight DECIMAL(10,2) DEFAULT 0,
  product_cost DECIMAL(10,2) DEFAULT 0,
  freight_cost DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Pending',
  awaiting JSONB DEFAULT '[]'::jsonb,
  production_days INTEGER DEFAULT 0,
  production_ready VARCHAR(50),
  client TEXT,
  packing_list JSONB,
  commercial_invoice JSONB,
  payment JSONB,
  hbl JSONB,
  certificates JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_container_items_container_name ON container_items(container_name);
CREATE INDEX IF NOT EXISTS idx_container_items_status ON container_items(status);

-- Enable Row Level Security (RLS)
ALTER TABLE containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE container_items ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (you can restrict this later)
CREATE POLICY "Allow public read access on containers" ON containers
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on containers" ON containers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on containers" ON containers
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on containers" ON containers
  FOR DELETE USING (true);

CREATE POLICY "Allow public read access on container_items" ON container_items
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on container_items" ON container_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on container_items" ON container_items
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on container_items" ON container_items
  FOR DELETE USING (true);

-- Insert default containers
-- To add/remove containers: simply add/remove lines below
-- Format: ('CONTAINER_NAME'),
INSERT INTO containers (name) VALUES 
  ('I110.12 NORTH'),
  ('I110.11 SOUTH')
  -- Add more containers here as needed:
  -- ('I269.1'),
  -- ('I269.2'),
ON CONFLICT (name) DO NOTHING;

