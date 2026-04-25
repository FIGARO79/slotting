import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw,
  Download
} from 'lucide-react';

const InventoryList = () => {
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/master-items?limit=250&search=${searchTerm}`);
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchInventory();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in pb-10">
      
      <div className="flex justify-between items-center border-b border-black pb-4">
        <div>
          <h1>Inventario</h1>
          <p>Maestro de articulos con stock activo</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Buscar SKU..." 
              className="w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={fetchInventory} title="Refrescar">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button className="flex items-center gap-2">
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      <div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-black">
              <th className="py-2">Item Code</th>
              <th className="py-2">Description</th>
              <th className="py-2 text-center">Bin 1</th>
              <th className="py-2 text-center">Add. Bin</th>
              <th className="py-2 text-right">Physical</th>
              <th className="py-2 text-right">Frozen</th>
              <th className="py-2 text-center">SIC</th>
              <th className="py-2 text-center">ABC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="py-10 text-center">Cargando datos...</td>
              </tr>
            ) : (
              inventory.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2">{row.item_code}</td>
                  <td className="py-2 max-w-[300px] truncate">{row.description}</td>
                  <td className="py-2 text-center">{row.bin_1 || '---'}</td>
                  <td className="py-2 text-center">{row.additional_bin || '---'}</td>
                  <td className="py-2 text-right">{row.physical_qty.toLocaleString()}</td>
                  <td className="py-2 text-right">{row.frozen_qty > 0 ? row.frozen_qty.toLocaleString() : '-'}</td>
                  <td className="py-2 text-center">{row.sic_code || '0'}</td>
                  <td className="py-2 text-center">{row.abc_code || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryList;
