import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Container types
export interface Container {
  id?: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContainerItem {
  id?: number;
  container_name: string;
  reference_code: string;
  supplier: string;
  product: string;
  cbm: number;
  cartons: number;
  gross_weight: number;
  product_cost: number;
  freight_cost: number;
  status: 'Ready to Ship' | 'Awaiting Supplier' | 'Need Payment' | 'Pending';
  awaiting: string[];
  production_days: number;
  production_ready: string;
  client: string;
  packing_list?: { url: string; name: string } | string;
  commercial_invoice?: { url: string; name: string } | string;
  payment?: { url: string; name: string } | string;
  hbl?: { url: string; name: string } | string;
  certificates?: { url: string; name: string } | string;
  created_at?: string;
  updated_at?: string;
}

// Container operations
export const containerService = {
  // Get all containers
  async getAll(): Promise<Container[]> {
    const { data, error } = await supabase
      .from('containers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  // Create a new container
  async create(name: string): Promise<Container> {
    const { data, error } = await supabase
      .from('containers')
      .insert([{ name }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete a container
  async delete(name: string): Promise<void> {
    const { error } = await supabase
      .from('containers')
      .delete()
      .eq('name', name);
    
    if (error) throw error;
  }
};

// Container items operations
export const containerItemService = {
  // Get all items for a container
  async getByContainer(containerName: string): Promise<ContainerItem[]> {
    const { data, error } = await supabase
      .from('container_items')
      .select('*')
      .eq('container_name', containerName)
      .order('id');
    
    if (error) throw error;
    return data || [];
  },

  // Create a new item
  async create(item: Omit<ContainerItem, 'id' | 'created_at' | 'updated_at'>): Promise<ContainerItem> {
    const { data, error } = await supabase
      .from('container_items')
      .insert([item])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update an item
  async update(id: number, updates: Partial<ContainerItem>): Promise<ContainerItem> {
    const { data, error } = await supabase
      .from('container_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete an item
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('container_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Bulk update items
  async bulkUpdate(items: ContainerItem[]): Promise<void> {
    const updates = items.map(item => ({
      id: item.id,
      ...item
    }));

    const { error } = await supabase
      .from('container_items')
      .upsert(updates);
    
    if (error) throw error;
  }
};

