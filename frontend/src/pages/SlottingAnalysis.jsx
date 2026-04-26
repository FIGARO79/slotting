import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  Database,
  Clock,
  Zap,
  Download
} from 'lucide-react';

const SlottingAnalysis = () => {
  const [filesStatus, setFilesStatus] = useState([]);
  const [loadingFiles, setLoadingLoadingFiles] = useState(true);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [individualSku, setIndividualSku] = useState('');
  const [individualResult, setIndividualResult] = useState(null);
  const [loadingIndividual, setLoadingIndividual] = useState(false);

  const exportToExcel = async () => {
    if (!analysisResults || !analysisResults.suggestions) return;
    
    try {
      const response = await fetch('/api/slotting/export-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisResults.suggestions)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Plan_Slotting_Vista_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Error exportando excel:", err);
      alert("Error al generar el archivo Excel.");
    }
  };

  const fetchFilesStatus = async () => {
    setLoadingLoadingFiles(true);
    try {
      const res = await fetch('/api/slotting/files-status');
      if (res.ok) {
        const data = await res.json();
        setFilesStatus(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLoadingFiles(false);
    }
  };

  const runMassAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/slotting/mass-analysis');
      if (res.ok) {
        const data = await res.json();
        // El backend ahora debería devolver el prox_score si actualizamos el router
        setAnalysisResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const runIndividualAnalysis = async () => {
    if (!individualSku) return;
    setLoadingIndividual(true);
    setAnalysisResults(null); // Limpiar tabla previa
    try {
      const res = await fetch(`/api/slotting/suggest/${individualSku}`);
      if (res.ok) {
        const data = await res.json();

        // Calcular ahorro diferenciado (IA Logic)
        let calcImprovement = 0;
        const lowRotationSICs = ['0', 'Z', 'L'];

        if (lowRotationSICs.includes(data.sic_code)) {
            // Para items muertos, la mejora es LIBERAR puntos altos
            calcImprovement = data.current_bin_score - data.suggested_bin_score;
        } else {
            // Para items activos, la mejora es GANAR proximidad
            calcImprovement = data.suggested_bin_score - data.current_bin_score;
        }

        // Inyectar el resultado individual en el formato de la tabla masiva
        setAnalysisResults({
          total_analyzed: 1,
          total_mismatches: data.is_misplaced ? 1 : 0,
          suggestions: [{
            item_code: data.item.item_code,
            description: data.item.description,
            current_bin: data.item.bin_1,
            suggested_bin: data.suggested_bin,
            prox_score: data.suggested_bin_score,
            improvement: calcImprovement, 
            sic: data.sic_code,
            abc: data.item.abc_code,
            source: data.source
          }]
        });
      }
 else {
        alert("SKU no encontrado o error en análisis.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingIndividual(false);
    }
  };

  const syncData = async () => {
    if (!confirm("¿Desea recargar los datos desde los archivos físicos? Esto sobrescribirá la base de datos actual.")) return;
    setLoadingLoadingFiles(true);
    try {
      const res = await fetch('/api/slotting/sync-data', { method: 'POST' });
      if (res.ok) {
        alert("Sincronización completada.");
        fetchFilesStatus();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchFilesStatus();
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-6 pt-3 pb-6 font-sans bg-[#fcfcfc] min-h-screen text-black antialiased">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-zinc-200 pb-4">
        <div className="flex flex-col gap-0">
          <h1 className="text-lg font-normal tracking-tight text-black uppercase">Analizador de Slotting Inteligente</h1>
          <p className="text-[10px] uppercase tracking-widest font-normal leading-none mt-0.5 text-zinc-400">Motor de Diagnóstico de Ubicaciones y Optimización de Espacio</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={syncData}
            className="h-8 px-4 bg-white border border-zinc-300 text-black hover:bg-zinc-50 transition-colors rounded flex items-center gap-2 text-[12px] uppercase font-normal shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingFiles ? 'animate-spin' : ''}`} />
            Sincronizar Archivos
          </button>
          <button 
            onClick={runMassAnalysis}
            disabled={analyzing}
            className="h-8 px-4 bg-black text-white hover:bg-zinc-800 transition-colors rounded flex items-center gap-2 text-[12px] uppercase font-normal shadow-sm disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5" />
            {analyzing ? 'Analizando...' : 'Ejecutar Slotting Masivo'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left: Files and Individual Search */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Files Status */}
          <div className="bg-white rounded border border-zinc-200 overflow-hidden">
            <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[12px] text-black font-normal uppercase tracking-wider">Estado de Archivos Locales</span>
            </div>
            <div className="p-4 space-y-4">
              {filesStatus.map(f => (
                <div key={f.file} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-normal text-black truncate pr-2 uppercase tracking-tight">{f.file}</span>
                    {f.exists ? (
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                  {f.exists && (
                    <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                      <span>{f.timestamp}</span>
                      <span>{f.size_kb} KB</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Individual Search */}
          <div className="bg-white rounded border border-zinc-200 overflow-hidden">
            <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[12px] text-black font-normal uppercase tracking-wider">Consulta Individual de SKU</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="SKU..."
                  value={individualSku}
                  onChange={(e) => setIndividualSku(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && runIndividualAnalysis()}
                  className="h-8 flex-1 px-3 text-[12px] font-normal border border-zinc-300 rounded focus:ring-1 focus:ring-black outline-none uppercase"
                />
                <button 
                  onClick={runIndividualAnalysis}
                  className="h-8 px-3 bg-black text-white rounded text-[12px] uppercase font-normal"
                >
                  Ir
                </button>
              </div>

              {loadingIndividual && <div className="text-[12px] text-zinc-400 italic text-center py-4 uppercase">Calculando óptimo...</div>}

              {individualResult && (
                <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-3 bg-zinc-50 rounded border border-zinc-100">
                    <p className="text-[11px] text-zinc-400 uppercase mb-1">Descripción</p>
                    <p className="text-[12px] text-black uppercase font-normal line-clamp-2">{individualResult.item.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white border border-zinc-100 rounded text-center">
                       <p className="text-[12px] text-zinc-400 uppercase mb-1">Actual</p>
                       <p className="text-base font-mono text-black">{individualResult.item.bin_1 || 'N/A'}</p>
                    </div>
                    <div className={`p-3 border rounded text-center ${individualResult.is_misplaced ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                       <p className={`text-[12px] uppercase mb-1 ${individualResult.is_misplaced ? 'text-amber-600' : 'text-emerald-600'}`}>Sugerido</p>
                       <p className="text-base font-mono text-black">{individualResult.suggested_bin}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <span className="text-[12px] text-black font-normal uppercase">SIC: <span className="text-black font-mono">{individualResult.sic_code}</span></span>
                    <span className="text-[12px] text-black font-normal uppercase">Score: <span className={`font-mono font-normal ${individualResult.suggested_bin_score >= 8 ? 'text-amber-600' : 'text-black'}`}>{individualResult.suggested_bin_score || '0'}/10</span></span>
                    <span className="text-[12px] text-black font-normal uppercase">Fuente: <span className="text-black">{individualResult.source}</span></span>
                  </div>

                  {individualResult.is_misplaced ? (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded text-[11px] text-amber-800 uppercase leading-relaxed font-normal">
                      El ítem no se encuentra en su zona de rotación ideal. Se recomienda reubicación inmediata.
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded text-[11px] text-emerald-800 uppercase leading-relaxed font-normal">
                      Ubicación correcta según reglas de negocio e inteligencia artificial.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main: Mass Analysis Table */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded border border-zinc-200 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
            <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex justify-between items-center">
                <span className="text-[12px] text-black font-normal uppercase tracking-wider">Resultados de Análisis Masivo</span>
                {analysisResults && (
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={exportToExcel}
                      className="flex items-center gap-1.5 px-2 py-1 bg-white border border-zinc-200 hover:bg-zinc-100 rounded text-[11px] text-black uppercase transition-colors shadow-sm"
                    >
                      <Download className="w-3 h-3" />
                      Exportar Excel
                    </button>
                    <span className="text-[11px] text-zinc-500 uppercase">Analizados: <span className="text-black font-mono font-normal">{analysisResults.total_analyzed}</span></span>
                    <span className="text-[11px] text-amber-600 uppercase font-normal">Reubicaciones: <span className="font-mono">{analysisResults.total_mismatches}</span></span>
                  </div>
                )}
            </div>
            
            <div className="overflow-auto flex-1 no-scrollbar">
              {!analysisResults && !analyzing && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-300 space-y-4">
                  <FileText className="w-12 h-12" />
                  <p className="text-[12px] uppercase tracking-widest">Ejecute un análisis masivo para ver las discrepancias de ubicación</p>
                </div>
              )}

              {analyzing && (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-8 h-8 animate-spin text-black" />
                  <p className="text-[12px] uppercase tracking-widest text-zinc-400">Analizando el total del inventario contra el layout físico...</p>
                </div>
              )}

              {analysisResults && (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 sticky top-0 z-10 border-b border-zinc-200">
                    <tr>
                      <th className="px-4 py-3 text-[12px] font-normal text-zinc-400 uppercase tracking-wider">Item / SKU</th>
                      <th className="px-4 py-3 text-[12px] font-normal text-zinc-400 uppercase tracking-wider text-center">SIC</th>
                      <th className="px-4 py-3 text-[12px] font-normal text-zinc-400 uppercase tracking-wider text-center">ABC</th>
                      <th className="px-4 py-3 text-[12px] font-normal text-zinc-400 uppercase tracking-wider">Actual</th>
                      <th className="px-4 py-3 text-center w-10"></th>
                      <th className="px-4 py-3 text-[12px] font-normal text-black uppercase tracking-wider">Sugerido</th>
                      <th className="px-4 py-3 text-[12px] font-normal text-zinc-400 uppercase tracking-wider text-center">Score</th>
                      <th className="px-4 py-3 text-[12px] font-normal text-zinc-400 uppercase tracking-wider text-right">Ahorro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {analysisResults.suggestions.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-mono text-black font-normal uppercase">{row.item_code}</span>
                            <span className="text-[11px] text-zinc-400 uppercase truncate max-w-[200px]">{row.description}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-[12px] font-mono text-black font-normal">{row.sic || '---'}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-[12px] font-mono text-black font-normal">{row.abc || '---'}</span>
                        </td>
                        <td className="px-4 py-3 text-[13px] font-mono text-zinc-400 uppercase">{row.current_bin || '---'}</td>
                        <td className="px-4 py-3 text-center">
                          <ArrowRight className="w-3 h-3 text-zinc-200" />
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-amber-50 text-amber-800 rounded font-mono text-[13px] border border-amber-100 uppercase">
                            {row.suggested_bin}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                           <div className="flex items-center justify-center gap-1.5">
                              <Zap className={`w-3 h-3 ${row.prox_score >= 8 ? 'text-amber-500 fill-amber-500' : (row.prox_score >= 5 ? 'text-blue-400 fill-blue-400' : 'text-zinc-300')}`} />
                              <span className="font-mono text-[12px] text-black uppercase">{row.prox_score}/10</span>
                           </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                           <span className={`text-[12px] font-normal uppercase ${row.improvement > 0 ? 'text-emerald-600' : 'text-black'}`}>
                              {row.improvement > 0 ? `+${row.improvement} PTS` : 'REGLA'}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {analysisResults && (
              <div className="bg-zinc-50 border-t border-zinc-200 px-4 py-2 flex justify-between items-center text-[11px] text-zinc-400 uppercase tracking-widest italic font-normal">
                <span>Total de registros con discrepancia: {analysisResults.total_mismatches}</span>
                <span>Optimización de recorridos priorizada (Scoring 0-10)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlottingAnalysis;
