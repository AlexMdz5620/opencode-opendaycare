# Spec Delta

## Purpose

Define el shell del panel staff bajo `/staff/*`: el feed de guardería, la gestión de niños y el sidebar con publicación, trasladando las pantallas actuales del árbol raíz.

## ADDED Requirements

### Requirement: Staff feed lives at /staff

The system SHALL serve the daycare feed for `staff` and `admin` roles at `/staff`, with the same behavior as the previous home feed: posts ordered newest first from the database, visible audience labels, photos, and the empty state when there are no posts.

#### Scenario: Staff opens the feed

- **WHEN** an authenticated user with role `staff` or `admin` navigates to `/staff`
- **THEN** they see the daycare feed with posts of their daycare

#### Scenario: Empty feed

- **WHEN** a staff user with no visible posts navigates to `/staff`
- **THEN** they see the empty-state message `Todavía no hay publicaciones. Sé el primero en compartir un momento.`

### Requirement: Staff children management lives under /staff/kids

The system SHALL serve the children list at `/staff/kids` and the child profile at `/staff/kids/[id]`, preserving the existing behavior (search, rooms, add-child modal, parent linking, allergies banner).

#### Scenario: Staff opens children list

- **WHEN** a staff user navigates to `/staff/kids`
- **THEN** they see the children list grouped by room

#### Scenario: Back link from child profile

- **WHEN** a staff user opens a child profile from the children list and clicks the back link
- **THEN** they return to `/staff/kids`

### Requirement: Staff sidebar shows staff navigation and publishing

The staff shell SHALL render a sidebar (desktop and mobile drawer) with the daycare subtitle, the `Nueva publicación` action, and the staff nav items (Feed → `/staff`, Niños → `/staff/kids`, Avisos and Mi cuenta as `#` placeholders), plus the session footer with logout.

#### Scenario: Sidebar navigation

- **WHEN** a staff user clicks `Niños` in the sidebar
- **THEN** they navigate to `/staff/kids`

#### Scenario: Opening the create-post modal

- **WHEN** a staff user clicks `Nueva publicación` in the sidebar
- **THEN** the create-post modal opens

#### Scenario: Logo links to panel home

- **WHEN** a staff user clicks the OpenDayCare logo in the sidebar
- **THEN** they navigate to `/staff`

### Requirement: Create-post modal only exists in the staff panel

The create-post modal SHALL be mounted only within the staff panel shell; it must not be reachable or openable from any `/family/*` route.

#### Scenario: Family route has no modal

- **WHEN** a user navigates any route under `/family`
- **THEN** the create-post modal is not mounted in the DOM

### Requirement: Publishing actions revalidate the staff feed

After a successful post creation, the system SHALL refresh the staff feed path so the new post is visible on `/staff`.

#### Scenario: Post published

- **WHEN** a staff user publishes a post successfully
- **THEN** the feed at `/staff` shows the new post after revalidation
