# คู่มือระบบและแผนแม่บทเทคโนโลยี (System Architecture & Operational Playbook)
## ตำแหน่ง: Manager, IT Business Partner 2 (Req ID: 133553 • Band 10)
### Celestica (Thailand) Limited (Laem Chabang, Chonburi) & Celestica Japan K.K. (Miyagi / Tokyo)

---

## 1. บริบททางธุรกิจจริง (Verified Real Business Domain Context)

- **Celestica Inc. (สำนักงานใหญ่ระดับโลก):** ตั้งอยู่ที่ 5140 Yonge Street, Suite 1900, Toronto, Ontario, Canada เป็นผู้นำระดับโลกด้านบริการออกแบบ วิศวกรรม และการผลิตอิเล็กทรอนิกส์ครบวงจร (EMS / ODM) แบ่งเป็น 2 กลุ่มธุรกิจหลัก คือ **ATS (Advanced Technology Solutions)** ได้แก่ Aerospace & Defense, Industrial, HealthTech, Capital Equipment และ **CCS (Connectivity & Cloud Solutions)** ได้แก่ Enterprise Server, Hyperscale Cloud และ Optical Communications (800G/1.6T)
- **Celestica (Thailand) Limited (CLS-LCB — ฐานปฏิบัติการหลักของตำแหน่งนี้):** ตั้งอยู่ที่ **49/18 หมู่ 5 นิคมอุตสาหกรรมแหลมฉบัง ตำบลทุ่งสุขลา อำเภอศรีราชา จังหวัดชลบุรี 20230** เป็นฐานการผลิตขนาดใหญ่ระดับยุทธศาสตร์ รองรับการผลิตแผ่นวงจรพิมพ์ (PCBA / SMT), การประกอบระบบขั้นสูง (High-Level Assembly / Box-Build), ศูนย์วิศวกรรมและไอทีระดับภูมิภาค (Regional IT & Engineering Hub) และห้องปฏิบัติการวิเคราะห์ความเสียหาย (Failure Analysis Laboratory)
- **Celestica Japan K.K. (セレスティカ・ジャパン株式会社 — หน่วยธุรกิจคู่ค้าหลัก):**
  1. **โรงงาน Miyagi Manufacturing & NPI Center of Excellence (CLS-MYG):** ตั้งอยู่ที่ 2 Aza-Raijin Yoshioka, Taiwa-cho, Kurokawa-gun, Miyagi 981-3681 (ใกล้เมืองเซนได จ.มิยากิ) เป็นศูนย์ความเป็นเลิศด้านการแนะนำผลิตภัณฑ์ใหม่ (NPI), DFM/DFT, การผลิตอุปกรณ์สื่อสารด้วยแสงและเครื่องจักรอุตสาหกรรมความละเอียดสูง รวมถึงเป็นศูนย์ฝึกอบรมมาตรฐาน IPC อย่างเป็นทางการ
  2. **สำนักงาน Tokyo Corporate & Commercial Office (CLS-TYO):** เขตมินาโตะ / ฮิโนะ กรุงโตเกียว ดูแลความสัมพันธ์กับลูกค้ากลุ่ม OEM ชั้นนำของญี่ปุ่น งานซัพพลายเชน และบริการหลังการขาย (After-Market Repair & ITAD)

---

## 2. ทฤษฎีและมาตรฐานระดับสากลที่นำมาใช้ในระบบ (Theoretical & Enterprise Frameworks)

1. **BRM Institute Framework (Business Relationship Management — Level 5 Strategic Partner):**
   - เชื่อมโยงกลยุทธ์ธุรกิจของ Celestica Japan เข้ากับ Global IT Roadmap ผสานกระบวนการเห็นชอบล่วงหน้าแบบญี่ปุ่น (**Nemawashi 根回し**) และเอกสารขออนุมัติงบลงทุน (**Ringi-sho 稟議書**) เข้ากับ Global PMO Governance
2. **Stanford d.school Design Thinking (5-Stage) & IIBA BABOK v3:**
   - กระบวนการทำ Workshop เก็บความต้องการกับ Subject Matter Experts (SMEs) ทั้ง 5 ขั้นตอน: *Empathize (Gemba Walk) $\rightarrow$ Define (SIPOC / 5-Whys) $\rightarrow$ Ideate $\rightarrow$ Prototype $\rightarrow$ Test (Bilingual UAT)*
   - จัดทำตาราง **Requirements Traceability Matrix (RTM)** เชื่อมโยง Business Need (JP/EN) สู่ Technical Specification และวิธีทดสอบ
