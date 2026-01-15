import React, { useState, useEffect } from 'react';
import { X, Calculator, DollarSign, Calendar, Percent, Send, Car, Star } from 'lucide-react';
import toast from 'react-hot-toast';

// Credit score tiers with corresponding APR ranges
const CREDIT_TIERS = [
    { min: 750, max: 850, label: 'Excelente', color: 'text-green-400', bgColor: 'bg-green-500/20', aprRange: { min: 3.5, max: 5.5 }, defaultApr: 4.5 },
    { min: 700, max: 749, label: 'Muy Bueno', color: 'text-blue-400', bgColor: 'bg-blue-500/20', aprRange: { min: 5.0, max: 7.5 }, defaultApr: 6.0 },
    { min: 650, max: 699, label: 'Bueno', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', aprRange: { min: 7.0, max: 10.0 }, defaultApr: 8.5 },
    { min: 600, max: 649, label: 'Regular', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', aprRange: { min: 10.0, max: 15.0 }, defaultApr: 12.5 },
    { min: 500, max: 599, label: 'Bajo', color: 'text-orange-400', bgColor: 'bg-orange-500/20', aprRange: { min: 15.0, max: 20.0 }, defaultApr: 17.5 },
    { min: 300, max: 499, label: 'Muy Bajo', color: 'text-red-400', bgColor: 'bg-red-500/20', aprRange: { min: 20.0, max: 29.9 }, defaultApr: 24.9 },
];

const getCreditTier = (score) => {
    return CREDIT_TIERS.find(tier => score >= tier.min && score <= tier.max) || CREDIT_TIERS[CREDIT_TIERS.length - 1];
};

const PaymentCalculator = ({ isOpen, onClose, onSend, vehicleInfo = null }) => {
    const [creditScore, setCreditScore] = useState(700);
    const [formData, setFormData] = useState({
        vehiclePrice: vehicleInfo?.price || 35000,
        downPayment: 5000,
        interestRate: 6.0,
        loanTermMonths: 60,
        tradeInValue: 0
    });

    const [result, setResult] = useState(null);
    const currentTier = getCreditTier(creditScore);

    // Update APR when credit score changes
    useEffect(() => {
        const tier = getCreditTier(creditScore);
        setFormData(prev => ({
            ...prev,
            interestRate: tier.defaultApr
        }));
    }, [creditScore]);

    // Calculate when form changes
    useEffect(() => {
        calculatePayment();
    }, [formData]);

    const calculatePayment = () => {
        const { vehiclePrice, downPayment, interestRate, loanTermMonths, tradeInValue } = formData;

        // Amount to finance
        const principal = vehiclePrice - downPayment - tradeInValue;

        if (principal <= 0) {
            setResult({ monthlyPayment: 0, totalPayment: 0, totalInterest: 0, principal: 0 });
            return;
        }

        // Monthly interest rate
        const monthlyRate = (interestRate / 100) / 12;

        // Calculate monthly payment using amortization formula
        let monthlyPayment;
        if (monthlyRate === 0) {
            monthlyPayment = principal / loanTermMonths;
        } else {
            monthlyPayment = principal *
                (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) /
                (Math.pow(1 + monthlyRate, loanTermMonths) - 1);
        }

        const totalPayment = monthlyPayment * loanTermMonths;
        const totalInterest = totalPayment - principal;

        setResult({
            monthlyPayment: Math.round(monthlyPayment * 100) / 100,
            totalPayment: Math.round(totalPayment * 100) / 100,
            totalInterest: Math.round(totalInterest * 100) / 100,
            principal: Math.round(principal * 100) / 100
        });
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: parseFloat(value) || 0
        }));
    };

    const handleSendToClient = () => {
        if (!result) return;

        const message = `💰 *Cotización de Financiamiento*

🚗 ${vehicleInfo ? `${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year}` : 'Vehículo'}
💵 Precio: $${formData.vehiclePrice.toLocaleString()}
📥 Enganche: $${formData.downPayment.toLocaleString()}
${formData.tradeInValue > 0 ? `🔄 Trade-in: $${formData.tradeInValue.toLocaleString()}\n` : ''}
📊 *A financiar*: $${result.principal.toLocaleString()}
📅 Plazo: ${formData.loanTermMonths} meses
📈 Tasa: ${formData.interestRate}% APR
⭐ Crédito: ${currentTier.label} (${creditScore})

✨ *Pago Mensual: $${result.monthlyPayment.toLocaleString()}*

_Basado en puntaje crediticio de ${creditScore} puntos_

¿Te gustaría continuar con esta opción?`;

        onSend(message);
        onClose();
        toast.success('Cotización enviada al cliente');
    };

    if (!isOpen) return null;

    const termOptions = [24, 36, 48, 60, 72, 84];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-neutral-900 w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-neutral-900 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <Calculator className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Calculadora de Cuotas</h2>
                            <p className="text-sm text-gray-400">Cotización de financiamiento</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-5">

                    {/* Credit Score Section */}
                    <div className={`p-4 rounded-xl border ${currentTier.bgColor} border-white/10`}>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm text-gray-300 flex items-center gap-2">
                                <Star className="w-4 h-4" /> Puntaje Crediticio (FICO)
                            </label>
                            <div className={`flex items-center gap-2 ${currentTier.color}`}>
                                <span className="text-2xl font-bold">{creditScore}</span>
                                <span className="text-sm px-2 py-0.5 rounded-full bg-white/10">{currentTier.label}</span>
                            </div>
                        </div>
                        <input
                            type="range"
                            min="300"
                            max="850"
                            value={creditScore}
                            onChange={(e) => setCreditScore(parseInt(e.target.value))}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, 
                                    #ef4444 0%, 
                                    #f97316 20%, 
                                    #eab308 40%, 
                                    #22d3ee 60%, 
                                    #3b82f6 80%, 
                                    #22c55e 100%)`
                            }}
                        />
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>300</span>
                            <span>500</span>
                            <span>650</span>
                            <span>700</span>
                            <span>750</span>
                            <span>850</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Tasa estimada: <span className={currentTier.color}>{currentTier.aprRange.min}% - {currentTier.aprRange.max}% APR</span>
                        </p>
                    </div>

                    {/* Vehicle Price */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                            <Car className="w-4 h-4" /> Precio del Vehículo
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                value={formData.vehiclePrice}
                                onChange={(e) => handleChange('vehiclePrice', e.target.value)}
                                className="w-full bg-neutral-800 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-green-500"
                            />
                        </div>
                    </div>

                    {/* Down Payment & Trade-in */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Enganche
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    value={formData.downPayment}
                                    onChange={(e) => handleChange('downPayment', e.target.value)}
                                    className="w-full bg-neutral-800 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-green-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Trade-in</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    value={formData.tradeInValue}
                                    onChange={(e) => handleChange('tradeInValue', e.target.value)}
                                    className="w-full bg-neutral-800 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-green-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Interest Rate & Term */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                                <Percent className="w-4 h-4" /> Tasa APR
                                <span className="text-xs text-gray-500">(ajustable)</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.interestRate}
                                    onChange={(e) => handleChange('interestRate', e.target.value)}
                                    className="w-full bg-neutral-800 border border-white/10 rounded-xl py-3 px-4 pr-8 text-white focus:outline-none focus:border-green-500"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Plazo (meses)
                            </label>
                            <select
                                value={formData.loanTermMonths}
                                onChange={(e) => handleChange('loanTermMonths', e.target.value)}
                                className="w-full bg-neutral-800 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-green-500"
                            >
                                {termOptions.map(term => (
                                    <option key={term} value={term}>{term} meses</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {result && (
                    <div className="mx-6 mb-6 p-5 bg-gradient-to-br from-green-900/30 to-emerald-900/20 rounded-xl border border-green-500/20">
                        <div className="text-center mb-4">
                            <p className="text-gray-400 text-sm mb-1">Pago Mensual Estimado</p>
                            <p className="text-4xl font-bold text-green-400">
                                ${result.monthlyPayment.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Con crédito <span className={currentTier.color}>{currentTier.label}</span> @ {formData.interestRate}% APR
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center text-sm">
                            <div>
                                <p className="text-gray-500">A Financiar</p>
                                <p className="text-white font-medium">${result.principal.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Total Interés</p>
                                <p className="text-amber-400 font-medium">${result.totalInterest.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Total a Pagar</p>
                                <p className="text-white font-medium">${result.totalPayment.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="p-4 border-t border-white/10 flex gap-3 sticky bottom-0 bg-neutral-900">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-colors"
                    >
                        Cerrar
                    </button>
                    <button
                        onClick={handleSendToClient}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center gap-2 transition-colors font-medium"
                    >
                        <Send className="w-4 h-4" />
                        Enviar al Cliente
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentCalculator;
