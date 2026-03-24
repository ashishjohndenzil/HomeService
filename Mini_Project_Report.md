# Mini Project Report

**Project Name**
HomeService Booking Application

**[Details]**
A comprehensive web-based platform connecting users with reliable household service providers. The application facilitates dynamic service discovery, automated price estimation and booking, secure local and Google OAuth authentication, and a robust review management system through roles-specific user dashboards.

---

**Submitted by**
[Name of Student]
**Reg. No.:** AJC00MCA-0000

In Partial fulfillment for the Award of the Degree of
**INTEGRATED MASTER OF COMPUTER APPLICATIONS**

**(INMCA)**

**AMAL JYOTHI COLLEGE OF ENGINEERING AUTONOMOUS**
**KANJIRAPPALLY**

[Approved by AICTE, Accredited by NAAC with A+. 
Koovappally, Kanjirappally, Kottayam, Kerala – 686518]

**2025-2026**

**DEPARTMENT OF COMPUTER APPLICATIONS**
**AMAL JYOTHI COLLEGE OF ENGINEERING AUTONOMOUS**
**KANJIRAPPALLY**

---

## CERTIFICATE

This is to certify that the Project report, "**HomeService Booking Application**" is the bona fide work of **[STUDENT NAME] (Regno: AJC00MCA-0000)** carried out in partial fulfillment of the requirements for the award of the Degree of Integrated Master of Computer Applications at Amal Jyothi College of Engineering Autonomous, Kanjirappally. The project was undertaken during the period from December 01, 2025 to March 27, 2026.

[Guide Name] &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [Coordinator Name]  
Internal Guide &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Coordinator


**Dr. Bijimol T K**
Head of the Department

---

## DECLARATION

I hereby declare that the project report "**HomeService Booking Application**" is a bona fide work done at Amal Jyothi College of Engineering Autonomous, Kanjirappally, towards the partial fulfilment of the requirements for the award of the Integrated Master of Computer Applications (INMCA) during the period from December 01, 2025 to March 27, 2026. 

**Date:**  
**KANJIRAPPALLY** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **[STUDENT NAME]**  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Reg:** AJC00MCA-0000

---

## ACKNOWLEDGEMENT

First and foremost, I thank God almighty for his eternal love and protection throughout the project. I take this opportunity to express my gratitude to all who helped me in completing this project successfully. It has been said that gratitude is the memory of the heart. I wish to express my sincere gratitude to our Director (Administration) Rev. Fr. Dr. Roy Abraham Pazhayaparampil and Principal Dr. Lillykutty Jacob for providing good faculty for guidance.

I owe a great depth of gratitude towards our Head of the Department Dr. Bijimol T K for helping us. I extend my whole hearted thanks to the project coordinator **[Coordinator Name]** for her valuable suggestions and for overwhelming concern and guidance from the beginning to the end of the project. I would also express sincere gratitude to my guide **[Guide Name]** for his inspiration and helping hand.

I thank our beloved teachers for their cooperation and suggestions that helped me throughout the project. I express my thanks to all my friends and classmates for their interest, dedication, and encouragement shown towards the project. I convey my hearty thanks to my family for the moral support, suggestions, and encouragement to make this venture a success.

**[STUDENT NAME]**

---

## ABSTRACT

The HomeService Booking Application is an intuitive and automated digital portal developed to connect customers seamlessly with reliable household service professionals. Addressing the fragmented nature of localized service acquisition, this platform offers a comprehensive infrastructure for service discovery, scheduling, and reliable billing estimations. Built using a robust architecture of PHP, MySQL, and secure JSON RESTful APIs interacting with a dynamic Vanilla JavaScript frontend, the application incorporates distinct operational dashboards customized for Customers, Service Providers, and Administrators.

Key functionalities include dynamic service configurations (such as Plumbing, Electrical, Cleaning), an automated price calculation engine that sets rates based on temporal duration mapping against standardized provider tariffs, and a secure multi-strategy authentication layer featuring Google OAuth 2.0 integration alongside local mechanisms with encrypted credentials. Furthermore, the platform integrates the **Cashfree Payment Gateway** to facilitate secure, encrypted digital transactions directly within the logistical booking flow. The system guarantees reliable quality assurance by integrating a verified review mechanism, ensuring that service providers establish verifiable algorithmic reputations. HomeService transforms the previously ad hoc booking lifecycle into a predictable, transparent, and manageable sequence of scalable digital workflows.

---

## CONTENT
1. INTRODUCTION
 1.1 PROJECT OVERVIEW
 1.2 PROJECT SPECIFICATION
2. SYSTEM STUDY
 2.1 INTRODUCTION
 2.2 EXISTING SYSTEM
 2.3 DRAWBACKS OF EXISTING SYSTEM
 2.4 PROPOSED SYSTEM
 2.5 ADVANTAGES OF PROPOSED SYSTEM
3. REQUIREMENT ANALYSIS
 3.1 FEASIBILITY STUDY
   3.1.1 ECONOMICAL FEASIBILITY
   3.1.2 TECHNICAL FEASIBILITY
   3.1.3 BEHAVIORAL FEASIBILITY
   3.1.4 FEASIBILITY STUDY QUESTIONNAIRE
   3.1.5 GEOTAGGED PHOTOGRAPH
 3.2 SYSTEM SPECIFICATION
   3.2.1 HARDWARE SPECIFICATION
   3.2.2 SOFTWARE SPECIFICATION
 3.3 SOFTWARE DESCRIPTION
   3.3.1 PHP
   3.3.2 MYSQL