3. **SAFe Agile WSJF (Weighted Shortest Job First) Prioritization:**
   - ใช้คัดกรองและจัดลำดับความสำคัญของ Requirements เมื่อมีข้อจำกัดด้านงบประมาณหรือทรัพยากรทีม IT:
     $$\text{WSJF} = \frac{\text{User-Business Value} + \text{Time Criticality} + \text{Risk Reduction / Opportunity Enablement}}{\text{Job Size (IT Effort)}}$$
4. **BPR (Business Process Re-engineering — Hammer & Champy) & Lean Six Sigma DMAIC:**
   - วิเคราะห์กระบวนการผลิตและซัพพลายเชนแบบ **As-Is vs. To-Be (BPMN 2.0)** เพื่อลด Cycle Time, ลดอัตราของเสีย (DPPM) และเพิ่มประสิทธิผลโดยรวมของเครื่องจักร (**OEE = Availability $\times$ Performance $\times$ Quality**)
5. **Financial Feasibility Study & 5-Year Cost-Benefit Analysis (CBA):**
   - ประเมินความคุ้มค่าทางการเงินด้วย **Net Present Value (NPV)**, **Internal Rate of Return (IRR)**, **Return on Investment (ROI)**, **Total Cost of Ownership (5-Yr TCO)** และ **Payback Period**
6. **Multi-Criteria Decision Analysis (MCDA) สำหรับประเมิน Hardware/Software & Vendor SOW Governance:**
   - ประเมินคัดเลือกเทคโนโลยีอย่างเป็นภววิสัย (Functional Fit 35%, SAP/MES Compatibility 25%, Cybersecurity & J-SOX 20%, 5-Yr TCO 20%) พร้อมบริหารสัญญา **Statement of Work (SOW)** และกลไกการ Escalate ปัญหาร่วมกับ PMO
7. **Oracle Primavera P6 EPPM — Critical Path Method (CPM) & Earned Value Management (EVM):**
   - บริหารตารางเวลาโครงการด้วยโครงสร้าง **EPS / WBS**, คำนวณวันเริ่ม/เสร็จเร็วสุด-ช้าสุด ($ES, EF, LS, LF$), **Total Float ($TF = 0$ คือ Critical Path)** และควบคุมงบประมาณ/เวลาด้วยดัชนี **SPI ($EV/PV$)** และ **CPI ($EV/AC$)**
8. **ISA-95 / Purdue Enterprise Integration Reference Model:**
   - เชื่อมโยงระบบระดับที่ 4 (**SAP S/4HANA ERP**, **Kinaxis RapidResponse APS**, **Oracle Primavera P6**) เข้ากับระดับที่ 3 (**Siemens Opcenter Execution Electronics MES**, **Valor NPI**) และระดับที่ 2 (**Fuji NXT / Panasonic NPM SMT Lines** ผ่านโปรโตคอล **SECS/GEM** และ **IPC-CFX**)

---

## 3. โครงสร้างไฟล์ของระบบ (System Inventory)

| ชื่อไฟล์ | หน้าที่และรายละเอียด |
|---|---|
| `celestica_portal.html` | หน้าเว็บแอปพลิเคชันหลัก Responsive HTML5 + Tailwind + Chart.js ครบ 7 โมดูล พร้อมบอร์ด Trello Drag-and-Drop และ Primavera P6 |
| `celestica_handler.js` | โมดูล REST API Backend เชื่อมต่อฐานข้อมูล SQLite (`node:sqlite` WAL Mode) รองรับทั้งการรันบน Cloud (Vercel/Render) และ Local |
| `celestica_db_init.js` | สคริปต์สร้างตาราง SQLite 7 ตาราง พร้อม Seed ข้อมูลจริงของ Celestica Japan (Miyagi/Tokyo) และ Thailand (Laem Chabang) |
| `celestica_server.js` | เซิร์ฟเวอร์แบบ Standalone สำหรับรันแยกพอร์ต (`http://localhost:3040/celestica`) |
| `start_celestica_itbp.bat` | ไฟล์ดับเบิลคลิกเปิดใช้งานระบบทันทีบน Windows |
| `celestica_doc_charter_cba.html` | **เอกสาร A4 ฉบับที่ 1:** รายงานการศึกษาความเป็นไปได้ การรื้อปรับระบบ (BPR) และการวิเคราะห์ความคุ้มค่า 5 ปี (CBA & Ringi-sho) |
| `celestica_doc_sow_vmp.html` | **เอกสาร A4 ฉบับที่ 2:** สัญญาขอบเขตงาน Vendor SOW, เกณฑ์ SLA & Escalation และตาราง BABOK RTM + WSJF 2 ภาษา |
| `celestica_doc_p6_pmo.html` | **เอกสาร A4 ฉบับที่ 3:** ตารางแผนงานแม่บท Oracle Primavera P6 (CPM / EVM) และคู่มือขั้นตอนการปฏิบัติงาน (How-To SOP) |
