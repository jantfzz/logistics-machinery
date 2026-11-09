# Logistics & Machinery Management System

> Capstone project for the **Hacktiv8 Indonesia x IBM SkillsBuild** program, IBM Bob track.
> A clickable front-end simulation for managing project machinery and equipment end-to-end, built with IBM Bob through a 3-layer prompt.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript&logoColor=black)
![Built with IBM Bob](https://img.shields.io/badge/Built%20with-IBM%20Bob-0F62FE)

---

## Table of Contents

1. [Background & Problem](#background--problem)
2. [Target Users](#target-users)
3. [Features](#features)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Getting Started](#getting-started)
7. [Demo Scenario](#demo-scenario)
8. [Prompt Architecture (3-Layer Prompting)](#prompt-architecture-3-layer-prompting)
9. [Prompt Iteration](#prompt-iteration)
10. [Responsible AI](#responsible-ai)
11. [Roadmap](#roadmap)
12. [Acknowledgements](#acknowledgements)

---

## Background & Problem

In drilling and project-based companies, equipment requests, approvals, and handovers often run through WhatsApp, paper forms, and spreadsheets. This causes:

| Current condition | Business impact |
|---|---|
| Requests and approvals happen in chat or on paper | Hard to track, no proof of approval |
| Equipment location and condition are not monitored | Machines sit idle at one site while another site rents the same equipment |
| Handovers have no photo, hour meter, or checklist | No clear responsibility for damage during transit |
| Servicing happens only after breakdowns | High downtime and repair cost |
| Vendor, price, and spare-part data are scattered | Wrong parts purchased, prices not compared |
| Equipment cost per project is compiled manually | Project budget and Total Cost of Ownership (TCO) are hard to control |

This project simulates a single system that gives every unit a unique QR identity, moves it between warehouse and site through a digital workflow, and keeps it maintained on time.

## Target Users

| Role | What they do in the app |
|---|---|
| Project Manager (Site) | Request equipment for a project |
| Warehouse & Logistics | Check-out, check-in, QR labels, stock |
| Driver & Site Receiver | Sign digital delivery notes, verify condition on arrival |
| Workshop Mechanic | Handle work orders and preventive maintenance |
| Purchasing | Purchase requests, vendor quotations, purchase orders |
| Finance | Asset value, cost per project and per unit |
| HSE / QA | Inspection evidence for ISO 9000, HSE, and CSMS audits |
| Management & Admin | Dashboard, approvals, users, and master data |

## Features

- **Role-based login**: pick a role; menus and actions change per role.
- **Dashboard**: KPI cards, equipment status chart, utilization per project, top TCO units, and early warnings (service due, expiring certificates, critical spare-part stock).
- **Machinery & Equipment Database**: searchable, filterable list; detail page with specs, legal & financial data, movement history, maintenance history, and a printable QR label. Serial number is required and must be unique.
- **5-step Mobilization Workflow**: Site Request → Warehouse Check-out → Transit → Site Check-in → Return / Transfer, with checklist, hour meter, photo, digital signature, discrepancy notes, and a printable digital delivery note (Surat Jalan).
- **Maintenance**: preventive schedule, damage reports (Low / Medium / Critical), and a work order kanban with verification.
- **Spare Parts**: part master with minimum-stock alerts and part usage per work order.
- **Purchasing**: Purchase Request → vendor quotation comparison → Purchase Order → Goods Receipt.
- **Reports**: 6 reports (Stock, Condition, Out of Project, Into Project, Purchasing, Requirements) with filters and export.
- **Master Data & Import**: projects, warehouses, vendors, categories & units, users & approval, plus a CSV import screen with validation results.
- **Audit Trail & Notifications**: every status change is logged (who, when, old value, new value).
- **Mobile View**: simplified layout for field staff with bottom navigation and an offline queue indicator.

### Equipment status lifecycle

```
Ready ──► In Transit ──► In Use ──► (return / transfer) ──► Ready
  ▲                         │
  │                         ▼
  └── verified WO ◄── Under Maintenance ◄── Broken
                                              
Scrapped = removed from active assets (never hard-deleted)
```

### Business rules enforced in the UI

- Only units with status **Ready** can be assigned to a site request.
- Units that are **Under Maintenance**, **Broken**, or **Scrapped** cannot be mobilized.
- Check-out cannot be completed without QR scan, checklist, hour meter, photo, and driver signature.
- **In Use** is set only after a successful site check-in; condition differences require a discrepancy note.
- A Purchase Order can only be created from an approved Purchase Request.
- A work order closes only after verification; the unit then returns to **Ready**.
- Dates must be logical: out ≥ in, finished ≥ started, received ≥ PO date.
- Record time and update time are set automatically and are read-only.

## Tech Stack

- **HTML5, CSS3, vanilla JavaScript (ES6)**: no frameworks, no build tools, no CDN.
- **Hash-based routing** for a single-page experience (`#/dashboard`, `#/alat`, ...).
- **Dummy data in `data.js`**, with state persisted in `localStorage`.
- **Charts** drawn with pure CSS and inline SVG.
- **Optional:** Supabase (hosted PostgreSQL) through `config.js` and `db.js` using `fetch()` to the REST API, with `localStorage` kept as an offline fallback.

## Project Structure

```
.
├── index.html     # App shell and all screen containers
├── style.css      # Design tokens (CSS custom properties), layout, components, responsive rules
├── data.js        # Dummy data: projects, warehouses, vendors, units, parts, work orders, PR/PO
├── app.js         # Routing, state, rendering per screen, business rules, audit log
├── config.js      # (optional) Supabase URL and publishable key
├── db.js          # (optional) Data access layer for Supabase
└── README.md
```

## Getting Started

No installation needed.

```bash
git clone https://github.com/<username>/<repo-name>.git
cd <repo-name>
```

Then open `index.html` directly in a browser. Optionally, serve it locally:

```bash
# Python
python -m http.server 8000
# or VS Code: right-click index.html → "Open with Live Server"
```

To reset the demo, use the **Reset data demo** button, or clear the site's `localStorage`.

**Optional: Supabase mode.** Fill in `config.js` with your project URL and publishable (anon) key. Never put a secret or service-role key in front-end code.

## Demo Scenario

1. Log in as **PM Site** and request a generator set for a project.
2. Switch to **Management** and approve the request.
3. Switch to **Warehouse**: scan QR, fill the checklist and hour meter, add a photo, and capture the driver's signature. Status becomes **In Transit**.
4. Switch to **Site Receiver**: check in, compare condition, and run a running test. Status becomes **In Use**.
5. Report damage with **Critical** urgency. Status becomes **Broken**.
6. Switch to **Mechanic**: open and complete the work order, then verify it. Status returns to **Ready**.
7. Open the **Audit Log** to see every change recorded.

## Prompt Architecture (3-Layer Prompting)

The app was generated by IBM Bob from a structured prompt split into three layers, each answering a different question.

| Layer | Question it answers | Content |
|---|---|---|
| **1. Role & Context** | Who is Bob talking to, and in what context? | Bob acts as a senior frontend engineer; project name and purpose; user roles; tech constraints (HTML/CSS/vanilla JS, no frameworks or CDN, 4 separate files) |
| **2. Task & Requirements** | What exactly must be built? | 13 screens listed explicitly, the 5-step mobilization flow, business rules, and dummy data scope |
| **3. Constraints & Output** | How should the result look and work? | Color palette as CSS custom properties, status badge colors, design system, responsive breakpoints, WCAG AA accessibility, code standards, and output file list |

<details>
<summary>Prompt excerpt</summary>

```text
=== LAYER 1: ROLE & CONTEXT ===
Act as a senior frontend engineer building a clickable front-end simulation (prototype) of
a Logistics & Machinery Management System ...
Tech constraint: HTML5 + CSS3 + vanilla JavaScript (ES6) only. No frameworks, no build tools,
no external libraries or CDN, no backend. Separate files: index.html, style.css, data.js, app.js.

=== LAYER 2: TASK & REQUIREMENTS ===
Build a single-page app with hash routing containing these screens:
1. Login & role switcher ...
6. Kebutuhan & Mobilisasi: request list plus a 5-step stepper workflow ...
Business rules to enforce in the UI: ...

=== LAYER 3: CONSTRAINTS & OUTPUT ===
Colors (CSS custom properties): --primary-dark #2E4053, --accent-amber #F2A900, --teal #1F6F8B ...
Accessibility: WCAG AA contrast, semantic HTML, labels on all inputs ...
Output exactly 4 files: index.html, style.css, data.js, app.js ...
```

</details>

## Prompt Iteration

Prompting was treated as a cycle: **Draft prompt → Bob generates → Evaluate → Identify the gap → Revise one layer**. One problem in the output means revising one layer only, not rewriting the whole prompt.

| Problem in the output | Layer revised | Change made |
|---|---|---|
| Bob reached for a framework or CDN | Layer 1 | Restated "vanilla JS only, no CDN, exactly 4 files" |
| A broken unit could still be mobilized | Layer 2 | Added explicit business rules and the error message to show |
| Mobile layout broke at 375px | Layer 3 | Added bottom navigation and stacked-card tables for small screens |
| Output was cut off because it was too long | Process | Requested one file at a time ("Output only app.js, continue from screen 7") |

> Update this table with the actual revisions from your Bob sessions, including the initial vs. final version of each layer.

## Responsible AI

- **Human oversight:** business rules were defined by a person and checked against the output, rather than left for the AI to infer.
- **Privacy:** all data is fictional. No real personal names, customer data, or credentials are included.
- **Security:** only a publishable key may appear in front-end code; secrets stay out of the repository.
- **Scope honesty:** this is a front-end simulation for demo and user acceptance testing, not a production system.

## Roadmap

- Connect to a real backend and database with per-role access control and authentication.
- Android mobile app with real QR scanning and offline-first sync.
- GPS tracking for equipment in transit.
- Integration with the accounting system, vendor payments, and vendor performance evaluation.
- AI assistant for service-date prediction and buy / rent / relocate recommendations based on utilization data.

## Acknowledgements

Thanks to **Hacktiv8 Indonesia** and **IBM SkillsBuild** for the program, my mentor Kak Aruga, and fellow participants.

---

**Author:** Janeeta Faiza · Business Analyst
[LinkedIn](https://www.linkedin.com/in/janeeta-faiza) · [GitHub](https://github.com/jantfzz)