4. SYSTEM DESIGN
 4.1 INTRODUCTION
 4.2 UML DIAGRAM
   4.2.1 USE CASE DIAGRAM
   4.2.2 SEQUENCE DIAGRAM
   4.2.3 STATE CHART DIAGRAM
   4.2.4 ACTIVITY DIAGRAM
   4.2.5 CLASS DIAGRAM
   4.2.6 OBJECT DIAGRAM
   4.2.7 COMPONENT DIAGRAM
   4.2.8 DEPLOYMENT DIAGRAM
   4.2.9 COLLABORATION DIAGRAM
 4.3 USER INTERFACE DESIGN USING FIGMA
 4.4 DATABASE DESIGN
5. SYSTEM TESTING
 5.1 INTRODUCTION
 5.2 TEST PLAN
   5.2.1 UNIT TESTING
   5.2.2 INTEGRATION TESTING
   5.2.3 VALIDATION TESTING
   5.2.4 USER ACCEPTANCE TESTING
   5.2.5 AUTOMATION TESTING
   5.2.6 SELENIUM TESTING
6. IMPLEMENTATION
 6.1 INTRODUCTION
 6.2 IMPLEMENTATION PROCEDURE
   6.2.1 USER TRAINING
   6.2.2 TRAINING ON APPLICATION SOFTWARE
   6.2.3 SYSTEM MAINTENANCE
7. CONCLUSION & FUTURE SCOPE
 7.1 CONCLUSION
 7.2 FUTURE SCOPE
8. BIBLIOGRAPHY
9. APPENDIX
 9.1 SAMPLE CODE
 9.2 SCREEN SHOTS
 9.3 GEO-TAGGED PHOTOS PANEL REVIEW 1 & 2
 9.4 GIT LOG

---

# CHAPTER 1 - INTRODUCTION

## 1.1 PROJECT OVERVIEW
HomeService is a comprehensive web-based platform designed to connect users seamlessly with reliable and verified household service providers. The application mitigates the traditional challenges of finding trusted professionals for everyday maintenance tasks by offering a unified portal for service discovery, booking, and review management. Catering to a diverse range of services, including but not limited to Plumbing, Electrical work, Cleaning, Carpentry, Painting, and General Repairs, the platform serves as a modern multi-sided marketplace. 

It supports three distinct user roles—Customers, Service Providers, and Administrators—each equipped with specialized functionalities and personalized dashboards. By integrating robust modern web technologies and secure data structures, HomeService ensures a streamlined user experience, fostering operational trust and communicative efficiency in the household service sector.

## 1.2 PROJECT SPECIFICATION
The HomeService system is engineered to provide an end-to-end operational solution, featuring:
*   **User Management:** Secure user registration and session management via local credentials (with hashed passwords) and seamless Google OAuth 2.0 single sign-on integration. Password recovery is secured dynamically utilizing Gmail SMTP routing via PHPMailer.
*   **Dynamic Booking System & Payment Gateway:** Customers can select precise services (Plumbing, Electrical, Cleaning, Carpentry, Painting, Appliance Repair, Other), specify dates and times, and benefit from an automated price estimation engine that calculates up-front costs dynamically based on service duration multiplied by standardized average provider rates. Transactions are securely finalized through the **Cashfree Payment API**, utilizing programmatic `payment_session_id` exchanges and webhook verifications to confirm secure digital settlements explicitly before job initiation.
*   **Role-Specific Dashboards:** 
    *   *Customers* track historical booking logs, monitor current job states (Pending, Confirmed, Completed, Cancelled), and publish service reviews.
    *   *Providers* manage their distinct public profiles, accept localized incoming service requests, update their bio, experience, and hourly rates, and build an aggregated digital reputation.
    *   *Administrators* command system oversight, manage default service operational statuses, review system-wide booking statistics, and supervise user conduct.
*   **Review and Rating System:** A consolidated, mathematically formulated rating system wherein only confirmed customers can evaluate and provide feedback for concluded service interactions (1-5 star scaling), which aggregates into the provider's overall profile rating.
*   **Secure API Architecture:** The application utilizes a JSON-based RESTful API architecture built in PHP, separating the frontend logic from the backend data persistence layer.

---

# CHAPTER 2 - SYSTEM STUDY

## 2.1 INTRODUCTION
This phase involves a meticulous analysis of the legacy methodologies employed by individuals seeking household services, juxtaposed against the mechanisms by which service professionals historically acquire clientele. By accurately identifying inherent operational friction points, we architected software logic that explicitly addresses systemic market limitations, transitioning a fragmented manual sector into a structured digital pipeline.

## 2.2 EXISTING SYSTEM

### 2.2.1 NATURAL SYSTEM STUDIED
Conventionally, securing professional household services relies upon localized, informal networks such as word-of-mouth recommendations, physical directory checking, classified newspaper advertisements, or rudimentary local listings. Service professionals similarly remain dependent on unpredictable local referrals or physical promotional materials to find consistent work pipelines.

