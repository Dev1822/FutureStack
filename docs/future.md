# FutureTracker - Future Updates Roadmap

> This document tracks planned features, improvements, and technical debt for future releases.

---

## 🔧 Technical Improvements

### 🚨 CRITICAL: Fix Permissive RLS Policy
**Current Issue**: The `opportunities` table has a world-readable SELECT policy:
```sql
CREATE POLICY "Allow realtime subscriptions" ON opportunities FOR SELECT USING (true);
```

**Security Risk**: Anyone with the public `REACT_APP_SUPABASE_ANON_KEY` (extractable from frontend bundle) can run `select('*')` against the entire `opportunities` table, bypassing backend per-user filtering and reading ALL users' data.

**Solution Options**:
1. Remove this policy and use Supabase's broadcast/presence channels instead of postgres_changes
2. Keep RLS conditions tied to authenticated user via JWT claims
3. Create a separate "realtime_notifications" table with minimal data that can be world-readable

**Priority**: CRITICAL (security vulnerability)

---

### Redis Cache for Production
**Current Issue**: In-memory user cache in `auth.js` is lost on server restart and not shared across instances.

```javascript
const userCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
```

**Solution**: Implement Redis for distributed caching (`ioredis` package)

**Priority**: High (before production deployment)

---

### Analytics Performance Optimization
**Current Issue**: Analytics calculations iterate through all opportunities multiple times in JavaScript. With thousands of opportunities, this causes slow response times.

**Solution**:
- Move aggregations to PostgreSQL queries (GROUP BY, COUNT, DATE_TRUNC)
- Implement server-side caching for analytics results (5-minute TTL)
- Consider materialized views for complex metrics

**Priority**: Medium (when users exceed ~500 opportunities)

---

### API Token Isolation
**Current Issue**: Global `getAuthToken` in `api.js` could mix tokens in SSR/testing scenarios.

```javascript
let getAuthToken = null; // Global state
```

**Solution**: For SSR, use factory pattern to create per-request Axios instances. For SPA-only (current), this is acceptable.

**Priority**: Low (only if adding SSR)

---

## 🚀 Feature Roadmap

### Phase 1: Quick Wins

#### 1. Email/SMS Deadline Reminders
- [ ] Send notifications 1 day, 3 days before deadlines
- [ ] Use SendGrid (email) or Twilio (SMS)
- [ ] User preferences for notification timing
- **Value**: "Never miss an application deadline again"

#### 2. Application Notes & Timeline
- [ ] Add timestamped notes per opportunity
- [ ] Examples: "Submitted resume", "Completed assessment", "Phone screen scheduled"
- [ ] Visual timeline view of all interactions
- **Value**: Track what you did and when for follow-ups

#### 3. Resume/Cover Letter Tracker ✅ COMPLETED
- [x] Track which resume version was sent to each company
- [x] Store links to docs (Google Drive/Dropbox integration)
- [x] Version history per document
- [x] Documents only for internship opportunities
- [x] Auto-unlink on status change to rejected
- **Value**: "Stop wondering which resume you sent where"

---

### Phase 2: Power Features

#### 4. Smart Tags & Filtering
- [ ] Custom tags: "Remote", "FAANG", "Startup", "Referral Applied"
- [ ] Filter dashboard by tags
- [ ] Bulk operations (archive all rejected, export filtered results)
- [ ] Tag suggestions based on company name

#### 5. Chrome Extension - Quick Add
- [ ] One-click add from LinkedIn/Glassdoor/Internshala job pages
- [ ] Auto-fill company name, role, deadline from page
- [ ] Sync with main app via API
- **Value**: Saves 2 min per application - makes the app "sticky"

#### 6. Bulk Import/Export
- [ ] CSV import to add multiple opportunities at once
- [ ] Export all data as CSV/JSON for backup
- [ ] Import from LinkedIn "Applied Jobs" export
- **Value**: Easy migration and data portability

#### 7. Search & Advanced Filters
- [ ] Full-text search across all fields
- [ ] Filter by: date range, status, category, tags
- [ ] Save filter presets for quick access
- [ ] Sort by deadline, date added, company name
- **Value**: Find opportunities quickly as list grows

#### 8. Interview Tracker
- [x] Track interview rounds (OA → Technical → HR → Final) — see [`docs/interview-rounds.md`](interview-rounds.md)
- [x] Per-round notes and results with timeline UI
- [ ] Interview prep checklists per company
- [ ] Calendar integration for interview scheduling
- **Value**: Comprehensive interview management

