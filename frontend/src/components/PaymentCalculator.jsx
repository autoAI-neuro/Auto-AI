import React, { useState, useEffect } from 'react';
import { X, Calculator, DollarSign, Calendar, Percent, Send, Car, Star, FileText, Shield, AlertTriangle } from 'lucide-react';
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

// Florida dealer fees (realistic 2025 values)
const FLORIDA_FEES = [
    { id: 'salesTax', name: 'Sales Tax (FL 6%)', type: 'percent', value: 6, description: 'Impuesto estatal de Florida', required: true },
    { id: 'docFee', name: 'Doc Fee / Electronic Filing', value: 799, description: 'Preparación de documentos', required: true },
    { id: 'tagTitle', name: 'Tag, Title & Registration', value: 495, description: 'DMV fees', required: true },
    { id: 'dealerFee', name: 'Dealer Fee / Pre-Delivery', value: 999, description: 'Cargo del dealer (máx $1,000 en FL)', required: false },
    { id: 'gapInsurance', name: 'GAP Insurance', value: 895, description: 'Protección si el vehículo es total loss', required: false },
    { id: 'extendedWarranty', name: 'Extended Warranty (3yr/36k)', value: 1495, description: 'Garantía extendida básica', required: false },
    { id: 'extendedWarrantyPremium', name: 'Extended Warranty (5yr/60k)', value: 2495, description: 'Garantía extendida premium', required: false },
    { id: 'paintProtection', name: 'Paint Protection / Ceramic', value: 699, description: 'Protección de pintura', required: false },
    { id: 'windowTint', name: 'Window Tint', value: 399, description: 'Polarizado de vidrios', required: false },
    { id: 'loJack', name: 'LoJack / GPS Tracking', value: 695, description: 'Sistema anti-robo', required: false },
];

const getCreditTier = (score) => {
    return CREDIT_TIERS.find(tier => score >= tier.min && score <= tier.max) || CREDIT_TIERS[CREDIT_TIERS.length - 1];
};