### 2.2.2 DESIGNED SYSTEM STUDIED
Prevailing digital alternatives often serve merely as unverified lead-generation directories rather than enclosed logistical frameworks. Users locate contact mechanisms online but are still required to manually execute price negotiations, navigate untracked schedule synchronizations, and blindly trust arbitrary professional credibility metrics. Such systems inherently lack binding integrations, automated confirmations, or unified pricing indices.

## 2.3 DRAWBACKS OF EXISTING SYSTEM
*   **Absence of Verified Reliability:** Customers lack standardized, verifiable methodologies to assess the quality or trustworthiness of a service provider preceding hiring.
*   **Opaque & Disputed Pricing:** Project costs are habitually determined through ad hoc verbal negotiations upon physical arrival, frequently culminating in financial disputes and structural opacity.
*   **Inefficient Synchronization:** Manual coordination of availability schedules generates conflicts, persistent communication overhead, and missed appointments.
*   **Uncentralized Accountability:** Fragmented operations prohibit the establishment of historical quality metrics; exceptional providers often lack the mechanisms to stand out organically.
*   **Lack of Unified Portals:** Finding a plumber requires a different channel than finding an electrician.
*   **Insecure Data Management:** Manual tracking of customer details and service histories leads to data loss and privacy concerns.
*   **No Dispute Resolution Mechanism:** Without an official record of the agreed-upon service and price, resolving disputes is difficult.

## 2.4 PROPOSED SYSTEM
The proposed HomeService application is a comprehensive web infrastructure that digitizes and centralizes the interaction layer bridging customers and independent service professionals. Acting as an intelligent automated logistical broker, the software normalizes the lifecycle of a service transaction. It empowers customers to autonomously explore delineated service domains, dissect provider metrics, and dispatch algorithmic booking initiations seamlessly. 

The inclusion of an instantaneous automated rate estimation mechanic eliminates arbitrary pricing discrepancies by establishing hard constraints directly onto the required hourly volume prior to job commitment. This is actively reinforced via the **Cashfree Payment Gateway API**, securely processing digital remuneration transactions encrypting customer financial payloads externally from the local database environment. Followed by a strict review apparatus mapping uniquely verified bookings to mathematical provider ratings, the system scales functional accountability reliably. The system enforces local authentication alongside Google OAuth 2.0 to ensure a frictionless onboarding process while maintaining security.

## 2.5 ADVANTAGES OF PROPOSED SYSTEM
*   **Unified Service Marketplace:** Consolidates disparate categories (Plumbing, Cleaning, Repairs) into a singular navigational taxonomy.
*   **Automated Fiscal Transparency:** Pre-calculates exact booking amounts programmatically (Rate × Duration), preempting manual fiscal conflicts.
*   **Intelligent Routing:** Streamlined interfaces process booking logistics instantly without necessitating arbitrary intermediary communication.
*   **Cryptographic Security Protocol:** Operates over sophisticated multiple authentication tracks (OAuth/Local Hash) strictly managed via session protocols alongside rigorous PDO SQL data sanitization.
*   **Immutable Review Architecture:** Qualitatively shields ratings algorithms by permitting only conclusively verified bookings to adjust provider scores.
*   **Architectural Extensibility:** Data structural flexibility allows instantaneous deployment of parallel service categories matching regional market expansions.
*   **Role-Based Access Control:** Secure boundaries between Customer, Provider, and Admin domains prevent unauthorized data manipulation.
*   **Responsive Design:** The Vanilla Javascript frontend provides a dynamic user experience that scales seamlessly across desktop and mobile browsers.

---

# CHAPTER 3 - REQUIREMENT ANALYSIS

## 3.1 FEASIBILITY STUDY
The feasibility study is an essential phase in the software development life cycle. It assesses the practicality of the proposed project, evaluating technical, economical, and behavioral aspects to ensure the project's viability before committing extensive resources.

### 3.1.1 Economical Feasibility
The platform maintains outstanding economic viability via extensive deployment of robust open-source technologies (PHP, MySQL, Vanilla JS). Relieving dependencies on heavily licensed premium developmental environments vastly minimizes baseline operational expenditures. Routine execution mandates nominal outlays strictly relegated to standard regional hosting configurations, facilitating cost-effective launch trajectories. The cost incurred during the development phase is minimal, primarily involving development hours and standard hardware.

### 3.1.2 Technical Feasibility
The technical feasibility is intrinsically high owing to the employment of the proven LAMP/XAMPP-style application architecture. PHP's superior backend logic interfaces optimally with secure MySQL datastores for processing thousands of complex multi-table queries smoothly. Developing asynchronous client-rendered components utilizing modular Vanilla JavaScript establishes an exceptionally stable technical baseline scalable across standard web browsers effortlessly. The use of PDO (PHP Data Objects) ensures that all database interactions are secure against SQL injection attacks.

### 3.1.3 Behavioral Feasibility
Cognitive navigational friction is fundamentally negated. Designed mirroring established, universally standardized e-commerce ordering flows, consumers possessing elementary digital traversal skills interact intuitively with temporal selections, dashboard monitoring structures, and profile integrations without incurring procedural learning curves. The adoption rate among targeted users is expected to be high due to the application's familiar interface paradigms.

