# Integration Guide: Adding AI & Database to Your App

## 🚀 Quick Start

### Step 1: Install Required Packages

```bash
npm install @vercel/postgres openai @vercel/blob
```

### Step 2: Add AI Email Parser to Your App

Import and add the AI Email Parser button next to Import/Export buttons:

```tsx
// In src/App.tsx

import { AIEmailParser } from './components/ai/AIEmailParser';

// Inside your component, add this function:
const handleAIDataExtracted = (extractedData: any) => {
  // Create new item from AI-extracted data
  const newId = Math.max(...containerData.map(item => item.id), 0) + 1;
  const newItem: ContainerItem = {
    id: newId,
    referenceCode: extractedData.referenceCode || '',
    supplier: extractedData.supplier || '',
    product: extractedData.product || '',
    cbm: extractedData.cbm || 0,
    cartons: extractedData.cartons || 0,
    grossWeight: extractedData.grossWeight || 0,
    productCost: extractedData.productCost || 0,
    freightCost: extractedData.freightCost || 0,
    client: extractedData.client || '',
    status: extractedData.status || 'Pending',
    awaiting: extractedData.awaiting || '-',
  };
  
  setContainerData([...containerData, newItem]);
  
  // Show success notification
  alert('Item added successfully from AI extraction!');
};

// In your render, add the AI Parser button:
<div className="flex items-center justify-center gap-4">
  <button onClick={exportToExcel}>Export to Excel</button>
  <button onClick={() => setShowImportModal(true)}>Import from Excel</button>
  
  {/* Add this new AI button */}
  <AIEmailParser 
    onDataExtracted={handleAIDataExtracted}
    containerName={selectedContainer}
  />
</div>
```

---

## 🗄️ Connecting to Database (Production-Ready)

### Option 1: Keep Local State (Current - Easiest)
✅ **Works now, no setup needed**
- Data stored in browser memory
- Lost on page refresh
- Good for: Testing, demos, single-user

### Option 2: Add Database (Recommended for Production)

#### A. Convert to Use API

```tsx
// src/App.tsx - Modified version

import { useState, useEffect } from 'react';
import { itemsAPI } from './services/api';

function App() {
  const [containerData, setContainerData] = useState<ContainerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentContainerId, setCurrentContainerId] = useState(1);

  // Load data from database on mount
  useEffect(() => {
    loadContainerData();
  }, [selectedContainer]);

  const loadContainerData = async () => {
    setLoading(true);
    try {
      const items = await itemsAPI.getAll(currentContainerId);
      setContainerData(items);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update existing functions to use API:
  
  const addNewRow = async () => {
    const newItem = {
      containerId: currentContainerId,
      referenceCode: '',
      supplier: '',
      product: '',
      cbm: 0,
      cartons: 0,
      grossWeight: 0,
      productCost: 0,
      freightCost: 0,
      client: '',
      status: 'Pending' as const,
      awaiting: '-',
    };
    
    try {
      const created = await itemsAPI.create(newItem);
      setContainerData([...containerData, created]);
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    
    const item = containerData.find(i => i.id === editingCell.id);
    if (!item) return;

    const updates = { [editingCell.field]: editValue };
    
    try {
      const updated = await itemsAPI.update(item.id, updates);
      setContainerData(containerData.map(i => 
        i.id === updated.id ? updated : i
      ));
    } catch (error) {
      console.error('Failed to update item:', error);
    }
    
    setEditingCell(null);
    setEditValue('');
  };

  const deleteRow = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await itemsAPI.delete(id);
      setContainerData(containerData.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  // Rest of your component...
}
```

#### B. File Upload to Cloud Storage

```tsx
// Update file upload handler to use Vercel Blob:

import { fileAPI } from './services/api';

const handleFileUpload = async (
  id: number, 
  field: keyof ContainerItem, 
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  try {
    // Upload to Vercel Blob
    const fileUrl = await fileAPI.upload(file, 'container-documents');
    
    // Update item with file URL
    await itemsAPI.update(id, { [field]: fileUrl });
    
    // Update local state
    setContainerData(containerData.map(item => 
      item.id === id ? { ...item, [field]: fileUrl } : item
    ));
  } catch (error) {
    console.error('Failed to upload file:', error);
    alert('Failed to upload file');
  }
};
```

---

## 📊 Migration Strategy

### Phase 1: Add AI (Keep Local State)
1. Add AI Email Parser component ✅
2. Test with local data
3. No database needed yet

### Phase 2: Add Database (Gradual Migration)
1. Set up Vercel Postgres
2. Create API routes
3. Update one feature at a time:
   - First: Load/Save items
   - Then: File uploads
   - Finally: Real-time sync

### Phase 3: Add Advanced Features
1. User authentication
2. Multi-user collaboration
3. Real-time updates
4. Audit logs

---

## 🎯 Recommended Approach

### For Testing AI Parsing (Do This First):
```bash
# 1. No database setup needed
# 2. Just add the AI component
# 3. Test email parsing locally

# Copy AIEmailParser.tsx to your project
# Import it in App.tsx
# Add the button
# Test with sample emails
```

### For Production (Do This After Testing):
```bash
# 1. Set up Vercel account
# 2. Add Postgres database
# 3. Create API routes
# 4. Update App.tsx to use API
# 5. Deploy to Vercel
```

---

## 💡 Testing Without OpenAI (Free)

While developing, you can mock the AI response:

```tsx
// In src/services/api.ts - Add mock mode:

export const aiAPI = {
  parseEmail: async (emailContent: string) => {
    // For testing without API key:
    if (process.env.NODE_ENV === 'development' && !process.env.OPENAI_API_KEY) {
      // Return mock data
      return {
        supplier: 'Test Supplier Co.',
        product: 'Ceramic Tiles',
        cbm: 25.5,
        cartons: 500,
        grossWeight: 12500,
        productCost: 22500,
        freightCost: 3200,
        client: 'Test Client',
        referenceCode: 'ORD-2024-001',
        status: 'Ready to Ship',
        awaiting: '-',
      };
    }
    
    // Real API call (your existing code)
    // ...
  },
};
```

This lets you build and test the UI without paying for API calls!

---

## 📞 Next Steps

1. **Try AI locally first** - No setup needed, just add the component
2. **Test with mock data** - See if the UX works for you
3. **Add database when ready** - When you want to save data permanently
4. **Deploy to Vercel** - When you're ready for production

Need help? Check:
- `DATABASE_SETUP.md` - Full database guide
- `ENVIRONMENT_SETUP.md` - Environment variables
- `api/examples/` - API route examples

