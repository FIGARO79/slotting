import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  RefreshCw,
  AlertTriangle,
  Download,
  Info
} from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';

const InventoryList = () => {
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/master-items?limit=250&search=${searchTerm}`);
      if (!response.ok) throw new Error('Error al cargar el inventario');
      const data = await response.json();
      setInventory(data);
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor. Verifica que el backend esté corriendo.");
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

  const getRotationColor = (sic) => {
    if (['W', 'X', 'Y'].includes(sic)) return 'bg-orange-100 text-orange-700';
    if (['K', 'L', 'Z'].includes(sic)) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario Maestro (AURRS 250)</h1>
          <p className="text-gray-500 text-sm mt-1">Visualización completa de SKUs con stock físico activo.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar SKU o descripción..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchInventory}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors" 
            title="Sincronizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Data Table Card */}
      <Card>
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Item Code</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Bin 1</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Add. Bin</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Physical Qty</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Frozen Qty</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">SIC</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">ABC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 relative">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-20 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-gray-400 mt-2 text-sm">Cargando datos maestros...</p>
                  </td>
                </tr>
              ) : (
                inventory.map((row, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group border-l-2 border-transparent hover:border-indigo-500">
                    <td className="py-3 px-4 text-sm font-bold text-gray-900">{row.item_code}</td>
                    <td className="py-3 px-4 text-xs text-gray-600 max-w-[200px] truncate" title={row.description}>
                      {row.description}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200">
                        {row.bin_1 || '---'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {row.additional_bin || '---'}
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-gray-800 text-right">
                      {row.physical_qty.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-blue-600 font-medium text-right">
                      {row.frozen_qty > 0 ? row.frozen_qty.toLocaleString() : '0'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getRotationColor(row.sic_code)}`}>
                        {row.sic_code || '0'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {row.abc_code || '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {!loading && inventory.length === 0 && (
            <div className="py-20 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-200 mb-3" />
              <p className="font-medium">No se encontraron resultados.</p>
            </div>
          )}
        </div>
        
        {/* Footer info */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          <div className="flex gap-4">
             <span>Items en vista: {inventory.length}</span>
             <span className="text-gray-300">|</span>
             <span>Fuente: AURRSGLBD0250.csv</span>
          </div>
          <div className="flex items-center gap-2">
            <Info className="w-3 h-3" />
            <span>Frozen Qty indica stock bloqueado por calidad o auditoría.</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InventoryList;