### 3.1.4 Feasibility Study Questionnaire
*(Attach Feasibility Surveys / Raw analytical outcomes here, detailing responses from potential users regarding their pain points with conventional service booking)*

### 3.1.5 Geotagged Photograph
*(Attach Geotagged reference images here, representing the physical operational contexts or team development environments)*

## 3.2 SYSTEM SPECIFICATION

### 3.2.1 Hardware Specification
*   **Processor:** Intel Core i3 or equivalent Modern Multi-Core Processor Architecture
*   **RAM:** 4GB minimum (8GB recommended for optimal server operation)
*   **Hard disk:** 20GB available threshold memory 
*   **Network:** Standard Broadband connection for server deployment

### 3.2.2 Software Specification
*   **Front End:** HTML5, CSS3, Vanilla JavaScript, AJAX
*   **Back End:** PHP 8.x
*   **Database:** MySQL Server (via XAMPP/WAMP or equivalent)
*   **Client on PC:** Windows 7/10/11, macOS, standard modern Web Browsers (Chrome, Firefox, Edge, Safari)
*   **Technologies used:** JS, HTML5, AJAX, PHP, CSS, RESTful Endpoints, PDO (PHP Data Objects), JSON
*   **External APIs:** Google Identity Services (OAuth 2.0), Cashfree Payment API (cURL requests mapping to `api.cashfree.com`)

## 3.3 SOFTWARE DESCRIPTION

### 3.3.1 PHP
PHP (Hypertext Preprocessor) operates as the primary server-side scripting nexus dictating the application's underlying logical architecture. Beyond generic templating, PHP engineers standalone secure RESTful API endpoints managing profound operations ranging from dynamic session state retention, OAuth token validation decoding, to mathematically projecting the service estimation calculations. Its integration of PDO (PHP Data Objects) is an essential architectural characteristic ensuring SQL injection circumvention through the strict usage of prepared statements. The backend is structured into distinct API files handles unique responsibilities (e.g., `login.php`, `register.php`, `create_booking.php`).

### 3.3.2 MySQL
MySQL establishes the persistent relational backbone essential for managing complex intersecting datasets. It reliably enforces structured normalization protocols governing disparate tables mapping Customers to Providers across distinct abstract temporal configurations iteratively (Bookings), while mathematically locking Review indices. Reliable query performance and enforced referential integrity (using foreign key constraints with `ON DELETE CASCADE`) secure the platform's multi-layered state requirements perfectly. The `home_service_booking` database utilizes structured indexing on high-frequency search fields like email addresses and authentication tokens to maintain rapid query execution times.

---

# CHAPTER 4 - SYSTEM DESIGN

## 4.1 INTRODUCTION
System design translates documented systemic requirements into concrete structural and infrastructural delineations. It defines foundational architectural paradigms, interactive interface templates, explicit UML-driven procedural flows, and relational database matrix configurations vital for coherent deployment. The transition from requirement analysis to system design involves mapping functionalities to specific technical implementations.

## 4.2 UML DIAGRAM
*(Add visual UML structural mapping images here based on following functional explanations)*

### 4.2.1 USE CASE DIAGRAM
*Explanation*: Displays the broad boundaries of system actors. The system features three primary actors: Customer, Provider, and Admin. The Customer use cases include Register/Login, Browse Services, Create Booking, View Dashboard, and Submit Review. Provider use cases include Update Profile/Bio, Manage Bookings (Accept/Complete), and View Dashboard. Admin use cases include Monitor System Statistics and Manage Users.
### 4.2.2 SEQUENCE DIAGRAM
*Explanation*: Chronologically captures operational logic flow arrays. A prime example is the Booking and Payment Flow: The Customer's browser sends an asynchronous AJAX POST payload with booking details to the PHP `create-cashfree-order.php` controller. The PHP script verifies the session token, constructs a secure payload including `order_amount` and `customer_details`, and relays a structured cURL query over HTTPS toward the external Cashfree Payment API. Upon receiving a valid `payment_session_id`, the backend relays this back to the frontend DOM. The client then concludes the transaction using the Cashfree JS Dropin module, emitting a final state boolean validating the database `INSERT` booking requirement.
### 4.2.3 STATE CHART DIAGRAM
*Explanation*: Tracks the variable state condition of a transient entity. Prominently tracks a `Booking`'s traversal state matrix starting at 'Pending' upon creation. The state transitions to 'Confirmed' when accepted by a provider, culminating conclusively in 'Completed' once the service is rendered, or intercepting 'Cancelled' vectors if aborted by either party.
### 4.2.4 ACTIVITY DIAGRAM
*Explanation*: Unwinds dynamic pathway contingencies mapping the continuous step-by-step conditional paths of user authentication. The diagram maps the user providing credentials, the system validating format, hashing the password, querying the database, verifying the hash, generating a secure token, storing it in `user_sessions`, and finally redirecting to the appropriate dashboard based on the user's defined role.
### 4.2.5 CLASS DIAGRAM
*Explanation*: Maps the intended structural methodologies. Although the backend relies heavily on procedural script execution with PDO, a conceptual class diagram illustrates the logical separation of concerns. Entities like `User`, `Booking`, `Service`, and `ProviderProfile` are modeled with their respective properties (e.g., User has `email`, `password_hash`, `role`) and operational methods (e.g., `Booking.updateStatus()`, `Provider.calculateRating()`).
### 4.2.6 OBJECT DIAGRAM
*Explanation*: Provides explicit snapshots evaluating discrete relational mapping instantiated systematically during localized transactional operations contextually. For instance, illustrating a specific instance of a `Customer` object linked to a `Booking` object, which in turn maps to a specific `ProviderProfile` object at runtime.
### 4.2.7 COMPONENT DIAGRAM
*Explanation*: Visually compartmentalizes code block architecture. The system is divided into frontend (`index.html`, `js/main.js`, `css/styles.css`) and backend (`backend/api/`, `backend/config.php`). The frontend communicates strictly via HTTP POST GET requests to the backend RESTful JSON endpoints.
### 4.2.8 DEPLOYMENT DIAGRAM
*Explanation*: Represents physical runtime manifestations modeling how the MySQL Database server communicates securely over internal TCP methodologies toward the Apache/PHP functional layer. The client browser connects via HTTPS (conceptually in production) to the Apache web server, which routes requests to PHP scripts that query the local MySQL daemon.
### 4.2.9 COLLABORATION DIAGRAM
*Explanation*: Contextualizes the sequential inter-layer dependencies and communicative parameters between the JavaScript front-end components and backend PHP configuration files dynamically, emphasizing the messaging structure rather than strict temporal sequencing.

