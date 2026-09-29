import { Charge, ReviewItem, EvidenceRecord, RequirementCheck } from '../types';

export const INITIAL_CHARGES: Charge[] = [
  {
    id: 'CHG-001',
    unitId: 'UNIT-0047',
    chargeType: 'Fulfillment Fee',
    amount: 842.50,
    currency: '₹',
    decision: 'CLAIM',
    confidence: 94,
    evidenceCount: 3,
    status: 'Ready',
    date: '2026-03-18',
    sku: 'SKU-ECOM-8831',
    fulfillmentCenter: 'FC-BLR1 (Whitefield Hub)',
    decisionExplanation: 'The available operational evidence supports recovery and the applicable requirements are satisfied. The billing system calculated standard tier overage (1,850g) while calibrated pack station scale recorded 920g.',
    billedMetric: 'Billed Weight: 1.85 kg (Large Heavy Tier)',
    actualMetric: 'Measured Weight: 0.92 kg (Standard Envelope)',
    variance: 'Delta: -0.93 kg overcharge (+101%)',
    requirements: [
      {
        id: 'REQ-01',
        name: 'Receiving requirement',
        category: 'Receiving',
        status: 'PASS',
        description: 'Physical inbound tare verification recorded at dock gate',
        ruleCode: 'RCV-SEC-402',
        details: 'Unit matched inbound manifest with verified 0.92kg tare weight certificate on arrival.'
      },
      {
        id: 'REQ-02',
        name: 'Operational requirement',
        category: 'Operational',
        status: 'PASS',
        description: 'No secondary packing expansion or hazardous material prep invoked',
        ruleCode: 'OPS-DIMS-118',
        details: 'Prep station bypassed bubble-bagging and passed directly to poly-pack line 4.'
      },
      {
        id: 'REQ-03',
        name: 'Evidence requirement',
        category: 'Evidence',
        status: 'PASS',
        description: 'Dual sensor correlation between Pack scale and Cubiscan scanner',
        ruleCode: 'EVD-DUAL-901',
        details: 'Station PK-08 scale logged 920.4g at 14:22:04 IST; Cubiscan logged 22x14x4 cm.'
      }
    ],
    evidence: [
      {
        id: 'EVD-4081',
        manager: 'Receiving Manager',
        timestamp: '2026-03-14 09:12:44 IST',
        stationId: 'RCV-DOCK-02',
        operatorId: 'OP-4891',
        type: 'Optical Tare Weighment',
        description: 'Inbound carton scanned. Tare weight recorded at 918g with zero box distortion.',
        metric: '0.918 kg / 22x14x4 cm',
        systemRef: 'RCV-LPN-882193',
        status: 'VERIFIED'
      },
      {
        id: 'EVD-4082',
        manager: 'Prep Manager',
        timestamp: '2026-03-15 11:34:02 IST',
        stationId: 'PREP-LINE-04',
        operatorId: 'OP-2210',
        type: 'Prep Bypass Verification',
        description: 'Single-unit barcode verified. No secondary dunnage or bubble wrap added.',
        metric: 'Standard Poly-Mail (Zero added weight)',
        systemRef: 'PRP-ROUT-00921',
        status: 'VERIFIED'
      },
      {
        id: 'EVD-4083',
        manager: 'Pack Manager',
        timestamp: '2026-03-18 14:22:04 IST',
        stationId: 'PACK-STA-08',
        operatorId: 'OP-7734',
        type: 'Outbound Cubiscan Telemetry',
        description: 'Final shipping label applied. Optical dimensions: 22.1 x 14.2 x 4.1 cm, weight: 920.4g.',
        metric: '0.920 kg (Billed at 1.850 kg)',
        systemRef: 'PK-SCL-99411',
        status: 'VERIFIED'
      }
    ]
  },
  {
    id: 'CHG-002',
    unitId: 'UNIT-0089',
    chargeType: 'Lost Inbound Reimbursement',
    amount: 1420.00,
    currency: '₹',
    decision: 'CLAIM',
    confidence: 98,
    evidenceCount: 4,
    status: 'Ready',
    date: '2026-03-17',
    sku: 'SKU-ECOM-1049',
    fulfillmentCenter: 'FC-DEL2 (Bilasput West)',
    decisionExplanation: 'The unit was checked into dock reception via verified BOL receipt but was never routed to active bin storage within the contractual 72-hour SLA window. Full recovery warranted under Clause 8.2.',
    billedMetric: 'Inbound Status: Unlocated after Dock Check-in',
    actualMetric: 'Contractual SLA: 72h Expired (Current: 14 days)',
    variance: 'Recoverable inventory indemnity: ₹1,420.00',
    requirements: [
      {
        id: 'REQ-10',
        name: 'Receiving requirement',
        category: 'Receiving',
        status: 'PASS',
        description: 'Inbound Bill of Lading (BOL) signed and dock check-in logged',
        ruleCode: 'RCV-BOL-003',
        details: 'Dock scan confirmed receipt of master carton containing UNIT-0089.'
      },
      {
        id: 'REQ-11',
        name: 'Operational requirement',
        category: 'Operational',
        status: 'PASS',
        description: 'SLA elapsed without put-away scan or bin assignment',
        ruleCode: 'OPS-SLA-72H',
        details: 'Put-away queue timeout triggered after 72 hours; last scan remained at dock sorting cage.'
      },
      {
        id: 'REQ-12',
        name: 'Evidence requirement',
        category: 'Evidence',
        status: 'PASS',
        description: 'Carrier stamped proof of delivery with signed manifest',
        ruleCode: 'EVD-CARRIER-POD',
        details: 'Signed manifest and gate security log corroborate carton intake at FC-DEL2.'
      }
    ],
    evidence: [
      {
        id: 'EVD-5101',
        manager: 'Receiving Manager',
        timestamp: '2026-03-03 08:44:11 IST',
        stationId: 'RCV-GATE-01',
        operatorId: 'OP-1102',
        type: 'Carrier BOL Intake',
        description: 'Carrier manifest scanned and accepted. 48 units checked into sorting cage 3.',
        metric: '48/48 units accepted',
        systemRef: 'BOL-DEL2-8819',
        status: 'VERIFIED'
      },
      {
        id: 'EVD-5102',
        manager: 'Receiving Manager',
        timestamp: '2026-03-04 12:00:00 IST',
        stationId: 'RCV-STAGING-C3',
        operatorId: 'SYS-MONITOR',
        type: 'Staging Audit Check',
        description: 'Cage C3 cleared for put-away. Unit tag UNIT-0089 failed automated conveyer read.',
        metric: 'Last Known Location: Cage C3',
        systemRef: 'AUD-STG-2004',
        status: 'FLAGGED'
      },
      {
        id: 'EVD-5103',
        manager: 'Returns Manager',
        timestamp: '2026-03-10 18:30:00 IST',
        stationId: 'RET-SYSTEM',
        operatorId: 'SYS-AUDIT',
        type: 'Negative Inventory Sweep',
        description: 'FC floor sweep confirmed item not found in overstock or reserve aisles.',
        metric: 'Search Result: 0 units located',
        systemRef: 'SWP-FLR-902',
        status: 'VERIFIED'
      }
    ]
  },
  {
    id: 'CHG-003',
    unitId: 'UNIT-0112',
    chargeType: 'Weight Discrepancy Fee',
    amount: 315.00,
    currency: '₹',
    decision: 'REJECT',
    confidence: 91,
    evidenceCount: 3,
    status: 'Ready',
    date: '2026-03-16',
    sku: 'SKU-ECOM-3392',
    fulfillmentCenter: 'FC-BOM1 (Bhiwandi Central)',
    decisionExplanation: 'The operational evidence confirms that the billed weight matches the pack station scale within the allowable 2.5% tolerance. Carrier scale verified 1.48kg against 1.50kg billed.',
    billedMetric: 'Billed Weight: 1.50 kg',
    actualMetric: 'Measured Weight: 1.48 kg',
    variance: 'Delta: 0.02 kg (Within 2.5% calibration margin)',
    requirements: [
      {
        id: 'REQ-21',
        name: 'Receiving requirement',
        category: 'Receiving',
        status: 'PASS',
        description: 'Inbound weight recorded within valid margin',
        ruleCode: 'RCV-TOL-010',
        details: 'Inbound weight recorded at 1.47kg on bulk intake.'
      },
      {
        id: 'REQ-22',
        name: 'Operational requirement',
        category: 'Operational',
        status: 'FAIL',
        description: 'Overcharge delta exceeds minimum recovery threshold (₹50 / 5%)',
        ruleCode: 'OPS-MTH-005',
        details: 'Actual delta is 20g / ₹4.20 fee difference, which falls below contract threshold.'
      },
      {
        id: 'REQ-23',
        name: 'Evidence requirement',
        category: 'Evidence',
        status: 'PASS',
        description: 'Packing station scale log matches carrier transit manifest',
        ruleCode: 'EVD-CARRIER-SCL',
        details: 'Carrier weigh-in-motion scale logged 1.485 kg, confirming warehouse measurement.'
      }
    ],
    evidence: [
      {
        id: 'EVD-6201',
        manager: 'Receiving Manager',
        timestamp: '2026-03-12 14:10:00 IST',
        stationId: 'RCV-SCALE-03',
        operatorId: 'OP-3012',
        type: 'Inbound Scale Log',
        description: 'Unit weight recorded upon unpacking master carton.',
        metric: '1.47 kg',
        systemRef: 'RCV-WT-4410',
        status: 'VERIFIED'
      },
      {
        id: 'EVD-6202',
        manager: 'Pack Manager',
        timestamp: '2026-03-16 10:14:22 IST',
        stationId: 'PACK-STA-12',
        operatorId: 'OP-9901',
        type: 'Outbound Scale Telemetry',
        description: 'Final corrugated box with unit placed on scale.',
        metric: '1.48 kg (Billed 1.50 kg)',
        systemRef: 'PK-SCL-1104',
        status: 'VERIFIED'
      }
    ]
  },
  {
    id: 'CHG-004',
    unitId: 'UNIT-0219',
    chargeType: 'Customer Return Disposal Fee',
    amount: 670.00,
    currency: '₹',
    decision: 'UNCERTAIN',
    confidence: 62,
    evidenceCount: 3,
    status: 'Pending Review',
    date: '2026-03-16',
    sku: 'SKU-ECOM-7741',
    fulfillmentCenter: 'FC-HYD1 (Shamshabad)',
    decisionExplanation: 'Contradictory evidence detected between Returns Manager optical inspection (graded as Undamaged / Restockable) and subsequent Scrap Disposition log generated at secondary station.',
    billedMetric: 'Disposal Fee: Unsellable Scrap Grading',
    actualMetric: 'Return Inspection: Graded "Sellable - Like New"',
    variance: 'Contradictory Disposition Classifications',
    requirements: [
      {
        id: 'REQ-31',
        name: 'Receiving requirement',
        category: 'Receiving',
        status: 'PASS',
        description: 'Return shipment tracking and LPN scan validated',
        ruleCode: 'RET-LPN-VALID',
        details: 'LPN return barcode scanned at Hyderabad returns bay.'
      },
      {
        id: 'REQ-32',
        name: 'Operational requirement',
        category: 'Operational',
        status: 'CONTRADICTED',
        description: 'Single authoritative disposition classification required',
        ruleCode: 'OPS-DISP-01',
        details: 'Primary grader tagged grade A (Sellable); salvage operator logged damaged seal 2 hours later.'
      },
      {
        id: 'REQ-33',
        name: 'Evidence requirement',
        category: 'Evidence',
        status: 'MISSING',
        description: 'Photographic proof of packaging rupture required for disposal fees',
        ruleCode: 'EVD-PHOTO-REQ',
        details: 'Secondary station failed to upload mandatory disposition photo to salvage repository.'
      }
    ],
    evidence: [
      {
        id: 'EVD-7101',
        manager: 'Returns Manager',
        timestamp: '2026-03-16 11:15:33 IST',
        stationId: 'RET-BAY-02',
        operatorId: 'OP-4491',
        type: 'Optical Grading Telemetry',
        description: 'Customer return unboxed. Factory seal intact, unit functional, grade: SELLABLE.',
        metric: 'Grade A - Restock Approved',
        systemRef: 'RET-LPN-99812',
        status: 'VERIFIED'
      },
      {
        id: 'EVD-7102',
        manager: 'Returns Manager',
        timestamp: '2026-03-16 13:40:10 IST',
        stationId: 'RET-SCRAP-01',
        operatorId: 'OP-8822',
        type: 'Salvage Bin Allocation',
        description: 'Unit moved to disposal bin citing ruptured inner foil seal. No image attached.',
        metric: 'Grade D - Liquidate / Scrap',
        systemRef: 'SLV-LOG-1109',
        status: 'DISCREPANCY'
      }
    ]
  },
  {
    id: 'CHG-005',
    unitId: 'UNIT-0344',
    chargeType: 'Damaged Inbound Fee',
    amount: 1150.00,
    currency: '₹',
    decision: 'CLAIM',
    confidence: 96,
    evidenceCount: 3,
    status: 'Ready',
    date: '2026-03-15',
    sku: 'SKU-ECOM-5519',
    fulfillmentCenter: 'FC-BLR1 (Whitefield Hub)',
    decisionExplanation: 'Inbound damage was assessed to the seller, but receiving dock CCTV and conveyer telemetry indicate the carton fell from the overhead sortation chute while under warehouse custody.',
    billedMetric: 'Billed Cause: Seller Packaging Inadequacy',
    actualMetric: 'Conveyer Telemetry: Mechanical Jam & Fall Event',
    variance: 'FC Liability Confirmed (Conveyer Sensor Chute 3)',
    requirements: [
      {
        id: 'REQ-41',
        name: 'Receiving requirement',
        category: 'Receiving',
        status: 'PASS',
        description: 'Inbound gate scan logged carton in intact exterior condition',
        ruleCode: 'RCV-GATE-OK',
        details: 'Gate scanner recorded zero exterior moisture or crushing on intake.'
      },
      {
        id: 'REQ-42',
        name: 'Operational requirement',
        category: 'Operational',
        status: 'PASS',
        description: 'Warehouse conveyor malfunction recorded at time of damage stamp',
        ruleCode: 'OPS-CHUTE-JAM',
        details: 'Maintenance log confirms belt jam and 1.8m drop on Chute 3B at 10:44 IST.'
      },
      {
        id: 'REQ-43',
        name: 'Evidence requirement',
        category: 'Evidence',
        status: 'PASS',
        description: 'Conveyor sensor telemetry matches item barcode timestamp',
        ruleCode: 'EVD-SENSOR-MATCH',
        details: 'LPN UNIT-0344 scan coincides with sensor fault E-882 on sortation belt.'
      }
    ],
    evidence: [
      {
        id: 'EVD-8001',
        manager: 'Receiving Manager',
        timestamp: '2026-03-15 10:15:00 IST',
        stationId: 'RCV-GATE-04',
        operatorId: 'OP-5110',
        type: 'Dock Intake High-Res Scan',
        description: 'Exterior corrugated box scanned from 4 angles. No crushing or tape tear.',
        metric: 'Condition: 100% Intact',
        systemRef: 'IMG-GATE-4401',
        status: 'VERIFIED'
      },
      {
        id: 'EVD-8002',
        manager: 'Receiving Manager',
        timestamp: '2026-03-15 10:44:18 IST',
        stationId: 'CHUTE-3B',
        operatorId: 'SYS-AUTOMATION',
        type: 'Conveyor Telemetry Fault',
        description: 'Photo-eye E-882 blocked for 14.2s. Emergency belt decel triggered.',
        metric: 'Impact Force: 4.8G (Chute fall)',
        systemRef: 'FLT-LOG-9921',
        status: 'DISCREPANCY'
      }
    ]
  },
  {
    id: 'CHG-006',
    unitId: 'UNIT-0412',
    chargeType: 'Storage Overcharge',
    amount: 450.00,
    currency: '₹',
    decision: 'CLAIM',
    confidence: 92,
    evidenceCount: 3,
    status: 'Ready',
    date: '2026-03-14',
    sku: 'SKU-ECOM-9012',
    fulfillmentCenter: 'FC-DEL2 (Bilasput West)',
    decisionExplanation: 'Storage volume billed as 0.045 cubic meters based on incorrect master carton dimensions instead of individual retail packaging volume (0.008 cubic meters).',
    billedMetric: 'Billed Volume: 0.045 m³',
    actualMetric: 'Measured Volume: 0.008 m³',
    variance: 'Delta: +462% Volume Overstatement',
    requirements: [
      {
        id: 'REQ-51',
        name: 'Receiving requirement',
        category: 'Receiving',
        status: 'PASS',
        description: 'Single unit retail dimensions logged in master catalog',
        ruleCode: 'CAT-DIMS-VERIFIED',
        details: 'Product catalog lists retail unit at 20x10x4 cm (0.008 m³).'
      },
      {
        id: 'REQ-52',
        name: 'Operational requirement',
        category: 'Operational',
        status: 'PASS',
        description: 'Bin storage telemetry indicates standard shelf placement',
        ruleCode: 'OPS-BIN-STD',
        details: 'Stored in Bin B-14-02 standard shelf, not oversized floor pallet.'
      },
      {
        id: 'REQ-53',
        name: 'Evidence requirement',
        category: 'Evidence',
        status: 'PASS',
        description: 'Cubiscan optical proof available for individual unit',
        ruleCode: 'EVD-CUBI-SCAN',
        details: 'Cubiscan unit profile #CS-881 verified unit size without outer master case.'
      }
    ],
    evidence: [
      {
        id: 'EVD-8811',
        manager: 'Prep Manager',
        timestamp: '2026-03-10 16:20:00 IST',
        stationId: 'PREP-CUBI-01',
        operatorId: 'OP-6621',
        type: 'Optical Volume Caliper',
        description: 'Retail unit measured on automated 3D optical caliper table.',
        metric: '0.008 m³ (20.0 x 10.0 x 4.0 cm)',
        systemRef: 'CB-PRP-0012',
        status: 'VERIFIED'
      }
    ]
  },
  {
    id: 'CHG-007',
    unitId: 'UNIT-0498',
    chargeType: 'Fulfillment Fee',
    amount: 980.00,
    currency: '₹',
    decision: 'REJECT',
    confidence: 89,
    evidenceCount: 2,
    status: 'Ready',
    date: '2026-03-14',
    sku: 'SKU-ECOM-6612',
    fulfillmentCenter: 'FC-BOM1 (Bhiwandi Central)',
    decisionExplanation: 'Pack station dimensions and shipping weighment match the billed heavy tier tier. Extra weight originated from mandatory cold-chain insulated gel pouch included per product requirements.',
    billedMetric: 'Billed Weight: 2.10 kg (Tier 3)',
    actualMetric: 'Measured Weight: 2.08 kg',
    variance: 'Delta: -0.02 kg (Legitimate Cold Chain Prep)',
    requirements: [
      {
        id: 'REQ-61',
        name: 'Receiving requirement',
        category: 'Receiving',
        status: 'PASS',
        description: 'Cold-chain designation verified in inventory record',
        ruleCode: 'RCV-COLD-CHAIN',
        details: 'SKU requires 500g refrigerant gel pack for temperature compliance.'
      },
      {
        id: 'REQ-62',
        name: 'Operational requirement',
        category: 'Operational',
        status: 'FAIL',
        description: 'Charge must exceed legitimate billed weight class',
        ruleCode: 'OPS-WT-TIER',
        details: 'Total packaged shipment weighed 2.08kg, qualifying for the billed Tier 3 rate.'
      },
      {
        id: 'REQ-63',
        name: 'Evidence requirement',
        category: 'Evidence',
        status: 'PASS',
        description: 'Packing station scan shows gel pouch weight inclusion',
        ruleCode: 'EVD-GEL-PACK',
        details: 'Packing station manifest logged 1x insulated box + 2x gel pouch.'
      }
    ],
    evidence: [
      {
        id: 'EVD-9001',
        manager: 'Pack Manager',
        timestamp: '2026-03-14 15:40:11 IST',
        stationId: 'PACK-COLD-01',
        operatorId: 'OP-4412',
        type: 'Cold Chain Pack Scan',
        description: 'Insulated liner and cold packs sealed. Gross weight: 2.08kg.',
        metric: '2.08 kg gross weight',
        systemRef: 'PK-CLD-8812',
        status: 'VERIFIED'
      }
    ]
  },
  {
    id: 'CHG-008',
    unitId: 'UNIT-0562',
    chargeType: 'Unplanned Prep Fee',
    amount: 520.00,
    currency: '₹',
    decision: 'UNCERTAIN',
    confidence: 58,
    evidenceCount: 2,
    status: 'Pending Review',
    date: '2026-03-13',
    sku: 'SKU-ECOM-1102',
    fulfillmentCenter: 'FC-HYD1 (Shamshabad)',
    decisionExplanation: 'Billed for emergency bubble wrap prep at inbound station. Inbound photograph shows unit was already supplied in reinforced carton, but operator logged barcode illegibility.',
    billedMetric: 'Prep Code: PREP-BUBBLE-02 (Fragile Wrap)',
    actualMetric: 'Carton Spec: Double-Walled 200lb Burst Test',
    variance: 'Disputed prep necessity vs barcode scan failure',
    requirements: [
      {
        id: 'REQ-71',
        name: 'Receiving requirement',
        category: 'Receiving',
        status: 'PASS',
        description: 'Vendor packaging passed drop-test certification',
        ruleCode: 'RCV-DROP-CERT',
        details: 'ISTAA 3A drop test certificate on file for this SKU batch.'
      },
      {
        id: 'REQ-72',
        name: 'Operational requirement',
        category: 'Operational',
        status: 'CONTRADICTED',
        description: 'Prep fee requires proof of substandard exterior packaging',
        ruleCode: 'OPS-PRP-AUTH',
        details: 'Prep log claims box was flimsy, contradicting vendor certified drop test.'
      },
      {
        id: 'REQ-73',
        name: 'Evidence requirement',
        category: 'Evidence',
        status: 'MISSING',
        description: 'Dock barcode legibility photo required for re-label fee',
        ruleCode: 'EVD-BC-LEGIBILITY',
        details: 'No high-resolution scan of illegible vendor barcode was archived.'
      }
    ],
    evidence: [
      {
        id: 'EVD-9411',
        manager: 'Receiving Manager',
        timestamp: '2026-03-13 13:02:11 IST',
        stationId: 'RCV-INSP-03',
        operatorId: 'OP-2219',
        type: 'Barcode Rejection Notice',
        description: 'Inbound scanner could not decode EAN-13 code. Unit routed to prep station.',
        metric: 'Scan Error: Contrast < 40%',
        systemRef: 'RCV-ERR-0091',
        status: 'FLAGGED'
      },
      {
        id: 'EVD-9412',
        manager: 'Prep Manager',
        timestamp: '2026-03-13 14:15:00 IST',
        stationId: 'PREP-STA-01',
        operatorId: 'OP-8810',
        type: 'Manual Prep Application',
        description: 'Operator wrapped unit in bubble wrap and generated new thermal label.',
        metric: 'Prep Time: 3.2 min',
        systemRef: 'PRP-WRK-4421',
        status: 'DISCREPANCY'
      }
    ]
  },
  {
    id: 'CHG-009',
    unitId: 'UNIT-0604',
    chargeType: 'Fulfillment Fee',
    amount: 1120.00,
    currency: '₹',
    decision: 'CLAIM',
    confidence: 97,
    evidenceCount: 3,
    status: 'Ready',
    date: '2026-03-13',
    sku: 'SKU-ECOM-8831',
    fulfillmentCenter: 'FC-BLR1 (Whitefield Hub)',
    decisionExplanation: 'Repeat overcharge on SKU-ECOM-8831. Standard envelope shipment billed as Heavy Parcel at 2.4kg. Pack scale recorded 922g.',
    billedMetric: 'Billed Weight: 2.40 kg',
    actualMetric: 'Measured Weight: 0.92 kg',
    variance: 'Delta: -1.48 kg (-61.7% fee delta)',
    requirements: [
      {
        id: 'REQ-81',
        name: 'Receiving requirement',
        category: 'Receiving',
        status: 'PASS',
        description: 'Physical tare matches product master data',
        ruleCode: 'RCV-SEC-402',
        details: 'Inbound lot measurement verified at 920g.'
      },
      {
        id: 'REQ-82',
        name: 'Operational requirement',
        category: 'Operational',
        status: 'PASS',
        description: 'Standard poly packaging verified',
        ruleCode: 'OPS-DIMS-118',
        details: 'No extra dunnage added.'
      },
      {
        id: 'REQ-83',
        name: 'Evidence requirement',
        category: 'Evidence',
        status: 'PASS',
        description: 'Dual station optical logs coincide',
        ruleCode: 'EVD-DUAL-901',
        details: 'Pack scale PK-08 and line 4 optical sensor both logged < 930g.'
      }
    ],
    evidence: [
      {
        id: 'EVD-9811',
        manager: 'Pack Manager',
        timestamp: '2026-03-13 16:45:22 IST',
        stationId: 'PACK-STA-08',
        operatorId: 'OP-7734',
        type: 'Outbound Scale Telemetry',
        description: 'Automated conveyor scale telemetry reading.',
        metric: '0.922 kg',
        systemRef: 'PK-SCL-99480',
        status: 'VERIFIED'
      }
    ]
  },
  {
    id: 'CHG-010',
    unitId: 'UNIT-0721',
    chargeType: 'Weight Discrepancy Fee',
    amount: 410.00,
    currency: '₹',
    decision: 'CLAIM',
    confidence: 93,
    evidenceCount: 3,
    status: 'Ready',
    date: '2026-03-12',
    sku: 'SKU-ECOM-2204',
    fulfillmentCenter: 'FC-DEL2 (Bilasput West)',
    decisionExplanation: 'Billed for 1.8kg tier after system appended ghost dimension of 35cm instead of actual 15cm height recorded at pack station.',
    billedMetric: 'Billed Dims: 35 x 25 x 35 cm (6.1 kg Volumetric)',
    actualMetric: 'Measured Dims: 35 x 25 x 15 cm (2.6 kg Volumetric)',
    variance: 'Ghost Height Dimension +20 cm (+134% fee delta)',
    requirements: [
      {
        id: 'REQ-91',
        name: 'Receiving requirement',
        category: 'Receiving',
        status: 'PASS',
        description: 'Inbound height recorded on intake manifest',
        ruleCode: 'RCV-HT-CHECK',
        details: 'Inbound pallet height mathematically confirms max unit height 15cm.'
      },
      {
        id: 'REQ-92',
        name: 'Operational requirement',
        category: 'Operational',
        status: 'PASS',
        description: 'Standard box packaging size 3B utilized',
        ruleCode: 'OPS-BOX-SIZE',
        details: 'Box Type 3B inner dimensions are exactly 35x25x15 cm.'
      },
      {
        id: 'REQ-93',
        name: 'Evidence requirement',
        category: 'Evidence',
        status: 'PASS',
        description: 'Cubiscan sensor reading matches box spec',
        ruleCode: 'EVD-CUBI-DIM',
        details: 'Cubiscan calibration log certifies height sensor accuracy +/- 2mm.'
      }
    ],
    evidence: [
      {
        id: 'EVD-9921',
        manager: 'Pack Manager',
        timestamp: '2026-03-12 11:20:00 IST',
        stationId: 'PACK-CUBI-03',
        operatorId: 'OP-1192',
        type: 'Optical Cubiscan Log',
        description: 'Box 3B scanned. Height: 15.1cm.',
        metric: '15.1 cm height (Billed 35.0 cm)',
        systemRef: 'CB-DEL2-119',
        status: 'VERIFIED'
      }
    ]
  }
];

