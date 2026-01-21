import React, { useState, useEffect } from 'react';
import { Tag, Plus, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../config';
import { useAuth } from '../context/AuthContext';

const TagSelector = ({ clientId, initialTags = [], availableTags = [], onTagsChange }) => {
    const { token } = useAuth();
    const [clientTags, setClientTags] = useState(initialTags);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setClientTags(initialTags);
    }, [initialTags]);

    const assignTag = async (tagId) => {
        setLoading(true);
        try {
            await api.post(`/tags/client/${clientId}/assign`,
                { tag_id: tagId },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            // Update local state
            const tagToAdd = availableTags.find(t => t.id === tagId);
            if (tagToAdd) {
                const newTags = [...clientTags, tagToAdd];
                setClientTags(newTags);
                onTagsChange?.(newTags);
            }
            toast.success('Etiqueta asignada');
        } catch (err) {
            console.error('Error assigning tag:', err);
            toast.error('Error al asignar etiqueta');
        } finally {
            setLoading(false);
        }
    };

    const removeTag = async (tagId) => {
        setLoading(true);
        try {
            await api.delete(`/tags/client/${clientId}/remove/${tagId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Update local state
            const newTags = clientTags.filter(t => t.id !== tagId);
            setClientTags(newTags);
            onTagsChange?.(newTags);
            toast.success('Etiqueta removida');
        } catch (err) {
            console.error('Error removing tag:', err);
            toast.error('Error al remover etiqueta');
        } finally {
            setLoading(false);
        }
    };

    const isTagAssigned = (tagId) => {
        return clientTags.some(t => t.id === tagId);
    };

    const toggleTag = (tag) => {
        if (isTagAssigned(tag.id)) {
            removeTag(tag.id);
        } else {
            assignTag(tag.id);
        }
    };

    return (
        <div className="relative">
            {/* Current Tags Display */}
            <div className="flex flex-wrap gap-1 items-center">
                {clientTags.map(tag => (
                    <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: tag.color }}
                    >
                        {tag.icon && <span>{tag.icon}</span>}
                        {tag.name}
                        <button
                            onClick={(e) => { e.stopPropagation(); removeTag(tag.id); }}
                            className="hover:bg-white/20 rounded-full p-0.5"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                {/* Add Tag Button */}
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    {clientTags.length === 0 ? 'Agregar etiqueta' : ''}
                </button>
            </div>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute z-50 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1">
                    {availableTags.map(tag => (
                        <button
                            key={tag.id}
                            onClick={() => toggleTag(tag)}
                            disabled={loading}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 transition-colors text-left"
                        >
                            <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: tag.color }}
                            />
                            <span className="flex-1 text-sm text-white">{tag.icon} {tag.name}</span>
                            {isTagAssigned(tag.id) && (
                                <Check className="w-4 h-4 text-green-400" />
                            )}
                        </button>
                    ))}

                    <div className="border-t border-gray-700 mt-1 pt-1">
                        <button
                            onClick={() => setShowDropdown(false)}
                            className="w-full text-center text-xs text-gray-400 py-2 hover:text-white"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TagSelector;
