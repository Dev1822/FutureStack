# FutureStack - Future Updates Roadmap

> This document tracks planned features, improvements, and technical debt for future releases.

---

## 🔧 Technical Improvements

### Redis Cache for Production
**Current Issue**: In-memory user cache in `auth.js` is lost on server restart and not shared across instances.

```javascript
// Current implementation (auth.js lines 4-7)
const userCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
```

**Solution**: Implement Redis for distributed caching
- Use `ioredis` or `redis` npm package
- Store user ID mappings with TTL
- Benefits: Persistence across restarts, works with load balancing

**Priority**: High (before production deployment)

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

#### 3. Resume/Cover Letter Tracker
- [ ] Track which resume version was sent to each company
- [ ] Store links to docs (Google Drive/Dropbox integration)
- [ ] Version history per document
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
| 3.1 | AI Cover Letter | 3 days | Low |
| 3.2 | Company Research | 5 days | Low |

---

*Last updated: December 31, 2025*
