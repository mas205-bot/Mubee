import { ApplianceType, DecisionCalculation, RecommendationType, DiagnosedIssueOption } from '../types';

export interface ApplianceMetadata {
  label: string;
  defaultLifespan: number; // years
  averageReplacementPrice: number;
  averageManufacturingCarbonKg: number;
  commonSymptoms: string[];
  quickDIYTips: string[];
}

export const APPLIANCE_SPECS: Record<ApplianceType, ApplianceMetadata> = {
  refrigerator: {
    label: 'Refrigerator & Freezer',
    defaultLifespan: 12,
    averageReplacementPrice: 1200,
    averageManufacturingCarbonKg: 280,
    commonSymptoms: [
      'Compressor running continuously / not cooling',
      'Water pooling under crisper drawers',
      'Freezer icing up / defrost drain clogged',
      'Strange buzzing or clicking noise',
      'Dispenser not dispensing ice/water'
    ],
    quickDIYTips: [
      'Vacuum and brush condenser coils underneath or behind unit',
      'Check rubber door gaskets with dollar-bill tension test',
      'Inspect defrost drain hole for frozen blockage',
      'Ensure 2-inch clearance from wall for ventilation'
    ]
  },
  washing_machine: {
    label: 'Washing Machine',
    defaultLifespan: 10,
    averageReplacementPrice: 850,
    averageManufacturingCarbonKg: 220,
    commonSymptoms: [
      'Violent shaking / unbalanced during spin cycle',
      'Will not drain / standing water in drum',
      'Drum not spinning / motor humming',
      'Water leaking from front boot or hoses',
      'Error code indicating pump or lock fault'
    ],
    quickDIYTips: [
      'Clear debris filter / coin trap at bottom front panel',
      'Inspect intake supply hoses for kinks or clogged mesh screens',
      'Check leveling feet with a spirit level to stop vibration',
      'Run hot vinegar cycle to clear soap scum buildup'
    ]
  },
  dryer: {
    label: 'Clothes Dryer',
    defaultLifespan: 13,
    averageReplacementPrice: 750,
    averageManufacturingCarbonKg: 190,
    commonSymptoms: [
      'Drum spins but no heat generated',
      'Clothes take 2-3 cycles to dry',
      'Squealing or scraping metal noise',
      'Dryer shuts off after 5 minutes',
      'Burning smell or excessive exterior heat'
    ],
    quickDIYTips: [
      'Disassemble and vacuum entire exterior vent ducting pipe',
      'Clean lint trap screen with warm soapy water to remove film',
      'Check thermal fuse continuity with a multimeter',
      'Inspect drive belt for slippage or cracks'
    ]
  },
  dishwasher: {
    label: 'Dishwasher',
    defaultLifespan: 9,
    averageReplacementPrice: 700,
    averageManufacturingCarbonKg: 160,
    commonSymptoms: [
      'Dishes come out dirty with gritty residue',
      'Water pooling in bottom basin after cycle',
      'Float switch stuck / won’t fill with water',
      'Leaking around door perimeter or latch',
      'Loud grinding noise from wash impeller'
    ],
    quickDIYTips: [
      'Unscrew and rinse cylindrical filter at base of tub',
      'Use toothpick to unclog spray arm water jet nozzles',
      'Verify garbage disposal knockout plug was removed',
      'Check float switch moves up and down freely'
    ]
  },
  laptop: {
    label: 'Laptop / PC',
    defaultLifespan: 5,
    averageReplacementPrice: 900,
    averageManufacturingCarbonKg: 350,
    commonSymptoms: [
      'Battery dies within 15 minutes / swollen chassis',
      'Screen flickering or lines through display',
      'Overheating with fan running at maximum speed',
      'Keyboard keys unresponsive or liquid spill',
      'Operating system bluescreen / drive failure'
    ],
    quickDIYTips: [
      'Blow compressed air into heat exhaust vents to clear dust',
      'Check battery health diagnostics in OS command tool',
      'Run hardware diagnostic tool via BIOS/UEFI boot menu',
      'Reseat RAM modules and test SSD health with SMART test'
    ]
  },
  microwave: {
    label: 'Microwave Oven',
    defaultLifespan: 8,
    averageReplacementPrice: 220,
    averageManufacturingCarbonKg: 65,
    commonSymptoms: [
      'Turns on and spins but does not heat food',
      'Sparks / arcing inside cavity near wave guide',
      'Door latch switch broken / won’t start',
      'Keypad buttons unresponsive',
      'Loud buzzing or humming transformer sound'
    ],
    quickDIYTips: [
      'Inspect and replace burnt mica wave guide cover ($8 part)',
      'Clean interior walls thoroughly of grease splatter',
      'Test internal door microswitches for physical click',
      'WARNING: Never open high-voltage capacitor without discharge'
    ]
  },
  hvac_ac: {
    label: 'HVAC / Central AC',
    defaultLifespan: 15,
    averageReplacementPrice: 4500,
    averageManufacturingCarbonKg: 950,
    commonSymptoms: [
      'Blowing room-temperature air on cool mode',
      'Outside condenser unit fan not spinning',
      'Ice forming on evaporator coils or copper line',
      'Frequent short cycling on and off',
      'Musty smell or water dripping in furnace closet'
    ],
    quickDIYTips: [
      'Replace air filter immediately (a clogged filter freezes coils)',
      'Flush condensate drain line with 1 cup white vinegar',
      'Hose down exterior condenser fins to remove dirt and leaves',
      'Verify thermostat batteries and reset breaker switch'
    ]
  },
  oven_range: {
    label: 'Oven & Range',
    defaultLifespan: 14,
    averageReplacementPrice: 950,
    averageManufacturingCarbonKg: 240,
    commonSymptoms: [
      'Bake element not glowing orange or broken',
      'Temperature inaccurate by 50+ degrees',
      'Gas igniter clicks but will not light',
      'Glass door shattered or handle loose',
      'Error code on electronic control panel'
    ],
    quickDIYTips: [
      'Visually inspect heating element for blisters or breaks',
      'Calibrate oven thermostat in settings menu',
      'Clean burner caps and igniter tips with dry brass brush',
      'Check 240V dual breaker has not tripped one phase'
    ]
  },
  water_heater: {
    label: 'Water Heater',
    defaultLifespan: 11,
    averageReplacementPrice: 1100,
    averageManufacturingCarbonKg: 310,
    commonSymptoms: [
      'Water only stays warm for 5 minutes',
      'Rust-colored water or sulfur smell',
      'Popping or rumbling sound from tank base',
      'Water dripping around temperature relief valve',
      'Pilot light goes out repeatedly'
    ],
    quickDIYTips: [
      'Flush sediment from bottom tank drain valve with hose',
      'Inspect and replace sacrificial anode rod',
      'Check heating elements with multimeter (electric)',
      'Relight thermocouple following manufacturer pilot procedure'
    ]
  },
  television: {
    label: 'Smart TV / Electronics',
    defaultLifespan: 7,
    averageReplacementPrice: 650,
    averageManufacturingCarbonKg: 180,
    commonSymptoms: [
      'Sound plays but dark screen with no picture',
      'Backlight flickering or half-screen dimming',
      'Standby light blinks error code sequence',
      'HDMI inputs no longer detecting signal',
      'Physical crack or pressure mark on panel'
    ],
    quickDIYTips: [
      'Perform flashlight test against screen to check for backlight failure',
      'Power cycle by holding power button for 60s while unplugged',
      'Try alternate high-speed HDMI 2.1 cable and input port',
      'Note: Cracked panel replacement usually exceeds TV price'
    ]
  }
};

