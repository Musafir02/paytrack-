<div align="center">
  <img src="https://img.icons8.com/color/120/000000/payroll.png" alt="Logo">
  <h1 align="center">PayTrack &mdash; Payroll Management System</h1>

  <p align="center">
    A payroll and HR back-office built with Spring Boot 3.2, served as a single
    deployable JAR with its browser UI bundled inside.
  </p>
</div>

---

## About

PayTrack automates payroll for small and medium-sized organizations: employee
records, attendance, leave, batch salary processing, and payslip generation,
behind a session-authenticated admin panel with role-based access and an audit
trail.

**Roles** — `ROLE_ADMIN`, `ROLE_HR`, `ROLE_MANAGER`, `ROLE_EMPLOYEE`. Each role
sees a different slice of the API; the rules live in one place
(`config/SecurityConfig.java`).

---

## Architecture

A single Spring Boot application. There is no separate frontend build, no Node
toolchain, and no reverse proxy in front of it.

```
Browser
  │  HTML / CSS / ES6 fetch()
  ▼
Spring Boot (one JAR)
  ├── SecurityConfig          session auth, URL-level authorization
  ├── controller/ (13)        REST endpoints under /api
  ├── service/    (11)        payroll maths, reports, PDF generation
  ├── repository/ (11)        Spring Data JPA
  ├── model/      (11)        JPA entities
  ├── dto/                    request/response records
  ├── exception/              GlobalExceptionHandler -> JSON errors
  └── resources/public/       static UI, served straight off the classpath
```

**Why one JAR.** The UI is plain HTML/CSS/JS under
`src/main/resources/public/`. Spring Boot serves those files from the
classpath, so the frontend is versioned and shipped with the backend. There is
nothing to install or build separately.

**Database.** Hibernate builds and updates the schema from the JPA entities
(`ddl-auto`), so there are no migration scripts to run. MySQL is used in
local development and production.

### The UI

`index.html` is the whole app: a single page with four tabs (dashboard,
employees, payslips, taxes) switched client-side, styled by a dark
glassmorphism theme in `assets/style.css`. The API is consumed with `fetch()`
from `assets/app.js`. There is no client-side framework.

### API surface

All endpoints are under `/api` and return the same envelope,
`ApiResponse<T>`, so success and error shapes are uniform.

| Group | Endpoints |
| --- | --- |
| Auth | `/api/auth/login`, `/current-user`, `/setup-status`, `/setup-admin`, `/logout` |
| Dashboard | `/api/dashboard/stats` |
| People | `/api/employees`, `/api/departments`, `/api/salaries` |
| Payroll | `/api/payroll`, `/api/payroll/process`, `/api/payroll/{id}/payslip(/pdf)` |
| Time off | `/api/attendance`, `/api/leaves` |
| Manager | `/api/manager/team`, `/team/attendance`, `/team/payroll` |
| Reports | `/api/reports/payroll`, `/departments`, `/attendance`, `/leaves` |
| Admin | `/api/admin/users`, `/api/admin/audit-logs` |
| Self-service | `/api/profile`, `/api/notifications`, `/api/employee/me/**` |

Authentication is HTTP session based (`JSESSIONID`), not tokens.

---

## Tech stack

**Backend** — Java 17, Spring Boot 3.2.0, Spring Web, Spring Data JPA,
Spring Security, Spring Validation, Hibernate, and the MySQL connector.
OpenPDF for payslip PDFs. Maven for the build.

**Frontend** — HTML5, CSS3, vanilla ES6+. No framework, no bundler.

---

## Getting started

### Prerequisites

* JDK 17 (the project targets 17 and will not build on 11)
* Maven 3.6+ on your `PATH`
* MySQL 8.0 or newer
* A browser

> The Maven wrapper (`mvnw`, `mvnw.cmd`) is intentionally not committed to keep
> the binary distribution out of the repository. Use a system `mvn`.

### 1. Create the database

Create a MySQL database:

```sql
CREATE DATABASE IF NOT EXISTS payroll_db;
```

### 2. Point the app at it