// Helper to deterministically generate remaining charges up to 320 records
export function generateFullDataset(): Charge[] {
  const result: Charge[] = [...INITIAL_CHARGES];
  const feeTypes = [
    'Fulfillment Fee',
    'Weight Discrepancy Fee',
    'Lost Inbound Reimbursement',
    'Damaged Inbound Fee',
    'Customer Return Disposal Fee',
    'Storage Overcharge',
    'Unplanned Prep Fee'
  ];
  const fcs = [
    'FC-BLR1 (Whitefield Hub)',
    'FC-DEL2 (Bilasput West)',
    'FC-BOM1 (Bhiwandi Central)',
    'FC-HYD1 (Shamshabad)',
    'FC-CCU1 (Kolkata East)'
  ];

  for (let i = 11; i <= 320; i++) {
    const chargeId = `CHG-${String(i).padStart(3, '0')}`;
    const unitId = `UNIT-${String(Math.floor(i * 3.14 + 10)).padStart(4, '0')}`;
    const feeType = feeTypes[(i * 3) % feeTypes.length];
    const fc = fcs[(i * 7) % fcs.length];
    const sku = `SKU-ECOM-${1000 + (i % 89)}`;
    const day = 1 + (i % 28);
    const date = `2026-03-${String(day).padStart(2, '0')}`;

    // Deterministic distribution: ~58% CLAIM, ~30% REJECT, ~12% UNCERTAIN
    const mod = i % 100;
    let decision: 'CLAIM' | 'REJECT' | 'UNCERTAIN' = 'CLAIM';
    let status: 'Ready' | 'Pending Review' | 'Contradicted' | 'Audited' = 'Ready';
    let confidence = 88 + (i % 11);
    let amount = 350 + (i * 37) % 2100;
    amount = Math.round(amount * 10) / 10;

    let explanation = '';
    let billedMetric = '';
    let actualMetric = '';
    let variance = '';

    if (mod < 58) {
      decision = 'CLAIM';
      confidence = 90 + (i % 9);
      status = 'Ready';
      explanation = `The available operational evidence supports recovery and the applicable requirements are satisfied. Discrepancy detected between billing log and ${fc} station telemetry.`;
      billedMetric = `Billed Amount: ₹${amount.toFixed(2)}`;
      actualMetric = `Audited Amount: ₹${(amount * 0.45).toFixed(2)}`;
      variance = `Recoverable delta: ₹${(amount * 0.55).toFixed(2)}`;
    } else if (mod < 88) {
      decision = 'REJECT';
      confidence = 85 + (i % 12);
      status = 'Ready';
      explanation = `Operational log corroborates billed classification. Measurement tolerance falls within contractual baseline margin.`;
      billedMetric = `Billed Spec: Tier ${1 + (i % 3)}`;
      actualMetric = `Measured Spec: Tier ${1 + (i % 3)}`;
      variance = `Delta within +/- 2.5% tolerance`;
    } else {
      decision = 'UNCERTAIN';
      confidence = 54 + (i % 16);
      status = (i % 2 === 0) ? 'Pending Review' : 'Contradicted';
      explanation = `Contradictory physical records detected between station intake and outbound scan. Requires auditor cross-validation.`;
      billedMetric = `Billed Class: Standard`;
      actualMetric = `Scan Status: Divergent Sensor Signals`;
      variance = `Uncertainty Index: High`;
    }

    const reqStatus1 = decision === 'CLAIM' ? 'PASS' : (decision === 'REJECT' ? 'PASS' : 'PASS');
    const reqStatus2 = decision === 'CLAIM' ? 'PASS' : (decision === 'REJECT' ? 'FAIL' : 'CONTRADICTED');
    const reqStatus3 = decision === 'CLAIM' ? 'PASS' : (decision === 'REJECT' ? 'PASS' : 'MISSING');

    const requirements: RequirementCheck[] = [
      {
        id: `REQ-${i}-1`,
        name: 'Receiving requirement',
        category: 'Receiving',
        status: reqStatus1,
        description: 'Physical inbound tare verification recorded at dock gate',
        ruleCode: `RCV-GATE-${100 + (i % 20)}`,
        details: `Unit verified against inbound arrival scan at ${fc}.`
      },
      {
        id: `REQ-${i}-2`,
        name: 'Operational requirement',
        category: 'Operational',
        status: reqStatus2,
        description: 'Operational handling compliant with contracted fee tier',
        ruleCode: `OPS-TIER-${200 + (i % 30)}`,
        details: decision === 'CLAIM'
          ? 'Physical dimensions deviate from billed overage rate.'
          : (decision === 'REJECT' ? 'No fee deviation exceeding contract threshold.' : 'Contradictory handling logs recorded between shifts.')
      },
      {
        id: `REQ-${i}-3`,
        name: 'Evidence requirement',
        category: 'Evidence',
        status: reqStatus3,
        description: 'Calibrated station telemetry corroborates recovery ledger',
        ruleCode: `EVD-CALIB-${300 + (i % 40)}`,
        details: decision === 'CLAIM'
          ? 'Dual station scales confirm physical measurement baseline.'
          : (decision === 'REJECT' ? 'Outbound telemetry aligns with carrier weight.' : 'Secondary station photo verification missing.')
      }
    ];

    const evidence: EvidenceRecord[] = [
      {
        id: `EVD-${2000 + i}`,
        manager: (i % 4 === 0) ? 'Receiving Manager' : (i % 4 === 1 ? 'Prep Manager' : (i % 4 === 2 ? 'Pack Manager' : 'Returns Manager')),
        timestamp: `${date} ${10 + (i % 8)}:${10 + (i % 45)}:18 IST`,
        stationId: `STA-${fc.split(' ')[0]}-${10 + (i % 20)}`,
        operatorId: `OP-${4000 + (i % 300)}`,
        type: 'Automated Telemetry Capture',
        description: `Operational event logged at ${fc}. Telemetry timestamp synchronized with inventory server.`,
        metric: `Log Metric: ${amount > 800 ? 'High Tier' : 'Standard Tier'}`,
        systemRef: `SYS-LOG-${10000 + i}`,
        status: decision === 'UNCERTAIN' ? 'DISCREPANCY' : 'VERIFIED'
      }
    ];

    result.push({
      id: chargeId,
      unitId,
      chargeType: feeType,
      amount,
      currency: '₹',
      decision,
      confidence,
      evidenceCount: 2 + (i % 3),
      status,
      date,
      sku,
      fulfillmentCenter: fc,
      decisionExplanation: explanation,
      billedMetric,
      actualMetric,
      variance,
      requirements,
      evidence
    });
  }

  return result;
}

