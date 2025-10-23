# Software Requirement Specification

## Introduction

The introduction serves as an initial description of the document, including its purpose, scope and defining commonly used terminology.

### Purpose

The purpose of this document is to define the requirements for a site-level surveillance system developed as part of the TDDC88 software engineering course project. Commissioned by Axis Communications, this system demonstrates the company's vision for next-generation intrusion detection and deterrence.

This Software Requirement Specification (SRS) document serves two primary audiences:

**Client stakeholders (Axis Communications and partners)**: To validate that the proposed system's functionality, quality, and constraints align with needs and expectations.

**Development team**: To provide a clear and testable specification for implementing the complete system, including user stories, functional requirements and non-functional requirements.

### Scope

The system to be developed is a site-level surveillance application that integrates multiple video cameras and at least one loud speaker with the purpose of providing real-time situational awareness over complete sites. The system focuses on detecting intruders in restricted areas and responding by triggering alarms and playing deterrent messages.

**Core functionality (MVP)**:

- Display a 2D-site map showing the site, positions of cameras and loudspeakers
- Allow system admin to define restricted zones and associate alarm schedules with them.
- Detect intrusions when a person enters a restricted zone.
- Implement basic object filtering to reduce false alarms (e.g., filtering non-human objects).
- Generate real-time alarms with visual indication of the intruder's coordinates on the site map.
- Automatically select the nearest loudspeaker and trigger deterrence messages.
- Provide the security operator with relevant live video feeds and snapshots to assess alarms.
- Allow security operator to confirm legitimate alarms or dismiss false positives.

### Definitions

- **Site Map**: A 2D-render of the monitored facility.
- **Zone**: A system admin-defined area on the site map.
- **Alarm**: An event in the system triggered when an intruder enters a restricted zone.
- **Intruder**: A person unlawfully present within a restricted zone.
- **Operator**: System user responsible for monitoring alerts and incident response.
- **Incident**: An alarm from the system that the security operator has to verify.
- **MVP (Minimum Viable Product)**: Core feature set sufficient to demonstrate site-level intrusion detection and automated deterrence capabilities.
- **Stretch Goal**: Optional functionality implemented only if schedule and resources permit.

## General Description

This section gives a broad overview of the surveillance system. It describes how the system interacts with its surroundings, outlines its main functions, identifies the intended users, and highlights the key constraints and quality factors that shape its design.

### Product Perspective

The surveillance system is a software application that integrates external Axis video cameras and network speakers to provide monitoring at the site level. Video streams from the cameras are analysed continuously to detect movement inside user defined restricted zones. When an intrusion is detected, the system raises an alarm, highlights the intruder's position on the site map, and plays a deterrence message through the closest speaker. Operators work with the system through a clear interface that combines a 2D site map, live camera feeds, and alarm management tools. Alarms can be scheduled so that monitoring is only active during selected periods, such as nights or weekends. For each intrusion, the system saves relevant snapshots for later review while following GDPR and data privacy requirements. Overall, the system is designed to give security staff real-time awareness of incidents and allow them to respond quickly and effectively.

### User Characteristics

**Security Operator (primary user)**

- Main day-to-day user who monitors alarms and responses to incidents.
- Uses the system continuously during shifts, possibly under stressful conditions.
- Needs fast and reliable alarms, with low training threshold therefor needing intuitive UI.

**System admin**

- Occasional user responsible for assisting system setup/configuration.
- Advanced technical skills and can handle more complex interactions.

### Constraints & Assumptions

To mitigate possible misconceptions of the systems capability or function, the following bullet points clarifies constraints and assumptions about the application.

- A user must login to access the system functions.
- Cameras have pre-existing object recognition.
- An intruder is human.
- All surveillance cameras are positioned such that their combined coverage ensures no blind spots across the monitored site.
- The system has a system admin, responsible for installing and maintaining the system.
- Client provides the floor plan of the desired area to be used as the site map.

### Key quality factors

This section highlights the key non-functional requirements that are crucial for the system to work well in practice. These quality factors go beyond basic functionality and define the characteristics the system must show to meet Axis Communications' standards and deliver on user expectations.

- **Reliability** – The system does not crash. Available when needed.
- **Accuracy** – How well does the system recognize objects. Minimize the number of false alarms.
- **Security** – How well does the system protect data from misuse.
- **Usability** – Ease of use for the security operators.

