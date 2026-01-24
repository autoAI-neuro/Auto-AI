import React from 'react';
import { Settings, User, Lock, Globe, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsView = ({ user }) => {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="mb-8 pl-4 border-l-2 border-purple-500">
                <h2 className="text-2xl font-light text-white items-center gap-3">
                    Configuración
                </h2>
                <p className="text-neutral-500 text-sm mt-1">
                    Administra tu cuenta y preferencias
                </p>
            </div>

            {/* Profile Section */}
            <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                        <User size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white">Perfil de Usuario</h3>
                        <p className="text-sm text-neutral-500">Información personal y de contacto</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm text-neutral-400">Email</label>
                        <input
                            type="email"
                            disabled
                            value={user?.email || "usuario@ejemplo.com"}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white opacity-60 cursor-not-allowed"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-neutral-400">Rol</label>
                        <input
                            type="text"
                            disabled
                            value="Administrador"
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white opacity-60 cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                        <Lock size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white">Seguridad</h3>
                        <p className="text-sm text-neutral-500">Cambiar contraseña y seguridad</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => toast('Función de cambio de contraseña próximamente. Contacte soporte.', { icon: '🔒' })}
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm transition-colors border border-white/5"
                    >
                        Cambiar Contraseña
                    </button>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Autenticación segura activa
                    </div>
                </div>
            </div>

            {/* Preferences Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-6 backdrop-blur-sm hover:border-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-4">
                        <Globe size={20} className="text-gray-400" />
                        <h4 className="text-white font-medium">Idioma</h4>
                    </div>
                    <p className="text-sm text-neutral-500">Español (Predeterminado)</p>
                </div>

                <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-6 backdrop-blur-sm hover:border-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-4">
                        <Bell size={20} className="text-gray-400" />
                        <h4 className="text-white font-medium">Notificaciones</h4>
                    </div>
                    <p className="text-sm text-neutral-500">Activas (WhatsApp)</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
