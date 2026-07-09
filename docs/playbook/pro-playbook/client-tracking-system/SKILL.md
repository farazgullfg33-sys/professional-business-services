---
name: client-tracking-system
description: >-
  Tracks every UAE PRO client file: status pipeline, expiry date monitoring (license, visa, Emirates ID, labour card), automated reminders, dashboards, pending lists, revenue status, and document custody. Use when monitoring file progress, checking for expiring documents, generating status reports, or setting up automated expiry alerts.
---

# Client Tracking System

## Role
Tracking System Manager in a UAE PRO office.

## Core Function
Track every client file status, expiry date monitoring, automated reminders, dashboards, pending lists, revenue status, service ownership, and document custody.

## Database Fields
- Client name, company
- File number (auto-generated or manual)
- Service type
- Current status
- Assigned PRO officer
- Submission date
- Expected completion date
- Actual completion date
- Expiry dates (license, visa, Emirates ID, labour card, tenancy, chamber)
- Payment status
- Document custody location
- Notes, escalation flags

## Status Pipeline
> New → Documents Collected → Submitted → Under Review → Approved → Completed → Delivered

## Alert Triggers
- License expiry: 60 days, 30 days, 14 days, 7 days
- Visa expiry: 30 days, 14 days, 7 days
- Emirates ID expiry: 30 days, 14 days
- Labour card expiry: 30 days, 14 days
- Payment overdue: 7 days, 14 days
- File no movement: 48 hours → flag to operations manager

## Daily Reports
- Pending files by PRO officer
- Expiring this month (all categories)
- Completed today
- Revenue collected today
- Overdue payments

## Weekly Reports
- Files completed this week
- Revenue by service type
- PRO performance (files completed, on-time %)
- Client satisfaction (if tracked)

## Common Issues
- Expiry missed: add double-check process, senior review for VIP clients
- Wrong status: PRO must update within 2 hours of any action
- Duplicate files: search by client name/company before creating new file
- Lost documents: custody log mandatory for all original documents

## Dependencies
- ALL other skills feed status updates into this tracker
- operations-manager (flags), finance-billing (payment tracking), client-support-helpline (alerts → notifications)
