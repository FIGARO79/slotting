import React, { useState, useEffect } from 'react';
import * as Icons from '../components/Icons';

const InventoryList = () => {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/master-items?search=${search}`);
            const data = await res.json();
            setItems(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchItems, 500);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Maestro de Inventario (250)</h1>
                <div className="relative">
                    <Icons.SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Buscar por código o descripción..."
                        className="pl-10 pr-4 py-2 border rounded-lg w-80 outline-none focus:ring-2 focus:ring-blue-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-zinc-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase">Código</th>
                            <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase">Descripción</th>
                            <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase">SIC</th>
                            <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase">Ubicación Actual</th>
                            <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase text-right">Cant. Física</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-10 text-center text-zinc-500">Cargando datos...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-10 text-center text-zinc-500">No se encontraron ítems.</td></tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.item_code} className="hover:bg-zinc-50">
                                    <td className="px-6 py-4 font-mono text-sm font-medium text-blue-600">{item.item_code}</td>
                                    <td className="px-6 py-4 text-sm text-zinc-700">{item.description}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${['W','X','Y'].includes(item.sic_code) ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {item.sic_code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-zinc-500">{item.bin_1 || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm text-zinc-700 text-right">{item.physical_qty}</td>
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