---

### Phase 2.5: Accessibility & UX

#### 9. Keyboard Navigation
- [ ] `Tab` through all interactive elements
- [ ] `Enter` to open modals, `Escape` to close
- [ ] Arrow keys for status board columns
- [ ] Focus indicators for all interactive elements
- **Value**: Better UX for power users and accessibility

#### 10. ARIA Labels & Screen Reader Support
- [ ] Add `aria-label` to all buttons and icons
- [ ] Live regions for toast notifications
- [ ] Semantic HTML improvements
- [ ] Screen reader testing with VoiceOver/NVDA

#### 11. Theme Options
- [ ] Light mode toggle (user preference)
- [ ] High contrast mode for visibility
- [ ] System preference detection (`prefers-color-scheme`)
- [ ] Respect `prefers-reduced-motion` for animations

#### 12. PWA (Progressive Web App)
- [ ] Service worker for offline access
- [ ] Install on phone home screen
- [ ] Push notifications for deadlines
- [ ] Offline viewing of cached data
- **Value**: Native app-like experience

---

### Phase 2.75: Data & Insights

#### 13. Comparison View
- [ ] Side-by-side opportunity comparison
- [ ] Pros/cons lists per opportunity
- [ ] Decision matrix for multiple offers
- [ ] Salary/compensation comparison
- **Value**: Make informed decisions between offers

#### 14. Enhanced Analytics
- [ ] Response rate by company type/size
- [ ] Best days/times to apply (based on success rates)
- [ ] Salary/compensation tracking
- [ ] Goal setting (e.g., "Apply to 10/week")

#### 15. Share with Mentors
- [ ] Generate read-only share links
- [ ] Mentor can add comments/advice
- [ ] Career counselor dashboard view
- [ ] Export for career services
- **Value**: Get feedback from mentors without sharing login

---

### Phase 3: AI-Powered Features

#### 6. AI Cover Letter Generator
- [ ] Input: Job description + user's resume
- [ ] Output: Tailored cover letter draft
- [ ] Use OpenAI API with prompt engineering
- [ ] Template customization options
- **Value**: "Generate personalized cover letters in 30 seconds"

#### 7. Company Research Dashboard
- [ ] Auto-fetch: Glassdoor ratings, salary ranges, recent news
- [ ] Company size, funding stage, tech stack
- [ ] Integration with Clearbit or similar company data API
- **Value**: Better interview prep without 10 browser tabs

---

## 📊 Database Schema Updates (Planned)

### Notes Table
```sql
CREATE TABLE opportunity_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tags Table
```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366F1'
);

CREATE TABLE opportunity_tags (
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (opportunity_id, tag_id)
);
```

### Documents Table
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('resume', 'cover_letter', 'other')),
    url TEXT,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🛠️ Infrastructure TODOs

- [ ] Set up Redis for distributed caching
- [ ] Configure CI/CD pipeline (GitHub Actions)
- [ ] Add rate limiting for API endpoints
- [ ] Set up error monitoring (Sentry)
- [ ] Configure production logging (Winston + LogDNA)
- [ ] Add API documentation (Swagger/OpenAPI)

---

## 📅 Release Timeline

| Phase | Features | Est. Time | Priority |
|-------|----------|-----------|----------|
| 1.1 | Email Reminders | 2 days | High |
| 1.2 | Notes & Timeline | 3 days | High |
| 1.3 | Resume Tracker | 2 days | Medium |
| 2.1 | Smart Tags | 3 days | Medium |
| 2.2 | Chrome Extension | 5 days | High |
| 2.3 | Bulk Import/Export | 2 days | Medium |
| 2.4 | Search & Filters | 2 days | High |
| 2.5 | Interview Tracker | 3 days | Medium |
| 2.5 | Keyboard Navigation | 1 day | Medium |
| 2.5 | Theme Options | 1 day | Low |
| 2.5 | PWA | 3 days | Medium |
| 2.75 | Comparison View | 2 days | Low |
| 2.75 | Enhanced Analytics | 2 days | Medium |
| 2.75 | Share with Mentors | 3 days | Low |
| 3.1 | AI Cover Letter | 3 days | Low |
| 3.2 | Company Research | 5 days | Low |

---

*Last updated: January 12, 2026*
