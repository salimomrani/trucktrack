# Truck Track Constitution

<!--
Sync Impact Report:
Version: 1.0.0 → 1.1.0 (Minor version bump - new principles added)
Modified Principles:
  - III. Testing & Quality → III. Code Quality & Testing Standards (expanded with code quality requirements)
  - IV. Scalability & Performance → IV. Performance Requirements (expanded with specific metrics and monitoring)
Added Sections:
  - VI. User Experience Consistency (new principle)
  - Enhanced Code Quality Standards subsection with specific requirements
  - Enhanced Performance Benchmarks with user-facing metrics
  - User Experience Guidelines section
Removed Sections: None
Templates requiring updates:
  ✅ .specify/templates/plan-template.md - Constitution Check section compatible
  ✅ .specify/templates/spec-template.md - Requirements alignment verified
  ✅ .specify/templates/tasks-template.md - Task categorization supports new principles
  ⚠ Feature specs should now validate against UX consistency requirements
Follow-up TODOs: None
-->

## Core Principles

### I. Real-Time Data First

The system MUST prioritize real-time GPS tracking and live data updates as its core capability. All features MUST support:

- Sub-second GPS coordinate updates from trucks to backend services
- Live map visualization with minimal latency (target: <2 seconds from GPS signal to map display)
- Event-driven architecture for position updates, avoiding polling where possible
- Graceful handling of intermittent connectivity (offline buffering, automatic reconnection)

**Rationale**: A truck tracking system's primary value is providing accurate, current location information. Any delay or data staleness directly impacts operational decisions, route optimization, and delivery estimates.

### II. Microservices Architecture

The application MUST be built using a microservices architecture with clear service boundaries:

- **GPS Ingestion Service**: Handles incoming GPS data streams from trucks
- **Location Service**: Manages current and historical location data
- **Notification Service**: Sends alerts and updates to users
- **API Gateway**: Single entry point for client applications
- Each service MUST be independently deployable and scalable
- Services MUST communicate via message queues (Kafka) for asynchronous operations and REST/gRPC for synchronous queries

**Rationale**: Microservices enable independent scaling of high-throughput components (GPS ingestion) while maintaining simplicity in lower-traffic services (user management). This architecture supports the real-time requirements and allows for technology diversity where beneficial.

### III. Code Quality & Testing Standards (NON-NEGOTIABLE)

All code MUST meet strict quality standards and comprehensive testing requirements:

#### Testing Requirements

- **Test-Driven Development**: MANDATORY for all backend services and critical frontend components
- **Contract Tests**: MUST exist for all API endpoints and message queue contracts
- **Integration Tests**: REQUIRED for GPS data flow, map rendering, and notification delivery
- **Load Tests**: MUST validate system performance under expected peak loads (defined per feature)
- **End-to-End Tests**: REQUIRED for critical user journeys (viewing live truck location, receiving alerts)
- **Test Coverage**: Minimum 80% code coverage for backend services, 70% for frontend components
- Tests MUST be written before implementation (Red-Green-Refactor cycle)
- All tests MUST pass before merging to main branch

#### Code Quality Requirements

- **Static Analysis**: Code MUST pass SonarQube quality gates with:
  - Zero critical or blocker issues
  - Technical debt ratio <5%
  - Code duplication <3%
  - Cognitive complexity <15 for methods
- **Code Reviews**: All pull requests MUST:
  - Be reviewed by at least one other developer
  - Include descriptive commit messages following conventional commits format
  - Pass automated CI/CD checks (tests, linting, security scans)
  - Have no unresolved review comments
- **Code Style**: Consistent formatting enforced via:
  - Java: Google Java Style Guide with Checkstyle
  - JavaScript/React: ESLint + Prettier with Airbnb config
  - Automatic formatting on pre-commit hooks
- **Documentation Standards**:
  - Public APIs MUST have OpenAPI/Swagger documentation
  - Complex business logic MUST have inline comments explaining "why", not "what"
  - Each microservice MUST have a README with setup, configuration, and architecture overview
  - Database schemas MUST be documented with entity relationship diagrams
- **Dependency Management**:
  - Critical and high-severity vulnerabilities MUST be patched within 14 days
  - All dependencies MUST be explicitly versioned (no version ranges in production)
  - Unused dependencies MUST be removed during code reviews
  - License compatibility MUST be verified for all third-party libraries

**Rationale**: Real-time tracking systems have no room for data loss, display errors, or security vulnerabilities. High code quality standards prevent bugs, reduce technical debt, and ensure long-term maintainability. Comprehensive testing catches issues before they reach production where failures directly impact business operations.

### IV. Performance Requirements

The system MUST be designed to handle growth and meet strict performance targets:

#### Scalability Requirements

- Architecture MUST support horizontal scaling for all services
- GPS ingestion MUST handle bursts of data (e.g., 1000+ trucks reporting simultaneously)
- Database queries MUST be optimized for location-based searches (spatial indexing required)
- Map rendering MUST support clusters/aggregation for large fleets (100+ trucks)
- Performance targets MUST be defined per feature and validated via load testing

