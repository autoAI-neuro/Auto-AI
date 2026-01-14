import React, { useState, useRef } from 'react';
import { Upload, X, Image, Video, FileText, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../config';
import { useAuth } from '../context/AuthContext';

const MediaUploader = ({ onMediaReady, onCancel }) => {
    const { token } = useAuth();
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [uploadedMedia, setUploadedMedia] = useState(null);
    const [caption, setCaption] = useState('');

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 16MB for WhatsApp)
        if (file.size > 16 * 1024 * 1024) {
            toast.error('Archivo muy grande. Máximo 16MB.');
            return;
        }

        // Show preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview({ type: 'image', url: e.target.result, name: file.name });
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            setPreview({ type: 'video', name: file.name });
        } else {
            setPreview({ type: 'document', name: file.name });
        }

        // Upload file
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/files/upload-media', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setUploadedMedia(response.data);
            toast.success('Archivo subido');
        } catch (err) {
            console.error('Upload error:', err);
            toast.error('Error al subir archivo');
            setPreview(null);
        } finally {
            setUploading(false);
        }
    };

    const handleSend = () => {
        if (!uploadedMedia) {
            toast.error('Espera a que el archivo termine de subir');
            return;
        }

        onMediaReady({
            media_url: uploadedMedia.media_url,
            media_type: uploadedMedia.media_type,
            caption: caption
        });
    };

    const handleRemove = () => {
        setPreview(null);
        setUploadedMedia(null);
        setCaption('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'image': return <Image className="w-8 h-8 text-blue-400" />;
            case 'video': return <Video className="w-8 h-8 text-purple-400" />;
            default: return <FileText className="w-8 h-8 text-gray-400" />;
        }
    };

    return (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-white font-medium">Adjuntar Media</h4>
                <button onClick={onCancel} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {!preview ? (
                <div
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">Click para seleccionar archivo</p>
                    <p className="text-gray-500 text-sm mt-1">Imágenes, Videos, PDF (Máx 16MB)</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Preview */}
                    <div className="flex items-center gap-3 bg-gray-700/50 rounded-lg p-3">
                        {preview.type === 'image' && preview.url ? (
                            <img src={preview.url} alt="Preview" className="w-16 h-16 object-cover rounded" />
                        ) : (
                            getIcon(preview.type)
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{preview.name}</p>
                            {uploading ? (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Subiendo...
                                </div>
                            ) : uploadedMedia ? (
                                <p className="text-green-400 text-sm">✓ Listo para enviar</p>
                            ) : null}
                        </div>
                        <button onClick={handleRemove} className="text-red-400 hover:text-red-300">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Caption input */}
                    <input
                        type="text"
                        placeholder="Agregar descripción (opcional)"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                    />

                    {/* Send button */}
                    <button
                        onClick={handleSend}
                        disabled={!uploadedMedia}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
                    >
                        {uploading ? 'Subiendo...' : 'Enviar Media'}
                    </button>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
};

export default MediaUploader;
