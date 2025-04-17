
# TradeWizard 4.0 – Website Analysis UX Redesign Blueprint (v3 Final)

This final blueprint includes all enhancements discussed in v1 and v2, with additional refinements around animation timing, personalization, internationalization, performance metrics, and analytics integration.

---

## ✅ Overview

This document defines the fully matured, implementation-ready user experience for the Website Analysis step. It is structured for phased rollout and supports graceful enhancement over time.

---

## 🧱 Component Structure

```
ThreePanelLayout
├── LeftNavPanel
│   ├── StepProgressIndicator
│   ├── StepList
│   └── CompletionStatusBadge
├── CenterPanel
│   ├── HeroHeaderWithGreeting
│   ├── TypingIndicatorBubble (Timed, Accessible)
│   ├── WebsiteInputCard
│   │   ├── URLInputField
│   │   ├── AnalyzeButton
│   │   └── AlternatePathLinks
│   ├── HelpOptionsCard
│   ├── LoadingProgressSteps (conditional)
│   └── ErrorMessageBanner (conditional)
└── RightContextPanel
    ├── ContextualTipsCard
    ├── WhyThisMattersBox
    ├── SuccessStats
    ├── SocialProof / Testimonials
    └── PostAnalysisPreview (future)
```

---

## 🔁 User Flow

1. Page loads
2. Typing indicator animates after 800ms → message appears after 2s
3. Greeting based on time (“Good morning, welcome back!”)
4. User enters URL, submits → loading steps display with progress bar
5. (Future) Backend extracts business data
6. Fallbacks or error flows shown if needed

---

## 🔄 Data Flow

- URL → validation → state update
- (Future) → POST `/api/extract-website-info`
- Response → stored in assessment context
- Render preview or error modal accordingly

---

## ⚙️ Key Functions

| Function              | Input        | Output                             |
|----------------------|--------------|------------------------------------|
| validateURL()        | string       | boolean, inline error              |
| handleSubmit()       | -            | trigger loading / error state     |
| triggerLoadingUI()   | -            | animates progress steps            |
| fallbackToManual()   | -            | navigate('/manual-entry')         |
| getGreeting()        | DateTime     | string ("Good morning", etc.)     |
| showExampleAnalysis()| -            | populates dummy URL, animates flow|

---

## 🔌 API Interface (Stub)

```http
POST /api/extract-website-info
{
  url: string
}

Response:
{
  companyName: string,
  products: Product[],
  location: string,
  confidenceScores: object
}
```

---

## 🧠 State Management

| State Key             | Scope         | Description                             |
|-----------------------|---------------|-----------------------------------------|
| websiteUrl            | Context       | Stores input                            |
| isLoading             | Local         | Manages analysis state                  |
| typingDelayDone       | Local         | Controls Sarah intro timing             |
| errorState            | Local         | URL/input/system errors                 |
| currentStep           | Global        | Drives navigation                       |
| demoModeActive        | Local         | See example toggle                      |
| analysisResult        | Context       | Holds extracted data                    |

---

## ✨ Placeholder Content

- Greeting: “Good morning! Let’s get your business ready for the world.”
- Sarah: “Hi! I’ll help analyze your site to find your best export products.”
- Input placeholder: `e.g., www.greenroots.co.za`
- Button: `🔍 Analyze My Website`
- HelpOptionsCard: 
  - “Not sure?” → expands help
  - “See Example” → triggers demo
  - “Take Tour” → opens modal
- Right Panel Tips: 
  - “Why start here?”  
  - “Most SMEs start with website insights…”

---

## ⏳ Typing & Animation Timing

- Page fade in: 300ms
- Typing delay: starts after 800ms
- Message appears after: 2s
- Loading steps animate every 1s with tick icon
- Reduced motion: respects `prefers-reduced-motion`

---

## 📱 Mobile Handling

- Stack order: Center → Right → Left (burger)
- Sticky input field: on scroll
- Tap zones: full-width buttons, padded inputs
- Collapse non-essential help items into accordions

---

## ♿ Accessibility (WCAG AA)

- Contrast ratios > 4.5:1
- Visible focus rings
- Full keyboard nav
- Screen reader support:
  - `aria-label` on inputs/buttons
  - `aria-live="polite"` for dynamic messages
- Prefers reduced motion respected

---

## 🌍 Internationalization Notes

- All labels and text strings externalized
- Plan for 30% text expansion
- RTL-ready layout (optional)
- Greeting localized to user’s time zone

---

## 📊 Performance Metrics

| Metric                      | Target Value       |
|-----------------------------|--------------------|
| Initial load time           | < 1.5s             |
| Time to interactive         | < 2s               |
| Analysis simulation time    | ~45s               |
| Failover response time      | < 5s               |

---

## 📈 Analytics Events

| Event Name                  | Trigger                               |
|-----------------------------|----------------------------------------|
| `url_submitted`             | User clicks Analyze                   |
| `fallback_used`             | User clicks “Enter Manually”          |
| `see_example_used`          | User clicks “See Example”             |
| `analysis_timeout`          | Loading exceeds threshold             |
| `error_encountered`         | Any validation/system error shown     |
| `step_completed`            | Loading sequence completes             |

---

## 🛠️ Implementation Recommendations

### Phase 1: Core Experience
- Build layout, static Sarah message
- URL input with validation
- Right panel context content
- Tailwind styling + visual tokens

### Phase 2: Enhanced Experience
- Typing animation + loading progress
- Fallback path + error recovery
- HelpOptionsCard interactive
- Greeting logic

### Phase 3: Final Polish
- Motion preferences
- Internationalization + accessibility audit
- Analytics tracking integration
- “Tour” and “See Example” modes

---

End of Final Blueprint v3.