export const INITIAL_REVIEW_ITEMS: ReviewItem[] = [
  {
    id: 'REV-001',
    chargeId: 'CHG-004',
    unitId: 'UNIT-0219',
    chargeType: 'Customer Return Disposal Fee',
    amount: 670.00,
    originalDecision: 'UNCERTAIN',
    reviewedDecision: undefined,
    reviewReason: 'Contradictory grading: Return bay logged Grade A (Sellable); salvage bay logged Damaged Seal without photo proof.',
    reviewer: 'Arjun Mehta (Lead Operations Auditor)',
    timestamp: '2026-03-19 10:14 IST',
    resolutionStatus: 'PENDING',
    notes: 'Awaiting secondary camera audit from Shamshabad bay 2.'
  },
  {
    id: 'REV-002',
    chargeId: 'CHG-008',
    unitId: 'UNIT-0562',
    chargeType: 'Unplanned Prep Fee',
    amount: 520.00,
    originalDecision: 'UNCERTAIN',
    reviewedDecision: 'CLAIM',
    reviewReason: 'Vendor supplied certified drop-test carton; unneeded bubble wrap added due to scanner lens smudge at receiving station.',
    reviewer: 'Priya Sundaram (Senior Claims Analyst)',
    timestamp: '2026-03-18 16:45 IST',
    resolutionStatus: 'ACCEPTED',
    notes: 'Confirmed intake camera lens was replaced after 14:00. Fee is 100% recoverable.'
  },
  {
    id: 'REV-003',
    chargeId: 'CHG-014',
    unitId: 'UNIT-0811',
    chargeType: 'Weight Discrepancy Fee',
    amount: 890.00,
    originalDecision: 'UNCERTAIN',
    reviewedDecision: 'REJECT',
    reviewReason: 'Carrier scale and FC pack scale diverge by 400g. Third-party transit weighment confirms higher weight tier was accurate.',
    reviewer: 'Devraj Sen (Logistics Quality Lead)',
    timestamp: '2026-03-17 11:20 IST',
    resolutionStatus: 'REJECTED',
    notes: 'Carrier weighbill #CR-9082 confirms customer included promotional accessory.'
  },
  {
    id: 'REV-004',
    chargeId: 'CHG-022',
    unitId: 'UNIT-0933',
    chargeType: 'Lost Inbound Reimbursement',
    amount: 1850.00,
    originalDecision: 'UNCERTAIN',
    reviewedDecision: undefined,
    reviewReason: 'Dock check-in scan present but carrier signature missing from digital POD upload.',
    reviewer: 'Kavita Nair (Dispute Officer)',
    timestamp: '2026-03-19 08:30 IST',
    resolutionStatus: 'PENDING',
    notes: 'Requested physical paper gate pass from Bhiwandi security gatehouse.'
  }
];

