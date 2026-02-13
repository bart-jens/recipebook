## ADDED Requirements

### Requirement: Next.js project initialization
The project SHALL be a Next.js 14 application using TypeScript and the App Router. It SHALL include Tailwind CSS configured for mobile-first responsive design.

#### Scenario: Fresh project setup
- **WHEN** the project is cloned and dependencies are installed
- **THEN** `npm run dev` starts a working development server on localhost:3000

#### Scenario: TypeScript strict mode
- **WHEN** any TypeScript file contains a type error
- **THEN** the build (`npm run build`) SHALL fail with a descriptive error

### Requirement: Mobile-first Tailwind configuration
Tailwind CSS SHALL be configured with mobile-first breakpoints. Base styles SHALL target mobile screens. The default font SHALL be a readable system font stack or Inter.

#### Scenario: Mobile viewport rendering
- **WHEN** the app is viewed on a 375px wide screen
- **THEN** all content SHALL be fully visible without horizontal scrolling

#### Scenario: Desktop viewport rendering
- **WHEN** the app is viewed on a 1280px wide screen
- **THEN** content SHALL be centered with a max-width container

### Requirement: Project directory structure
The project SHALL follow a consistent directory structure with `src/app/` for routes, `src/lib/` for shared utilities, and `src/types/` for TypeScript type definitions. Supabase configuration and migrations SHALL be in `supabase/`.

#### Scenario: Route organization
- **WHEN** a new authenticated page needs to be added
- **THEN** it SHALL be placed under `src/app/(authenticated)/` which provides auth protection via layout

### Requirement: Vercel deployment
The project SHALL be deployable to Vercel with zero additional configuration beyond environment variables. Each push to main SHALL trigger an automatic deployment.

#### Scenario: Production build
- **WHEN** `npm run build` is executed
- **THEN** the build SHALL complete successfully with no errors

#### Scenario: Environment variables
- **WHEN** deploying to Vercel
- **THEN** the following environment variables MUST be configured: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
