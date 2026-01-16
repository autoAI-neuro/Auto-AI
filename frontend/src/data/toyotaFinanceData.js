// Toyota Financial Services Official Data
// Program Period: January 6, 2026 until further notice
// Source: SET Finance Bulletins T-5989/26, T-5987/26, T-5991/26

export const TOYOTA_FINANCE_DATA = {
    // Program info
    programPeriod: "January 6, 2026 - February 2, 2026",
    adminFee: 695,
    maxDealerMarkup: 300,

    // Credit Tiers with Money Factors (Standard Rates)
    creditTiers: {
        tier1: { min: 720, max: 850, label: "Tier 1 (Excelente)", moneyFactor: 0.00296, apr: 7.1 },
        tier2: { min: 680, max: 719, label: "Tier 2 (Muy Bueno)", moneyFactor: 0.00316, apr: 7.58 },
        tier3: { min: 650, max: 679, label: "Tier 3 (Bueno)", moneyFactor: 0.00351, apr: 8.42 },
        tier4: { min: 600, max: 649, label: "Tier 4 (Regular)", moneyFactor: 0.00426, apr: 10.22 }
    },

    // Money Factor adjustments
    moneyFactorAdjustments: {
        term52to60: 0.00060, // Add for 52-60 month terms
        encoreDiscount: -0.00010, // For returning customers
        securityDepositWaiver: 0.00010, // Add to waive deposit
        rateParticipation: 0.00100 // Max dealer participation
    },

    // Security Deposit Rules
    securityDeposit: {
        tier1Required: false,
        tier2Required: false,
        tier3Required: true,
        tier4Required: true,
        minimumDeposit: 300
    },

    // Mileage Options
    mileageOptions: {
        standard: 15000,
        options: [12000, 15000, 18000],
        residualAdjustment: {
            12000: 2,  // Add 2% to residual
            15000: 0,  // Standard
            18000: -2  // Deduct 2% from residual
        },
        excessMileRate: 0.18, // Per mile at end
        prepaidExcessRate: 0.10 // Per mile if purchased upfront
    },

    // Special Bonuses
    bonuses: {
        bz2026: {
            aprCash: 3500,
            leaseCash: 3500,
            models: ["2870", "2872", "2873", "2880", "2882"]
        }
    },

    // ===========================================
    // RETAIL FINANCING (APR) DATA
    // Source: T-5997/26, T-5998/26
    // ===========================================

    // Standard NEW Retail Rates by FICO and LTV (up to 75 months)
    standardRetailRates: {
        // LTV <= 93%
        ltvLow: {
            "740+": 6.24,
            "720-739": 6.74,
            "700-719": 7.74,
            "680-699": 7.99,
            "660-679": 8.19,
            "<660": "Custom"
        },
        // LTV 94-123%
        ltvMid: {
            "740+": 6.44,
            "720-739": 6.89,
            "700-719": 8.04,
            "680-699": 8.59,
            "660-679": 9.59,
            "<660": "Custom"
        },
        // LTV 124-133%
        ltvHigh: {
            "740+": 8.34,
            "720-739": 8.79,
            "700-719": 9.99,
            "680-699": 11.49,
            "660-679": 12.49,
            "<660": "Custom"
        },
        // LTV > 134%
        ltvVeryHigh: {
            "740+": 8.94,
            "720-739": 9.39,
            "700-719": 10.59,
            "680-699": 12.59,
            "660-679": 14.09,
            "<660": "Custom"
        }
    },

    // Available Discounts (can be stacked)
    retailDiscounts: {
        luxuryDiscount: { rate: 0.25, requirement: "Amount Financed > $25,000" },
        encoreDiscount: { rate: 0.25, requirement: "Previous Toyota Finance customer" },
        flatFeeWaiver: { rate: 0.25, requirement: "Waive flat fee" },
        oneSourceWaiver: { rate: 0.25, requirement: "Waive OneSource payout" },
        doubleDown: { rate: 0.75, requirement: "Waive both Flat Fee and OneSource" }
    },

    // Special APR Programs by Model (Promotional Rates)
    // Program Period: Jan 6, 2026 - Feb 2, 2026
    specialAPRPrograms: {
        // 2026 bZ - BEST RATES (0% available!)
        "2026 bZ": {
            bonus: 3500,
            rates: {
                tier1: { 36: 0.00, 48: 0.00, 60: 0.00, 72: 0.00 },
                tier2: { 36: 0.99, 48: 0.99, 60: 0.99, 72: 0.99 },
                tier3: { 36: 1.99, 48: 1.99, 60: 1.99, 72: 1.99 },
                tier4: { 36: 2.99, 48: 2.99, 60: 2.99, 72: 2.99 }
            }
        },
        // 2026 Camry Hybrid
        "2026 CAMRY HYBRID": {
            rates: {
                tier1: { 36: 1.99, 48: 2.99, 60: 3.99, 72: 4.99 },
                tier2: { 36: 2.99, 48: 3.99, 60: 4.99, 72: 5.99 },
                tier3: { 36: 3.99, 48: 4.99, 60: 5.99, 72: 6.99 },
                tier4: { 36: 4.99, 48: 5.99, 60: 6.99, 72: 7.99 }
            }
        },
        // 2026 Corolla (Gas only)
        "2026 COROLLA": {
            rates: {
                tier1: { 36: 3.49, 48: 3.99, 60: 4.49, 72: 4.99 },
                tier2: { 36: 4.49, 48: 4.99, 60: 5.49, 72: 5.99 },
                tier3: { 36: 5.49, 48: 5.99, 60: 6.49, 72: 6.99 },
                tier4: { 36: 6.49, 48: 6.99, 60: 7.49, 72: 7.99 }
            }
        },
        // 2026 Corolla Hybrid
        "2026 COROLLA HYBRID": {
            rates: {
                tier1: { 36: 3.49, 48: 3.99, 60: 4.49, 72: 4.99 },
                tier2: { 36: 4.49, 48: 4.99, 60: 5.49, 72: 5.99 },
                tier3: { 36: 5.49, 48: 5.99, 60: 6.49, 72: 6.99 },
                tier4: { 36: 6.49, 48: 6.99, 60: 7.49, 72: 7.99 }
            }
        },
        // 2026 Prius PHEV
        "2026 PRIUS PHEV": {
            rates: {
                tier1: { 36: 3.99, 48: 3.99, 60: 3.99, 72: 3.99 },
                tier2: { 36: 4.99, 48: 4.99, 60: 4.99, 72: 4.99 },
                tier3: { 36: 5.99, 48: 5.99, 60: 5.99, 72: 5.99 },
                tier4: { 36: 6.99, 48: 6.99, 60: 6.99, 72: 6.99 }
            }
        },
        // 2026 RAV4 Hybrid
        "2026 RAV4 HYBRID": {
            rates: {
                tier1: { 36: 4.99, 48: 4.99, 60: 4.99, 72: 5.99 },
                tier2: { 36: 5.99, 48: 5.99, 60: 5.99, 72: 6.99 },
                tier3: { 36: 6.99, 48: 6.99, 60: 6.99, 72: 7.99 },
                tier4: { 36: 7.99, 48: 7.99, 60: 7.99, 72: 8.54 }
            }
        },
        // 2026 Tacoma (Gas)
        "2026 TACOMA": {
            rates: {
                tier1: { 36: 2.49, 48: 3.49, 60: 3.99, 72: 4.99 },
                tier2: { 36: 3.49, 48: 4.49, 60: 4.99, 72: 5.99 },
                tier3: { 36: 4.49, 48: 5.49, 60: 5.99, 72: 6.99 },
                tier4: { 36: 5.49, 48: 6.49, 60: 6.99, 72: 7.99 }
            }
        },
        // 2026 Tacoma Hybrid
        "2026 TACOMA HYBRID": {
            rates: {
                tier1: { 36: 2.49, 48: 3.49, 60: 3.99, 72: 4.99 },
                tier2: { 36: 3.49, 48: 4.49, 60: 4.99, 72: 5.99 },
                tier3: { 36: 4.49, 48: 5.49, 60: 5.99, 72: 6.99 },
                tier4: { 36: 5.49, 48: 6.49, 60: 6.99, 72: 7.99 }
            }
        },
        // 2026 Tundra (Gas)
        "2026 TUNDRA": {
            rates: {
                tier1: { 36: 2.99, 48: 2.99, 60: 2.99, 72: 2.99 },
                tier2: { 36: 3.99, 48: 3.99, 60: 3.99, 72: 3.99 },
                tier3: { 36: 4.99, 48: 4.99, 60: 4.99, 72: 4.99 },
                tier4: { 36: 5.99, 48: 5.99, 60: 5.99, 72: 5.99 }
            }
        },
        // 2026 Tundra Hybrid
        "2026 TUNDRA HYBRID": {
            rates: {
                tier1: { 36: 2.99, 48: 2.99, 60: 2.99, 72: 2.99 },
                tier2: { 36: 3.99, 48: 3.99, 60: 3.99, 72: 3.99 },
                tier3: { 36: 4.99, 48: 4.99, 60: 4.99, 72: 4.99 },
                tier4: { 36: 5.99, 48: 5.99, 60: 5.99, 72: 5.99 }
            }
        },
        // 2025 RAV4 (Gas)
        "2025 RAV4": {
            rates: {
                tier1: { 36: 3.75, 48: 3.75, 60: 3.75, 72: 3.75 },
                tier2: { 36: 4.75, 48: 4.75, 60: 4.75, 72: 4.75 },
                tier3: { 36: 5.75, 48: 5.75, 60: 5.75, 72: 5.75 },
                tier4: { 36: 6.75, 48: 6.75, 60: 6.75, 72: 6.75 }
            }
        },
        // 2025 RAV4 Hybrid
        "2025 RAV4 HYBRID": {
            rates: {
                tier1: { 36: 3.75, 48: 4.25, 60: 5.25, 72: 5.75 },
                tier2: { 36: 4.75, 48: 5.25, 60: 6.25, 72: 6.75 },
                tier3: { 36: 5.75, 48: 6.25, 60: 7.25, 72: 7.75 },
                tier4: { 36: 6.75, 48: 7.25, 60: 8.25, 72: 8.54 }
            }
        },
        // 2025 Tacoma
        "2025 TACOMA": {
            rates: {
                tier1: { 36: 1.99, 48: 2.99, 60: 3.99, 72: 3.99 },
                tier2: { 36: 2.99, 48: 3.99, 60: 4.99, 72: 4.99 },
                tier3: { 36: 3.99, 48: 4.99, 60: 5.99, 72: 5.99 },
                tier4: { 36: 4.99, 48: 5.99, 60: 6.99, 72: 6.99 }
            }
        },
        // 2025 Tacoma Hybrid
        "2025 TACOMA HYBRID": {
            rates: {
                tier1: { 36: 1.99, 48: 2.99, 60: 3.99, 72: 3.99 },
                tier2: { 36: 2.99, 48: 3.99, 60: 4.99, 72: 4.99 },
                tier3: { 36: 3.99, 48: 4.99, 60: 5.99, 72: 5.99 },
                tier4: { 36: 4.99, 48: 5.99, 60: 6.99, 72: 6.99 }
            }
        },
        // 2025 Tundra
        "2025 TUNDRA": {
            rates: {
                tier1: { 36: 1.99, 48: 1.99, 60: 1.99, 72: 1.99 },
                tier2: { 36: 2.99, 48: 2.99, 60: 2.99, 72: 2.99 },
                tier3: { 36: 3.99, 48: 3.99, 60: 3.99, 72: 3.99 },
                tier4: { 36: 4.99, 48: 4.99, 60: 4.99, 72: 4.99 }
            }
        },
        // 2025 Tundra Hybrid
        "2025 TUNDRA HYBRID": {
            rates: {
                tier1: { 36: 1.99, 48: 1.99, 60: 1.99, 72: 1.99 },
                tier2: { 36: 2.99, 48: 2.99, 60: 2.99, 72: 2.99 },
                tier3: { 36: 3.99, 48: 3.99, 60: 3.99, 72: 3.99 },
                tier4: { 36: 4.99, 48: 4.99, 60: 4.99, 72: 4.99 }
            }
        }
    },

    // Flat Fee Schedule (by Amount Financed)
    flatFeeSchedule: {
        "7500-20000": 150,
        "20001-25000": 200,
        "25001-30000": 250,
        "30001+": 300
    },

    // Florida/Georgia Loan Processing Fee
    loanProcessingFee: {
        new: 150,
        used: 200,
        maxDealerMarkup: 25
    },

    // 2026 Toyota Models - Residuals and MRT
    models2026: {
        // 4RUNNER
        "4RUNNER SR5 2WD": { code: "8642", mrt: 43100, residuals: { 24: 79, 36: 67, 39: 67, 48: 57, 60: 51 } },
        "4RUNNER TRD SPORT 2WD": { code: "8643", mrt: 49600, residuals: { 24: 73, 36: 62, 39: 62, 48: 53, 60: 47 } },
        "4RUNNER TRD SPORT PREMIUM 2WD": { code: "8644", mrt: 55000, residuals: { 24: 70, 36: 60, 39: 60, 48: 51, 60: 45 } },
        "4RUNNER LIMITED 2WD": { code: "8648", mrt: 58100, residuals: { 24: 69, 36: 58, 39: 58, 48: 50, 60: 44 } },
        "4RUNNER SR5 4WD": { code: "8664", mrt: 45900, residuals: { 24: 83, 36: 70, 39: 70, 48: 60, 60: 53 } },
        "4RUNNER LIMITED 4WD": { code: "8668", mrt: 61500, residuals: { 24: 72, 36: 61, 39: 61, 48: 52, 60: 46 } },
        "4RUNNER TRD OFF ROAD 4WD": { code: "8670", mrt: 51500, residuals: { 24: 77, 36: 66, 39: 66, 48: 56, 60: 49 } },
        "4RUNNER TRD SPORT 4WD": { code: "8671", mrt: 51600, residuals: { 24: 76, 36: 65, 39: 65, 48: 55, 60: 50 } },
        "4RUNNER TRD OFF ROAD PREMIUM 4WD": { code: "8672", mrt: 58600, residuals: { 24: 73, 36: 61, 39: 61, 48: 52, 60: 46 } },
        "4RUNNER TRD SPORT PREMIUM 4WD": { code: "8673", mrt: 57000, residuals: { 24: 73, 36: 62, 39: 62, 48: 53, 60: 47 } },
        "4RUNNER HYBRID TRD OFF ROAD": { code: "8628", mrt: 54300, residuals: { 24: 77, 36: 65, 39: 65, 48: 56, 60: 49 } },
        "4RUNNER HYBRID TRD OFF ROAD PREMIUM": { code: "8630", mrt: 60500, residuals: { 24: 73, 36: 62, 39: 62, 48: 53, 60: 47 } },
        "4RUNNER HYBRID LIMITED": { code: "8632", mrt: 62900, residuals: { 24: 72, 36: 61, 39: 61, 48: 52, 60: 46 } },
        "4RUNNER HYBRID TRD PRO": { code: "8634", mrt: 69200, residuals: { 24: 70, 36: 59, 39: 59, 48: 51, 60: 44 } },
        "4RUNNER HYBRID TRAILHUNTER": { code: "8636", mrt: 69200, residuals: { 24: 70, 36: 59, 39: 59, 48: 51, 60: 44 } },
        "4RUNNER HYBRID PLATINUM": { code: "8638", mrt: 65200, residuals: { 24: 70, 36: 60, 39: 60, 48: 51, 60: 45 } },

        // BZ (Electric)
        "BZ XLE PLUS 2WD": { code: "2870", mrt: 39600, residuals: { 24: 50, 36: 39, 39: 39, 48: 26, 60: 18 }, bonus: 3500 },
        "BZ XLE AWD": { code: "2872", mrt: 41600, residuals: { 24: 50, 36: 40, 39: 40, 48: 27, 60: 19 }, bonus: 3500 },
        "BZ XLE 2WD": { code: "2873", mrt: 36300, residuals: { 24: 47, 36: 37, 39: 37, 48: 24, 60: 16 }, bonus: 3500 },
        "BZ LIMITED PLUS 2WD": { code: "2880", mrt: 44700, residuals: { 24: 46, 36: 37, 39: 37, 48: 24, 60: 16 }, bonus: 3500 },
        "BZ LIMITED AWD": { code: "2882", mrt: 46800, residuals: { 24: 46, 36: 37, 39: 37, 48: 25, 60: 17 }, bonus: 3500 },

        // CAMRY HYBRID
        "CAMRY HYBRID XSE": { code: "2557", mrt: 42300, residuals: { 24: 65, 36: 56, 39: 56, 48: 46, 60: 37 } },
        "CAMRY HYBRID NIGHTSHADE": { code: "2558", mrt: 35100, residuals: { 24: 66, 36: 58, 39: 58, 48: 46, 60: 37 } },
        "CAMRY HYBRID LE": { code: "2559", mrt: 32000, residuals: { 24: 68, 36: 59, 39: 59, 48: 47, 60: 38 } },
        "CAMRY HYBRID XLE": { code: "2560", mrt: 38100, residuals: { 24: 64, 36: 56, 39: 56, 48: 45, 60: 37 } },
        "CAMRY HYBRID SE": { code: "2561", mrt: 34100, residuals: { 24: 67, 36: 58, 39: 58, 48: 47, 60: 38 } },
        "CAMRY HYBRID SE NIGHTSHADE AWD": { code: "2551", mrt: 36700, residuals: { 24: 66, 36: 58, 39: 58, 48: 46, 60: 38 } },
        "CAMRY HYBRID LE AWD": { code: "2552", mrt: 33600, residuals: { 24: 68, 36: 59, 39: 59, 48: 47, 60: 38 } },
        "CAMRY HYBRID SE AWD": { code: "2553", mrt: 35700, residuals: { 24: 67, 36: 58, 39: 58, 48: 47, 60: 38 } },
        "CAMRY HYBRID XLE AWD": { code: "2555", mrt: 39600, residuals: { 24: 64, 36: 56, 39: 56, 48: 45, 60: 37 } },
        "CAMRY HYBRID XSE AWD": { code: "2556", mrt: 40500, residuals: { 24: 65, 36: 56, 39: 56, 48: 46, 60: 37 } },

        // COROLLA
        "COROLLA LE": { code: "1852", mrt: 25500, residuals: { 24: 68, 36: 60, 39: 60, 48: 52, 60: 46 } },
        "COROLLA SE": { code: "1864", mrt: 28100, residuals: { 24: 66, 36: 58, 39: 58, 48: 51, 60: 44 } },
        "COROLLA XSE": { code: "1866", mrt: 30500, residuals: { 24: 63, 36: 55, 39: 55, 48: 48, 60: 42 } },

        // COROLLA CROSS
        "COROLLA CROSS L 2WD": { code: "6301", mrt: 27100, residuals: { 24: 63, 36: 56, 39: 56, 48: 44, 60: 35 } },
        "COROLLA CROSS L AWD": { code: "6302", mrt: 28400, residuals: { 24: 64, 36: 57, 39: 57, 48: 45, 60: 36 } },
        "COROLLA CROSS LE 2WD": { code: "6303", mrt: 30800, residuals: { 24: 65, 36: 58, 39: 58, 48: 46, 60: 37 } },
        "COROLLA CROSS LE AWD": { code: "6304", mrt: 32200, residuals: { 24: 65, 36: 58, 39: 58, 48: 46, 60: 37 } },
        "COROLLA CROSS XLE 2WD": { code: "6305", mrt: 34000, residuals: { 24: 65, 36: 58, 39: 58, 48: 46, 60: 38 } },
        "COROLLA CROSS XLE AWD": { code: "6306", mrt: 35400, residuals: { 24: 66, 36: 59, 39: 59, 48: 47, 60: 39 } },

        // COROLLA CROSS HYBRID
        "COROLLA CROSS HYBRID S": { code: "6312", mrt: 31200, residuals: { 24: 65, 36: 58, 39: 58, 48: 46, 60: 37 } },
        "COROLLA CROSS HYBRID SE": { code: "6314", mrt: 34200, residuals: { 24: 64, 36: 58, 39: 58, 48: 47, 60: 38 } },
        "COROLLA CROSS HYBRID XSE": { code: "6316", mrt: 37400, residuals: { 24: 63, 36: 58, 39: 58, 48: 47, 60: 38 } },

        // COROLLA HYBRID
        "COROLLA HYBRID LE": { code: "1882", mrt: 27300, residuals: { 24: 69, 36: 61, 39: 61, 48: 53, 60: 46 } },
        "COROLLA HYBRID LE AWD": { code: "1883", mrt: 28700, residuals: { 24: 70, 36: 61, 39: 61, 48: 53, 60: 46 } },
        "COROLLA HYBRID SE": { code: "1886", mrt: 29800, residuals: { 24: 67, 36: 59, 39: 59, 48: 51, 60: 44 } },
        "COROLLA HYBRID SE AWD": { code: "1887", mrt: 31300, residuals: { 24: 68, 36: 59, 39: 59, 48: 51, 60: 44 } },
        "COROLLA HYBRID XLE": { code: "1892", mrt: 30900, residuals: { 24: 67, 36: 58, 39: 58, 48: 51, 60: 44 } },

        // CROWN
        "CROWN XLE": { code: "4015", mrt: 43000, residuals: { 24: 61, 36: 53, 39: 53, 48: 41, 60: 30 } },
        "CROWN LIMITED": { code: "4020", mrt: 48500, residuals: { 24: 57, 36: 50, 39: 50, 48: 38, 60: 28 } },
        "CROWN NIGHTSHADE": { code: "4025", mrt: 49900, residuals: { 24: 56, 36: 49, 39: 49, 48: 38, 60: 27 } },
        "CROWN PLATINUM": { code: "4030", mrt: 57200, residuals: { 24: 59, 36: 52, 39: 52, 48: 40, 60: 29 } },
        "CROWN SIGNIA XLE": { code: "4040", mrt: 46400, residuals: { 24: 62, 36: 56, 39: 56, 48: 43, 60: 32 } },
        "CROWN SIGNIA LIMITED": { code: "4041", mrt: 50800, residuals: { 24: 59, 36: 53, 39: 53, 48: 41, 60: 31 } },

        // GR COROLLA
        "GR COROLLA AT": { code: "6280", mrt: 44200, residuals: { 24: 72, 36: 66, 39: 66, 48: 54, 60: 45 } },
        "GR COROLLA MT": { code: "6281", mrt: 42200, residuals: { 24: 73, 36: 68, 39: 68, 48: 55, 60: 46 } },
        "GR COROLLA PREMIUM AT": { code: "6286", mrt: 49700, residuals: { 24: 66, 36: 61, 39: 61, 48: 49, 60: 41 } },
        "GR COROLLA PREMIUM MT": { code: "6287", mrt: 47700, residuals: { 24: 67, 36: 62, 39: 62, 48: 50, 60: 42 } },

        // GR SUPRA
        "GR SUPRA 3.0": { code: "2372", mrt: 61900, residuals: { 24: 64, 36: 56, 39: 56, 48: 47, 60: 37 } },
        "GR SUPRA PREMIUM": { code: "2374", mrt: 63100, residuals: { 24: 63, 36: 55, 39: 55, 48: 46, 60: 36 } },
        "GR SUPRA MKV FINAL EDITION AT": { code: "2376", mrt: 70500, residuals: { 24: 58, 36: 51, 39: 51, 48: 42, 60: 33 } },
        "GR SUPRA 3.0 MT": { code: "2383", mrt: 61700, residuals: { 24: 63, 36: 56, 39: 56, 48: 46, 60: 36 } },
        "GR SUPRA PREMIUM MT": { code: "2385", mrt: 63100, residuals: { 24: 62, 36: 54, 39: 54, 48: 45, 60: 36 } },

        // GR86
        "GR86 AT": { code: "6252", mrt: 33500, residuals: { 24: 70, 36: 61, 39: 61, 48: 52, 60: 47 } },
        "GR86 MT": { code: "6253", mrt: 32400, residuals: { 24: 71, 36: 61, 39: 61, 48: 52, 60: 48 } },
        "GR86 PREMIUM AT": { code: "6254", mrt: 36100, residuals: { 24: 69, 36: 60, 39: 60, 48: 51, 60: 46 } },
        "GR86 PREMIUM MT": { code: "6255", mrt: 35000, residuals: { 24: 71, 36: 60, 39: 60, 48: 51, 60: 46 } },

        // GRAND HIGHLANDER
        "GRAND HIGHLANDER LE 2WD": { code: "6700", mrt: 43300, residuals: { 24: 71, 36: 63, 39: 63, 48: 55, 60: 39 } },
        "GRAND HIGHLANDER XLE 2WD": { code: "6702", mrt: 47500, residuals: { 24: 68, 36: 62, 39: 62, 48: 54, 60: 39 } },
        "GRAND HIGHLANDER LIMITED 2WD": { code: "6704", mrt: 52300, residuals: { 24: 68, 36: 61, 39: 61, 48: 54, 60: 39 } },
        "GRAND HIGHLANDER LE AWD": { code: "6706", mrt: 44900, residuals: { 24: 72, 36: 63, 39: 63, 48: 55, 60: 39 } },
        "GRAND HIGHLANDER XLE AWD": { code: "6708", mrt: 49100, residuals: { 24: 68, 36: 62, 39: 62, 48: 54, 60: 39 } },
        "GRAND HIGHLANDER LIMITED AWD": { code: "6710", mrt: 53900, residuals: { 24: 68, 36: 61, 39: 61, 48: 54, 60: 39 } },
        "GRAND HIGHLANDER PLATINUM AWD": { code: "6712", mrt: 56600, residuals: { 24: 66, 36: 60, 39: 60, 48: 53, 60: 38 } },

        // GRAND HIGHLANDER HYBRID
        "GRAND HIGHLANDER HYBRID XLE 2WD": { code: "6716", mrt: 49300, residuals: { 24: 70, 36: 63, 39: 63, 48: 55, 60: 40 } },
        "GRAND HIGHLANDER HYBRID LE AWD": { code: "6720", mrt: 46700, residuals: { 24: 74, 36: 64, 39: 64, 48: 56, 60: 40 } },
        "GRAND HIGHLANDER HYBRID XLE AWD": { code: "6722", mrt: 50900, residuals: { 24: 70, 36: 63, 39: 63, 48: 55, 60: 40 } },
        "GRAND HIGHLANDER HYBRID LIMITED AWD": { code: "6724", mrt: 55700, residuals: { 24: 69, 36: 62, 39: 62, 48: 55, 60: 40 } },
        "GRAND HIGHLANDER HYBRID LIMITED MAX AWD": { code: "6730", mrt: 58700, residuals: { 24: 71, 36: 64, 39: 64, 48: 57, 60: 41 } },
        "GRAND HIGHLANDER HYBRID PLATINUM MAX AWD": { code: "6732", mrt: 61400, residuals: { 24: 69, 36: 62, 39: 62, 48: 55, 60: 40 } },
        "GRAND HIGHLANDER HYBRID NIGHTSHADE AWD": { code: "6733", mrt: 57300, residuals: { 24: 69, 36: 61, 39: 61, 48: 54, 60: 39 } },

        // HIGHLANDER
        "HIGHLANDER XLE AWD": { code: "6953", mrt: 47400, residuals: { 24: 67, 36: 60, 39: 60, 48: 50, 60: 38 } },
        "HIGHLANDER LIMITED AWD": { code: "6956", mrt: 51200, residuals: { 24: 67, 36: 60, 39: 60, 48: 50, 60: 38 } },
        "HIGHLANDER PLATINUM AWD": { code: "6957", mrt: 54400, residuals: { 24: 67, 36: 60, 39: 60, 48: 50, 60: 38 } },
        "HIGHLANDER XSE AWD": { code: "6959", mrt: 51000, residuals: { 24: 69, 36: 62, 39: 62, 48: 52, 60: 39 } },

        // HIGHLANDER HYBRID
        "HIGHLANDER HYBRID XLE AWD": { code: "6965", mrt: 49200, residuals: { 24: 68, 36: 61, 39: 61, 48: 50, 60: 39 } },
        "HIGHLANDER HYBRID LIMITED AWD": { code: "6966", mrt: 53000, residuals: { 24: 68, 36: 61, 39: 61, 48: 51, 60: 39 } },
        "HIGHLANDER HYBRID PLATINUM AWD": { code: "6967", mrt: 55800, residuals: { 24: 68, 36: 61, 39: 61, 48: 50, 60: 39 } },

        // LAND CRUISER
        "LAND CRUISER 1958": { code: "6165", mrt: 59300, residuals: { 24: 70, 36: 60, 39: 60, 48: 45, 60: 34 } },
        "LAND CRUISER": { code: "6167", mrt: 65800, residuals: { 24: 70, 36: 60, 39: 60, 48: 45, 60: 34 } },

        // PRIUS
        "PRIUS NIGHTSHADE": { code: "1216", mrt: 35600, residuals: { 24: 70, 36: 60, 39: 60, 48: 51, 60: 44 } },
        "PRIUS LE": { code: "1223", mrt: 30700, residuals: { 24: 72, 36: 63, 39: 63, 48: 52, 60: 43 } },
        "PRIUS XLE": { code: "1225", mrt: 34800, residuals: { 24: 69, 36: 61, 39: 61, 48: 51, 60: 41 } },
        "PRIUS LIMITED": { code: "1227", mrt: 37200, residuals: { 24: 67, 36: 58, 39: 58, 48: 49, 60: 41 } },
        "PRIUS LE AWD": { code: "1263", mrt: 32200, residuals: { 24: 70, 36: 62, 39: 62, 48: 51, 60: 42 } },
        "PRIUS XLE AWD": { code: "1265", mrt: 36200, residuals: { 24: 69, 36: 60, 39: 60, 48: 50, 60: 41 } },
        "PRIUS NIGHTSHADE AWD": { code: "1266", mrt: 37000, residuals: { 24: 71, 36: 59, 39: 59, 48: 52, 60: 46 } },
        "PRIUS LIMITED AWD": { code: "1268", mrt: 38600, residuals: { 24: 68, 36: 59, 39: 59, 48: 50, 60: 41 } },

        // PRIUS PHEV
        "PRIUS PHEV NIGHTSHADE": { code: "1233", mrt: 40500, residuals: { 24: 68, 36: 60, 39: 61, 48: 51, 60: 43 } },
        "PRIUS PHEV SE": { code: "1235", mrt: 35900, residuals: { 24: 71, 36: 62, 39: 63, 48: 53, 60: 45 } },
        "PRIUS PHEV XSE": { code: "1237", mrt: 39800, residuals: { 24: 69, 36: 60, 39: 61, 48: 52, 60: 43 } },
        "PRIUS PHEV XSE PREMIUM": { code: "1239", mrt: 43200, residuals: { 24: 67, 36: 58, 39: 59, 48: 50, 60: 42 } },

        // RAV4 HYBRID
        "RAV4 HYBRID LE 2WD": { code: "4521", mrt: 33700, residuals: { 24: 75, 36: 67, 39: 67, 48: 58, 60: 53 } },
        "RAV4 HYBRID SE 2WD": { code: "4523", mrt: 37300, residuals: { 24: 74, 36: 66, 39: 66, 48: 57, 60: 52 } },
        "RAV4 HYBRID XLE PREMIUM 2WD": { code: "4527", mrt: 38700, residuals: { 24: 72, 36: 64, 39: 64, 48: 56, 60: 50 } },
        "RAV4 HYBRID LE AWD": { code: "4435", mrt: 35100, residuals: { 24: 75, 36: 67, 39: 67, 48: 58, 60: 53 } },
        "RAV4 HYBRID WOODLAND AWD": { code: "4437", mrt: 42500, residuals: { 24: 71, 36: 63, 39: 63, 48: 54, 60: 50 } },
        "RAV4 HYBRID XLE PREMIUM AWD": { code: "4444", mrt: 40100, residuals: { 24: 72, 36: 64, 39: 64, 48: 55, 60: 50 } },
        "RAV4 HYBRID SE AWD": { code: "4524", mrt: 38700, residuals: { 24: 74, 36: 66, 39: 66, 48: 57, 60: 52 } },
        "RAV4 HYBRID XSE AWD": { code: "4530", mrt: 44000, residuals: { 24: 70, 36: 62, 39: 62, 48: 54, 60: 49 } },
        "RAV4 HYBRID LIMITED AWD": { code: "4534", mrt: 45200, residuals: { 24: 69, 36: 61, 39: 61, 48: 53, 60: 48 } },

        // SIENNA
        "SIENNA LE 2WD": { code: "5402", mrt: 42500, residuals: { 24: 69, 36: 59, 39: 59, 48: 48, 60: 36 } },
        "SIENNA XLE 2WD": { code: "5406", mrt: 49500, residuals: { 24: 67, 36: 58, 39: 58, 48: 47, 60: 36 } },
        "SIENNA XLE 7 PASS 2WD": { code: "5408", mrt: 49500, residuals: { 24: 68, 36: 58, 39: 58, 48: 48, 60: 36 } },
        "SIENNA XSE 2WD": { code: "5410", mrt: 53400, residuals: { 24: 67, 36: 57, 39: 57, 48: 47, 60: 36 } },
        "SIENNA LIMITED 2WD": { code: "5414", mrt: 54500, residuals: { 24: 65, 36: 55, 39: 55, 48: 46, 60: 35 } },
        "SIENNA LE AWD": { code: "5403", mrt: 45200, residuals: { 24: 69, 36: 59, 39: 59, 48: 48, 60: 36 } },
        "SIENNA XLE AWD": { code: "5407", mrt: 51500, residuals: { 24: 69, 36: 59, 39: 59, 48: 49, 60: 37 } },
        "SIENNA XLE WOODLAND AWD": { code: "5409", mrt: 54200, residuals: { 24: 68, 36: 58, 39: 58, 48: 48, 60: 37 } },
        "SIENNA XSE AWD": { code: "5411", mrt: 54300, residuals: { 24: 68, 36: 58, 39: 58, 48: 48, 60: 37 } },
        "SIENNA LIMITED AWD": { code: "5415", mrt: 56200, residuals: { 24: 69, 36: 58, 39: 58, 48: 48, 60: 37 } },
        "SIENNA PLATINUM AWD": { code: "5419", mrt: 61200, residuals: { 24: 64, 36: 55, 39: 55, 48: 46, 60: 35 } },

        // SEQUOIA
        "SEQUOIA SR5 2WD": { code: "7946", mrt: 69200, residuals: { 24: 61, 36: 52, 39: 52, 48: 40, 60: 30 } },
        "SEQUOIA LIMITED 2WD": { code: "7947", mrt: 71000, residuals: { 24: 62, 36: 54, 39: 54, 48: 41, 60: 32 } },
        "SEQUOIA SR5 4WD": { code: "7948", mrt: 73100, residuals: { 24: 65, 36: 56, 39: 56, 48: 43, 60: 34 } },
        "SEQUOIA LIMITED 4WD": { code: "7949", mrt: 76200, residuals: { 24: 66, 36: 57, 39: 57, 48: 45, 60: 35 } },
        "SEQUOIA PLATINUM 4WD": { code: "7951", mrt: 82600, residuals: { 24: 64, 36: 55, 39: 55, 48: 44, 60: 34 } },
        "SEQUOIA TRD PRO 4WD": { code: "7953", mrt: 83400, residuals: { 24: 65, 36: 56, 39: 56, 48: 44, 60: 34 } },
        "SEQUOIA CAPSTONE 4WD": { code: "7955", mrt: 87200, residuals: { 24: 63, 36: 54, 39: 54, 48: 43, 60: 34 } },
        "SEQUOIA 1794 EDITION 4WD": { code: "7957", mrt: 82900, residuals: { 24: 65, 36: 56, 39: 56, 48: 45, 60: 35 } },

        // TACOMA (Selection of popular trims)
        "TACOMA SR5 2WD DC": { code: "7146", mrt: 41800, residuals: { 24: 78, 36: 70, 39: 70, 48: 58, 60: 51 } },
        "TACOMA TRD SPORT 2WD DC": { code: "7148", mrt: 45800, residuals: { 24: 76, 36: 69, 39: 69, 48: 57, 60: 51 } },
        "TACOMA SR5 4WD DC": { code: "7540", mrt: 45100, residuals: { 24: 80, 36: 72, 39: 72, 48: 60, 60: 53 } },
        "TACOMA TRD SPORT 4WD DC": { code: "7542", mrt: 49100, residuals: { 24: 78, 36: 70, 39: 70, 48: 59, 60: 53 } },
        "TACOMA TRD OFF ROAD 4WD DC": { code: "7544", mrt: 49500, residuals: { 24: 78, 36: 70, 39: 70, 48: 59, 60: 53 } },
        "TACOMA LIMITED 4WD DC": { code: "7582", mrt: 54900, residuals: { 24: 70, 36: 64, 39: 64, 48: 54, 60: 48 } },

        // TACOMA HYBRID
        "TACOMA HYBRID TRD SPORT": { code: "7530", mrt: 50500, residuals: { 24: 76, 36: 69, 39: 69, 48: 58, 60: 51 } },
        "TACOMA HYBRID TRD OFF ROAD": { code: "7532", mrt: 50800, residuals: { 24: 77, 36: 69, 39: 69, 48: 58, 60: 52 } },
        "TACOMA HYBRID LIMITED": { code: "7534", mrt: 58300, residuals: { 24: 71, 36: 64, 39: 64, 48: 54, 60: 48 } },
        "TACOMA HYBRID TRAILHUNTER": { code: "7536", mrt: 65200, residuals: { 24: 66, 36: 59, 39: 59, 48: 50, 60: 44 } },
        "TACOMA HYBRID TRD PRO": { code: "7598", mrt: 66200, residuals: { 24: 65, 36: 59, 39: 59, 48: 49, 60: 44 } },

        // TUNDRA (Selection)
        "TUNDRA SR5 2WD CM": { code: "8261", mrt: 57200, residuals: { 24: 67, 36: 61, 39: 61, 48: 53, 60: 47 } },
        "TUNDRA LIMITED 2WD CM": { code: "8272", mrt: 61300, residuals: { 24: 68, 36: 61, 39: 61, 48: 53, 60: 47 } },
        "TUNDRA SR5 4WD CM": { code: "8361", mrt: 60200, residuals: { 24: 71, 36: 64, 39: 64, 48: 55, 60: 49 } },
        "TUNDRA LIMITED 4WD CM": { code: "8372", mrt: 65000, residuals: { 24: 69, 36: 61, 39: 61, 48: 52, 60: 46 } },
        "TUNDRA PLATINUM 4WD CM": { code: "8375", mrt: 72500, residuals: { 24: 66, 36: 58, 39: 58, 48: 49, 60: 43 } },
        "TUNDRA 1794 EDITION 4WD CM": { code: "8376", mrt: 75300, residuals: { 24: 65, 36: 58, 39: 58, 48: 49, 60: 43 } },

        // TUNDRA HYBRID
        "TUNDRA HYBRID LIMITED CM": { code: "8401", mrt: 63300, residuals: { 24: 65, 36: 59, 39: 59, 48: 50, 60: 45 } },
        "TUNDRA HYBRID LIMITED AWD CM": { code: "8421", mrt: 67000, residuals: { 24: 68, 36: 60, 39: 60, 48: 52, 60: 46 } },
        "TUNDRA HYBRID PLATINUM AWD CM": { code: "8422", mrt: 76900, residuals: { 24: 64, 36: 57, 39: 57, 48: 49, 60: 43 } },
        "TUNDRA HYBRID 1794 AWD CM": { code: "8423", mrt: 76000, residuals: { 24: 64, 36: 57, 39: 57, 48: 48, 60: 43 } },
        "TUNDRA HYBRID TRD PRO AWD CM": { code: "8424", mrt: 75800, residuals: { 24: 63, 36: 56, 39: 56, 48: 48, 60: 42 } },
        "TUNDRA HYBRID CAPSTONE AWD CM": { code: "8425", mrt: 84100, residuals: { 24: 60, 36: 53, 39: 53, 48: 45, 60: 40 } }
    }
};

