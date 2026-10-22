# family-panel Specification

## Purpose

Define el shell del panel familia bajo `/family/*`: sidebar propio sin publicación y un feed que muestra solo los posts visibles para la familia según las reglas de RLS existentes.

## Requirements

### Requirement: Family sidebar with family navigation

The family shell SHALL render a sidebar (desktop and mobile drawer) with the subtitle `Familia`, the nav items Feed → `/family`, Resumen del día → `#` and Mi cuenta → `#` as placeholders, and the session footer with logout. It SHALL NOT show the `Nueva publicación` action.

#### Scenario: Family navigation

- **WHEN** a parent clicks `Feed` in the sidebar
- **THEN** they navigate to `/family`

#### Scenario: No publishing action

- **WHEN** a parent views the sidebar in any `/family/*` route
- **THEN** the `Nueva publicación` button is not rendered

#### Scenario: Logo links to panel home

- **WHEN** a parent clicks the OpenDayCare logo in the sidebar
- **THEN** they navigate to `/family`

### Requirement: Family feed shows only family-visible posts

The system SHALL serve a feed at `/family` for role `parent` showing only: posts that include their children in the post audience, and room announcements for rooms of their children — the same visibility rules enforced by RLS.

#### Scenario: Parent sees own children's posts

- **WHEN** a parent navigates to `/family`
- **THEN** the feed shows posts published about their children and announcements of their children's rooms

#### Scenario: Parent does not see other families' posts

- **WHEN** a parent navigates to `/family`
- **THEN** posts about children not linked to them and announcements of other rooms are not shown

#### Scenario: Empty family feed

- **WHEN** a parent has no visible posts
- **THEN** they see the empty-state message `Todavía no hay publicaciones. Sé el primero en compartir un momento.`

### Requirement: Family feed has no composer

The family feed SHALL NOT render the composer (`Compartí un momento…`) nor any publishing entry point.

#### Scenario: No composer for parents

- **WHEN** a parent views `/family`
- **THEN** the composer is not present on the page

### Requirement: Feed is shared logic with distinct shells

Both panels SHALL derive their feed posts from the same data mapping (author, time, type, audience, photos); only the shell, sidebar, and visibility (enforced by RLS) differ.

#### Scenario: Post shape consistency

- **WHEN** the same post is visible to a staff user at `/staff` and to a parent at `/family`
- **THEN** both render the same author, time, type, audience label and photos
