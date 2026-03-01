// Toyota Financial Services - SET Finance Official Data
// Program Period: February 3, 2026 - March 2, 2026
// Source: Bulletins T-6025/26REV, T-6027/26REV, T-6028/26, T-5991/26

export const TOYOTA_FINANCE_DATA = {
    programPeriod: 'February 3, 2026 - March 2, 2026',
    adminFee: 695,
    maxDealerMarkup: 300,
    dispositionFee: 350,

    standardLeaseRates: {
        upTo51Months: {
            tier1: { ltv110: 0.00296, ltv120: 0.00321, ltv130: 0.00361 },
            tier2: { ltv110: 0.00316, ltv120: 0.00341, ltv130: 0.00409 },
            tier3: { ltv110: 0.00351, ltv120: 0.00396, ltv130: 0.00456 },
            tier4: { ltv110: 0.00426, ltv120: 0.00496, ltv130: null }
        },
        term52to60Adjustment: 0.00060,
        encoreDiscount: 0.00010,
        securityDepositWaiver: 0.00010,
        maxRateParticipation: 0.00100
    },

    creditTiers: {
        tier1: { min: 720, max: 850, label: 'Tier 1', description: 'Excelente' },
        tier2: { min: 680, max: 719, label: 'Tier 2', description: 'Muy Bueno' },
        tier3: { min: 650, max: 679, label: 'Tier 3', description: 'Bueno' },
        tier4: { min: 600, max: 649, label: 'Tier 4', description: 'Regular' }
    },

    securityDeposit: {
        tier1Required: false,
        tier2Required: false,
        tier3Required: true,
        tier4Required: true,
        minimumDeposit: 300
    },

    mileageOptions: {
        standard: 15000,
        options: [12000, 15000, 18000],
        residualAdjustment: { 12000: 2, 15000: 0, 18000: -2 },
        excessMileRate: 0.18,
        prepaidExcessRate: 0.10
    },

    mileageAtInception: { '0-500': 0, '501-6000': -2 },

    // ========== SPECIAL 39-MONTH LEASE PROGRAMS (T-6025/26REV) ==========
    special39MonthPrograms: {
        '2026 4Runner': {
            models: ['8642','8643','8644','8648','8664','8668','8670','8671','8672','8673'],
            moneyFactors: {
                tier1: { ltv110: 0.00291, ltv120: 0.00316, ltv130: 0.00356 },
                tier2: { ltv110: 0.00311, ltv120: 0.00336, ltv130: 0.00404 },
                tier3: { ltv110: 0.00346, ltv120: 0.00391, ltv130: 0.00451 },
                tier4: { ltv110: 0.00421, ltv120: 0.00491, ltv130: null }
            }
        },
        '2026 4Runner Hybrid': {
            models: ['8628','8630','8632','8638'],
            moneyFactors: {
                tier1: { ltv110: 0.00294, ltv120: 0.00319, ltv130: 0.00359 },
                tier2: { ltv110: 0.00314, ltv120: 0.00339, ltv130: 0.00407 },
                tier3: { ltv110: 0.00349, ltv120: 0.00394, ltv130: 0.00454 },
                tier4: { ltv110: 0.00424, ltv120: 0.00494, ltv130: null }
            }
        },
        '2026 bZ': {
            models: ['2870','2872','2873','2880','2882'],
            bonus: 3500,
            moneyFactors: {
                tier1: { ltv110: 0.00007, ltv120: 0.00032, ltv130: 0.00072 },
                tier2: { ltv110: 0.00027, ltv120: 0.00052, ltv130: 0.00120 },
                tier3: { ltv110: 0.00062, ltv120: 0.00107, ltv130: 0.00167 },
                tier4: { ltv110: 0.00137, ltv120: 0.00207, ltv130: null }
            },
            residuals: {
                '2870': { 12: 54, 15: 52, 18: 50 },
                '2872': { 12: 54, 15: 52, 18: 50 },
                '2873': { 12: 51, 15: 49, 18: 47 },
                '2880': { 12: 51, 15: 49, 18: 47 },
                '2882': { 12: 51, 15: 49, 18: 47 }
            }
        },
        '2026 bZ Woodland': {
            models: ['2860','2861'],
            bonus: 3500,
            moneyFactors: {
                tier1: { ltv110: 0.00001, ltv120: 0.00026, ltv130: 0.00066 },
                tier2: { ltv110: 0.00021, ltv120: 0.00046, ltv130: 0.00114 },
                tier3: { ltv110: 0.00056, ltv120: 0.00101, ltv130: 0.00161 },
                tier4: { ltv110: 0.00131, ltv120: 0.00201, ltv130: null }
            },
            residuals: {
                '2860': { 12: 59, 15: 57, 18: 55 },
                '2861': { 12: 55, 15: 53, 18: 51 }
            }
        },
        '2026 C-HR': {
            models: ['2416','2419'],
            bonus: 2500,
            moneyFactors: {
                tier1: { ltv110: 0.00008, ltv120: 0.00033, ltv130: 0.00073 },
                tier2: { ltv110: 0.00028, ltv120: 0.00053, ltv130: 0.00121 },
                tier3: { ltv110: 0.00063, ltv120: 0.00108, ltv130: 0.00168 },
                tier4: { ltv110: 0.00138, ltv120: 0.00208, ltv130: null }
            }
        },
        '2026 Camry Hybrid': {
            models: ['2551','2552','2553','2555','2556','2557','2558','2559','2560','2561'],
            moneyFactors: {
                tier1: { ltv110: 0.00286, ltv120: 0.00311, ltv130: 0.00351 },
                tier2: { ltv110: 0.00306, ltv120: 0.00331, ltv130: 0.00399 },
                tier3: { ltv110: 0.00341, ltv120: 0.00386, ltv130: 0.00446 },
                tier4: { ltv110: 0.00416, ltv120: 0.00486, ltv130: null }
            }
        },
        '2026 Corolla': {
            models: ['1852','1864','1866','1870'],
            moneyFactors: {
                tier1: { ltv110: 0.00295, ltv120: 0.00320, ltv130: 0.00360 },
                tier2: { ltv110: 0.00315, ltv120: 0.00340, ltv130: 0.00408 },
                tier3: { ltv110: 0.00350, ltv120: 0.00395, ltv130: 0.00455 },
                tier4: { ltv110: 0.00425, ltv120: 0.00495, ltv130: null }
            }
        },
        '2026 Corolla Hybrid': {
            models: ['1882','1883','1886','1887','1892'],
            moneyFactors: {
                tier1: { ltv110: 0.00292, ltv120: 0.00317, ltv130: 0.00357 },
                tier2: { ltv110: 0.00312, ltv120: 0.00337, ltv130: 0.00405 },
                tier3: { ltv110: 0.00347, ltv120: 0.00392, ltv130: 0.00452 },
                tier4: { ltv110: 0.00422, ltv120: 0.00492, ltv130: null }
            }
        },
        '2026 Corolla Cross': {
            models: ['6301','6302','6303','6304','6305','6306'],
            moneyFactors: {
                tier1: { ltv110: 0.00289, ltv120: 0.00314, ltv130: 0.00354 },
                tier2: { ltv110: 0.00309, ltv120: 0.00334, ltv130: 0.00402 },
                tier3: { ltv110: 0.00344, ltv120: 0.00389, ltv130: 0.00449 },
                tier4: { ltv110: 0.00419, ltv120: 0.00489, ltv130: null }
            }
        },
        '2026 Corolla Cross Hybrid': {
            models: ['6312','6314','6316'],
            moneyFactors: {
                tier1: { ltv110: 0.00290, ltv120: 0.00315, ltv130: 0.00355 },
                tier2: { ltv110: 0.00310, ltv120: 0.00335, ltv130: 0.00403 },
                tier3: { ltv110: 0.00345, ltv120: 0.00390, ltv130: 0.00450 },
                tier4: { ltv110: 0.00420, ltv120: 0.00490, ltv130: null }
            }
        },
        '2026 Crown': {
            models: ['4015','4020','4025','4030'],
            moneyFactors: {
                tier1: { ltv110: 0.00287, ltv120: 0.00312, ltv130: 0.00352 },
                tier2: { ltv110: 0.00307, ltv120: 0.00332, ltv130: 0.00400 },
                tier3: { ltv110: 0.00342, ltv120: 0.00387, ltv130: 0.00447 },
                tier4: { ltv110: 0.00417, ltv120: 0.00487, ltv130: null }
            }
        },
        '2026 Prius': {
            models: ['1216','1223','1225','1227','1263','1265','1266','1268'],
            moneyFactors: {
                tier1: { ltv110: 0.00251, ltv120: 0.00276, ltv130: 0.00316 },
                tier2: { ltv110: 0.00271, ltv120: 0.00296, ltv130: 0.00364 },
                tier3: { ltv110: 0.00306, ltv120: 0.00351, ltv130: 0.00411 },
                tier4: { ltv110: 0.00381, ltv120: 0.00451, ltv130: null }
            }
        },
        '2026 Prius PHEV': {
            models: ['1233','1235','1237','1239'],
            moneyFactors: {
                tier1: { ltv110: 0.00283, ltv120: 0.00308, ltv130: 0.00348 },
                tier2: { ltv110: 0.00303, ltv120: 0.00328, ltv130: 0.00396 },
                tier3: { ltv110: 0.00338, ltv120: 0.00383, ltv130: 0.00443 },
                tier4: { ltv110: 0.00413, ltv120: 0.00483, ltv130: null }
            }
        },
        '2026 RAV4 Hybrid': {
            models: ['4521','4523','4527','4435','4437','4444','4524','4530','4534'],
            moneyFactors: {
                tier1: { ltv110: 0.00283, ltv120: 0.00308, ltv130: 0.00348 },
                tier2: { ltv110: 0.00303, ltv120: 0.00328, ltv130: 0.00396 },
                tier3: { ltv110: 0.00338, ltv120: 0.00383, ltv130: 0.00443 },
                tier4: { ltv110: 0.00413, ltv120: 0.00483, ltv130: null }
            }
        },
        '2026 Tacoma': {
            models: ['7126','7146','7148','7162','7166','7170','7172','7186','7514','7540','7542','7543','7544','7545','7547','7558','7566','7568','7570','7582','7594'],
            moneyFactors: {
                tier1: { ltv110: 0.00281, ltv120: 0.00306, ltv130: 0.00346 },
                tier2: { ltv110: 0.00301, ltv120: 0.00326, ltv130: 0.00394 },
                tier3: { ltv110: 0.00336, ltv120: 0.00381, ltv130: 0.00441 },
                tier4: { ltv110: 0.00411, ltv120: 0.00481, ltv130: null }
            }
        },
        '2026 Tacoma Hybrid': {
            models: ['7530','7532','7534'],
            moneyFactors: {
                tier1: { ltv110: 0.00289, ltv120: 0.00314, ltv130: 0.00354 },
                tier2: { ltv110: 0.00309, ltv120: 0.00334, ltv130: 0.00402 },
                tier3: { ltv110: 0.00344, ltv120: 0.00389, ltv130: 0.00449 },
                tier4: { ltv110: 0.00419, ltv120: 0.00489, ltv130: null }
            }
        },
        '2026 Tundra': {
            models: ['8241','8242','8245','8248','8261','8272','8275','8276','8281','8282','8341','8342','8346','8348','8361','8372','8375','8376','8381','8382','8385','8386'],
            moneyFactors: {
                tier1: { ltv110: 0.00187, ltv120: 0.00212, ltv130: 0.00252 },
                tier2: { ltv110: 0.00207, ltv120: 0.00232, ltv130: 0.00300 },
                tier3: { ltv110: 0.00242, ltv120: 0.00287, ltv130: 0.00347 },
                tier4: { ltv110: 0.00317, ltv120: 0.00387, ltv130: null }
            }
        },
        '2026 Tundra Hybrid': {
            models: ['8401','8411','8421','8422','8423','8425','8431','8432','8433'],
            moneyFactors: {
                tier1: { ltv110: 0.00246, ltv120: 0.00271, ltv130: 0.00311 },
                tier2: { ltv110: 0.00266, ltv120: 0.00291, ltv130: 0.00359 },
                tier3: { ltv110: 0.00301, ltv120: 0.00346, ltv130: 0.00406 },
                tier4: { ltv110: 0.00376, ltv120: 0.00446, ltv130: null }
            }
        },
        '2025 RAV4': {
            models: ['4430','4432','4440','4442','4450','4452','4477','4478'],
            moneyFactors: {
                tier1: { ltv110: 0.00263, ltv120: 0.00288, ltv130: 0.00328 },
                tier2: { ltv110: 0.00283, ltv120: 0.00308, ltv130: 0.00376 },
                tier3: { ltv110: 0.00318, ltv120: 0.00363, ltv130: 0.00423 },
                tier4: { ltv110: 0.00393, ltv120: 0.00463, ltv130: null }
            }
        },
        '2025 RAV4 Hybrid': {
            models: ['4435','4437','4444','4524','4528','4530','4534'],
            moneyFactors: {
                tier1: { ltv110: 0.00281, ltv120: 0.00306, ltv130: 0.00346 },
                tier2: { ltv110: 0.00301, ltv120: 0.00326, ltv130: 0.00394 },
                tier3: { ltv110: 0.00336, ltv120: 0.00381, ltv130: 0.00441 },
                tier4: { ltv110: 0.00411, ltv120: 0.00481, ltv130: null }
            }
        },
        '2025 RAV4 PHEV': {
            models: ['4544','4550'],
            moneyFactors: {
                tier1: { ltv110: 0.00300, ltv120: 0.00325, ltv130: 0.00365 },
                tier2: { ltv110: 0.00320, ltv120: 0.00345, ltv130: 0.00413 },
                tier3: { ltv110: 0.00355, ltv120: 0.00400, ltv130: 0.00460 },
                tier4: { ltv110: 0.00430, ltv120: 0.00500, ltv130: null }
            }
        },
        '2025 Tacoma': {
            models: ['7126','7146','7148','7162','7166','7170','7172','7186','7514','7540','7542','7543','7544','7545','7547','7558','7566','7568','7570','7582','7594'],
            moneyFactors: {
                tier1: { ltv110: 0.00290, ltv120: 0.00315, ltv130: 0.00355 },
                tier2: { ltv110: 0.00310, ltv120: 0.00335, ltv130: 0.00403 },
                tier3: { ltv110: 0.00345, ltv120: 0.00390, ltv130: 0.00450 },
                tier4: { ltv110: 0.00420, ltv120: 0.00490, ltv130: null }
            }
        },
        '2025 Tacoma Hybrid': {
            models: ['7530','7532','7534'],
            moneyFactors: {
                tier1: { ltv110: 0.00279, ltv120: 0.00304, ltv130: 0.00344 },
                tier2: { ltv110: 0.00299, ltv120: 0.00324, ltv130: 0.00392 },
                tier3: { ltv110: 0.00334, ltv120: 0.00379, ltv130: 0.00439 },
                tier4: { ltv110: 0.00414, ltv120: 0.00484, ltv130: null }
            }
        },
        '2025 Tundra': {
            models: ['8241','8242','8245','8248','8261','8272','8275','8276','8281','8282','8341','8342','8346','8348','8361','8372','8375','8376','8381','8382','8385','8386'],
            moneyFactors: {
                tier1: { ltv110: 0.00215, ltv120: 0.00240, ltv130: 0.00280 },
                tier2: { ltv110: 0.00235, ltv120: 0.00260, ltv130: 0.00328 },
                tier3: { ltv110: 0.00270, ltv120: 0.00315, ltv130: 0.00375 },
                tier4: { ltv110: 0.00345, ltv120: 0.00415, ltv130: null }
            }
        },
        '2025 Tundra Hybrid': {
            models: ['8401','8402','8403','8411','8421','8422','8423','8425','8431','8432','8433'],
            moneyFactors: {
                tier1: { ltv110: 0.00181, ltv120: 0.00206, ltv130: 0.00246 },
                tier2: { ltv110: 0.00201, ltv120: 0.00226, ltv130: 0.00294 },
                tier3: { ltv110: 0.00236, ltv120: 0.00281, ltv130: 0.00341 },
                tier4: { ltv110: 0.00311, ltv120: 0.00381, ltv130: null }
            }
        }
    },

    // ========== SPECIAL 48-MONTH LEASE PROGRAMS ==========
    special48MonthPrograms: {
        '2026 Grand Highlander': {
            models: ['6700','6702','6704','6706','6708','6710','6712'],
            moneyFactors: {
                tier1: { ltv110: 0.00280, ltv120: 0.00305, ltv130: 0.00345 },
                tier2: { ltv110: 0.00300, ltv120: 0.00325, ltv130: 0.00393 },
                tier3: { ltv110: 0.00335, ltv120: 0.00380, ltv130: 0.00440 },
                tier4: { ltv110: 0.00410, ltv120: 0.00480, ltv130: null }
            }
        },
        '2026 Grand Highlander Hybrid': {
            models: ['6716','6720','6722','6724','6730','6732','6733'],
            moneyFactors: {
                tier1: { ltv110: 0.00282, ltv120: 0.00307, ltv130: 0.00347 },
                tier2: { ltv110: 0.00302, ltv120: 0.00327, ltv130: 0.00395 },
                tier3: { ltv110: 0.00337, ltv120: 0.00382, ltv130: 0.00442 },
                tier4: { ltv110: 0.00412, ltv120: 0.00482, ltv130: null }
            }
        }
    },

    // ========== MODEL DATABASE (T-6027/26REV) ==========
    models: {
        // 2026 4RUNNER
        '8642': { name: '4RUNNER 2WD SR5', mrt: 43400, residuals: { 24: 73, 36: 65, 39: 65, 48: 57, 60: 51 } },
        '8643': { name: '4RUNNER 2WD TRD SPORT', mrt: 49600, residuals: { 24: 67, 36: 60, 39: 60, 48: 53, 60: 47 } },
        '8644': { name: '4RUNNER 2WD TRD SPORT PREMIUM', mrt: 55000, residuals: { 24: 65, 36: 58, 39: 58, 48: 51, 60: 45 } },
        '8648': { name: '4RUNNER 2WD LIMITED', mrt: 58100, residuals: { 24: 64, 36: 57, 39: 57, 48: 50, 60: 44 } },
        '8664': { name: '4RUNNER 4WD SR5', mrt: 46900, residuals: { 24: 76, 36: 68, 39: 68, 48: 60, 60: 53 } },
        '8668': { name: '4RUNNER 4WD LIMITED', mrt: 62200, residuals: { 24: 67, 36: 60, 39: 60, 48: 52, 60: 46 } },
        '8670': { name: '4RUNNER 4WD TRD OFF ROAD', mrt: 51500, residuals: { 24: 72, 36: 65, 39: 65, 48: 56, 60: 49 } },
        '8671': { name: '4RUNNER 4WD TRD SPORT', mrt: 51600, residuals: { 24: 71, 36: 64, 39: 64, 48: 55, 60: 50 } },
        '8672': { name: '4RUNNER 4WD TRD OFF ROAD PREMIUM', mrt: 59000, residuals: { 24: 67, 36: 60, 39: 60, 48: 53, 60: 46 } },
        '8673': { name: '4RUNNER 4WD TRD SPORT PREMIUM', mrt: 59300, residuals: { 24: 68, 36: 61, 39: 61, 48: 54, 60: 47 } },
        '8628': { name: '4RUNNER HYBRID TRD OFF ROAD', mrt: 54600, residuals: { 24: 72, 36: 64, 39: 64, 48: 56, 60: 49 } },
        '8630': { name: '4RUNNER HYBRID TRD OFF ROAD PREMIUM', mrt: 60500, residuals: { 24: 68, 36: 61, 39: 61, 48: 53, 60: 47 } },
        '8632': { name: '4RUNNER HYBRID LIMITED', mrt: 62900, residuals: { 24: 67, 36: 60, 39: 60, 48: 52, 60: 46 } },
        '8634': { name: '4RUNNER HYBRID TRD PRO', mrt: 69200, residuals: { 24: 65, 36: 58, 39: 58, 48: 51, 60: 44 } },
        '8636': { name: '4RUNNER HYBRID TRAILHUNTER', mrt: 69200, residuals: { 24: 65, 36: 58, 39: 58, 48: 51, 60: 44 } },
        '8638': { name: '4RUNNER HYBRID PLATINUM', mrt: 65200, residuals: { 24: 66, 36: 59, 39: 59, 48: 51, 60: 45 } },

        // 2026 BZ
        '2870': { name: 'BZ XLE PLUS 2WD', mrt: 39600, residuals: { 24: 50, 36: 39, 39: 37, 48: 26, 60: 18 }, bonus: 3500 },
        '2872': { name: 'BZ XLE AWD', mrt: 41600, residuals: { 24: 50, 36: 40, 39: 38, 48: 27, 60: 19 }, bonus: 3500 },
        '2873': { name: 'BZ XLE 2WD', mrt: 36300, residuals: { 24: 47, 36: 37, 39: 35, 48: 24, 60: 16 }, bonus: 3500 },
        '2880': { name: 'BZ LIMITED PLUS 2WD', mrt: 44700, residuals: { 24: 46, 36: 37, 39: 35, 48: 24, 60: 16 }, bonus: 3500 },
        '2882': { name: 'BZ LIMITED AWD', mrt: 46800, residuals: { 24: 46, 36: 37, 39: 35, 48: 25, 60: 17 }, bonus: 3500 },
        '2860': { name: 'BZ WOODLAND AWD', mrt: 46900, residuals: { 24: 63, 36: 50, 39: 50, 48: 33, 60: 25 }, bonus: 3500 },
        '2861': { name: 'BZ WOODLAND PREMIUM AWD', mrt: 48900, residuals: { 24: 59, 36: 47, 39: 47, 48: 31, 60: 24 }, bonus: 3500 },
        '2884': { name: 'BZ XLE NIGHTSHADE AWD', mrt: 42200, residuals: { 24: 45, 36: 37, 39: 37, 48: 25, 60: 20 }, bonus: 3500 },

        // 2026 C-HR
        '2416': { name: 'C-HR AWD SE', mrt: 38700, residuals: { 24: 55, 36: 45, 39: 45, 48: 33, 60: 25 }, bonus: 2500 },
        '2419': { name: 'C-HR AWD XSE', mrt: 40500, residuals: { 24: 55, 36: 45, 39: 45, 48: 33, 60: 25 }, bonus: 2500 },

        // 2026 CAMRY HYBRID
        '2557': { name: 'CAMRY HYBRID XSE', mrt: 42300, residuals: { 24: 65, 36: 56, 39: 54, 48: 46, 60: 37 } },
        '2558': { name: 'CAMRY HYBRID NIGHTSHADE', mrt: 35100, residuals: { 24: 66, 36: 58, 39: 56, 48: 46, 60: 37 } },
        '2559': { name: 'CAMRY HYBRID LE', mrt: 32000, residuals: { 24: 68, 36: 59, 39: 57, 48: 47, 60: 38 } },
        '2560': { name: 'CAMRY HYBRID XLE', mrt: 38100, residuals: { 24: 64, 36: 56, 39: 54, 48: 45, 60: 37 } },
        '2561': { name: 'CAMRY HYBRID SE', mrt: 34100, residuals: { 24: 67, 36: 58, 39: 56, 48: 47, 60: 38 } },
        '2551': { name: 'CAMRY HYBRID SE NIGHTSHADE AWD', mrt: 36700, residuals: { 24: 66, 36: 58, 39: 56, 48: 46, 60: 38 } },
        '2552': { name: 'CAMRY HYBRID LE AWD', mrt: 33600, residuals: { 24: 68, 36: 59, 39: 57, 48: 47, 60: 38 } },
        '2553': { name: 'CAMRY HYBRID SE AWD', mrt: 35700, residuals: { 24: 67, 36: 58, 39: 56, 48: 47, 60: 38 } },
        '2555': { name: 'CAMRY HYBRID XLE AWD', mrt: 39600, residuals: { 24: 64, 36: 56, 39: 54, 48: 45, 60: 37 } },
        '2556': { name: 'CAMRY HYBRID XSE AWD', mrt: 40500, residuals: { 24: 65, 36: 56, 39: 54, 48: 46, 60: 37 } },

        // 2026 COROLLA
        '1852': { name: 'COROLLA LE', mrt: 25500, residuals: { 24: 68, 36: 60, 39: 58, 48: 52, 60: 46 } },
        '1864': { name: 'COROLLA SE', mrt: 28100, residuals: { 24: 66, 36: 58, 39: 56, 48: 51, 60: 44 } },
        '1866': { name: 'COROLLA XSE', mrt: 30500, residuals: { 24: 63, 36: 55, 39: 53, 48: 48, 60: 42 } },
        '1870': { name: 'COROLLA FX', mrt: 29200, residuals: { 24: 64, 36: 57, 39: 57, 48: 49, 60: 44 } },

        // 2026 COROLLA CROSS
        '6301': { name: 'COROLLA CROSS L 2WD', mrt: 27100, residuals: { 24: 61, 36: 54, 39: 54, 48: 42, 60: 36 } },
        '6302': { name: 'COROLLA CROSS L AWD', mrt: 28400, residuals: { 24: 62, 36: 55, 39: 55, 48: 43, 60: 37 } },
        '6303': { name: 'COROLLA CROSS LE 2WD', mrt: 30800, residuals: { 24: 61, 36: 55, 39: 55, 48: 43, 60: 37 } },
        '6304': { name: 'COROLLA CROSS LE AWD', mrt: 32200, residuals: { 24: 62, 36: 56, 39: 56, 48: 44, 60: 38 } },
        '6305': { name: 'COROLLA CROSS XLE 2WD', mrt: 34000, residuals: { 24: 63, 36: 57, 39: 57, 48: 45, 60: 39 } },
        '6306': { name: 'COROLLA CROSS XLE AWD', mrt: 35400, residuals: { 24: 64, 36: 57, 39: 57, 48: 46, 60: 40 } },

        // 2026 COROLLA CROSS HYBRID
        '6312': { name: 'COROLLA CROSS HYBRID S AWD', mrt: 31200, residuals: { 24: 62, 36: 56, 39: 56, 48: 44, 60: 38 } },
        '6314': { name: 'COROLLA CROSS HYBRID SE AWD', mrt: 34200, residuals: { 24: 61, 36: 57, 39: 57, 48: 45, 60: 39 } },
        '6316': { name: 'COROLLA CROSS HYBRID XSE AWD', mrt: 37400, residuals: { 24: 63, 36: 58, 39: 58, 48: 46, 60: 40 } },

        // 2026 COROLLA HYBRID
        '1882': { name: 'COROLLA HYBRID LE', mrt: 27300, residuals: { 24: 69, 36: 61, 39: 59, 48: 53, 60: 46 } },
        '1883': { name: 'COROLLA HYBRID LE AWD', mrt: 28700, residuals: { 24: 70, 36: 61, 39: 59, 48: 53, 60: 46 } },
        '1886': { name: 'COROLLA HYBRID SE', mrt: 29800, residuals: { 24: 67, 36: 59, 39: 57, 48: 51, 60: 44 } },
        '1887': { name: 'COROLLA HYBRID SE AWD', mrt: 31300, residuals: { 24: 68, 36: 59, 39: 57, 48: 51, 60: 44 } },
        '1892': { name: 'COROLLA HYBRID XLE', mrt: 30900, residuals: { 24: 67, 36: 58, 39: 56, 48: 51, 60: 44 } },

        // 2026 CROWN
        '4015': { name: 'CROWN XLE', mrt: 43000, residuals: { 24: 61, 36: 53, 39: 51, 48: 41, 60: 30 } },
        '4020': { name: 'CROWN LIMITED', mrt: 48500, residuals: { 24: 57, 36: 50, 39: 48, 48: 38, 60: 28 } },
        '4025': { name: 'CROWN NIGHTSHADE', mrt: 49900, residuals: { 24: 56, 36: 49, 39: 47, 48: 38, 60: 27 } },
        '4030': { name: 'CROWN PLATINUM', mrt: 57200, residuals: { 24: 59, 36: 52, 39: 50, 48: 40, 60: 29 } },
        '4040': { name: 'CROWN SIGNIA XLE', mrt: 45400, residuals: { 24: 60, 36: 54, 39: 54, 48: 42, 60: 33 } },
        '4041': { name: 'CROWN SIGNIA LIMITED', mrt: 50400, residuals: { 24: 58, 36: 52, 39: 52, 48: 41, 60: 32 } },

        // 2026 PRIUS
        '1216': { name: 'PRIUS NIGHTSHADE', mrt: 35600, residuals: { 24: 71, 36: 60, 39: 58, 48: 51, 60: 44 } },
        '1223': { name: 'PRIUS LE', mrt: 30700, residuals: { 24: 75, 36: 65, 39: 63, 48: 52, 60: 43 } },
        '1225': { name: 'PRIUS XLE', mrt: 34800, residuals: { 24: 72, 36: 62, 39: 60, 48: 51, 60: 41 } },
        '1227': { name: 'PRIUS LIMITED', mrt: 37200, residuals: { 24: 69, 36: 59, 39: 57, 48: 49, 60: 41 } },
        '1263': { name: 'PRIUS LE AWD', mrt: 32200, residuals: { 24: 73, 36: 63, 39: 61, 48: 51, 60: 42 } },
        '1265': { name: 'PRIUS XLE AWD', mrt: 36200, residuals: { 24: 71, 36: 61, 39: 59, 48: 50, 60: 41 } },
        '1266': { name: 'PRIUS NIGHTSHADE AWD', mrt: 37000, residuals: { 24: 70, 36: 60, 39: 58, 48: 52, 60: 46 } },
        '1268': { name: 'PRIUS LIMITED AWD', mrt: 38600, residuals: { 24: 70, 36: 60, 39: 58, 48: 50, 60: 41 } },

        // 2026 PRIUS PHEV
        '1233': { name: 'PRIUS PHEV NIGHTSHADE', mrt: 40500, residuals: { 24: 70, 36: 62, 39: 60, 48: 53, 60: 45 } },
        '1235': { name: 'PRIUS PHEV SE', mrt: 35900, residuals: { 24: 73, 36: 63, 39: 61, 48: 53, 60: 45 } },
        '1237': { name: 'PRIUS PHEV XSE', mrt: 39800, residuals: { 24: 70, 36: 62, 39: 60, 48: 52, 60: 43 } },
        '1239': { name: 'PRIUS PHEV XSE PREMIUM', mrt: 43200, residuals: { 24: 68, 36: 58, 39: 56, 48: 50, 60: 42 } },

        // 2026 RAV4 HYBRID
        '4521': { name: 'RAV4 HYBRID LE 2WD', mrt: 33700, residuals: { 24: 75, 36: 67, 39: 65, 48: 58, 60: 53 } },
        '4523': { name: 'RAV4 HYBRID SE 2WD', mrt: 37300, residuals: { 24: 74, 36: 66, 39: 64, 48: 57, 60: 52 } },
        '4527': { name: 'RAV4 HYBRID XLE PREMIUM 2WD', mrt: 38700, residuals: { 24: 72, 36: 64, 39: 62, 48: 56, 60: 50 } },
        '4435': { name: 'RAV4 HYBRID LE AWD', mrt: 35100, residuals: { 24: 75, 36: 67, 39: 65, 48: 58, 60: 53 } },
        '4437': { name: 'RAV4 HYBRID WOODLAND AWD', mrt: 42500, residuals: { 24: 71, 36: 63, 39: 61, 48: 54, 60: 50 } },
        '4444': { name: 'RAV4 HYBRID XLE PREMIUM AWD', mrt: 40100, residuals: { 24: 72, 36: 64, 39: 62, 48: 55, 60: 50 } },
        '4524': { name: 'RAV4 HYBRID SE AWD', mrt: 38700, residuals: { 24: 74, 36: 66, 39: 64, 48: 57, 60: 52 } },
        '4530': { name: 'RAV4 HYBRID XSE AWD', mrt: 44000, residuals: { 24: 70, 36: 62, 39: 60, 48: 54, 60: 49 } },
        '4534': { name: 'RAV4 HYBRID LIMITED AWD', mrt: 45200, residuals: { 24: 69, 36: 61, 39: 59, 48: 53, 60: 48 } },

        // 2025 RAV4
        '4430': { name: 'RAV4 2WD LE', mrt: 31600, residuals: { 24: 58, 36: 53, 39: 53, 48: 46, 60: 44 } },
        '4432': { name: 'RAV4 AWD LE', mrt: 33000, residuals: { 24: 58, 36: 53, 39: 53, 48: 46, 60: 44 } },
        '4440': { name: 'RAV4 2WD XLE', mrt: 34200, residuals: { 24: 61, 36: 55, 39: 55, 48: 48, 60: 46 } },
        '4442': { name: 'RAV4 AWD XLE', mrt: 35600, residuals: { 24: 61, 36: 55, 39: 55, 48: 48, 60: 45 } },
        '4450': { name: 'RAV4 2WD LIMITED', mrt: 40100, residuals: { 24: 58, 36: 52, 39: 52, 48: 45, 60: 42 } },
        '4452': { name: 'RAV4 AWD LIMITED', mrt: 42500, residuals: { 24: 57, 36: 51, 39: 51, 48: 45, 60: 42 } },
        '4477': { name: 'RAV4 2WD XLE PREMIUM', mrt: 36700, residuals: { 24: 59, 36: 53, 39: 53, 48: 46, 60: 44 } },
        '4478': { name: 'RAV4 AWD XLE PREMIUM', mrt: 38600, residuals: { 24: 59, 36: 53, 39: 53, 48: 46, 60: 44 } },
        '4528': { name: 'RAV4 HYBRID XLE PREMIUM AWD', mrt: 40300, residuals: { 24: 59, 36: 53, 39: 53, 48: 47, 60: 44 } },
        '4544': { name: 'RAV4 PHEV AWD SE', mrt: 47800, residuals: { 24: 63, 36: 55, 39: 55, 48: 47, 60: 44 } },
        '4550': { name: 'RAV4 PHEV AWD XSE', mrt: 51300, residuals: { 24: 63, 36: 54, 39: 54, 48: 47, 60: 43 } },

        // 2026 GRAND HIGHLANDER
        '6700': { name: 'GRAND HIGHLANDER LE 2WD', mrt: 43300, residuals: { 24: 71, 36: 63, 39: 61, 48: 55, 60: 39 } },
        '6702': { name: 'GRAND HIGHLANDER XLE 2WD', mrt: 47500, residuals: { 24: 68, 36: 62, 39: 60, 48: 54, 60: 39 } },
        '6704': { name: 'GRAND HIGHLANDER LIMITED 2WD', mrt: 52300, residuals: { 24: 68, 36: 61, 39: 59, 48: 54, 60: 39 } },
        '6706': { name: 'GRAND HIGHLANDER LE AWD', mrt: 44900, residuals: { 24: 72, 36: 63, 39: 61, 48: 55, 60: 39 } },
        '6708': { name: 'GRAND HIGHLANDER XLE AWD', mrt: 49100, residuals: { 24: 68, 36: 62, 39: 60, 48: 54, 60: 39 } },
        '6710': { name: 'GRAND HIGHLANDER LIMITED AWD', mrt: 53900, residuals: { 24: 68, 36: 61, 39: 59, 48: 54, 60: 39 } },
        '6712': { name: 'GRAND HIGHLANDER PLATINUM AWD', mrt: 56600, residuals: { 24: 66, 36: 60, 39: 58, 48: 53, 60: 38 } },

        // 2026 GRAND HIGHLANDER HYBRID
        '6716': { name: 'GRAND HIGHLANDER HYBRID XLE 2WD', mrt: 49300, residuals: { 24: 70, 36: 63, 39: 61, 48: 55, 60: 40 } },
        '6720': { name: 'GRAND HIGHLANDER HYBRID LE AWD', mrt: 46700, residuals: { 24: 74, 36: 64, 39: 62, 48: 56, 60: 40 } },
        '6722': { name: 'GRAND HIGHLANDER HYBRID XLE AWD', mrt: 50900, residuals: { 24: 70, 36: 63, 39: 61, 48: 55, 60: 40 } },
        '6724': { name: 'GRAND HIGHLANDER HYBRID LIMITED AWD', mrt: 55700, residuals: { 24: 69, 36: 62, 39: 60, 48: 55, 60: 40 } },
        '6730': { name: 'GRAND HIGHLANDER HYBRID LIMITED MAX AWD', mrt: 58700, residuals: { 24: 71, 36: 64, 39: 62, 48: 57, 60: 41 } },
        '6732': { name: 'GRAND HIGHLANDER HYBRID PLATINUM MAX AWD', mrt: 61400, residuals: { 24: 69, 36: 62, 39: 60, 48: 55, 60: 40 } },
        '6733': { name: 'GRAND HIGHLANDER HYBRID NIGHTSHADE AWD', mrt: 57300, residuals: { 24: 69, 36: 61, 39: 59, 48: 54, 60: 39 } },

        // 2026 TACOMA
        '7126': { name: 'TACOMA 2WD XTRACAB SR5 AT', mrt: 39900, residuals: { 24: 75, 36: 68, 39: 68, 48: 56, 60: 50 } },
        '7146': { name: 'TACOMA 2WD DOUBLE CAB SR5 AT', mrt: 41800, residuals: { 24: 82, 36: 75, 39: 75, 48: 62, 60: 55 } },
        '7148': { name: 'TACOMA 2WD DOUBLE CAB TRD SPORT AT', mrt: 45800, residuals: { 24: 80, 36: 73, 39: 73, 48: 61, 60: 55 } },
        '7162': { name: 'TACOMA 2WD XTRACAB SR AT', mrt: 35100, residuals: { 24: 78, 36: 70, 39: 70, 48: 57, 60: 51 } },
        '7166': { name: 'TACOMA 2WD XTRACAB TRD PRERUNNER AT', mrt: 40800, residuals: { 24: 75, 36: 67, 39: 67, 48: 55, 60: 50 } },
        '7170': { name: 'TACOMA 2WD DOUBLE CAB SR5 LB AT', mrt: 42200, residuals: { 24: 82, 36: 75, 39: 75, 48: 63, 60: 57 } },
        '7172': { name: 'TACOMA 2WD DOUBLE CAB TRD SPORT LB AT', mrt: 46300, residuals: { 24: 80, 36: 73, 39: 73, 48: 60, 60: 54 } },
        '7186': { name: 'TACOMA 2WD DOUBLE CAB SR AT', mrt: 36900, residuals: { 24: 85, 36: 78, 39: 78, 48: 64, 60: 57 } },
        '7514': { name: 'TACOMA 4WD XTRACAB SR AT', mrt: 38400, residuals: { 24: 78, 36: 71, 39: 71, 48: 60, 60: 55 } },
        '7540': { name: 'TACOMA 4WD DOUBLE CAB SR5 AT', mrt: 45100, residuals: { 24: 85, 36: 78, 39: 78, 48: 66, 60: 59 } },
        '7542': { name: 'TACOMA 4WD DOUBLE CAB TRD SPORT AT', mrt: 49100, residuals: { 24: 83, 36: 76, 39: 76, 48: 65, 60: 59 } },
        '7543': { name: 'TACOMA 4WD DOUBLE CAB TRD SPORT MT', mrt: 48300, residuals: { 24: 82, 36: 74, 39: 74, 48: 63, 60: 57 } },
        '7544': { name: 'TACOMA 4WD DOUBLE CAB TRD OFF ROAD AT', mrt: 52900, residuals: { 24: 83, 36: 76, 39: 76, 48: 65, 60: 59 } },
        '7545': { name: 'TACOMA 4WD DOUBLE CAB TRD OFF ROAD MT', mrt: 49600, residuals: { 24: 80, 36: 73, 39: 73, 48: 62, 60: 56 } },
        '7547': { name: 'TACOMA 4WD DOUBLE CAB SR MT', mrt: 40100, residuals: { 24: 85, 36: 79, 39: 79, 48: 66, 60: 59 } },
        '7558': { name: 'TACOMA 4WD XTRACAB SR5 AT', mrt: 42800, residuals: { 24: 77, 36: 69, 39: 69, 48: 58, 60: 52 } },
        '7566': { name: 'TACOMA 4WD DOUBLE CAB TRD SPORT LB AT', mrt: 49700, residuals: { 24: 83, 36: 76, 39: 76, 48: 64, 60: 58 } },
        '7568': { name: 'TACOMA 4WD DOUBLE CAB TRD OFF ROAD LB AT', mrt: 50000, residuals: { 24: 83, 36: 76, 39: 76, 48: 64, 60: 58 } },
        '7570': { name: 'TACOMA 4WD DOUBLE CAB SR5 LB AT', mrt: 45600, residuals: { 24: 84, 36: 77, 39: 77, 48: 65, 60: 59 } },
        '7582': { name: 'TACOMA 4WD DOUBLE CAB LIMITED AT', mrt: 54900, residuals: { 24: 76, 36: 70, 39: 70, 48: 60, 60: 54 } },
        '7594': { name: 'TACOMA 4WD DOUBLE CAB SR AT', mrt: 40300, residuals: { 24: 85, 36: 81, 39: 81, 48: 68, 60: 61 } },

        // 2026 TACOMA HYBRID
        '7530': { name: 'TACOMA HYBRID TRD SPORT', mrt: 53700, residuals: { 24: 82, 36: 75, 39: 75, 48: 64, 60: 57 } },
        '7532': { name: 'TACOMA HYBRID TRD OFF ROAD', mrt: 54300, residuals: { 24: 83, 36: 75, 39: 75, 48: 64, 60: 58 } },
        '7534': { name: 'TACOMA HYBRID LIMITED', mrt: 59500, residuals: { 24: 77, 36: 70, 39: 70, 48: 60, 60: 54 } },
        '7536': { name: 'TACOMA HYBRID TRAILHUNTER SB', mrt: 67200, residuals: { 24: 72, 36: 65, 39: 65, 48: 56, 60: 50 } },
        '7538': { name: 'TACOMA HYBRID TRAILHUNTER LB', mrt: 67700, residuals: { 24: 71, 36: 65, 39: 65, 48: 55, 60: 50 } },
        '7598': { name: 'TACOMA HYBRID TRD PRO', mrt: 68200, residuals: { 24: 71, 36: 65, 39: 65, 48: 55, 60: 50 } },

        // 2026 TUNDRA
        '8241': { name: 'TUNDRA 2WD DOUBLE CAB SR5 LB', mrt: 52500, residuals: { 24: 63, 36: 58, 39: 58, 48: 51, 60: 46 } },
        '8242': { name: 'TUNDRA 2WD DOUBLE CAB SR', mrt: 44400, residuals: { 24: 65, 36: 61, 39: 61, 48: 54, 60: 49 } },
        '8245': { name: 'TUNDRA 2WD DOUBLE CAB SR LB', mrt: 45100, residuals: { 24: 64, 36: 60, 39: 60, 48: 53, 60: 48 } },
        '8248': { name: 'TUNDRA 2WD CREWMAX SR', mrt: 46400, residuals: { 24: 66, 36: 65, 39: 65, 48: 56, 60: 51 } },
        '8261': { name: 'TUNDRA 2WD CREWMAX SR5', mrt: 57200, residuals: { 24: 67, 36: 61, 39: 61, 48: 53, 60: 47 } },
        '8272': { name: 'TUNDRA 2WD CREWMAX LIMITED', mrt: 61300, residuals: { 24: 68, 36: 61, 39: 61, 48: 53, 60: 47 } },
        '8275': { name: 'TUNDRA 2WD CREWMAX PLATINUM', mrt: 67800, residuals: { 24: 63, 36: 57, 39: 57, 48: 49, 60: 43 } },
        '8276': { name: 'TUNDRA 2WD CREWMAX 1794 EDITION', mrt: 68500, residuals: { 24: 63, 36: 56, 39: 56, 48: 48, 60: 43 } },
        '8281': { name: 'TUNDRA 2WD CREWMAX SR5 LB', mrt: 53700, residuals: { 24: 65, 36: 61, 39: 61, 48: 53, 60: 48 } },
        '8282': { name: 'TUNDRA 2WD CREWMAX LIMITED LB', mrt: 62100, residuals: { 24: 68, 36: 61, 39: 61, 48: 53, 60: 47 } },
        '8341': { name: 'TUNDRA 4WD DOUBLE CAB SR5', mrt: 55400, residuals: { 24: 66, 36: 60, 39: 60, 48: 52, 60: 47 } },
        '8342': { name: 'TUNDRA 4WD DOUBLE CAB SR', mrt: 47800, residuals: { 24: 66, 36: 64, 39: 64, 48: 56, 60: 50 } },
        '8346': { name: 'TUNDRA 4WD DOUBLE CAB SR5 LB', mrt: 55500, residuals: { 24: 67, 36: 61, 39: 61, 48: 53, 60: 47 } },
        '8348': { name: 'TUNDRA 4WD CREWMAX SR', mrt: 49900, residuals: { 24: 70, 36: 70, 39: 70, 48: 60, 60: 54 } },
        '8361': { name: 'TUNDRA 4WD CREWMAX SR5', mrt: 60200, residuals: { 24: 71, 36: 64, 39: 64, 48: 55, 60: 49 } },
        '8372': { name: 'TUNDRA 4WD CREWMAX LIMITED', mrt: 65000, residuals: { 24: 69, 36: 61, 39: 61, 48: 52, 60: 46 } },
        '8375': { name: 'TUNDRA 4WD CREWMAX PLATINUM', mrt: 72500, residuals: { 24: 66, 36: 58, 39: 58, 48: 49, 60: 43 } },
        '8376': { name: 'TUNDRA 4WD CREWMAX 1794 EDITION', mrt: 75300, residuals: { 24: 65, 36: 58, 39: 58, 48: 49, 60: 43 } },
        '8381': { name: 'TUNDRA 4WD CREWMAX SR5 LB', mrt: 58400, residuals: { 24: 68, 36: 64, 39: 64, 48: 55, 60: 49 } },
        '8382': { name: 'TUNDRA 4WD CREWMAX LIMITED LB', mrt: 65300, residuals: { 24: 68, 36: 61, 39: 61, 48: 52, 60: 46 } },
        '8385': { name: 'TUNDRA 4WD CREWMAX PLATINUM LB', mrt: 70500, residuals: { 24: 66, 36: 59, 39: 59, 48: 50, 60: 44 } },
        '8386': { name: 'TUNDRA 4WD CREWMAX 1794 EDITION LB', mrt: 74300, residuals: { 24: 65, 36: 58, 39: 58, 48: 49, 60: 43 } },

        // 2026 TUNDRA HYBRID
        '8401': { name: 'TUNDRA HYBRID CREWMAX LIMITED', mrt: 63300, residuals: { 24: 65, 36: 59, 39: 59, 48: 50, 60: 45 } },
        '8411': { name: 'TUNDRA HYBRID CREWMAX LIMITED LB', mrt: 65100, residuals: { 24: 66, 36: 59, 39: 59, 48: 50, 60: 45 } },
        '8421': { name: 'TUNDRA HYBRID CREWMAX LIMITED AWD', mrt: 67000, residuals: { 24: 68, 36: 60, 39: 60, 48: 52, 60: 46 } },
        '8422': { name: 'TUNDRA HYBRID CREWMAX PLATINUM AWD', mrt: 76900, residuals: { 24: 64, 36: 57, 39: 57, 48: 49, 60: 43 } },
        '8423': { name: 'TUNDRA HYBRID CREWMAX 1794 EDITION AWD', mrt: 76000, residuals: { 24: 64, 36: 57, 39: 57, 48: 48, 60: 43 } },
        '8424': { name: 'TUNDRA HYBRID CREWMAX TRD PRO AWD', mrt: 75800, residuals: { 24: 63, 36: 56, 39: 56, 48: 48, 60: 42 } },
        '8425': { name: 'TUNDRA HYBRID CREWMAX CAPSTONE AWD', mrt: 84100, residuals: { 24: 60, 36: 53, 39: 53, 48: 45, 60: 40 } },
        '8431': { name: 'TUNDRA HYBRID CREWMAX LIMITED LB AWD', mrt: 69100, residuals: { 24: 67, 36: 60, 39: 60, 48: 51, 60: 45 } },
        '8432': { name: 'TUNDRA HYBRID CREWMAX PLATINUM LB AWD', mrt: 77300, residuals: { 24: 64, 36: 57, 39: 57, 48: 48, 60: 43 } },
        '8433': { name: 'TUNDRA HYBRID CREWMAX 1794 EDITION LB AWD', mrt: 78000, residuals: { 24: 63, 36: 56, 39: 56, 48: 48, 60: 42 } },
        '8402': { name: 'TUNDRA HYBRID CREWMAX PLATINUM', mrt: 73300, residuals: { 24: 56, 36: 50, 39: 50, 48: 42, 60: 37 } },
        '8403': { name: 'TUNDRA HYBRID CREWMAX 1794 EDITION', mrt: 72300, residuals: { 24: 56, 36: 50, 39: 50, 48: 43, 60: 38 } },
    },

    // ========== RETAIL APR PROGRAMS (T-6028/26) ==========
    specialAPRPrograms: {
        '2026 bZ': {
            bonus: 3500,
            rates: {
                tier1: { 36: 0.00, 48: 0.00, 60: 0.00, 72: 0.00 },
                tier2: { 36: 0.99, 48: 0.99, 60: 0.99, 72: 0.99 },
                tier3: { 36: 1.99, 48: 1.99, 60: 1.99, 72: 1.99 },
                tier4: { 36: 2.99, 48: 2.99, 60: 2.99, 72: 2.99 }
            }
        },
        '2026 CAMRY HYBRID': {
            rates: {
                tier1: { 36: 1.99, 48: 2.99, 60: 3.99, 72: 3.99 },
                tier2: { 36: 2.99, 48: 3.99, 60: 4.99, 72: 4.99 },
                tier3: { 36: 3.99, 48: 4.99, 60: 5.99, 72: 5.99 },
                tier4: { 36: 4.99, 48: 5.99, 60: 6.99, 72: 6.99 }
            }
        },
        '2026 TACOMA': {
            rates: {
                tier1: { 36: 2.49, 48: 3.49, 60: 3.99, 72: 4.99 },
                tier2: { 36: 3.49, 48: 4.49, 60: 4.99, 72: 5.99 },
                tier3: { 36: 4.49, 48: 5.49, 60: 5.99, 72: 6.99 },
                tier4: { 36: 5.49, 48: 6.49, 60: 6.99, 72: 7.99 }
            }
        },
        '2026 TUNDRA': {
            rates: {
                tier1: { 36: 2.99, 48: 2.99, 60: 2.99, 72: 2.99 },
                tier2: { 36: 3.99, 48: 3.99, 60: 3.99, 72: 3.99 },
                tier3: { 36: 4.99, 48: 4.99, 60: 4.99, 72: 4.99 },
                tier4: { 36: 5.99, 48: 5.99, 60: 5.99, 72: 5.99 }
            }
        },
        '2025 TACOMA HYBRID': {
            rates: {
                tier1: { 36: 1.99, 48: 2.99, 60: 3.99, 72: 3.99 },
                tier2: { 36: 2.99, 48: 3.99, 60: 4.99, 72: 4.99 },
                tier3: { 36: 3.99, 48: 4.99, 60: 5.99, 72: 5.99 },
                tier4: { 36: 4.99, 48: 5.99, 60: 6.99, 72: 6.99 }
            }
        },
        '2025 TUNDRA': {
            rates: {
                tier1: { 36: 1.99, 48: 1.99, 60: 1.99, 72: 1.99 },
                tier2: { 36: 2.99, 48: 2.99, 60: 2.99, 72: 2.99 },
                tier3: { 36: 3.99, 48: 3.99, 60: 3.99, 72: 3.99 },
                tier4: { 36: 4.99, 48: 4.99, 60: 4.99, 72: 4.99 }
            }
        },
        '2025 TUNDRA HYBRID': {
            rates: {
                tier1: { 36: 1.99, 48: 1.99, 60: 1.99, 72: 1.99 },
                tier2: { 36: 2.99, 48: 2.99, 60: 2.99, 72: 2.99 },
                tier3: { 36: 3.99, 48: 3.99, 60: 3.99, 72: 3.99 },
                tier4: { 36: 4.99, 48: 4.99, 60: 4.99, 72: 4.99 }
            }
        },
        '2025 RAV4': {
            rates: {
                tier1: { 36: 1.99, 48: 2.99, 60: 3.99, 72: 3.99 },
                tier2: { 36: 2.99, 48: 3.99, 60: 4.99, 72: 4.99 },
                tier3: { 36: 3.99, 48: 4.99, 60: 5.99, 72: 5.99 },
                tier4: { 36: 4.99, 48: 5.99, 60: 6.99, 72: 6.99 }
            }
        },
        '2025 RAV4 HYBRID': {
            rates: {
                tier1: { 36: 1.99, 48: 2.99, 60: 3.99, 72: 3.99 },
                tier2: { 36: 2.99, 48: 3.99, 60: 4.99, 72: 4.99 },
                tier3: { 36: 3.99, 48: 4.99, 60: 5.99, 72: 5.99 },
                tier4: { 36: 4.99, 48: 5.99, 60: 6.99, 72: 6.99 }
            }
        },
        '2025 RAV4 PHEV': {
            rates: {
                tier1: { 36: 1.99, 48: 2.99, 60: 3.99, 72: 3.99 },
                tier2: { 36: 2.99, 48: 3.99, 60: 4.99, 72: 4.99 },
                tier3: { 36: 3.99, 48: 4.99, 60: 5.99, 72: 5.99 },
                tier4: { 36: 4.99, 48: 5.99, 60: 6.99, 72: 6.99 }
            }
        },
        '2025 TACOMA': {
            rates: {
                tier1: { 36: 2.49, 48: 3.49, 60: 3.99, 72: 4.99 },
                tier2: { 36: 3.49, 48: 4.49, 60: 4.99, 72: 5.99 },
                tier3: { 36: 4.49, 48: 5.49, 60: 5.99, 72: 6.99 },
                tier4: { 36: 5.49, 48: 6.49, 60: 6.99, 72: 7.99 }
            }
        }
    },

    standardRetailRates: {
        ltvLow: { '740+': 6.24, '720-739': 6.74, '700-719': 7.74, '680-699': 7.99, '660-679': 8.19 },
        ltvMid: { '740+': 6.44, '720-739': 6.89, '700-719': 8.04, '680-699': 8.59, '660-679': 9.59 },
        ltvHigh: { '740+': 8.34, '720-739': 8.79, '700-719': 9.99, '680-699': 11.49, '660-679': 12.49 }
    }
};


