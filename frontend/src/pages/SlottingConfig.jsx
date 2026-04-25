import React, { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';

const SlottingConfig = () => {
  const [config, setConfig] = useState({
    max_weight_per_slot: 10,
    allow_mixed_zones: false,
    ai_optimization_level: 'alta',
    prioritize_rotation: true,
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

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/slotting-config');
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
      }
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const turnoverPayload = {};
      sicRules.forEach(rule => {
        turnoverPayload[rule.code] = { range: rule.range, spot: rule.spot.toLowerCase() };
      });
      const response = await fetch('/api/admin/slotting-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, turnover: turnoverPayload })
      });
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 pb-20">
      
      <div className="flex justify-between items-center border-b border-black pb-4">
        <div>
          <h1>Configuracion de Slotting</h1>
          <p>Motor de optimizacion y reglas de negocio</p>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={fetchConfig}><RefreshCw className="w-3.5 h-3.5" /></button>
            <button onClick={handleSave} disabled={isSaving}>
                <span>Guardar Cambios</span>
            </button>
        </div>
      </div>

      {saved && <div className="border border-black p-2 text-center uppercase">Configuracion actualizada correctamente</div>}

      <div className="flex flex-col gap-10">
        
        {/* 01. Jerarquia de Rotacion */}
        <div>
            <h2>01. Jerarquia de Rotacion (SIC)</h2>
            <table className="w-full text-left mt-2">
                <thead>
                    <tr className="border-b border-black">
                        <th className="py-2">Codigo</th>
                        <th className="py-2">Rango Hits</th>
                        <th className="py-2">Spot Ideal</th>
                        <th className="py-2">Categoria</th>
                    </tr>
                </thead>
                <tbody>
                    {sicRules.map((rule) => (
                        <tr key={rule.code} className="border-b border-gray-200">
                            <td className="py-2">{rule.code}</td>
                            <td className="py-2">{rule.range}</td>
                            <td className="py-2">
                                <select value={rule.spot} onChange={(e) => handleSpotChange(rule.code, e.target.value)}>
                                    <option value="Hot">Hot</option>
                                    <option value="Warm">Warm</option>
                                    <option value="Cold">Cold</option>
                                </select>
                            </td>
                            <td className="py-2 opacity-50 italic">{rule.class}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* 02. Restricciones Fisicas y Zonificacion */}
        <div className="grid grid-cols-2 gap-10">
            <div>
                <h2>02. Zonificacion y Niveles</h2>
                <div className="mt-2 flex flex-col gap-2">
                    <div className="flex justify-between border-b border-gray-100 py-1">
                        <span>Cantilever (ROD/STEEL)</span>
                        <span>Zona Especial</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-1">
                        <span>Minuteria (&lt;0.1kg)</span>
                        <span>Zona Especial</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-1">
                        <span>Items Pesados (&gt;10kg)</span>
                        <span>Niveles 3, 4, 5</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-1">
                        <span>Alta Rotacion (W, X)</span>
                        <span>Niveles 0, 1</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-1">
                        <span>Resto de Articulos</span>
                        <span>Nivel 2</span>
                    </div>
                </div>
            </div>

            <div>
                <h2>03. Limites de Mezcla (SKUs)</h2>
                <div className="mt-2 flex flex-col gap-2">
                    <div className="flex justify-between border-b border-gray-100 py-1">
                        <span>Ubicaciones Minuteria</span>
                        <span>Maximo 3 SKUs</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-1">
                        <span>Ubicaciones Nivel 2</span>
                        <span>Maximo 6 SKUs</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-1">
                        <span>Otros Niveles Rack</span>
                        <span>Maximo 4 SKUs</span>
                    </div>
                </div>
            </div>
        </div>

        {/* 04. IA y Excepciones */}
        <div className="grid grid-cols-2 gap-10">
            <div>
                <h2>04. Motor de IA</h2>
                <div className="mt-2">
                    <label className="block mb-1">Nivel de Optimizacion</label>
                    <select 
                        value={config.ai_optimization_level}
                        onChange={(e) => setConfig({...config, ai_optimization_level: e.target.value})}
                        className="w-full"
                    >
                        <option value="rapida">Heuristica Basica</option>
                        <option value="equilibrada">Equilibrada</option>
                        <option value="alta">Deep Learning</option>
                    </select>
                    <p className="mt-4 text-xs italic opacity-60">
                        El sistema valida la temperatura (H/W/C) del bin antes de aplicar sugerencias aprendidas.
                    </p>
                </div>
            </div>

            <div>
                <h2>05. Excepciones de Prioridad</h2>
                <div className="mt-2 flex flex-col gap-2">
                    <div className="flex justify-between border-b border-gray-100 py-1">
                        <span>Cross-Docking (XDOCK)</span>
                        <span>Si existen reservas</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-1">
                        <span>Reubicacion Proactiva</span>
                        <span>Si cambia la rotacion</span>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SlottingConfig;
