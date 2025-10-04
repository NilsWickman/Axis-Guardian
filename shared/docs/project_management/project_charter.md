# AXIS Security Surveillance System - Project Charter

**Project Name:** AXIS Site-Level Security Surveillance System
**Document Version:** 1.1
**Date:** 2025-09-17
**Course:** Software Engineering
**Team Size:** 24 members

---

## 1. Executive Summary

Development of a site-level security surveillance system for Axis Communications that provides comprehensive facility monitoring, reduces false alarms, and enables proactive threat response through geo-positioned detection and intelligent alerting.

## 2. Project Vision & Objectives

### Vision Statement
Create a demonstrable security surveillance solution that transforms reactive camera monitoring into proactive site-level awareness, reducing operator workload while improving security response effectiveness.

### Primary Objectives
1. Develop core detection and alerting system based on virtual site maps
2. Integrate with Axis cameras using IPv4/RTSP protocols via Axis API
3. Implement geo-positioned tracking across multiple camera feeds
4. Create intuitive operator interface for alarm management
5. Demonstrate feasibility of advanced features (LLM integration, heatmaps, analytics)

### Success Criteria
- **Technical Innovation:** Novel approaches to multi-camera coordination and false alarm reduction
- **Working Demo:** Stable demonstration of core features in simulated environment
- **Documentation Quality:** Comprehensive technical and user documentation
- **Learning Outcomes:** Team skill development in real-time systems and computer vision

## 3. Stakeholders

| Stakeholder | Role | Interest/Influence |
|------------|------|-------------------|
| University Professor | Evaluator | Grades final deliverable |
| Axis Communications | Industry Partner | Provides APIs, cameras, domain expertise |
| End Users (simulated) | Schools, Retail, Industry | Security personnel needing site awareness |
| Student Team | Developers | Building and learning from the system |

## 4. Project Scope

### In Scope
- **Core Features (Must Have)**
  - Virtual site map with camera placement
  - Zone and virtual cross-line definition at site level
  - Multi-camera detection correlation and object tracking
  - Camera time synchronization validation
  - Alarm generation with prioritization system
  - Multi-role user management (Admin vs Security Operator)
  - Live video viewing with map overlay
  - Snapshot/video evidence collection with GDPR compliance
  - Loudspeaker integration with test tone validation
  - Formal incident management workflow with closure requirements
  - Alarm dismissal with reason tracking
  - Note/tag system for alarms

- **Advanced Features (Should Have)**
  - Movement heatmaps
  - Object tracking visualization
  - Alarm statistics and analytics
  - Schedule-based zone activation with override capability
  - False alarm suppression algorithms
  - Object type filtering (person/vehicle/animal)

- **Experimental Features (Could Have)**
  - LLM-based system interaction with natural language queries
  - Advanced object classification
  - Predictive analytics
  - Mobile interface
  - Natural language data retrieval (e.g., "Show this morning's intrusion in Zone A")

### Out of Scope
- Physical security hardware installation
- Integration with non-Axis camera systems
- 24/7 production deployment
- Outdoor camera/speaker deployment (indoor only)
- System-level detection algorithms (handled by cameras)

## 5. Deliverables

### Technical Deliverables
1. **Microservices Architecture**
   - Frontend service (operator interface)
   - Comms service (camera/device integration)
   - Intelligence service (detection/analytics)
   - Shared libraries and utilities
   - User role management system
   - Incident tracking and management module

2. **Proof of Concepts**
   - RTSP/IPv4 camera integration
   - Multi-camera correlation algorithm
   - Map-based visualization
   - Alarm prioritization algorithm
   - Speaker integration with test tone validation

3. **Demo System**
   - Simulated environment with 5-10 virtual cameras
   - Pre-recorded scenarios showing key features
   - Live demonstration capability
   - Multi-role access demonstration

### Documentation Deliverables
1. Requirements Specification
2. System Architecture Document
3. API Documentation
4. User Manual
5. Deployment Guide
6. Demo Scripts

## 6. Team Organization

### Department Structure

**P&S Department (11 members)**
- **Product Manager (1):** Product vision, stakeholder communication
- **Analysts (6):** Requirements gathering, user stories, acceptance criteria, GDPR compliance analysis
- **Testers (3):** Test planning, acceptance testing, quality assurance, speaker integration testing
- **Quality Coordinator (1):** Process compliance, documentation standards, data privacy requirements