## 4.3 USER INTERFACE DESIGN USING FIGMA
**Form Name: User Authentication Gateway (Login/Signup)**
*(Screenshot Placeholder - Requires fields for Email, Password, 'Remember Me' checkbox, buttons for standard login, and Google OAuth SSO integration)*

**Form Name: Customer & Provider Operational Dashboard**
*(Screenshot Placeholder - Illustrates distinct role-based navigation loops. Customer view highlights booking history and service access; Provider view focuses on profile management, earnings estimation, and job request queues)*

**Form Name: Dynamic Booking Configurator Modal**
*(Screenshot Placeholder - Showcasing the interactive modal where users define the service date, time, and observe the real-time automated cost estimation before final confirmation)*

## 4.4 DATABASE DESIGN

### 4.4.1 Relational Database Management System (RDBMS)
Leveraging robust MySQL relational methodologies, the application stratifies operational data into rigorously interlocked matrices. Logical segregation maintains inherent data coherence while generating exceptionally fast read velocities for dashboard rendering parameters. The database, named `home_service_booking`, utilizes constraints and indexes to optimize performance.

### 4.4.2 Normalization
Structural optimization adheres to the Third Normal Form (3NF). Anomalous redundant repetitions are nullified via explicit isolated assignments—for example, distinct `services` taxonomy prevents repeating categorical strings natively inside individual provider assignment matrices, replacing redundancy with lean discrete integer mapped referential integrity checks (`service_id`). User credentials are separated from specific provider details.

### 4.4.3 Sanitization
At the persistent interaction layer, raw textual vectors are never instantiated structurally. Abstract variable binding executed explicitly alongside SQL template compilation via stringent `$pdo->prepare()` and `execute()` PDO architectures comprehensively sanitizes user variables stripping catastrophic insertion capabilities (SQL Injection) absolutely. Input fields are also verified server-side (e.g., `filter_var` for emails).

### 4.4.4 Indexing
Query algorithms aggressively prioritize optimized index scanning on paramount routing metrics parameters (e.g., `INDEX idx_user_type (user_type)` inside `users`, `INDEX idx_token (token)` inside `user_sessions`, and foreign key indexes across `bookings`), establishing lightning-fast retrieval indexing schemas circumventing massive linear iteration penalties during complex joins.

## 4.5 TABLE DESIGN

**Database Name**: `home_service_booking`

**1. users**
Primary key: id
| Field Name | Datatype (Size) | Key Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT(11) | PK, AUTO_INCREMENT | Unique identifier for user |
| `full_name` | VARCHAR(100) | NOT NULL | User's full name |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL | User's email address |
| `phone` | VARCHAR(20) | NULL | User's phone number |
| `password` | VARCHAR(255) | NOT NULL | Bcrypt hashed password string |
| `user_type` | ENUM | 'customer', 'provider', 'admin' | Defines role-based access |
| `profile_image` | VARCHAR(255) | NULL | Path to generated profile avatar |
| `auth_provider` | ENUM | 'local', 'google' (Default 'local') | Origin of authentication |
| `reset_token` | VARCHAR(64) | NULL | Token for password recovery |
| `reset_token_expiry` | DATETIME | NULL | Timestamp indicating token death |
| `last_login` | TIMESTAMP | NULL | Tracker for session activity |

**2. user_sessions**
Primary key: id | Foreign key: user_id
| Field Name | Datatype (Size) | Key Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT(11) | PK, AUTO_INCREMENT | Unique session identifier |
| `user_id` | INT(11) | FK > users.id (CASCADE) | Owner of the session |
| `token` | VARCHAR(64) | NOT NULL, INDEX | Secure 256-bit hex token |
| `created_at` | TIMESTAMP | Default CURRENT_TIMESTAMP | Issuance time |
| `expires_at` | DATETIME | NOT NULL | Expiry threshold |

