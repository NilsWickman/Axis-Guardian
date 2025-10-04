# Requirements Matrix
## Video Surveillance System - Axis Communications

## Functional Requirements

### Site Setup & Configuration

| FR ID | Requirement | Priority | Dependencies | Estimated Hours |
|-------|-------------|----------|--------------|-----------------|
| FR-01 | The system shall allow the system admin to create a new site | H | None | 20 |
| FR-02 | The system shall allow the system admin to edit site settings | H | FR-01 | 2 |
| FR-03 | The system shall allow the system admin to register a camera with ID, IP and model | H | None | 8 |
| FR-04 | The system shall allow the system admin to upload floor plans from which the system shall create a site map | H | FR-01 | 20 |
| FR-05 | The system shall allow the system admin to store camera positions, headings and heights in the floor plan | H | FR-03, FR-04 | 8 |
| FR-06 | The system shall be able to add a speaker with a unique ID and associated location | H | FR-04 | 4 |
| FR-07 | The system shall allow the system admin to draw and mark a zone that represents the area that is prohibited for intruders | H | FR-04 | 8 |
| FR-08 | The system shall have the options to remove or edit the marked surveillance zones | H | FR-07 | 2 |
| FR-09 | The system shall allow the system admin to create a virtual line drawn on the 2D representation of the area | M | FR-04 | 2 |
| FR-10 | The system shall allow the system admin to update the virtual crosslines | M | FR-09 | 1 |
| FR-11 | The system shall allow the system admin to remove the virtual crosslines and site zones | M | FR-09, FR-07, FR-10 | 1 |
| FR-12 | The system shall have a schedule for when the alarmed zone is active | H | FR-07 | 4 |
| FR-13 | The system shall allow the system admin to edit the schedule for when the alarmed zone is active | H | FR-12 | 1 |

### Detection & Alarm Generation

| FR ID | Requirement | Priority | Dependencies | Estimated Hours |
|-------|-------------|----------|--------------|-----------------|
| FR-14 | The system shall keep track of object across multiple-cameras and multiple zones | H | FR-03, FR-07, FR-28 | 40 |
| FR-15 | The system shall in real time evaluate zone crossings and directions of the intruder | H | FR-14 | 10 |
| FR-16 | The system shall show what coordinates the intruder is located on and allow the security operator to track the intruder live on the site map in case of an alarm | H | FR-04, FR-15 | 8 |
| FR-17 | The system shall create an alarm event with the information available | H | FR-15 | 4 |
| FR-18 | The system shall collect evidence with snapshots/clips from cameras in case of an intruder | H | FR-03, FR-17 | 8 |
| FR-19 | The system shall be able to display current alarms and their status | H | FR-17 | 8 |
| FR-20 | The system shall show the details about the alarm such as object types, characteristics, time, coordinates | H | FR-16, FR-17 | 8 |
| FR-21 | The system shall automatically select the camera that has the best view of the intruder, based on confidence score of the metadata | M | FR-03, FR-14 | 20 |
| FR-22 | The system shall always broadcast a deterrence message to the loudspeakers, in event of an alarm | H | FR-06, FR-17 | 10 |
| FR-23 | The system shall automatically select the loudspeaker nearest to the intruder and trigger deterrence messages | H | FR-05, FR-06, FR-16 | 8 |

### Operator Actions