/**
 * Common Diagnosed Issues Catalog with Component-Level Cost & Lifespan Expectancies
 */
export const DIAGNOSED_ISSUES_CATALOG: DiagnosedIssueOption[] = [
  // Refrigerator issues
  {
    id: 'ref-comp-01',
    applianceType: 'refrigerator',
    title: 'Seized Hermetic Compressor / Sealed System Leak',
    component: 'Compressor & Refrigerant Charge',
    description: 'Compressor clicks on for 3 seconds and clicks off. Freon pressure drop and burning smell.',
    severity: 'critical',
    estimatedRepairCost: 680,
    partsCostEstimate: 420,
    laborCostEstimate: 260,
    repairedAddedLifespanYears: 4,
    typicalReplacementCost: 1250,
    newUnitLifespanYears: 12,
    recommendationDefault: 'REPLACE',
    rationaleTemplate: 'Sealed system compressor replacements exceed 50% of machine value. If the unit is over 6 years old, surrounding copper lines and evaporator often suffer pinhole leaks shortly after.',
    diyFeasibility: 'Professional Required'
  },
  {
    id: 'ref-fan-02',
    applianceType: 'refrigerator',
    title: 'Evaporator Fan Motor Failure',
    component: 'Evaporator Circulation Fan',
    description: 'Fresh food compartment warm (50°F+), freezer cold (-5°F). Rattling sound behind back freezer panel.',
    severity: 'moderate',
    estimatedRepairCost: 185,
    partsCostEstimate: 65,
    laborCostEstimate: 120,
    repairedAddedLifespanYears: 6,
    typicalReplacementCost: 1250,
    newUnitLifespanYears: 12,
    recommendationDefault: 'REPAIR',
    rationaleTemplate: 'Low-cost motor replacement. Restores complete airflow. Extremely high return on investment with 6+ years of continued life.',
    diyFeasibility: 'Advanced DIY'
  },
  {
    id: 'ref-defrost-03',
    applianceType: 'refrigerator',
    title: 'Defrost Thermostat / Bi-Metal Fuse Open',
    component: 'Defrost Heater & Thermostat',
    description: 'Frost buildup covering back wall of freezer, blocking air channels to fresh food compartment.',
    severity: 'moderate',
    estimatedRepairCost: 140,
    partsCostEstimate: 35,
    laborCostEstimate: 105,
    repairedAddedLifespanYears: 5,
    typicalReplacementCost: 1250,
    newUnitLifespanYears: 12,
    recommendationDefault: 'REPAIR',
    rationaleTemplate: 'Inexpensive sensor/heater repair that restores auto-defrost cycle completely for minimal cost.',
    diyFeasibility: 'Advanced DIY'
  },

  // Washing Machine issues
  {
    id: 'wash-bearings-01',
    applianceType: 'washing_machine',
    title: 'Blown Tub Bearings & Cracked Spider Arm',
    component: 'Rear Tub Bearing Assembly',
    description: 'Extreme jet-engine roar during spin cycle, metal shavings underneath, basket has 1-inch play.',
    severity: 'critical',
    estimatedRepairCost: 650,
    partsCostEstimate: 380,
    laborCostEstimate: 270,
    repairedAddedLifespanYears: 3,
    typicalReplacementCost: 850,
    newUnitLifespanYears: 10,
    recommendationDefault: 'REPLACE',
    rationaleTemplate: 'Full rear-tub overhaul requires 4+ hours of labor. At 76% of replacement price, buying a new high-efficiency washer saves money.',
    diyFeasibility: 'Professional Required'
  },
  {
    id: 'wash-pump-02',
    applianceType: 'washing_machine',
    title: 'Drain Pump Jammed / Motor Burnt',
    component: 'Magnetic Drive Drain Pump',
    description: 'Water standing in tub at cycle end, OE or 5E drain error code, hum when draining.',
    severity: 'moderate',
    estimatedRepairCost: 165,
    partsCostEstimate: 55,
    laborCostEstimate: 110,
    repairedAddedLifespanYears: 5,
    typicalReplacementCost: 850,
    newUnitLifespanYears: 10,
    recommendationDefault: 'REPAIR',
    rationaleTemplate: 'Standard maintenance repair. Replacing the drain pump is fast and grants 5+ years of trouble-free operation.',
    diyFeasibility: 'Simple DIY'
  },

  // Dryer issues
  {
    id: 'dry-fuse-01',
    applianceType: 'dryer',
    title: 'Thermal Fuse Blown / Restricted Exhaust',
    component: 'Thermal Cutoff Fuse',
    description: 'Dryer drum turns on and rotates, but heating element does not fire / no heat.',
    severity: 'moderate',
    estimatedRepairCost: 110,
    partsCostEstimate: 20,
    laborCostEstimate: 90,
    repairedAddedLifespanYears: 6,
    typicalReplacementCost: 750,
    newUnitLifespanYears: 13,
    recommendationDefault: 'REPAIR',
    rationaleTemplate: 'Highly cost-effective. Replacing the $20 safety fuse and cleaning the vent restores 100% heating functionality.',
    diyFeasibility: 'Simple DIY'
  },

  // Dishwasher issues
  {
    id: 'dish-circ-01',
    applianceType: 'dishwasher',
    title: 'Circulation Wash Pump Motor Burnout',
    component: 'BLDC Wash Impeller & Pump',
    description: 'Water fills in tub but spray arms never turn. Humming noise followed by E15 / F2 error code.',
    severity: 'critical',
    estimatedRepairCost: 310,
    partsCostEstimate: 160,
    laborCostEstimate: 150,
    repairedAddedLifespanYears: 4,
    typicalReplacementCost: 700,
    newUnitLifespanYears: 9,
    recommendationDefault: 'CONSULT_PRO',
    rationaleTemplate: 'At 44% of replacement cost, if the dishwasher is under 4 years old, repair is recommended. If over 6 years old, replace with a quieter modern unit.',
    diyFeasibility: 'Advanced DIY'
  },

  // Laptop issues
  {
    id: 'lap-batt-01',
    applianceType: 'laptop',
    title: 'Swollen Li-Ion Battery / Touchpad Lift',
    component: 'Internal Rechargeable Battery Pack',
    description: 'Trackpad raised or clicking stuck, battery discharges in under 20 minutes, chassis separation.',
    severity: 'moderate',
    estimatedRepairCost: 175,
    partsCostEstimate: 95,
    laborCostEstimate: 80,
    repairedAddedLifespanYears: 3,
    typicalReplacementCost: 950,
    newUnitLifespanYears: 5,
    recommendationDefault: 'REPAIR',
    rationaleTemplate: 'Battery swap saves ~$775. High-spec laptop CPU and motherboard have years of capability remaining.',
    diyFeasibility: 'Advanced DIY'
  },

  // HVAC issues
  {
    id: 'hvac-cap-01',
    applianceType: 'hvac_ac',
    title: 'Dual Run Capacitor Failure',
    component: '45/5 MFD Dual Run Capacitor',
    description: 'Condenser fan hums but does not start. Compressor unable to turn over. Air blows warm.',
    severity: 'critical',
    estimatedRepairCost: 195,
    partsCostEstimate: 35,
    laborCostEstimate: 160,
    repairedAddedLifespanYears: 6,
    typicalReplacementCost: 4500,
    newUnitLifespanYears: 15,
    recommendationDefault: 'REPAIR',
    rationaleTemplate: 'Single fastest and cheapest HVAC repair. Saves thousands over unnecessary system replacement.',
    diyFeasibility: 'Professional Required'
  }
];

