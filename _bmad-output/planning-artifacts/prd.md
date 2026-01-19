---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain-skipped
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
workflowCompleted: true
completedAt: '2026-01-18'
inputDocuments:
  - _bmad-output/analysis/brainstorming-session-2026-01-18.md
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 0
workflowType: 'prd'
classification:
  projectType: 'JAMstack + Data Pipeline'
  domain: 'Consumer Tech / Content Aggregation'
  complexity: 'Low (frontend) / Medium (pipeline + business)'
  projectContext: 'greenfield'
  partyModeInsights:
    - 'Architecture = data pipeline with static frontend'
    - 'Strategic risk: YouTube API dependency'
    - 'NLP parsing = underestimated technical complexity'
    - 'Brutalist UX ≠ hostile UX - keep it human'
---

# Product Requirements Document - crowd-codes

**Author:** Justin
**Date:** 2026-01-18

## Executive Summary

### Vision

Crowd-Codes is a collaborative promo code platform that solves a simple problem: existing sites (radins.com, lareduction.fr) are infested with ads, popups, and expired codes. Our response: total transparency, zero ads, codes that work.

### Differentiator

- **Anti-pattern as identity**: No "reveal code" button, no popups, codes visible directly
- **Self-improving system**: LLM generates regex → automatic PR → continuous improvement
- **Radical transparency**: Public success rates, public stats, open source

### Target Users

- **Lucas (user)**: Rushed buyer looking for a promo code in < 30 seconds
- **Justin (maintainer)**: Solo developer managing the system with minimal effort

### Architecture Philosophy

Zero Backend: GitHub Actions + SQLite + Cloudflare Pages = **€0/month**

## Success Criteria

### User Success

- Find a working promo code in **< 5 seconds**
- **1 click** = code copied (zero friction)
- Experience **without ads, without popups** — try multiple codes in sequence without obstacles
- Codes sorted by **freshness** (reliability proxy)

### Business Success

- **100 visitors/day** = success
- **1000+ visitors/day** = hit
- Mention in an article/tweet = external validation
- Project fork = mission accomplished (open source philosophy)

### Technical Success

- **Daily scraping**: success > 95% of days
- **Parsing rate**: > 80% of YouTube descriptions parsed
- **Load time**: < 1 second
- **Infrastructure cost**: €0/month maintained
- **Uptime**: best effort (no SLA commitment — side project)

### Measurable Outcomes

| Metric | MVP Target | Stretch |
|--------|------------|---------|
| Visitors/day | 100 | 1000+ |
| Search → copy time | < 5s | < 3s |
| Parsing success rate | 80% | 90% |
| Monthly cost | €0 | €0 |

*These criteria guide the product scope defined below.*

## Product Scope

### MVP - Minimum Viable Product

- Scraping YouTube FR (influencer descriptions)
- Brand search (Fuse.js fuzzy search)
- Display codes sorted by descending date
- 1-click copy-to-clipboard
- Zero Backend architecture (GitHub Actions + Cloudflare Pages)
- Geographic scope: France only

### Growth Features (Post-MVP)

- Community votes (👍/👎)
- Auto-expiration based on negative votes
- Affiliate link parsing (in addition to codes)

### Vision (Future)

- Multi-country (US, DE, UK...)
- Browser extensions (Chrome, Firefox)
- Community code submission
- User accounts

*The following user journeys illustrate how these features address user needs.*

## User Journeys

### Journey 1: Lucas, the Rushed Buyer

**Persona:** Lucas, 28 years old — e-commerce cart open, "promo code" field visible, 30 seconds max before checkout.

**Narrative:**

> **Usual struggle**: Google → radins.com → cookie popup → newsletter popup → "REVEAL CODE" → ad opens → code copied → "Invalid code". 3 codes tested, 0 working. 5 minutes wasted.
>
> **Crowd-Codes**: Search "nordvpn" → 3 instant codes, sorted by date, success rate visible (89%). Click → "Copied!". Back to cart. Paste. -20%. 30 seconds.
>
> **Edge case — empty state**: Lucas searches "Decathlon" → no results. Empathetic message: *"No Decathlon code found recently. Tech influencers rarely cover this brand."* He understands why, no frustration.
>
> **Edge case — expired code**: First code doesn't work. He sees the 2nd has a better success rate. Copies. Works.

**Revealed Capabilities:**

- Instant fuzzy search (Fuse.js)
- Codes visible directly (no "reveal code")
- 1-click copy + visible feedback (mobile-friendly, large button)
- Sort by date + visible success rate per brand
- Empathetic empty state with contextual message
- Mobile-first (60%+ expected traffic)

### Journey 2: Justin, the Maintainer

**Persona:** Justin, creator and maintainer — quick daily check with coffee, minimal intervention desired.

