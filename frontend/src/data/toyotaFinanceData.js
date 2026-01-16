// Toyota Financial Services - SET Finance Official Data
// Program Period: January 6, 2026 - February 2, 2026
// Source: Bulletins T-5987/26, T-5988/26, T-5989/26, T-5991/26, T-5997/26

export const TOYOTA_FINANCE_DATA = {
    // Program info
    programPeriod: "January 6, 2026 - February 2, 2026",
    adminFee: 695,
    maxDealerMarkup: 300,
    dispositionFee: 350, // Waived if customer leases/buys another Toyota with SETF

    // ===========================================
    // STANDARD LEASE RATES (T-5991/26)
    // These apply when NO special program exists
    // ===========================================
    standardLeaseRates: {
        // Up to 51 months
        upTo51Months: {
            tier1: { // 720+
                ltv110: 0.00296,
                ltv120: 0.00321,
                ltv130: 0.00361
            },
            tier2: { // 680-719
                ltv110: 0.00316,
                ltv120: 0.00341,
                ltv130: 0.00409
            },
            tier3: { // 650-679
                ltv110: 0.00351,
                ltv120: 0.00396,
                ltv130: 0.00456
            },
            tier4: { // 600-649
                ltv110: 0.00426,
                ltv120: 0.00496,
                ltv130: null // N/A
            }
        },
        // For 52-60 months, add this to base rate
        term52to60Adjustment: 0.00060,
        // Encore discount (previous Toyota Finance customer)
        encoreDiscount: 0.00010,
        // Security deposit waiver adds this
        securityDepositWaiver: 0.00010,
        // Rate participation (dealer markup)
        maxRateParticipation: 0.00100
    },

    // Credit Tiers
    creditTiers: {
        tier1: { min: 720, max: 850, label: "Tier 1", description: "Excelente" },
        tier2: { min: 680, max: 719, label: "Tier 2", description: "Muy Bueno" },
        tier3: { min: 650, max: 679, label: "Tier 3", description: "Bueno" },
        tier4: { min: 600, max: 649, label: "Tier 4", description: "Regular" }
    },

    // Security Deposit Rules
    securityDeposit: {
        tier1Required: false,
        tier2Required: false,
        tier3Required: true,  // 1 deposit required
        tier4Required: true,  // 1 deposit required
        minimumDeposit: 300
    },

    // Mileage Options and Residual Adjustments
    mileageOptions: {
        standard: 15000,
        options: [12000, 15000, 18000],
        residualAdjustment: {
            12000: 2,   // Add 2% to residual
            15000: 0,   // Standard
            18000: -2   // Deduct 2% from residual
        },
        excessMileRate: 0.18,      // Per mile at end
        prepaidExcessRate: 0.10    // Per mile if purchased upfront (only with 18K base)
    },

    // Residual adjustments for mileage at inception
    mileageAtInception: {
        "0-500": 0,    // No adjustment (standard)
        "501-6000": -2 // Deduct 2% from residual
    },

    // ===========================================
    // SPECIAL 39-MONTH LEASE PROGRAMS (T-5987/26)
    // Model-specific money factors - MUCH LOWER!
    // ===========================================
    special39MonthPrograms: {
        // 2026 bZ - BEST RATES!
        "2026 bZ": {
            models: ["2870", "2872", "2873", "2880", "2882"],
            bonus: 3500,
            moneyFactors: {
                tier1: { ltv110: 0.00007, ltv120: 0.00032, ltv130: 0.00072 },
                tier2: { ltv110: 0.00027, ltv120: 0.00052, ltv130: 0.00120 },
                tier3: { ltv110: 0.00062, ltv120: 0.00107, ltv130: 0.00167 },
                tier4: { ltv110: 0.00137, ltv120: 0.00207, ltv130: null }
            },
            residuals: {
                "2870": { 12: 54, 15: 52, 18: 50 },
                "2872": { 12: 54, 15: 52, 18: 50 },
                "2873": { 12: 51, 15: 49, 18: 47 },
                "2880": { 12: 51, 15: 49, 18: 47 },
                "2882": { 12: 51, 15: 49, 18: 47 }
            }
        },

        // 2026 Camry Hybrid
        "2026 Camry Hybrid": {
            models: ["2551", "2552", "2553", "2555", "2556", "2557", "2558", "2559", "2560", "2561"],
            moneyFactors: {
                tier1: { ltv110: 0.00268, ltv120: 0.00293, ltv130: 0.00333 },
                tier2: { ltv110: 0.00288, ltv120: 0.00313, ltv130: 0.00381 },
                tier3: { ltv110: 0.00323, ltv120: 0.00368, ltv130: 0.00428 },
                tier4: { ltv110: 0.00398, ltv120: 0.00468, ltv130: null }
            }
        },

        // 2026 Corolla
        "2026 Corolla": {
            models: ["1852", "1864", "1866"],
            moneyFactors: {
                tier1: { ltv110: 0.00259, ltv120: 0.00284, ltv130: 0.00324 },
                tier2: { ltv110: 0.00279, ltv120: 0.00304, ltv130: 0.00372 },
                tier3: { ltv110: 0.00314, ltv120: 0.00359, ltv130: 0.00419 },
                tier4: { ltv110: 0.00389, ltv120: 0.00459, ltv130: null }
            }
        },

        // 2026 Corolla Hybrid
        "2026 Corolla Hybrid": {
            models: ["1882", "1883", "1886", "1887", "1892"],
            moneyFactors: {
                tier1: { ltv110: 0.00278, ltv120: 0.00303, ltv130: 0.00343 },
                tier2: { ltv110: 0.00298, ltv120: 0.00323, ltv130: 0.00391 },
                tier3: { ltv110: 0.00333, ltv120: 0.00378, ltv130: 0.00438 },
                tier4: { ltv110: 0.00408, ltv120: 0.00478, ltv130: null }
            }
        },

        // 2026 Crown
        "2026 Crown": {
            models: ["4015", "4020", "4025", "4030"],
            moneyFactors: {
                tier1: { ltv110: 0.00271, ltv120: 0.00296, ltv130: 0.00336 },
                tier2: { ltv110: 0.00291, ltv120: 0.00316, ltv130: 0.00384 },
                tier3: { ltv110: 0.00326, ltv120: 0.00371, ltv130: 0.00431 },
                tier4: { ltv110: 0.00401, ltv120: 0.00471, ltv130: null }
            }
        },

        // 2026 Prius Liftback
        "2026 Prius": {
            models: ["1216", "1223", "1225", "1227", "1263", "1265", "1266", "1268"],
            moneyFactors: {
                tier1: { ltv110: 0.00256, ltv120: 0.00281, ltv130: 0.00321 },
                tier2: { ltv110: 0.00276, ltv120: 0.00301, ltv130: 0.00369 },
                tier3: { ltv110: 0.00311, ltv120: 0.00356, ltv130: 0.00416 },
                tier4: { ltv110: 0.00386, ltv120: 0.00456, ltv130: null }
            }
        },

        // 2026 Prius PHEV
        "2026 Prius PHEV": {
            models: ["1233", "1235", "1237", "1239"],
            moneyFactors: {
                tier1: { ltv110: 0.00276, ltv120: 0.00301, ltv130: 0.00341 },
                tier2: { ltv110: 0.00296, ltv120: 0.00321, ltv130: 0.00389 },
                tier3: { ltv110: 0.00331, ltv120: 0.00376, ltv130: 0.00436 },
                tier4: { ltv110: 0.00406, ltv120: 0.00476, ltv130: null }
            }
        },

        // 2026 RAV4 Hybrid
        "2026 RAV4 Hybrid": {
            models: ["4521", "4523", "4527", "4435", "4437", "4444", "4524", "4530", "4534"],
            moneyFactors: {
                tier1: { ltv110: 0.00283, ltv120: 0.00308, ltv130: 0.00348 },
                tier2: { ltv110: 0.00303, ltv120: 0.00328, ltv130: 0.00396 },
                tier3: { ltv110: 0.00338, ltv120: 0.00383, ltv130: 0.00443 },
                tier4: { ltv110: 0.00413, ltv120: 0.00483, ltv130: null }
            }
        },

        // 2026 Tacoma
        "2026 Tacoma": {
            models: ["7126", "7146", "7148", "7162", "7166", "7170", "7172", "7186", "7514", "7540", "7542", "7543", "7544", "7545", "7547", "7558", "7566", "7568", "7570", "7582", "7594"],
            moneyFactors: {
                tier1: { ltv110: 0.00276, ltv120: 0.00301, ltv130: 0.00341 },
                tier2: { ltv110: 0.00296, ltv120: 0.00321, ltv130: 0.00389 },
                tier3: { ltv110: 0.00331, ltv120: 0.00376, ltv130: 0.00436 },
                tier4: { ltv110: 0.00406, ltv120: 0.00476, ltv130: null }
            }
        },

        // 2026 Tacoma Hybrid
        "2026 Tacoma Hybrid": {
            models: ["7530", "7532", "7534"],
            moneyFactors: {
                tier1: { ltv110: 0.00294, ltv120: 0.00319, ltv130: 0.00359 },
                tier2: { ltv110: 0.00314, ltv120: 0.00339, ltv130: 0.00407 },
                tier3: { ltv110: 0.00349, ltv120: 0.00394, ltv130: 0.00454 },
                tier4: { ltv110: 0.00424, ltv120: 0.00494, ltv130: null }
            }
        },

        // 2026 Tundra
        "2026 Tundra": {
            models: ["8241", "8242", "8245", "8248", "8261", "8272", "8275", "8276", "8281", "8282", "8341", "8342", "8346", "8348", "8361", "8372", "8375", "8376", "8381", "8382", "8385", "8386"],
            moneyFactors: {
                tier1: { ltv110: 0.00187, ltv120: 0.00212, ltv130: 0.00252 },
                tier2: { ltv110: 0.00207, ltv120: 0.00232, ltv130: 0.00300 },
                tier3: { ltv110: 0.00242, ltv120: 0.00287, ltv130: 0.00347 },
                tier4: { ltv110: 0.00317, ltv120: 0.00387, ltv130: null }
            }
        },

        // 2026 Tundra Hybrid
        "2026 Tundra Hybrid": {
            models: ["8401", "8411", "8421", "8422", "8423", "8425", "8431", "8432", "8433"],
            moneyFactors: {
                tier1: { ltv110: 0.00246, ltv120: 0.00271, ltv130: 0.00311 },
                tier2: { ltv110: 0.00266, ltv120: 0.00291, ltv130: 0.00359 },
                tier3: { ltv110: 0.00301, ltv120: 0.00346, ltv130: 0.00406 },
                tier4: { ltv110: 0.00376, ltv120: 0.00446, ltv130: null }
            }
        },

        // 2025 RAV4 (Gas)
        "2025 RAV4": {
            models: ["4430", "4432", "4440", "4442", "4450", "4452", "4477", "4478"],
            moneyFactors: {
                tier1: { ltv110: 0.00263, ltv120: 0.00288, ltv130: 0.00328 },
                tier2: { ltv110: 0.00283, ltv120: 0.00308, ltv130: 0.00376 },
                tier3: { ltv110: 0.00318, ltv120: 0.00363, ltv130: 0.00423 },
                tier4: { ltv110: 0.00393, ltv120: 0.00463, ltv130: null }
            }
        },

        // 2025 RAV4 Hybrid
        "2025 RAV4 Hybrid": {
            models: ["4435", "4437", "4444", "4524", "4528", "4530", "4534"],
            moneyFactors: {
                tier1: { ltv110: 0.00281, ltv120: 0.00306, ltv130: 0.00346 },
                tier2: { ltv110: 0.00301, ltv120: 0.00326, ltv130: 0.00394 },
                tier3: { ltv110: 0.00336, ltv120: 0.00381, ltv130: 0.00441 },
                tier4: { ltv110: 0.00411, ltv120: 0.00481, ltv130: null }
            }
        },

        // 2025 Tacoma
        "2025 Tacoma": {
            models: ["7126", "7146", "7148", "7162", "7166", "7170", "7172", "7186", "7514", "7540", "7542", "7543", "7544", "7545", "7547", "7558", "7566", "7568", "7570", "7582", "7594"],
            moneyFactors: {
                tier1: { ltv110: 0.00290, ltv120: 0.00315, ltv130: 0.00355 },
                tier2: { ltv110: 0.00310, ltv120: 0.00335, ltv130: 0.00403 },
                tier3: { ltv110: 0.00345, ltv120: 0.00390, ltv130: 0.00450 },
                tier4: { ltv110: 0.00420, ltv120: 0.00490, ltv130: null }
            }
        },

        // 2025 Tundra
        "2025 Tundra": {
            models: ["8241", "8242", "8245", "8248", "8261", "8272", "8275", "8276", "8281", "8282", "8341", "8342", "8346", "8348", "8361", "8372", "8375", "8376", "8381", "8382", "8385", "8386"],
            moneyFactors: {
                tier1: { ltv110: 0.00291, ltv120: 0.00316, ltv130: 0.00356 },
                tier2: { ltv110: 0.00311, ltv120: 0.00336, ltv130: 0.00404 },
                tier3: { ltv110: 0.00346, ltv120: 0.00391, ltv130: 0.00451 },
                tier4: { ltv110: 0.00421, ltv120: 0.00491, ltv130: null }
            }
        },

        // 2025 Tundra Hybrid
        "2025 Tundra Hybrid": {
            models: ["8401", "8402", "8403", "8411", "8421", "8422", "8423", "8425", "8431", "8432", "8433"],
            moneyFactors: {
                tier1: { ltv110: 0.00181, ltv120: 0.00206, ltv130: 0.00246 },
                tier2: { ltv110: 0.00201, ltv120: 0.00226, ltv130: 0.00294 },
                tier3: { ltv110: 0.00236, ltv120: 0.00281, ltv130: 0.00341 },
                tier4: { ltv110: 0.00311, ltv120: 0.00381, ltv130: null }
            }
        }
    },

    // ===========================================
    // SPECIAL 48-MONTH LEASE PROGRAMS (T-5988/26)
    // ===========================================
    special48MonthPrograms: {
        // 2026 Grand Highlander
        "2026 Grand Highlander": {
            models: ["6700", "6702", "6704", "6706", "6708", "6710", "6712"],
            moneyFactors: {
                tier1: { ltv110: 0.00280, ltv120: 0.00305, ltv130: 0.00345 },
                tier2: { ltv110: 0.00300, ltv120: 0.00325, ltv130: 0.00393 },
                tier3: { ltv110: 0.00335, ltv120: 0.00380, ltv130: 0.00440 },
                tier4: { ltv110: 0.00410, ltv120: 0.00480, ltv130: null }
            }
        },

        // 2026 Grand Highlander Hybrid
        "2026 Grand Highlander Hybrid": {
            models: ["6716", "6720", "6722", "6724", "6730", "6732", "6733"],
            moneyFactors: {
                tier1: { ltv110: 0.00282, ltv120: 0.00307, ltv130: 0.00347 },
                tier2: { ltv110: 0.00302, ltv120: 0.00327, ltv130: 0.00395 },
                tier3: { ltv110: 0.00337, ltv120: 0.00382, ltv130: 0.00442 },
                tier4: { ltv110: 0.00412, ltv120: 0.00482, ltv130: null }
            }
        },

        // 2025 4Runner
        "2025 4Runner": {
            models: ["8642", "8643", "8644", "8648", "8664", "8668", "8670", "8671", "8672", "8673"],
            moneyFactors: {
                tier1: { ltv110: 0.00280, ltv120: 0.00305, ltv130: 0.00345 },
                tier2: { ltv110: 0.00300, ltv120: 0.00325, ltv130: 0.00393 },
                tier3: { ltv110: 0.00335, ltv120: 0.00380, ltv130: 0.00440 },
                tier4: { ltv110: 0.00410, ltv120: 0.00480, ltv130: null }
            }
        },

        // 2025 4Runner Hybrid
        "2025 4Runner Hybrid": {
            models: ["8628", "8630", "8632", "8638"],
            moneyFactors: {
                tier1: { ltv110: 0.00282, ltv120: 0.00307, ltv130: 0.00347 },
                tier2: { ltv110: 0.00302, ltv120: 0.00327, ltv130: 0.00395 },
                tier3: { ltv110: 0.00337, ltv120: 0.00382, ltv130: 0.00442 },
                tier4: { ltv110: 0.00412, ltv120: 0.00482, ltv130: null }
            }
        }
    },

    // ===========================================
    // MODEL DATABASE WITH MRT AND RESIDUALS
    // Source: T-5989/26
    // ===========================================
    models: {
        // 2026 4RUNNER
        "8642": { name: "4RUNNER 2WD SR5", mrt: 43100, residuals: { 24: 79, 36: 67, 39: 65, 48: 57, 60: 51 } },
        "8643": { name: "4RUNNER 2WD TRD SPORT", mrt: 49600, residuals: { 24: 73, 36: 62, 39: 60, 48: 53, 60: 47 } },
        "8644": { name: "4RUNNER 2WD TRD SPORT PREMIUM", mrt: 55000, residuals: { 24: 70, 36: 60, 39: 58, 48: 51, 60: 45 } },
        "8648": { name: "4RUNNER 2WD LIMITED", mrt: 58100, residuals: { 24: 69, 36: 58, 39: 56, 48: 50, 60: 44 } },
        "8664": { name: "4RUNNER 4WD SR5", mrt: 45900, residuals: { 24: 83, 36: 70, 39: 68, 48: 60, 60: 53 } },
        "8668": { name: "4RUNNER 4WD LIMITED", mrt: 61500, residuals: { 24: 72, 36: 61, 39: 59, 48: 52, 60: 46 } },
        "8670": { name: "4RUNNER 4WD TRD OFF ROAD", mrt: 51500, residuals: { 24: 77, 36: 66, 39: 64, 48: 56, 60: 49 } },
        "8671": { name: "4RUNNER 4WD TRD SPORT", mrt: 51600, residuals: { 24: 76, 36: 65, 39: 63, 48: 55, 60: 50 } },
        "8672": { name: "4RUNNER 4WD TRD OFF ROAD PREMIUM", mrt: 58600, residuals: { 24: 73, 36: 61, 39: 59, 48: 52, 60: 46 } },
        "8673": { name: "4RUNNER 4WD TRD SPORT PREMIUM", mrt: 57000, residuals: { 24: 73, 36: 62, 39: 60, 48: 53, 60: 47 } },
        "8628": { name: "4RUNNER HYBRID TRD OFF ROAD", mrt: 54300, residuals: { 24: 77, 36: 65, 39: 63, 48: 56, 60: 49 } },
        "8630": { name: "4RUNNER HYBRID TRD OFF ROAD PREMIUM", mrt: 60500, residuals: { 24: 73, 36: 62, 39: 60, 48: 53, 60: 47 } },
        "8632": { name: "4RUNNER HYBRID LIMITED", mrt: 62900, residuals: { 24: 72, 36: 61, 39: 59, 48: 52, 60: 46 } },
        "8634": { name: "4RUNNER HYBRID TRD PRO", mrt: 69200, residuals: { 24: 70, 36: 59, 39: 57, 48: 51, 60: 44 } },
        "8636": { name: "4RUNNER HYBRID TRAILHUNTER", mrt: 69200, residuals: { 24: 70, 36: 59, 39: 57, 48: 51, 60: 44 } },
        "8638": { name: "4RUNNER HYBRID PLATINUM", mrt: 65200, residuals: { 24: 70, 36: 60, 39: 58, 48: 51, 60: 45 } },

        // 2026 BZ (Electric) - Has $3,500 bonus
        "2870": { name: "BZ XLE PLUS 2WD", mrt: 39600, residuals: { 24: 50, 36: 39, 39: 37, 48: 26, 60: 18 }, bonus: 3500 },
        "2872": { name: "BZ XLE AWD", mrt: 41600, residuals: { 24: 50, 36: 40, 39: 38, 48: 27, 60: 19 }, bonus: 3500 },
        "2873": { name: "BZ XLE 2WD", mrt: 36300, residuals: { 24: 47, 36: 37, 39: 35, 48: 24, 60: 16 }, bonus: 3500 },
        "2880": { name: "BZ LIMITED PLUS 2WD", mrt: 44700, residuals: { 24: 46, 36: 37, 39: 35, 48: 24, 60: 16 }, bonus: 3500 },
        "2882": { name: "BZ LIMITED AWD", mrt: 46800, residuals: { 24: 46, 36: 37, 39: 35, 48: 25, 60: 17 }, bonus: 3500 },

        // 2026 CAMRY HYBRID
        "2557": { name: "CAMRY HYBRID XSE", mrt: 42300, residuals: { 24: 65, 36: 56, 39: 54, 48: 46, 60: 37 } },
        "2558": { name: "CAMRY HYBRID NIGHTSHADE", mrt: 35100, residuals: { 24: 66, 36: 58, 39: 56, 48: 46, 60: 37 } },
        "2559": { name: "CAMRY HYBRID LE", mrt: 32000, residuals: { 24: 68, 36: 59, 39: 57, 48: 47, 60: 38 } },
        "2560": { name: "CAMRY HYBRID XLE", mrt: 38100, residuals: { 24: 64, 36: 56, 39: 54, 48: 45, 60: 37 } },
        "2561": { name: "CAMRY HYBRID SE", mrt: 34100, residuals: { 24: 67, 36: 58, 39: 56, 48: 47, 60: 38 } },
        "2551": { name: "CAMRY HYBRID SE NIGHTSHADE AWD", mrt: 36700, residuals: { 24: 66, 36: 58, 39: 56, 48: 46, 60: 38 } },
        "2552": { name: "CAMRY HYBRID LE AWD", mrt: 33600, residuals: { 24: 68, 36: 59, 39: 57, 48: 47, 60: 38 } },
        "2553": { name: "CAMRY HYBRID SE AWD", mrt: 35700, residuals: { 24: 67, 36: 58, 39: 56, 48: 47, 60: 38 } },
        "2555": { name: "CAMRY HYBRID XLE AWD", mrt: 39600, residuals: { 24: 64, 36: 56, 39: 54, 48: 45, 60: 37 } },
        "2556": { name: "CAMRY HYBRID XSE AWD", mrt: 40500, residuals: { 24: 65, 36: 56, 39: 54, 48: 46, 60: 37 } },

        // 2026 COROLLA
        "1852": { name: "COROLLA LE", mrt: 25500, residuals: { 24: 68, 36: 60, 39: 58, 48: 52, 60: 46 } },
        "1864": { name: "COROLLA SE", mrt: 28100, residuals: { 24: 66, 36: 58, 39: 56, 48: 51, 60: 44 } },
        "1866": { name: "COROLLA XSE", mrt: 30500, residuals: { 24: 63, 36: 55, 39: 53, 48: 48, 60: 42 } },

        // 2026 COROLLA HYBRID
        "1882": { name: "COROLLA HYBRID LE", mrt: 27300, residuals: { 24: 69, 36: 61, 39: 59, 48: 53, 60: 46 } },
        "1883": { name: "COROLLA HYBRID LE AWD", mrt: 28700, residuals: { 24: 70, 36: 61, 39: 59, 48: 53, 60: 46 } },
        "1886": { name: "COROLLA HYBRID SE", mrt: 29800, residuals: { 24: 67, 36: 59, 39: 57, 48: 51, 60: 44 } },
        "1887": { name: "COROLLA HYBRID SE AWD", mrt: 31300, residuals: { 24: 68, 36: 59, 39: 57, 48: 51, 60: 44 } },
        "1892": { name: "COROLLA HYBRID XLE", mrt: 30900, residuals: { 24: 67, 36: 58, 39: 56, 48: 51, 60: 44 } },

        // 2026 CROWN
        "4015": { name: "CROWN XLE", mrt: 43000, residuals: { 24: 61, 36: 53, 39: 51, 48: 41, 60: 30 } },
        "4020": { name: "CROWN LIMITED", mrt: 48500, residuals: { 24: 57, 36: 50, 39: 48, 48: 38, 60: 28 } },
        "4025": { name: "CROWN NIGHTSHADE", mrt: 49900, residuals: { 24: 56, 36: 49, 39: 47, 48: 38, 60: 27 } },
        "4030": { name: "CROWN PLATINUM", mrt: 57200, residuals: { 24: 59, 36: 52, 39: 50, 48: 40, 60: 29 } },

        // 2026 PRIUS LIFTBACK
        "1216": { name: "PRIUS NIGHTSHADE", mrt: 35600, residuals: { 24: 70, 36: 60, 39: 58, 48: 51, 60: 44 } },
        "1223": { name: "PRIUS LE", mrt: 30700, residuals: { 24: 72, 36: 63, 39: 61, 48: 52, 60: 43 } },
        "1225": { name: "PRIUS XLE", mrt: 34800, residuals: { 24: 69, 36: 61, 39: 59, 48: 51, 60: 41 } },
        "1227": { name: "PRIUS LIMITED", mrt: 37200, residuals: { 24: 67, 36: 58, 39: 56, 48: 49, 60: 41 } },
        "1263": { name: "PRIUS LE AWD", mrt: 32200, residuals: { 24: 70, 36: 62, 39: 60, 48: 51, 60: 42 } },
        "1265": { name: "PRIUS XLE AWD", mrt: 36200, residuals: { 24: 69, 36: 60, 39: 58, 48: 50, 60: 41 } },
        "1266": { name: "PRIUS NIGHTSHADE AWD", mrt: 37000, residuals: { 24: 71, 36: 59, 39: 57, 48: 52, 60: 46 } },
        "1268": { name: "PRIUS LIMITED AWD", mrt: 38600, residuals: { 24: 68, 36: 59, 39: 57, 48: 50, 60: 41 } },

        // 2026 PRIUS PHEV
        "1233": { name: "PRIUS PHEV NIGHTSHADE", mrt: 40500, residuals: { 24: 68, 36: 60, 39: 58, 48: 51, 60: 43 } },
        "1235": { name: "PRIUS PHEV SE", mrt: 35900, residuals: { 24: 71, 36: 62, 39: 60, 48: 53, 60: 45 } },
        "1237": { name: "PRIUS PHEV XSE", mrt: 39800, residuals: { 24: 69, 36: 60, 39: 58, 48: 52, 60: 43 } },
        "1239": { name: "PRIUS PHEV XSE PREMIUM", mrt: 43200, residuals: { 24: 67, 36: 58, 39: 56, 48: 50, 60: 42 } },

        // 2026 RAV4 HYBRID
        "4521": { name: "RAV4 HYBRID LE 2WD", mrt: 33700, residuals: { 24: 75, 36: 67, 39: 65, 48: 58, 60: 53 } },
        "4523": { name: "RAV4 HYBRID SE 2WD", mrt: 37300, residuals: { 24: 74, 36: 66, 39: 64, 48: 57, 60: 52 } },
        "4527": { name: "RAV4 HYBRID XLE PREMIUM 2WD", mrt: 38700, residuals: { 24: 72, 36: 64, 39: 62, 48: 56, 60: 50 } },
        "4435": { name: "RAV4 HYBRID LE AWD", mrt: 35100, residuals: { 24: 75, 36: 67, 39: 65, 48: 58, 60: 53 } },
        "4437": { name: "RAV4 HYBRID WOODLAND AWD", mrt: 42500, residuals: { 24: 71, 36: 63, 39: 61, 48: 54, 60: 50 } },
        "4444": { name: "RAV4 HYBRID XLE PREMIUM AWD", mrt: 40100, residuals: { 24: 72, 36: 64, 39: 62, 48: 55, 60: 50 } },
        "4524": { name: "RAV4 HYBRID SE AWD", mrt: 38700, residuals: { 24: 74, 36: 66, 39: 64, 48: 57, 60: 52 } },
        "4530": { name: "RAV4 HYBRID XSE AWD", mrt: 44000, residuals: { 24: 70, 36: 62, 39: 60, 48: 54, 60: 49 } },
        "4534": { name: "RAV4 HYBRID LIMITED AWD", mrt: 45200, residuals: { 24: 69, 36: 61, 39: 59, 48: 53, 60: 48 } },

        // 2026 GRAND HIGHLANDER
        "6700": { name: "GRAND HIGHLANDER LE 2WD", mrt: 43300, residuals: { 24: 71, 36: 63, 39: 61, 48: 55, 60: 39 } },
        "6702": { name: "GRAND HIGHLANDER XLE 2WD", mrt: 47500, residuals: { 24: 68, 36: 62, 39: 60, 48: 54, 60: 39 } },
        "6704": { name: "GRAND HIGHLANDER LIMITED 2WD", mrt: 52300, residuals: { 24: 68, 36: 61, 39: 59, 48: 54, 60: 39 } },
        "6706": { name: "GRAND HIGHLANDER LE AWD", mrt: 44900, residuals: { 24: 72, 36: 63, 39: 61, 48: 55, 60: 39 } },
        "6708": { name: "GRAND HIGHLANDER XLE AWD", mrt: 49100, residuals: { 24: 68, 36: 62, 39: 60, 48: 54, 60: 39 } },
        "6710": { name: "GRAND HIGHLANDER LIMITED AWD", mrt: 53900, residuals: { 24: 68, 36: 61, 39: 59, 48: 54, 60: 39 } },
        "6712": { name: "GRAND HIGHLANDER PLATINUM AWD", mrt: 56600, residuals: { 24: 66, 36: 60, 39: 58, 48: 53, 60: 38 } },

        // 2026 GRAND HIGHLANDER HYBRID
        "6716": { name: "GRAND HIGHLANDER HYBRID XLE 2WD", mrt: 49300, residuals: { 24: 70, 36: 63, 39: 61, 48: 55, 60: 40 } },
        "6720": { name: "GRAND HIGHLANDER HYBRID LE AWD", mrt: 46700, residuals: { 24: 74, 36: 64, 39: 62, 48: 56, 60: 40 } },
        "6722": { name: "GRAND HIGHLANDER HYBRID XLE AWD", mrt: 50900, residuals: { 24: 70, 36: 63, 39: 61, 48: 55, 60: 40 } },
        "6724": { name: "GRAND HIGHLANDER HYBRID LIMITED AWD", mrt: 55700, residuals: { 24: 69, 36: 62, 39: 60, 48: 55, 60: 40 } },
        "6730": { name: "GRAND HIGHLANDER HYBRID LIMITED MAX AWD", mrt: 58700, residuals: { 24: 71, 36: 64, 39: 62, 48: 57, 60: 41 } },
        "6732": { name: "GRAND HIGHLANDER HYBRID PLATINUM MAX AWD", mrt: 61400, residuals: { 24: 69, 36: 62, 39: 60, 48: 55, 60: 40 } },
        "6733": { name: "GRAND HIGHLANDER HYBRID NIGHTSHADE AWD", mrt: 57300, residuals: { 24: 69, 36: 61, 39: 59, 48: 54, 60: 39 } },

        // 2026 TACOMA (Selection)
        "7146": { name: "TACOMA 2WD DOUBLE CAB SR5 AT", mrt: 41800, residuals: { 24: 78, 36: 70, 39: 68, 48: 58, 60: 51 } },
        "7148": { name: "TACOMA 2WD DOUBLE CAB TRD SPORT AT", mrt: 45800, residuals: { 24: 76, 36: 69, 39: 67, 48: 57, 60: 51 } },
        "7540": { name: "TACOMA 4WD DOUBLE CAB SR5 AT", mrt: 45100, residuals: { 24: 80, 36: 72, 39: 70, 48: 60, 60: 53 } },
        "7542": { name: "TACOMA 4WD DOUBLE CAB TRD SPORT AT", mrt: 49100, residuals: { 24: 78, 36: 70, 39: 68, 48: 59, 60: 53 } },
        "7544": { name: "TACOMA 4WD DOUBLE CAB TRD OFF ROAD AT", mrt: 49500, residuals: { 24: 78, 36: 70, 39: 68, 48: 59, 60: 53 } },
        "7582": { name: "TACOMA 4WD DOUBLE CAB LIMITED AT", mrt: 54900, residuals: { 24: 70, 36: 64, 39: 62, 48: 54, 60: 48 } },

        // 2026 TACOMA HYBRID
        "7530": { name: "TACOMA HYBRID TRD SPORT", mrt: 50500, residuals: { 24: 76, 36: 69, 39: 67, 48: 58, 60: 51 } },
        "7532": { name: "TACOMA HYBRID TRD OFF ROAD", mrt: 50800, residuals: { 24: 77, 36: 69, 39: 67, 48: 58, 60: 52 } },
        "7534": { name: "TACOMA HYBRID LIMITED", mrt: 58300, residuals: { 24: 71, 36: 64, 39: 62, 48: 54, 60: 48 } },

        // 2026 TUNDRA (Selection)
        "8261": { name: "TUNDRA 2WD CREWMAX SR5", mrt: 57200, residuals: { 24: 67, 36: 61, 39: 59, 48: 53, 60: 47 } },
        "8272": { name: "TUNDRA 2WD CREWMAX LIMITED", mrt: 61300, residuals: { 24: 68, 36: 61, 39: 59, 48: 53, 60: 47 } },
        "8361": { name: "TUNDRA 4WD CREWMAX SR5", mrt: 60200, residuals: { 24: 71, 36: 64, 39: 62, 48: 55, 60: 49 } },
        "8372": { name: "TUNDRA 4WD CREWMAX LIMITED", mrt: 65000, residuals: { 24: 69, 36: 61, 39: 59, 48: 52, 60: 46 } },
        "8375": { name: "TUNDRA 4WD CREWMAX PLATINUM", mrt: 72500, residuals: { 24: 66, 36: 58, 39: 56, 48: 49, 60: 43 } },
        "8376": { name: "TUNDRA 4WD CREWMAX 1794 EDITION", mrt: 75300, residuals: { 24: 65, 36: 58, 39: 56, 48: 49, 60: 43 } },

        // 2026 TUNDRA HYBRID
        "8401": { name: "TUNDRA HYBRID CREWMAX LIMITED", mrt: 63300, residuals: { 24: 65, 36: 59, 39: 57, 48: 50, 60: 45 } },
        "8421": { name: "TUNDRA HYBRID CREWMAX LIMITED AWD", mrt: 67000, residuals: { 24: 68, 36: 60, 39: 58, 48: 52, 60: 46 } },
        "8422": { name: "TUNDRA HYBRID CREWMAX PLATINUM AWD", mrt: 76900, residuals: { 24: 64, 36: 57, 39: 55, 48: 49, 60: 43 } },
        "8424": { name: "TUNDRA HYBRID CREWMAX TRD PRO AWD", mrt: 75800, residuals: { 24: 63, 36: 56, 39: 54, 48: 48, 60: 42 } },
        "8425": { name: "TUNDRA HYBRID CREWMAX CAPSTONE AWD", mrt: 84100, residuals: { 24: 60, 36: 53, 39: 51, 48: 45, 60: 40 } }
    },

    // ===========================================
    // RETAIL APR PROGRAMS (T-5997/26)
    // ===========================================
    specialAPRPrograms: {
        "2026 bZ": {
            bonus: 3500,
            rates: {
                tier1: { 36: 0.00, 48: 0.00, 60: 0.00, 72: 0.00 },
                tier2: { 36: 0.99, 48: 0.99, 60: 0.99, 72: 0.99 },
                tier3: { 36: 1.99, 48: 1.99, 60: 1.99, 72: 1.99 },
                tier4: { 36: 2.99, 48: 2.99, 60: 2.99, 72: 2.99 }
            }
        },
        "2026 CAMRY HYBRID": {
            rates: {
                tier1: { 36: 1.99, 48: 2.99, 60: 3.99, 72: 4.99 },
                tier2: { 36: 2.99, 48: 3.99, 60: 4.99, 72: 5.99 },
                tier3: { 36: 3.99, 48: 4.99, 60: 5.99, 72: 6.99 },
                tier4: { 36: 4.99, 48: 5.99, 60: 6.99, 72: 7.99 }
            }
        },
        "2026 TACOMA": {
            rates: {
                tier1: { 36: 2.49, 48: 3.49, 60: 3.99, 72: 4.99 },
                tier2: { 36: 3.49, 48: 4.49, 60: 4.99, 72: 5.99 },
                tier3: { 36: 4.49, 48: 5.49, 60: 5.99, 72: 6.99 },
                tier4: { 36: 5.49, 48: 6.49, 60: 6.99, 72: 7.99 }
            }
        },
        "2026 TUNDRA": {
            rates: {
                tier1: { 36: 2.99, 48: 2.99, 60: 2.99, 72: 2.99 },
                tier2: { 36: 3.99, 48: 3.99, 60: 3.99, 72: 3.99 },
                tier3: { 36: 4.99, 48: 4.99, 60: 4.99, 72: 4.99 },
                tier4: { 36: 5.99, 48: 5.99, 60: 5.99, 72: 5.99 }
            }
        },
        "2025 TUNDRA": {
            rates: {
                tier1: { 36: 1.99, 48: 1.99, 60: 1.99, 72: 1.99 },
                tier2: { 36: 2.99, 48: 2.99, 60: 2.99, 72: 2.99 },
                tier3: { 36: 3.99, 48: 3.99, 60: 3.99, 72: 3.99 },
                tier4: { 36: 4.99, 48: 4.99, 60: 4.99, 72: 4.99 }
            }
        }
    },

    // Standard Retail Rates by FICO and LTV
    standardRetailRates: {
        ltvLow: { // ≤93%
            "740+": 6.24, "720-739": 6.74, "700-719": 7.74, "680-699": 7.99, "660-679": 8.19
        },
        ltvMid: { // 94-123%
            "740+": 6.44, "720-739": 6.89, "700-719": 8.04, "680-699": 8.59, "660-679": 9.59
        },
        ltvHigh: { // 124-133%
            "740+": 8.34, "720-739": 8.79, "700-719": 9.99, "680-699": 11.49, "660-679": 12.49
        }
    }
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

// Get credit tier number (1-4) from score
export const getCreditTierNumber = (score) => {
    if (score >= 720) return 1;
    if (score >= 680) return 2;
    if (score >= 650) return 3;
    if (score >= 600) return 4;
    return null;
};

// Get credit tier info object
export const getCreditTier = (score) => {
    const { creditTiers } = TOYOTA_FINANCE_DATA;
    if (score >= creditTiers.tier1.min) return { ...creditTiers.tier1, number: 1 };
    if (score >= creditTiers.tier2.min) return { ...creditTiers.tier2, number: 2 };
    if (score >= creditTiers.tier3.min) return { ...creditTiers.tier3, number: 3 };
    if (score >= creditTiers.tier4.min) return { ...creditTiers.tier4, number: 4 };
    return null;
};

// Get LTV bucket key from percentage
export const getLTVBucket = (ltv) => {
    if (ltv <= 110) return 'ltv110';
    if (ltv <= 120) return 'ltv120';
    if (ltv <= 130) return 'ltv130';
    return null; // Over 130% not available
};

// Find special lease program for a model
export const findSpecialLeaseProgram = (modelCode, term) => {
    const programs = term === 48
        ? TOYOTA_FINANCE_DATA.special48MonthPrograms
        : TOYOTA_FINANCE_DATA.special39MonthPrograms;

    for (const [programName, data] of Object.entries(programs)) {
        if (data.models && data.models.includes(modelCode)) {
            return { programName, ...data };
        }
    }
    return null;
};

// Get money factor for a lease
export const getMoneyFactor = (modelCode, tier, ltv, term) => {
    const tierKey = `tier${tier}`;
    const ltvBucket = getLTVBucket(ltv);

    if (!ltvBucket) return null;

    // Check for special program first
    const specialProgram = findSpecialLeaseProgram(modelCode, term);

    if (specialProgram && specialProgram.moneyFactors) {
        const mf = specialProgram.moneyFactors[tierKey]?.[ltvBucket];
        if (mf !== undefined && mf !== null) {
            return { moneyFactor: mf, isSpecial: true, programName: specialProgram.programName };
        }
    }

    // Fall back to standard rates
    const standardRates = TOYOTA_FINANCE_DATA.standardLeaseRates.upTo51Months;
    let mf = standardRates[tierKey]?.[ltvBucket];

    // Add adjustment for 52-60 month terms
    if (term >= 52 && mf) {
        mf += TOYOTA_FINANCE_DATA.standardLeaseRates.term52to60Adjustment;
    }

    return mf ? { moneyFactor: mf, isSpecial: false } : null;
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
        adminFee = TOYOTA_FINANCE_DATA.adminFee,
        bonus = 0
    } = params;

    // Apply bonus as cap cost reduction
    const effectiveDownPayment = downPayment + bonus;

    // Cap cost
    const grossCapCost = sellingPrice + adminFee;
    const capCostReduction = effectiveDownPayment + tradeIn;
    const adjustedCapCost = grossCapCost - capCostReduction;

    // Residual value (based on MRT, not selling price)
    const residualBase = Math.min(sellingPrice, mrt);
    const residualValue = Math.round(residualBase * (residualPercent / 100));

    // Depreciation (monthly)
    const depreciation = (adjustedCapCost - residualValue) / term;

    // Finance charge (money factor applied to sum of cap cost + residual)
    const financeCharge = (adjustedCapCost + residualValue) * moneyFactor;

    // Base monthly payment
    const basePayment = depreciation + financeCharge;

    // Florida sales tax (6%) on monthly payment
    const taxRate = 0.06;
    const monthlyTax = basePayment * taxRate;
    const totalMonthlyPayment = basePayment + monthlyTax;

    return {
        grossCapCost: Math.round(grossCapCost),
        capCostReduction: Math.round(capCostReduction),
        adjustedCapCost: Math.round(adjustedCapCost),
        residualValue,
        residualPercent,
        depreciation: Math.round(depreciation * 100) / 100,
        financeCharge: Math.round(financeCharge * 100) / 100,
        basePayment: Math.round(basePayment * 100) / 100,
        monthlyTax: Math.round(monthlyTax * 100) / 100,
        totalMonthlyPayment: Math.round(totalMonthlyPayment)
    };
};

export default TOYOTA_FINANCE_DATA;