/**
 * FixBeforeBuy Decision Engine Algorithm
 * Evaluates:
 * 1. 50% Rule (if repair > 50% of new cost AND age > 50% of lifespan)
 * 2. Lifespan comparison: Repaired unit expected life vs New unit expected life
 * 3. Annualized Cost Comparison: ($Repair / RepairedLifespan) vs ($New / NewLifespan)
 * 4. Depreciated current value
 * 5. Carbon emissions footprint avoided
 */
export function calculateRepairOrReplace(params: {
  applianceType: ApplianceType;
  ageYears: number;
  originalPrice: number;
  estimatedRepairCost: number;
  replacementCost: number;
  severity?: 'low' | 'moderate' | 'critical';
  diagnosedAddedLifespanYears?: number;
}): DecisionCalculation {
  const { 
    applianceType, 
    ageYears, 
    originalPrice, 
    estimatedRepairCost, 
    replacementCost,
    diagnosedAddedLifespanYears 
  } = params;

  const spec = APPLIANCE_SPECS[applianceType] || APPLIANCE_SPECS.refrigerator;
  const lifespan = spec.defaultLifespan;
  const safeAge = Math.max(0.1, ageYears);
  const safeReplacement = Math.max(50, replacementCost);
  const safeRepair = Math.max(0, estimatedRepairCost);

  // Lifespan estimates
  const remainingNaturalLifespan = Math.max(1, lifespan - safeAge);
  const repairedExpectedLifespanYears = diagnosedAddedLifespanYears 
    ? diagnosedAddedLifespanYears 
    : Math.max(1.5, Math.min(6, Math.round(remainingNaturalLifespan * 0.8 * 10) / 10));

  const newExpectedLifespanYears = lifespan;

  // Annualized operating cost calculation ($/year)
  const annualizedRepairCost = Math.round(safeRepair / Math.max(1, repairedExpectedLifespanYears));
  const annualizedReplacementCost = Math.round(safeReplacement / Math.max(1, newExpectedLifespanYears));

  // Ratios
  const ageRatio = safeAge / lifespan;
  const costRatio = safeRepair / safeReplacement;

  // Depreciated value
  const depreciationFactor = Math.max(0.08, 1 - (safeAge / lifespan));
  const currentEstimatedValue = Math.round(originalPrice * depreciationFactor);

  // 50% Rule: Breached if repair costs > 50% of replacement AND unit is beyond half its life
  const fiftyPercentRuleBreached = (costRatio >= 0.5 && ageRatio >= 0.5) || costRatio >= 0.75;

  let recommendation: RecommendationType = 'REPAIR';
  let primaryReason = '';
  let savings = 0;
  let confidenceScore = 85;

  // Decision logic
  if (ageRatio >= 1.0) {
    if (costRatio > 0.35) {
      recommendation = 'REPLACE';
      savings = Math.max(0, safeRepair);
      primaryReason = `This ${spec.label} is ${ageYears} years old, exceeding its typical ${lifespan}-year lifespan. Repaired unit would only last ~${repairedExpectedLifespanYears} years at $${annualizedRepairCost}/year. Buying new ($${annualizedReplacementCost}/year over ${newExpectedLifespanYears} years) brings modern energy efficiency and warranty.`;
      confidenceScore = 92;
    } else {
      recommendation = 'CONSULT_PRO';
      savings = Math.max(0, safeReplacement - safeRepair);
      primaryReason = `The appliance has exceeded its ${lifespan}-year life, but the repair of $${safeRepair} is modest (${Math.round(costRatio * 100)}% of replacement). If core frame and motors are intact, the repair extends life by ~${repairedExpectedLifespanYears} years at $${annualizedRepairCost}/year.`;
      confidenceScore = 78;
    }
  } else if (fiftyPercentRuleBreached) {
    recommendation = 'REPLACE';
    savings = Math.max(0, Math.round(safeReplacement * 0.15));
    primaryReason = `Breaches the Industry 50% Rule: Repair cost ($${safeRepair}) is ${Math.round(costRatio * 100)}% of a new machine, and the unit has consumed ${Math.round(ageRatio * 100)}% of its life. Investing $${annualizedRepairCost}/year for only ${repairedExpectedLifespanYears} years of life is financially worse than a new unit with ${newExpectedLifespanYears} years of life at $${annualizedReplacementCost}/year.`;
    confidenceScore = 90;
  } else if (safeRepair <= safeReplacement * 0.45) {
    recommendation = 'REPAIR';
    savings = Math.max(0, safeReplacement - safeRepair);
    primaryReason = `Repairing saves approximately $${savings}. Annual cost of repairing is only $${annualizedRepairCost}/year over ~${repairedExpectedLifespanYears} extended operating years, compared to $${safeReplacement} upfront ($${annualizedReplacementCost}/year) for a new appliance.`;
    confidenceScore = 94;
  } else {
    // Borderline zone
    if (ageRatio < 0.4) {
      recommendation = 'REPAIR';
      savings = Math.max(0, safeReplacement - safeRepair);
      primaryReason = `The machine is young (${ageYears} yrs vs ${lifespan} yr lifespan). Repairing for $${safeRepair} preserves the remaining ${repairedExpectedLifespanYears} years of operation at $${annualizedRepairCost}/year.`;
      confidenceScore = 82;
    } else {
      recommendation = 'CONSULT_PRO';
      savings = Math.max(0, safeReplacement - safeRepair);
      primaryReason = `Borderline scenario: Repair quote is ${Math.round(costRatio * 100)}% of replacement. Annualized repair cost ($${annualizedRepairCost}/year) is comparable to annualized replacement cost ($${annualizedReplacementCost}/year). Have a technician inspect secondary components before deciding.`;
      confidenceScore = 75;
    }
  }

  // Calculate carbon savings
  const carbonSavingsKg = recommendation === 'REPAIR' 
    ? Math.round(spec.averageManufacturingCarbonKg * 0.85)
    : 0;

  return {
    recommendation,
    primaryReason,
    savings,
    isRepairCheaper: safeRepair < safeReplacement,
    fiftyPercentRuleBreached,
    ageRatio,
    costRatio,
    currentEstimatedValue,
    carbonSavingsKg,
    confidenceScore,
    diyChecklist: spec.quickDIYTips,
    repairedExpectedLifespanYears,
    newExpectedLifespanYears,
    annualizedRepairCost,
    annualizedReplacementCost
  };
}