**Narrative:**

> **Daily monitoring**: `/stats` public — scraping status ✅, 47 new codes, parsing rate 87%, success rate per brand. Total transparency = differentiator.
>
> **Alert signal**: Surfshark at 23% success rate (many 2nd codes copied). Hypothesis: codes expire fast or parsing failing.
>
> **Debug mode**: Clear logs with action suggestions: *"Unrecognized pattern - emoji + shortened link. Suggestion: regex for format [emoji][code][bitly]"*.
>
> **Improvement**: Daily aggregated GitHub PR with all suggested regex of the day (max ~10-20). Quick review, merge 2/3. Tomorrow = better parsing.
>
> **Resolution**: 5 minutes of maintenance. Self-improving system.

**Revealed Capabilities:**

- `/stats` page 100% public (total transparency)
- Public success rate per brand (inferred from copy patterns)
- Clear logs with concrete action suggestions
- Daily aggregated PR (threshold ~10-20 regex max)
- Low-effort observability

### Journey Requirements Summary

| Capability | Source | Priority | Notes |
|------------|--------|----------|-------|
| Fuzzy search by brand | Lucas | MVP | Client-side Fuse.js |
| Codes displayed directly | Lucas | MVP | No "reveal code" |
| 1-click mobile-friendly copy | Lucas | MVP | Visible feedback, large button |
| Sort by descending date | Lucas | MVP | Freshness proxy |
| Success rate per brand | Lucas + Justin | MVP | Public, inferred from copies |
| Empathetic empty state | Lucas | MVP | Contextual message |
| Public /stats page | Justin | MVP | Total transparency |
| Logs with suggestions | Justin | MVP | Actionable |
| Daily aggregated PR | Justin | MVP | Threshold ~10-20 regex |

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Self-Improving Pipeline**

- LLM parses descriptions not recognized by regex
- LLM returns: code + brand + suggested regex + original description
- Description auto-added to test dataset (auto-growing coverage)
- Daily aggregated PR with new regex
- Result: decreasing LLM costs, improved parsing, organically growing dataset

**2. Radical Transparency**

- 100% public success rates per brand
- Unique differentiator in an opaque market
- Natural burn-in (1-2 weeks personal use) before public promotion

**3. Frictionless Implicit Analytics**

- Local UUID (localStorage) per anonymous user
- Tracking: codes copied per session/user
- Inference: if 2nd code copied after 1st in same session = 1st probably failed
- Zero explicit user requests

**4. Anti-Pattern as Brand Identity**

- Zero ads, zero popups, codes visible directly
- Positioning: "The site that doesn't take you for a fool"
- Viral potential via word-of-mouth

### Validation Approach

| Innovation | Validation Method |
|------------|-------------------|
| Self-improvement | Monitoring: % descriptions parsed by regex vs LLM (must increase) |
| Transparency | User feedback, social mentions |
| Implicit analytics | Consistency of success rates with qualitative feedback |

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Regex regression | JSON golden dataset + mandatory CI test on PR |
| Analytics bias | Local UUID + same session filtering |
| Low stats at launch | 1-2 weeks burn-in before promo |

*These innovations rely on a specific technical architecture.*

## Web App (JAMstack + Data Pipeline) Specific Requirements

### Project-Type Overview

Hybrid architecture combining:
- **Static frontend**: Minimal HTML/CSS/JS served via CDN (Cloudflare Pages)
- **Data pipeline**: Daily GitHub Actions (scraping → parsing → export)
- **Client-side search**: Fuse.js on pre-generated JSON

### Technical Architecture Considerations

**Frontend:**

| Aspect | Decision |
|--------|----------|
| Type | Static pages + client-side JS |
| Target browsers | Modern only (Chrome, Firefox, Safari, Edge) |
| Accessibility | Basic (contrast, labels) — WCAG AA later |
| Mobile | Mobile-first, thumb-accessible buttons |

**Data Pipeline:**

| Aspect | Decision |
|--------|----------|
| Scraping frequency | 1x/day (extensible if quota allows) |
| Code retention | Indefinite (future purge if volume excessive) |
| Source of truth | SQLite in repo |
| Export | Static JSON for frontend |

### SEO Strategy

**Objective:** Organic traffic via "promo code [brand]" searches

**Implementation:**

| Element | Description |
|---------|-------------|
| **Brand pages** | `/brands/nordvpn/index.html` — pre-rendered content, indexable |
| **Generation threshold** | All brands (or 2+ codes threshold if volume explodes) |
| **Meta tags** | Optimized title: "NordVPN Promo Codes - January 2026 \| Crowd-Codes" |
| **Sitemap** | `sitemap.xml` generated at build with all brand pages |
| **JSON-LD** | Schema.org `Offer`/`Product` for Google rich snippets |

