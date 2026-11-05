# TailorSync & WashFlow Management System

Full-stack bespoke tailoring & laundry management platform with multi-tenant business dashboards, role-based access control, customer measurements, order workflows, and real-time ledger accounting.

## Production Backend Deployment
- Backend API Host: `https://fash-laund.ai.studio`
- Database: Managed PostgreSQL (Google Cloud SQL)

## Vercel Proxy / Domain Configuration
A `vercel.json` file is included at the project root to forward all requests and `/api/*` endpoints to the active cloud backend (`https://fash-laund.ai.studio`).
