import { useState, useRef } from 'react';
import { ChevronDown, FileText, Eye, Plus, X, Upload } from 'lucide-react';

interface ContainerItem {
  id: number;
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
  packingList?: string;
  commercialInvoice?: string;
  payment?: string;
  hbl?: string;
  certificates?: string;
}

type EditingCell = {
  id: number;
  field: keyof ContainerItem;
} | null;

function App() {
  const [selectedContainer, setSelectedContainer] = useState('I110.11');
  const [showContainerDropdown, setShowContainerDropdown] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ type: string; url: string; name: string } | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editValue, setEditValue] = useState<string>('');
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const containers = ['I110.11', 'I110.9', 'I112.5', 'I115.3'];

  const initialData: ContainerItem[] = [
    {
      id: 1,
      referenceCode: 'I112',
      supplier: 'Shandong HYRT Water-S...',
      product: 'Irrigation',
      cbm: 10.5,
      cartons: 19,
      grossWeight: 292701,
      productCost: 6266.9,
      freightCost: 0,
      client: 'Pitoulis AE',
      status: 'Ready to Ship',
      awaiting: '-',
      packingList: '/miktoyear.xlsx',
      commercialInvoice: '/miktoyear.xlsx',
    },
    {
      id: 2,
      referenceCode: 'I248',
      supplier: 'Foshan Jiasu Building Ma...',
      product: 'Outdoor Furniture',
      cbm: 13.0,
      cartons: 72,
      grossWeight: 1261,
      productCost: 7138.0,
      freightCost: 450,
      client: 'Alpha Max Holdings',
      status: 'Ready to Ship',
      awaiting: '-',
      commercialInvoice: '/miktoyear.xlsx',
    },
    {
      id: 3,
      referenceCode: 'I258',
      supplier: 'Chaozhou Shangcai Cera...',
      product: 'SouthVilla Bath',
      cbm: 25.0,
      cartons: 0,
      grossWeight: 0,
      productCost: 12110.0,
      freightCost: 800,
      client: 'Tzimas Constructions',
      status: 'Awaiting Supplier',
      awaiting: 'Payment',
      hbl: '/miktoyear.xlsx',
    },
    {
      id: 4,
      referenceCode: 'I107',
      supplier: '1stshine Industrial Compa...',
      product: 'Ceiling Fans',
      cbm: 6.67,
      cartons: 120,
      grossWeight: 840,
      productCost: 9495.5,
      freightCost: 350,
      client: 'Frank Wilemsen',
      status: 'Ready to Ship',
      awaiting: 'Certificates',
      packingList: '/miktoyear.xlsx',
      certificates: '/miktoyear.xlsx',
    },
    {
      id: 5,
      referenceCode: 'I165',
      supplier: 'Jiangmen Mega Casa Co....',
      product: 'Shower Column',
      cbm: 7.0,
      cartons: 67,
      grossWeight: 1133,
      productCost: 14867.2,
      freightCost: 420,
      client: 'Lodora Residences',
      status: 'Ready to Ship',
      awaiting: '-',
      payment: '/miktoyear.xlsx',
    },
    {
      id: 6,
      referenceCode: 'I124',
      supplier: 'Sunda Hardware Produce...',
      product: 'Door Stops',
      cbm: 0.1,
      cartons: 6,
      grossWeight: 745,
      productCost: 593.0,
      freightCost: 50,
      client: 'Esso Mandel AE',
      status: 'Ready to Ship',
      awaiting: '-',
    },
    {
      id: 7,
      referenceCode: 'I261',
      supplier: 'Weihai Bluebay Outdoor ...',
      product: 'Sup Board',
      cbm: 0.8,
      cartons: 10,
      grossWeight: 150,
      productCost: 1250.0,
      freightCost: 100,
      client: 'Spijkers',
      status: 'Ready to Ship',
      awaiting: '-',
    },
    {
      id: 8,
      referenceCode: 'I264',
      supplier: 'GuangZhou Flishel (Freez...',
      product: 'Flishel Refrigeration',
      cbm: 5.5,
      cartons: 0,
      grossWeight: 0,
      productCost: 2150.0,
      freightCost: 0,
      client: 'Medlicott IKE',
      status: 'Need Payment',
      awaiting: 'Payment',
    },
  ];

  const [containerData, setContainerData] = useState<ContainerItem[]>(initialData);

  // Add new row
  const addNewRow = () => {
    const newId = Math.max(...containerData.map(item => item.id), 0) + 1;
    const newItem: ContainerItem = {
      id: newId,
      referenceCode: '',
      supplier: '',
      product: '',
      cbm: 0,
      cartons: 0,
      grossWeight: 0,
      productCost: 0,
      freightCost: 0,
      client: '',
      status: 'Pending',
      awaiting: '-',
    };
    setContainerData([...containerData, newItem]);
  };

  // Start editing a cell
  const startEditing = (id: number, field: keyof ContainerItem, currentValue: any) => {
    setEditingCell({ id, field });
    setEditValue(String(currentValue));
  };

  // Save edited value
  const saveEdit = () => {
    if (!editingCell) return;
    
    setContainerData(containerData.map(item => {
      if (item.id === editingCell.id) {
        const field = editingCell.field;
        let value: any = editValue;
        
        // Convert to appropriate type
        if (['cbm', 'cartons', 'grossWeight', 'productCost', 'freightCost'].includes(field as string)) {
          value = parseFloat(editValue) || 0;
        }
        
        return { ...item, [field]: value };
      }
      return item;
    }));
    
    setEditingCell(null);
    setEditValue('');
  };

  // Update status
  const updateStatus = (id: number, status: ContainerItem['status']) => {
    setContainerData(containerData.map(item => 
      item.id === id ? { ...item, status } : item
    ));
  };

  // Update awaiting field
  const updateAwaiting = (id: number, awaiting: string) => {
    setContainerData(containerData.map(item => 
      item.id === id ? { ...item, awaiting } : item
    ));
  };

  // Handle file upload
  const handleFileUpload = (id: number, field: keyof ContainerItem, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // In a real app, you'd upload to a server. For demo, we'll create a local URL
    const fileUrl = URL.createObjectURL(file);
    
    setContainerData(containerData.map(item => 
      item.id === id ? { ...item, [field]: fileUrl } : item
    ));
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

  const openPreview = (url: string, name: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    let type = 'excel';
    if (extension === 'pdf') type = 'pdf';
    else if (extension === 'doc' || extension === 'docx') type = 'word';
    setPreviewFile({ type, url, name });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Container Planning</h1>
          
          {/* Container Selector */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-lg font-medium text-gray-700">Select Container</span>
            <div className="relative" style={{ width: '50%' }}>
              <button
                onClick={() => setShowContainerDropdown(!showContainerDropdown)}
                className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between hover:border-blue-500 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-900">{selectedContainer}</span>
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </button>
              
              {showContainerDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {containers.map((container) => (
                    <button
                      key={container}
                      onClick={() => {
                        setSelectedContainer(container);
                        setShowContainerDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                        container === selectedContainer ? 'bg-blue-100 font-semibold' : ''
                      }`}
                    >
                      {container}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-100 rounded-lg p-5 border border-blue-200">
              <div className="text-sm text-gray-700 mb-1">CBM</div>
              <div className="text-4xl font-bold text-gray-900">{totalCBM.toFixed(2)}</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-5 border border-gray-200">
              <div className="text-sm text-gray-700 mb-1">Cartons</div>
              <div className="text-4xl font-bold text-gray-900">{totalCartons}</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-5 border border-gray-200">
              <div className="text-sm text-gray-700 mb-1">Gross weight</div>
              <div className="text-4xl font-bold text-gray-900">{totalGrossWeight.toLocaleString('en-US')}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-100 rounded-lg p-5 border border-green-200">
              <div className="text-sm text-gray-700 mb-1">CBM Ready to ship</div>
              <div className="text-4xl font-bold text-gray-900">{cbmReadyToShip.toFixed(2)}</div>
            </div>
            <div className="bg-orange-100 rounded-lg p-5 border border-orange-200">
              <div className="text-sm text-gray-700 mb-1">CBM Awaiting Supplier</div>
              <div className="text-4xl font-bold text-gray-900">{cbmAwaitingSupplier.toFixed(2)}</div>
            </div>
            <div className="bg-pink-100 rounded-lg p-5 border border-pink-200">
              <div className="text-sm text-gray-700 mb-1">Need Payment</div>
              <div className="text-4xl font-bold text-gray-900">{needPaymentCount}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-5 border-2 border-gray-200">
              <div className="text-sm text-green-700 font-semibold mb-1">Product cost</div>
              <div className="text-3xl font-bold text-green-700">${totalProductCost.toLocaleString('en-US', { minimumFractionDigits: 1 })}</div>
            </div>
            <div className="bg-white rounded-lg p-5 border-2 border-gray-200">
              <div className="text-sm text-pink-600 font-semibold mb-1">Freight cost to forwarder</div>
              <div className="text-3xl font-bold text-pink-600">${totalFreightCost.toLocaleString('en-US')}</div>
            </div>
            <div className="bg-white rounded-lg p-5 border-2 border-gray-200">
              <div className="text-sm text-blue-600 font-semibold mb-1">Total product cost</div>
              <div className="text-3xl font-bold text-blue-600">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 1 })}</div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ref</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">CBM</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cartons</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Gross Weight</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Freight Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Awaiting</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">PL</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">CI</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">HBL</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Certificates</th>
                </tr>
              </thead>
              <tbody>
                {containerData.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    {/* Editable cells */}
                    <td 
                      className="px-4 py-3 text-sm font-medium text-gray-900 cursor-pointer hover:bg-blue-50"
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
                          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none"
                        />
                      ) : (
                        item.referenceCode || <span className="text-gray-400">Click to edit</span>
                      )}
                    </td>
                    <td 
                      className="px-4 py-3 text-sm text-gray-700 cursor-pointer hover:bg-blue-50"
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
                          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none"
                        />
                      ) : (
                        item.supplier || <span className="text-gray-400">Click to edit</span>
                      )}
                    </td>
                    <td 
                      className="px-4 py-3 text-sm text-gray-700 cursor-pointer hover:bg-blue-50"
                      onClick={() => startEditing(item.id, 'product', item.product)}
                    >
                      {editingCell?.id === item.id && editingCell?.field === 'product' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none"
                        />
                      ) : (
                        item.product || <span className="text-gray-400">Click to edit</span>
                      )}
                    </td>
                    <td 
                      className="px-4 py-3 text-sm text-right text-gray-900 cursor-pointer hover:bg-blue-50"
                      onClick={() => startEditing(item.id, 'cbm', item.cbm)}
                    >
                      {editingCell?.id === item.id && editingCell?.field === 'cbm' ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none text-right"
                        />
                      ) : (
                        item.cbm.toFixed(2)
                      )}
                    </td>
                    <td 
                      className="px-4 py-3 text-sm text-right text-gray-900 cursor-pointer hover:bg-blue-50"
                      onClick={() => startEditing(item.id, 'cartons', item.cartons)}
                    >
                      {editingCell?.id === item.id && editingCell?.field === 'cartons' ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none text-right"
                        />
                      ) : (
                        item.cartons
                      )}
                    </td>
                    <td 
                      className="px-4 py-3 text-sm text-right text-gray-900 cursor-pointer hover:bg-blue-50"
                      onClick={() => startEditing(item.id, 'grossWeight', item.grossWeight)}
                    >
                      {editingCell?.id === item.id && editingCell?.field === 'grossWeight' ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none text-right"
                        />
                      ) : (
                        item.grossWeight.toLocaleString('en-US')
                      )}
                    </td>
                    <td 
                      className="px-4 py-3 text-sm text-right font-medium text-gray-900 cursor-pointer hover:bg-blue-50"
                      onClick={() => startEditing(item.id, 'productCost', item.productCost)}
                    >
                      {editingCell?.id === item.id && editingCell?.field === 'productCost' ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none text-right"
                        />
                      ) : (
                        `$${item.productCost.toLocaleString('en-US', { minimumFractionDigits: 1 })}`
                      )}
                    </td>
                    <td 
                      className="px-4 py-3 text-sm text-right text-gray-900 cursor-pointer hover:bg-blue-50"
                      onClick={() => startEditing(item.id, 'freightCost', item.freightCost)}
                    >
                      {editingCell?.id === item.id && editingCell?.field === 'freightCost' ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none text-right"
                        />
                      ) : (
                        `$${item.freightCost}`
                      )}
                    </td>
                    <td 
                      className="px-4 py-3 text-sm text-gray-700 cursor-pointer hover:bg-blue-50"
                      onClick={() => startEditing(item.id, 'client', item.client)}
                    >
                      {editingCell?.id === item.id && editingCell?.field === 'client' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none"
                        />
                      ) : (
                        item.client || <span className="text-gray-400">Click to edit</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        value={item.status}
                        onChange={(e) => updateStatus(item.id, e.target.value as ContainerItem['status'])}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(item.status)} cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="Ready to Ship">Ready to Ship</option>
                        <option value="Awaiting Supplier">Awaiting Supplier</option>
                        <option value="Need Payment">Need Payment</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        value={item.awaiting}
                        onChange={(e) => updateAwaiting(item.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="-">-</option>
                        <option value="Payment">Payment</option>
                        <option value="Certificates">Certificates</option>
                        <option value="Documents">Documents</option>
                        <option value="Inspection">Inspection</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {item.packingList ? (
                          <button
                            onClick={() => openPreview(item.packingList!, 'Packing List')}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View file"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
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
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Upload file"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {item.commercialInvoice ? (
                          <button
                            onClick={() => openPreview(item.commercialInvoice!, 'Commercial Invoice')}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View file"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
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
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Upload file"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {item.payment ? (
                          <button
                            onClick={() => openPreview(item.payment!, 'Payment')}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View file"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
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
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Upload file"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {item.hbl ? (
                          <button
                            onClick={() => openPreview(item.hbl!, 'HBL')}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View file"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
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
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Upload file"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {item.certificates ? (
                          <button
                            onClick={() => openPreview(item.certificates!, 'Certificates')}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View file"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
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
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Upload file"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add New Row Button */}
          <div className="border-t border-gray-200 p-3">
            <button 
              onClick={addNewRow}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add new item
            </button>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
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
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              {previewFile.type === 'pdf' && (
                <iframe
                  src={previewFile.url}
                  className="w-full h-full border-0"
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
    </div>
  );
}

export default App;
