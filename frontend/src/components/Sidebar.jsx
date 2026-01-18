import React from 'react';
import {
    LayoutDashboard,
    Calendar,
    Settings,
    LogOut,
    Menu,
    PieChart,
    Zap
} from 'lucide-react';

const Sidebar = ({ activeTab, onTabChange, onLogout, isOpen, toggleSidebar }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
        { id: 'analytics', label: 'Analíticas', icon: PieChart },
        { id: 'automations', label: 'Automatizaciones', icon: Zap },
        { id: 'calendar', label: 'Calendario', icon: Calendar },
        { id: 'settings', label: 'Configuración', icon: Settings },
    ];

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={toggleSidebar}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-neutral-900 text-white rounded-lg border border-white/10"
            >
                <Menu size={20} />
            </button>

            {/* Sidebar Container */}
            <aside className={`
                fixed top-0 left-0 z-40 h-screen w-64 bg-black/95 backdrop-blur-xl border-r border-white/5 transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="flex flex-col h-full p-4">
                    {/* Logo/Header */}
                    <div className="flex items-center justify-center py-4 mb-6">
                        <img
                            src="/logo.png"
                            alt="AUTO AI"
                            className="h-10"
                            style={{ filter: 'invert(1) hue-rotate(180deg)' }}
                        />
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onTabChange(item.id);
                                        // On mobile, close sidebar after content click if desired
                                        if (window.innerWidth < 1024) toggleSidebar();
                                    }}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium
                                        ${isActive
                                            ? 'bg-white text-black shadow-lg shadow-white/5'
                                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <Icon size={18} className={isActive ? 'text-black' : 'text-neutral-500 group-hover:text-white'} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Footer / Logout */}
                    <div className="pt-4 mt-4 border-t border-white/5">
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
                        >
                            <LogOut size={18} />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    onClick={toggleSidebar}
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
                />
            )}
        </>
    );
};

export default Sidebar;
