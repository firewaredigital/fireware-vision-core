

# Fireware CRM - Gap Analysis and Implementation Roadmap

## Current State Summary

The project has established a solid **foundation** for the Fireware Sales module, but most features are skeleton pages without functional implementation.

### What EXISTS Today

**Database (Complete)**
- Multi-tenant architecture: `organizations` -> `teams` -> `profiles`
- All 20+ tables for Sales module (leads, accounts, contacts, opportunities, quotes, products, cadences, forecasts, etc.)
- Row-Level Security policies for all tables
- Helper functions (`is_member_of_org`, `has_role`, etc.)
- Triggers for auto-updating timestamps and timeline events

**Frontend (Partial)**
- Authentication page (login/signup working)
- Dashboard with mock data and charts
- App layout with sidebar and topbar
- Leads: Full list with CRUD, detail page, form
- Accounts: List with CRUD basics
- All other pages: Empty skeleton stubs

---

## What NEEDS to be Implemented

### Priority 1: Core Sales Functionality (Critical)

#### 1.1 Opportunities - Kanban Pipeline
**Status**: Stub only (no functionality)
**Needs**:
- Kanban board with drag-and-drop stages
- Opportunity list view with filters
- Opportunity detail page with:
  - Basic info editing
  - Stakeholder management (link multiple contacts)
  - Activity history
  - Timeline integration
- Opportunity form (create/edit)
- Win/loss reason selection on close

#### 1.2 Quotes & Proposals Builder
**Status**: Stub only
**Needs**:
- Quote list with status filtering
- Quote builder interface:
  - Product selection from catalog
  - Line item management (add, remove, reorder)
  - Quantity and pricing
  - Discount application
  - Auto-calculation of totals
- Quote detail view
- Quote status workflow (draft -> sent -> accepted/rejected)
- Basic PDF generation

#### 1.3 Lead Conversion Wizard
**Status**: Missing
**Needs**:
- Modal/page for converting leads
- Duplicate checking before conversion
- Create Account + Contact + Opportunity in one flow
- Transfer activities/notes to new records
- Update lead status to "converted"

#### 1.4 Products & Pricing
**Status**: Stub only
**Needs**:
- Product list with search
- Product form (CRUD)
- Price list management
- Price list items per product

---

### Priority 2: Activity & Communication Tracking

#### 2.1 Activities Management
**Status**: Database exists, no UI
**Needs**:
- Activities list page
- Activity form (call, email, meeting, task)
- Activity widget on Lead/Account/Contact/Opportunity detail pages
- Due date tracking
- Mark as complete functionality

#### 2.2 Notes System
**Status**: Database exists, no UI
**Needs**:
- Notes component for detail pages
- Add/edit/delete notes
- Pin important notes

---

### Priority 3: Sales Management Features

#### 3.1 Territories Management
**Status**: Stub only
**Needs**:
- Territory list with hierarchy
- Territory form (create/edit)
- Assign accounts/leads to territories
- Territory owner assignment

#### 3.2 Cadences Builder
**Status**: Stub only
**Needs**:
- Cadence list page
- Cadence builder:
  - Add/edit/delete steps
  - Step types: email, call, LinkedIn, task
  - Delay configuration between steps
- Enrollment management:
  - Enroll leads/contacts
  - Track progress
  - View next step due
- Pause/resume enrollments

#### 3.3 Forecast & Targets
**Status**: Stub only
**Needs**:
- Forecast entry form (by period)
- Forecast categories: commit, best case, pipeline
- Target setting per user
- Manager rollup view (aggregate team forecasts)
- Forecast vs. actual comparison

---

### Priority 4: Customer 360 & Timeline

#### 4.1 Unified Customer Timeline
**Status**: Database ready (`timeline_events`), no UI
**Needs**:
- Timeline component showing all events chronologically
- Event types: lead created, opportunity stage changed, quote sent, activity completed, etc.
- Filter by event type
- Display on Account, Contact, and Opportunity detail pages

#### 4.2 Account Detail Enhancement (Customer 360)
**Status**: Basic only
**Needs**:
- Company overview section
- Related contacts list
- Related opportunities list
- Related quotes list
- Unified timeline
- Key metrics (lifetime value, open deals, last contact)

