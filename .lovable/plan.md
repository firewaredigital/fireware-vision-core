

# Fireware CRM — Sales Module Implementation Plan

## Vision
Build a complete **B2B Sales CRM** with enterprise-grade features, designed for large sales organizations (20+ reps). This module will establish the **Customer 360 foundation** and unified timeline that will later power all Fireware modules.

---

## Brand Identity
- **Primary**: Fireware Red `#FF0000` and White `#FFFFFF`
- **UI**: Modern corporate design with neutral grays
- **Layout**: Sidebar navigation + topbar + main workspace

---

## Core Architecture

### Database Foundation (Supabase)
- **Multi-tenant structure**: Organizations → Teams → Users
- **Core tables**: Accounts, Contacts, Leads, Opportunities, Activities
- **Advanced tables**: Quotes, Products, Territories, Forecasts, Cadences
- **Timeline events** table for Customer 360 view
- **Simple auth** with email/password (enterprise security added later)

---

## Features to Build

### 1. Dashboard & Navigation
- Executive dashboard with pipeline metrics, forecast summary, top deals
- Global search across all entities
- Sidebar with module navigation
- Quick-create buttons for leads, accounts, opportunities

### 2. Lead Management (Complete)
- **Lead capture**: Manual creation, CSV import
- **Lead list**: Sortable, filterable table with saved views
- **Lead detail**: Full profile, activities, notes, attachments
- **Lead scoring**: Configurable scoring rules
- **Deduplication**: Detect and merge duplicate leads
- **Lead routing**: Round-robin assignment, territory-based rules
- **Conversion wizard**: Lead → Account + Contact + Opportunity

### 3. Accounts & Contacts
- **Account hierarchy**: Matrix/subsidiary relationships
- **Contact roles**: Decision maker, technical, financial, influencer
- **Account detail page** with Customer 360 view
- **Unified Timeline**: All interactions across sales, (future: service, marketing)
- **Territory assignment**: Link accounts to territories/owners

### 4. Opportunity Management (Enterprise-Grade)
- **Pipeline Kanban** with customizable stages
- **Pipeline list view** with advanced filters
- **Opportunity detail**: Full deal information, probability, close date
- **Stakeholder management**: Multiple contacts per deal with roles
- **Activity tracking**: Calls, meetings, emails, notes
- **Stage rules**: Required fields per stage, probability mapping
- **Win/Loss reasons**: Standardized picklist with reporting

### 5. Quotes & Proposals
- **Product catalog**: Items available for quoting
- **Quote builder**: Add products, quantities, discounts
- **Pricing rules**: List price, volume discounts, custom pricing
- **Quote versioning**: Track revisions
- **Quote PDF generation** (basic template)
- **Quote approval workflow**: Manager approval for discounts above threshold

### 6. Territories & Routing
- **Territory definitions**: By region, industry, account size
- **Assignment rules**: Auto-assign leads/accounts to territories
- **Territory hierarchy**: Regions → Sub-regions → Reps
- **Owner transfer** with history tracking

### 7. Sales Cadences
- **Cadence builder**: Define sequences of touchpoints
- **Step types**: Email, call, LinkedIn, task
- **Enrollment**: Add leads/contacts to cadences
- **Progress tracking**: See cadence status per lead
- **Alerts**: Overdue tasks, stalled cadences

### 8. Forecast & Targets
- **Forecast periods**: Monthly/quarterly
- **Forecast categories**: Commit, best case, pipeline
- **Rep-level forecast entry**: Update deal projections
- **Manager rollup view**: Aggregate by team
- **Target setting**: Define quotas per rep/team
- **Forecast vs. Actual**: Variance tracking dashboard

### 9. Reports & Analytics
- **Pipeline report**: Value by stage, by owner, by period
- **Conversion funnel**: Lead → Opportunity → Won rates
- **Activity metrics**: Calls made, meetings held, emails sent
- **Win/loss analysis**: Reasons, competitors, cycle time
- **Forecast accuracy**: Predicted vs. closed comparison

### 10. Customer 360 Profile
- **Unified customer page** showing:
  - Company/contact information
  - All related leads, opportunities, quotes
  - Complete activity timeline (chronological)
  - Notes and attachments
  - Key metrics (lifetime value, open deals, last contact)

---

## Technical Implementation

### Backend (Supabase Cloud)
- PostgreSQL database with proper relationships
- Row-Level Security for data isolation
- Edge functions for complex operations (cadence engine, scoring)
- File storage for attachments and documents

### Frontend (React + TypeScript)
- Responsive, modern UI using Tailwind CSS and shadcn/ui
- Kanban board for pipeline visualization
- Data tables with sorting, filtering, pagination
- Forms with validation (zod)
- Toast notifications for feedback

---

## Pages to Build

1. **Login/Register** — Simple email/password auth
2. **Dashboard** — Executive overview with metrics
3. **Leads** — List + Detail + Create/Edit + Convert
4. **Accounts** — List + Detail (with Customer 360)
5. **Contacts** — List + Detail
6. **Opportunities** — Kanban + List + Detail + Create/Edit
7. **Quotes** — List + Builder + Detail
8. **Products** — Catalog management
9. **Territories** — Configuration and assignment
10. **Cadences** — Builder + Enrollment + Tracking
11. **Forecast** — Entry + Rollup views
12. **Reports** — Pre-built dashboards
13. **Settings** — Stages, reasons, team config

---

## Expansion Path (Future Modules)
This foundation will enable adding:
- **Fireware Service** — Ticketing connected to accounts/contacts
- **Fireware Marketing** — Campaigns connected to leads
- **Fireware Commerce** — Orders connected to accounts
- **Enhanced Governance** — RBAC, audit logs, LGPD compliance

---

## Summary
This plan delivers a **fully-functional B2B Sales CRM** with:
- ✅ Complete Lead-to-Opportunity-to-Quote workflow
- ✅ Customer 360 with unified timeline
- ✅ Enterprise features (territories, forecasting, cadences)
- ✅ Modern UI with Fireware branding
- ✅ Foundation for future module expansion

