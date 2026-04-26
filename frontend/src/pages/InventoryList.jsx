import React, { useState, useEffect } from 'react';
import * as Icons from '../components/Icons';
import { 
  Search, 
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';

const InventoryList = () => {
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/slotting/master-items?limit=250&search=${searchTerm}`);
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
    <div className="max-w-[1400px] mx-auto px-6 pt-3 pb-6 font-sans bg-[#fcfcfc] min-h-screen text-black antialiased">
      
      {/* Header Técnico */}
      <div className="flex justify-between items-center mb-6 border-b border-zinc-200 pb-4">
        <div className="flex flex-col gap-0">
          <h1 className="text-base font-normal tracking-tight text-black uppercase">Maestro de Inventario Físico</h1>
          <p className="text-[8px] uppercase tracking-widest font-normal leading-none mt-0.5 text-zinc-400">Artículos con Stock Activo y Ubicaciones de Almacenamiento</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-zinc-400" />
            </div>
            <input 
              type="text" 
              placeholder="BUSCAR CÓDIGO / DESCRIPCIÓN..." 
              className="h-8 pl-9 pr-4 text-[10px] placeholder:text-[10px] font-normal border border-zinc-300 rounded focus:ring-1 focus:ring-black outline-none transition-all uppercase w-64 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchInventory} 
            className="h-8 px-3 bg-white border border-zinc-300 text-black hover:bg-zinc-50 transition-colors rounded flex items-center gap-2 text-[10px] uppercase font-normal shadow-sm"
            title="Refrescar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="h-8 px-4 bg-black text-white hover:bg-zinc-800 transition-colors rounded flex items-center gap-2 text-[10px] uppercase font-normal shadow-sm">
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
        </div>
      </div>

      <div className="bg-white rounded border border-zinc-200 overflow-hidden flex flex-col h-[calc(100vh-180px)]">
        <div className="bg-zinc-50 px-4 py-1.5 border-b border-zinc-200 flex justify-between items-center">
            <span className="text-[10px] text-black font-normal uppercase tracking-tight">
                {loading ? 'Sincronizando...' : `${inventory.length} registros cargados`}
            </span>
            <div className="flex items-center gap-2">
                <span className="w-1 h-1 bg-black"></span>
                <span className="text-[9px] text-zinc-400 uppercase font-normal">Base de Datos: Master_Items</span>
            </div>
        </div>

        <div className="overflow-auto flex-1 no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-100 sticky top-0 z-10 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-2 text-[10px] font-normal text-black uppercase tracking-wider">Código</th>
                <th className="px-4 py-2 text-[10px] font-normal text-black uppercase tracking-wider">Descripción</th>
                <th className="px-4 py-2 text-[10px] font-normal text-black uppercase tracking-wider text-center">Bin 1</th>
                <th className="px-4 py-2 text-[10px] font-normal text-black uppercase tracking-wider text-center">Add. Bin</th>
                <th className="px-4 py-2 text-[10px] font-normal text-black uppercase tracking-wider text-right">Físico</th>
                <th className="px-4 py-2 text-[10px] font-normal text-black uppercase tracking-wider text-right">Congelado</th>
                <th className="px-4 py-2 text-[10px] font-normal text-black uppercase tracking-wider text-center">SIC</th>
                <th className="px-4 py-2 text-[10px] font-normal text-black uppercase tracking-wider text-center">ABC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading && inventory.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-black" />
                      <span className="text-[11px] font-normal uppercase italic tracking-widest text-zinc-400">Cargando datos maestros...</span>
                    </div>
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="w-8 h-8 text-zinc-100" />
                      <span className="text-[10px] uppercase tracking-widest font-normal text-zinc-400">No se encontraron artículos</span>
                    </div>
                  </td>
                </tr>
              ) : (
                inventory.map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50 transition-colors leading-none group">
                    <td className="px-4 py-2.5 font-mono text-[11px] font-normal text-black uppercase tracking-tight">{row.item_code}</td>
                    <td className="px-4 py-2.5 text-zinc-600 text-[10px] uppercase font-normal max-w-[300px] truncate" title={row.description}>{row.description}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-normal ${row.bin_1 ? 'text-black bg-zinc-100' : 'text-zinc-200'}`}>
                        {row.bin_1 || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-normal ${row.additional_bin ? 'text-zinc-600 bg-zinc-50 border border-zinc-100' : 'text-zinc-200'}`}>
                        {row.additional_bin || '---'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-normal text-black text-[11px]">{row.physical_qty.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-normal text-[11px]">
                      {row.frozen_qty > 0 ? (
                         <span className="text-red-600">{row.frozen_qty.toLocaleString()}</span>
                      ) : (
                        <span className="text-zinc-200">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-normal ${row.sic_code ? 'text-white bg-black' : 'text-zinc-200'}`}>
                        {row.sic_code || '0'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-normal ${row.abc_code ? 'text-black bg-zinc-100 border border-zinc-200' : 'text-zinc-200'}`}>
                        {row.abc_code || '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && inventory.length > 0 && (
          <div className="bg-zinc-50 border-t border-zinc-100 px-4 py-1.5 flex justify-between items-center text-[9px] text-zinc-400 uppercase tracking-widest italic font-normal">
            <span>Resultados limitados a 250 registros para optimización de vista</span>
            <span>Desplace para ver más</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryList;
