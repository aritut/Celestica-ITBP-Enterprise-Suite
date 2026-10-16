/**
 * Celestica (Thailand) Limited & Celestica Japan K.K.
 * Enterprise Handler Module for Production Deployment (Vercel / Render / Cloud / Local)
 * Role: Manager, IT Business Partner 2 (Req ID: 133553 | Band 10 | Laem Chabang, Chonburi)
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { initCelesticaDb } = require('./celestica_db_init');

let DB_PATH = process.env.CELESTICA_DB_PATH || path.join(__dirname, 'celestica_itbp.db');
if (process.env.VERCEL) {
  DB_PATH = path.join('/tmp', 'celestica_itbp.db');
}

let db = null;

function getDb() {
  if (db) return db;
  try {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA foreign_keys = ON;');
    const check = db.prepare(`SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name='itbp_kanban_cards'`).get();
    if (!check || check.cnt === 0) {
      initCelesticaDb(db);
    }
    return db;
  } catch (err) {
    console.error('[CELESTICA DB ERROR]', err.message);
    return null;
  }
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data, null, 2));
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function computeP6Summary(activities) {
  let totalPV = 0, totalEV = 0, totalAC = 0, totalBAC = 0;
  let criticalCount = 0, completedCount = 0;
  for (const a of activities) {
    totalPV += Number(a.planned_value_usd || 0);
    totalEV += Number(a.earned_value_usd || 0);
    totalAC += Number(a.actual_cost_usd || 0);
    totalBAC += Number(a.bac_usd || 0);
    if (Number(a.is_critical) === 1) criticalCount++;
    if (a.status === 'COMPLETED' || Number(a.percent_complete) >= 100) completedCount++;
  }
  const spi = totalPV > 0 ? +(totalEV / totalPV).toFixed(2) : 1.00;
  const cpi = totalAC > 0 ? +(totalEV / totalAC).toFixed(2) : 1.00;
  const eac = cpi > 0 ? Math.round(totalBAC / cpi) : totalBAC;
  const vac = Math.round(totalBAC - eac);
  const overallProgress = totalBAC > 0 ? +((totalEV / totalBAC) * 100).toFixed(1) : 0;
  return {
    total_activities: activities.length,
    critical_activities: criticalCount,
    completed_activities: completedCount,
    pv_usd: Math.round(totalPV),
    ev_usd: Math.round(totalEV),
    ac_usd: Math.round(totalAC),
    bac_usd: Math.round(totalBAC),
    spi,
    cpi,
    eac_usd: eac,
    vac_usd: vac,
    overall_progress_percent: overallProgress
  };
}

function handle(req, res, pathname, method) {
  const normalizedPath = pathname.replace(/\/$/, '') || '/';

  // 1. Serve Main Portal & Official Printable A4 Documents
  const staticMap = {
    '/celestica': 'celestica_portal.html',
    '/itbp': 'celestica_portal.html',
    '/celestica_portal.html': 'celestica_portal.html',
    '/celestica/doc/cba': 'celestica_doc_charter_cba.html',
    '/celestica_doc_charter_cba.html': 'celestica_doc_charter_cba.html',
    '/celestica/doc/sow': 'celestica_doc_sow_vmp.html',
    '/celestica_doc_sow_vmp.html': 'celestica_doc_sow_vmp.html',
    '/celestica/doc/p6': 'celestica_doc_p6_pmo.html',
    '/celestica_doc_p6_pmo.html': 'celestica_doc_p6_pmo.html'
  };

  if (staticMap[normalizedPath]) {
    const filePath = path.join(__dirname, staticMap[normalizedPath]);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(filePath));
      return true;
    }
  }

  // 2. Handle REST APIs under /api/celestica
  if (!normalizedPath.startsWith('/api/celestica')) {
    return false;
  }

  (async () => {
    try {
      const database = getDb();
      if (!database) {
        return sendJson(res, 500, { status: 'error', message: 'SQLite Database unavailable' });
      }

      // GET /api/celestica/overview (Single-roundtrip full dataset & KPI summary)
      if (normalizedPath === '/api/celestica/overview' && method === 'GET') {
        const kanban = database.prepare(`SELECT * FROM itbp_kanban_cards ORDER BY display_order ASC, updated_at DESC`).all();
        const p6 = database.prepare(`SELECT * FROM itbp_p6_activities ORDER BY activity_id ASC`).all();
        const requirements = database.prepare(`SELECT * FROM itbp_requirements ORDER BY wsjf_index DESC`).all();
        const cbaStudies = database.prepare(`SELECT * FROM itbp_cba_studies ORDER BY npv_5yr_usd DESC`).all();
        const sowVendors = database.prepare(`SELECT * FROM itbp_sow_vendors ORDER BY weighted_eval_score DESC`).all();
        const integrations = database.prepare(`SELECT * FROM itbp_integrations ORDER BY id ASC`).all();
        const logs = database.prepare(`SELECT * FROM itbp_integration_logs ORDER BY id DESC LIMIT 15`).all();

        const p6Summary = computeP6Summary(p6);
        const totalPortfolioBudget = kanban.reduce((s, c) => s + Number(c.budget_usd || 0), 0);
        const totalPortfolioNpv = kanban.reduce((s, c) => s + Number(c.npv_usd || 0), 0);
        const avgOeeGain = cbaStudies.length
          ? +(cbaStudies.reduce((s, c) => s + (c.to_be_oee_percent - c.as_is_oee_percent), 0) / cbaStudies.length).toFixed(1)
          : 11.4;

        return sendJson(res, 200, {
          status: 'ok',
          role_metadata: {
            title: 'Manager, IT Business Partner 2',
            req_id: '133553',
            band: 'Band 10',
            location: 'Celestica (Thailand) Limited — 49/18 Moo 5, Laem Chabang Industrial Estate, Chonburi 20230',
            partner_sites: [
              'Celestica Japan K.K. — Miyagi Manufacturing & NPI Center (Taiwa-cho, Miyagi 981-3681)',
              'Celestica Japan K.K. — Tokyo Commercial & OEM Office (Minato-ku / Hino, Tokyo)',
              'Celestica Inc. — Global Corporate & IT HQ (5140 Yonge St, Toronto, ON, Canada)'
            ]
          },
          kpis: {
            active_initiatives: kanban.length,
            total_portfolio_budget_usd: totalPortfolioBudget,
            total_portfolio_npv_usd: totalPortfolioNpv,
            avg_oee_improvement_pct: avgOeeGain,
            p6_spi: p6Summary.spi,
            p6_cpi: p6Summary.cpi,
            p6_overall_progress: p6Summary.overall_progress_percent
          },
          p6_summary: p6Summary,
          kanban,
          p6_activities: p6,
          requirements,
          cba_studies: cbaStudies,
          sow_vendors: sowVendors,
          integrations,
          integration_logs: logs
        });
      }

      // GET /api/celestica/kanban
      if (normalizedPath === '/api/celestica/kanban' && method === 'GET') {
        const kanban = database.prepare(`SELECT * FROM itbp_kanban_cards ORDER BY display_order ASC, updated_at DESC`).all();
        return sendJson(res, 200, { status: 'ok', data: kanban });
      }

      // POST /api/celestica/kanban (Create new Trello-style card)
      if (normalizedPath === '/api/celestica/kanban' && method === 'POST') {
        const body = await readJsonBody(req);
        const id = 'KBN-' + Date.now().toString().slice(-6);
        const cardCode = body.card_code || ('CLS-ITBP-' + Math.floor(113 + Math.random() * 800));
        const title = (body.title || 'New Japan-Global ITBP Strategic Initiative').trim();
        const titleJp = (body.title_jp || '日タイITビジネスパートナー新規戦略プロジェクト').trim();
        const stage = body.stage || 'IDEATION_WORKSHOP';
        const priority = body.priority || 'HIGH';
        const buSite = body.bu_site || 'CLS-MYG (Miyagi Plant)';
        const functionalArea = body.functional_area || 'Manufacturing & MES';
        const wsjfScore = parseFloat(body.wsjf_score) || 5.50;
        const budgetUsd = parseFloat(body.budget_usd) || 150000;
        const npvUsd = parseFloat(body.npv_usd) || Math.round(budgetUsd * 2.4);
        const ownerName = body.owner_name || 'Aritut (Mgr, ITBP 2)';
        const stakeholderJp = body.stakeholder_jp || 'Kenji Takahashi (Miyagi Ops)';
        const dueDate = body.due_date || '2026-12-15';
        const progressPercent = parseInt(body.progress_percent, 10) || 15;
        const tags = body.tags || 'Design Thinking,BPR,Japan-BU';
        const summary = body.summary || 'Initiated via ITBP Strategic Console to align Japan BU requirements with Global IT roadmap.';

        database.prepare(`
          INSERT INTO itbp_kanban_cards (
            id, card_code, title, title_jp, stage, priority, bu_site, functional_area,
            wsjf_score, budget_usd, npv_usd, owner_name, stakeholder_jp, due_date,
            progress_percent, checklist_done, checklist_total, tags, summary, display_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 5, ?, ?, 1)
        `).run(
          id, cardCode, title, titleJp, stage, priority, buSite, functionalArea,
          wsjfScore, budgetUsd, npvUsd, ownerName, stakeholderJp, dueDate,
          progressPercent, tags, summary
        );

        database.prepare(`
          INSERT INTO itbp_integration_logs (connector_code, event_type, source_system, target_system, payload_summary, status_code, triggered_by)
          VALUES ('PRIMAVERA-P6-SERVICENOW', 'KANBAN_CARD_CREATED', 'ITBP Kanban Board', 'ServiceNow ITBM & SQLite WAL', ?, 201, ?)
        `).run(`Created card ${cardCode}: ${title} [${stage}]`, ownerName);

        const created = database.prepare(`SELECT * FROM itbp_kanban_cards WHERE id = ?`).get(id);
        return sendJson(res, 201, { status: 'ok', message: 'Card created', data: created });
      }

      // PUT /api/celestica/kanban/:id/move (Drag-and-Drop stage transition or update)
      if (normalizedPath.startsWith('/api/celestica/kanban/') && normalizedPath.endsWith('/move') && (method === 'PUT' || method === 'POST')) {
        const parts = normalizedPath.split('/');
        const cardId = decodeURIComponent(parts[4]);
        const body = await readJsonBody(req);
        const existing = database.prepare(`SELECT * FROM itbp_kanban_cards WHERE id = ? OR card_code = ?`).get(cardId, cardId);
        if (!existing) {
          return sendJson(res, 404, { status: 'error', message: 'Kanban card not found' });
        }

        const newStage = body.stage || existing.stage;
        let newProgress = body.progress_percent !== undefined ? parseInt(body.progress_percent, 10) : existing.progress_percent;
        let newCheckDone = body.checklist_done !== undefined ? parseInt(body.checklist_done, 10) : existing.checklist_done;

        // Auto-adjust progress when dragged to a new lifecycle stage if not explicitly overridden
        if (body.stage && body.progress_percent === undefined) {
          const stageProgressMap = {
            'IDEATION_WORKSHOP': 20,
            'FEASIBILITY_CBA': 40,
            'WSJF_HWSW_EVAL': 60,
            'SOW_VENDOR_GOV': 75,
            'P6_EXECUTION': 85,
            'UAT_VALUE_REALIZED': 100
          };
          if (stageProgressMap[newStage] !== undefined) {
            newProgress = stageProgressMap[newStage];
            newCheckDone = newStage === 'UAT_VALUE_REALIZED' ? existing.checklist_total : Math.min(existing.checklist_total, Math.ceil((newProgress / 100) * existing.checklist_total));
          }
        }

        database.prepare(`
          UPDATE itbp_kanban_cards
          SET stage = ?, progress_percent = ?, checklist_done = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newStage, newProgress, newCheckDone, existing.id);

        database.prepare(`
          INSERT INTO itbp_integration_logs (connector_code, event_type, source_system, target_system, payload_summary, status_code, triggered_by)
          VALUES ('PRIMAVERA-P6-SERVICENOW', 'KANBAN_STAGE_TRANSITION', 'ITBP Drag-and-Drop Board', 'SQLite WAL & Global PMO', ?, 200, 'Aritut (Mgr, ITBP 2)')
        `).run(`Moved ${existing.card_code} (${existing.title.slice(0, 42)}...) from ${existing.stage} -> ${newStage}`);

        const updated = database.prepare(`SELECT * FROM itbp_kanban_cards WHERE id = ?`).get(existing.id);
        return sendJson(res, 200, { status: 'ok', message: 'Card moved and persisted in SQLite', data: updated });
      }

      // DELETE /api/celestica/kanban/:id
      if (normalizedPath.startsWith('/api/celestica/kanban/') && method === 'DELETE') {
        const cardId = decodeURIComponent(normalizedPath.split('/')[4]);
        database.prepare(`DELETE FROM itbp_kanban_cards WHERE id = ? OR card_code = ?`).run(cardId, cardId);
        return sendJson(res, 200, { status: 'ok', message: 'Card deleted' });
      }

      // GET /api/celestica/p6-activities
      if (normalizedPath === '/api/celestica/p6-activities' && method === 'GET') {
        const activities = database.prepare(`SELECT * FROM itbp_p6_activities ORDER BY activity_id ASC`).all();
        return sendJson(res, 200, {
          status: 'ok',
          summary: computeP6Summary(activities),
          data: activities
        });
      }

      // POST /api/celestica/p6-activities (Add new Primavera P6 WBS Activity)
      if (normalizedPath === '/api/celestica/p6-activities' && method === 'POST') {
        const body = await readJsonBody(req);
        const id = 'P6-' + Date.now().toString().slice(-6);
        const activityId = (body.activity_id || ('A' + Math.floor(1140 + Math.random() * 800))).trim();
        const wbsCode = body.wbs_code || '1.5';
        const wbsName = body.wbs_name || '1.5 Verification, J-SOX Audit & Bilingual UAT';
        const activityName = (body.activity_name || 'New P6 Engineering & Integration Task').trim();
        const origDur = parseInt(body.original_duration_days, 10) || 10;
        const pct = Math.min(100, Math.max(0, parseFloat(body.percent_complete) || 0));
        const remDur = body.remaining_duration_days !== undefined ? parseInt(body.remaining_duration_days, 10) : Math.round(origDur * (1 - pct / 100));
        const es = body.early_start || '2026-11-01';
        const ef = body.early_finish || '2026-11-14';
        const tf = body.total_float_days !== undefined ? parseInt(body.total_float_days, 10) : 0;
        const isCrit = tf <= 0 ? 1 : 0;
        const preds = body.predecessors || 'A1060';
        const resource = body.primary_resource || 'Aritut / LCB IT Team';
        const bac = parseFloat(body.bac_usd) || 65000;
        const pv = parseFloat(body.planned_value_usd) || Math.round(bac * (pct / 100));
        const ev = Math.round(bac * (pct / 100));
        const ac = parseFloat(body.actual_cost_usd) || ev;
        const status = pct >= 100 ? 'COMPLETED' : (pct > 0 ? 'IN_PROGRESS' : 'NOT_STARTED');

        database.prepare(`
          INSERT INTO itbp_p6_activities (
            id, project_id, wbs_code, wbs_name, activity_id, activity_name, activity_type,
            original_duration_days, remaining_duration_days, percent_complete,
            early_start, early_finish, late_start, late_finish,
            total_float_days, free_float_days, is_critical,
            predecessors, relationship_type, primary_resource, resource_role,
            planned_value_usd, earned_value_usd, actual_cost_usd, bac_usd, status, notes
          ) VALUES (?, 'PRJ-JP-2026-MES', ?, ?, ?, ?, 'Task Dependent', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'FS', ?, 'ITBP Specialist', ?, ?, ?, ?, ?, ?)
        `).run(
          id, wbsCode, wbsName, activityId, activityName,
          origDur, remDur, pct, es, ef, es, ef, tf, tf, isCrit, preds, resource,
          pv, ev, ac, bac, status, body.notes || 'Added via Primavera P6 EPPM Web Scheduler'
        );

        const all = database.prepare(`SELECT * FROM itbp_p6_activities ORDER BY activity_id ASC`).all();
        return sendJson(res, 201, {
          status: 'ok',
          summary: computeP6Summary(all),
          data: all
        });
      }

      // PUT /api/celestica/p6-activities/:id (Update P6 Activity % Complete, Remaining Duration, AC & Recalculate EVM)
      if (normalizedPath.startsWith('/api/celestica/p6-activities/') && (method === 'PUT' || method === 'POST')) {
        const actKey = decodeURIComponent(normalizedPath.split('/')[4]);
        const body = await readJsonBody(req);
        const existing = database.prepare(`SELECT * FROM itbp_p6_activities WHERE id = ? OR activity_id = ?`).get(actKey, actKey);
        if (!existing) {
          return sendJson(res, 404, { status: 'error', message: 'Primavera P6 Activity not found' });
        }

        const pct = body.percent_complete !== undefined ? Math.min(100, Math.max(0, parseFloat(body.percent_complete))) : existing.percent_complete;
        const remDur = body.remaining_duration_days !== undefined
          ? Math.max(0, parseInt(body.remaining_duration_days, 10))
          : Math.max(0, Math.round(existing.original_duration_days * (1 - pct / 100)));
        const tf = body.total_float_days !== undefined ? parseInt(body.total_float_days, 10) : existing.total_float_days;
        const isCrit = tf <= 0 ? 1 : 0;
        const ev = Math.round(existing.bac_usd * (pct / 100));
        const ac = body.actual_cost_usd !== undefined ? parseFloat(body.actual_cost_usd) : Math.round(ev * 0.96);
        const pv = pct >= 100 ? existing.bac_usd : Math.max(existing.planned_value_usd, ev);
        const status = pct >= 100 ? 'COMPLETED' : (pct > 0 ? 'IN_PROGRESS' : 'NOT_STARTED');

        database.prepare(`
          UPDATE itbp_p6_activities
          SET percent_complete = ?, remaining_duration_days = ?, total_float_days = ?, is_critical = ?,
              planned_value_usd = ?, earned_value_usd = ?, actual_cost_usd = ?, status = ?
          WHERE id = ?
        `).run(pct, remDur, tf, isCrit, pv, ev, ac, status, existing.id);

        database.prepare(`
          INSERT INTO itbp_integration_logs (connector_code, event_type, source_system, target_system, payload_summary, status_code, triggered_by)
          VALUES ('PRIMAVERA-P6-SERVICENOW', 'P6_CPM_EVM_UPDATE', 'Primavera P6 Scheduler', 'Global PMO & EVM Ledger', ?, 200, 'Aritut (Mgr, ITBP 2)')
        `).run(`Updated P6 Activity ${existing.activity_id} (${existing.activity_name.slice(0, 36)}...) -> ${pct}% Complete, EV=$${ev.toLocaleString()}`);

        const all = database.prepare(`SELECT * FROM itbp_p6_activities ORDER BY activity_id ASC`).all();
        return sendJson(res, 200, {
          status: 'ok',
          message: 'Primavera P6 Activity & EVM recalculated',
          summary: computeP6Summary(all),
          data: all
        });
      }

      // GET & POST /api/celestica/requirements (Design Thinking & BABOK RTM + WSJF)
      if (normalizedPath === '/api/celestica/requirements' && method === 'GET') {
        const reqs = database.prepare(`SELECT * FROM itbp_requirements ORDER BY wsjf_index DESC`).all();
        return sendJson(res, 200, { status: 'ok', data: reqs });
      }

      if (normalizedPath === '/api/celestica/requirements' && method === 'POST') {
        const body = await readJsonBody(req);
        const id = 'REQ-' + Date.now().toString().slice(-6);
        const reqCode = body.req_code || ('BRD-JP-0' + Math.floor(10 + Math.random() * 89));
        const uv = Math.min(10, Math.max(1, parseInt(body.user_business_value, 10) || 8));
        const tc = Math.min(10, Math.max(1, parseInt(body.time_criticality, 10) || 8));
        const rr = Math.min(10, Math.max(1, parseInt(body.risk_reduction, 10) || 8));
        const js = Math.min(10, Math.max(1, parseInt(body.job_size, 10) || 4));

        database.prepare(`
          INSERT INTO itbp_requirements (
            id, req_code, project_code, workshop_method, bu_department, stakeholder_jp,
            requirement_title, requirement_title_jp, business_need, technical_spec,
            user_business_value, time_criticality, risk_reduction, job_size,
            moscow_priority, verification_method, traceability_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          reqCode,
          body.project_code || 'CLS-ITBP-109',
          body.workshop_method || 'Design Thinking (5-Stage)',
          body.bu_department || 'Miyagi NPI & Laem Chabang Ops',
          body.stakeholder_jp || 'Hiroshi Watanabe (GM Miyagi)',
          body.requirement_title || 'New Bilingual Business Requirement',
          body.requirement_title_jp || '新規日タイ共通ビジネス要件定義',
          body.business_need || 'Improve operational efficiency and compliance across Japan and Thailand.',
          body.technical_spec || 'REST/OData API integration between SAP S/4HANA and Siemens Opcenter MES.',
          uv, tc, rr, js,
          body.moscow_priority || 'MUST_HAVE',
          body.verification_method || 'Bilingual UAT Playback & Automated SIT',
          body.traceability_status || 'APPROVED'
        );

        const reqs = database.prepare(`SELECT * FROM itbp_requirements ORDER BY wsjf_index DESC`).all();
        return sendJson(res, 201, { status: 'ok', message: 'Requirement logged & WSJF calculated', data: reqs });
      }

      // POST /api/celestica/cba-studies (Add new BPR & Financial CBA Study)
      if (normalizedPath === '/api/celestica/cba-studies' && method === 'POST') {
        const body = await readJsonBody(req);
        const id = 'CBA-' + Date.now().toString().slice(-6);
        const studyCode = body.study_code || ('CBA-2026-JP' + Math.floor(10 + Math.random() * 89));
        const capex = parseFloat(body.capex_usd) || 250000;
        const opex = parseFloat(body.annual_opex_usd) || 35000;
        const grossSavings = parseFloat(body.annual_gross_savings_usd) || 280000;
        const r = (parseFloat(body.discount_rate_percent) || 8.5) / 100;
        const netAnnualCashFlow = grossSavings - opex;
        let pvSum = 0;
        for (let t = 1; t <= 5; t++) {
          pvSum += netAnnualCashFlow / Math.pow(1 + r, t);
        }
        const npv = Math.round(pvSum - capex);
        const paybackMonths = netAnnualCashFlow > 0 ? +((capex / netAnnualCashFlow) * 12).toFixed(1) : 36.0;
        const roi = capex > 0 ? +(((netAnnualCashFlow * 5 - capex) / capex) * 100).toFixed(1) : 100.0;
        const irr = +Math.min(75, Math.max(12, ((netAnnualCashFlow / capex) * 100) * 0.62)).toFixed(1);

        database.prepare(`
          INSERT INTO itbp_cba_studies (
            id, study_code, initiative_name, target_site, functional_domain,
            as_is_process_desc, as_is_cycle_time_hrs, as_is_defect_dppm, as_is_oee_percent,
            to_be_process_desc, to_be_cycle_time_hrs, to_be_defect_dppm, to_be_oee_percent,
            capex_usd, annual_opex_usd, annual_gross_savings_usd, discount_rate_percent,
            npv_5yr_usd, irr_percent, roi_percent, payback_months, feasibility_rating, approval_ringi_no
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'HIGHLY_VIABLE', ?)
        `).run(
          id, studyCode,
          body.initiative_name || 'Process Automation & BPR Initiative',
          body.target_site || 'Miyagi Plant (CLS-MYG) & Laem Chabang (CLS-LCB)',
          body.functional_domain || 'Manufacturing & Supply Chain',
          body.as_is_process_desc || 'Manual legacy process requiring multi-sheet reconciliation.',
          parseFloat(body.as_is_cycle_time_hrs) || 36.0,
          parseInt(body.as_is_defect_dppm, 10) || 420,
          parseFloat(body.as_is_oee_percent) || 74.0,
          body.to_be_process_desc || 'Automated real-time integration with closed-loop validation.',
          parseFloat(body.to_be_cycle_time_hrs) || 4.5,
          parseInt(body.to_be_defect_dppm, 10) || 45,
          parseFloat(body.to_be_oee_percent) || 86.5,
          capex, opex, grossSavings, +(r * 100).toFixed(2),
          npv, irr, roi, paybackMonths,
          body.approval_ringi_no || ('RINGI-JP-2026-' + Math.floor(200 + Math.random() * 700))
        );

        const allCba = database.prepare(`SELECT * FROM itbp_cba_studies ORDER BY npv_5yr_usd DESC`).all();
        return sendJson(res, 201, { status: 'ok', message: 'CBA Study saved', data: allCba });
      }

      // POST /api/celestica/integrations/sync (Trigger Live Enterprise Integration Sync)
      if (normalizedPath === '/api/celestica/integrations/sync' && method === 'POST') {
        const body = await readJsonBody(req);
        const connectorCode = body.connector_code || 'SAP-S4-MES-BRIDGE';
        const conn = database.prepare(`SELECT * FROM itbp_integrations WHERE connector_code = ?`).get(connectorCode);

        const recordsDelta = Math.floor(25 + Math.random() * 140);
        const newLatency = Math.floor(15 + Math.random() * 65);
        if (conn) {
          database.prepare(`
            UPDATE itbp_integrations
            SET records_synced_today = records_synced_today + ?, latency_ms = ?, health_status = 'HEALTHY', last_sync_at = CURRENT_TIMESTAMP
            WHERE connector_code = ?
          `).run(recordsDelta, newLatency, connectorCode);
        }

        const summaryText = body.payload_summary || `Synced ${recordsDelta} records across ${connectorCode} (Latency: ${newLatency}ms) — Verified J-SOX & ISA-95 Schema`;
        database.prepare(`
          INSERT INTO itbp_integration_logs (connector_code, event_type, source_system, target_system, payload_summary, status_code, triggered_by)
          VALUES (?, ?, ?, ?, ?, 200, ?)
        `).run(
          connectorCode,
          body.event_type || 'MANUAL_SYNC_TRIGGER',
          body.source_system || (conn ? conn.system_name.split('<->')[0].trim() : 'SAP S/4HANA'),
          body.target_system || (conn ? (conn.system_name.split('<->')[1] || 'Opcenter MES').trim() : 'Siemens Opcenter MES'),
          summaryText,
          body.triggered_by || 'Aritut (Mgr, ITBP 2)'
        );

        const integrations = database.prepare(`SELECT * FROM itbp_integrations ORDER BY id ASC`).all();
        const logs = database.prepare(`SELECT * FROM itbp_integration_logs ORDER BY id DESC LIMIT 15`).all();
        return sendJson(res, 200, {
          status: 'ok',
          message: `Successfully synchronized ${connectorCode}`,
          integrations,
          integration_logs: logs
        });
      }

      return sendJson(res, 404, { status: 'error', message: `Celestica ITBP API endpoint not found: ${normalizedPath}` });
    } catch (err) {
      console.error('[CELESTICA API ERROR]', err);
      return sendJson(res, 500, { status: 'error', message: err.message });
    }
  })();

  return true;
}

module.exports = { handle, getDb };
