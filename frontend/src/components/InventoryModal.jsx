import React, { useState, useEffect } from 'react';
import { X, Car, Search, Send, Loader, ChevronRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const InventoryModal = ({ isOpen, onClose, onSelect }) => {
    const [catalog, setCatalog] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [view, setView] = useState('brands'); // 'brands' | 'models'

    useEffect(() => {
        if (isOpen) loadCatalog();
    }, [isOpen]);

    const loadCatalog = async () => {
        setLoading(true);
        try {
            // Load from local JSON file - NO backend needed!
            const res = await fetch('/inventory/catalog.json');
            const data = await res.json();
            setCatalog(data);
        } catch (error) {
            console.error('Error loading catalog:', error);
            toast.error('Error cargando catálogo');
        } finally {
            setLoading(false);
        }
    };

    const handleBrandSelect = (brand) => {
        setSelectedBrand(brand);
        setView('models');
    };

    const handleBack = () => {
        setSelectedBrand(null);
        setView('brands');
    };

    const handleModelSelect = (model) => {
        onSelect({
            make: selectedBrand.name,
            model: model.name,
            year: model.year,
            price: model.price,
            description: model.description,
            primary_image_url: model.image
        });
    };

    // Filter brands and models by search term
    const getFilteredBrands = () => {
        if (!catalog) return [];
        if (!searchTerm) return catalog.brands;
        return catalog.brands.filter(brand =>
            brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            brand.models.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };

    const getFilteredModels = () => {
        if (!selectedBrand) return [];
        if (!searchTerm) return selectedBrand.models;
        return selectedBrand.models.filter(model =>
            model.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-neutral-900 w-full max-w-4xl rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {view === 'models' && (
                            <button
                                onClick={handleBack}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-400" />
                            </button>
                        )}
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Car className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {view === 'brands' ? 'Inventario de Vehículos' : selectedBrand?.name}
                            </h2>
                            <p className="text-sm text-gray-400">
                                {view === 'brands' ? 'Selecciona una marca' : 'Selecciona un modelo'}
                            </p>
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

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : view === 'brands' ? (
                        /* Brand Grid */
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {getFilteredBrands().map(brand => (
                                <button
                                    key={brand.name}
                                    onClick={() => handleBrandSelect(brand)}
                                    className="bg-neutral-800 border border-white/5 rounded-xl p-6 hover:border-blue-500/50 transition-all group text-left"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-1">{brand.name}</h3>
                                            <p className="text-sm text-gray-500">{brand.models.length} modelos</p>
                                        </div>
                                        <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        /* Model Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {getFilteredModels().map(model => (
                                <div key={model.name} className="bg-neutral-800 border border-white/5 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all group">
                                    <div className="relative h-40 overflow-hidden bg-neutral-700">
                                        <img
                                            src={model.image}
                                            alt={`${selectedBrand.name} ${model.name}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/10">
                                            {model.year}
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <h3 className="text-lg font-bold text-white mb-1">
                                            {selectedBrand.name} {model.name}
                                        </h3>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-green-400 font-mono font-bold text-lg">
                                                ${model.price?.toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                                            {model.description}
                                        </p>

                                        <button
                                            onClick={() => handleModelSelect(model)}
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

                    {!loading && view === 'brands' && getFilteredBrands().length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Car className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>No se encontraron marcas</p>
                        </div>
                    )}

                    {!loading && view === 'models' && getFilteredModels().length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Car className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>No se encontraron modelos</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryModal;