The repo reads an optional `application-local.properties` from the project root
(see `spring.config.import` in `application.properties`). It is **gitignored**,
so your credentials stay local. Create it:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/payroll_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=your_password
```

Commit nothing here — `.gitignore` already excludes this file.

### 3. Run it

Start your MySQL server before running the app.

```sh
mvn spring-boot:run
```

Then open <http://localhost:8080>.

### 4. Create the first admin

**There is no default account.** On an empty database the app is locked until
you create the first administrator, either through the setup screen the frontend
shows on load, or directly:

```sh
curl -X POST http://localhost:8080/api/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Your Name","username":"admin","email":"you@example.com","password":"a-strong-password"}'
```

`GET /api/auth/setup-status` reports whether setup is still required. The
endpoint refuses to run once any user exists, so it cannot be reused to add a
second admin.

---

## Maven commands

| Command | What it does |
| --- | --- |
| `mvn spring-boot:run` | Run the app on `localhost:8080` |
| `mvn clean package` | Build `target/payroll-backend-1.0-SNAPSHOT.jar` |
| `mvn clean package -DskipTests` | Build the JAR without running tests |
| `mvn test` | Run the test suite |
| `mvn clean verify` | Full build with checks |
| `java -jar target/payroll-backend-1.0-SNAPSHOT.jar` | Run the built JAR |

---

## Configuration

### Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8080` | HTTP port. Render injects this; do not hardcode it |
| `DB_URL` | local MySQL | Full JDBC URL. Takes precedence over the `DB_*` parts |
| `DB_USERNAME` | `root` | Database user |
| `DB_PASSWORD` | empty | Database password |
| `SPRING_PROFILES_ACTIVE` | *(unset)* | Comma-separated profiles, e.g. `render,demo` |
| `APP_DEMO_DATA_ENABLED` | `false` | Only meaningful with the `demo` profile |

### Profiles

| Profile | Effect |
| --- | --- |
| *(default)* | MySQL, using `DB_URL`/`DB_USERNAME`/`DB_PASSWORD` |
| `render` | Render MySQL, small Hikari pool, `ddl-auto=update` |
| `demo` | Enables `DemoDataSeeder`, which loads synthetic data |

Profiles are additive:

```sh
mvn spring-boot:run -Dspring-boot.run.profiles=demo
```

Locally, create a `payroll_db` database in MySQL and set `DB_PASSWORD` to
the password for `DB_USERNAME`. For an external MySQL database, set
`DB_URL` to a JDBC URL such as
`jdbc:mysql://host:3306/paytrack?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`, along with
`DB_USERNAME` and `DB_PASSWORD`.

---

---

## Demo login

> These credentials are for synthetic data created only when the `demo`
> profile is enabled. Use that profile only with a disposable development
> database, never with real employee data.

Password for every account: `Demo@1234`

| Username | Role |
| --- | --- |
| `demo.admin` | Administrator |
| `demo.hr` | HR |
| `demo.mgr.eng` | Manager, Engineering |
| `demo.mgr.sls` | Manager, Sales |
| `demo.mgr.fin` | Manager, Finance |
| `demo.emp01` … `demo.emp10` | Employees |

Every record the seeder creates is prefixed `DEMO-` so it can be identified or
removed later.

---

## Project layout

```
.
├── .env.example               template for the environment variables
├── pom.xml
├── docs/                       design notes and UI screenshots
├── UML_Diagrams.md
└── src/main/
    ├── java/com/payroll/
    │   ├── PayrollApplication.java
    │   ├── config/             Spring Security configuration
    │   ├── controller/         REST controllers
    │   ├── dto/                request and response records
    │   ├── exception/          error handling
    │   ├── model/              JPA entities
    │   ├── repository/         Spring Data JPA repositories
    │   ├── security/           UserDetails implementation and loader
    │   ├── service/            business logic, reports, PDF payslips
    │   └── utils/              startup runners and the demo seeder
    └── resources/
        ├── application.properties
        ├── application-render.properties
        ├── application-demo.properties
        └── public/             the browser UI
```

---

## Contributing

1. Fork the project and create a branch.
2. Make your change.
3. Verify it builds: `mvn clean package`.
4. Open a pull request.

Please do not commit `application-local.properties` or `.env`. Both hold real
credentials and are already gitignored.

---

## License

Intended to be released under the MIT License, but **no `LICENSE` file is
present in the repository yet**. Add one before publishing if that matters to
you.