// ========== HELPER FUNCTIONS ==========

export const getCreditTierNumber = (score) => {
    if (score >= 720) return 1;
    if (score >= 680) return 2;
    if (score >= 650) return 3;
    if (score >= 600) return 4;
    return null;
};

export const getCreditTier = (score) => {
    const { creditTiers } = TOYOTA_FINANCE_DATA;
    if (score >= creditTiers.tier1.min) return { ...creditTiers.tier1, number: 1 };
    if (score >= creditTiers.tier2.min) return { ...creditTiers.tier2, number: 2 };
    if (score >= creditTiers.tier3.min) return { ...creditTiers.tier3, number: 3 };
    if (score >= creditTiers.tier4.min) return { ...creditTiers.tier4, number: 4 };
    return null;
};

export const getLTVBucket = (ltv) => {
    if (ltv <= 110) return 'ltv110';
    if (ltv <= 120) return 'ltv120';
    if (ltv <= 130) return 'ltv130';
    return null;
};

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

export const getMoneyFactor = (modelCode, tier, ltv, term) => {
    const tierKey = `tier${tier}`;
    const ltvBucket = getLTVBucket(ltv);

    if (!ltvBucket) return null;

    const specialProgram = findSpecialLeaseProgram(modelCode, term);

    if (specialProgram && specialProgram.moneyFactors) {
        const mf = specialProgram.moneyFactors[tierKey]?.[ltvBucket];
        if (mf !== undefined && mf !== null) {
            return { moneyFactor: mf, isSpecial: true, programName: specialProgram.programName };
        }
    }

    const standardRates = TOYOTA_FINANCE_DATA.standardLeaseRates.upTo51Months;
    let mf = standardRates[tierKey]?.[ltvBucket];

    if (term >= 52 && mf) {
        mf += TOYOTA_FINANCE_DATA.standardLeaseRates.term52to60Adjustment;
    }

    return mf ? { moneyFactor: mf, isSpecial: false } : null;
};

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

    const effectiveDownPayment = downPayment + bonus;
    const grossCapCost = sellingPrice + adminFee;
    const capCostReduction = effectiveDownPayment + tradeIn;
    const adjustedCapCost = grossCapCost - capCostReduction;

    const residualBase = Math.min(sellingPrice, mrt);
    const residualValue = Math.round(residualBase * (residualPercent / 100));

    const depreciation = (adjustedCapCost - residualValue) / term;
    const financeCharge = (adjustedCapCost + residualValue) * moneyFactor;
    const basePayment = depreciation + financeCharge;

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
