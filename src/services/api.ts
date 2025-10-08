// Frontend API Service
// src/services/api.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface ContainerItem {
  id: number;
  containerId: number;
  referenceCode: string;
  supplier: string;
  product: string;
  cbm: number;
  cartons: number;
  grossWeight: number;
  productCost: number;
  freightCost: number;
  client: string;
  status: 'Ready to Ship' | 'Awaiting Supplier' | 'Need Payment' | 'Pending';
  awaiting: string;
  packingListUrl?: string;
  commercialInvoiceUrl?: string;
  paymentUrl?: string;
  hblUrl?: string;
  certificatesUrl?: string;
}

export interface ParsedEmailData {
  supplier: string;
  product: string;
  cbm: number;
  cartons: number;
  grossWeight: number;
  productCost: number;
  freightCost: number;
  client: string;
  referenceCode: string;
  status: string;
  awaiting: string;
}

// Container Items API
export const itemsAPI = {
  // Get all items for a container
  getAll: async (containerId: number): Promise<ContainerItem[]> => {
    const response = await fetch(`${API_BASE_URL}/items?containerId=${containerId}`);
    if (!response.ok) throw new Error('Failed to fetch items');
    const data = await response.json();
    return data.items;
  },

  // Create new item
  create: async (item: Partial<ContainerItem>): Promise<ContainerItem> => {
    const response = await fetch(`${API_BASE_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to create item');
    const data = await response.json();
    return data.item;
  },

  // Update item
  update: async (id: number, updates: Partial<ContainerItem>): Promise<ContainerItem> => {
    const response = await fetch(`${API_BASE_URL}/items`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!response.ok) throw new Error('Failed to update item');
    const data = await response.json();
    return data.item;
  },

  // Delete item
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/items?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete item');
  },
};

// AI Email Parser API
export const aiAPI = {
  // Parse email content and extract shipping data
  parseEmail: async (emailContent: string, containerName?: string): Promise<ParsedEmailData> => {
    const response = await fetch(`${API_BASE_URL}/ai/parse-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailContent, containerName }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to parse email');
    }
    
    const data = await response.json();
    return data.data;
  },
};

// File Upload API (for Vercel Blob)
export const fileAPI = {
  // Upload file to Vercel Blob Storage
  upload: async (file: File, folder: string = 'documents'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload file');
    
    const data = await response.json();
    return data.url; // Returns the permanent URL
  },

  // Delete file from storage
  delete: async (url: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) throw new Error('Failed to delete file');
  },
};

// Container API
export const containersAPI = {
  // Get all containers
  getAll: async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/containers`);
    if (!response.ok) throw new Error('Failed to fetch containers');
    const data = await response.json();
    return data.containers;
  },

  // Create new container
  create: async (name: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/containers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error('Failed to create container');
    const data = await response.json();
    return data.container;
  },

  // Delete container
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/containers?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete container');
  },
};

