# 🌎 Angular Couchsurfing Dashboard

<p align="center">

  <img src="https://img.shields.io/badge/Angular-16-DD0031?logo=angular&logoColor=white" alt="Angular" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/RxJS-Reactive-B7178C?logo=reactivex&logoColor=white" alt="RxJS" />
  <img src="https://img.shields.io/badge/Angular%20Material-UI-757575?logo=angular&logoColor=white" alt="Angular Material" />
  <img src="https://img.shields.io/badge/Leaflet-Maps-success?logo=leaflet&logoColor=white" alt="Leaflet" />
  <img src="https://img.shields.io/badge/Chart.js-Data%20Visualization-FF6384?logo=chartdotjs&logoColor=white" alt="Chart.js" />
  <img src="https://img.shields.io/badge/REST_API-Integration-blue" alt="REST API" />
  <img src="https://img.shields.io/badge/Status-Completed-brightgreen" alt="Completed" />

</p>

<p align="center">

  <a href="https://github.com/alobuuls/angular-couchsurfing" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-Repository-181717?logo=github&logoColor=white" alt="GitHub Repository" />
  </a>

  <a href="https://alobuuls.github.io/angular-couchsurfing/" target="_blank">
    <img src="https://img.shields.io/badge/Live-Demo-success" alt="Live Demo" />
  </a>

  <a href="https://github.com/alobuuls/angular-couchsurfing/commits/main" target="_blank">
    <img src="https://img.shields.io/github/last-commit/alobuuls/angular-couchsurfing" alt="Last Commit" />
  </a>

</p>

---

## 📑 Table of Contents

