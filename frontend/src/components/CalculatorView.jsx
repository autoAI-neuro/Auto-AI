import React, { useState } from 'react';
import { Calculator, DollarSign, Car } from 'lucide-react';
import ToyotaRetailCalculator from './ToyotaRetailCalculator';
import ToyotaLeaseCalculator from './ToyotaLeaseCalculator';
import toast from 'react-hot-toast';

const CalculatorView = () => {
    const [showRetailCalc, setShowRetailCalc] = useState(false);
    const [showLeaseCalc, setShowLeaseCalc] = useState(false);

    // Dummy onSend for standalone mode — just copies to clipboard
    const handleStandaloneSend = async (message) => {
        try {
            await navigator.clipboard.writeText(message);
            toast.success('Cotización copiada al portapapeles');
        } catch {
            toast.success('Cotización generada');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Calculadoras de Financiamiento</h2>
                <p className="text-gray-400 text-sm">Calcula pagos de compra (retail) o lease para vehículos Toyota con datos oficiales SET Finance Florida.</p>
            </div>

            {/* Calculator Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Retail / Compra */}
                <button
                    onClick={() => setShowRetailCalc(true)}
                    className="group p-8 rounded-2xl border border-white/10 bg-neutral-900/50 hover:bg-green-900/20 hover:border-green-500/30 transition-all duration-300 text-left"
                >
                    <div className="p-4 bg-green-600/20 rounded-xl w-fit mb-5 group-hover:bg-green-600/30 transition-colors">
                        <DollarSign className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Calculadora de Compra</h3>
                    <p className="text-gray-400 text-sm mb-4">
                        Calcula pagos mensuales de financiamiento retail con tasas APR especiales por modelo, FICO y LTV.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">APR Especiales</span>
                        <span className="text-xs px-2 py-1 bg-white/10 text-gray-300 rounded-full">36-75 meses</span>
                        <span className="text-xs px-2 py-1 bg-white/10 text-gray-300 rounded-full">APR Manual</span>
                    </div>
                </button>

                {/* Lease */}
                <button
                    onClick={() => setShowLeaseCalc(true)}
                    className="group p-8 rounded-2xl border border-white/10 bg-neutral-900/50 hover:bg-blue-900/20 hover:border-blue-500/30 transition-all duration-300 text-left"
                >
                    <div className="p-4 bg-blue-600/20 rounded-xl w-fit mb-5 group-hover:bg-blue-600/30 transition-colors">
                        <Car className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Calculadora de Lease</h3>
                    <p className="text-gray-400 text-sm mb-4">
                        Calcula pagos de lease con money factors, residuales y programas especiales por modelo.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">Money Factors</span>
                        <span className="text-xs px-2 py-1 bg-white/10 text-gray-300 rounded-full">24-60 meses</span>
                        <span className="text-xs px-2 py-1 bg-white/10 text-gray-300 rounded-full">12K/15K/18K mi</span>
                    </div>
                </button>
            </div>

            {/* Quick Info */}
            <div className="p-4 rounded-xl border border-white/10 bg-neutral-900/30">
                <p className="text-xs text-gray-500">
                    📊 Datos actualizados: <span className="text-gray-300">SET Finance Florida • Feb 2026</span> —
                    Al "Enviar Cotización" el texto se copiará al portapapeles para que lo pegues donde necesites.
                </p>
            </div>

            {/* Calculator Modals */}
            <ToyotaRetailCalculator
                isOpen={showRetailCalc}
                onClose={() => setShowRetailCalc(false)}
                onSend={handleStandaloneSend}
            />
            <ToyotaLeaseCalculator
                isOpen={showLeaseCalc}
                onClose={() => setShowLeaseCalc(false)}
                onSend={handleStandaloneSend}
            />
        </div>
    );
};

export default CalculatorView;
