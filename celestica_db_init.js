/**
 * Celestica (Thailand) Limited & Celestica Japan K.K.
 * Enterprise SQLite Database Initialization & Seeding Script
 * Role: Manager, IT Business Partner 2 (Req ID: 133553 | Band 10 | Laem Chabang, Chonburi)
 * 
 * Supports:
 * - Trello-style Interactive Kanban Project & Process Lifecycle Board
 * - Oracle Primavera P6 EPPM Master Schedule (WBS, CPM Early/Late Dates, Total Float, Critical Path, EVM)
 * - Design Thinking Workshops, BABOK Requirements Traceability Matrix (RTM) & SAFe WSJF Prioritization
 * - Business Process Re-engineering (BPR As-Is vs. To-Be), Feasibility Studies & Financial CBA (NPV, IRR, ROI, TCO)
 * - Vendor Statement of Work (SOW), SLA Governance & Hardware/Software Evaluation Readouts
 * - Enterprise Integration Hub (SAP S/4HANA, Siemens Opcenter MES, Kinaxis RapidResponse, Primavera P6, ServiceNow)
 */

const path = require('path');
const { DatabaseSync } = require('node:sqlite');

let DB_PATH = process.env.CELESTICA_DB_PATH || path.join(__dirname, 'celestica_itbp.db');
if (process.env.VERCEL) {
  DB_PATH = path.join('/tmp', 'celestica_itbp.db');
}