## User Stories

The backlog of user stories is a list that ranks the stories in falling order from highest to lowest priority. During each iteration of the project, this list will be reviewed and updated as stories will be completed or reprioritized.

### US-01: Create Site and Upload Floor Plan

**As a** system admin, **I want to** create a site, be able to edit it, and upload a floor plan **so that** the system can generate a site map for monitoring.

**Acceptance Criteria**:

- Admin can create a new site with name and metadata.
- Admin can upload a floor plan file; system renders a site map.
- Uploaded map is stored and used as base for configuration.

**Applicable NFRs**:

- Security: Sensitive data (accounts, alarms, snapshots, logs with personal data) shall be encrypted at rest (e.g., AES-256).
- Reliability: The system shall be available at least 99% of the time.
- Usability: The user shall be able to upload a floor plan with no more than 5 clicks.
- Accessibility: The system shall support the latest versions of Chrome, Firefox, and Edge with page load times under 2 seconds.

### US-02: Register Cameras and Speakers

**As a** system admin, **I want to** add cameras and speakers to the system **so that** I can monitor all areas of my facility and respond to intrusions.

**Acceptance Criteria**:

- Admin can add cameras by specifying their location and viewing direction on the site map
- Admin can add speakers by marking their positions on the site map
- All devices appear as icons on the site map after being added

**Applicable NFRs**:

- Security: Sensitive data (accounts, alarms, snapshots, logs with personal data) shall be encrypted at rest (e.g., AES-256).
- Reliability: The system shall allow 30 users to use the system during the same time without a decrease in performance
- Accessibility: The system shall support the latest versions of Chrome, Firefox, and Edge with page load times under 2 seconds.

### US-03: Define Restricted Zones

**As a** system admin, **I want to** mark restricted areas on the site map **so that** the system knows where to watch for unauthorized access.

**Acceptance Criteria**:

- Admin can draw restricted areas directly on the site map
- Admin can edit or remove restricted areas
- Changes are immediately applied to the monitoring system

**Applicable NFRs**:

- Usability: The user shall be able to edit or remove restricted areas with no more than 4 clicks.
- Security: The system shall allow only authenticated system admins to configure zones/lines.

### US-03B: Set Up Detection Lines

**As a** system admin, **I want to** draw detection lines on pathways **so that** I can track which direction people are moving.

**Acceptance Criteria**:

- Admin can draw lines across doorways or pathways on the site map
- Admin can edit or remove detection lines
- System shows which direction people cross these lines

**Applicable NFRs**:

- Usability: The user shall be able to edit or remove restricted areas with no more than 4 clicks.
- Security: The system shall allow only authenticated system admins to configure zones/lines.

### US-04: Configure Alarm Schedules

**As a** system admin, **I want to** set schedules for zones **so that** alarms only trigger during specified times.

**Acceptance Criteria**:

- Admin can define weekly/hourly schedule per zone.
- Admin can edit or delete schedules.
- System applies schedules automatically.

**Applicable NFRs**:

- Reliability: The system shall be available at least 99% of the time.
- Security: The system shall allow only authenticated system admins to configure schedules.

### US-05: Detect and Display Intrusion

**As a** security operator, **I want** the system to detect intruders in zones and show their coordinates on the site map **so that** I can quickly respond.

**Acceptance Criteria**:

- Intruder highlighted on map in real time.
- Tracking works across multiple cameras and zones.
- Crossing direction displayed.

**Applicable NFRs**:

- Reliability: The system shall maintain a false alarm rate below 10%.
- Reliability: The system shall be able to recover within 60 seconds if it crashes.
- Usability: The user shall be able to watch live-video with no more than 3 clicks.

### US-06: Alarm Creation with Evidence

**As a** security operator, **I want** the system to create detailed alarms when intrusions happen **so that** I have all the information needed to assess the situation.

**Acceptance Criteria**:

- Each alarm shows when and where the intrusion occurred
- Alarm includes photos from the cameras that detected the person
- All current alarms are visible in my dashboard with their status

**Applicable NFRs**:

- Security: Sensitive data (accounts, alarms, snapshots, logs with personal data) shall be encrypted at rest (e.g., AES-256).
- Reliability: The system shall maintain a false alarm rate below 10%.
- Usability: The user shall be able to watch live-video with no more than 3 clicks.

### US-07: Confirm or Dismiss Alarm

**As a** security operator, **I want to** confirm alarms and contact the alarm center or dismiss alarms **so that** I can distinguish real intrusions from false positives.

**Acceptance Criteria**:

- Operator can confirm alarm → creates incident.
- Operator can dismiss alarm → must give reason.
- Alarm closure requires outcome category and closure note.

**Applicable NFRs**:

- Usability: The user shall be able to confirm or dismiss an alarm with no more than 3 clicks.
- Reliability: The system shall allow 30 users to use the system during the same time without a decrease in performance.
- Security: The system shall allow only authenticated operators to confirm or dismiss alarms.

### US-08: Live Video on Demand

**As a** security operator, **I want to** quickly view live video from any camera **so that** I can visually check what's happening during an alarm.

**Acceptance Criteria**:

- Operator can click on any camera location on the site map to open its live feed.

**Applicable NFRs**:

- Usability: The user shall be able to watch live-video with no more than 3 clicks.
- Reliability: The system shall allow 30 users to use the system during the same time without a decrease in performance.
- Accessibility: The system shall support the latest versions of Chrome, Firefox, and Edge with page load times under 2 seconds.

### US-09: Configure Allowed Trigger Object Types

**As a** system operator, **I want to** save allowed trigger object types (person/vehicle/animal) **so that** the monitoring system can filter alarms based on relevant objects.

**Acceptance Criteria**:

- System operator can configure object types that are allowed (e.g., person, vehicle, animal).
- Configured object types are stored and applied to alarm filtering.
- Operator can edit or remove previously configured trigger object types.

**Applicable NFRs**:

- Security: Sensitive data (accounts, alarms, snapshots, logs with personal data) shall be encrypted at rest (e.g., AES-256).
- Security: The system shall allow only authenticated system admins to configure schedules.
- Reliability: The system shall allow 30 users to use the system during the same time without a decrease in performance.
- Reliability: The system shall maintain a false alarm rate below 10%.
- Accessibility: The system shall support the latest versions of Chrome, Firefox, and Edge with page load times under 2 seconds.

### US-10: Automatic Deterrence Broadcast

**As a** security operator, **I want** the system to automatically play warning messages when intrusions are detected **so that** intruders are warned immediately without me having to act.

**Acceptance Criteria**:

- When an alarm triggers, the system automatically selects the closest speaker
- A warning message plays immediately through the selected speaker

**Applicable NFRs**:

- Reliability: The system shall be able to recover within 60 seconds if it crashes.

### US-11: Manual Deterrence Control

**As a** security operator, **I want to** manually trigger a deterrence message **so that** I can intervene directly.

**Acceptance Criteria**:

- Operator can select a speaker.
- Operator can trigger deterrence message.

**Applicable NFRs**:

- Security: The system shall allow only authenticated operators to trigger a deterrence message.

### US-12: User and Role Management

**As a** system admin, **I want to** create accounts and assign roles **so that** only authorized users access system functions.

**Acceptance Criteria**:

- Admin can create and delete accounts.
- Admin can assign operator or admin roles.

**Applicable NFRs**:

- Security: Idle sessions auto-expire after ≤ 30 min.
- Reliability: The system shall be able to recover within 60 seconds if it crashes.

### US-13: Add Notes or Tags to Alarms

**As a** security operator, **I want to** add notes or tags to an alarm **so that** additional context and information can be attached for future reference or investigation.

**Acceptance Criteria**:

- Security operator can add text notes to an alarm.
- Security operator can add tags (keywords) to categorize alarms.
- Notes and tags are stored with the alarm and visible in future reviews.

**Applicable NFRs**:

- Security: The system shall document lawful basis, purpose limitation, retention policy, and support data-subject rights (access/erasure/export) for personal data processed.
- Security: Sensitive data (accounts, alarms, snapshots, logs with personal data) shall be encrypted at rest (e.g., AES-256).
- Reliability: The system shall be available at least 99% of the time.
- Accessibility: The system shall support the latest versions of Chrome, Firefox, and Edge with page load times under 2 seconds.
