# Spec Delta

## Purpose

Garantiza que cada usuario autenticado aterrice y permanezca en su panel correcto: staff/admin en `/staff/*`, familias en `/family/*`, con redirects automáticos al entrar, iniciar sesión o activar la cuenta.

## ADDED Requirements

### Requirement: Root path redirects by role

The system SHALL redirect authenticated users that visit `/` to the home of their panel according to their role: `staff` and `admin` → `/staff`, `parent` → `/family`.

#### Scenario: Staff visits root

- **WHEN** an authenticated user with role `staff` or `admin` visits `/`
- **THEN** they are redirected to `/staff`

#### Scenario: Parent visits root

- **WHEN** an authenticated user with role `parent` visits `/`
- **THEN** they are redirected to `/family`

#### Scenario: User without profile row

- **WHEN** an authenticated user without a row in `users` visits `/`
- **THEN** they are redirected to `/family` (the panel of least privilege)

#### Scenario: Unauthenticated user

- **WHEN** a user without a session visits `/`
- **THEN** the existing proxy behavior applies and they are redirected to `/login`

### Requirement: Login lands on the role panel

The system SHALL redirect users to their panel home after a successful password login: `staff`/`admin` → `/staff`, `parent` → `/family`.

#### Scenario: Staff login

- **WHEN** a user with role `staff` or `admin` logs in successfully
- **THEN** they are redirected to `/staff`

#### Scenario: Parent login

- **WHEN** a user with role `parent` logs in successfully
- **THEN** they are redirected to `/family`

### Requirement: Account activation lands on the family panel

The system SHALL redirect newly activated accounts to `/family`, since the invitation flow serves families.

#### Scenario: Successful activation

- **WHEN** a parent completes account activation with a valid code
- **THEN** they are redirected to `/family`

### Requirement: Staff panel rejects parents

The system SHALL deny navigation of `/staff/*` to authenticated users with role `parent`, redirecting them to `/family`.

#### Scenario: Parent navigates to a staff route

- **WHEN** an authenticated user with role `parent` requests any route under `/staff`
- **THEN** they are redirected to `/family`

### Requirement: Family panel rejects staff

The system SHALL deny navigation of `/family/*` to authenticated users with roles `staff` and `admin`, redirecting them to `/staff`.

#### Scenario: Staff navigates to a family route

- **WHEN** an authenticated user with role `staff` or `admin` requests any route under `/family`
- **THEN** they are redirected to `/staff`

### Requirement: Guards do not replace RLS

Role guards SHALL be navigation UX only; data access protection remains enforced exclusively by RLS policies on the database.

#### Scenario: Parent invoking a staff server action directly

- **WHEN** a user with role `parent` invokes a staff-only server action outside the UI
- **THEN** the action fails by its own validation and/or RLS, not by the layout guard
