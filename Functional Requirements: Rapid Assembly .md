Functional Requirements: Rapid Assembly of Cross-Functional Delivery Squads
The following functional requirements use the EARS format and apply to the prototype for capturing delivery needs, matching required skills to mock internal talent data, ranking suitable candidates, and assembling a proposed cross-functional squad using transparent rules.
Delivery Need Capture and Validation
REQ-001: The system shall allow a delivery lead to create a new delivery squad request using mock delivery, skill, employee, and availability data.
REQ-002: The system shall capture the work request title, business unit, delivery objective, required roles, required skills, urgency, expected start date, expected duration, and required capacity for each squad request.
REQ-003: When a delivery lead submits a squad request, the system shall validate that all mandatory request fields have been completed.
REQ-004: If any mandatory squad request field is missing, then the system shall prevent submission and display the specific field or fields requiring completion.
REQ-005: If the expected duration is zero, negative, or not numeric, then the system shall reject the value and prompt the user to enter a valid duration.
REQ-006: If the expected start date is earlier than the current date, then the system shall display a validation message and prevent candidate matching.
Skill, Role, and Availability Inputs
REQ-007: The system shall support squad requests for a sample internal talent pool within one business unit only.
REQ-008: The system shall allow the delivery lead to specify required roles such as architect, engineer, tester, data specialist, business analyst, and delivery lead.
REQ-009: When a delivery lead selects a required role, the system shall display relevant skills associated with that role.
REQ-010: The system shall allow the delivery lead to mark each required skill as mandatory or preferred.
REQ-011: The system shall represent candidate availability using simple capacity indicators such as available, partially available, unavailable, or percentage allocation.
REQ-012: If a required skill is not available in the predefined mock skill list, then the system shall allow the delivery lead to classify the skill as other and provide a short description.
Rules-Based Candidate Matching and Ranking
REQ-013: When the delivery lead requests squad recommendations, the system shall evaluate mock internal candidates using skill match, role alignment, availability, workload, and urgency.
REQ-014: The system shall calculate a candidate match score based on the number of mandatory and preferred skills matched against the squad request.
REQ-015: If a candidate does not match any mandatory skill for a requested role, then the system shall exclude the candidate from the recommended shortlist for that role.
REQ-016: If a candidate is marked as unavailable during the requested delivery period, then the system shall exclude the candidate from the recommended shortlist.
REQ-017: If a candidate is partially available, then the system shall reduce the candidate ranking according to the configured availability weighting.
REQ-018: If a candidate workload exceeds the configured workload threshold, then the system shall reduce the candidate ranking or mark the candidate as high workload.
REQ-019: Where urgency is marked as high, the system shall prioritise candidates with immediate availability over candidates with a higher skill score but limited availability.
REQ-020: While multiple candidates have the same match score, the system shall rank the candidate with greater availability higher in the shortlist.
REQ-021: While a squad request has insufficient matching candidates, the system shall display a gap indicator for the unfilled role or skill.
Recommendation Output and Squad Selection
REQ-022: When matching is completed, the system shall display a ranked shortlist of suitable internal candidates for each requested role.
REQ-023: The system shall display each recommended candidate’s role, matched skills, availability indicator, workload indicator, and overall match score.
REQ-024: The system shall display the rule or rules that caused each candidate to be recommended, reduced in ranking, excluded, or flagged.
REQ-025: When a ranked shortlist is displayed, the system shall allow the delivery lead to select one or more candidates as a proposed squad.
REQ-026: If the delivery lead selects a candidate who is partially available or marked as high workload, then the system shall display a warning before adding the candidate to the proposed squad.
REQ-027: While the proposed squad does not cover all mandatory roles, the system shall display the missing role or roles before the request can be finalised.
REQ-028: When a proposed squad is completed, the system shall allow the delivery lead to review the delivery request details, selected candidates, coverage gaps, and recommendation explanations before resetting or closing the request.

