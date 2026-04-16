# Facet CRM - User Guide

*A guide for the Facet Renovations team*

---

## Quick Start

### Logging In
1. Open your browser and go to the CRM URL (ask your admin)
2. Enter your email and password
3. Click **Sign In**

### Dashboard Overview
When you log in, you'll see:
- **Active Projects** - Projects currently in progress
- **Leads This Month** - New opportunities
- **Recent Activity** - What's been happening
- **Quick Actions** - Fast ways to add customers/projects

### Your Profile
Click your avatar/name in the top right → **Profile** to:
- Update your avatar
- Change your password
- Update contact info
- View your employee ID

### Notifications
Click the bell icon in the top navigation to see:
- Pings from other team members
- System notifications
- Unread message count

You can mark all as read or delete individual notifications.

---

## Navigation Overview

### Main Menu
- **Dashboard** - Overview stats and quick actions
- **Pipeline** - Visual kanban board of all projects by stage
- **Projects** - List view with filters and search
- **Customers** - Customer directory with detail pages
- **Products** - Product catalog management
- **Vendors** - Supplier and contractor directory
- **Commissions** - Commission tracking and reports
- **Subscriptions** - Facet Radiance subscription management
- **User Management** - (Admin only) Manage team members
- **Company Settings** - (Admin only) Configure markets, employee IDs, branding

---

## For Sales Team (Peter, Alex)

### Creating a New Lead
1. Click **Customers** in the sidebar
2. Click **+ New Customer**
3. Fill in:
   - First/Last Name
   - Phone and Email
   - Address (this will be the project address by default)
   - Where did they hear about us? (Referral Source)
4. Click **Save**
5. Now click **+ New Project** on their profile
6. Fill in project details and click **Create**

### Using the Pipeline View
The Pipeline page shows all projects organized by stage groups:

**Stage Groups:**
- **Prospect** (blue) - Lead → Appointment → Rehash → Contract Sent
- **Customer** (orange) - Contract Signed → Funding Cleared → Deal Scrub
- **Production** (purple) - Materials Ordered → Released → Received
- **Install** (green) - Contacted → In Progress → Hung → Complete
- **Completed** (green) - Funding Received

**Actions:**
- Click a group header to expand/collapse sub-stages
- Drag project cards between stages to update status
- Click any project card to open the detail page
- Use filters to show only your projects or specific markets

### Managing Your Pipeline (List View)
Go to **Projects** to see all your leads in list format.

**Statuses explained:**
| Status | What it means | What to do |
|--------|---------------|------------|
| Lead | New inquiry | Call within 5 minutes, qualify |
| Qualified | They're interested | Schedule design consultation |
| Design Scheduled | Appointment set | Prepare showroom materials |
| Contract Sent | Proposal delivered | Follow up in 24-48 hours |
| Contract Signed | We got the deal! | Send to production |
| In Production | Work happening | Monitor progress |
| Completed | Job done | Request review/referral |

### Adding Notes (Activity Feed)
On any project page:
1. Click **Add Note** in the Quick Actions
2. Type your note (e.g., "Spoke with Jane, wants to see quartz samples")
3. Click **Add Note**

**Pro tip:** The activity feed is shared with the whole team. Notes appear instantly for everyone viewing the project.

### Recording a Payment
1. Open the project
2. Click **Record Payment**
3. Enter:
   - Amount
   - Type (Deposit, Milestone, Monthly, Final)
   - Method (Cash, Check, Card, Financing)
4. Click **Record Payment**

The progress bar updates automatically. Everyone sees it update in real-time.

### Editing or Voiding Payments
Made a mistake? You can fix it:

**Edit a payment:**
1. Go to Payment History section
2. Click the edit icon on the payment
3. Update amount, type, or method
4. Enter a correction reason (required)
5. Save

**Void a payment:**
1. Go to Payment History section
2. Click the void icon on the payment
3. Enter void reason (e.g., "Check bounced")
4. Confirm

Both actions create audit entries in the activity feed.

### Tracking Milestones
Look at the **Payment Progress** bar. The system automatically checks off milestones:
- 25% - Design Deposit
- 50% - Materials Release  
- 75% - Production Start
- 100% - Final Payment

If a customer hits 47% paid, you'll see the Materials Release milestone is approaching.

### Customer Detail Page
Click any customer name to see their full profile:
- Contact information and address
- Complete project history
- Total revenue and outstanding balance
- Quick actions to create new projects

---

