import React, { useState, useEffect, useMemo } from 'react';
import { X, Calculator, DollarSign, Calendar, Star, Send, Car, Search, ChevronDown, Info, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { TOYOTA_FINANCE_DATA, getCreditTier, calculateLeasePayment } from '../data/toyotaFinanceData';

const ToyotaLeaseCalculator = ({ isOpen, onClose, onSend }) => {
    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModel, setSelectedModel] = useState(null);
    const [showModelList, setShowModelList] = useState(false);
    const [creditScore, setCreditScore] = useState(720);
    const [term, setTerm] = useState(36);
    const [mileage, setMileage] = useState(15000);
    const [downPayment, setDownPayment] = useState(3000);
    const [tradeIn, setTradeIn] = useState(0);
    const [sellingPrice, setSellingPrice] = useState(0);
    const [result, setResult] = useState(null);

    // Get all models as array
    const modelList = useMemo(() => {
        return Object.entries(TOYOTA_FINANCE_DATA.models2026).map(([name, data]) => ({
            name,
            ...data
        }));
    }, []);

    // Filtered models based on search
    const filteredModels = useMemo(() => {
        if (!searchTerm) return modelList.slice(0, 20);
        return modelList.filter(m =>
            m.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 20);
    }, [searchTerm, modelList]);

    // Get current credit tier
    const currentTier = useMemo(() => getCreditTier(creditScore), [creditScore]);

    // Calculate when inputs change
    useEffect(() => {
        if (!selectedModel || !currentTier) {
            setResult(null);
            return;
        }

        // Get residual for selected term
        let residualPercent = selectedModel.residuals[term] || selectedModel.residuals[36];

        // Apply mileage adjustment
        const mileageAdj = TOYOTA_FINANCE_DATA.mileageOptions.residualAdjustment[mileage] || 0;
        residualPercent += mileageAdj;

        // Get money factor
        let moneyFactor = currentTier.moneyFactor;

        // Add term adjustment for 52-60 months
        if (term > 51) {
            moneyFactor += TOYOTA_FINANCE_DATA.moneyFactorAdjustments.term52to60;
        }

        // Calculate using selling price or MRT
        const price = sellingPrice || selectedModel.mrt;

        const leaseResult = calculateLeasePayment({
            sellingPrice: price,
            mrt: selectedModel.mrt,
            residualPercent,
            moneyFactor,
            term,
            downPayment,
            tradeIn
        });

        // Add bonus if applicable
        const bonus = selectedModel.bonus || 0;

        setResult({
            ...leaseResult,
            residualPercent,
            moneyFactor,
            apr: moneyFactor * 2400,
            mrt: selectedModel.mrt,
            bonus
        });

    }, [selectedModel, creditScore, term, mileage, downPayment, tradeIn, sellingPrice, currentTier]);

    // Handle model selection
    const handleSelectModel = (model) => {
        setSelectedModel(model);
        setSellingPrice(model.mrt);
        setShowModelList(false);
        setSearchTerm(model.name);
    };

    // Send quote to client
    const handleSendQuote = async () => {
        if (!result || !selectedModel) return;

        const price = sellingPrice || selectedModel.mrt;
        const mileageLabel = mileage === 12000 ? '12K' : mileage === 15000 ? '15K' : '18K';

        const message = `🚗 *Cotización de Lease - Toyota Financial*

📋 *Vehículo:* ${selectedModel.name}
💰 Precio: $${price.toLocaleString()}
${result.bonus > 0 ? `🎁 Bonus: -$${result.bonus.toLocaleString()}\n` : ''}
⭐ *Crédito:* ${currentTier.label} (${creditScore})
📈 APR Efectivo: ${result.apr.toFixed(2)}%
📊 Residual: ${result.residualPercent}%

📅 Plazo: ${term} meses
🛣️ Millas: ${mileageLabel}/año
📥 Down: $${downPayment.toLocaleString()}
${tradeIn > 0 ? `🔄 Trade-in: $${tradeIn.toLocaleString()}\n` : ''}
💵 Admin Fee: $${TOYOTA_FINANCE_DATA.adminFee}

━━━━━━━━━━━━━━━━━━━
✨ *PAGO MENSUAL: $${result.totalMonthlyPayment.toLocaleString()}*
(Incluye 6% FL Sales Tax)
━━━━━━━━━━━━━━━━━━━

📌 *Desglose:*
• Depreciación: $${result.depreciation.toLocaleString()}/mes
• Cargo financiero: $${result.financeCharge.toLocaleString()}/mes
• Valor Residual: $${result.residualValue.toLocaleString()}

⚠️ _Cotización basada en datos oficiales de Toyota Financial Services. Sujeto a aprobación crediticia. Los términos finales pueden variar._

¿Deseas agendar una cita?`;

        try {
            await onSend(message);
            onClose();
            toast.success('Cotización Toyota enviada');
        } catch (error) {
            console.error(error);
            toast.error('Error enviando cotización');
        }
    };

    if (!isOpen) return null;

    const termOptions = [24, 36, 39, 48, 60];
    const mileageOptions = [12000, 15000, 18000];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-neutral-900 w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl max-h-[95vh] overflow-y-auto">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-neutral-900 z-20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-600/20 rounded-lg">
                            <img src="/inventory/toyota/logo.png" alt="Toyota" className="w-6 h-6" onError={(e) => e.target.style.display = 'none'} />
                            <Calculator className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Toyota Lease Calculator</h2>
                            <p className="text-xs text-gray-400">Datos oficiales SET Finance • Ene 2026</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-5">

                    {/* Model Search */}
                    <div className="relative">
                        <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                            <Car className="w-4 h-4" /> Seleccionar Modelo 2026
                        </label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowModelList(true);
                                }}
                                onFocus={() => setShowModelList(true)}
                                placeholder="Buscar modelo (ej: RAV4, Camry, Tacoma...)"
                                className="w-full bg-neutral-800 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-red-500"
                            />
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        </div>

                        {/* Dropdown */}
                        {showModelList && (
                            <div className="absolute z-30 w-full mt-1 bg-neutral-800 border border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                {filteredModels.map((model, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectModel(model)}
                                        className="w-full px-4 py-3 text-left hover:bg-white/10 flex justify-between items-center border-b border-white/5 last:border-0"
                                    >
                                        <span className="text-white text-sm">{model.name}</span>
                                        <span className="text-gray-400 text-xs">${model.mrt.toLocaleString()}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selected Model Info */}
                    {selectedModel && (
                        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl flex justify-between items-center">
                            <div>
                                <p className="text-white font-medium">{selectedModel.name}</p>
                                <p className="text-xs text-gray-400">MRT: ${selectedModel.mrt.toLocaleString()} • Código: {selectedModel.code}</p>
                            </div>
                            {selectedModel.bonus && (
                                <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full font-medium">
                                    -${selectedModel.bonus.toLocaleString()} Bonus
                                </span>
                            )}
                        </div>
                    )}

                    {/* Credit Score */}
                    <div className={`p-4 rounded-xl border ${currentTier ? 'border-white/10' : 'border-red-500/50'} bg-neutral-800/50`}>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm text-gray-300 flex items-center gap-2">
                                <Star className="w-4 h-4" /> Puntaje Crediticio
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-white">{creditScore}</span>
                                {currentTier && (
                                    <span className={`text-sm px-2 py-0.5 rounded-full ${creditScore >= 720 ? 'bg-green-500/20 text-green-400' :
                                            creditScore >= 680 ? 'bg-blue-500/20 text-blue-400' :
                                                creditScore >= 650 ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-orange-500/20 text-orange-400'
                                        }`}>
                                        {currentTier.label}
                                    </span>
                                )}
                            </div>
                        </div>
                        <input
                            type="range"
                            min="600"
                            max="850"
                            value={creditScore}
                            onChange={(e) => setCreditScore(parseInt(e.target.value))}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #f97316, #eab308 25%, #3b82f6 60%, #22c55e 100%)`
                            }}
                        />
                        {currentTier && (
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Money Factor: {currentTier.moneyFactor} → APR: {(currentTier.moneyFactor * 2400).toFixed(2)}%
                            </p>
                        )}
                    </div>

                    {/* Selling Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Precio de Venta</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    value={sellingPrice}
                                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-neutral-800 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-red-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Down Payment
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    value={downPayment}
                                    onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-neutral-800 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-red-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Trade-in */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Trade-in Value (opcional)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                value={tradeIn}
                                onChange={(e) => setTradeIn(parseFloat(e.target.value) || 0)}
                                className="w-full bg-neutral-800 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-red-500"
                            />
                        </div>
                    </div>

                    {/* Term & Mileage */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Plazo
                            </label>
                            <div className="flex gap-2">
                                {termOptions.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTerm(t)}
                                        className={`flex-1 py-2 px-1 rounded-lg text-sm font-medium transition-colors ${term === t
                                                ? 'bg-red-600 text-white'
                                                : 'bg-neutral-800 text-gray-400 hover:bg-neutral-700'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Millas/Año</label>
                            <div className="flex gap-2">
                                {mileageOptions.map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMileage(m)}
                                        className={`flex-1 py-2 px-1 rounded-lg text-sm font-medium transition-colors ${mileage === m
                                                ? 'bg-red-600 text-white'
                                                : 'bg-neutral-800 text-gray-400 hover:bg-neutral-700'
                                            }`}
                                    >
                                        {(m / 1000)}K
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {result && (
                    <div className="mx-6 mb-4 p-5 bg-gradient-to-br from-red-900/30 to-red-800/20 rounded-xl border border-red-500/30">
                        <div className="text-center mb-4">
                            <p className="text-gray-400 text-sm mb-1">Pago Mensual (con 6% Tax)</p>
                            <p className="text-5xl font-bold text-red-400">
                                ${result.totalMonthlyPayment.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Base: ${result.basePayment.toLocaleString()} + Tax: ${result.monthlyTax.toLocaleString()}
                            </p>
                        </div>

                        <div className="grid grid-cols-4 gap-3 text-center text-sm">
                            <div>
                                <p className="text-gray-500">Cap Cost</p>
                                <p className="text-white font-medium">${result.capCost.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Residual</p>
                                <p className="text-white font-medium">${result.residualValue.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Residual %</p>
                                <p className="text-red-400 font-medium">{result.residualPercent}%</p>
                            </div>
                            <div>
                                <p className="text-gray-500">APR</p>
                                <p className="text-red-400 font-medium">{result.apr.toFixed(2)}%</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Disclaimer */}
                <div className="mx-6 mb-4 p-3 bg-amber-900/20 border border-amber-500/20 rounded-xl flex items-start gap-3">
                    <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200">
                        Cálculos basados en datos oficiales de <strong>Toyota Financial Services - SET Finance</strong> (Enero 2026).
                        Admin Fee: ${TOYOTA_FINANCE_DATA.adminFee}. Sujeto a aprobación crediticia.
                    </p>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-white/10 flex gap-3 sticky bottom-0 bg-neutral-900">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-colors"
                    >
                        Cerrar
                    </button>
                    <button
                        onClick={handleSendQuote}
                        disabled={!result}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center gap-2 transition-colors font-medium"
                    >
                        <Send className="w-4 h-4" />
                        Enviar Cotización
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ToyotaLeaseCalculator;