- [🌐 Live Demo](#-live-demo)
- [📖 Description](#-description)
- [✨ Features](#-features)
- [🧠 Project Architecture](#-project-architecture)
- [📊 Data Analytics](#-data-analytics)
- [🛠 Technologies Used](#-technologies-used)
- [📁 Project Structure](#-project-structure)
- [⚙️ System Requirements](#️-system-requirements)
- [🚀 Installation](#-installation)
- [▶️ Running the Project](#️-running-the-project)
- [🧪 Testing & Validation](#-testing--validation)
- [🏗️ Build & Production](#️-build--production)
- [🔐 Environment & Configuration](#-environment--configuration)
- [🌿 Development Workflow](#-development-workflow)
- [📚 Documentation](#-documentation)
- [🔥 Best Practices](#-best-practices)
- [🎯 Project Goal](#-project-goal)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👩‍💻 Author](#-author)

---

# 🌐 Live Demo

🔗 **[Open Angular Couchsurfing Dashboard](https://alobuuls.github.io/angular-couchsurfing/)**

The application is deployed as a static Angular application using GitHub Pages.

---

# 📖 Description

> [!NOTE] **Angular Couchsurfing Dashboard** is an Angular 16 application focused on managing, filtering,
> visualizing, and analyzing traveler information through an interactive dashboard.

The application allows users to:

- Explore guest profiles.
- Apply advanced filters.
- Analyze traveler information.
- Visualize geographic data through interactive maps.
- Explore statistics and trends.
- Switch between different visualization modes.
- Work with data retrieved from a REST API.

The project demonstrates real-world Angular development practices including:

- Modular application architecture.
- Lazy loading.
- Reactive forms.
- REST API consumption.
- Strong TypeScript typing.
- Reusable services.
- Data mappers and helpers.
- RxJS-based data flow.
- Interactive maps.
- Data visualization.

---

# ✨ Features

## 👥 Guest Management

The dashboard provides functionality for exploring and managing traveler information.

Features include:

- 📄 Guest listing.
- 🔍 Guest details.
- ➕ Guest creation.
- ✏️ Guest editing.
- 🗑️ Guest deletion.
- 👥 Guest group information.
- 📊 Guest statistics.

---

## 🔎 Advanced Filtering System

The application provides a multi-criteria filtering system.

### Geographic Filters

- 🌎 Continent.
- 🗺️ Region.
- 🏳️ Country.
- 🏠 Hometown.
- 📍 Living location.

### Traveler Filters

- 👤 Gender.
- 👥 Group type:
  - Solo.
  - Couple.
  - Friends.
  - Family.

### Experience Filters

- ⭐ Rating.
- 🎁 Gifts.
- 🤝 Ambassador status.
- ✉️ Guest requests.
- 🚪 Hang out availability.
- 🆕 First-time visitors.

### Date Filters

- 📅 Visit range.
- 🎂 Birth date.
- 📆 Year-based filters.
- 📆 Day-based filters.

Filters can be combined to create more specific searches.

---

# 🔄 Multiple Visualization Modes

The application provides multiple ways to explore traveler data.

## 🃏 Cards View

A visual card-based representation of guest information.

Useful for quickly exploring individual guest profiles.

---

## 📋 Table View

A detailed data table designed for exploring larger datasets.

Includes:

- Pagination.
- Sorting.
- Filtering.
- Formatted data.
- Actions.
- Tooltips.
- Detailed guest information.

---

## 🗺️ Map View

An interactive geographic representation of traveler information.

The map allows users to explore guest locations and geographic distributions.

---

# 🗺️ Maps & Geographic Visualization

The project integrates geographic tools for location-based analysis.

### Technologies

- Leaflet.
- GeoJSON.
- Turf.js.

### Features

- Interactive maps.
- Country visualization.
- Geographic distribution.
- Regional analysis.
- Location-based filtering.
- Traveler distribution visualization.

---

# 📊 Data Analytics

The application includes a statistics dashboard focused on traveler analysis.

Available visualizations include:

- 👥 Demographic statistics.
- 🌎 Geographic distribution.
- 🎂 Birthday analysis.
- ⭐ Ratings.
- 🏆 Rankings.
- 🏠 Stay history.
- 📈 Timeline analysis.
- 🎁 Gift statistics.

### Technologies

- Chart.js.
- Chart.js adapters.
- Turf.js.

---

# 🧠 Project Architecture

The application follows a modular Angular architecture focused on separation of concerns and feature-based
organization.

Main architectural concepts include:

- Feature-based organization.
- Lazy-loaded routes.
- Reusable services.
- Strongly typed interfaces.
- Data mappers.
- Utility helpers.
- Reusable UI components.
- Reactive data flow.
- Separation between presentation and data logic.

---

## 📦 Lazy Loading

Feature areas can be loaded dynamically through Angular routing.

Example:

```typescript
{
  path: 'guests',
  loadChildren: () =>
    import('@pages/guests/guests.module')
      .then(m => m.GuestsModule),
}
```

Lazy loading helps provide:

- Faster initial loading.
- Better feature separation.
- Improved scalability.
- Easier maintenance.

---

# 🛠 Technologies Used

| Technology       | Purpose                           |
| ---------------- | --------------------------------- |
| Angular 16       | Frontend framework                |
| TypeScript       | Application logic and type safety |
| RxJS             | Reactive programming              |
| Angular Router   | Application navigation            |
| Angular Material | UI components                     |
| Reactive Forms   | Form management                   |
| Leaflet          | Interactive maps                  |
| Chart.js         | Data visualization                |
| Turf.js          | Geographic operations             |
| REST API         | Backend communication             |
| SweetAlert2      | Notifications and alerts          |
| Flag Icons       | Country visualization             |
| Material Symbols | UI icons                          |

---

# 📁 Project Structure

The project follows a feature-oriented structure.

```text
src/
└── app/
    ├── core/
    │   └── Application-wide functionality
    │
    ├── pages/
    │   └── guests/
    │       404/
    │
    ├── services/
    │   ├── guests.service.ts
    │   ├── map.service.ts
    │   ├── stats.service.ts
    │   ├── city.service.ts
    │   └── alerts.service.ts
    │
    ├── interfaces/
    │   └── TypeScript contracts
    │
    ├── shared/
    │   └── Reusable functionality
    │
    ├── utils/
    │   ├── helpers/
    │   ├── mappers/
    │   └── operators/
    │
    ├── config/
    │   └── Geographic configuration
    │
    └── app.routes.ts
```

The exact structure may evolve as new features are added.

---

# ⚙️ System Requirements

Before running the project, make sure you have installed:

- 📦 **Node.js:** `v16.14.x – v18.x`
- 📦 **npm:** `v8+`
- 🅰️ **Angular CLI:** `v16.x`

## Recommended: nvm

Using [nvm](https://github.com/nvm-sh/nvm) makes it easier to manage the required Node.js version.

```bash
nvm install 18
nvm use 18
```

---

## 🔍 Verify Installed Versions

Run:

```bash
node -v
npm -v
ng version
```

Example:

```text
Node.js: v18.x
npm: 9.x
Angular CLI: 16.x
```

---

# 🚀 Installation

## 1️⃣ Clone the repository

Using SSH:

```bash
git clone git@github.com:alobuuls/angular-couchsurfing.git
cd angular-couchsurfing
```

Or using HTTPS:

```bash
git clone https://github.com/alobuuls/angular-couchsurfing.git
cd angular-couchsurfing
```

---

## 2️⃣ Install dependencies

```bash
npm install
```

---

# ▶️ Running the Project

Start the development server:

```bash
npm start
```

Then open:

```text
http://localhost:4200
```

The application should be available at:

```text
http://localhost:4200/
```

---

# 🧪 Testing & Validation

Before submitting changes, verify that the project still works correctly.

## Unit / Application Tests

```bash
npm test
```

## Production Build

```bash
npm run build
```

## Check Git Changes

Before committing:

```bash
git status
git diff
```

These commands help verify that only the intended files and changes are included.

---

## 🧪 Manual Testing

When implementing a feature or fixing a bug, verify:

- Main success flow.
- Empty states.
- Error states.
- Loading states.
- Responsive behavior.
- Existing functionality affected by the change.

For example, when adding a filter:

```text
✓ Apply one filter
✓ Apply multiple filters
✓ Clear the filter
✓ Combine filters
✓ Navigate pagination
✓ Verify API parameters
✓ Verify empty results
```

---

# 🏗️ Build & Production

The project can be built using Angular's development or production configurations.

## Development Build

```bash
npm run build -- --configuration development
```

The build is generated inside:

```text
dist/couchsurfing-app/
```

---

## Production Build

On environments where MSYS path conversion is required:

```bash
MSYS_NO_PATHCONV=1 npm run build -- --configuration production
```

The resulting files are generated inside:

```text
dist/couchsurfing-app/
```

---

## Preview the Build Locally

Install `serve` if necessary:

```bash
npx serve dist/couchsurfing-app/ -l 8080 -s
```

Then open:

```text
http://localhost:8080
```

The `-s` option enables SPA fallback behavior, allowing Angular routes such as:

```text
http://localhost:8080/guests
```

to work correctly when refreshed.

---

## 🧹 Clean the Build

To remove a previous build:

```bash
rm -rf dist
```

Then rebuild:

```bash
npm run build -- --configuration production
```

---

# 🔐 Environment & Configuration

The application communicates with external services and APIs.

Configuration values such as API URLs or public service keys should be managed through the project's Angular
environment configuration.

Example:

```typescript
export const environment = {
  production: false,
  apiUrl: '',
};
```

Do not commit private credentials, passwords, tokens, or secret API keys.

Before committing, verify your changes with:

```bash
git status
git diff
```

If a credential is accidentally exposed:

1. Do not continue pushing it.
2. Remove it from the commit.
3. Rotate or revoke the credential if it was already exposed.
4. Notify the project maintainer when necessary.

---

# 🌿 Development Workflow

The recommended contribution workflow is:

```text
Issue / Feature Request
        ↓
Create branch
        ↓
Implement changes
        ↓
Run tests
        ↓
Run build
        ↓
Review git diff
        ↓
Create commit
        ↓
Push branch
        ↓
Open Pull Request
        ↓
Code Review
        ↓
Merge
```

### Branch Naming

Use:

```text
type/short-description
```

Examples:

```text
feat/add-country-filter
fix/guest-age-calculation
refactor/guest-table-mapper
style/improve-filter-layout
docs/update-readme
test/guest-service
chore/update-dependencies
perf/optimize-guest-table
```

### Commit Convention

Commits should describe one logical change.

Examples:

```text
✨ feat: add continent filter
🐛 fix: preserve filters during pagination
♻️ refactor: extract guest table mapper
📝 docs: update contributing guide
💄 style: improve guest table layout
🧪 test: add guest mapper tests
🔧 chore: update dependencies
⚡ perf: optimize guest table rendering
```

---

# 📚 Documentation

The repository contains dedicated documentation for development and collaboration.

## 🤝 Contributing Guide

Before contributing, read:

**[`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md)**

It covers:

- Development workflow.
- Branch naming.
- Commit conventions.
- Angular guidelines.
- TypeScript guidelines.
- RxJS practices.
- Testing.
- Accessibility.
- Performance.
- Security.
- Pull Request requirements.
- Definition of Done.

---

## 🐛 Bug Reports

Use the Bug Report template when an existing feature is not behaving as expected.

**[`.github/ISSUE_TEMPLATE/bug_report.md`](.github/ISSUE_TEMPLATE/bug_report.md)**

The template includes:

- Steps to reproduce.
- Expected behavior.
- Actual behavior.
- Environment information.
- Browser/device information.
- Console errors.
- API information.
- Severity.
- Possible cause.
- Verification details.

---

## ✨ Feature Requests

Use the Feature Request template when proposing new functionality or significant improvements.

**[`.github/ISSUE_TEMPLATE/feature_request.md`](.github/ISSUE_TEMPLATE/feature_request.md)**

The template helps document:

- Problem or need.
- Proposed solution.
- Affected areas.
- UX considerations.
- Technical considerations.
- Dependencies.
- Edge cases.
- Acceptance criteria.
- Example scenarios.

---

## 🔀 Pull Requests

Pull Requests should follow the repository's Pull Request template.

**[`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)**

The template helps reviewers understand:

- What changed.
- Why it changed.
- Scope.
- Technical implementation.
- Testing.
- Performance impact.
- Security considerations.
- Breaking changes.
- Reviewer focus.

---

# 🔥 Best Practices

The project follows several Angular and frontend development practices.

### Architecture

- Feature-based organization.
- Lazy loading.
- Separation of concerns.
- Reusable services.
- Reusable components.
- Modular folder organization.

### TypeScript

- Strong typing.
- Interfaces for data contracts.
- Avoiding unnecessary `any`.
- Meaningful naming.
- Reusable types.

### Angular

- Reactive forms.
- Dependency injection.
- Component communication.
- Observable data flow.
- Route-based lazy loading.
- Focused components.

### Data

- API response typing.
- Mappers for data transformation.
- Reusable helpers.
- Separation between API models and presentation data.

### UI

- Angular Material.
- Responsive layouts.
- Loading states.
- Empty states.
- Error states.
- Accessible controls.

### Quality

- Unit/application testing.
- Production build validation.
- Manual testing.
- Code review.
- Consistent Git workflow.

---

# 🎯 Project Goal

The main objective of this project is to practice and demonstrate advanced Angular concepts through the
development of a data-driven application.

The project covers:

- Angular architecture.
- Feature modules.
- Lazy loading.
- Reactive programming with RxJS.
- REST API consumption.
- Complex filtering systems.
- Interactive maps.
- Data visualization.
- TypeScript design patterns.
- Component communication.
- Data transformation.
- Frontend architecture.
- Scalable project organization.
- Git and collaborative development practices.

The project also serves as a practical portfolio application demonstrating frontend development skills with
Angular and TypeScript.

---

# 🤝 Contributing

Contributions, suggestions, bug reports, and feature proposals are welcome.

Before making changes, please read the:

**[Contributing Guide](.github/CONTRIBUTING.md)**

For issues, use the appropriate GitHub template:

- **Bug Report** → **[`.github/ISSUE_TEMPLATE/bug_report.md`](.github/ISSUE_TEMPLATE/bug_report.md)**
- **Feature Request** → **[`.github/ISSUE_TEMPLATE/feature_request.md`](.github/ISSUE_TEMPLATE/feature_request.md)**

For code contributions, open a Pull Request using the repository's Pull Request template.

---

# 📄 License

This project is intended for educational and portfolio purposes.

---

# 👩‍💻 Author

Created by **Alondra Francisco**.

- GitHub: [@alobuuls](https://github.com/alobuuls)
- Repository: [Angular Couchsurfing Dashboard](https://github.com/alobuuls/angular-couchsurfing)
- Live Demo: [Angular Couchsurfing Dashboard](https://alobuuls.github.io/angular-couchsurfing/)
