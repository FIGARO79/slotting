import React, { useState, useEffect } from 'react';
import { 
  Save,
  Cpu,
  Box,
  AlertCircle,
  TrendingUp,
  Layers,
  Thermometer,
  Anchor,
  Info
} from 'lucide-react';
import Card from '../components/Card';

const SlottingConfig = () => {
  const [config, setConfig] = useState({
    max_weight_per_slot: 10,
    allow_mixed_zones: false,
    ai_optimization_level: 'alta',
    prioritize_rotation: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  const sicRules = [
    { code: 'W', range: '> 30', spot: 'Hot', class: 'Alta Rotación' },
    { code: 'X', range: '11 - 30', spot: 'Hot', class: 'Alta Rotación' },
    { code: 'Y', range: '7 - 10', spot: 'Hot', class: 'Alta Rotación' },
    { code: 'K', range: '5 - 6', spot: 'Cold', class: 'Baja Rotación' },
    { code: 'L', range: '3 - 4', spot: 'Cold', class: 'Baja Rotación' },
    { code: 'Z', range: '1 - 2', spot: 'Cold', class: 'Baja Rotación' },
    { code: '0', range: '0', spot: 'Cold', class: 'Baja Rotación' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración de Slotting</h1>
          <p className="text-gray-500 text-sm mt-1">Reglas de negocio y parámetros del optimizador espacial.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm disabled:opacity-70"
        >
          {isSaving ? (
             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
        </button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm">Configuración y reglas actualizadas correctamente.</p>
        </div>
      )}

      {/* Alerta de Prioridad ERP */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-900">Prioridad Jerárquica Activa</h4>
          <p className="text-xs text-amber-800 mt-1">
            El sistema prioriza los valores de <strong>SIC Code</strong> provenientes del ERP. 
            El cálculo local por "Hits" solo se activa si el valor oficial está vacío o es inválido.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Clasificación SIC */}
        <div className="lg:col-span-2">
          <Card title="Clasificación por Rotación (SIC Code)" icon={TrendingUp} description="Umbrales de hits para determinar la temperatura del ítem.">
            <div className="overflow-hidden border border-gray-100 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Hits (90d)</th>
                    <th className="px-4 py-3">Zona Ideal</th>
                    <th className="px-4 py-3">Clasificación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sicRules.map((rule) => (
                    <tr key={rule.code} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-indigo-600">{rule.code}</td>
                      <td className="px-4 py-3 text-gray-600">{rule.range}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          rule.spot === 'Hot' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {rule.spot}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{rule.class}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Card 2: Zonificación por Atributos */}
        <Card title="Zonificación Física" icon={Anchor} description="Reglas automáticas por descripción y peso.">
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Zonas Especiales</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Cantilever</span>
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">"ROD" | "STEEL"</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Minutería</span>
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">&lt; 0.1 kg</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Niveles en Rack</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 font-medium">Pesados (&gt;10kg)</span>
                  <span className="text-indigo-600 font-bold">Niv. 3, 4, 5</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 font-medium">Alta Rotación (W, X)</span>
                  <span className="text-indigo-600 font-bold">Niv. 0, 1</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 font-medium">Resto de ítems</span>
                  <span className="text-indigo-600 font-bold">Nivel 2</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: Capacidad y Mezcla */}
        <Card title="Mezcla y Capacidad" icon={Layers} description="Límites de SKUs diferentes por ubicación.">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Máximo SKUs Minutería</p>
                <p className="text-xs text-gray-500">Ubicaciones de piezas pequeñas.</p>
              </div>
              <span className="text-lg font-bold text-indigo-600">3</span>
            </div>
            <hr className="border-gray-100" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Máximo SKUs Nivel 2</p>
                <p className="text-xs text-gray-500">Zona de alta densidad.</p>
              </div>
              <span className="text-lg font-bold text-indigo-600">6</span>
            </div>
            <hr className="border-gray-100" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Otros Niveles Rack</p>
                <p className="text-xs text-gray-500">Capacidad estándar.</p>
              </div>
              <span className="text-lg font-bold text-indigo-600">4</span>
            </div>
          </div>
        </Card>

        {/* Card 4: Motor de Optimización IA */}
        <Card title="Motor de Optimización IA" icon={Cpu} description="Configuración del algoritmo de aprendizaje.">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel de Optimización
              </label>
              <select 
                value={config.ai_optimization_level}
                onChange={(e) => setConfig({...config, ai_optimization_level: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-700 bg-white"
              >
                <option value="rapida">Rápida (Heurística básica)</option>
                <option value="equilibrada">Equilibrada</option>
                <option value="alta">Alta (Aprendizaje Profundo)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <div>
                <h4 className="text-sm font-medium text-indigo-900">Conciencia Espacial</h4>
                <p className="text-[10px] text-indigo-700 mt-0.5 uppercase font-bold tracking-tighter">Filtro de Seguridad Activo</p>
              </div>
              <div className="flex items-center gap-1 text-indigo-600">
                <Thermometer className="w-4 h-4" />
                <span className="text-xs font-bold underline decoration-dotted">Hot/Cold</span>
              </div>
            </div>
            
            <div className="text-[10px] text-gray-400 bg-gray-50 p-2 rounded italic">
              * La IA requiere al menos 2 registros manuales para aprender un bin específico y 5 para patrones de zona.
            </div>
          </div>
        </Card>

        {/* Card 5: Excepciones Críticas */}
        <Card title="Excepciones Críticas" icon={Box} description="Reglas que anulan cualquier optimización.">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-red-900 leading-tight">Cross-Docking (XDOCK)</h4>
                <p className="text-xs text-red-700 mt-1">Si existen reservas pendientes en el ERP, se fuerza la ubicación XDOCK ignorando IA y Slotting.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-blue-900 leading-tight">Reubicación Proactiva</h4>
                <p className="text-xs text-blue-700 mt-1">Si la rotación de un ítem cambia en el ERP, el sistema sugerirá moverlo aunque ya tenga ubicación física.</p>
              </div>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default SlottingConfig;