**SEO User Flow:**

```
Google "nordvpn promo code"
  → Lands on /brands/nordvpn
  → Codes pre-displayed
  → 1-click copy
```

### Performance Targets

*See [Non-Functional Requirements > Performance](#performance) for detailed targets.*

**Summary:** TTFB < 100ms, FCP < 1s, TTI < 2s, Lighthouse > 90

### Implementation Considerations

**Daily build generates:**

1. `index.html` — homepage with search
2. `/brands/[brand]/index.html` — one page per brand
3. `/stats/index.html` — statistics page
4. `sitemap.xml` — for Google
5. `index.json` — complete data for client search
6. `/brands/[brand].json` — per-brand data (optional)

**No SSR/backend** — everything is pre-generated, served statically.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP — solve the "find a working promo code" problem in the simplest way possible.

**Resources:**

- **Team:** Solo dev (Justin)
- **Timeline:** 2-3 weeks, no hard deadline
- **Budget:** €0/month (architectural constraint)

**Philosophy:** Ship small, learn fast. Parsing can be imperfect at launch — we iterate.

### MVP Feature Set (Phase 1)

**Supported Core User Journeys:**

- ✅ Lucas (user) — search → copy → success
- ✅ Justin (maintainer) — monitoring → debug → improvement

**Must-Have Capabilities:**

| Feature | Justification |
|---------|---------------|
| YouTube FR scraping | Primary data source |
| Regex + LLM fallback parsing | Code extraction |
| Fuzzy search (Fuse.js) | Core UX |
| 1-click copy | Core UX |
| Sort by date | Freshness proxy |
| SEO brand pages | Organic acquisition |
| /stats page | Observability |
| Daily aggregated PR | Self-improvement |
| Golden dataset + CI | Anti-regression |

**Explicitly out of MVP:**

- Community votes
- Success rate per brand (depends on analytics, may come in v1.1)
- Affiliate links
- Multi-country

### Post-MVP Features

**Phase 2 — Growth (after validation):**

| Feature | Trigger |
|---------|---------|
| Success rate per brand | Enough analytics data |
| Community votes 👍👎 | Traffic > 500/day |
| Auto-expiration by votes | Stable voting system |
| Affiliate links | User demand |

**Phase 3 — Expansion (if successful):**

| Feature | Condition |
|---------|-----------|
| Multi-country (US, DE, UK) | Demand + identified sources |
| Browser extensions | Traffic > 5000/day |
| Community submission | Moderation resolved |
| User accounts | Never? (philosophy) |

### Architecture Decision: Data Model Decoupling

**Principle:** The internal data model is **decoupled** from YouTube.

```
YouTube API → YouTubeAdapter → InternalCodeModel → Export JSON
Twitter/X  → TwitterAdapter  ↗
Reddit     → RedditAdapter   ↗
```

**Benefit:** If YouTube changes or blocks, we can add another source without refactoring.

**InternalCodeModel (example):**

```json
{
  "code": "string",
  "brand": "string",
  "source": { "type": "youtube", "channelName": "string", "videoId": "string" },
  "foundAt": "timestamp",
  "confidence": "number"
}
```

### Risk Mitigation Strategy

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Parsing < 50%** | Medium | Medium | Acceptable — continuous improvement, just delays launch |
| **YouTube API change** | Low | High | Decoupled data model — adapter pattern |
| **YouTube ToS block** | Low | High | Alternative sources (Twitter, Reddit, direct scraping) |
| **Regex regression** | Medium | Medium | Golden dataset + mandatory CI |
| **No SEO traffic** | Medium | Medium | 1-2 weeks burn-in, patience |

## Functional Requirements

### Code Discovery

- **FR1:** Users can search for promo codes by brand name
- **FR2:** Users can see search results instantly (fuzzy matching)
- **FR3:** Users can see codes sorted by discovery date (most recent first)
- **FR4:** Users can see a contextual message explaining why no code exists for a brand (e.g., "Tech influencers rarely cover this brand")
- **FR5:** Users can access a dedicated brand page directly (via URL or SEO)
- **FR6:** Users can distinguish a "no results" state from a "loading error" state

### Code Interaction

- **FR7:** Users can copy a code in a single click
- **FR8:** Users receive immediate visual feedback after copying ("Copied!")
- **FR9:** Users can see the code source (YouTube channel, date)
- **FR10:** Users can see the discovery date of each code

### Data Pipeline

- **FR11:** The system can scrape YouTube FR video descriptions daily
- **FR12:** The system can parse promo codes via predefined regex
- **FR13:** The system can use an LLM as fallback for unparsed descriptions
- **FR14:** The system can persist codes durably
- **FR15:** The system can serve data to the frontend performantly
- **FR16:** The system can filter videos by relevant keywords (promo code, discount, etc.)
- **FR17:** The system can abstract the data source (adapter pattern) to decouple YouTube from the internal model

### Self-Improvement

- **FR18:** The LLM can suggest a new regex when it parses successfully
- **FR19:** The LLM can return the original description to enrich the test dataset
- **FR20:** The system can create a daily aggregated GitHub PR with newly suggested regex
- **FR21:** The system can validate new regex against a golden dataset in CI
- **FR22:** The system can block a PR if regressions are detected

### Analytics & Observability

- **FR23:** Users can view a public /stats page
- **FR24:** The maintainer can see the last scraping status
- **FR25:** The maintainer can see the number of codes found per day
- **FR26:** The maintainer can see the parsing rate (regex vs LLM)
- **FR27:** The system can track code copies per user session (local UUID)
- **FR28:** The maintainer can see error logs including the unrecognized pattern and a regex suggestion

### SEO & Content

- **FR29:** The system can generate static HTML pages per brand
- **FR30:** The system can generate a sitemap.xml with all brand pages
- **FR31:** The system can include JSON-LD data (schema.org) for rich snippets
- **FR32:** Each brand page can have SEO-optimized meta tags

### Platform & UX

- **FR33:** Users can use the site on mobile with an optimized experience
- **FR34:** Users can use the site without creating an account
- **FR35:** Users can use the site without seeing ads or popups
- **FR36:** Users can use the site on modern browsers (Chrome, Firefox, Safari, Edge)

### Open Source & Forkability

- **FR37:** The project includes documentation allowing a third party to fork and deploy their own instance
- **FR38:** The project includes a `.env.example` file documenting required environment variables

## Non-Functional Requirements

### Performance

| ID | Requirement | Target | Rationale |
|----|-------------|--------|-----------|
| NFR-P1 | Time to First Byte (TTFB) | < 100ms | Cloudflare edge CDN enables sub-100ms TTFB |
| NFR-P2 | First Contentful Paint (FCP) | < 1s | Critical for perceived performance |
| NFR-P3 | Time to Interactive (TTI) | < 2s | User can search within 2 seconds of page load |
| NFR-P4 | Lighthouse Performance Score | > 90 | Ensures overall performance quality |
| NFR-P5 | Search Response Time | < 200ms | Fuzzy search must feel instant (client-side Fuse.js) |
| NFR-P6 | Static Asset Size | < 50KB (gzipped) | Minimal JS/CSS footprint for fast loads |

### Security

| ID | Requirement | Target | Rationale |
|----|-------------|--------|-----------|
| NFR-S1 | API Keys Protection | Never in source code | GitHub Secrets only, .env.example for forks |
| NFR-S2 | HTTPS Enforcement | 100% traffic | Cloudflare provides free SSL by default |
| NFR-S3 | Content Security Policy | Restrict external scripts | Prevent XSS, no third-party tracking |
| NFR-S4 | No User Data Collection | Zero PII stored | Only anonymous UUID in localStorage |

### Accessibility

| ID | Requirement | Target | Rationale |
|----|-------------|--------|-----------|
| NFR-A1 | Color Contrast Ratio | WCAG AA (4.5:1 minimum) | Readable text for users with vision impairments |
| NFR-A2 | Form Labels | All inputs labeled | Screen reader compatibility |
| NFR-A3 | Keyboard Navigation | Full site navigable | Tab through search, results, copy actions |
| NFR-A4 | Focus Indicators | Visible focus states | Clear indication of active element |
| NFR-A5 | Copy Action Feedback | Visual + ARIA announcement | "Copié !" accessible to screen readers |

### Integration

| ID | Requirement | Target | Rationale |
|----|-------------|--------|-----------|
| NFR-I1 | YouTube API Quota | < 5000 units/day | Stay within free tier (10k/day limit) |
| NFR-I2 | LLM API Quota | < 150 calls/day (batched) | Gemini Flash free tier preservation |
| NFR-I3 | GitHub Actions Runtime | < 30 min/day | Stay within 2000 min/month free tier |
| NFR-I4 | Graceful API Degradation | Buffer unparsed for retry | If LLM quota hit, defer to next day |
| NFR-I5 | Cloudflare Pages Build | < 5 min/build | Fast deployment on git push |

### Reliability

| ID | Requirement | Target | Rationale |
|----|-------------|--------|-----------|
| NFR-R1 | Site Availability | Best effort (no SLA) | Side project, Cloudflare provides high uptime anyway |
| NFR-R2 | Data Pipeline Recovery | Resume from last checkpoint | SQLite as source of truth enables recovery |
| NFR-R3 | Build Failure Notification | Alert on scraping/export errors | Discord/Slack webhook for observability |