#### Performance Benchmarks (User-Facing)

All features MUST meet or exceed these baseline targets unless explicitly justified:

- **GPS Update Latency**: 95th percentile <2 seconds from device to map display
- **Page Load Time**: Initial page load <3 seconds on 3G connection
- **Time to Interactive**: <5 seconds for map interface to be fully interactive
- **Map Operations**: Pan, zoom, and truck selection MUST respond within 100ms
- **API Response Time**: 95th percentile <200ms for read operations, <500ms for write operations
- **Map Rendering**: <3 seconds for initial map render with up to 100 trucks
- **Search Performance**: Truck search results MUST appear within 500ms
- **Concurrent Users**: Support 500 concurrent users viewing live maps without degradation
- **Throughput**: GPS ingestion service MUST handle 10,000 position updates/second
- **Mobile Performance**: App launch time <2 seconds on mid-range devices (2-year-old models)

#### Performance Monitoring

- **Real User Monitoring (RUM)**: Track actual user experience metrics in production
- **Synthetic Monitoring**: Automated performance tests run hourly from multiple regions
- **Performance Budgets**: Each page/feature MUST define and enforce:
  - JavaScript bundle size limits
  - API call counts per page load
  - Time to First Contentful Paint (FCP) <1.5s
  - Largest Contentful Paint (LCP) <2.5s
  - Cumulative Layout Shift (CLS) <0.1
- **Alerts**: Automatic alerts when metrics exceed thresholds for 5+ minutes
- **Performance Regression Tests**: CI/CD pipeline MUST fail if new code degrades performance >10%

**Rationale**: Performance directly impacts user satisfaction and operational efficiency. Slow map loads, delayed GPS updates, or laggy interactions erode trust and reduce the system's effectiveness. Fleet operators need instant access to truck locations for time-critical decisions.

### V. Security & Privacy

Location data is sensitive and MUST be protected at all levels:

- **Authentication**: All API endpoints MUST require authentication (JWT tokens, OAuth2, or API keys)
- **Authorization**: Users MUST only access trucks/data they are authorized to view
- **Encryption**: GPS data MUST be encrypted in transit (TLS 1.3) and at rest (database encryption)
- **Data Retention**: Location history MUST have configurable retention policies (default: 90 days)
- **Audit Logging**: All access to location data MUST be logged for security and compliance
- **Security Scanning**: Automated SAST/DAST scans MUST run on every commit
- **Penetration Testing**: Annual third-party security audits REQUIRED

**Rationale**: GPS tracking data reveals sensitive information about business operations, routes, and potentially driver behavior. Regulatory compliance (GDPR, CCPA) and customer trust require robust security measures.

### VI. User Experience Consistency

The application MUST provide a consistent, intuitive user experience across all platforms:

#### Design System

- **Component Library**: All UI components MUST come from a centralized design system
- **Design Tokens**: Colors, typography, spacing, and animations MUST use design tokens
- **Accessibility**: All interfaces MUST meet WCAG 2.1 Level AA standards:
  - Keyboard navigation support for all interactive elements
  - Screen reader compatibility with ARIA labels
  - Sufficient color contrast ratios (4.5:1 for normal text, 3:1 for large text)
  - Responsive design supporting viewport widths from 320px to 2560px
- **Internationalization**: UI MUST support multiple languages via i18n framework
- **Dark Mode**: System MUST support user preference for light/dark themes

#### Interaction Patterns

- **Loading States**: All asynchronous operations MUST show loading indicators within 200ms
- **Error Handling**: User-facing errors MUST:
  - Use clear, non-technical language
  - Suggest actionable next steps
  - Provide context about what went wrong
  - Log technical details server-side without exposing to users
- **Feedback Mechanisms**: User actions MUST provide immediate feedback:
  - Button clicks: Visual state change within 100ms
  - Form submissions: Progress indicator or success/error message
  - Real-time updates: Visual indicator when data is stale or updating
- **Navigation**: Consistent navigation structure across all pages:
  - Breadcrumbs for deep hierarchies
  - Back button support in browser
  - Mobile: Bottom navigation for primary actions

#### Map Interface Standards

- **Truck Markers**: Consistent visual representation across all map views:
  - Color-coding for truck status (active, idle, offline, alert)
  - Direction indicator showing heading
  - Size adjusts based on zoom level
  - Clustering for dense areas (>10 trucks in view)
- **Map Controls**: Standard controls in consistent positions:
  - Zoom controls: Bottom-right
  - Layer selector: Top-right
  - Search: Top-left
  - Filters: Collapsible left sidebar
- **Real-Time Indicators**: Clear visual feedback for live data:
  - Pulsing animation on actively moving trucks
  - Last update timestamp on truck details
  - Connection status indicator
  - Offline mode banner when disconnected

#### Cross-Platform Consistency

- **Web Application**: Desktop browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
- **Mobile Web**: Responsive design matching native app functionality
- **Mobile Apps**: Native iOS and Android apps MUST:
  - Match web application feature parity
  - Follow platform-specific design guidelines (Material Design for Android, Human Interface Guidelines for iOS)
  - Share core business logic with web via shared libraries
