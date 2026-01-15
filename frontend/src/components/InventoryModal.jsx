import React, { useState, useEffect } from 'react';
import { X, Car, Search, Send, Loader } from 'lucide-react';
import api from '../config';
import toast from 'react-hot-toast';

const InventoryModal = ({ isOpen, onClose, onSelect }) => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) fetchInventory();
    }, [isOpen]);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/inventory', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.length === 0) {
                // Auto-seed for demo
                await api.post('/inventory/seed', {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const res2 = await api.get('/inventory', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCars(res2.data);
            } else {
                setCars(res.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Error cargando inventario');
        } finally {
            setLoading(false);
        }
    };

    const filteredCars = cars.filter(car =>
        car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-neutral-900 w-full max-w-4xl rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Car className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Inventario de Vehículos</h2>
                            <p className="text-sm text-gray-400">Selecciona un vehículo para enviar</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-white/10 bg-neutral-800/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por marca o modelo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-neutral-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Car Grid */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredCars.map(car => (
                                <div key={car.id} className="bg-neutral-800 border border-white/5 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all group">
                                    <div className="relative h-40 overflow-hidden bg-neutral-700">
                                        {car.primary_image_url ? (
                                            <img
                                                src={car.primary_image_url}
                                                alt={`${car.make} ${car.model}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Car className="w-16 h-16 text-neutral-500" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/10">
                                            {car.year}
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <h3 className="text-lg font-bold text-white mb-1">{car.make} {car.model}</h3>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-green-400 font-mono font-bold text-lg">
                                                ${car.price?.toLocaleString()}
                                            </span>
                                            {car.mileage && (
                                                <span className="text-xs text-gray-500">
                                                    {car.mileage.toLocaleString()} mi
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => onSelect(car)}
                                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors font-medium text-sm"
                                        >
                                            <Send className="w-4 h-4" />
                                            Enviar al Cliente
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && filteredCars.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Car className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>No se encontraron vehículos</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryModal;
