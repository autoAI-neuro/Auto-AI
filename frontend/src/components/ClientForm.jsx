import React, { useState } from 'react';
import { X, Save, Car, User, Calendar, FileText } from 'lucide-react';

const ClientForm = ({ onClose, onSubmit, initialData = {} }) => {
    const [formData, setFormData] = useState({
        name: initialData.name || '',
        last_name: initialData.last_name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        address: initialData.address || '',
        birth_date: initialData.birth_date || '',

        car_make: initialData.car_make || '',
        car_model: initialData.car_model || '',
        car_year: initialData.car_year || '',
        purchase_date: initialData.purchase_date || '',
        interest_rate: initialData.interest_rate || '',
        automation_enabled: initialData.automation_enabled !== false, // Default true

        notes: initialData.notes || '',
        tags: initialData.tags || ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Convert empty strings to null for optional fields
        const cleanData = {};
        for (const [key, value] of Object.entries(formData)) {
            if (value === '' || value === null || value === undefined) {
                cleanData[key] = null;
            } else if (key === 'car_year') {
                cleanData[key] = value ? parseInt(value, 10) : null;
            } else if (key === 'interest_rate') {
                cleanData[key] = value ? parseFloat(value) : null;
            } else {
                cleanData[key] = value;
            }
        }
        onSubmit(cleanData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-neutral-900 z-10">
                    <h2 className="text-xl font-light text-white">
                        {initialData.id ? 'Editar Cliente' : 'Nuevo Cliente'}
                    </h2>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Personal Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-blue-400 flex items-center gap-2">
                            <User className="w-4 h-4" /> Datos Personales
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Nombre *"
                                className="input-elegant"
                            />
                            <input
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Apellido"
                                className="input-elegant"
                            />
                            <input
                                required
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Teléfono (+58...)"
                                className="input-elegant"
                            />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email"
                                className="input-elegant"
                            />
                            <input
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Dirección"
                                className="input-elegant md:col-span-2"
                            />
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-neutral-500">Fecha de Nacimiento</label>
                                <input
                                    type="date"
                                    name="birth_date"
                                    value={formData.birth_date}
                                    onChange={handleChange}
                                    className="input-elegant"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* Vehicle Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-purple-400 flex items-center gap-2">
                            <Car className="w-4 h-4" /> Datos del Vehículo
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <input
                                name="car_make"
                                value={formData.car_make}
                                onChange={handleChange}
                                placeholder="Marca (Toyota)"
                                className="input-elegant"
                            />
                            <input
                                name="car_model"
                                value={formData.car_model}
                                onChange={handleChange}
                                placeholder="Modelo (Corolla)"
                                className="input-elegant"
                            />
                            <input
                                type="number"
                                name="car_year"
                                value={formData.car_year}
                                onChange={handleChange}
                                placeholder="Año"
                                className="input-elegant"
                            />
                            <input
                                type="number"
                                step="0.01"
                                name="interest_rate"
                                value={formData.interest_rate}
                                onChange={handleChange}
                                placeholder="Interés %"
                                className="input-elegant"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-neutral-500">Fecha de Compra</label>
                            <input
                                type="date"
                                name="purchase_date"
                                value={formData.purchase_date}
                                onChange={handleChange}
                                className="input-elegant"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* Notes & Tags */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-green-400 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Notas Adicionales
                        </h3>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Notas sobre el cliente..."
                            rows={3}
                            className="input-elegant w-full"
                        />
                        <input
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            placeholder="Etiquetas (separadas por coma)"
                            className="input-elegant w-full"
                        />
                        <div className="flex items-center gap-3 pt-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="automation_enabled"
                                    checked={formData.automation_enabled}
                                    onChange={(e) => setFormData(prev => ({ ...prev, automation_enabled: e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                <span className="ml-3 text-sm font-medium text-neutral-300">
                                    {formData.automation_enabled ? 'IA Automática Activada' : 'IA Desactivada (Solo Manual)'}
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5 sticky bottom-0 bg-neutral-900">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Guardar Cliente
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientForm;