**R&D Department (11 members)**
- **R&D Manager (1):** Technical leadership, architecture decisions
- **System Architect (1):** System design, technology selection
- **UX Designer (1):** Interface design, user experience
- **Developers (8):** Implementation across three services

**Shared Leadership (1 member)**
- **Project Coordinator:** Inter-department communication, timeline management

## 7. Constraints & Assumptions

### Constraints
- **Timeline:** One semester (~14-16 weeks)
- **Team Experience:** Low experience with real-time systems and computer vision
- **Resources:** Limited to university computing resources and Axis-provided APIs
- **Demo Environment:** Simulated rather than physical deployment
- **Deployment:** Indoor-only camera and speaker systems
- **Accuracy:** Geo-positioning must be within 3 meters of true position

### Assumptions
- Axis API documentation and support will be available
- Team members can dedicate 8 hours per week
- University provides necessary computing infrastructure
- RTSP streams can be simulated for testing
- Users must authenticate to access system functions
- Cameras operate continuously (24/7)
- Detection and identification handled by cameras (not system-level)
- System will support object type classification (person/vehicle/animal)

### Uncertainties (To Be Resolved)
- Exact camera integration protocol details
- Geo-positioning accuracy requirements
- Performance/latency requirements
- Scale requirements (number of cameras/zones)
- Specific LLM integration use cases
- 2D vs 3D map representation

## 8. Risk Management

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| Low team technical experience | High | High | PoC phases, learning sprints, external mentorship |
| Integration complexity with Axis APIs | High | Medium | Early API exploration, Axis support engagement |
| Scope creep with many features | High | High | Strict MVP definition, feature prioritization |
| Inter-department coordination | Medium | Medium | Clear interfaces, regular communication |
| Performance issues with real-time processing | High | Medium | Early performance testing, scalability planning |

## 9. Project Approach

### Phase 1: Foundation (Weeks 1-3)
- Team formation and role assignment
- Technology stack evaluation and selection
- Development environment setup
- Initial PoCs for critical technologies

### Phase 2: Core Development (Weeks 4-10)
- Sprint 1-2: Basic map visualization and camera integration
- Sprint 3-4: Detection and zone definition
- Sprint 5-6: Alarm generation and management
- Sprint 7: Integration and stabilization

### Phase 3: Enhancement (Weeks 11-13)
- Advanced features based on core stability
- Performance optimization
- UI/UX refinement

### Phase 4: Delivery (Weeks 14-16)
- System integration and testing
- Documentation completion
- Demo preparation and rehearsal
- Final presentation

## 10. Success Metrics

### Technical Metrics
- Detection accuracy: >80% true positive rate
- Geo-positioning accuracy: ≤3 meters from true position
- False alarm reduction: >50% compared to single-camera approach
- System latency: <2 seconds from detection to alert
- Multi-camera object tracking: >90% consistency across cameras
- Code coverage: >70% unit test coverage
- User role separation: 100% compliance with Admin/Operator permissions

### Project Metrics
- Feature completion: 100% core, >60% advanced features
- Documentation completeness: All listed deliverables
- Demo stability: Zero critical failures during presentation

### Learning Metrics
- Technology competence: All team members contribute code
- Knowledge transfer: Cross-functional understanding documented

## 11. Communication Plan

### Internal Communication
- **Discord:** Daily communication
- **GitLab:** Code reviews, issue tracking
- **GitLab:** Task management

### External Communication
- **Weekly:** Progress reports to professor
- **bi-weekly:** Demo to Axis stakeholders
- **As needed:** Technical support requests

## 12. Budget & Resources

### Required Resources
- Axis API access and documentation
- Development servers/cloud instances
- Version control (GitLab)
- CI/CD pipeline
- Testing environments

### Optional Resources
- Axis camera hardware (for validation)
- GPU resources (for ML processing)
- External technical advisors

---

## Appendix A: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-14 | Team | Initial charter creation |
| 1.1 | 2025-09-17 | Team | Aligned with SRS requirements, added role management, incident workflow, GDPR compliance, indoor constraints, and geo-positioning accuracy metrics |

## Appendix B: Glossary

- **RTSP:** Real Time Streaming Protocol
- **PoC:** Proof of Concept
- **MVP:** Minimum Viable Product
- **LLM:** Large Language Model
- **Site-level:** Facility-wide perspective vs individual camera view
- **Cross-line:** Virtual boundary that triggers alerts when crossed
- **Geo-positioned:** Location-aware within the facility coordinate system