| FR ID | Requirement | Priority | Dependencies | Estimated Hours |
|-------|-------------|----------|--------------|-----------------|
| FR-24 | The system shall allow the security operator to click on the map and get the view from the camera on that location | H | FR-03, FR-04 | 4 |
| FR-25 | The system shall allow the security operator to mark an alarm as confirmed and issue/create an incident | H | FR-17 | 20 |
| FR-26 | The system shall allow the security operator to contact the alarm center | M | FR-25 | 20 |
| FR-27 | The system shall allow the security operator to close an alarm as a false alarm and record the reason for dismissal | H | FR-17 | 2 |
| FR-28 | The system shall allow the system operator to save allowed trigger object types (person/vehicle/animal) | M | None | 8 |
| FR-29 | The system shall allow the system operator to turn on and off the alarm system | M | FR-12 | 8 |
| FR-30 | The system shall allow the security operator to add notes or tags to an alarm for additional information | L | FR-25 | 8 |
| FR-31 | The system shall allow the security operator to manually trigger a deterrence message in event of an alarm | M | FR-06, FR-25| 8 |
| FR-32 | The system shall allow security operator to close an incident and shall require that all mandatory closure information (e.g., an outcome category and a closure note) is provided before the action can proceed | H | FR-25 | 10 |

### Governance and Operations

| FR ID | Requirement | Priority | Dependencies | Estimated Hours |
|-------|-------------|----------|--------------|-----------------|
| FR-33 | The system shall give the system admin the ability to create new user accounts | H | None | 40 |
| FR-34 | The system shall give the system admin exclusive rights to assign roles to other users | H | FR-33 | 4 |

## Non-Functional Requirements

### Security

| NFR ID | Requirement | Priority | Affects | Verification Method |
|--------|-------------|----------|---------|-------------------|
| NFR-01 | The system shall document lawful basis, purpose limitation, retention policy, and support data-subject rights (access/erasure/export) for personal data processed | H | All data processing components | Documentation review, GDPR audit |
| NFR-02 | Sensitive data (accounts, alarms, snapshots, logs with personal data) shall be encrypted at rest (e.g., AES-256) | H | FR-17, FR-18, FR-33 | Security testing, encryption verification |
| NFR-03 | Idle sessions auto-expire after ≤ 30 min | H | All user interfaces | Session timeout testing |
| NFR-04 | The system shall allow only authenticated system admins to configure zones/lines | H | FR-07, FR-08, FR-09, FR-10, FR-11, FR-33 | Authentication testing |
| NFR-05 | The system shall allow only authenticated system admins to configure schedules | H | FR-12, FR-13, FR-33 | Authentication testing |
| NFR-06 | The system shall allow only authenticated operators to confirm or dismiss alarms | H | FR-25, FR-27, FR-33 | Authentication testing |
| NFR-07 | The system shall allow only authenticated operators to trigger a deterrence message | M | FR-31, FR-33 | Authentication testing |

### Reliability

| NFR ID | Requirement | Priority | Affects | Verification Method |
|--------|-------------|----------|---------|-------------------|
| NFR-08 | The system shall allow 30 users to use the system during the same time without a decrease in performance | H | All system components | Load testing |
| NFR-09 | The system shall be available at least 99% of the time | H | All system components | Uptime monitoring |
| NFR-10 | The system shall be able to recover within 60 seconds if it crashes | H | Core system services | Failover testing |
| NFR-11 | The system shall maintain a false alarm rate below 10% | H | FR-14, FR-15, FR-17 | Statistical analysis |

### Usability

| NFR ID | Requirement | Priority | Affects | Verification Method |
|--------|-------------|----------|---------|-------------------|
| NFR-12 | The user shall be able to confirm or dismiss an alarm with no more than 3 clicks | H | FR-25, FR-27 | Usability testing |
| NFR-13 | The user shall be able to watch live-video with no more than 3 clicks | H | FR-24 | Usability testing |
| NFR-14 | The user shall be able to upload a floor plan with no more than 5 clicks | M | FR-04 | Usability testing |
| NFR-15 | The user shall be able to edit or remove restricted areas with no more than 4 clicks | M | FR-08 | Usability testing |

### Accessibility

| NFR ID | Requirement | Priority | Affects | Verification Method |
|--------|-------------|----------|---------|-------------------|
| NFR-16 | The system shall support the latest versions of Chrome, Firefox, and Edge with page load times under 2 seconds | H | All web interfaces | Performance testing, browser compatibility testing |
