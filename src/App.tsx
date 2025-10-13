import { useState, useRef, useEffect } from 'react';
import { ChevronDown, FileText, Eye, Plus, X, Upload, Trash2, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { containerService, containerItemService } from './services/supabase';

interface ContainerItem {
  id: number;
  referenceCode: string;
  supplier: string;
  cbm: number;
  cartons: number;
  grossWeight: number;
  productCost: number;
  freightCost: number;
  status: 'Ready to Ship' | 'Awaiting Supplier' | 'Need Payment' | 'Pending';
  awaiting: string[];
  productionDays: number;
  productionReady: string;
  client: string;
  packingList?: string | { url: string; name: string };
  commercialInvoice?: string | { url: string; name: string };
  payment?: string | { url: string; name: string };
  hbl?: string | { url: string; name: string };
  certificates?: string | { url: string; name: string };
}

type EditingCell = {
  id: number;
  field: keyof ContainerItem;
} | null;

function App() {
  // Force rebuild - TypeScript errors resolved
  const [selectedContainer, setSelectedContainer] = useState('I110.11 SOUTH');
  const [showContainerDropdown, setShowContainerDropdown] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ type: string; url: string; name: string } | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'add'>('add');
  const [previewModal, setPreviewModal] = useState<{ show: boolean; file: string | null; name: string }>({
    show: false,
    file: null,
    name: ''
  });
  const [showAddContainer, setShowAddContainer] = useState(false);
  const [newContainerName, setNewContainerName] = useState('');
  const containerDropdownRef = useRef<HTMLDivElement>(null);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const excelImportRef = useRef<HTMLInputElement>(null);

  const [containers, setContainers] = useState(['I110.12 NORTH', 'I110.11 SOUTH', 'I269.1', 'I269.2', 'SUPPLIER LIST']);
  
  // TODO: SUPPLIER LIST functionality - Updated
  // When SUPPLIER LIST is selected, show a separate table for managing supplier information
  // When entering a reference code in any container entry, auto-fill supplier details:
  // - supplier name, product, address, contact info, etc.
  // This will require a supplier database/table with reference codes as keys

  // Initialize container from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const containerFromUrl = urlParams.get('container');
    
    if (containerFromUrl && containers.includes(containerFromUrl)) {
      setSelectedContainer(containerFromUrl);
    }
  }, []);

  // Update URL when container changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('container', selectedContainer);
    window.history.pushState({}, '', url.toString());
  }, [selectedContainer]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const containerFromUrl = urlParams.get('container');
      
      if (containerFromUrl && containers.includes(containerFromUrl)) {
        setSelectedContainer(containerFromUrl);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [containers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerDropdownRef.current && !containerDropdownRef.current.contains(event.target as Node)) {
        setShowContainerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [containerData, setContainerData] = useState<ContainerItem[]>([]);
  
  // Read-only mode check (for Vercel public access)
  const isReadOnly = import.meta.env.VITE_READ_ONLY === 'true';

  // Load containers from Supabase on mount
  useEffect(() => {
    const loadContainers = async () => {
      try {
        const data = await containerService.getAll();
        setContainers(data.map(c => c.name));
      } catch (error) {
        console.error('Failed to load containers:', error);
      }
    };
    loadContainers();
  }, []);

  // Containers are now saved directly to Supabase when created/deleted

  // Load data from Supabase when container changes
  useEffect(() => {
    const loadContainerData = async () => {
      try {
        const items = await containerItemService.getByContainer(selectedContainer);
        
        // Helper function to convert file metadata to blob URL
        const convertFileMetadata = (fileMetadata: any) => {
          if (!fileMetadata) return undefined;
          
          // If it's already in the correct format (has url and name)
          if (typeof fileMetadata === 'object' && fileMetadata.url && fileMetadata.name) {
            return fileMetadata;
          }
          
          // If it has base64 data, convert it to blob URL
          if (typeof fileMetadata === 'object' && fileMetadata.data) {
            try {
              // Convert base64 to blob
              const base64Data = fileMetadata.data.split(',')[1] || fileMetadata.data;
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: fileMetadata.type || 'application/pdf' });
              const url = URL.createObjectURL(blob);
              
              return {
                url: url,
                name: fileMetadata.name || 'file'
              };
            } catch (error) {
              console.error('Failed to convert file metadata:', error);
              return undefined;
            }
          }
          
          return undefined;
        };
        
        // Convert Supabase format to app format
        const convertedItems: ContainerItem[] = items.map(item => ({
          id: item.id || 0,
          referenceCode: item.reference_code,
          supplier: item.supplier,
          cbm: item.cbm,
          cartons: item.cartons,
          grossWeight: item.gross_weight,
          productCost: item.product_cost,
          freightCost: item.freight_cost,
          status: item.status,
          awaiting: item.awaiting,
          productionDays: item.production_days,
          productionReady: item.production_ready,
          client: item.client,
          packingList: convertFileMetadata(item.packing_list),
          commercialInvoice: convertFileMetadata(item.commercial_invoice),
          payment: convertFileMetadata(item.payment),
          hbl: convertFileMetadata(item.hbl),
          certificates: convertFileMetadata(item.certificates),
        }));
        setContainerData(convertedItems);
      } catch (error) {
        console.error('Failed to load container data:', error);
        setContainerData([]);
      }
    };
    loadContainerData();
  }, [selectedContainer]);

  // Data is now automatically saved to Supabase on each change
  // Save notification is shown after successful updates

  // Add new row
  const addNewRow = async () => {
    if (isReadOnly) {
      alert('Read-only mode: Changes are not allowed on this deployment.');
      return;
    }
    
    const newItem = {
      container_name: selectedContainer,
      reference_code: '',
      supplier: '',
      cbm: 0,
      cartons: 0,
      gross_weight: 0,
      product_cost: 0,
      freight_cost: 0,
      status: 'Pending' as const,
      awaiting: ['-'],
      production_days: 0,
      production_ready: '',
      client: '',
    };
    
    try {
      const created = await containerItemService.create(newItem);
      const convertedItem: ContainerItem = {
        id: created.id || 0,
        referenceCode: created.reference_code,
        supplier: created.supplier,
        cbm: created.cbm,
        cartons: created.cartons,
        grossWeight: created.gross_weight,
        productCost: created.product_cost,
        freightCost: created.freight_cost,
        status: created.status,
        awaiting: created.awaiting,
        productionDays: created.production_days,
        productionReady: created.production_ready,
        client: created.client,
      };
      setContainerData([...containerData, convertedItem]);
      
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 2000);
    } catch (error) {
      console.error('Failed to add new row:', error);
      alert('Failed to add new row. Please try again.');
    }
  };

  // Add new container
  const addNewContainer = async () => {
    if (isReadOnly) {
      alert('Read-only mode: Changes are not allowed on this deployment.');
      return;
    }
    
    if (newContainerName.trim() && !containers.includes(newContainerName.trim())) {
      const newContainer = newContainerName.trim();
      try {
        await containerService.create(newContainer);
        setContainers([...containers, newContainer]);
        setSelectedContainer(newContainer);
        setContainerData([]); // Start with empty data for new container
        setNewContainerName('');
        setShowAddContainer(false);
        
        setShowSaveNotification(true);
        setTimeout(() => setShowSaveNotification(false), 2000);
      } catch (error) {
        console.error('Failed to create container:', error);
        alert('Failed to create container. Please try again.');
      }
    }
  };

  // Start editing a cell
  const startEditing = (id: number, field: keyof ContainerItem, currentValue: any) => {
    setEditingCell({ id, field });
    setEditValue(String(currentValue));
  };

  // Save edited value
  const saveEdit = async () => {
    if (!editingCell) return;
    
    if (isReadOnly) {
      alert('Read-only mode: Changes are not allowed on this deployment.');
      setEditingCell(null);
      setEditValue('');
      return;
    }
    
    const itemToUpdate = containerData.find(item => item.id === editingCell.id);
    if (!itemToUpdate) return;
    
    const field = editingCell.field;
    let value: any = editValue;
    
    // Convert to appropriate type
    if (['cbm', 'cartons', 'grossWeight', 'productCost', 'freightCost'].includes(field as string)) {
      value = parseFloat(editValue) || 0;
    }
    
    const updatedItem = { ...itemToUpdate, [field]: value };
    
    // Convert to Supabase format
    const supabaseUpdate: any = {};
    const fieldMap: Record<string, string> = {
      referenceCode: 'reference_code',
      grossWeight: 'gross_weight',
      productCost: 'product_cost',
      freightCost: 'freight_cost',
      productionDays: 'production_days',
      productionReady: 'production_ready',
      packingList: 'packing_list',
      commercialInvoice: 'commercial_invoice',
    };
    
    const supabaseField = fieldMap[field as string] || field;
    supabaseUpdate[supabaseField] = value;
    
    try {
      await containerItemService.update(itemToUpdate.id, supabaseUpdate);
      
      setContainerData(containerData.map(item => 
        item.id === editingCell.id ? updatedItem : item
      ));
      
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 2000);
    } catch (error) {
      console.error('Failed to update item:', error);
      alert('Failed to save changes. Please try again.');
    }
    
    setEditingCell(null);
    setEditValue('');
  };

  // Update status
  const updateStatus = async (id: number, status: ContainerItem['status']) => {
    if (isReadOnly) {
      alert('Read-only mode: Changes are not allowed on this deployment.');
      return;
    }
    
    try {
      await containerItemService.update(id, { status });
      setContainerData(containerData.map(item => 
        item.id === id ? { ...item, status } : item
      ));
      
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 2000);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    }
  };


  // Handle file upload
  const handleFileUpload = async (id: number, field: keyof ContainerItem, event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) {
      alert('Read-only mode: Cannot upload files');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      // Store the file object for preview with original name
      const fileUrl = URL.createObjectURL(file);
      const fileData = { url: fileUrl, name: file.name };
      
      // Update local state immediately for preview
      setContainerData(containerData.map(item => 
        item.id === id ? { ...item, [field]: fileData } : item
      ));

      // Convert file to base64 for Supabase storage
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // Map field names to Supabase column names
        const supabaseFieldMap: Record<string, string> = {
          packingList: 'packing_list',
          commercialInvoice: 'commercial_invoice',
          payment: 'payment',
          hbl: 'hbl',
          certificates: 'certificates'
        };
        
        const supabaseField = supabaseFieldMap[field];
        
        // Save to Supabase with file metadata
        const fileMetadata = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64String
        };
        
        await containerItemService.update(id, { 
          [supabaseField]: fileMetadata 
        });
        
        setShowSaveNotification(true);
        setTimeout(() => setShowSaveNotification(false), 2000);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  // Handle file preview
  const handleFilePreview = (fileData: string | { url: string; name: string }, fileName?: string) => {
    if (typeof fileData === 'string') {
      setPreviewModal({
        show: true,
        file: fileData,
        name: fileName || 'File'
      });
    } else {
      setPreviewModal({
        show: true,
        file: fileData.url,
        name: fileData.name
      });
    }
  };


  // Delete row
  const deleteRow = async (id: number) => {
    if (isReadOnly) {
      alert('Read-only mode: Cannot delete items');
      return;
    }

    const item = containerData.find(i => i.id === id);
    const itemDescription = item?.supplier || item?.referenceCode || 'this item';
    
    if (window.confirm(`⚠️ Delete Item?\n\nAre you sure you want to delete "${itemDescription}"?\n\nThis action cannot be undone.`)) {
      try {
        await containerItemService.delete(id);
        setContainerData(containerData.filter(item => item.id !== id));
        setShowSaveNotification(true);
        setTimeout(() => setShowSaveNotification(false), 2000);
      } catch (error) {
        console.error('Failed to delete item:', error);
        alert('Failed to delete item. Please try again.');
      }
    }
  };

  // Delete attachment
  const deleteAttachment = async (id: number, field: keyof ContainerItem) => {
    if (isReadOnly) {
      alert('Read-only mode: Cannot delete attachments');
      return;
    }

    const fieldNames: Record<string, string> = {
      packingList: 'Packing List',
      commercialInvoice: 'Commercial Invoice',
      payment: 'Payment',
      hbl: 'HBL',
      certificates: 'Certificates'
    };
    
    const fieldName = fieldNames[field] || 'attachment';
    
    if (window.confirm(`🗑️ Delete ${fieldName}?\n\nAre you sure you want to delete this ${fieldName.toLowerCase()}?`)) {
      try {
        // Map field names to Supabase column names
        const supabaseFieldMap: Record<string, string> = {
          packingList: 'packing_list',
          commercialInvoice: 'commercial_invoice',
          payment: 'payment',
          hbl: 'hbl',
          certificates: 'certificates'
        };
        
        const supabaseField = supabaseFieldMap[field];
        await containerItemService.update(id, { [supabaseField]: null });
        
        setContainerData(containerData.map(item => 
          item.id === id ? { ...item, [field]: undefined } : item
        ));
        
        setShowSaveNotification(true);
        setTimeout(() => setShowSaveNotification(false), 2000);
      } catch (error) {
        console.error('Failed to delete attachment:', error);
        alert('Failed to delete attachment. Please try again.');
      }
    }
  };

  // Export to Excel with attachments
  const exportToExcel = async () => {
    const exportData = containerData.map(item => ({
      'Reference Code': item.referenceCode,
      'Supplier': item.supplier,
      'CBM': item.cbm,
      'Cartons': item.cartons,
      'Gross Weight': item.grossWeight,
      'Product Cost': item.productCost,
      'Freight Cost': item.freightCost,
      'Awaiting': item.awaiting.join(', '),
      'Production Days': item.productionDays,
      'Production Ready': item.productionReady,
      'Status': item.status,
      'Client': item.client,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, selectedContainer);
    
    // Set zoom to 150%
    worksheet['!zoom'] = { scale: 150 };
    
    // Auto-size columns to fit content
    const maxWidth = 50;
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.min(maxWidth, Math.max(key.length, ...exportData.map(row => String(row[key as keyof typeof row]).length)))
    }));
    worksheet['!cols'] = colWidths;
    
    // Get the range of data
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    const dataEndRow = range.e.r;
    
    // Style cells: Calibri 11pt, borders, alternating rows, bold headers
    for (let row = range.s.r; row <= dataEndRow; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!worksheet[cellAddress]) continue;
        
        // Initialize cell style
        if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
        
        // Base style: Calibri 11pt with thin borders
        worksheet[cellAddress].s = {
          font: {
            name: 'Calibri',
            sz: 11,
            bold: row === 0 // Bold for header row
          },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          },
          alignment: {
            vertical: 'center',
            horizontal: col >= 2 && col <= 6 ? 'right' : 'left' // Right align numbers
          }
        };
        
        // Alternating light blue rows (excluding header)
        if (row > 0 && row % 2 === 0) {
          worksheet[cellAddress].s.fill = {
            fgColor: { rgb: 'DBEEF4' } // Light blue
          };
        }
      }
    }
    
    // Add summary section 3 rows below the data
    const summaryStartRow = dataEndRow + 3;
    
    // Calculate columns for formulas
    const cbmCol = 2; // Column C (0-indexed: A=0, B=1, C=2)
    const productCostCol = 5; // Column F
    
    // Summary Box 1: Total CBM
    const totalCbmLabelCell = XLSX.utils.encode_cell({ r: summaryStartRow, c: 0 });
    const totalCbmValueCell = XLSX.utils.encode_cell({ r: summaryStartRow, c: 1 });
    worksheet[totalCbmLabelCell] = { 
      v: 'Total CBM:', 
      t: 's',
      s: {
        font: { name: 'Calibri', sz: 16, bold: true },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } }, 
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } }, 
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      }
    };
    worksheet[totalCbmValueCell] = { 
      f: `SUM(${XLSX.utils.encode_col(cbmCol)}2:${XLSX.utils.encode_col(cbmCol)}${dataEndRow + 1})`,
      t: 'n',
      z: '0.00',
      s: {
        font: { name: 'Calibri', sz: 16, bold: true, color: { rgb: '0070C0' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } }, 
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } }, 
          right: { style: 'thin', color: { rgb: '000000' } }
        },
        fill: { fgColor: { rgb: 'E7F3FF' } }
      }
    };
    
    // Summary Box 2: Total Cost
    const totalCostLabelCell = XLSX.utils.encode_cell({ r: summaryStartRow + 1, c: 0 });
    const totalCostValueCell = XLSX.utils.encode_cell({ r: summaryStartRow + 1, c: 1 });
    worksheet[totalCostLabelCell] = { 
      v: 'Total Cost:', 
      t: 's',
      s: {
        font: { name: 'Calibri', sz: 16, bold: true },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } }, 
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } }, 
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      }
    };
    worksheet[totalCostValueCell] = { 
      f: `SUM(${XLSX.utils.encode_col(productCostCol)}2:${XLSX.utils.encode_col(productCostCol)}${dataEndRow + 1}) + SUM(${XLSX.utils.encode_col(productCostCol + 1)}2:${XLSX.utils.encode_col(productCostCol + 1)}${dataEndRow + 1})`,
      t: 'n',
      z: '$#,##0',
      s: {
        font: { name: 'Calibri', sz: 16, bold: true, color: { rgb: '00B050' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } }, 
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } }, 
          right: { style: 'thin', color: { rgb: '000000' } }
        },
        fill: { fgColor: { rgb: 'E7FFE7' } }
      }
    };
    
    // Summary Box 3: CBM Ready to Ship
    const readyCbmLabelCell = XLSX.utils.encode_cell({ r: summaryStartRow + 2, c: 0 });
    const readyCbmValueCell = XLSX.utils.encode_cell({ r: summaryStartRow + 2, c: 1 });
    worksheet[readyCbmLabelCell] = { 
      v: 'CBM Ready to Ship:', 
      t: 's',
      s: {
        font: { name: 'Calibri', sz: 16, bold: true },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } }, 
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } }, 
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      }
    };
    worksheet[readyCbmValueCell] = { 
      f: `SUMIF(${XLSX.utils.encode_col(10)}2:${XLSX.utils.encode_col(10)}${dataEndRow + 1},"Ready to Ship",${XLSX.utils.encode_col(cbmCol)}2:${XLSX.utils.encode_col(cbmCol)}${dataEndRow + 1})`,
      t: 'n',
      z: '0.00',
      s: {
        font: { name: 'Calibri', sz: 16, bold: true, color: { rgb: '00B050' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } }, 
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } }, 
          right: { style: 'thin', color: { rgb: '000000' } }
        },
        fill: { fgColor: { rgb: 'E7FFE7' } }
      }
    };
    
    // Update range to include summary boxes
    worksheet['!ref'] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: summaryStartRow + 2, c: range.e.c }
    });
    
    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Check if there are any attachments
    let hasAttachments = false;
    for (const item of containerData) {
      if (item.packingList || item.commercialInvoice || item.payment || item.hbl || item.certificates) {
        hasAttachments = true;
        break;
      }
    }
    
    // If no attachments, just download the Excel file
    if (!hasAttachments) {
      const url = URL.createObjectURL(new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedContainer} CBM & PI.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    
    // If there are attachments, create a zip file
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Add Excel file to zip with new naming format: [CONTAINER NAME] CBM & PI.xlsx
    zip.file(`${selectedContainer} CBM & PI.xlsx`, excelBuffer);
    
    // Add attachments organized by reference code
    for (const item of containerData) {
      if (item.referenceCode) {
        const folderName = item.referenceCode.replace(/[^a-zA-Z0-9]/g, '_');
        const folder = zip.folder(folderName);
        
        // Add each attachment if it exists
        const attachments = [
          { field: 'packingList', name: 'Packing_List' },
          { field: 'commercialInvoice', name: 'Commercial_Invoice' },
          { field: 'payment', name: 'Payment' },
          { field: 'hbl', name: 'HBL' },
          { field: 'certificates', name: 'Certificates' }
        ];
        
        for (const attachment of attachments) {
          const fileData = item[attachment.field as keyof ContainerItem];
          if (fileData) {
            let fileName = '';
            let fileContent: string | ArrayBuffer = '';
            
            if (typeof fileData === 'string') {
              // Handle blob URLs
              if (fileData.startsWith('blob:')) {
                try {
                  const response = await fetch(fileData);
                  const blob = await response.blob();
                  fileContent = await blob.arrayBuffer();
                  fileName = `${attachment.name}.${getFileExtension(blob.type)}`;
                } catch (error) {
                  console.warn(`Could not fetch ${attachment.field} for ${item.referenceCode}:`, error);
                  continue;
                }
              } else {
                // Handle file paths (for demo data)
                fileName = `${attachment.name}.pdf`;
                fileContent = ''; // Skip demo files
              }
            } else if (fileData && typeof fileData === 'object' && 'url' in fileData) {
              // Handle file objects with url and name
              try {
                const response = await fetch(fileData.url);
                const blob = await response.blob();
                fileContent = await blob.arrayBuffer();
                fileName = fileData.name || `${attachment.name}.${getFileExtension(blob.type)}`;
              } catch (error) {
                console.warn(`Could not fetch ${attachment.field} for ${item.referenceCode}:`, error);
                continue;
              }
            }
            
            if (fileContent && fileName) {
              folder?.file(fileName, fileContent);
            }
          }
        }
      }
    }
    
    // Generate and download zip file
    const zipBuffer = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBuffer);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedContainer} CBM & PI.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper function to get file extension from MIME type
  const getFileExtension = (mimeType: string): string => {
    const extensions: { [key: string]: string } = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif'
    };
    return extensions[mimeType] || 'bin';
  };

  // Import from Excel
  const importFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) {
      alert('Read-only mode: Cannot import data');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

        // If replace mode, delete existing items first
        if (importMode === 'replace') {
          for (const item of containerData) {
            await containerItemService.delete(item.id);
          }
        }

        // Create Supabase items from Excel data
        const createdItems: ContainerItem[] = [];
        for (const row of jsonData) {
          const newItem = {
            container_name: selectedContainer,
            reference_code: row['Reference Code'] || row['Ref'] || '',
            supplier: row['Supplier'] || '',
            cbm: parseFloat(row['CBM']) || 0,
            cartons: parseInt(row['Cartons']) || 0,
            gross_weight: parseFloat(row['Gross Weight']) || 0,
            product_cost: parseFloat(row['Product Cost']) || 0,
            freight_cost: parseFloat(row['Freight Cost']) || 0,
            status: row['Status'] || 'Pending' as const,
            awaiting: row['Awaiting'] ? (row['Awaiting'] as string).split(',').map(s => s.trim()) : ['-'],
            production_days: parseInt(row['Production Days']) || 0,
            production_ready: row['Production Ready'] || '',
            client: row['Client'] || '',
          };

          const created = await containerItemService.create(newItem);
          createdItems.push({
            id: created.id || 0,
            referenceCode: created.reference_code,
            supplier: created.supplier,
            cbm: created.cbm,
            cartons: created.cartons,
            grossWeight: created.gross_weight,
            productCost: created.product_cost,
            freightCost: created.freight_cost,
            status: created.status,
            awaiting: created.awaiting,
            productionDays: created.production_days,
            productionReady: created.production_ready,
            client: created.client,
            packingList: created.packing_list,
            commercialInvoice: created.commercial_invoice,
            payment: created.payment,
            hbl: created.hbl,
            certificates: created.certificates,
          });
        }

        // Update local state
        if (importMode === 'replace') {
          setContainerData(createdItems);
        } else {
          setContainerData([...containerData, ...createdItems]);
        }

        setShowImportModal(false);
        setShowSaveNotification(true);
        setTimeout(() => setShowSaveNotification(false), 2000);
        
        if (excelImportRef.current) {
          excelImportRef.current.value = '';
        }
      } catch (error) {
        console.error('Failed to import Excel data:', error);
        alert('Failed to import data. Please try again.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Calculate summary metrics
  const totalCBM = containerData.reduce((sum, item) => sum + item.cbm, 0);
  const totalCartons = containerData.reduce((sum, item) => sum + item.cartons, 0);
  const totalGrossWeight = containerData.reduce((sum, item) => sum + item.grossWeight, 0);
  const cbmReadyToShip = containerData.filter(item => item.status === 'Ready to Ship').reduce((sum, item) => sum + item.cbm, 0);
  const cbmAwaitingSupplier = containerData.filter(item => item.status === 'Awaiting Supplier').reduce((sum, item) => sum + item.cbm, 0);
  const needPaymentCount = containerData.filter(item => item.status === 'Need Payment').length;
  const totalProductCost = containerData.reduce((sum, item) => sum + item.productCost, 0);
  const totalFreightCost = containerData.reduce((sum, item) => sum + item.freightCost, 0);
  const totalCost = totalProductCost + totalFreightCost;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ready to Ship':
        return 'bg-green-500';
      case 'Awaiting Supplier':
        return 'bg-orange-500';
      case 'Need Payment':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 text-center animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Container Planning</h1>
        </div>

        {/* Container Selector & Action Buttons */}
        <div className="mb-8">
          {selectedContainer === 'SUPPLIER LIST' && (
            <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-blue-400">
                <FileText className="w-5 h-5" />
                <span className="font-semibold">SUPPLIER LIST Mode</span>
              </div>
              <p className="text-gray-300 text-sm mt-1">
                📝 TODO: This will show a supplier management table. When entering reference codes in container entries, 
                supplier details (name, product, address, contact info) will auto-fill based on this database.
              </p>
            </div>
          )}
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-lg font-medium text-gray-300">Select Container</span>
            <div className="relative" style={{ width: '50%' }} ref={containerDropdownRef}>
          <button
                onClick={() => setShowContainerDropdown(!showContainerDropdown)}
                className="w-full bg-gradient-to-r from-gray-800 to-gray-700 border-2 border-gray-600 rounded-lg px-6 py-3 flex items-center justify-between hover:border-blue-500 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <span className="text-xl font-bold text-blue-400">{selectedContainer}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
          </button>
              
              {showContainerDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl z-10">
                  {containers.map((container) => (
          <button
                      key={container}
                      onClick={() => {
                        setSelectedContainer(container);
                        setShowContainerDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors ${
                        container === selectedContainer ? 'bg-blue-900/50 font-semibold text-blue-400' : 'text-white'
                      }`}
                    >
                      {container}
          </button>
                  ))}
                  
                  {/* Add New Container Button */}
                  <div className="border-t border-gray-600">
          <button
                      onClick={() => {
                        setShowAddContainer(!showAddContainer);
                        setShowContainerDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors text-green-400 hover:text-green-300 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add New Container
          </button>
                  </div>
                </div>
              )}
            </div>
        </div>

          {/* Import/Export Buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50"
            >
              <Download className="w-5 h-5" />
              Export to Excel
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Import from Excel
            </button>
                  </div>
                  </div>

        {/* Summary Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 animate-slide-up">
          <div className="bg-gray-900 rounded-lg p-5 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 border border-gray-700">
            <div className="text-sm text-white mb-2">CBM</div>
            <div className="text-4xl font-bold text-blue-400">{totalCBM.toFixed(2)}</div>
                  </div>
          <div className="bg-gray-900 rounded-lg p-5 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gray-500/30 border border-gray-700">
            <div className="text-sm text-white mb-2">Cartons</div>
            <div className="text-4xl font-bold text-white">{totalCartons}</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-5 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gray-500/30 border border-gray-700">
            <div className="text-sm text-white mb-2">Gross weight</div>
            <div className="text-4xl font-bold text-white">{totalGrossWeight.toLocaleString('en-US')}</div>
                </div>
              </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 animate-slide-up">
          <div className="bg-gray-900 rounded-lg p-5 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/30 border border-gray-700">
            <div className="text-sm text-white mb-2">CBM Ready to ship</div>
            <div className="text-4xl font-bold text-green-400">{cbmReadyToShip.toFixed(2)}</div>
                  </div>
          <div className="bg-gray-900 rounded-lg p-5 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 border border-gray-700">
            <div className="text-sm text-white mb-2">CBM Awaiting Supplier</div>
            <div className="text-4xl font-bold text-orange-400">{cbmAwaitingSupplier.toFixed(2)}</div>
                  </div>
          <div className="bg-gray-900 rounded-lg p-5 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/30 border border-gray-700">
            <div className="text-sm text-white mb-2">Need Payment</div>
            <div className="text-4xl font-bold text-pink-400">{needPaymentCount}</div>
                  </div>
                </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 animate-slide-up">
          <div className="bg-gray-900 rounded-lg p-5 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/30 border border-gray-700">
            <div className="text-sm text-white mb-2">Product cost</div>
            <div className="text-4xl font-bold text-green-400">${Math.round(totalProductCost).toLocaleString('en-US')}</div>
              </div>
          <div className="bg-gray-900 rounded-lg p-5 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/30 border border-gray-700">
            <div className="text-sm text-white mb-2">Freight cost to forwarder</div>
            <div className="text-4xl font-bold text-pink-400">${Math.round(totalFreightCost).toLocaleString('en-US')}</div>
            </div>
          <div className="bg-gray-900 rounded-lg p-5 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 border border-gray-700">
            <div className="text-sm text-white mb-2">Total product cost</div>
            <div className="text-4xl font-bold text-cyan-400">${Math.round(totalCost).toLocaleString('en-US')}</div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl shadow-2xl border border-gray-600 overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b-2 border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xl font-semibold text-gray-300 uppercase tracking-wider" style={{ minWidth: '80px' }}>Code</th>
                  <th className="px-4 py-3 text-left text-xl font-semibold text-gray-300 uppercase tracking-wider" style={{ minWidth: '280px' }}>Supplier</th>
                  <th className="px-4 py-3 text-right text-xl font-semibold text-gray-300 uppercase tracking-wider" style={{ minWidth: '120px' }}>CBM</th>
                  <th className="px-4 py-3 text-right text-xl font-semibold text-gray-300 uppercase tracking-wider" style={{ minWidth: '100px' }}>Cartons</th>
                  <th className="px-4 py-3 text-right text-xl font-semibold text-gray-300 uppercase tracking-wider" style={{ minWidth: '120px' }}>Gross Weight</th>
                  <th className="px-4 py-3 text-right text-xl font-semibold text-gray-300 uppercase tracking-wider" style={{ minWidth: '120px' }}>Product Cost</th>
                  <th className="px-4 py-3 text-right text-xl font-semibold text-gray-300 uppercase tracking-wider" style={{ minWidth: '120px' }}>Freight Cost</th>
                  <th className="px-4 py-3 text-left text-xl font-semibold text-gray-300 uppercase tracking-wider" style={{ minWidth: '130px' }}>Awaiting</th>
                  <th className="px-4 py-3 text-right text-xl font-semibold text-gray-300 uppercase tracking-wider" style={{ minWidth: '120px' }}>Production Days</th>
                  <th className="px-4 py-3 text-center text-xl font-semibold text-gray-300 uppercase tracking-wider" style={{ minWidth: '140px' }}>Production Ready</th>
                  <th className="px-4 py-3 text-left text-xl font-semibold text-gray-300 uppercase tracking-wider" style={{ minWidth: '140px' }}>Status</th>
                  <th className="px-4 py-3 text-left text-xl font-semibold text-gray-300 uppercase tracking-wider" style={{ minWidth: '150px' }}>Client</th>
                  <th className="px-4 py-3 text-center text-xl font-semibold text-gray-300 uppercase tracking-wider" style={{ minWidth: '80px' }}>PL</th>
                  <th className="px-4 py-3 text-center text-xl font-semibold text-gray-300 uppercase tracking-wider" style={{ minWidth: '80px' }}>CI</th>
                  <th className="px-4 py-3 text-center text-xl font-semibold text-gray-300 uppercase tracking-wider" style={{ minWidth: '80px' }}>Payment</th>
                  <th className="px-4 py-3 text-center text-xl font-semibold text-gray-300 uppercase tracking-wider" style={{ minWidth: '80px' }}>HBL</th>
                  <th className="px-4 py-3 text-center text-xl font-semibold text-gray-300 uppercase tracking-wider" style={{ minWidth: '100px' }}>Certificates</th>
                  <th className="px-4 py-3 text-center text-xl font-semibold text-gray-300 uppercase tracking-wider" style={{ minWidth: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {containerData.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-700 hover:bg-gray-700/50 transition-all duration-200 ${
                      index % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-800/30'
                    }`}
                  >
                    {/* Editable cells */}
                    <td 
                      className="px-4 py-3 text-xl font-medium text-white cursor-pointer hover:bg-blue-900/30"
                      onClick={() => startEditing(item.id, 'referenceCode', item.referenceCode)}
                    >
                      {editingCell?.id === item.id && editingCell?.field === 'referenceCode' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          className="w-full px-2 py-1 bg-gray-700 text-white border border-blue-500 rounded focus:outline-none"
                        />
                      ) : (
                        item.referenceCode || <span className="text-gray-500">Click to edit</span>
                      )}
                    </td>
                    <td 
                      className="px-4 py-3 text-xl text-gray-300 cursor-pointer hover:bg-blue-900/30"
                      onClick={() => startEditing(item.id, 'supplier', item.supplier)}
                    >
                      {editingCell?.id === item.id && editingCell?.field === 'supplier' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          className="w-full px-2 py-1 bg-gray-700 text-white border border-blue-500 rounded focus:outline-none"
                        />
                      ) : (
                        item.supplier || <span className="text-gray-500">Click to edit</span>
                      )}
                    </td>
                    <td 
                      className="px-4 py-3 text-xl text-right cursor-pointer hover:bg-blue-900/30"
                      onClick={() => startEditing(item.id, 'cbm', item.cbm)}
                    >
                      {editingCell?.id === item.id && editingCell?.field === 'cbm' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value.replace(/[^0-9.]/g, ''))}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          className="w-full px-2 py-1 bg-gray-700 text-white border border-blue-500 rounded focus:outline-none text-right"
                          placeholder="0.00"
                        />
                      ) : (
                        <span className="font-semibold text-cyan-400">{item.cbm.toFixed(2)}</span>
                      )}
                    </td>
                    <td 
                      className="px-4 py-3 text-xl text-right text-white cursor-pointer hover:bg-blue-900/30"
                      onClick={() => startEditing(item.id, 'cartons', item.cartons)}
                    >
                      {editingCell?.id === item.id && editingCell?.field === 'cartons' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          className="w-full px-2 py-1 bg-gray-700 text-white border border-blue-500 rounded focus:outline-none text-right"
                          placeholder="0"
                        />
                      ) : (
                        item.cartons
                      )}
                    </td>
                    <td 
                      className="px-4 py-3 text-xl text-right text-white cursor-pointer hover:bg-blue-900/30"
                      onClick={() => startEditing(item.id, 'grossWeight', item.grossWeight)}
                    >
                      {editingCell?.id === item.id && editingCell?.field === 'grossWeight' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          className="w-full px-2 py-1 bg-gray-700 text-white border border-blue-500 rounded focus:outline-none text-right"
                          placeholder="0"
                        />
                      ) : (
                        item.grossWeight.toLocaleString('en-US')
                      )}
                    </td>
                    <td 
                      className="px-4 py-3 text-xl text-right font-medium text-green-400 cursor-pointer hover:bg-blue-900/30"
                      onClick={() => startEditing(item.id, 'productCost', item.productCost)}
                    >
                      {editingCell?.id === item.id && editingCell?.field === 'productCost' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value.replace(/[^0-9.]/g, ''))}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          className="w-full px-2 py-1 bg-gray-700 text-white border border-blue-500 rounded focus:outline-none text-right"
                          placeholder="0.00"
                        />
                      ) : (
                        `$${Math.round(item.productCost).toLocaleString('en-US')}`
                      )}
                    </td>
                    <td 
                      className="px-4 py-3 text-xl text-right text-white cursor-pointer hover:bg-blue-900/30"
                      onClick={() => startEditing(item.id, 'freightCost', item.freightCost)}
                    >
                      {editingCell?.id === item.id && editingCell?.field === 'freightCost' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          className="w-full px-2 py-1 bg-gray-700 text-white border border-blue-500 rounded focus:outline-none text-right"
                          placeholder="0"
                        />
                      ) : (
                        `$${Math.round(item.freightCost).toLocaleString('en-US')}`
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        value={item.awaiting[0] || '-'}
                        onChange={(e) => {
                          const newAwaiting = e.target.value === '-' ? ['-'] : [e.target.value];
                          setContainerData(containerData.map(dataItem => 
                            dataItem.id === item.id ? { ...dataItem, awaiting: newAwaiting } : dataItem
                          ));
                        }}
                        className="text-xl bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="-">-</option>
                        <option value="Payment">Payment</option>
                        <option value="Certificates">Certificates</option>
                        <option value="Documents">Documents</option>
                        <option value="Inspection">Inspection</option>
                        <option value="Customs">Customs</option>
                        <option value="Shipping">Shipping</option>
                      </select>
                    </td>
                    <td 
                      className="px-4 py-3 text-xl text-right text-white cursor-pointer hover:bg-blue-900/30"
                      onClick={() => startEditing(item.id, 'productionDays', item.productionDays)}
                    >
                      {editingCell?.id === item.id && editingCell?.field === 'productionDays' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          className="w-full px-2 py-1 bg-gray-700 text-white border border-blue-500 rounded focus:outline-none text-right"
                          placeholder="0"
                        />
                      ) : (
                        item.productionDays || <span className="text-gray-500">Click to edit</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="date"
                        value={item.productionReady}
                        onChange={(e) => {
                          setContainerData(containerData.map(dataItem => 
                            dataItem.id === item.id ? { ...dataItem, productionReady: e.target.value } : dataItem
                          ));
                        }}
                        className="text-xl bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        value={item.status}
                        onChange={(e) => updateStatus(item.id, e.target.value as ContainerItem['status'])}
                        className={`inline-flex items-center px-3 py-2 rounded-full text-lg font-medium text-white ${getStatusColor(item.status)} cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="Ready to Ship">Ready to Ship</option>
                        <option value="Awaiting Supplier">Awaiting Supplier</option>
                        <option value="Need Payment">Need Payment</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        value={item.client}
                        onChange={(e) => {
                          setContainerData(containerData.map(dataItem => 
                            dataItem.id === item.id ? { ...dataItem, client: e.target.value } : dataItem
                          ));
                        }}
                        className="text-xl bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Client</option>
                        <option value="Pitoulis AE">Pitoulis AE</option>
                        <option value="AgroTech Ltd">AgroTech Ltd</option>
                        <option value="Green Solutions">Green Solutions</option>
                        <option value="FarmPro Inc">FarmPro Inc</option>
                        <option value="Irrigation Plus">Irrigation Plus</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {item.packingList ? (
                          <>
                            <button
                              onClick={() => handleFilePreview(item.packingList!, 'Packing List')}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="View file"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteAttachment(item.id, 'packingList')}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Delete file"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : null}
                        <input
                          type="file"
                          ref={el => fileInputRefs.current[`${item.id}-packingList`] = el}
                          onChange={(e) => handleFileUpload(item.id, 'packingList', e)}
                          className="hidden"
                          accept=".pdf,.xlsx,.xls,.doc,.docx"
                        />
                        <button
                          onClick={() => fileInputRefs.current[`${item.id}-packingList`]?.click()}
                          className="text-gray-500 hover:text-blue-400 transition-colors"
                          title="Upload file"
                        >
                          <Upload className="w-3 h-3" />
                        </button>
                    </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {item.commercialInvoice ? (
                          <>
                            <button
                              onClick={() => handleFilePreview(item.commercialInvoice!, 'Commercial Invoice')}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="View file"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteAttachment(item.id, 'commercialInvoice')}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Delete file"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : null}
                        <input
                          type="file"
                          ref={el => fileInputRefs.current[`${item.id}-commercialInvoice`] = el}
                          onChange={(e) => handleFileUpload(item.id, 'commercialInvoice', e)}
                          className="hidden"
                          accept=".pdf,.xlsx,.xls,.doc,.docx"
                        />
                        <button
                          onClick={() => fileInputRefs.current[`${item.id}-commercialInvoice`]?.click()}
                          className="text-gray-500 hover:text-blue-400 transition-colors"
                          title="Upload file"
                        >
                          <Upload className="w-3 h-3" />
                        </button>
                        </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {item.payment ? (
                          <>
                            <button
                              onClick={() => handleFilePreview(item.payment!, 'Payment')}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="View file"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteAttachment(item.id, 'payment')}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Delete file"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : null}
                        <input
                          type="file"
                          ref={el => fileInputRefs.current[`${item.id}-payment`] = el}
                          onChange={(e) => handleFileUpload(item.id, 'payment', e)}
                          className="hidden"
                          accept=".pdf,.xlsx,.xls,.doc,.docx"
                        />
                        <button
                          onClick={() => fileInputRefs.current[`${item.id}-payment`]?.click()}
                          className="text-gray-500 hover:text-blue-400 transition-colors"
                          title="Upload file"
                        >
                          <Upload className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {item.hbl ? (
                          <>
                            <button
                              onClick={() => handleFilePreview(item.hbl!, 'HBL')}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="View file"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteAttachment(item.id, 'hbl')}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Delete file"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : null}
                        <input
                          type="file"
                          ref={el => fileInputRefs.current[`${item.id}-hbl`] = el}
                          onChange={(e) => handleFileUpload(item.id, 'hbl', e)}
                          className="hidden"
                          accept=".pdf,.xlsx,.xls,.doc,.docx"
                        />
                        <button
                          onClick={() => fileInputRefs.current[`${item.id}-hbl`]?.click()}
                          className="text-gray-500 hover:text-blue-400 transition-colors"
                          title="Upload file"
                        >
                          <Upload className="w-3 h-3" />
                        </button>
                    </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {item.certificates ? (
                          <>
                            <button
                              onClick={() => handleFilePreview(item.certificates!, 'Certificates')}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="View file"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteAttachment(item.id, 'certificates')}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Delete file"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : null}
                        <input
                          type="file"
                          ref={el => fileInputRefs.current[`${item.id}-certificates`] = el}
                          onChange={(e) => handleFileUpload(item.id, 'certificates', e)}
                          className="hidden"
                          accept=".pdf,.xlsx,.xls,.doc,.docx"
                        />
                        <button
                          onClick={() => fileInputRefs.current[`${item.id}-certificates`]?.click()}
                          className="text-gray-500 hover:text-blue-400 transition-colors"
                          title="Upload file"
                        >
                          <Upload className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteRow(item.id)}
                        className="text-red-400 hover:text-red-300 transition-colors transform hover:scale-110"
                        title="Delete row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
                  </div>

          {/* Add New Row Button */}
          <div className="border-t border-gray-700 p-3 bg-gray-800/50">
            <button 
              onClick={addNewRow}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-blue-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add new item
            </button>
                      </div>
                    </div>
      </div>

      {/* Document Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50">
          <div 
            className="bg-white flex flex-col" 
            style={{ 
              position: 'absolute', 
              top: '20px', 
              left: '20px', 
              right: '20px', 
              bottom: '20px',
              width: 'calc(100vw - 40px)',
              height: 'calc(100vh - 40px)'
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">{previewFile.name}</h3>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 bg-gray-50" style={{ height: 'calc(100% - 60px)', overflow: 'auto' }}>
              {previewFile.type === 'pdf' && (
                <iframe
                  src={previewFile.url}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title={previewFile.name}
                />
              )}
              {(previewFile.type === 'excel' || previewFile.type === 'word') && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-700 mb-2">Preview for {previewFile.type === 'excel' ? 'Excel' : 'Word'} files</p>
                    <p className="text-sm text-gray-500 mb-4">{previewFile.name}</p>
                    <a
                      href={previewFile.url}
                      download
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Download File
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl w-full max-w-md border-2 border-gray-600">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-semibold text-white">Import from Excel</h3>
                    </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
                        </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Import Mode
                </label>
                <div className="space-y-3">
                  <label className="flex items-center p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                    <input
                      type="radio"
                      name="importMode"
                      value="add"
                      checked={importMode === 'add'}
                      onChange={(e) => setImportMode(e.target.value as 'add')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-3">
                      <div className="text-white font-medium">Add to existing data</div>
                      <div className="text-sm text-gray-400">Append imported rows to current data</div>
                      </div>
                  </label>
                  <label className="flex items-center p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={(e) => setImportMode(e.target.value as 'replace')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-3">
                      <div className="text-white font-medium">Replace all data</div>
                      <div className="text-sm text-gray-400">Clear existing data and import new</div>
                    </div>
                  </label>
                    </div>
                  </div>

                      <div>
                <input
                  type="file"
                  ref={excelImportRef}
                  onChange={importFromExcel}
                  accept=".xlsx,.xls"
                  className="hidden"
                />
                <button
                  onClick={() => excelImportRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Upload className="w-5 h-5" />
                  Select Excel File
                </button>
                      </div>

              <div className="text-sm text-gray-400 bg-gray-700/30 p-4 rounded-lg">
                <p className="font-semibold text-gray-300 mb-2">Expected columns:</p>
                <p className="text-xs">Reference Code, Supplier, CBM, Cartons, Gross Weight, Product Cost, Freight Cost, Client, Status, Awaiting</p>
                    </div>
            </div>
          </div>
        </div>
      )}

      {/* New Light File Preview Modal */}
      {previewModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50">
          <div 
            className="bg-white flex flex-col" 
            style={{ 
              position: 'absolute', 
              top: '20px', 
              left: '20px', 
              right: '20px', 
              bottom: '20px',
              width: 'calc(100vw - 40px)',
              height: 'calc(100vh - 40px)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                📄 {previewModal.name}
              </h3>
              <button
                onClick={() => setPreviewModal({ show: false, file: null, name: '' })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
                        </div>
            
            {/* Preview Content */}
            <div className="flex-1 bg-gray-50" style={{ height: 'calc(100% - 60px)', overflow: 'auto' }}>
              {previewModal.file && (
                <div className="w-full h-full">
                  {previewModal.name.toLowerCase().includes('pdf') || 
                   (typeof previewModal.file === 'string' && previewModal.file.includes('.pdf')) ? (
                    // PDF Preview
                    <iframe
                      src={previewModal.file}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      title={`Preview of ${previewModal.name}`}
                    />
                  ) : previewModal.name.toLowerCase().includes('excel') || 
                    previewModal.name.toLowerCase().includes('xlsx') || 
                    previewModal.name.toLowerCase().includes('xls') ||
                    (typeof previewModal.file === 'string' && 
                     (previewModal.file.includes('.xlsx') || previewModal.file.includes('.xls'))) ? (
                    // Excel Preview (fallback to download link)
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <FileSpreadsheet className="w-16 h-16 text-green-500 mb-4" />
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">Excel File</h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 max-w-md">
                        <div className="flex items-start gap-2">
                          <div className="text-yellow-600 text-lg">⚠️</div>
                          <div className="text-sm text-yellow-800">
                            <p className="font-semibold mb-1">Excel with Images Detected</p>
                            <p>This Excel file may contain inline images that cannot be previewed in the browser. Download to view all content including embedded images.</p>
                      </div>
                    </div>
                  </div>
                      <div className="space-y-2">
                      <a
                        href={previewModal.file || '#'}
                        download={previewModal.name}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                      >
                        📥 Download {previewModal.name}
                      </a>
                        <div className="text-xs text-gray-500">
                          💡 Tip: Open in Excel to see inline images
                </div>
              </div>
            </div>
                  ) : previewModal.name.toLowerCase().includes('word') || 
                    previewModal.name.toLowerCase().includes('docx') || 
                    previewModal.name.toLowerCase().includes('doc') ||
                    (typeof previewModal.file === 'string' && 
                     (previewModal.file.includes('.docx') || previewModal.file.includes('.doc'))) ? (
                    // Word Preview (fallback to download link)
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <FileText className="w-16 h-16 text-blue-500 mb-4" />
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">Word Document</h4>
                      <p className="text-gray-600 mb-4">Word documents cannot be previewed in browser</p>
                      <a
                        href={previewModal.file || '#'}
                        download={previewModal.name}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        📥 Download {previewModal.name}
                      </a>
                    </div>
                  ) : previewModal.name.toLowerCase().includes('image') || 
                    previewModal.name.toLowerCase().includes('jpg') || 
                    previewModal.name.toLowerCase().includes('jpeg') || 
                    previewModal.name.toLowerCase().includes('png') || 
                    previewModal.name.toLowerCase().includes('gif') ||
                    (typeof previewModal.file === 'string' && 
                     (previewModal.file.includes('.jpg') || previewModal.file.includes('.jpeg') || 
                      previewModal.file.includes('.png') || previewModal.file.includes('.gif'))) ? (
                    // Image Preview
                    <div className="flex items-center justify-center h-full">
                      <img
                        src={previewModal.file}
                        alt={`Preview of ${previewModal.name}`}
                        className="max-w-full max-h-full object-contain rounded"
                      />
                    </div>
                  ) : (
                    // Generic file preview
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <FileText className="w-16 h-16 text-gray-500 mb-4" />
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">{previewModal.name}</h4>
                      <p className="text-gray-600 mb-4">File preview not available</p>
                      <a
                        href={previewModal.file || '#'}
                        download={previewModal.name}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        📥 Download {previewModal.name}
                      </a>
            </div>
          )}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  💡 Tip: PDF files can be viewed directly. Other files can be downloaded.
              </div>
                <button
                  onClick={() => setPreviewModal({ show: false, file: null, name: '' })}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Container Modal */}
      {showAddContainer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl w-full max-w-md border-2 border-gray-600">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <Plus className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-semibold text-white">Add New Container</h3>
                  </div>
              <button
                onClick={() => setShowAddContainer(false)}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
                  </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Container Name
                </label>
                <input
                  type="text"
                  value={newContainerName}
                  onChange={(e) => setNewContainerName(e.target.value)}
                  placeholder="e.g., I120.15, I125.8"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && addNewContainer()}
                />
                <div className="mt-2 text-xs text-gray-400">
                  💡 Use your container naming convention (e.g., I110 SOUTH, I269.1)
                  </div>
                </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={addNewContainer}
                  disabled={!newContainerName.trim() || containers.includes(newContainerName.trim())}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  ➕ Create Container
                </button>
                <button
                  onClick={() => setShowAddContainer(false)}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
              
              {newContainerName.trim() && containers.includes(newContainerName.trim()) && (
                <div className="bg-red-900/30 border border-red-500 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">⚠️</span>
                    <span className="text-red-300 text-sm">
                      Container "{newContainerName}" already exists
                    </span>
              </div>
            </div>
          )}
        </div>
      </div>
        </div>
      )}

      {/* Auto-save Notification */}
      {showSaveNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">💾 Auto-saved to browser</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