// Helper function to get money factor as APR
export const moneyFactorToAPR = (mf) => mf * 2400;

// Helper function to get APR as money factor
export const aprToMoneyFactor = (apr) => apr / 2400;

// Get credit tier by score
export const getCreditTier = (score) => {
    const { creditTiers } = TOYOTA_FINANCE_DATA;
    if (score >= creditTiers.tier1.min) return creditTiers.tier1;
    if (score >= creditTiers.tier2.min) return creditTiers.tier2;
    if (score >= creditTiers.tier3.min) return creditTiers.tier3;
    if (score >= creditTiers.tier4.min) return creditTiers.tier4;
    return null; // Below Tier 4
};

// Calculate lease payment
export const calculateLeasePayment = (params) => {
    const {
        sellingPrice,
        mrt,
        residualPercent,
        moneyFactor,
        term,
        downPayment = 0,
        tradeIn = 0,
        adminFee = TOYOTA_FINANCE_DATA.adminFee
    } = params;

    // Cap cost
    const capCost = sellingPrice + adminFee - downPayment - tradeIn;

    // Use MRT for residual calculation (can't exceed MRT)
    const residualBase = Math.min(sellingPrice, mrt);
    const residualValue = residualBase * (residualPercent / 100);

    // Depreciation (monthly)
    const depreciation = (capCost - residualValue) / term;

    // Finance charge (monthly)
    const financeCharge = (capCost + residualValue) * moneyFactor;

    // Base monthly payment
    const basePayment = depreciation + financeCharge;

    // Total with tax (Florida 6%)
    const taxRate = 0.06;
    const monthlyTax = basePayment * taxRate;
    const totalMonthlyPayment = basePayment + monthlyTax;

    return {
        basePayment: Math.round(basePayment * 100) / 100,
        monthlyTax: Math.round(monthlyTax * 100) / 100,
        totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
        capCost: Math.round(capCost * 100) / 100,
        residualValue: Math.round(residualValue * 100) / 100,
        depreciation: Math.round(depreciation * 100) / 100,
        financeCharge: Math.round(financeCharge * 100) / 100
    };
};

export default TOYOTA_FINANCE_DATA;
