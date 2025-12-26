# Feature Specification: Trip Management System

**Feature Branch**: `010-trip-management`
**Created**: 2025-12-26
**Status**: Draft
**Input**: User description: "Trip Management System - Système de gestion des trajets permettant aux dispatchers et admins de créer et assigner des trajets aux camions/chauffeurs."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dispatcher Creates and Assigns a Trip (Priority: P1)

As a dispatcher, I need to create trips with origin/destination and assign them to available trucks and drivers so that deliveries can be scheduled and tracked.

**Why this priority**: This is the core functionality - without trip creation and assignment, the entire feature has no value. Dispatchers are the primary users who initiate the workflow.

**Independent Test**: Can be fully tested by creating a trip in the admin interface, assigning it to a truck/driver, and verifying it appears in the system. Delivers immediate value by enabling trip scheduling.

**Acceptance Scenarios**:

1. **Given** I am logged in as a dispatcher, **When** I create a new trip with origin "Paris Warehouse" and destination "Lyon Distribution Center", **Then** the trip is created with status "PENDING"
2. **Given** a pending trip exists, **When** I assign it to truck "TRUCK-001" and driver "Jean Dupont", **Then** the trip status changes to "ASSIGNED" and both truck and driver are linked
3. **Given** I am creating a trip, **When** I search for available trucks, **Then** I see only trucks with status IDLE or ACTIVE (not MAINTENANCE or OUT_OF_SERVICE)
4. **Given** a trip is assigned, **When** I view trip details, **Then** I see origin, destination, assigned truck, assigned driver, and current status

---

### User Story 2 - Driver Views and Manages Assigned Trips (Priority: P1)

As a driver, I need to see my assigned trips on my mobile app and update their status as I progress through deliveries so that dispatchers can track my work in real-time.

**Why this priority**: Equally critical as US1 - drivers need to see and act on trips for the system to function. This completes the core workflow loop.

**Independent Test**: Can be tested by logging into mobile app as a driver, viewing assigned trips, and updating trip status. Delivers value by enabling real-time trip tracking.

**Acceptance Scenarios**:

1. **Given** I am logged in as a driver on the mobile app, **When** I navigate to "My Trips", **Then** I see all trips assigned to me sorted by scheduled date
2. **Given** I have an assigned trip, **When** I tap "Start Trip", **Then** the trip status changes to "IN_PROGRESS" and start time is recorded
3. **Given** I have a trip in progress, **When** I tap "Complete Trip", **Then** the trip status changes to "COMPLETED" and completion time is recorded
4. **Given** I have an assigned trip, **When** I tap "View Details", **Then** I see origin address, destination address, any notes from dispatcher, and scheduled time

---

### User Story 3 - Driver Receives Notification for New Assignment (Priority: P2)

As a driver, I need to receive a notification when a new trip is assigned to me so that I am immediately aware of new work without constantly checking the app.

**Why this priority**: Important for user experience but system can function without it - drivers can manually refresh their trip list. Adds significant convenience.

**Independent Test**: Can be tested by assigning a trip to a driver and verifying they receive a push notification on their mobile device.

**Acceptance Scenarios**:

1. **Given** I am a driver with the mobile app installed, **When** a dispatcher assigns a new trip to me, **Then** I receive a push notification with trip summary
2. **Given** I receive a trip notification, **When** I tap on it, **Then** the app opens directly to the trip details screen
3. **Given** I have notifications enabled, **When** my trip is cancelled by a dispatcher, **Then** I receive a notification informing me of the cancellation

---

### User Story 4 - Dispatcher Monitors Trip Progress (Priority: P2)

As a dispatcher, I need to see the real-time status of all trips and track driver progress so that I can manage the fleet efficiently and respond to issues.

**Why this priority**: Enhances dispatcher workflow but basic assignment (US1) provides value on its own. This adds operational visibility.

**Independent Test**: Can be tested by viewing the trips dashboard while drivers update their trip statuses, verifying real-time updates appear.

**Acceptance Scenarios**:

1. **Given** I am logged in as a dispatcher, **When** I view the trips dashboard, **Then** I see all trips with their current status, assigned truck, and driver
2. **Given** a driver starts a trip, **When** I view the trips list, **Then** I see the trip status updated to "IN_PROGRESS" within 30 seconds
3. **Given** I am on the dashboard, **When** I filter trips by status "IN_PROGRESS", **Then** I see only active trips currently being executed
4. **Given** a trip exists, **When** I click on it, **Then** I see full trip history including all status changes with timestamps

---

### User Story 5 - View Trip History and Analytics (Priority: P3)

As a fleet manager, I need to view historical trip data and completion statistics so that I can analyze performance and optimize operations.

**Why this priority**: Valuable for reporting and optimization but not essential for day-to-day operations. Can be added after core workflow is stable.

**Independent Test**: Can be tested by completing several trips and then viewing the history/reports section to verify data accuracy.

**Acceptance Scenarios**:

1. **Given** I am logged in as a fleet manager or admin, **When** I access the trip history, **Then** I see completed trips with duration, driver, and route information
2. **Given** I am viewing trip history, **When** I filter by date range "last 7 days", **Then** I see only trips completed within that period
3. **Given** I am viewing trip history, **When** I filter by driver "Jean Dupont", **Then** I see only trips completed by that driver
4. **Given** I have access to analytics, **When** I view the dashboard, **Then** I see metrics including total trips, average trip duration, and completion rate

---

### User Story 6 - Cancel or Reassign Trip (Priority: P3)

As a dispatcher, I need to cancel trips or reassign them to different drivers/trucks so that I can handle schedule changes and emergencies.

**Why this priority**: Important for real-world flexibility but not needed for basic workflow. Edge case handling that improves operational resilience.

**Independent Test**: Can be tested by cancelling an assigned trip and reassigning another trip to a different driver, verifying both drivers are notified.

**Acceptance Scenarios**:

1. **Given** a trip is in "ASSIGNED" status, **When** I cancel it, **Then** the trip status changes to "CANCELLED" and the driver is notified
2. **Given** a trip is in "ASSIGNED" status, **When** I reassign it to a different driver, **Then** both the original and new driver are notified
3. **Given** a trip is "IN_PROGRESS", **When** I try to cancel it, **Then** I see a confirmation warning that the trip has already started
4. **Given** a trip is "COMPLETED", **When** I try to modify it, **Then** the system prevents changes and shows "Trip already completed"

---

### Edge Cases

- What happens when a driver's truck is changed while they have active trips? The trips remain assigned to the driver.
- What happens when a truck is put in MAINTENANCE status while having assigned trips? Dispatcher is warned and must reassign.
- How does the system handle a driver going offline during a trip? Trip remains IN_PROGRESS, dispatcher sees "Driver offline" indicator.
- What happens if a trip assignment conflicts with driver's duty status (OFF_DUTY)? System warns dispatcher but allows override.
- How are trips handled when the app loses connectivity? Status updates are queued locally and synced when connection returns.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow dispatchers and admins to create new trips with origin and destination addresses
- **FR-002**: System MUST allow trips to be assigned to a specific truck and driver
- **FR-003**: System MUST track trip status through lifecycle: PENDING → ASSIGNED → IN_PROGRESS → COMPLETED
- **FR-004**: System MUST allow trips to be cancelled at any stage before completion
- **FR-005**: System MUST display assigned trips to drivers on the mobile application
- **FR-006**: System MUST allow drivers to update trip status (start trip, complete trip)
- **FR-007**: System MUST record timestamps for all status transitions
- **FR-008**: System MUST send notifications to drivers when trips are assigned or cancelled
- **FR-009**: System MUST provide filtering and search capabilities for trips (by status, driver, truck, date)
- **FR-010**: System MUST maintain trip history for completed and cancelled trips
- **FR-011**: System MUST validate that assigned truck is not in MAINTENANCE or OUT_OF_SERVICE status
- **FR-012**: System MUST allow adding notes/instructions to trips
- **FR-013**: System MUST support trip reassignment to different driver/truck
- **FR-014**: System MUST restrict trip creation to users with DISPATCHER or ADMIN roles
- **FR-015**: System MUST restrict trip viewing to: assigned driver (own trips), dispatchers (all trips), admins (all trips)

### Key Entities

- **Trip**: Represents a delivery assignment with origin, destination, status, scheduled time, and notes. Has relationships to Truck and Driver.
- **TripStatus**: Enumeration of trip states (PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED)
- **TripHistory**: Audit trail of all status changes with timestamps and actor who made the change
- **TripAssignment**: Links a trip to a specific truck and driver with assignment timestamp

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dispatchers can create and assign a trip in under 2 minutes
- **SC-002**: Drivers see new trip assignments within 30 seconds of assignment
- **SC-003**: Trip status updates from mobile app reflect in admin dashboard within 10 seconds
- **SC-004**: System supports at least 100 concurrent active trips without performance degradation
- **SC-005**: 95% of drivers successfully complete their first trip update on first attempt
- **SC-006**: Trip history is searchable and returns results within 2 seconds for queries spanning 90 days
- **SC-007**: Push notifications are delivered to drivers within 60 seconds of trip assignment
- **SC-008**: System maintains 99.5% accuracy between mobile app and backend trip status

## Assumptions

- Trucks and users (drivers) already exist in the system from previous features
- Authentication and authorization (RBAC) is already implemented
- Push notification infrastructure can be added to the existing mobile app
- Drivers have reliable mobile connectivity during most of their shifts
- GPS tracking of trucks continues to function independently of trip assignments
- Trip addresses are text-based (no geocoding/mapping required for MVP)

## Out of Scope

- Route optimization or suggested routes
- Estimated time of arrival (ETA) calculations
- Integration with external mapping services
- Customer/recipient notifications
- Proof of delivery (signature capture, photos)
- Multi-stop trips (single origin to single destination only)
- Recurring/scheduled trip templates
- Driver availability scheduling
