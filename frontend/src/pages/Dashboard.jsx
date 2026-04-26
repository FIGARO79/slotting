import React, { useState, useEffect } from 'react';
import * as Icons from '../components/Icons';
import { 
  BarChart, 
  Box, 
  Layers, 
  TrendingUp, 
  AlertCircle,
  Map,
  PackageCheck
} from 'lucide-react';

const ProgressBar = ({ label, value, max = 100, format = "%" }) => {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  
  let barColor = "bg-black";
  if (percentage > 90) barColor = "bg-red-600";

  return (
    <div className="mb-4">
      <div className="flex justify-between items-end mb-1">
        <span className="text-[10px] font-normal text-black uppercase tracking-tight">{label}</span>
        <span className="text-[10px] font-mono font-normal text-black">{value.toLocaleString()}{format === '%' ? '%' : ` ${format}`}</span>
      </div>
      <div className="w-full bg-zinc-100 rounded-full h-1 overflow-hidden">
        <div 
          className={`${barColor} h-full transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOccupancy = async () => {
      try {
        const res = await fetch('/api/slotting/occupancy');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Error fetching occupancy data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOccupancy();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fcfcfc] antialiased">
        <div className="text-black text-[11px] font-normal uppercase italic tracking-widest animate-pulse">Sincronizando...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#fcfcfc] text-black gap-4 antialiased">
        <AlertCircle className="w-8 h-8 text-zinc-300" />
        <p className="text-[10px] uppercase tracking-widest font-normal">No se pudo cargar la información del panel.</p>
      </div>
    );
  }

  const { summary, zones, analytics } = data;

  return (
    <div className="max-w-[1400px] mx-auto px-6 pt-3 pb-6 font-sans bg-[#fcfcfc] min-h-screen text-black antialiased">
      {/* Header Técnico */}
      <div className="flex justify-between items-center mb-6 border-b border-zinc-200 pb-4">
        <div className="flex flex-col gap-0">
          <h1 className="text-base font-normal tracking-tight text-black uppercase">Panel de Control Operativo</h1>
          <p className="text-[8px] uppercase tracking-widest font-normal leading-none mt-0.5 text-zinc-400">Métricas de Ocupación y Rendimiento del Almacén</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded text-[10px] font-mono text-black border border-zinc-200 uppercase font-normal">
            STATUS: ONLINE
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Ocupación Total */}
             <div className="bg-white p-6 rounded border border-zinc-200">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest font-normal text-zinc-400">Ocupación Total</span>
                        <span className="text-2xl font-mono font-normal text-black leading-tight">{summary.occupancy_pct}%</span>
                    </div>
                    <BarChart className="w-4 h-4 text-zinc-300" />
                </div>
                <div className="pt-2 border-t border-zinc-50">
                    <p className="text-[9px] text-zinc-400 uppercase tracking-tight">{summary.filled_bins} de {summary.total_bins} ubicaciones en uso</p>
                </div>
             </div>

             {/* Total SKUs */}
             <div className="bg-white p-6 rounded border border-zinc-200">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest font-normal text-zinc-400">Total SKUs Ubicados</span>
                        <span className="text-2xl font-mono font-normal text-black leading-tight">{summary.total_items.toLocaleString()}</span>
                    </div>
                    <Layers className="w-4 h-4 text-zinc-300" />
                </div>
                <div className="pt-2 border-t border-zinc-50">
                    <p className="text-[9px] text-zinc-400 uppercase tracking-tight">Artículos asignados a bins maestros</p>
                </div>
             </div>

             {/* Promedio SKU/Bin */}
             <div className="bg-white p-6 rounded border border-zinc-200">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest font-normal text-zinc-400">Promedio SKU / Bin</span>
                        <span className="text-2xl font-mono font-normal text-black leading-tight">{summary.avg_items_per_bin}</span>
                    </div>
                    <TrendingUp className="w-4 h-4 text-zinc-300" />
                </div>
                <div className="pt-2 border-t border-zinc-50">
                    <p className="text-[9px] text-zinc-400 uppercase tracking-tight">Densidad en ubicaciones ocupadas</p>
                </div>
             </div>

             {/* Bins Disponibles */}
             <div className="bg-white p-6 rounded border border-zinc-200">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest font-normal text-zinc-400">Bins Disponibles</span>
                        <span className="text-2xl font-mono font-normal text-black leading-tight">{summary.available_bins.toLocaleString()}</span>
                    </div>
                    <Box className="w-4 h-4 text-zinc-300" />
                </div>
                <div className="pt-2 border-t border-zinc-50">
                    <p className="text-[9px] text-zinc-400 uppercase tracking-tight">Ubicaciones vacías listas para uso</p>
                </div>
             </div>
          </div>

          {/* Zones Section */}
          <div className="bg-white rounded border border-zinc-200 overflow-hidden flex flex-col">
            <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex items-center gap-2">
                <Map className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[10px] text-black font-normal uppercase tracking-wider">Ocupación por Zonas de Almacenamiento</span>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                    {Object.entries(zones).map(([zoneName, zoneData]) => (
                    <ProgressBar 
                        key={zoneName} 
                        label={zoneName} 
                        value={zoneData.occupied} 
                        max={zoneData.total}
                        format={`/ ${zoneData.total}`}
                    />
                    ))}
                </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Analytics Dashboard */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded border border-zinc-200 sticky top-20 overflow-y-auto h-[calc(100vh-140px)] no-scrollbar">
            <h2 className="text-base font-normal text-black mb-4 border-b border-zinc-200 pb-2 flex items-center gap-2 uppercase tracking-tight">
                <PackageCheck className="w-5 h-5 text-zinc-300" />
                Analítica
            </h2>
            
            <div className="space-y-6">
                <div>
                    <h3 className="text-[9px] font-normal text-zinc-400 uppercase tracking-[0.2em] mb-4">Saturación por Pasillo</h3>
                    <div className="space-y-3">
                        {Object.entries(analytics.top_aisles).map(([aisle, count]) => (
                            <div key={aisle} className="flex justify-between items-center group py-1 border-b border-zinc-50 hover:border-black transition-colors">
                                <div className="flex items-center gap-2">
                                    <span className="w-1 h-1 bg-black group-hover:scale-125 transition-transform"></span>
                                    <span className="text-black transition-colors uppercase font-normal text-[9px]">Pasillo {aisle}</span>
                                </div>
                                <span className="font-mono font-normal text-black text-[11px]">{count} SKUs</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-[9px] font-normal text-zinc-400 uppercase tracking-[0.2em] mb-4 border-t border-zinc-100 pt-4">Eficiencia</h3>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[9px] uppercase tracking-tight text-zinc-400">
                                <span>Utilización de Capacidad</span>
                                <span className="font-mono text-black">{summary.occupancy_pct}%</span>
                            </div>
                            <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden">
                                <div className="h-full bg-black" style={{ width: `${summary.occupancy_pct}%` }}></div>
                            </div>
                        </div>
                        <p className="text-[9px] text-zinc-400 leading-relaxed uppercase">
                            Métrica basada en el total de ubicaciones maestras vs ubicaciones con stock físico mayor a cero.
                        </p>
                    </div>
                </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