---

### Priority 5: Configuration & Administration

#### 5.1 Settings Page - Pipeline Stages
**Status**: Stub
**Needs**:
- List customizable opportunity stages
- Reorder stages
- Set probability per stage
- Mark stages as closed/won

#### 5.2 Settings - Win/Loss Reasons
**Status**: Database exists, no UI
**Needs**:
- Manage win reasons
- Manage loss reasons
- Enable/disable reasons

#### 5.3 Settings - Lead Sources
**Status**: Database exists, no UI
**Needs**:
- Manage lead source options
- Enable/disable sources

#### 5.4 Team Management
**Status**: Database exists, no UI
**Needs**:
- List team members
- Assign roles (user, manager, admin)
- Assign to teams

---

### Priority 6: Data Operations

#### 6.1 CSV Import
**Status**: Button exists, no functionality
**Needs**:
- File upload for leads/accounts/contacts
- Column mapping interface
- Validation with error display
- Preview before import
- Basic deduplication check

#### 6.2 CSV Export
**Status**: Button exists, no functionality
**Needs**:
- Export filtered lists to CSV
- Select columns to export

#### 6.3 Dashboard with Real Data
**Status**: Currently mock data
**Needs**:
- Fetch actual pipeline data from database
- Calculate real KPIs (total pipeline, won deals, activities)
- Real-time updates

---

### Priority 7: Advanced Features (Phase 2)

#### 7.1 Global Search
**Needs**: Search across leads, accounts, contacts, opportunities, quotes

#### 7.2 Audit Logs
**Needs**: Table for tracking all changes, viewer in Settings

#### 7.3 Approval Workflows
**Needs**: Quote approval for discounts above threshold

#### 7.4 File Attachments
**Needs**: Storage bucket, attach files to records

#### 7.5 Reports Page
**Needs**: Pre-built reports (pipeline, conversion, activities)

---

## Implementation Order Recommendation

```text
Phase 1 - Core Sales (2-3 weeks)
  ├── Opportunities Kanban + CRUD
  ├── Account Detail + Customer 360 Timeline
  ├── Activities on detail pages
  └── Dashboard with real data

Phase 2 - Quotes & Products (1-2 weeks)
  ├── Products CRUD
  ├── Quote Builder
  └── Quote PDF generation

Phase 3 - Lead Enhancement (1 week)
  ├── Lead Conversion Wizard
  ├── CSV Import
  └── Deduplication check

Phase 4 - Sales Management (1-2 weeks)
  ├── Territories management
  ├── Cadences builder
  └── Forecast entry

Phase 5 - Administration (1 week)
  ├── Settings - Pipeline stages
  ├── Settings - Win/loss reasons
  ├── Settings - Lead sources
  └── Team management

Phase 6 - Advanced (2+ weeks)
  ├── Global search
  ├── Reports
  ├── Approval workflows
  └── Audit logs
```

---

## Technical Notes

- All database tables are ready with proper RLS
- New profiles lack organization_id (need onboarding flow to create/join org)
- Timeline events trigger exists for opportunities (extend for other entities)
- Quote totals trigger is ready (will auto-calculate when items change)

---

## Summary

| Area | Database | UI | Status |
|------|----------|-----|--------|
| Auth | Done | Done | Complete |
| Leads | Done | Done | Complete |
| Accounts | Done | Partial | Needs Customer 360 |
| Contacts | Done | Stub | Needs CRUD |
| Opportunities | Done | Stub | Critical gap |
| Quotes | Done | Stub | Critical gap |
| Products | Done | Stub | Needs CRUD |
| Activities | Done | None | Needs UI |
| Territories | Done | Stub | Needs UI |
| Cadences | Done | Stub | Needs builder |
| Forecast | Done | Stub | Needs entry/rollup |
| Timeline | Done | None | Needs component |
| Settings | Done | Stub | Needs config UI |

**Bottom line**: The database foundation is solid. The main gaps are on the frontend, particularly the **Opportunities Kanban**, **Quote Builder**, and **Customer 360 Timeline** - these are the critical features needed to make the CRM functional for real sales workflows.

