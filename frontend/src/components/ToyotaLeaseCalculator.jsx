import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, DollarSign, Star, Send, Car, Search, ChevronDown, Info, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    TOYOTA_FINANCE_DATA,
    getCreditTier,
    getCreditTierNumber,
    getMoneyFactor,
    findSpecialLeaseProgram
} from '../data/toyotaFinanceData';

// Florida Lease Fees
const FLORIDA_LEASE_FEES = {
    adminFee: { name: "Admin Fee (SET Finance)", amount: 695, required: true },
    docFee: { name: "Doc Fee / E-Filing", amount: 799, required: true },
    tagTitle: { name: "Tag, Title & Initial Reg.", amount: 395, required: true },
    salesTaxRate: 0.06, // 6% Florida sales tax (applied monthly)
};

const ToyotaLeaseCalculator = ({ isOpen, onClose, onSend }) => {
    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModelCode, setSelectedModelCode] = useState(null);
    const [showModelList, setShowModelList] = useState(false);
    const [creditScore, setCreditScore] = useState(720);
    const [term, setTerm] = useState(39);
    const [mileage, setMileage] = useState(15000);
    const [downPayment, setDownPayment] = useState(3000);
    const [tradeIn, setTradeIn] = useState(0);
    const [sellingPrice, setSellingPrice] = useState(0);
    const [result, setResult] = useState(null);

    // Optional Fees state
    const [includedFees, setIncludedFees] = useState({
        adminFee: true,
        docFee: true,
        tagTitle: true,
    });

    // Get model list from data
    const modelList = useMemo(() => {
        return Object.entries(TOYOTA_FINANCE_DATA.models).map(([code, data]) => ({
            code,
            ...data
        }));
    }, []);

    // Filtered models based on search
    const filteredModels = useMemo(() => {
        if (!searchTerm) return modelList.slice(0, 25);
        return modelList.filter(m =>
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.code.includes(searchTerm)
        ).slice(0, 25);
    }, [searchTerm, modelList]);

    // Get selected model data
    const selectedModel = useMemo(() => {
        if (!selectedModelCode) return null;
        return TOYOTA_FINANCE_DATA.models[selectedModelCode];
    }, [selectedModelCode]);

    // Get credit tier info
    const tierInfo = useMemo(() => getCreditTier(creditScore), [creditScore]);
    const tierNumber = useMemo(() => getCreditTierNumber(creditScore), [creditScore]);

    // Check for special program
    const specialProgram = useMemo(() => {
        if (!selectedModelCode) return null;
        return findSpecialLeaseProgram(selectedModelCode, term);
    }, [selectedModelCode, term]);

    // Calculate total upfront fees
    const totalUpfrontFees = useMemo(() => {
        let total = 0;
        if (includedFees.docFee) total += FLORIDA_LEASE_FEES.docFee.amount;
        if (includedFees.tagTitle) total += FLORIDA_LEASE_FEES.tagTitle.amount;
        return total;
    }, [includedFees]);

    // Calculate lease
    useEffect(() => {
        if (!selectedModel || !tierNumber) {
            setResult(null);
            return;
        }

        const price = sellingPrice || selectedModel.mrt;
        const mrt = selectedModel.mrt;
        const adminFee = includedFees.adminFee ? FLORIDA_LEASE_FEES.adminFee.amount : 0;

        // Gross Cap Cost 
        const grossCapCost = price + adminFee;

        // Cap cost reductions
        const bonus = selectedModel.bonus || 0;
        const capCostReduction = downPayment + tradeIn + bonus;

        // Adjusted Cap Cost
        const adjustedCapCost = grossCapCost - capCostReduction;

        // Calculate LTV  
        const ltv = (adjustedCapCost / price) * 100;

        // Get residual % for term and mileage
        let residualPercent = selectedModel.residuals?.[term] || selectedModel.residuals?.[36] || 50;

        // Adjust for mileage
        const mileageAdjustments = { 12000: 2, 15000: 0, 18000: -2 };
        residualPercent += mileageAdjustments[mileage] || 0;

        // Get money factor
        const mfResult = getMoneyFactor(selectedModelCode, tierNumber, ltv, term);

        if (!mfResult || !mfResult.moneyFactor) {
            setResult({ error: "LTV muy alto o tier no elegible" });
            return;
        }

        const { moneyFactor, isSpecial, programName } = mfResult;

        // Residual value (based on lower of selling price or MRT)
        const residualBase = Math.min(price, mrt);
        const residualValue = Math.round(residualBase * (residualPercent / 100));

        // Depreciation (monthly)
        const depreciation = (adjustedCapCost - residualValue) / term;

        // Finance charge (money factor × (cap cost + residual))
        const financeCharge = (adjustedCapCost + residualValue) * moneyFactor;

        // Base monthly payment
        const basePayment = depreciation + financeCharge;

        // Florida sales tax (6% on monthly payment)
        const monthlyTax = basePayment * FLORIDA_LEASE_FEES.salesTaxRate;
        const totalMonthlyPayment = basePayment + monthlyTax;

        // Due at signing
        const dueAtSigning = downPayment + totalUpfrontFees + totalMonthlyPayment;

        setResult({
            grossCapCost: Math.round(grossCapCost),
            capCostReduction: Math.round(capCostReduction),
            adjustedCapCost: Math.round(adjustedCapCost),
            residualValue,
            residualPercent,
            depreciation: Math.round(depreciation * 100) / 100,
            financeCharge: Math.round(financeCharge * 100) / 100,
            basePayment: Math.round(basePayment * 100) / 100,
            monthlyTax: Math.round(monthlyTax * 100) / 100,
            totalMonthlyPayment: Math.round(totalMonthlyPayment),
            dueAtSigning: Math.round(dueAtSigning),
            moneyFactor,
            isSpecial,
            programName,
            ltv: Math.round(ltv),
            bonus,
            adminFee,
            upfrontFees: totalUpfrontFees
        });

    }, [selectedModel, selectedModelCode, creditScore, term, mileage, downPayment, tradeIn, sellingPrice, tierNumber, includedFees, totalUpfrontFees]);

    // Handle model selection
    const handleSelectModel = (model) => {
        setSelectedModelCode(model.code);
        setSellingPrice(model.mrt);
        setShowModelList(false);
        setSearchTerm(model.name);
    };

    // Toggle fee
    const toggleFee = (feeKey) => {
        if (FLORIDA_LEASE_FEES[feeKey]?.required) return; // Can't toggle required fees
        setIncludedFees(prev => ({ ...prev, [feeKey]: !prev[feeKey] }));
    };

    // Format money factor as percentage equivalent
    const mfToAPREquivalent = (mf) => (mf * 2400).toFixed(2);

    // Send quote to client
    const handleSendQuote = async () => {
        if (!result || result.error || !selectedModel) return;

        const price = sellingPrice || selectedModel.mrt;

        let feesBreakdown = '';
        if (result.adminFee > 0) feesBreakdown += `• Admin Fee: $${result.adminFee}\n`;
        if (includedFees.docFee) feesBreakdown += `• Doc Fee: $${FLORIDA_LEASE_FEES.docFee.amount}\n`;
        if (includedFees.tagTitle) feesBreakdown += `• Tag/Title/Reg: $${FLORIDA_LEASE_FEES.tagTitle.amount}\n`;

        const message = `🚗 *Cotización de Lease - Toyota Financial Services*

📋 *Vehículo:* ${selectedModel.name}
💰 Precio: $${price.toLocaleString()}
${result.bonus > 0 ? `🎁 *Bonus Lease Cash: $${result.bonus.toLocaleString()}*\n` : ''}

⭐ *Crédito:* ${tierInfo.label} - ${tierInfo.description} (${creditScore})
${result.isSpecial ? `🔥 *PROGRAMA ESPECIAL ${term} MESES*\n` : ''}
📈 Money Factor: ${result.moneyFactor.toFixed(5)} (~${mfToAPREquivalent(result.moneyFactor)}% equiv.)

📅 Plazo: ${term} meses
🛣️ Millas: ${(mileage / 1000).toFixed(0)}K/año

━━━━━━━━━━━━━━━━━━━
📦 *DESGLOSE MENSUAL:*
• Depreciación: $${result.depreciation.toLocaleString()}
• Cargo Financiero: $${result.financeCharge.toLocaleString()}
• Subtotal: $${result.basePayment.toLocaleString()}
• Tax FL 6%: $${result.monthlyTax.toLocaleString()}

✨ *PAGO MENSUAL: $${result.totalMonthlyPayment.toLocaleString()}*
━━━━━━━━━━━━━━━━━━━

💵 *DEBIDO AL FIRMAR:*
• Down Payment: $${downPayment.toLocaleString()}
${feesBreakdown}• Primer Pago: $${result.totalMonthlyPayment.toLocaleString()}
---
📍 *TOTAL DUE AT SIGNING: $${result.dueAtSigning.toLocaleString()}*

📊 Residual: $${result.residualValue.toLocaleString()} (${result.residualPercent}%)
${tierNumber <= 2 ? '✅ SIN depósito de seguridad' : '⚠️ Requiere depósito de seguridad'}

⚠️ _Cotización basada en datos oficiales SET Finance Florida (Ene 2026). Sujeto a aprobación crediticia._

¿Deseas agendar una cita?`;

        try {
            await onSend(message);
            onClose();
            toast.success('Cotización de lease enviada');
        } catch (error) {
            console.error(error);
            toast.error('Error enviando cotización');
        }
    };

    if (!isOpen) return null;

    const termOptions = [24, 36, 39, 48, 60];
    const mileageOptions = [12000, 15000, 18000];

    // Get tier color
    const getTierColor = (score) => {
        if (score >= 720) return "text-green-400";
        if (score >= 680) return "text-blue-400";
        if (score >= 650) return "text-yellow-400";
        if (score >= 600) return "text-orange-400";
        return "text-red-400";
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-neutral-900 w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl max-h-[95vh] overflow-y-auto">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-neutral-900 z-20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-600/20 rounded-lg">
                            <Car className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Toyota Lease Calculator</h2>
                            <p className="text-xs text-gray-400">SET Finance Florida • Ene 2026</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-5 space-y-4">

                    {/* Model Search */}
                    <div className="relative">
                        <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                            <Car className="w-4 h-4" /> Seleccionar Modelo
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
                                {filteredModels.map((model, idx) => {
                                    const hasBonus = model.bonus && model.bonus > 0;
                                    const hasSpecial = findSpecialLeaseProgram(model.code, term);
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectModel(model)}
                                            className="w-full px-4 py-3 text-left hover:bg-white/10 flex justify-between items-center border-b border-white/5 last:border-0"
                                        >
                                            <div className="flex items-center gap-2 flex-1">
                                                <span className="text-gray-500 text-xs font-mono">{model.code}</span>
                                                <span className="text-white text-sm truncate">{model.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {hasBonus && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-green-600 text-white rounded">+${(model.bonus / 1000)}K</span>
                                                )}
                                                {hasSpecial && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-red-600 text-white rounded">SPECIAL</span>
                                                )}
                                                <span className="text-gray-400 text-xs">${model.mrt.toLocaleString()}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Selected Model Info */}
                    {selectedModel && (
                        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-white font-medium">{selectedModel.name}</p>
                                    <p className="text-xs text-gray-400">MRT: ${selectedModel.mrt.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    {specialProgram && (
                                        <span className="px-3 py-1 bg-red-600 text-white text-xs rounded-full font-medium">
                                            SPECIAL LEASE
                                        </span>
                                    )}
                                    {selectedModel.bonus && (
                                        <p className="text-sm text-green-400 mt-1 font-medium">+${selectedModel.bonus.toLocaleString()} Bonus</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Credit Score */}
                    <div className="p-4 rounded-xl border border-white/10 bg-neutral-800/50">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm text-gray-300 flex items-center gap-2">
                                <Star className="w-4 h-4" /> Puntaje Crediticio
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-white">{creditScore}</span>
                                {tierInfo && (
                                    <span className={`text-sm px-2 py-0.5 rounded-full bg-white/10 ${getTierColor(creditScore)}`}>
                                        {tierInfo.label}
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
                                background: `linear-gradient(to right, #ef4444, #f97316 15%, #eab308 30%, #3b82f6 60%, #22c55e 100%)`
                            }}
                        />
                        {result && !result.error && (
                            <div className="mt-3 flex justify-between text-xs text-gray-400">
                                <span>Money Factor: <span className="text-white font-mono">{result.moneyFactor.toFixed(5)}</span></span>
                                <span>≈ {mfToAPREquivalent(result.moneyFactor)}% APR equiv.</span>
                            </div>
                        )}
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
                                <Calendar className="w-4 h-4" /> Plazo (meses)
                            </label>
                            <div className="flex gap-1">
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
                                        className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-colors ${mileage === m
                                                ? 'bg-red-600 text-white'
                                                : 'bg-neutral-800 text-gray-400 hover:bg-neutral-700'
                                            }`}
                                    >
                                        {m / 1000}K
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Florida Fees for Lease */}
                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-900/10">
                        <p className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                            📋 Cargos Florida (Lease)
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(FLORIDA_LEASE_FEES).filter(([key]) => key !== 'salesTaxRate').map(([key, fee]) => (
                                <button
                                    key={key}
                                    onClick={() => toggleFee(key)}
                                    className={`flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${includedFees[key]
                                            ? 'bg-amber-600/30 text-white border border-amber-500/50'
                                            : 'bg-neutral-800 text-gray-400 border border-transparent'
                                        } ${fee.required ? 'cursor-default' : 'cursor-pointer hover:bg-amber-600/20'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded flex items-center justify-center ${includedFees[key] ? 'bg-amber-500' : 'bg-neutral-700'
                                            }`}>
                                            {includedFees[key] && <Check className="w-3 h-3 text-black" />}
                                        </div>
                                        <span className="text-xs">{fee.name}</span>
                                    </div>
                                    <span className="text-xs font-medium">${fee.amount}</span>
                                </button>
                            ))}
                            <div className="flex items-center justify-between p-2 rounded-lg bg-green-600/20 text-green-300 border border-green-500/30">
                                <span className="text-xs">Sales Tax FL 6%</span>
                                <span className="text-xs font-medium">En pago mensual</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {result && !result.error && (
                    <div className="mx-5 mb-4 p-5 bg-gradient-to-br from-red-900/30 to-red-800/20 rounded-xl border border-red-500/30">
                        <div className="text-center mb-4">
                            <p className="text-gray-400 text-sm mb-1">Pago Mensual (incl. 6% Tax)</p>
                            <p className="text-5xl font-bold text-red-400">
                                ${result.totalMonthlyPayment.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                Base: ${result.basePayment.toLocaleString()} + Tax: ${result.monthlyTax.toLocaleString()}
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center text-sm mb-4">
                            <div>
                                <p className="text-gray-500">Cap Cost</p>
                                <p className="text-white font-medium">${result.adjustedCapCost.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Residual</p>
                                <p className="text-white font-medium">${result.residualValue.toLocaleString()} ({result.residualPercent}%)</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Money Factor</p>
                                <p className={result.isSpecial ? "text-green-400 font-bold" : "text-white font-medium"}>
                                    {result.moneyFactor.toFixed(5)}
                                </p>
                            </div>
                        </div>

                        {/* Due at Signing */}
                        <div className="p-3 bg-black/30 rounded-lg border border-white/10">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300 text-sm">💵 Due at Signing:</span>
                                <span className="text-xl font-bold text-white">${result.dueAtSigning.toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Down ${downPayment.toLocaleString()} + Fees ${result.upfrontFees.toLocaleString()} + 1er Pago ${result.totalMonthlyPayment.toLocaleString()}
                            </p>
                        </div>

                        {result.isSpecial && (
                            <div className="mt-3 text-center">
                                <span className="inline-block px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                                    🔥 Programa Especial: {result.programName}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {result && result.error && (
                    <div className="mx-5 mb-4 p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-center">
                        <p className="text-red-400">{result.error}</p>
                    </div>
                )}

                {/* Info */}
                <div className="mx-5 mb-4 p-3 bg-amber-900/20 border border-amber-500/20 rounded-xl flex items-start gap-3">
                    <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200">
                        Cálculos basados en SET Finance Florida (Ene 2026). Tax 6% aplicado al pago mensual.
                        {tierNumber <= 2 ? ' Sin depósito de seguridad.' : ' Requiere depósito de seguridad.'}
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
                        disabled={!result || result.error}
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
