import React, { useState, useEffect, useMemo } from 'react';
import { X, Calculator, DollarSign, Calendar, Star, Send, Car, Search, ChevronDown, Info, Percent, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { TOYOTA_FINANCE_DATA, getCreditTier, getCreditTierNumber } from '../data/toyotaFinanceData';

const ToyotaRetailCalculator = ({ isOpen, onClose, onSend }) => {
    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModel, setSelectedModel] = useState(null);
    const [showModelList, setShowModelList] = useState(false);
    const [creditScore, setCreditScore] = useState(720);
    const [term, setTerm] = useState(60);
    const [downPayment, setDownPayment] = useState(5000);
    const [tradeIn, setTradeIn] = useState(0);
    const [sellingPrice, setSellingPrice] = useState(0);
    const [result, setResult] = useState(null);

    // Get all models as array
    const modelList = useMemo(() => {
        return Object.entries(TOYOTA_FINANCE_DATA.models).map(([code, data]) => ({
            code,
            name: data.name,
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

    // Get credit tier (1-4) based on score
    const getCreditTierNumber = (score) => {
        if (score >= 720) return 1;
        if (score >= 680) return 2;
        if (score >= 650) return 3;
        if (score >= 600) return 4;
        return 4;
    };

    const getTierLabel = (score) => {
        if (score >= 740) return { label: "Tier 1+ (Excelente)", color: "text-green-400" };
        if (score >= 720) return { label: "Tier 1 (Muy Bueno)", color: "text-green-400" };
        if (score >= 680) return { label: "Tier 2 (Bueno)", color: "text-blue-400" };
        if (score >= 650) return { label: "Tier 3 (Regular)", color: "text-yellow-400" };
        if (score >= 600) return { label: "Tier 4 (Bajo)", color: "text-orange-400" };
        return { label: "Below Tier 4", color: "text-red-400" };
    };

    // Find special APR program for model
    const findSpecialAPR = (modelName) => {
        const programs = TOYOTA_FINANCE_DATA.specialAPRPrograms;

        // Try to find a matching program
        for (const [programName, data] of Object.entries(programs)) {
            // Check if model name contains key words from program
            const programKey = programName.replace("2026 ", "").replace("2025 ", "").toUpperCase();
            if (modelName.toUpperCase().includes(programKey) ||
                modelName.toUpperCase().includes(programKey.replace(" ", ""))) {
                return { programName, ...data };
            }
        }
        return null;
    };

    // Get standard retail rate based on FICO and LTV
    const getStandardRate = (score, ltv) => {
        const rates = TOYOTA_FINANCE_DATA.standardRetailRates;

        // Determine LTV bucket
        let ltvBucket;
        if (ltv <= 93) ltvBucket = rates.ltvLow;
        else if (ltv <= 123) ltvBucket = rates.ltvMid;
        else if (ltv <= 133) ltvBucket = rates.ltvHigh;
        else ltvBucket = rates.ltvVeryHigh;

        // Determine FICO bucket
        if (score >= 740) return ltvBucket["740+"];
        if (score >= 720) return ltvBucket["720-739"];
        if (score >= 700) return ltvBucket["700-719"];
        if (score >= 680) return ltvBucket["680-699"];
        if (score >= 660) return ltvBucket["660-679"];
        return 12.99; // Default for <660
    };

    // Calculate when inputs change
    useEffect(() => {
        if (!selectedModel) {
            setResult(null);
            return;
        }

        const price = sellingPrice || selectedModel.mrt;
        const loanFee = TOYOTA_FINANCE_DATA.loanProcessingFee?.new || 399;
        const amountFinanced = price - downPayment - tradeIn + loanFee;

        // Calculate LTV
        const ltv = (amountFinanced / price) * 100;

        // Check for special APR program
        const specialProgram = findSpecialAPR(selectedModel.name);
        const tierNum = getCreditTierNumber(creditScore);

        let apr;
        let isSpecialRate = false;
        let programName = null;

        if (specialProgram && specialProgram.rates) {
            const tierKey = `tier${tierNum}`;
            const termRates = specialProgram.rates[tierKey];
            if (termRates) {
                // Find closest term
                const availableTerms = [36, 48, 60, 72];
                const closestTerm = availableTerms.reduce((prev, curr) =>
                    Math.abs(curr - term) < Math.abs(prev - term) ? curr : prev
                );
                apr = termRates[closestTerm];
                if (apr !== undefined) {
                    isSpecialRate = true;
                    programName = specialProgram.programName;
                }
            }
        }

        // Fall back to standard rate if no special program
        if (!isSpecialRate) {
            apr = getStandardRate(creditScore, ltv);
        }

        // Calculate monthly payment using amortization formula
        const monthlyRate = apr / 100 / 12;
        let monthlyPayment;

        if (apr === 0) {
            monthlyPayment = amountFinanced / term;
        } else {
            monthlyPayment = amountFinanced * (monthlyRate * Math.pow(1 + monthlyRate, term)) /
                (Math.pow(1 + monthlyRate, term) - 1);
        }

        // Total interest
        const totalPayments = monthlyPayment * term;
        const totalInterest = totalPayments - amountFinanced;

        // Get bonus if applicable
        const bonus = selectedModel.bonus || 0;

        setResult({
            monthlyPayment: Math.round(monthlyPayment * 100) / 100,
            amountFinanced: Math.round(amountFinanced),
            apr,
            isSpecialRate,
            programName,
            totalPayments: Math.round(totalPayments),
            totalInterest: Math.round(totalInterest),
            ltv: Math.round(ltv),
            bonus
        });

    }, [selectedModel, creditScore, term, downPayment, tradeIn, sellingPrice]);

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
        const tierInfo = getTierLabel(creditScore);

        const message = `🚗 *Cotización de Financiamiento - Toyota Financial*

📋 *Vehículo:* ${selectedModel.name}
💰 Precio: $${price.toLocaleString()}
${result.bonus > 0 ? `🎁 Bonus APR Cash: $${result.bonus.toLocaleString()}\n` : ''}
⭐ *Crédito:* ${tierInfo.label} (${creditScore})
${result.isSpecialRate ? `🔥 *TASA ESPECIAL: ${result.apr}% APR*` : `📈 Tasa: ${result.apr}% APR`}

📅 Plazo: ${term} meses
📥 Down Payment: $${downPayment.toLocaleString()}
${tradeIn > 0 ? `🔄 Trade-in: $${tradeIn.toLocaleString()}\n` : ''}
💵 A Financiar: $${result.amountFinanced.toLocaleString()}

━━━━━━━━━━━━━━━━━━━
✨ *PAGO MENSUAL: $${result.monthlyPayment.toLocaleString()}*
━━━━━━━━━━━━━━━━━━━

📊 *Resumen del Préstamo:*
• Total a pagar: $${result.totalPayments.toLocaleString()}
• Interés total: $${result.totalInterest.toLocaleString()}
• LTV: ${result.ltv}%

🏆 *AL FINAL DEL PRÉSTAMO, EL CARRO ES TUYO*

⚠️ _Cotización basada en datos de Toyota Financial Services. Sujeto a aprobación crediticia. Los términos finales pueden variar._

¿Deseas agendar una cita para revisar?`;

        try {
            await onSend(message);
            onClose();
            toast.success('Cotización de financiamiento enviada');
        } catch (error) {
            console.error(error);
            toast.error('Error enviando cotización');
        }
    };

    if (!isOpen) return null;

    const termOptions = [36, 48, 60, 72, 75];
    const tierInfo = getTierLabel(creditScore);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-neutral-900 w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl max-h-[95vh] overflow-y-auto">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-neutral-900 z-20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-600/20 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Toyota Finance Calculator</h2>
                            <p className="text-xs text-gray-400">Préstamo Retail • APR Especiales Ene 2026</p>
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
                                className="w-full bg-neutral-800 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500"
                            />
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        </div>

                        {/* Dropdown */}
                        {showModelList && (
                            <div className="absolute z-30 w-full mt-1 bg-neutral-800 border border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                {filteredModels.map((model, idx) => {
                                    const hasSpecial = findSpecialAPR(model.name);
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectModel(model)}
                                            className="w-full px-4 py-3 text-left hover:bg-white/10 flex justify-between items-center border-b border-white/5 last:border-0"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-white text-sm">{model.name}</span>
                                                {hasSpecial && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-green-600 text-white rounded">APR SPECIAL</span>
                                                )}
                                            </div>
                                            <span className="text-gray-400 text-xs">${model.mrt.toLocaleString()}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Selected Model Info */}
                    {selectedModel && (
                        <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-xl flex justify-between items-center">
                            <div>
                                <p className="text-white font-medium">{selectedModel.name}</p>
                                <p className="text-xs text-gray-400">MSRP: ${selectedModel.mrt.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                {result?.isSpecialRate && (
                                    <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full font-medium animate-pulse">
                                        {result.apr}% APR 🔥
                                    </span>
                                )}
                                {selectedModel.bonus && (
                                    <p className="text-xs text-green-400 mt-1">+${selectedModel.bonus} Bonus Cash</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Credit Score */}
                    <div className="p-4 rounded-xl border border-white/10 bg-neutral-800/50">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm text-gray-300 flex items-center gap-2">
                                <Star className="w-4 h-4" /> Puntaje Crediticio (FICO)
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-white">{creditScore}</span>
                                <span className={`text-sm px-2 py-0.5 rounded-full bg-white/10 ${tierInfo.color}`}>
                                    {tierInfo.label}
                                </span>
                            </div>
                        </div>
                        <input
                            type="range"
                            min="580"
                            max="850"
                            value={creditScore}
                            onChange={(e) => setCreditScore(parseInt(e.target.value))}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #ef4444, #f97316 15%, #eab308 30%, #3b82f6 60%, #22c55e 100%)`
                            }}
                        />
                    </div>

                    {/* Selling Price & Down Payment */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Precio de Venta</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    value={sellingPrice}
                                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-neutral-800 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-green-500"
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
                                    className="w-full bg-neutral-800 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-green-500"
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
                                className="w-full bg-neutral-800 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-green-500"
                            />
                        </div>
                    </div>

                    {/* Term */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Plazo (meses)
                        </label>
                        <div className="flex gap-2">
                            {termOptions.map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTerm(t)}
                                    className={`flex-1 py-2 px-1 rounded-lg text-sm font-medium transition-colors ${term === t
                                        ? 'bg-green-600 text-white'
                                        : 'bg-neutral-800 text-gray-400 hover:bg-neutral-700'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Results */}
                {result && (
                    <div className="mx-6 mb-4 p-5 bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-xl border border-green-500/30">
                        <div className="text-center mb-4">
                            <p className="text-gray-400 text-sm mb-1">Pago Mensual</p>
                            <p className="text-5xl font-bold text-green-400">
                                ${result.monthlyPayment.toLocaleString()}
                            </p>
                            {result.isSpecialRate && (
                                <p className="text-sm text-green-300 mt-1">
                                    🔥 Tasa especial: {result.apr}% APR
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-4 gap-3 text-center text-sm">
                            <div>
                                <p className="text-gray-500">A Financiar</p>
                                <p className="text-white font-medium">${result.amountFinanced.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Total</p>
                                <p className="text-white font-medium">${result.totalPayments.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Interés</p>
                                <p className="text-yellow-400 font-medium">${result.totalInterest.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">APR</p>
                                <p className={result.isSpecialRate ? "text-green-400 font-bold" : "text-white font-medium"}>
                                    {result.apr}%
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/10 text-center">
                            <p className="text-green-300 text-sm font-medium">
                                🏆 Al terminar los {term} meses, ¡EL CARRO ES TUYO!
                            </p>
                        </div>
                    </div>
                )}

                {/* Disclaimer */}
                <div className="mx-6 mb-4 p-3 bg-amber-900/20 border border-amber-500/20 rounded-xl flex items-start gap-3">
                    <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200">
                        Tasas especiales válidas hasta Feb 2, 2026. Programa sujeto a cambios.
                        FL/GA Processing Fee: $399 incluido.
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
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center gap-2 transition-colors font-medium"
                    >
                        <Send className="w-4 h-4" />
                        Enviar Cotización
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ToyotaRetailCalculator;
