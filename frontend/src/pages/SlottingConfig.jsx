import React, { useState, useEffect } from 'react';
import * as Icons from '../components/Icons';
import { Save, RefreshCw, SlidersHorizontal, Map, Settings2, Cpu, PackageCheck, Zap } from 'lucide-react';

const SlottingConfig = () => {
  const [config, setConfig] = useState({
    ai_optimization_level: 'alta',
  });

  const [mixLimits, setMixLimits] = useState({
    minuteria_max_skus: 3,
    nivel2_max_skus: 6,
    otros_niveles_max_skus: 4,
  });

  const [zoneRules, setZoneRules] = useState({
    cantilever_keywords: 'ROD, INTEGRAL STEEL',
    minuteria_weight_max: 0.1,
    minuteria_zone: 'Minuteria',
    heavy_weight_min: 10,
    heavy_levels: '3, 4, 5',
    high_rotation_levels: '0, 1',
    default_levels: '2',
    // Nuevos campos para la Matriz de Exilio
    exile_sic_codes: '0, Z, L',
    exile_max_score: 3,
    exile_rack_levels: '2, 3',
    ai_min_learn_score: 6
  });

  const [sicRules, setSicRules] = useState([
    { code: 'W', range: '> 30', spot: 'Hot', class: 'Alta Rotacion' },
    { code: 'X', range: '11 - 30', spot: 'Hot', class: 'Alta Rotacion' },
    { code: 'Y', range: '7 - 10', spot: 'Warm', class: 'Media Rotacion' },
    { code: 'K', range: '5 - 6', spot: 'Warm', class: 'Media Rotacion' },
    { code: 'L', range: '3 - 4', spot: 'Cold', class: 'Baja Rotacion' },
    { code: 'Z', range: '1 - 2', spot: 'Cold', class: 'Baja Rotacion' },
    { code: '0', range: '0', spot: 'Cold', class: 'Baja Rotacion' },
  ]);

  const [summary, setSummary] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const fetchSummary = async () => {
    try {
        const res = await fetch('/api/slotting/occupancy');
        if (res.ok) {
            const data = await res.json();
            setSummary(data.summary);
        }
    } catch (err) { console.error(err); }
  };

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/slotting/slotting-config');
      if (response.ok) {
        const data = await response.json();
        if (data.turnover && Object.keys(data.turnover).length > 0) {
            const mappedRules = Object.entries(data.turnover).map(([code, info]) => ({
                code,
                range: info.range,
                spot: info.spot.charAt(0).toUpperCase() + info.spot.slice(1).toLowerCase(),
                class: info.spot.toLowerCase() === 'hot' ? 'Alta Rotacion' : (info.spot.toLowerCase() === 'warm' ? 'Media Rotacion' : 'Baja Rotacion')
            }));
            const order = ['W', 'X', 'Y', 'K', 'L', 'Z', '0'];
            mappedRules.sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code));
            setSicRules(mappedRules);
        }
        if (data.mix_limits) setMixLimits(prev => ({ ...prev, ...data.mix_limits }));
        if (data.zone_rules) setZoneRules(prev => ({ ...prev, ...data.zone_rules }));
      }
      fetchSummary();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  const handleSpotChange = (code, newSpot) => {
    setSicRules(prev => prev.map(rule => 
      rule.code === code ? { 
        ...rule, 
        spot: newSpot, 
        class: newSpot === 'Hot' ? 'Alta Rotacion' : (newSpot === 'Warm' ? 'Media Rotacion' : 'Baja Rotacion')
      } : rule
    ));
  };

  const handleMixLimitChange = (key, value) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 20) {
      setMixLimits(prev => ({ ...prev, [key]: numValue }));
    }
  };

  const handleZoneRuleChange = (key, value) => {
    setZoneRules(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const turnoverPayload = {};
      sicRules.forEach(rule => {
        turnoverPayload[rule.code] = { range: rule.range, spot: rule.spot.toLowerCase() };
      });
      const response = await fetch('/api/slotting/slotting-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...config, 
          turnover: turnoverPayload,
          mix_limits: mixLimits,
          zone_rules: zoneRules
        })
      });
      if (response.ok) {
        setSuccess('Configuración actualizada correctamente en el motor.');
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const getSpotColor = (spot) => {
    switch (spot?.toLowerCase()) {
        case 'hot': return 'text-black font-normal';
        case 'warm': return 'text-black font-normal';
        case 'cold': return 'text-black font-normal';
        default: return 'text-zinc-400';
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 pt-3 pb-6 font-sans bg-[#fcfcfc] min-h-screen text-black antialiased">
      
      {/* Header Técnico */}
      <div className="flex justify-between items-center mb-6 border-b border-zinc-200 pb-4">
        <div className="flex flex-col gap-0">
          <h1 className="text-lg font-normal tracking-tight text-black uppercase">Estrategia y Reglas de Slotting</h1>
          <p className="text-[10px] uppercase tracking-widest font-normal leading-none mt-0.5 text-zinc-400">Configuración del Motor de Optimización y Parámetros de Negocio</p>
        </div>
        
        <div className="flex items-center gap-3">
            <button 
                onClick={fetchConfig} 
                className="h-8 px-3 bg-white border border-zinc-300 text-black hover:bg-zinc-50 transition-colors rounded flex items-center gap-2 text-[12px] uppercase font-normal shadow-sm"
                title="Refrescar"
            >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refrescar
            </button>
            <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="h-8 px-4 bg-black text-white hover:bg-zinc-800 transition-colors rounded flex items-center gap-2 text-[12px] uppercase font-normal shadow-sm disabled:opacity-50"
            >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'GUARDANDO...' : 'PUBLICAR CAMBIOS'}
            </button>
        </div>
      </div>

      {success && <div className="bg-zinc-50 border border-zinc-200 text-black p-4 mb-6 rounded shadow-sm text-xs font-normal uppercase tracking-tight">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Configuration Content */}
        <div className="lg:col-span-3 space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 01. Jerarquia de Rotacion */}
                <div className="bg-white rounded border border-zinc-200 overflow-hidden flex flex-col">
                    <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex items-center gap-2">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-[12px] text-black font-normal uppercase tracking-wider">Jerarquía de Rotación (SIC)</span>
                    </div>
                    <div className="overflow-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-zinc-100 border-b border-zinc-200">
                                <tr>
                                    <th className="px-4 py-2 text-[12px] font-normal text-black uppercase tracking-wider">SIC</th>
                                    <th className="px-4 py-2 text-[12px] font-normal text-black uppercase tracking-wider">Hits (Frecuencia)</th>
                                    <th className="px-4 py-2 text-[12px] font-normal text-black uppercase tracking-wider">Spot Ideal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {sicRules.map((rule) => (
                                    <tr key={rule.code} className="hover:bg-zinc-50 transition-colors leading-none">
                                        <td className="px-4 py-3 font-mono text-[13px] font-normal text-black uppercase">{rule.code}</td>
                                        <td className="px-4 py-3 text-[12px] text-zinc-500 font-normal">{rule.range}</td>
                                        <td className="px-4 py-3">
                                            <select 
                                                value={rule.spot} 
                                                onChange={(e) => handleSpotChange(rule.code, e.target.value)}
                                                className={`bg-transparent border-none text-[12px] font-normal uppercase focus:ring-0 p-0 h-7 w-full cursor-pointer tracking-tight text-black`}
                                            >
                                                <option value="Hot">Hot</option>
                                                <option value="Warm">Warm</option>
                                                <option value="Cold">Cold</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 02. Zonificacion Fisica */}
                <div className="bg-white rounded border border-zinc-200 overflow-hidden flex flex-col">
                    <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex items-center gap-2">
                        <Map className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-[12px] text-black font-normal uppercase tracking-wider">Zonificación Física Automática</span>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[12px] border-b border-zinc-50 pb-2">
                                <span className="font-normal text-black uppercase">Cantilever</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-zinc-400 uppercase tracking-tighter">PALABRAS CLAVE:</span>
                                    <input 
                                        type="text"
                                        value={zoneRules.cantilever_keywords}
                                        onChange={(e) => handleZoneRuleChange('cantilever_keywords', e.target.value)}
                                        className="h-7 w-48 text-[12px] font-mono font-normal text-center border border-zinc-200 rounded text-black outline-none focus:border-black"
                                        title="Palabras clave separadas por coma que activan la zona Cantilever"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center text-[12px] border-b border-zinc-50 pb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-normal text-black uppercase">Minutería (Peso &lt;)</span>
                                    <input 
                                        type="number" step="0.01"
                                        value={zoneRules.minuteria_weight_max}
                                        onChange={(e) => handleZoneRuleChange('minuteria_weight_max', parseFloat(e.target.value) || 0.1)}
                                        className="h-7 w-24 text-[12px] font-mono font-normal text-center border border-zinc-200 rounded text-black outline-none focus:border-black"
                                    />
                                    <span className="font-normal text-zinc-400 uppercase tracking-tighter">KG</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-zinc-400 uppercase tracking-tighter">ZONA:</span>
                                    <select
                                        value={zoneRules.minuteria_zone}
                                        onChange={(e) => handleZoneRuleChange('minuteria_zone', e.target.value)}
                                        className="h-7 px-1 py-0 text-[12px] font-normal border border-zinc-200 rounded text-black outline-none focus:border-black bg-transparent cursor-pointer uppercase"
                                    >
                                        <option value="Minuteria">Minutería</option>
                                        <option value="Rack">Rack</option>
                                        <option value="Cantilever">Cantilever</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-[12px] border-b border-zinc-50 pb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-normal text-black uppercase">Pesados (Peso &gt;)</span>
                                    <input 
                                        type="number"
                                        value={zoneRules.heavy_weight_min}
                                        onChange={(e) => handleZoneRuleChange('heavy_weight_min', parseFloat(e.target.value) || 10)}
                                        className="h-7 w-16 text-[12px] font-mono font-normal text-center border border-zinc-200 rounded text-black outline-none focus:border-black"
                                    />
                                    <span className="font-normal text-zinc-400 uppercase tracking-tighter">KG</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-zinc-400 uppercase tracking-tighter">NIVELES:</span>
                                    <input 
                                        type="text" 
                                        value={zoneRules.heavy_levels}
                                        onChange={(e) => handleZoneRuleChange('heavy_levels', e.target.value)}
                                        className="h-7 w-32 text-[12px] font-mono font-normal text-center border border-zinc-200 rounded text-black outline-none focus:border-black"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-[12px] border-b border-zinc-50 pb-2">
                                <span className="font-normal text-black uppercase">Alta Rotación (W, X)</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-zinc-400 uppercase tracking-tighter">NIVELES:</span>
                                    <input 
                                        type="text" 
                                        value={zoneRules.high_rotation_levels}
                                        onChange={(e) => handleZoneRuleChange('high_rotation_levels', e.target.value)}
                                        className="h-7 w-32 text-[12px] font-mono font-normal text-center border border-zinc-200 rounded text-black outline-none focus:border-black"
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="text-[11px] text-zinc-400 italic leading-tight uppercase font-normal">Las reglas físicas prevalecen sobre el motor de IA para garantizar seguridad operacional.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 03. Limites de Mezcla */}
                <div className="bg-white rounded border border-zinc-200 overflow-hidden flex flex-col">
                    <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex items-center gap-2">
                        <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-[12px] text-black font-normal uppercase tracking-wider">Límites de Mezcla de SKUs</span>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center p-3 bg-zinc-50/50 border border-zinc-100 rounded">
                            <div className="flex flex-col">
                                <span className="text-[12px] font-normal uppercase text-black">Ubicaciones Minutería</span>
                                <span className="text-[11px] uppercase text-zinc-400">Gavetas y cajones</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    value={mixLimits.minuteria_max_skus}
                                    onChange={(e) => handleMixLimitChange('minuteria_max_skus', e.target.value)}
                                    className="h-8 w-20 text-[13px] font-mono font-normal text-center border border-zinc-200 rounded text-black outline-none focus:border-black"
                                />
                                <span className="text-[12px] font-normal text-zinc-400 uppercase">SKUs</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-zinc-50/50 border border-zinc-100 rounded">
                            <div className="flex flex-col">
                                <span className="text-[12px] font-normal uppercase text-black">Nivel de Recolección (N2)</span>
                                <span className="text-[11px] uppercase text-zinc-400">Picking manual intensivo</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    value={mixLimits.nivel2_max_skus}
                                    onChange={(e) => handleMixLimitChange('nivel2_max_skus', e.target.value)}
                                    className="h-8 w-20 text-[13px] font-mono font-normal text-center border border-zinc-200 rounded text-black outline-none focus:border-black"
                                />
                                <span className="text-[12px] font-normal text-zinc-400 uppercase">SKUs</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-zinc-50/50 border border-zinc-100 rounded">
                            <div className="flex flex-col">
                                <span className="text-[12px] font-normal uppercase text-black">Otros Niveles Rack</span>
                                <span className="text-[11px] uppercase text-zinc-400">Reserva y aéreos</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    value={mixLimits.otros_niveles_max_skus}
                                    onChange={(e) => handleMixLimitChange('otros_niveles_max_skus', e.target.value)}
                                    className="h-8 w-20 text-[13px] font-mono font-normal text-center border border-zinc-200 rounded text-black outline-none focus:border-black"
                                />
                                <span className="text-[12px] font-normal text-zinc-400 uppercase">SKUs</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 04. Matriz de Exilio y Calidad IA */}
                <div className="bg-white rounded border border-zinc-200 overflow-hidden flex flex-col">
                    <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-[12px] text-black font-normal uppercase tracking-wider">Matriz de Exilio y Calidad IA</span>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[12px] border-b border-zinc-50 pb-2">
                                <span className="font-normal text-black uppercase">SICs de Baja Rotación</span>
                                <input 
                                    type="text" 
                                    value={zoneRules.exile_sic_codes}
                                    onChange={(e) => handleZoneRuleChange('exile_sic_codes', e.target.value)}
                                    className="h-7 w-32 text-[12px] font-mono font-normal text-center border border-zinc-200 rounded text-black outline-none focus:border-black"
                                    placeholder="0, Z, L"
                                />
                            </div>
                            
                            <div className="flex justify-between items-center text-[12px] border-b border-zinc-50 pb-2">
                                <span className="font-normal text-black uppercase">Score Máximo Exilio</span>
                                <input 
                                    type="number" 
                                    value={zoneRules.exile_max_score}
                                    onChange={(e) => handleZoneRuleChange('exile_max_score', parseInt(e.target.value) || 0)}
                                    className="h-7 w-16 text-[12px] font-mono font-normal text-center border border-zinc-200 rounded text-black outline-none focus:border-black"
                                />
                            </div>

                            <div className="flex justify-between items-center text-[12px] border-b border-zinc-50 pb-2">
                                <span className="font-normal text-black uppercase">Niveles Rack Exilio</span>
                                <input 
                                    type="text" 
                                    value={zoneRules.exile_rack_levels}
                                    onChange={(e) => handleZoneRuleChange('exile_rack_levels', e.target.value)}
                                    className="h-7 w-32 text-[12px] font-mono font-normal text-center border border-zinc-200 rounded text-black outline-none focus:border-black"
                                    placeholder="2, 3"
                                />
                            </div>

                            <div className="flex justify-between items-center text-[12px] border-b border-zinc-50 pb-2">
                                <span className="font-normal text-amber-600 uppercase italic">Calidad Aprendizaje IA</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-zinc-400">Score Min:</span>
                                    <input 
                                        type="number" 
                                        value={zoneRules.ai_min_learn_score}
                                        onChange={(e) => handleZoneRuleChange('ai_min_learn_score', parseInt(e.target.value) || 6)}
                                        className="h-7 w-16 text-[12px] font-mono font-normal text-center border border-zinc-200 rounded text-amber-600 border-amber-100 outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="text-[11px] text-zinc-400 italic leading-tight uppercase font-normal">Estos parámetros definen el comportamiento estricto del exilio y el filtro de calidad de la IA.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Panel: Summary Dashboard */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded border border-zinc-200 sticky top-20 overflow-y-auto h-[calc(100vh-140px)] no-scrollbar">
            <h2 className="text-lg font-normal text-black mb-4 border-b border-zinc-200 pb-2 flex items-center gap-2 uppercase tracking-tight">
                <PackageCheck className="w-5 h-5 text-zinc-200" />
                Estado
            </h2>
            {!summary ? (
                <div className="text-[12px] uppercase text-zinc-400 italic font-normal">Cargando métricas...</div>
            ) : (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-[11px] font-normal text-zinc-400 uppercase tracking-[0.2em] mb-3">Capacidad Física</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-base border-b border-zinc-50 pb-1">
                                <span className="text-black uppercase text-[12px] font-normal">Total Bins</span>
                                <span className="font-mono font-normal text-black text-[13px]">{summary.total_bins}</span>
                            </div>
                            <div className="flex justify-between items-center text-base border-b border-zinc-50 pb-1">
                                <span className="text-black uppercase text-[12px] font-normal">Bins en Uso</span>
                                <span className="font-mono font-normal text-black text-[13px]">{summary.filled_bins}</span>
                            </div>
                            <div className="flex justify-between items-center text-base">
                                <span className="text-black uppercase text-[12px] font-normal">Ocupación</span>
                                <span className={`font-mono font-normal text-[13px] text-black`}>{summary.occupancy_pct}%</span>
                            </div>
                            <div className="pt-1">
                                <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden">
                                    <div className="h-full bg-black" style={{ width: `${summary.occupancy_pct}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-100">
                        <div className="bg-zinc-50 p-3 rounded border border-zinc-100">
                            <h4 className="text-[11px] font-normal text-black uppercase mb-2">Configuración</h4>
                            <p className="text-[11px] text-zinc-400 uppercase leading-relaxed font-normal">
                                Los cambios afectarán el motor de asignación automática de nuevas ubicaciones.
                            </p>
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlottingConfig;