function initCelesticaDb(customDbInstance) {
  const db = customDbInstance || new DatabaseSync(DB_PATH);

  console.log(`[CELESTICA-ITBP] Initializing SQLite Database at: ${DB_PATH}`);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  // 1. Create Tables
  db.exec(`
    -- 1. Kanban / Trello-Style Process Cards (ITBP Project & Initiative Lifecycle)
    CREATE TABLE IF NOT EXISTS itbp_kanban_cards (
      id TEXT PRIMARY KEY,
      card_code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      title_jp TEXT,
      stage TEXT NOT NULL, -- 'IDEATION_WORKSHOP', 'FEASIBILITY_CBA', 'WSJF_HWSW_EVAL', 'SOW_VENDOR_GOV', 'P6_EXECUTION', 'UAT_VALUE_REALIZED'
      priority TEXT NOT NULL DEFAULT 'HIGH', -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
      bu_site TEXT NOT NULL, -- 'CLS-MYG (Miyagi Plant)', 'CLS-TYO (Tokyo HQ)', 'CLS-LCB (Laem Chabang)', 'CLS-GLOBAL (Toronto/APAC)'
      functional_area TEXT NOT NULL, -- 'Manufacturing & MES', 'Supply Chain & APS', 'Finance & J-SOX', 'Quality & IPC', 'IT Infrastructure'
      wsjf_score REAL NOT NULL DEFAULT 0.0,
      budget_usd REAL NOT NULL DEFAULT 0.0,
      npv_usd REAL NOT NULL DEFAULT 0.0,
      owner_name TEXT NOT NULL,
      stakeholder_jp TEXT,
      due_date TEXT NOT NULL,
      progress_percent INTEGER NOT NULL DEFAULT 0,
      checklist_done INTEGER NOT NULL DEFAULT 0,
      checklist_total INTEGER NOT NULL DEFAULT 5,
      tags TEXT,
      summary TEXT,
      display_order INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Oracle Primavera P6 EPPM Schedule Activities (CPM & Earned Value Management)
    CREATE TABLE IF NOT EXISTS itbp_p6_activities (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      wbs_code TEXT NOT NULL,
      wbs_name TEXT NOT NULL,
      activity_id TEXT NOT NULL UNIQUE,
      activity_name TEXT NOT NULL,
      activity_type TEXT NOT NULL DEFAULT 'Task Dependent', -- 'Start Milestone', 'Task Dependent', 'Finish Milestone', 'WBS Summary'
      original_duration_days INTEGER NOT NULL,
      remaining_duration_days INTEGER NOT NULL,
      percent_complete REAL NOT NULL DEFAULT 0.0,
      early_start DATE NOT NULL,
      early_finish DATE NOT NULL,
      late_start DATE NOT NULL,
      late_finish DATE NOT NULL,
      total_float_days INTEGER NOT NULL DEFAULT 0,
      free_float_days INTEGER NOT NULL DEFAULT 0,
      is_critical INTEGER NOT NULL DEFAULT 0, -- 1 if Total Float <= 0
      predecessors TEXT,
      relationship_type TEXT DEFAULT 'FS',
      primary_resource TEXT NOT NULL,
      resource_role TEXT NOT NULL,
      planned_value_usd REAL NOT NULL DEFAULT 0.0, -- PV (BCWS)
      earned_value_usd REAL NOT NULL DEFAULT 0.0,  -- EV (BCWP)
      actual_cost_usd REAL NOT NULL DEFAULT 0.0,   -- AC (ACWP)
      bac_usd REAL NOT NULL DEFAULT 0.0,           -- Budget at Completion
      status TEXT NOT NULL DEFAULT 'IN_PROGRESS',  -- 'COMPLETED', 'IN_PROGRESS', 'NOT_STARTED'
      notes TEXT
    );

    -- 3. Design Thinking Workshops & BABOK Requirements Traceability Matrix (RTM + WSJF)
    CREATE TABLE IF NOT EXISTS itbp_requirements (
      id TEXT PRIMARY KEY,
      req_code TEXT NOT NULL UNIQUE,
      project_code TEXT NOT NULL,
      workshop_method TEXT NOT NULL, -- 'Design Thinking (5-Stage)', 'Gemba Kaizen Walk', 'BPM SIPOC Workshop', 'J-SOX Compliance Audit'
      bu_department TEXT NOT NULL,
      stakeholder_jp TEXT NOT NULL,
      requirement_title TEXT NOT NULL,
      requirement_title_jp TEXT,
      business_need TEXT NOT NULL,
      technical_spec TEXT NOT NULL,
      user_business_value INTEGER NOT NULL DEFAULT 8, -- 1-10
      time_criticality INTEGER NOT NULL DEFAULT 8,    -- 1-10
      risk_reduction INTEGER NOT NULL DEFAULT 8,      -- 1-10
      job_size INTEGER NOT NULL DEFAULT 5,            -- 1-10
      cost_of_delay INTEGER GENERATED ALWAYS AS (user_business_value + time_criticality + risk_reduction) VIRTUAL,
      wsjf_index REAL GENERATED ALWAYS AS (ROUND(CAST(user_business_value + time_criticality + risk_reduction AS REAL) / CASE WHEN job_size = 0 THEN 1 ELSE job_size END, 2)) VIRTUAL,
      moscow_priority TEXT NOT NULL DEFAULT 'MUST_HAVE', -- 'MUST_HAVE', 'SHOULD_HAVE', 'COULD_HAVE'
      verification_method TEXT NOT NULL,
      traceability_status TEXT NOT NULL DEFAULT 'APPROVED' -- 'ELICITED', 'VALIDATED', 'APPROVED', 'IN_DEV', 'UAT_PASSED'
    );

    -- 4. BPR Process Re-Engineering, Feasibility Studies & Cost-Benefit Analysis (CBA)
    CREATE TABLE IF NOT EXISTS itbp_cba_studies (
      id TEXT PRIMARY KEY,
      study_code TEXT NOT NULL UNIQUE,
      initiative_name TEXT NOT NULL,
      target_site TEXT NOT NULL,
      functional_domain TEXT NOT NULL,
      as_is_process_desc TEXT NOT NULL,
      as_is_cycle_time_hrs REAL NOT NULL,
      as_is_defect_dppm INTEGER NOT NULL,
      as_is_oee_percent REAL NOT NULL,
      to_be_process_desc TEXT NOT NULL,
      to_be_cycle_time_hrs REAL NOT NULL,
      to_be_defect_dppm INTEGER NOT NULL,
      to_be_oee_percent REAL NOT NULL,
      capex_usd REAL NOT NULL,
      annual_opex_usd REAL NOT NULL,
      annual_gross_savings_usd REAL NOT NULL,
      discount_rate_percent REAL NOT NULL DEFAULT 8.5,
      npv_5yr_usd REAL NOT NULL,
      irr_percent REAL NOT NULL,
      roi_percent REAL NOT NULL,
      payback_months REAL NOT NULL,
      feasibility_rating TEXT NOT NULL, -- 'HIGHLY_VIABLE', 'VIABLE_WITH_CONDITIONS', 'UNDER_REVIEW'
      approval_ringi_no TEXT NOT NULL
    );

    -- 5. Vendor Statement of Work (SOW) & Hardware/Software Evaluation Matrix
    CREATE TABLE IF NOT EXISTS itbp_sow_vendors (
      id TEXT PRIMARY KEY,
      sow_number TEXT NOT NULL UNIQUE,
      vendor_name TEXT NOT NULL,
      solution_category TEXT NOT NULL, -- 'MES_SHOPFLOOR', 'ERP_SUPPLY_CHAIN', 'IIOT_HARDWARE_EDGE', 'QUALITY_AOI_VISION'
      project_title TEXT NOT NULL,
      contract_type TEXT NOT NULL, -- 'Fixed-Price Milestone', 'Time & Materials (Capped)', 'Managed Service SLA'
      total_contract_usd REAL NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      functional_fit_score INTEGER NOT NULL,     -- out of 100
      compatibility_score INTEGER NOT NULL,      -- out of 100
      cybersecurity_jsox_score INTEGER NOT NULL, -- out of 100
      tco_commercial_score INTEGER NOT NULL,     -- out of 100
      weighted_eval_score REAL NOT NULL,         -- out of 100
      sla_uptime_target TEXT NOT NULL,
      milestones_completed INTEGER NOT NULL,
      milestones_total INTEGER NOT NULL,
      governance_status TEXT NOT NULL, -- 'ON_TRACK', 'ROADBLOCK_ESCALATED', 'COMPLETED', 'EVALUATION_READOUT'
      escalation_note TEXT
    );

    -- 6. Enterprise System Integration Registry & Live Sync Audit Logs
    CREATE TABLE IF NOT EXISTS itbp_integrations (
      id TEXT PRIMARY KEY,
      connector_code TEXT NOT NULL UNIQUE,
      system_name TEXT NOT NULL,
      isa95_level TEXT NOT NULL, -- 'Level 4 (ERP/APS/PMO)', 'Level 3 (MES/QMS/WMS)', 'Level 2 (SMT/IIoT Edge)'
      protocol_standard TEXT NOT NULL,
      source_endpoint TEXT NOT NULL,
      target_endpoint TEXT NOT NULL,
      sync_frequency TEXT NOT NULL,
      latency_ms INTEGER NOT NULL,
      records_synced_today INTEGER NOT NULL,
      health_status TEXT NOT NULL DEFAULT 'HEALTHY', -- 'HEALTHY', 'WARNING', 'SYNCING'
      last_sync_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sample_payload_json TEXT
    );

    CREATE TABLE IF NOT EXISTS itbp_integration_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      connector_code TEXT NOT NULL,
      event_type TEXT NOT NULL,
      source_system TEXT NOT NULL,
      target_system TEXT NOT NULL,
      payload_summary TEXT NOT NULL,
      status_code INTEGER NOT NULL DEFAULT 200,
      triggered_by TEXT NOT NULL DEFAULT 'Manager, ITBP (Req 133553)',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if already seeded
  const existing = db.prepare(`SELECT count(*) as cnt FROM itbp_kanban_cards`).get();
  if (existing && existing.cnt > 0) {
    console.log(`[CELESTICA-ITBP] Database already contains ${existing.cnt} Kanban cards. Skipping seed.`);
    return db;
  }

  console.log(`[CELESTICA-ITBP] Seeding authentic Celestica Japan (Miyagi/Tokyo) & Thailand (Laem Chabang) ITBP dataset...`);

  // ---------------------------------------------------------------------------
  // SEED 1: Trello-Style Kanban Lifecycle Cards (12 Realistic Initiatives)
  // ---------------------------------------------------------------------------
  const insertCard = db.prepare(`
    INSERT INTO itbp_kanban_cards (
      id, card_code, title, title_jp, stage, priority, bu_site, functional_area,
      wsjf_score, budget_usd, npv_usd, owner_name, stakeholder_jp, due_date,
      progress_percent, checklist_done, checklist_total, tags, summary, display_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const kanbanCards = [
    // Stage 1: IDEATION_WORKSHOP
    [
      'KBN-01', 'CLS-ITBP-101',
      'AI Visual Solder Joint Inspection (AOI) Edge Integration for High-Density Optical PCBA',
      '高密度光通信基板向けAI外観検査(AOI)エッジ統合ワークショップ',
      'IDEATION_WORKSHOP', 'HIGH', 'CLS-MYG (Miyagi Plant)', 'Quality & IPC',
      4.80, 185000, 420000, 'Aritut (Mgr, ITBP 2)', 'Kenji Takahashi (VP Quality, Miyagi)', '2026-11-15',
      35, 2, 5, 'Design Thinking,IPC-A-610,Computer Vision,ATS',
      'Facilitating 5-stage Design Thinking workshop with Miyagi NPI quality engineers to reduce false-call rates on 800G optical transceiver SMT lines by 62%.', 1
    ],
    [
      'KBN-02', 'CLS-ITBP-102',
      'Automated Reverse Logistics & ITAD RMA Customer Portal for Tokyo Enterprise OEMs',
      '東京エンタープライズOEM向けRMA・ITAD逆物流自動化ポータル',
      'IDEATION_WORKSHOP', 'MEDIUM', 'CLS-TYO (Tokyo HQ)', 'Supply Chain & APS',
      3.75, 110000, 265000, 'Aritut (Mgr, ITBP 2)', 'Yuki Sato (Director After-Market, Tokyo)', '2026-11-30',
      25, 1, 4, 'BABOK,Customer Portal,After-Market,ITAD',
      'Requirements solicitation & playback sessions with Tokyo Commercial & Hino Repair Depot to automate RMA serialization and warranty entitlement checks.', 2
    ],
    // Stage 2: FEASIBILITY_CBA
    [
      'KBN-03', 'CLS-ITBP-103',
      'BPR & Feasibility: Digital Twin Box-Build Traceability (Miyagi NPI to Laem Chabang Mass Prod)',
      '宮城NPIからレムチャバン量産へのデジタルツイン筐体組立トレーサビリティBPR',
      'FEASIBILITY_CBA', 'CRITICAL', 'CLS-GLOBAL (Toronto/APAC)', 'Manufacturing & MES',
      6.75, 420000, 1180000, 'Aritut (Mgr, ITBP 2)', 'Hiroshi Watanabe (GM Operations, Miyagi)', '2026-11-05',
      70, 4, 5, 'BPR,Feasibility,CBA,NPI-to-MP,DFM',
      'Cost-benefit analysis & As-Is/To-Be process re-engineering unifying BOM/BOP transfer from Miyagi NPI Center to Laem Chabang Plant 2, cutting NPI transfer lead time by 18 days.', 1
    ],
    [
      'KBN-04', 'CLS-ITBP-104',
      'J-SOX & Global Finance Automated Three-Way Match (SAP S/4HANA & Japan e-Tax Invoice)',
      'J-SOX対応・SAP S/4HANA自動三面照合およびインボイス制度統合',
      'FEASIBILITY_CBA', 'HIGH', 'CLS-TYO (Tokyo HQ)', 'Finance & J-SOX',
      5.25, 145000, 390000, 'Aritut (Mgr, ITBP 2)', 'Akiko Tanaka (Finance Controller, Japan)', '2026-11-12',
      80, 4, 5, 'J-SOX,SAP FICO,BPR,Compliance',
      'Objective analysis of AP/AR reconciliation between Japanese subcontractors and Global SAP S/4HANA ledger; eliminates 1,400 manual hours/quarter.', 2
    ],
    // Stage 3: WSJF_HWSW_EVAL
    [
      'KBN-05', 'CLS-ITBP-105',
      'SMT Line IIoT Edge Gateway & SECS/GEM Protocol Hardware/Software Evaluation Readout',
      'SMTラインIIoTエッジゲートウェイおよびSECS/GEMプロトコル機器選定評価',
      'WSJF_HWSW_EVAL', 'CRITICAL', 'CLS-MYG (Miyagi Plant)', 'IT Infrastructure',
      6.25, 260000, 680000, 'Aritut (Mgr, ITBP 2)', 'Daisuke Ito (Chief Mfg Engineer, Miyagi)', '2026-10-28',
      85, 5, 6, 'HW/SW Eval,SECS/GEM,OPC-UA,Fuji NXT',
      'Evaluating Advantech vs. Dell NativeEdge vs. Cisco Industrial Gateways for real-time telemetry across 14 Fuji NXT & Panasonic NPM pick-and-place lines.', 1
    ],
    [
      'KBN-06', 'CLS-ITBP-106',
      'Kinaxis RapidResponse AI Demand Sensing & Semiconductor Buffer Allocation Prioritization',
      'Kinaxis RapidResponse AI需要予測・半導体在庫アロケーション優先順位付け',
      'WSJF_HWSW_EVAL', 'HIGH', 'CLS-LCB (Laem Chabang)', 'Supply Chain & APS',
      5.60, 290000, 810000, 'Aritut (Mgr, ITBP 2)', 'Somchai K. (SCM Dir, LCB) & K. Yamamoto', '2026-11-02',
      65, 3, 5, 'WSJF,Kinaxis APS,Supply Chain,Buffer Stock',
      'Qualifying and prioritizing 19 business requirements under Q4 IT execution capacity constraints using SAFe WSJF scoring matrix.', 2
    ],
    // Stage 4: SOW_VENDOR_GOV
    [
      'KBN-07', 'CLS-ITBP-107',
      'Vendor SOW & Governance: Siemens Opcenter Execution Electronics (Camstar) v24 Upgrade',
      'シーメンスOpcenter Execution Electronics (Camstar) v24アップグレードSOW契約管理',
      'SOW_VENDOR_GOV', 'CRITICAL', 'CLS-MYG (Miyagi Plant)', 'Manufacturing & MES',
      7.25, 580000, 1640000, 'Aritut (Mgr, ITBP 2)', 'Taro Nakamura (IT Director, APAC)', '2026-10-25',
      90, 5, 5, 'SOW,Vendor Mgmt,Siemens MES,PMO Escalation',
      'Finalized Statement of Work with Siemens Digital Industries & Hitachi Systems; resolved DB migration roadblock via PMO escalation protocol.', 1
    ],
    [
      'KBN-08', 'CLS-ITBP-108',
      'Automated ESD & Cleanroom Environmental Telemetry SOW (Omron IoT Sensors)',
      'クリーンルーム環境・ESD自動監視テレメトリSOW契約（オムロンIoT）',
      'SOW_VENDOR_GOV', 'MEDIUM', 'CLS-LCB (Laem Chabang)', 'Quality & IPC',
      4.20, 95000, 240000, 'Aritut (Mgr, ITBP 2)', 'Nattapong S. (Quality Mgr, Laem Chabang)', '2026-11-10',
      75, 3, 4, 'SOW,Omron IIoT,ESD Compliance,Aerospace',
      'Prepared vendor SOW and SLA penalty matrix for AS9100 Aerospace & Defense cleanroom humidity/ESD real-time compliance logging.', 2
    ],
    // Stage 5: P6_EXECUTION
    [
      'KBN-09', 'CLS-ITBP-109',
      'Master Program: Next-Gen MES & SAP S/4HANA Shop-Floor Convergence (Japan-Thailand Bridge)',
      '次世代MES・SAP S/4HANAショップフロア統合マスタープログラム（日タイ連携）',
      'P6_EXECUTION', 'CRITICAL', 'CLS-GLOBAL (Toronto/APAC)', 'Manufacturing & MES',
      7.50, 1250000, 3450000, 'Aritut (Mgr, ITBP 2)', 'Exec SteerCo (Toronto / Tokyo / Chonburi)', '2026-12-20',
      68, 7, 10, 'Primavera P6,CPM,EVM,SAP S/4HANA,MES',
      'Active execution tracked in Oracle Primavera P6 EPPM (14 WBS activities). Current SPI = 1.02, CPI = 1.05; Critical Path on API Gateway & Bilingual UAT.', 1
    ],
    [
      'KBN-10', 'CLS-ITBP-110',
      'Valor Process Preparation & Automated SMT Stencil/Feeder Verification Rollout',
      'Valor工程設計・SMTステンシル/フィーダー自動照合システム展開',
      'P6_EXECUTION', 'HIGH', 'CLS-MYG (Miyagi Plant)', 'Manufacturing & MES',
      5.80, 215000, 590000, 'Aritut (Mgr, ITBP 2)', 'Shinji Abe (NPI Engineering Lead, Miyagi)', '2026-11-28',
      55, 3, 5, 'Primavera P6,Valor DFM,SMT Setup,Zero-Defect',
      'P6 WBS 1.3 execution phase: integrating Mentor Valor NPI package with shop-floor barcode scanners to prevent wrong-reel feeder loading.', 2
    ],
    // Stage 6: UAT_VALUE_REALIZED
    [
      'KBN-11', 'CLS-ITBP-111',
      'Bilingual EDI 850/856/810 ASN Hub for Japanese Semiconductor & Capital Equipment OEMs',
      '日本の半導体・製造装置OEM向け日英バイリンガルEDI/ASN自動連携ハブ',
      'UAT_VALUE_REALIZED', 'HIGH', 'CLS-TYO (Tokyo HQ)', 'Supply Chain & APS',
      6.40, 175000, 540000, 'Aritut (Mgr, ITBP 2)', 'Kazuo Fujita (VP Commercial, Tokyo)', '2026-10-10',
      100, 6, 6, 'Go-Live,EDI/B2B,E2Open,Value Realized',
      'Completed UAT and Go-Live across 12 Japanese Tier-1 OEM customers. Achieved 99.94% ASN accuracy and reduced order entry cycle time from 4.5 hrs to 3 mins.', 1
    ],
    [
      'KBN-12', 'CLS-ITBP-112',
      'Automated Failure Analysis Lab LIMS & X-Ray Inspection Archive (Laem Chabang & Miyagi)',
      '故障解析ラボLIMSおよびX線検査画像アーカイブ統合（レムチャバン・宮城）',
      'UAT_VALUE_REALIZED', 'MEDIUM', 'CLS-LCB (Laem Chabang)', 'Quality & IPC',
      4.50, 130000, 310000, 'Aritut (Mgr, ITBP 2)', 'Dr. Pornchai V. (FA Lab Lead, LCB)', '2026-10-01',
      100, 5, 5, 'LIMS,Failure Analysis,Quality,Cloud S3',
      'Delivered cross-site Failure Analysis knowledge repository linking Laem Chabang and Miyagi labs; cut root-cause 8D report turnaround by 44%.', 2
    ]
  ];

  for (const c of kanbanCards) {
    insertCard.run(...c);
  }

  // ---------------------------------------------------------------------------
  // SEED 2: Oracle Primavera P6 EPPM Master Schedule (14 WBS & CPM Activities)
  // Project: PRJ-JP-2026-MES (Next-Gen MES & SAP S/4HANA Shop-Floor Convergence)
  // ---------------------------------------------------------------------------
  const insertP6 = db.prepare(`
    INSERT INTO itbp_p6_activities (
      id, project_id, wbs_code, wbs_name, activity_id, activity_name, activity_type,
      original_duration_days, remaining_duration_days, percent_complete,
      early_start, early_finish, late_start, late_finish,
      total_float_days, free_float_days, is_critical,
      predecessors, relationship_type, primary_resource, resource_role,
      planned_value_usd, earned_value_usd, actual_cost_usd, bac_usd, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const p6Activities = [
    [
      'P6-01', 'PRJ-JP-2026-MES', '1.1', '1.1 Initiation & Japan Ringi-sho Alignment',
      'A1000', 'Project Charter & Japan Ringi-sho (稟議書) Executive Sign-Off', 'Start Milestone',
      5, 0, 100.0, '2026-07-01', '2026-07-07', '2026-07-01', '2026-07-07',
      0, 0, 1, '-', 'FS', 'Aritut (Mgr, ITBP 2)', 'IT Business Partner Lead',
      35000, 35000, 33500, 35000, 'COMPLETED',
      'Approved by Director of ITBP (Toronto), GM Miyagi Plant, and VP Operations Laem Chabang.'
    ],
    [
      'P6-02', 'PRJ-JP-2026-MES', '1.1', '1.1 Initiation & Japan Ringi-sho Alignment',
      'A1010', 'Design Thinking & Gemba Requirements Workshop (Miyagi & Tokyo)', 'Task Dependent',
      15, 0, 100.0, '2026-07-08', '2026-07-28', '2026-07-08', '2026-07-28',
      0, 0, 1, 'A1000', 'FS', 'Aritut / K. Takahashi', 'ITBP & Japan SMEs',
      65000, 65000, 62000, 65000, 'COMPLETED',
      '5-Stage Design Thinking conducted in Japanese/English; 42 user stories & BABOK BRD baseline signed.'
    ],
    [
      'P6-03', 'PRJ-JP-2026-MES', '1.2', '1.2 BPR, Feasibility & Architecture Blueprint',
      'A1020', 'As-Is / To-Be BPR Flowcharts & 5-Year Financial CBA Readout', 'Task Dependent',
      12, 0, 100.0, '2026-07-29', '2026-08-13', '2026-07-29', '2026-08-13',
      0, 0, 1, 'A1010', 'FS', 'Aritut / A. Tanaka', 'ITBP & Finance Controller',
      55000, 55000, 51800, 55000, 'COMPLETED',
      'Validated NPV = $3.45M, IRR = 38.4%, Payback = 14.2 months across Miyagi & Laem Chabang.'
    ],
    [
      'P6-04', 'PRJ-JP-2026-MES', '1.2', '1.2 BPR, Feasibility & Architecture Blueprint',
      'A1030', 'Hardware/Software Evaluation (IIoT Edge Gateways & SECS/GEM)', 'Task Dependent',
      10, 0, 100.0, '2026-07-29', '2026-08-11', '2026-08-03', '2026-08-16',
      4, 4, 0, 'A1010', 'FS', 'Daisuke Ito / Infra Team', 'Solutions Architect',
      48000, 48000, 47200, 48000, 'COMPLETED',
      'Non-critical path (4d Float). Selected Advantech MIC-770 V3 + OPC-UA/SECS-GEM Broker.'
    ],
    [
      'P6-05', 'PRJ-JP-2026-MES', '1.3', '1.3 Vendor SOW & PMO Procurement Governance',
      'A1040', 'Vendor RFP, Statement of Work (SOW) & SLA Contract Execution', 'Task Dependent',
      14, 0, 100.0, '2026-08-14', '2026-09-02', '2026-08-14', '2026-09-02',
      0, 0, 1, 'A1020, A1030', 'FS', 'Aritut / Global Procurement', 'ITBP & Legal/Vendor Mgmt',
      70000, 70000, 68000, 70000, 'COMPLETED',
      'Signed fixed-price milestone SOW ($580k) with Siemens Digital Industries & Hitachi Systems.'
    ],
    [
      'P6-06', 'PRJ-JP-2026-MES', '1.4', '1.4 Core Engineering & System Integration',
      'A1050', 'Siemens Opcenter MES v24 Core Schema & Bilingual UI Localization', 'Task Dependent',
      22, 0, 100.0, '2026-09-03', '2026-10-02', '2026-09-03', '2026-10-02',
      0, 0, 1, 'A1040', 'FS', 'Hitachi MES Squad / LCB Dev', 'MES Lead Engineer',
      180000, 180000, 171500, 180000, 'COMPLETED',
      'Japanese/English/Thai operator terminal screens and IPC-1782 traceability schema deployed.'
    ],
    [
      'P6-07', 'PRJ-JP-2026-MES', '1.4', '1.4 Core Engineering & System Integration',
      'A1060', 'SAP S/4HANA PP/MM IDoc & REST API Integration Bridge (BAPI/OData)', 'Task Dependent',
      20, 4, 80.0, '2026-09-25', '2026-10-22', '2026-09-25', '2026-10-22',
      0, 0, 1, 'A1050', 'SS+15d', 'Global SAP CoE (Toronto/LCB)', 'ERP Integration Specialist',
      135000, 144000, 136000, 180000, 'IN_PROGRESS',
      'CRITICAL PATH: Real-time Production Order & Backflush confirmation sync between SAP and Opcenter.'
    ],
    [
      'P6-08', 'PRJ-JP-2026-MES', '1.4', '1.4 Core Engineering & System Integration',
      'A1070', 'SMT Pick-and-Place (Fuji NXT / Panasonic NPM) Edge Telemetry Setup', 'Task Dependent',
      16, 3, 81.25, '2026-09-28', '2026-10-19', '2026-10-05', '2026-10-26',
      5, 2, 0, 'A1050', 'FS', 'Miyagi Automation Team', 'IIoT Field Engineer',
      90000, 97500, 93000, 120000, 'IN_PROGRESS',
      '11 of 14 SMT lines streaming live feeder splice & nozzle vacuum telemetry via Kafka.'
    ],
    [
      'P6-09', 'PRJ-JP-2026-MES', '1.4', '1.4 Core Engineering & System Integration',
      'A1080', 'Kinaxis RapidResponse APS & E2Open Supplier Portal Connector', 'Task Dependent',
      15, 5, 66.7, '2026-10-05', '2026-10-23', '2026-10-12', '2026-10-30',
      5, 5, 0, 'A1060', 'SS+7d', 'SCM IT Team (Laem Chabang)', 'Supply Chain Architect',
      72000, 73370, 71000, 110000, 'IN_PROGRESS',
      'Automated WIP visibility feed for Tokyo OEM order promising and CTB (Clear-to-Build) checks.'
    ],
    [
      'P6-10', 'PRJ-JP-2026-MES', '1.5', '1.5 Verification, J-SOX Audit & Bilingual UAT',
      'A1090', 'End-to-End SIT & Cybersecurity / J-SOX ITGC Penetration Testing', 'Task Dependent',
      12, 8, 33.3, '2026-10-12', '2026-10-28', '2026-10-12', '2026-10-28',
      0, 0, 1, 'A1060, A1070', 'FS', 'Global InfoSec & Japan Audit', 'Security & J-SOX Auditor',
      38000, 36630, 35000, 110000, 'IN_PROGRESS',
      'CRITICAL PATH: Validating role-based access control (RBAC) and immutable audit trails.'
    ],
    [
      'P6-11', 'PRJ-JP-2026-MES', '1.5', '1.5 Verification, J-SOX Audit & Bilingual UAT',
      'A1100', 'Bilingual User Acceptance Testing (UAT) — Miyagi NPI & LCB Plant 2', 'Task Dependent',
      14, 14, 0.0, '2026-10-29', '2026-11-17', '2026-10-29', '2026-11-17',
      0, 0, 1, 'A1090', 'FS', 'Aritut / Shop Floor Key Users', 'ITBP UAT Facilitator',
      0, 0, 0, 105000, 'NOT_STARTED',
      'CRITICAL PATH: Parallel simulation of 5 optical & server blade work orders across JP and TH.'
    ],
    [
      'P6-12', 'PRJ-JP-2026-MES', '1.6', '1.6 Cutover, Hypercare & Value Harvesting',
      'A1110', 'Operator Training & Bilingual SOP Handover (JP/EN/TH)', 'Task Dependent',
      10, 10, 0.0, '2026-11-05', '2026-11-18', '2026-11-11', '2026-11-24',
      4, 4, 0, 'A1090', 'FS', 'HRD & ITBP Change Mgmt', 'Change Management Lead',
      0, 0, 0, 52000, 'NOT_STARTED',
      'Training 180 line leaders in Miyagi (Japanese) and 420 operators in Laem Chabang (Thai/EN).'
    ],
    [
      'P6-13', 'PRJ-JP-2026-MES', '1.6', '1.6 Cutover, Hypercare & Value Harvesting',
      'A1120', 'Production Cutover, Go-Live & 24x7 War-Room Hypercare', 'Task Dependent',
      15, 15, 0.0, '2026-11-18', '2026-12-08', '2026-11-18', '2026-12-08',
      0, 0, 1, 'A1100, A1110', 'FS', 'Aritut / Global PMO / Vendors', 'Cutover Commander',
      0, 0, 0, 85000, 'NOT_STARTED',
      'CRITICAL PATH: Zero-downtime weekend cutover during scheduled plant maintenance window.'
    ],
    [
      'P6-14', 'PRJ-JP-2026-MES', '1.6', '1.6 Cutover, Hypercare & Value Harvesting',
      'A1130', 'Post-Implementation Review (PIR) & Benefits Realization Sign-Off', 'Finish Milestone',
      8, 8, 0.0, '2026-12-09', '2026-12-18', '2026-12-09', '2026-12-18',
      0, 0, 1, 'A1120', 'FS', 'Aritut / Director of ITBP', 'IT Business Partner Lead',
      0, 0, 0, 35000, 'NOT_STARTED',
      'Final readout to Toronto PMO & Japan Executive Board verifying OEE (+6.8%) and Cycle Time KPIs.'
    ]
  ];

  for (const a of p6Activities) {
    insertP6.run(...a);
  }

  // ---------------------------------------------------------------------------
  // SEED 3: Design Thinking Workshops & BABOK Requirements (RTM + WSJF)
  // ---------------------------------------------------------------------------
  const insertReq = db.prepare(`
    INSERT INTO itbp_requirements (
      id, req_code, project_code, workshop_method, bu_department, stakeholder_jp,
      requirement_title, requirement_title_jp, business_need, technical_spec,
      user_business_value, time_criticality, risk_reduction, job_size,
      moscow_priority, verification_method, traceability_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const requirements = [
    [
      'REQ-01', 'BRD-JP-001', 'CLS-ITBP-109', 'Design Thinking (5-Stage)',
      'Miyagi NPI & Laem Chabang Box-Build', 'Hiroshi Watanabe (宮城工場長)',
      'Automated e-DHR & Lot Genealogy Across Japan NPI and Thailand Mass Production',
      '日タイ拠点間での電子デバイス履歴記録(e-DHR)およびロット追跡の完全自動化',
      'Eliminate manual Excel/PDF serialization handoffs during NPI-to-MP transfer, reducing transfer cycle time from 28 days to 10 days.',
      'ISA-95 Level 3 REST/Kafka bridge syncing Siemens Opcenter e-DHR XML packages with SAP S/4HANA Batch Management (MSC1N) & Valor BOM.',
      10, 9, 10, 4, 'MUST_HAVE', 'End-to-End Lot Traceability Audit (< 3 sec query)', 'IN_DEV'
    ],
    [
      'REQ-02', 'BRD-JP-002', 'CLS-ITBP-105', 'Gemba Kaizen Walk',
      'Miyagi SMT Assembly Line 1-14', 'Daisuke Ito (生産技術部長)',
      'Real-Time SMT Feeder Wrong-Reel Interlock & MSD (Moisture Sensitive Device) Floor-Life Timer',
      'SMTフィーダー異품種装填インターロックおよびMSD湿度管理タイマー自動遮断',
      'Prevent costly PCBA scrap on high-density optical modules caused by expired J-STD-033 moisture exposure time.',
      'SECS/GEM S2F41 Host Command interlock to Fuji NXT / Panasonic NPM halting machine start if barcode scan mismatches BOM or MSD floor-life > 72 hrs.',
      10, 9, 9, 4, 'MUST_HAVE', 'Shop-Floor Interlock Simulation (100% Block Rate)', 'APPROVED'
    ],
    [
      'REQ-03', 'BRD-JP-003', 'CLS-ITBP-104', 'J-SOX Compliance Audit',
      'Japan Finance & Global Shared Services', 'Akiko Tanaka (財務統括部長)',
      'J-SOX Compliant Automated Three-Way Match & Qualified Invoice System (適格請求書) Validation',
      'J-SOX準拠の自動三面照合および適格請求書（インボイス制度）NTA API検証',
      'Ensure 100% statutory compliance with Japan National Tax Agency (NTA) invoice registration and eliminate manual PO-GR-IR discrepancies.',
      'SAP S/4HANA FI/MM BAPI integration with NTA T-Number validation API and automated workflow approval matrix.',
      9, 8, 10, 5, 'MUST_HAVE', 'External Auditor J-SOX ITGC Sample Test (0 Findings)', 'VALIDATED'
    ],
    [
      'REQ-04', 'BRD-JP-004', 'CLS-ITBP-106', 'BPM SIPOC Workshop',
      'Global Supply Chain & Tokyo OEM Sales', 'Kazuo Fujita (営業本部長)',
      'Bi-Directional Kinaxis RapidResponse Clear-to-Build (CTB) & Allocation Simulation',
      'Kinaxis RapidResponse双方向クリア・トゥ・ビルド(CTB)および部材引当シミュレーション',
      'Provide Japanese OEM customers with real-time commit dates when long-lead semiconductor components experience allocation constraints.',
      'High-frequency OData delta sync between SAP S/4HANA MD04 MRP Live, E2Open Supplier commits, and Kinaxis RapidResponse.',
      9, 9, 8, 5, 'SHOULD_HAVE', 'Parallel MRP vs. Kinaxis Scenario Playback', 'APPROVED'
    ],
    [
      'REQ-05', 'BRD-JP-005', 'CLS-ITBP-101', 'Design Thinking (5-Stage)',
      'Miyagi & Laem Chabang Quality Assurance', 'Kenji Takahashi (品質保証部長)',
      'AI Computer Vision Secondary Verification for 3D AOI / AXI False Calls',
      '3D AOI/AXI過検出削減のためのAI画像認識二次判定エンジン統合',
      'Reduce manual operator re-inspection workload by 60% while maintaining zero escape rate (0 DPPM) for IPC-A-610 Class 3 assemblies.',
      'NVIDIA Jetson Orin Industrial edge inference container receiving Koh Young / Omron 3D AOI image crops via gRPC.',
      8, 7, 8, 5, 'SHOULD_HAVE', 'Gage R&R & Confusion Matrix Validation (AUC > 0.994)', 'ELICITED'
    ],
    [
      'REQ-06', 'BRD-JP-006', 'CLS-ITBP-102', 'Design Thinking (5-Stage)',
      'Tokyo After-Market & Hino Repair Hub', 'Yuki Sato (アフターマーケット部長)',
      'Self-Service Japanese/English Customer RMA & ITAD Certificate Portal',
      '日英対応セルフサービスRMA申請・ITADデータ消去証明書発行ポータル',
      'Allow enterprise cloud & telecom customers in Japan to track RMA repair TAT and download NIST 800-88 data sanitization certificates.',
      'React/Tailwind portal integrated with ServiceNow CSM and shop-floor repair routing via OAuth2/OIDC.',
      7, 6, 6, 5, 'COULD_HAVE', 'Customer UAT Playback with 3 Pilot Tokyo OEMs', 'ELICITED'
    ]
  ];

  for (const r of requirements) {
    insertReq.run(...r);
  }

  // ---------------------------------------------------------------------------
  // SEED 4: BPR Process Re-engineering, Feasibility & Financial CBA Studies
  // ---------------------------------------------------------------------------
  const insertCba = db.prepare(`
    INSERT INTO itbp_cba_studies (
      id, study_code, initiative_name, target_site, functional_domain,
      as_is_process_desc, as_is_cycle_time_hrs, as_is_defect_dppm, as_is_oee_percent,
      to_be_process_desc, to_be_cycle_time_hrs, to_be_defect_dppm, to_be_oee_percent,
      capex_usd, annual_opex_usd, annual_gross_savings_usd, discount_rate_percent,
      npv_5yr_usd, irr_percent, roi_percent, payback_months, feasibility_rating, approval_ringi_no
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const cbaStudies = [
    [
      'CBA-01', 'CBA-2026-JP01',
      'Next-Gen MES & SAP S/4HANA Shop-Floor Convergence (Japan-Thailand Bridge)',
      'Miyagi Plant (CLS-MYG) & Laem Chabang (CLS-LCB)', 'Manufacturing Operations & MES',
      'Manual paper traveler & fragmented legacy shop-floor logs; batch ERP backflushing every 12 hours causing WIP blind spots and 18-day NPI handoff delays.',
      42.0, 480, 74.5,
      'Unified Siemens Opcenter v24 + SAP S/4HANA real-time event mesh; barcode/RFID automated e-DHR genealogy, instant SECS/GEM machine interlocks, and 1-click NPI-to-MP BOM/BOP transfer.',
      6.5, 45, 86.2,
      1250000, 145000, 1180000, 8.5,
      3450000, 38.4, 276.0, 14.2, 'HIGHLY_VIABLE', 'RINGI-JP-2026-088'
    ],
    [
      'CBA-02', 'CBA-2026-JP02',
      'SMT Line IIoT Edge Telemetry & Predictive Maintenance (14 High-Speed Lines)',
      'Miyagi Plant (CLS-MYG) & Laem Chabang Plant 1', 'Industrial IoT & Production Engineering',
      'Reactive nozzle/feeder maintenance; manual USB log extraction from Fuji NXT & Panasonic NPM machines; unplanned line stops averaging 5.8 hrs/week.',
      14.5, 310, 76.0,
      'Real-time IPC-CFX / SECS-GEM edge streaming to Kafka & AI anomaly detection; automated splice validation and predictive nozzle cleaning alerts before pickup errors occur.',
      1.8, 62, 85.4,
      260000, 38000, 295000, 8.5,
      680000, 44.2, 261.5, 11.8, 'HIGHLY_VIABLE', 'RINGI-JP-2026-104'
    ],
    [
      'CBA-03', 'CBA-2026-JP03',
      'Kinaxis RapidResponse AI Demand Sensing & Automated Supplier CTB Portal',
      'Tokyo Commercial HQ (CLS-TYO) & Laem Chabang SCM', 'Supply Chain & Production Planning',
      'Weekly spreadsheet-based Clear-to-Build (CTB) consolidation across 340+ suppliers; 4.5-day latency in responding to Japanese OEM forecast changes.',
      108.0, 1250, 71.0,
      'Bi-directional Kinaxis RapidResponse + E2Open B2B EDI hub with automated constraints simulation, real-time supplier commit updates, and instant ATP/CTP readouts.',
      4.0, 120, 88.0,
      290000, 42000, 340000, 8.5,
      810000, 46.8, 279.3, 11.5, 'HIGHLY_VIABLE', 'RINGI-JP-2026-119'
    ],
    [
      'CBA-04', 'CBA-2026-JP04',
      'J-SOX Automated 3-Way Match & Qualified e-Invoice (インボイス) FinOps Suite',
      'Tokyo Finance & Thailand Regional Shared Services', 'Finance, Accounting & Compliance',
      'Manual PDF invoice data entry, physical hanko/stamp routing, and manual NTA tax registration verification taking 5.2 days per voucher batch.',
      124.8, 890, 68.0,
      'OCR + RPA + SAP S/4HANA BAPI automated 3-way match (PO/GR/IR) with real-time Japan NTA API tax ID verification and digital Ringi-sho workflow.',
      2.5, 15, 94.5,
      145000, 22000, 178000, 8.5,
      390000, 48.5, 268.9, 11.1, 'HIGHLY_VIABLE', 'RINGI-JP-2026-127'
    ]
  ];

  for (const s of cbaStudies) {
    insertCba.run(...s);
  }

  // ---------------------------------------------------------------------------
  // SEED 5: Vendor SOW Contracts & Hardware/Software Evaluation Matrix
  // ---------------------------------------------------------------------------
  const insertSow = db.prepare(`
    INSERT INTO itbp_sow_vendors (
      id, sow_number, vendor_name, solution_category, project_title, contract_type,
      total_contract_usd, start_date, end_date,
      functional_fit_score, compatibility_score, cybersecurity_jsox_score, tco_commercial_score,
      weighted_eval_score, sla_uptime_target, milestones_completed, milestones_total,
      governance_status, escalation_note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sowVendors = [
    [
      'SOW-01', 'SOW-CLS-2026-081',
      'Siemens Digital Industries & Hitachi Systems (日立システムズ)',
      'MES_SHOPFLOOR', 'Opcenter Execution Electronics v24 Multi-Site Deployment (Miyagi & Laem Chabang)',
      'Fixed-Price Milestone', 580000, '2026-08-15', '2026-12-18',
      96, 95, 98, 90, 95.1, '99.95% (P1 Response < 15m)', 4, 6, 'ON_TRACK',
      'Resolved Milestone 3 Oracle-to-PostgreSQL partitioning delay via PMO escalation on 02-Oct-2026; vendor added 2 senior Japanese-speaking MES architects at zero extra cost.'
    ],
    [
      'SOW-02', 'SOW-CLS-2026-094',
      'Advantech Japan & NTT Communications',
      'IIOT_HARDWARE_EDGE', 'MIC-770 V3 Industrial Edge Gateways & SECS/GEM Telemetry Appliance (14 SMT Lines)',
      'Fixed-Price Milestone', 260000, '2026-09-01', '2026-11-30',
      94, 96, 93, 92, 94.0, '99.98% Edge High-Availability', 3, 4, 'ON_TRACK',
      'Outscored Dell NativeEdge (88.4) and Cisco IC3000 (86.2) in multi-criteria HW/SW evaluation due to native Fuji NXT & Panasonic NPM driver compatibility and 18% lower 5-year TCO.'
    ],
    [
      'SOW-03', 'SOW-CLS-2026-103',
      'Kinaxis Inc. & Nomura Research Institute (NRI / 野村総合研究所)',
      'ERP_SUPPLY_CHAIN', 'RapidResponse AI Demand Sensing & Japan OEM CTB Integration Pack',
      'Time & Materials (Capped)', 290000, '2026-09-15', '2026-12-10',
      95, 92, 96, 88, 93.1, '99.90% Cloud SaaS SLA', 2, 5, 'ROADBLOCK_ESCALATED',
      'PMO Escalation Active: SAP S/4HANA custom Z-table field mapping for consigned Japanese OEM silicon wafers delayed by 3 days. Negotiated fast-track CR review with Toronto Global ERP CoE.'
    ],
    [
      'SOW-04', 'SOW-CLS-2026-112',
      'Koh Young Technology & Omron Automation',
      'QUALITY_AOI_VISION', 'KSMART AI True3D SPI/AOI Closed-Loop Feedback & IPC-CFX Bridge',
      'Fixed-Price Milestone', 185000, '2026-10-10', '2027-01-31',
      93, 91, 94, 89, 92.0, '99.90% Vision Server SLA', 1, 4, 'EVALUATION_READOUT',
      'Hardware & software readout presented to Miyagi & Laem Chabang Quality SteerCo; awaiting final Q4 CapEx release.'
    ]
  ];

  for (const v of sowVendors) {
    insertSow.run(...v);
  }

  // ---------------------------------------------------------------------------
  // SEED 6: Enterprise System Integration Registry & Audit Logs
  // ---------------------------------------------------------------------------
  const insertInt = db.prepare(`
    INSERT INTO itbp_integrations (
      id, connector_code, system_name, isa95_level, protocol_standard,
      source_endpoint, target_endpoint, sync_frequency, latency_ms,
      records_synced_today, health_status, sample_payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const integrations = [
    [
      'INT-01', 'SAP-S4-MES-BRIDGE',
      'SAP S/4HANA Global ERP <-> Siemens Opcenter MES (Miyagi & LCB)',
      'Level 4 (ERP/APS/PMO)', 'OData v4 / SAP IDoc (PP_ORDER / BAPI_PRODORDCONF)',
      'https://sap-s4.celestica.global/sap/opu/odata/sap/API_PRODUCTION_ORDER',
      'https://mes-apac.celestica.global/api/v24/workorders/sync',
      'Real-Time Event (< 5s)', 42, 18420, 'HEALTHY',
      JSON.stringify({
        message_id: 'IDOC-PP-20261016-8841',
        plant_code: 'JP01_MIYAGI_TO_TH02_LCB',
        production_order: 'PO-800G-OPT-99201',
        material_sku: 'CLS-OPT-800G-DR8-REV3',
        order_qty: 2500,
        bom_revision: 'REV-3.4-IPC3',
        j_sox_control_hash: 'SHA256:9f84b2c1e7a04891d23a'
      })
    ],
    [
      'INT-02', 'SECS-GEM-SMT-EDGE',
      'Fuji NXT / Panasonic NPM SMT Lines <-> Kafka IIoT Telemetry Broker',
      'Level 2 (SMT/IIoT Edge)', 'SECS/GEM (E5/E30/E37) & IPC-CFX over MQTT/TLS',
      'tcp://10.148.22.101:5000/secsgem/miyagi-smt-line04',
      'kafka://msk-apac.celestica.global:9094/topic/smt-telemetry-events',
      'Streaming (100ms)', 14, 142500, 'HEALTHY',
      JSON.stringify({
        machine_id: 'MYG-SMT-L04-FUJI-NXT3',
        event: 'IPC_CFX_UNITS_PROCESSED',
        board_barcode: 'SN-MYG264100892',
        placement_rate_cph: 38400,
        pickup_rate_percent: 99.97,
        msd_floor_life_remaining_hrs: 58.4,
        solder_paste_spi_status: 'PASS_IPC_CLASS_3'
      })
    ],
    [
      'INT-03', 'KINAXIS-APS-E2OPEN',
      'Kinaxis RapidResponse APS <-> E2Open Multi-Tier Supplier Hub',
      'Level 4 (ERP/APS/PMO)', 'REST JSON / AS2 EDI (850/856/860)',
      'https://celestica.kinaxis.net/integration/v1/ctb-simulation',
      'https://b2b.celestica.global/e2open/jp-oem-allocation',
      'Every 15 Minutes', 118, 6340, 'HEALTHY',
      JSON.stringify({
        simulation_id: 'KIN-CTB-JP-2026-441',
        customer_oem: 'TOKYO_CLOUD_INFRA_OEM',
        target_plant: 'TH02_LAEM_CHABANG',
        clear_to_build_percent: 98.5,
        critical_component: 'DSP-7NM-ASIC-BGA',
        allocated_buffer_qty: 12000,
        expedite_recommendation: 'NO_ACTION_REQUIRED'
      })
    ],
    [
      'INT-04', 'PRIMAVERA-P6-SERVICENOW',
      'Oracle Primavera P6 EPPM <-> ServiceNow ITBM & Global PMO Cockpit',
      'Level 4 (ERP/APS/PMO)', 'Primavera P6 REST API / XER Web Services',
      'https://p6.celestica.global/p6ws/restapi/activity?projectId=PRJ-JP-2026-MES',
      'https://celestica.service-now.com/api/now/table/pm_project_task',
      'Hourly / On-Demand', 85, 940, 'HEALTHY',
      JSON.stringify({
        eps_node: 'CLS-APAC-ITBP',
        project_id: 'PRJ-JP-2026-MES',
        data_date: '2026-10-16',
        cpi: 1.05,
        spi: 1.02,
        critical_activities_count: 10,
        total_float_min_days: 0
      })
    ]
  ];

  for (const i of integrations) {
    insertInt.run(...i);
  }

  const insertLog = db.prepare(`
    INSERT INTO itbp_integration_logs (
      connector_code, event_type, source_system, target_system, payload_summary, status_code, triggered_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertLog.run('SAP-S4-MES-BRIDGE', 'WORK_ORDER_RELEASE', 'SAP S/4HANA (Global)', 'Siemens Opcenter MES (Miyagi/LCB)', 'Synced PO-800G-OPT-99201 (2,500 units) with e-DHR BOM Rev 3.4', 200, 'System Auto-Scheduler');
  insertLog.run('SECS-GEM-SMT-EDGE', 'MSD_INTERLOCK_VERIFY', 'Fuji NXT III Line 04 (Miyagi)', 'Opcenter Camstar Quality Gate', 'Verified J-STD-033 floor-life timer (58.4h remaining) — Line Start Authorized', 200, 'Edge Gateway MIC-770');
  insertLog.run('PRIMAVERA-P6-SERVICENOW', 'CPM_SCHEDULE_CALC', 'Oracle Primavera P6 EPPM', 'Global IT PMO Dashboard', 'Recalculated Critical Path (Data Date: 16-Oct-2026): SPI=1.02, CPI=1.05', 200, 'Aritut (Mgr, ITBP 2)');
  insertLog.run('KINAXIS-APS-E2OPEN', 'CTB_ALLOCATION_SYNC', 'Kinaxis RapidResponse', 'Tokyo OEM Portal & LCB Warehouse', 'Updated Clear-to-Build (98.5%) for Q4 High-Speed Switch Box-Build', 200, 'SCM Batch Sync');

  console.log(`[CELESTICA-ITBP] Seeding complete.`);
  return db;
}

if (require.main === module) {
  initCelesticaDb();
}

module.exports = { initCelesticaDb, DB_PATH };