**3. services**
Primary key: id
| Field Name | Datatype (Size) | Key Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT(11) | PK, AUTO_INCREMENT | Unique service ID |
| `category` | VARCHAR(100) | NOT NULL | Broad categorization string |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Specific service designation |
| `description` | TEXT | NULL | Service specification details |
| `icon` | VARCHAR(255) | NULL | UI Icon path mapping |

**4. providers (Provider Profiles)**
Primary key: id | Foreign keys: user_id, service_id
| Field Name | Datatype (Size) | Key Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT(11) | PK, AUTO_INCREMENT | Unique profile ID |
| `user_id` | INT(11) | FK > users.id (CASCADE) | Linking to core user account |
| `service_id` | INT(11) | FK > services.id (CASCADE) | Linking to offered service |
| `experience_years` | INT(11) | NULL | Declared experience |
| `bio` | TEXT | NULL | Professional description |
| `hourly_rate` | DECIMAL(10, 2)| NULL | Expected remuneration rate |
| `rating` | DECIMAL(3, 2) | Default 0.00 | Algorithmic average rating |
| `total_reviews` | INT(11) | Default 0 | Counter for mathematical averaging |
| `is_verified` | BOOLEAN | Default FALSE | Admin oversight flag |

**5. bookings**
Primary key: id | Foreign keys: customer_id, provider_id, service_id
| Field Name | Datatype (Size) | Key Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT(11) | PK, AUTO_INCREMENT | Unique transaction ID |
| `customer_id` | INT(11) | FK > users.id (CASCADE) | Client initiating job |
| `provider_id` | INT(11) | FK > providers.id (CASCADE) | Required professional |
| `service_id` | INT(11) | FK > services.id (CASCADE) | Specific job type requested |
| `booking_date` | DATE | NOT NULL | Scheduled date |
| `booking_time` | TIME | NOT NULL | Scheduled temporal start |
| `description` | TEXT | NULL | Client-sided notes |
| `status` | ENUM | 'pending', 'confirmed', 'completed', 'cancelled' | Active state index |
| `total_amount` | DECIMAL(10, 2)| NULL | Pre-calculated financial expectation |

**6. reviews**
Primary key: id | Foreign key: booking_id, customer_id, provider_id
| Field Name | Datatype (Size) | Key Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT(11) | PK, AUTO_INCREMENT | Unique assessment ID |
| `booking_id` | INT(11) | FK > bookings.id (UNIQUE) | Strict mapping to one job |
| `customer_id` | INT(11) | FK > users.id (CASCADE) | Review author |
| `provider_id` | INT(11) | FK > providers.id (CASCADE) | Review recipient |
| `rating` | INT(11) | CHECK(rating BETWEEN 1 AND 5)| Constrained numerical index |
| `comment` | TEXT | NULL | Qualitative feedback text |

---

# CHAPTER 5 - SYSTEM TESTING

## 5.1 INTRODUCTION
System testing operates as a fundamentally proactive defensive configuration. Rigorous evaluative deployment pathways comprehensively assess structural reliability, logical boundary consistencies, and overarching runtime interoperability before transitioning to a production stance. The objective is to identify and resolve defects across all integration layers.

## 5.2 TEST PLAN
The systematic evaluation architecture incorporates a stratified hierarchy traversing minute localized variables through encompassing structural end-to-end navigational integrity tests. 

*   **5.2.1 Unit Testing:** Distinct localization verifying explicitly restricted component boundaries. For example, testing if the `password_verify()` PHP function evaluates stored hashes correctly, or guaranteeing the Vanilla JS function `calculateTotal(rate, duration)` outputs exact decimals universally.
*   **5.2.2 Integration Testing:** Analyzing seamless communicative synchronicity evaluating variable exchanges traversing through internal AJAX commands, routing optimally via the PHP API nexus (`create-cashfree-order.php`, `register.php`) toward precise MySQL persistent commitments and external Cashfree API handshakes correctly.
*   **5.2.3 Validation Testing:** Exposing interface boundaries examining if system validators reliably deflect incorrectly structured contextual arrays. This involves asserting that invalid emails are rejected at `filter_var($email, FILTER_VALIDATE_EMAIL)` and ensuring the frontend HTML5 `type="email"` attributes trigger DOM safeguards preventing bad payloads entirely.
*   **5.2.4 User Acceptance Testing (UAT):** Enacting authentic transactional iterations executing sequential actions mirroring exact target consumer operational cadences affirming optimal user experience structural flows conclusively. This involves a test user executing an entire flow: Account Creation -> Authentication -> Dashboard Load -> Booking Initialization -> Review Submission.
*   **5.2.5 Automation Testing:** Utilizing scripted logic to rapidly throw invalid requests at REST APIs ensuring that appropriate HTTP status codes and JSON error messages (`{"success": false, "message": "Invalid method"}`) are delivered consistently instead of fatal PHP crashes.
*   **5.2.6 Selenium Testing:** Advanced GUI layer verification logic rendering dynamic HTML pathways checking dynamic visual injection parameters (like ensuring Toast notifications render on screen coordinates) across various environments.

### 5.2.7 Test Cases

**Test Case 1: Interface Authentication Logic (Login)** 
**Project Name:** HomeService Booking Application
**Test Case ID:** Auth_01 | **Test Designed By:** [STUDENT NAME]
**Test Priority:** High | **Module Name:** Authentication
**Description:** Verify standard user login protocol validates credentials securely.
**Pre-Condition:** User 'testuser@example.com' exists with password 'password123'.