export const ANALYTICS_DATA = {
  totalCharges: 320,
  totalChargesAmount: 248650.00,
  claimsRecommended: 184,
  claimsRecommendedAmount: 162420.00,
  rejected: 98,
  rejectedAmount: 61130.00,
  uncertain: 38,
  uncertainAmount: 25100.00,
  correctlySupportedClaims: 178,
  incorrectlyRecommendedClaims: 6,
  missedRecoverableClaims: 4,
  uncertainRate: 11.8,
  claimPrecision: 96.7, // (178 / (178 + 6)) * 100
  recoveryYield: 65.3,
  discrepanciesByManager: [
    { manager: 'Receiving Manager', count: 72, amount: 58400, percent: 36 },
    { manager: 'Pack Manager', count: 68, amount: 54100, percent: 33 },
    { manager: 'Returns Manager', count: 42, amount: 33200, percent: 21 },
    { manager: 'Prep Manager', count: 20, amount: 16720, percent: 10 }
  ],
  feeTypeBreakdown: [
    { type: 'Fulfillment Fee', total: 118, recoverable: 74, yield: 62.7, recoverableAmount: 68400 },
    { type: 'Weight Discrepancy Fee', total: 76, recoverable: 46, yield: 60.5, recoverableAmount: 38900 },
    { type: 'Lost Inbound Reimbursement', total: 44, recoverable: 38, yield: 86.4, recoverableAmount: 34100 },
    { type: 'Damaged Inbound Fee', total: 32, recoverable: 20, yield: 62.5, recoverableAmount: 14800 },
    { type: 'Customer Return Disposal Fee', total: 28, recoverable: 4, yield: 14.3, recoverableAmount: 3420 },
    { type: 'Storage Overcharge', total: 22, recoverable: 2, yield: 9.1, recoverableAmount: 2800 }
  ]
};