- **Tablet Support**: Optimized layouts for tablet screen sizes (7" to 13")

#### User Onboarding & Help

- **First-Time Experience**: New users MUST see interactive onboarding:
  - 3-5 step guided tour highlighting key features
  - Skippable with "Don't show again" option
  - Contextual tooltips for complex features
- **In-App Help**: Accessible help documentation:
  - Searchable knowledge base
  - Video tutorials for common workflows
  - Contact support option on every page
- **Empty States**: Informative messages when no data available:
  - Explain why the view is empty
  - Suggest actions to populate data
  - Visual illustration (not just text)

**Rationale**: Inconsistent user experiences lead to confusion, training overhead, and reduced productivity. Fleet managers and dispatchers need predictable interfaces to make fast, accurate decisions. Accessibility ensures the system serves all users, including those with disabilities, expanding market reach and meeting legal requirements.

## Technology Stack

The following technologies form the foundation of Truck Track:

- **Backend**: Java (Spring Boot for microservices)
- **Message Queue**: Apache Kafka (for GPS event streaming and inter-service communication)
- **Database**: PostgreSQL with PostGIS extension (for location data and spatial queries)
- **Cache**: Redis (for real-time truck positions and session management)
- **Frontend**: React with mapping library (Leaflet, Mapbox GL JS, or Google Maps API)
- **Mobile**: Native iOS/Android apps or React Native (for driver applications)
- **Infrastructure**: Docker containers, Kubernetes for orchestration (or cloud-managed services)
- **Monitoring**: Prometheus + Grafana for metrics, ELK stack for logs

**Constraints**:

- Java version MUST be 17 or higher (LTS release)
- All services MUST expose health check endpoints for orchestration
- Kafka topics MUST follow naming convention: `truck-track.<domain>.<event>`
- Database schemas MUST use migration tools (Flyway or Liquibase)

## Quality Standards

### Performance Benchmarks

Features MUST meet or exceed these baseline targets unless explicitly justified in the constitution complexity tracking section:

- **GPS Update Latency**: 95th percentile <2 seconds from device to map display
- **API Response Time**: 95th percentile <200ms for read operations, <500ms for write operations
- **Map Load Time**: <3 seconds for initial map render with up to 100 trucks
- **Concurrent Users**: Support 500 concurrent users viewing live maps without degradation
- **Throughput**: GPS ingestion service MUST handle 10,000 position updates/second

### Observability Requirements

All services MUST implement:

- **Structured Logging**: JSON format with correlation IDs for request tracing
- **Metrics**: Expose Prometheus-compatible metrics (request counts, latencies, error rates)
- **Distributed Tracing**: Implement OpenTelemetry or similar for cross-service request tracking
- **Alerting**: Define alerts for SLA violations (GPS ingestion lag, API latency spikes, service downtime)

### Code Quality

- **Code Reviews**: All pull requests MUST be reviewed by at least one other developer
- **Static Analysis**: Java code MUST pass SonarQube quality gates (no critical/blocker issues)
- **Documentation**: Public APIs MUST have OpenAPI/Swagger documentation
- **Dependency Management**: Critical and high-severity vulnerabilities MUST be patched within 14 days

### User Experience Guidelines

- **Accessibility**: WCAG 2.1 Level AA compliance REQUIRED
- **Performance**: Core Web Vitals targets - LCP <2.5s, FID <100ms, CLS <0.1
- **Responsiveness**: Support viewport widths 320px to 2560px
- **Browser Support**: Latest 2 versions of Chrome, Firefox, Safari, Edge
- **Mobile**: iOS 14+, Android 10+ (API level 29+)

## Governance

This constitution is the definitive guide for all technical decisions in the Truck Track project. It supersedes all other practices, guidelines, or ad-hoc decisions.

### Amendment Process

1. **Proposal**: Any team member may propose amendments via pull request to this file
2. **Review**: Amendments MUST be reviewed by project leads and technical architects
3. **Approval**: Major version bumps (backward-incompatible changes) require unanimous approval; minor/patch bumps require majority approval
4. **Migration**: If an amendment invalidates existing code, a migration plan MUST be included
5. **Documentation**: Update all dependent templates and documentation when amendments are ratified

### Compliance Verification

- All pull requests MUST include a constitution compliance checklist
- Feature specifications MUST verify no constitutional violations before implementation
- Quarterly architecture reviews MUST assess ongoing compliance and identify technical debt

### Versioning Policy

This constitution follows semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Backward-incompatible changes to core principles (e.g., removing a principle, redefining architecture)
- **MINOR**: New principles added or material expansion of existing guidance (e.g., adding a new quality standard)
- **PATCH**: Clarifications, wording improvements, typo fixes, non-semantic refinements

### Complexity Justification

Any violation of constitutional principles MUST be explicitly justified in the feature's plan.md file under "Complexity Tracking" section. Unjustified violations will result in plan rejection.

**Version**: 1.1.0 | **Ratified**: 2025-12-09 | **Last Amended**: 2025-12-09