| Step | Test Step | Test Data | Expected Result | Actual Result | Status (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Navigate to login form | N/A | Form loads correctly | Form rendered | Pass |
| 2 | Enter invalid email | `wronguser@example` | Frontend regex warning | Warning displayed | Pass |
| 3 | Enter valid email | `testuser@example.com` | Accepted | Input accepted | Pass |
| 4 | Enter bad password | `wrongpass` | API rejection JSON | Error: 'Invalid email/pass' | Pass |
| 5 | Enter valid password | `password123` | API generates token | Token generated | Pass |
| 6 | Submit form logic | Click 'Login' | `user_sessions` written | Session created | Pass |
| 7 | Evaluate routing | N/A | Redirects to Dashboard | Dashboard loaded | Pass |

**Post-Condition:** Valid session token is stored in the browser's `localStorage`.

**Test Case 2: Cashfree Financial API Handshake**
**Project Name:** HomeService Booking Application
**Test Case ID:** Book_01 | **Test Designed By:** [STUDENT NAME]
**Test Priority:** High | **Module Name:** Financial Integration
**Description:** Affirm automated payment session ID generation utilizing Cashfree constraints.
**Pre-Condition:** Customer is authenticated with functional session token. Amount parameter equates to 1500.00 INR.

| Step | Test Step | Test Data | Expected Result | Actual Result | Status (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Inject AJAX Payload | `amount: 1500`, JSON | Data passes to backend API | Object routed securely | Pass |
| 2 | Backend Auth Verification | `Authorization: Bearer <Token>` | Endpoint parses Identity | Identity match validated | Pass |
| 3 | Construct Ext Payload | `order_id : ORDER_23_Time` | Payload aligns to Cashfree standard | Array constructed | Pass |
| 4 | Execute External cURL | `CASHFREE_BASE_URL/orders` | 200 OK Handshake returned | External ping successful | Pass |
| 5 | Verify Response Object | `payment_session_id` string | JSON returns unique ID to frontend | ID appended to local DOM | Pass |

**Post-Condition:** Valid `payment_session_id` is passed locally enabling the Javascript Dropin SDK overlay to initialize accurately.

**Test Case 3: Review Constraint Logic**
**Project Name:** HomeService Booking Application
**Test Case ID:** Rev_01 | **Test Designed By:** [STUDENT NAME]
**Test Priority:** Medium | **Module Name:** Review System
**Description:** Guarantee reviews can only be generated for 'Completed' jobs.
**Pre-Condition:** Customer has one 'Pending' booking and one 'Completed' booking.

| Step | Test Step | Test Data | Expected Result | Actual Result | Status (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Navigate to history | N/A | Booking lists displayed | List fetched | Pass |
| 2 | Inspect Pending job | Object ID `10` | Review button disabled/hidden | UI button absent | Pass |
| 3 | Inspect Completed job | Object ID `11` | Review button accessible | UI button accessible | Pass |
| 4 | Submit review API | JSON payload | MySQL `reviews` insert executes | Row inserted securely | Pass |

**Post-Condition:** Provider's aggregated rating updates to reflect the new mathematical average natively.

**Test Case 4: Dashboard Interoperability API Restraints**
**Project Name:** HomeService Booking Application
**Test Case ID:** Dash_01 | **Test Designed By:** [STUDENT NAME]
**Test Priority:** High | **Module Name:** Auth Boundaries
**Description:** Prevent unauthorized direct API access without session tokens.
**Pre-Condition:** User is explicitly logged out and `localStorage` is cleared.

| Step | Test Step | Test Data | Expected Result | Actual Result | Status (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Clear local storage | `localStorage.clear()`| Tokens deleted | Environment sanitized | Pass |
| 2 | Direct navigate to UI | URL `/customer-dashboard` | Initializing load fails | Interface redirects to login | Pass |
| 3 | Direct query API curl | GET `/api/dashboard.php` | API denies query execution | 401 Unauthorized JSON response | Pass |

**Post-Condition:** System environment remains insulated against unauthorized data scraping entirely.

---

# CHAPTER 6 - IMPLEMENTATION

## 6.1 INTRODUCTION
The implementation protocol signifies the active deployment configurations mapping abstract development arrays out into a functional environmental reality. It dictates explicitly managed rollout procedures governing infrastructural initialization, active user onboarding structuring, alongside resilient operational maintenance guidelines ensuring scalable platform stability natively.

## 6.2 IMPLEMENTATION PROCEDURES

### 6.2.1 User Training
Navigational operations are optimized embedding explicit visual tooling cues. Strategic UI indicators alongside modal contextual cues enable universal behavioral assimilation traversing complex filtering without necessitating supplementary textual manuals structurally. The onboarding path for providers includes tooltips emphasizing the importance of accurate profile creation and rating management.

### 6.2.2 Training on Application Software
Back-end oversight frameworks (Administrator Control Arrays) inherit explicitly delineated Standard Operating Procedures maintaining platform behavioral constraints and managing structural metrics continuously. Administrative users are guided on monitoring platform analytics, verifying service providers, and moderating system-wide review inputs natively through the unified dashboard architecture.

### 6.2.3 System Maintenance
Active architectural health is managed utilizing dynamic PHP endpoint logging parameters. Utilizing secure MySQL dump procedures establishes robust cyclic data archival frameworks preemptively mapping data retention sequences securely. Regular code iteration pushes will follow standard Git logging parameters to ensure version control integrity.

### 6.2.4 Hosting
**Eg. Local Web Server Implementation (XAMPP)**
The project's primary development and preliminary presentation framework operates utilizing the XAMPP software stack configured onto the host machine.
**Step 1:** Installation of XAMPP ensuring both Apache (Web Server) and MySQL (Database) modules possess functional port allocations natively.
**Step 2:** Routing project files (`frontend`, `backend`) explicitly into the central `c:\xampp\htdocs\HomeService` operational directory.
**Step 3:** Accessing `localhost/phpmyadmin` executing the SQL execution script building out `home_service_booking` relational matrices conclusively.
**Step 4:** Deploying the application locally accessing standard `localhost/HomeService/frontend` paths effectively executing tests seamlessly.

*(Note: Production hosting procedures utilizing systems like Hostinger or 000Webhost involve transferring these assets via FTP and exporting/importing the SQL database to a live CPanel environment).*

---

# CHAPTER 7 - CONCLUSION & FUTURE SCOPE

## 7.1 CONCLUSION
The engineering lifecycle delineating the HomeService Booking Application constitutes a comprehensive achievement structurally optimizing localized physical service markets fundamentally. Through meticulous deployment integrating advanced automated pricing calculators, distinct operational dashboards mapping precise roles, alongside impenetrable authentication layering infrastructures bridging Google OAuth logic arrays—the platform standardizes complex ad hoc variable vectors flawlessly into a reliable, verifiable user experience dynamically establishing immutable transparency metrics successfully. The system effectively transitions users away from unverified directory hunting toward an integrated digital logistical ecosystem.

## 7.2 FUTURE SCOPE
Robustly designed scaling architecture establishes profound future expansibility vectors:
*   Integration mapping external structural **Payment Gateways** (Stripe/PayPal or RazorPay) locking decentralized transactions natively inside digital platform bounds explicitly.
*   Embedding asynchronous WebSockets mapping inherent **Live Chat Modules** integrating dynamic transparent user interactions.
*   Deployment utilizing explicit cross-platform compilation (like React Native/Flutter) establishing native **iOS and Android Applications** harnessing the fundamental backend RESTful application architecture seamlessly.
*   Injecting sophisticated **Geolocation API Arrays** tracking live coordinate spatial routing logic inherently identifying providers geographically adjacent to clients natively.

---

# CHAPTER 8 - BIBLIOGRAPHY

**REFERENCES:**
1. Nixon, Robin. "Learning PHP, MySQL & JavaScript: With jQuery, CSS & HTML5" (O'Reilly Media).
2. Crockford, Douglas. "JavaScript: The Good Parts" (O'Reilly Media).
3. "Database System Concepts" by Abraham Silberschatz, Henry F. Korth, and S. Sudarshan (McGraw Hill Education).

**WEBSITES:**
1. PHP Official Server Mapping Documentation: https://www.php.net/manual/en/
2. Mozilla Developer Network (MDN) Web Docs: https://developer.mozilla.org/
3. MySQL Relational Database Developer Reference: https://dev.mysql.com/doc/
4. Google Advanced Identity Services for Web Apps: https://developers.google.com/identity/gsi/web
5. Cashfree Payment Gateway Developer Technical Documentation: https://docs.cashfree.com/

---

# CHAPTER 9 - APPENDIX

## 9.1 SAMPLE CODE

**Snippet 1: Database Connection Configuration (config.php)**
```php
<?php
$host = 'localhost';
$dbname = 'home_service_booking';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(['success' => false, 'message' => "Connection failed: " . $e->getMessage()]));
}

// Global constant references
define('API_BASE_URL', 'http://localhost/HomeService/backend/api');
?>
```

**Snippet 2: User Login API Endpoint Logic (login.php Segment)**
```php
<?php
// ... header definitions ...
$email = trim($data['email']);
$password = $data['password'];

$stmt = $pdo->prepare("SELECT id, full_name, email, password, user_type FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->rowCount() === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']); exit;
}
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (password_verify($password, $user['password'])) {
    $token = bin2hex(random_bytes(32));
    // Write token query execution...
    echo json_encode([
        'success' => true, 
        'message' => 'Login successful', 
        'token' => $token, 
        'user' => ['id' => $user['id'], 'user_type' => $user['user_type']]
    ]);
}
?>
```

## 9.2 SCREENSHOTS
*(Placeholder requirement: Include Dashboard Interface Overviews, Seamless Booking Flow modal states, Configuration matrices, Login Interface)*

## 9.3 GEO-TAGGED PHOTOS PANEL REVIEW 1 & 2
*(Placeholder requirement: Insert physical visual matrices mapping physical structural presentation parameters mapping explicitly.)*

## 9.4 GIT LOG
*(Placeholder requirement: Provide explicit structural chronological development history mapping progressive feature expansions inherently generated natively via VCS arrays. Typical `git log --oneline` output.)*

---
*(End of Mini Project Report)*