## For BDC (Appointment Setters)

### Your Job
Set appointments for the sales team and track where leads come from.

### Adding Referral Sources
When creating a customer, always fill in **Referral Source**:
- Website
- Facebook
- Google
- Referral (add who referred)
- Walk-in
- Previous Customer
- Other (be specific)

This helps us know what's working.

### Checking Commission
1. Go to **Commissions** in the sidebar
2. See your BDC commission (1% of closed deals)
3. Red badge = not yet paid
4. Green badge = paid

---

## For Production (Rich)

### Task Management
On any project:
1. Scroll to the **Tasks** section
2. Click **New Task** to add work items
3. Assign to contractors
4. Set due dates

**Task statuses:**
- **Pending** - Not started
- **In Progress** - Being worked on
- **Completed** - Done (automatically logs to activity)

### Checking Status Updates
The activity feed shows everything:
- When sales adds a note
- When contracts are signed
- When payments come in
- When customers call

All updates happen in real-time. No refresh needed.

### Change Orders
When customers request changes:
1. Open the project
2. Click **Change Order**
3. Describe what changed and why
4. Enter the amount (+ for upcharge, - for credit)
5. Click **Create Change Order**

This tracks the change and notifies everyone.

---

## For Contractors

### What You Can See
- Your assigned tasks
- Customer contact info
- Project address
- Special notes
- Payment status (so you know if it's safe to order materials)

### What You Can Do
- Mark tasks as complete
- View project details
- See payment status

### Marking Tasks Complete
1. Open the project
2. Find your task in the Tasks section
3. Check the checkbox
4. Done! It automatically logs completion time.

---

## For Admin

### Managing Users
Go to **User Management** in the sidebar to:
- Add new team members
- Edit user profiles and roles
- Assign users to markets and teams
- Activate/suspend/terminate accounts
- Reset passwords
- Generate employee IDs manually

**Employee IDs:**
The system can auto-generate employee IDs based on your company settings (e.g., IL-FRS0001 for Illinois Sales #1). You can also generate IDs manually by clicking the "Generate" button when editing a user.

**User Statuses:**
- **Active** - Can log in and use the system
- **Inactive** - Cannot log in (soft delete)
- **Suspended** - Temporarily blocked
- **Terminated** - Former employee, cannot log in

### Managing Markets
Go to **Company Settings → Markets** to:
- Add new markets (e.g., Illinois, Nebraska)
- Assign market codes (used in employee IDs)
- Set market managers
- Configure timezone and currency
- Set operating hours
- Configure market-specific branding

**Market Codes:**
Used in employee ID generation (e.g., "IL" for Illinois becomes IL-FRS0001).

### Managing Teams
Go to **Company Settings → Teams** to:
- Create teams (Sales, Production, Installers, etc.)
- Assign team leads
- Add/remove team members
- Configure lead assignment strategies:
  - **Round Robin** - Distribute leads evenly
  - **Least Active** - Give to person with fewest active leads
  - **Manual** - Manager assigns manually
- Set team goals (monthly revenue, deals)

### Commission Calculation
1. Open a completed project
2. Click **Calculate Commission**
3. Select:
   - Sales rep(s) who worked the deal
   - Split percentage (if multiple reps)
   - Flat rate vs percentage (check user profile)
4. System calculates automatically

**Commission Rules:**
- Sales: 10% of contract OR $400 flat (per-user setting)
- BDC: 1% of contract
- Admin: 2-3% (owner vs standard)

### Paying Commissions
1. Go to **Commissions** page
2. Find the person and click **Pay** next to their commission
3. Or use **Bulk Pay** to pay multiple commissions at once
4. Confirm payment date

### Running Reports
Commissions page shows:
- Total commissions by period
- Paid vs unpaid
- Breakdown by person

---

## FAQ

### Why isn't my payment showing?
Refresh the page. If it's still not there, check you clicked **Record Payment** and got a success message.

### Can I edit a note after posting?
No — the activity feed is permanent. Add a correction as a new note if needed.

### What if a customer calls about a different project?
Create a **Service** or **Warranty** project type under their customer record. Keep it separate from the original renovation.

### How do I know if a payment plan customer is ready for materials?
Check the Payment Progress bar. At 50% paid = Materials Release milestone cleared.

### Can I use this on my phone?
Yes — it's mobile-responsive. The site works on phones and tablets.

### What if two people edit at the same time?
Last save wins. The activity feed updates in real-time so you'll see changes as they happen.

### How do I find an old project?
Use the search bar on the Projects page. Search by:
- Customer name
- Project number (e.g., PR26030001)
- Project title

### What's the difference between Product and Service types?
- **Products** - Physical items (vanities, tile)
- **Services** - Labor (installation, design)
- **Packages** - Bundled deals
- **Retail** - Refinery store items

### Where do I add new products?
**Products** in the sidebar (if you have access). Add with variants for sizes/colors.

### What are "Spiffs"?
Bonuses for specific achievements ("First $50k month", "5-star review", etc.). Admin can add these.

### How do I fix a payment mistake?
Go to the Payment History section on the project, click edit or void, and enter a reason. The system keeps an audit trail.

### What's my employee ID?
Check your **Profile** page. If auto-generation is enabled, you'll see it there (e.g., IL-FRS0001).

### How do markets work?
Markets represent geographic regions (e.g., Illinois, New England). Users are assigned to markets, and projects can be filtered by market. Employee IDs include market codes.

### What's the difference between teams and markets?
- **Markets** = Geographic regions (Illinois, Nebraska)
- **Teams** = Functional groups within markets (Northside Sales, Install Crew A)

### Can a user be in multiple teams?
Yes! Users can belong to multiple teams and have access to multiple markets (for managers).

---

## Tips & Best Practices

### Activity Feed = Your Friend
The feed is the replacement for LEAP's "notes that disappear." Everything lives here:
- Customer calls
- Status changes
- Task completions
- Payments

**Good notes:**
- ✅ "Called Jane 3/27 - wants to reschedule design appt to Friday"
- ✅ "Customer prefers email over calls"
- ✅ "Has dog, needs 24hr notice before visits"

**Bad notes:**
- ❌ "Called" (what about?)
- ❌ "Done" (what's done?)

### Keep Statuses Updated
- Move to **Qualified** after first real conversation
- Move to **Contract Sent** when proposal delivered
- Move to **In Production** when work starts
- Never leave something in **Lead** for weeks

### Payment Tracking
- Always record payments the same day received
- Note unusual payment methods in the Notes field
- For payment plans, check milestone progress weekly

### Mobile Usage
Contractors: Save the CRM as a home screen bookmark for quick access on job sites.

### Pipeline View Tips
- Use the Pipeline view for a quick visual status of all projects
- Drag cards to update status quickly
- Click group headers to focus on specific stages
- Use filters to see only your projects or specific markets

---

## Troubleshooting

### Can't log in
- Check caps lock
- Try password reset (ask admin)
- Clear browser cache

### Page won't load
- Check your internet connection
- Try Chrome or Firefox (avoid Safari quirks)
- Ask if server is down

### Data looks wrong
- Refresh the page
- Check you're on the right project
- Ask in team chat before editing

### Socket disconnected (real-time not working)
- Yellow indicator = reconnecting automatically
- Red = refresh page
- Check browser console for errors (F12)

### Payment edit/void not working
- Make sure you're an admin or the payment recorder
- Check that the payment hasn't already been voided
- Verify you entered a reason (required)

### Employee ID not generating
- Check that Company Settings has employee ID generation enabled
- Verify the user has a market assigned
- Verify the user has at least one role selected
- Check that market codes are configured in Company Settings

---

## Contact

**For technical issues:** Ask admin or check the GitHub repo  
**For process questions:** Ask Peter/Rich

---

*Remember: This is replacing LEAP and SalesPro. If something feels wrong or missing, speak up — we can improve it.*

---

*Last Updated: 2026-04-13*

## Changelog

### April 13, 2026
- **User Management Page**: New admin-only page for managing team members
  - Add/edit users with full profile information
  - Assign users to markets and teams
  - Generate employee IDs manually
  - Filter users by status, role, and search
  - View user details in a clean card layout
- **Pipeline Page Updates**: 
  - Added market filtering for multi-market organizations
  - Added contractor filtering to see contractor assignments
  - Added date range filters (Today, This Week, This Month, Overdue)
  - Task statistics now show in project cards (total/completed/pending)
- **Project Detail Page Updates**:
  - Added contractor assignment section
  - Enhanced task management with contractor-specific assignments
  - Improved payment history with edit/void capabilities
  - Better activity feed with status change tracking
- **Company Settings**: New markets management for multi-market support
- **Employee IDs**: Auto-generation based on market and role codes
- **Teams**: Support for team-based organization with lead assignment strategies