const PaymentCalculator = ({ isOpen, onClose, onSend, vehicleInfo = null }) => {
    const [creditScore, setCreditScore] = useState(700);
    const [selectedFees, setSelectedFees] = useState(['salesTax', 'docFee', 'tagTitle']);
    const [formData, setFormData] = useState({
        vehiclePrice: vehicleInfo?.price || 35000,
        downPayment: 5000,
        interestRate: 6.0,
        loanTermMonths: 60,
        tradeInValue: 0
    });

    const [result, setResult] = useState(null);
    const currentTier = getCreditTier(creditScore);

    // Calculate total fees
    const calculateTotalFees = () => {
        let totalFees = 0;
        selectedFees.forEach(feeId => {
            const fee = FLORIDA_FEES.find(f => f.id === feeId);
            if (fee) {
                if (fee.type === 'percent') {
                    totalFees += (formData.vehiclePrice * fee.value) / 100;
                } else {
                    totalFees += fee.value;
                }
            }
        });
        return Math.round(totalFees * 100) / 100;
    };

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
    }, [formData, selectedFees]);

    const calculatePayment = () => {
        const { vehiclePrice, downPayment, interestRate, loanTermMonths, tradeInValue } = formData;
        const totalFees = calculateTotalFees();

        // Total amount including fees
        const totalPrice = vehiclePrice + totalFees;

        // Amount to finance
        const principal = totalPrice - downPayment - tradeInValue;

        if (principal <= 0) {
            setResult({ monthlyPayment: 0, totalPayment: 0, totalInterest: 0, principal: 0, totalFees: 0, outTheDoor: 0 });
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
            principal: Math.round(principal * 100) / 100,
            totalFees: totalFees,
            outTheDoor: Math.round(totalPrice * 100) / 100
        });
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: parseFloat(value) || 0
        }));
    };

    const toggleFee = (feeId) => {
        setSelectedFees(prev =>
            prev.includes(feeId)
                ? prev.filter(id => id !== feeId)
                : [...prev, feeId]
        );
    };

    const handleSendToClient = () => {
        if (!result) return;

        const selectedFeesList = selectedFees.map(feeId => {
            const fee = FLORIDA_FEES.find(f => f.id === feeId);
            if (!fee) return '';
            const amount = fee.type === 'percent'
                ? (formData.vehiclePrice * fee.value) / 100
                : fee.value;
            return `  • ${fee.name}: $${Math.round(amount).toLocaleString()}`;
        }).filter(Boolean).join('\n');

        const message = `💰 *Cotización de Financiamiento*

🚗 ${vehicleInfo ? `${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year}` : 'Vehículo'}
💵 Precio Base: $${formData.vehiclePrice.toLocaleString()}
📥 Enganche: $${formData.downPayment.toLocaleString()}
${formData.tradeInValue > 0 ? `🔄 Trade-in: $${formData.tradeInValue.toLocaleString()}\n` : ''}
📋 *Cargos y Fees:*
${selectedFeesList}
💲 Total Fees: $${result.totalFees.toLocaleString()}

🏷️ *Precio Out-The-Door*: $${result.outTheDoor.toLocaleString()}
📊 *A financiar*: $${result.principal.toLocaleString()}
📅 Plazo: ${formData.loanTermMonths} meses
📈 Tasa: ${formData.interestRate}% APR
⭐ Crédito: ${currentTier.label} (${creditScore})

✨ *Pago Mensual Estimado: $${result.monthlyPayment.toLocaleString()}*

⚠️ _IMPORTANTE: Esta es una cotización APROXIMADA. Los montos finales pueden variar según verificación de crédito, promociones vigentes y términos del financiero. Sujeto a aprobación._

¿Te gustaría agendar una cita para revisar los números exactos?`;

        onSend(message);
        onClose();
        toast.success('Cotización enviada al cliente');
    };

    if (!isOpen) return null;

    const termOptions = [24, 36, 48, 60, 72, 84];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-neutral-900 w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl max-h-[95vh] overflow-y-auto">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-neutral-900 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <Calculator className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Calculadora de Cuotas</h2>
                            <p className="text-sm text-gray-400">Florida Dealer - Cotización Completa</p>
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

                    {/* Vehicle Price & Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
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
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Enganche (Down)
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
                    </div>

                    {/* Trade-in, APR & Term */}
                    <div className="grid grid-cols-3 gap-4">
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
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                                <Percent className="w-4 h-4" /> Tasa APR
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
                                <Calendar className="w-4 h-4" /> Plazo
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

                    {/* Florida Dealer Fees Section */}
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-900/10">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-amber-400" />
                            <h3 className="text-white font-medium">Cargos, Impuestos y Fees (Florida)</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {FLORIDA_FEES.map(fee => {
                                const isSelected = selectedFees.includes(fee.id);
                                const amount = fee.type === 'percent'
                                    ? Math.round((formData.vehiclePrice * fee.value) / 100)
                                    : fee.value;

                                return (
                                    <label
                                        key={fee.id}
                                        className={`
                                            flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                                            ${isSelected
                                                ? 'bg-amber-500/20 border-amber-500/50'
                                                : 'bg-neutral-800/50 border-white/5 hover:border-white/20'}
                                            ${fee.required ? 'opacity-90' : ''}
                                        `}
                                    >
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleFee(fee.id)}
                                                className="w-4 h-4 rounded border-gray-600 text-amber-500 focus:ring-amber-500 bg-neutral-700"
                                            />
                                            <div>
                                                <span className="text-sm text-white">{fee.name}</span>
                                                {fee.required && <span className="text-xs text-amber-400 ml-1">*</span>}
                                            </div>
                                        </div>
                                        <span className={`text-sm font-mono ${isSelected ? 'text-amber-400' : 'text-gray-500'}`}>
                                            ${amount.toLocaleString()}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>

                        <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center">
                            <span className="text-sm text-gray-400">Total Fees Seleccionados:</span>
                            <span className="text-lg font-bold text-amber-400">${calculateTotalFees().toLocaleString()}</span>
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                            <span className="text-amber-400">*</span> = Cargos típicos incluidos. Precios aproximados segundo trimestre 2025.
                        </p>
                    </div>
                </div>

                {/* Results */}
                {result && (
                    <div className="mx-6 mb-4 p-5 bg-gradient-to-br from-green-900/30 to-emerald-900/20 rounded-xl border border-green-500/20">
                        <div className="text-center mb-4">
                            <p className="text-gray-400 text-sm mb-1">Pago Mensual Estimado</p>
                            <p className="text-4xl font-bold text-green-400">
                                ${result.monthlyPayment.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Con crédito <span className={currentTier.color}>{currentTier.label}</span> @ {formData.interestRate}% APR
                            </p>
                        </div>

                        <div className="grid grid-cols-4 gap-3 text-center text-sm">
                            <div>
                                <p className="text-gray-500">Precio Base</p>
                                <p className="text-white font-medium">${formData.vehiclePrice.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">+ Fees</p>
                                <p className="text-amber-400 font-medium">${result.totalFees.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Out-The-Door</p>
                                <p className="text-white font-medium">${result.outTheDoor.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">A Financiar</p>
                                <p className="text-green-400 font-medium">${result.principal.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Disclaimer */}
                <div className="mx-6 mb-4 p-3 bg-red-900/20 border border-red-500/20 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-200">
                        <strong>IMPORTANTE:</strong> Esta es una cotización APROXIMADA con fines informativos.
                        Los montos finales pueden variar según verificación de crédito, promociones vigentes,
                        términos del financiero y condiciones del vehículo. Sujeto a aprobación crediticia.
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
                        onClick={handleSendToClient}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center gap-2 transition-colors font-medium"
                    >
                        <Send className="w-4 h-4" />
                        Enviar Cotización
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentCalculator;
