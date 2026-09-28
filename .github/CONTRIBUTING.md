# 🤝 Contributing Guide

Thank you for your interest in contributing to **Angular Couchsurfing Dashboard**! 🚀

This guide explains the recommended development workflow, project structure, coding standards, Git
conventions, testing requirements, and Pull Request process.

The goal is to keep the project:

- 🧹 Clean and maintainable.
- 🧩 Modular and reusable.
- 📐 Consistent across features.
- 🧪 Easy to test.
- 🚀 Easy to extend.
- 👥 Easy for other contributors to understand.

Please read this guide before submitting code or opening a Pull Request.

---

# 📌 Before Contributing

Before starting a new contribution:

1. 🔎 Check existing issues and Pull Requests.
2. 📋 Make sure the change fits the project's scope.
3. ♻️ Check whether similar functionality already exists.
4. 💬 Discuss major architectural or functional changes before implementing them.
5. 📖 Review the existing code structure and conventions.
6. 🧪 Consider how the change will be tested.

For large changes, open an issue first describing:

- The problem.
- The proposed solution.
- The expected behavior.
- The affected application areas.
- Possible technical impact.
- Possible breaking changes.

**Example:**

> I would like to add CSV export functionality to the statistics dashboard. The feature would allow users to
> export the currently filtered guest data without introducing a new backend endpoint.

This allows the implementation approach to be discussed before significant development work begins.

---

# 🚀 Getting Started

## 1. Fork the repository

If you are contributing from your own GitHub account, create a fork using GitHub's **Fork** button.

**Example:**

```text
Original repository:
https://github.com/OWNER/angular-couchsurfing-dashboard

Your fork:
https://github.com/YOUR_USERNAME/angular-couchsurfing-dashboard
```

2. Clone your fork

Clone your fork to your local machine:

git clone https://github.com/YOUR_USERNAME/angular-couchsurfing-dashboard.git

Move into the project directory:

cd angular-couchsurfing-dashboard

Verify that the repository was cloned correctly:

git remote -v

Example output:

origin https://github.com/YOUR_USERNAME/angular-couchsurfing-dashboard.git (fetch) origin
https://github.com/YOUR_USERNAME/angular-couchsurfing-dashboard.git (push) 3. Install dependencies

Install the project's dependencies:

npm install

This installs the dependencies defined in package.json.

After installation, verify that the application starts correctly:

npm start

or use the project's configured development command if different.

Example:

npm start

Then open the local development URL shown in the terminal.

4. Check the project before making changes

Before modifying the code, make sure the existing project works correctly.

Run:

npm test

and:

npm run build

If the project uses a different testing or build configuration, follow the commands defined in package.json.

If you find an existing problem before starting your work, mention it in your Pull Request instead of assuming
it was caused by your changes.

🌿 Git Workflow Never work directly on main

The main branch should remain stable.

Always create a dedicated branch for your work.

Example:

git switch main git pull origin main git switch -c feat/add-map-filter Branch Naming Convention

Use descriptive branch names that indicate the purpose of the work.

Recommended format:

type/short-description Branch Types Type Use Example feat New functionality feat/add-map-filter fix Bug fix
fix/map-loading-error refactor Code restructuring refactor/guest-service style UI or styling changes
style/update-guest-table docs Documentation docs/update-contributing test Tests test/guest-service chore
Maintenance/configuration chore/update-dependencies perf Performance improvements perf/optimize-guest-table

Good:

feat/add-country-filter fix/guest-age-calculation refactor/guest-table-mapper style/improve-filter-layout
docs/update-readme

Avoid:

new-feature changes test my-branch fix branch1

A branch name should provide enough context to understand what the branch is about.

🔄 Keeping Your Branch Updated

Before starting work, make sure your local main branch is up to date:

git switch main git pull origin main

Then create your feature branch:

git switch -c feat/my-feature

If main receives important changes while you are working, update your branch according to the project's
preferred workflow.

For example:

git fetch origin git rebase origin/main

If you are not comfortable resolving rebase conflicts, stop and review the conflict before continuing.

Never blindly overwrite changes to resolve a conflict.

🧱 Project Guidelines Angular Architecture

Follow the existing project architecture instead of introducing a completely different structure for a single
feature.

A typical structure may look like:

src/ └── app/ ├── core/ ├── shared/ ├── pages/ ├── services/ ├── interfaces/ └── utils/

Follow the structure already used by the project.

Responsibilities should remain separated:

Layer Responsibility Components UI and user interaction Services API communication and reusable business logic
Interfaces Data contracts and TypeScript types Mappers Transform API/domain data Utils Generic reusable
helpers Pages Feature-level composition Shared Reusable UI/application pieces Core Application-wide
functionality

Example:

Instead of putting API communication directly inside a component:

this.http.get<IGuestsResponse>(url).subscribe(...);

Prefer using a service:

this.guestsService.getGuests().subscribe(...);

This keeps responsibilities separated and makes the code easier to test and reuse.

🧩 Components Best Practices Keep components focused

Components should primarily manage:

UI state. User interaction. Inputs and outputs. Presentation logic. Communication with services when
appropriate.

Avoid creating very large components with unrelated responsibilities.

Prefer:

guests/ ├── guests.component.ts ├── cards/ ├── table/ ├── map/ └── stats/

Avoid:

guests.component.ts ├── table logic ├── map logic ├── chart logic ├── API communication ├── data
transformation ├── filtering ├── pagination └── 1000+ lines of code

If a component starts becoming difficult to understand, consider extracting reusable components, services,
mappers, or helpers.

🧩 Component Naming

Use meaningful and consistent names.

Good:

guest-table.component.ts guest-filter.component.ts guest-card.component.ts guest-map.component.ts

Avoid:

component1.ts data.component.ts test.component.ts component-new.ts

A contributor should be able to understand what a file does from its name.

📥 Inputs and 📤 Outputs

Use Angular inputs and outputs to clearly communicate between components.

Example:

@Input() guest!: IGuest; @Output() editGuest = new EventEmitter<IGuest>();

Avoid creating unnecessary shared state when a simple parent-child communication pattern is sufficient.

🔥 TypeScript Guidelines Use strong typing

Prefer explicit and meaningful types.

Good:

const guest: IGuest = data;

Avoid:

const guest: any = data;

Use interfaces or types when they describe application data.

Example:

interface IGuest { id: number; name: string; country: string; } Avoid unnecessary any

The any type removes TypeScript's type safety.

Avoid:

function mapGuest(data: any): IGuest { return data; }

Prefer:

function mapGuest(data: IGuestResponse): IGuest { return { id: data.id, name: data.name, country: data.country
}; }

If the external data is genuinely unknown, prefer safer alternatives such as unknown and validate or narrow
the type.

🧠 Data Transformation

Keep data transformation logic separate when it becomes reusable or complex.

For example, if API data needs to be transformed before being displayed in a table, consider using a mapper.

Example:

export const mapGuestToTableRow = ( guest: IGuest ): IGuestTableRow => ({ name: guest.name, country:
guest.country, age: calculateAge(guest.birthdate) });

Then the component can focus on presentation instead of transformation details.

💬 Comments

Avoid comments that simply repeat what the code already says.

Avoid:

// Get guests this.guestsService.getGuests();

Prefer code that explains itself.

Comments are useful for:

Complex algorithms. Business rules. Non-obvious decisions. Temporary workarounds. Important technical
constraints.

Good example:

// The API expects the continent values as a comma-separated list. const continent =
selectedContinents.join(','); 📡 Services Guidelines

Services should handle responsibilities that should not live inside presentation components.

Typical responsibilities include:

API communication. Reusable business logic. Data retrieval. Data transformation when appropriate. Shared
application logic.

Example:

getGuests(): Observable<IGuestsResponse> { return this.http.get<IGuestsResponse>(url); }

Avoid putting API requests directly into components:

// Avoid this.http.get<IGuestsResponse>(url).subscribe(...);

Prefer:

// Prefer this.guestsService.getGuests().subscribe(...); 📡 API Communication

Follow the existing API communication patterns used by the project.

When adding query parameters:

const params = { limit: 10, page: 1, continent: 'africa,oceania' };

Make sure:

Parameters are correctly encoded. Optional parameters are not unnecessarily sent. API responses are properly
typed. API errors are handled. Existing service conventions are respected.

Example:

getGuests(params: IGuestFilters): Observable<IGuestsResponse> { return this.http.get<IGuestsResponse>(url, {
params }); }

Avoid duplicating API request logic across multiple components.

🔄 RxJS Guidelines

Prefer reactive patterns when they fit the existing application architecture.

Example:

guests$ = this.guestsService.getGuests();

Avoid unnecessary manual subscriptions:

this.guestsService.getGuests().subscribe(data => { this.guests = data; });

when the observable can be consumed directly by the template.

For example:

<div *ngIf="guests$ | async as guests">
  <!-- Render guests -->
</div>
Manual Subscriptions

When a manual subscription is necessary:

Make sure its lifecycle is handled. Avoid memory leaks. Follow the project's existing Angular/RxJS pattern.
Keep subscription logic simple.

Example:

this.guestsService.getGuests() .pipe(takeUntilDestroyed()) .subscribe(guests => { this.guests = guests; });

Do not introduce a subscription only because it seems easier if the same behavior can be handled reactively.

⏳ Loading States

Async operations should provide appropriate feedback when necessary.

Example:

isLoading = true;

this.guestsService.getGuests() .pipe(finalize(() => this.isLoading = false)) .subscribe(...);

The UI should avoid leaving users wondering whether an operation is still running.

Example UI states:

Loading guests...

or an appropriate Angular Material loading indicator.

❌ Error Handling

Handle expected errors gracefully.

Avoid silently ignoring API errors.

Avoid:

this.guestsService.getGuests().subscribe();

when an error state is important to the user.

Prefer handling the error according to the application's existing conventions.

Example:

this.guestsService.getGuests().subscribe({ next: guests => { this.guests = guests; }, error: error => {
this.errorMessage = 'Unable to load guests.'; } });

Do not expose technical implementation details to users unless they are useful to them.

🎨 UI Guidelines

When modifying the interface:

Follow the existing visual style. Reuse Angular Material components where appropriate. Maintain responsive
behavior. Avoid duplicated styles. Reuse existing components. Keep spacing and typography consistent. Use
meaningful labels and accessible controls.

Example:

If the project already uses:

<button mat-raised-button>
  Search
</button>

avoid introducing a completely different button style without a clear reason.

📱 Responsive Design

New UI should work across the supported screen sizes.

Consider:

Desktop. Laptop. Tablet. Mobile.

Example:

A guest table should not simply overflow horizontally without consideration when viewed on a small screen.

When adding a new layout, test at least:

Desktop: 1920x1080 Tablet: 1024x768 Mobile: 390x844

If the existing application has a specific responsive strategy, follow it.

♿ Accessibility

When adding or modifying UI:

Use semantic HTML where appropriate. Provide meaningful button labels. Add accessible labels to icon-only
controls. Do not rely only on color to communicate information. Ensure interactive elements are keyboard
accessible. Use tooltips when an icon's meaning is not obvious.

Example:

Instead of:

<button mat-icon-button>
  <mat-icon>delete</mat-icon>
</button>

consider providing an accessible label:

<button mat-icon-button aria-label="Delete guest"

> <mat-icon>delete</mat-icon> </button> 🧪 Testing Requirements

Before submitting changes, run the appropriate validation commands.

Unit / Application Tests npm test

Make sure:

Tests pass. New functionality is covered when appropriate. Existing tests were not unintentionally broken.
Production Build

Run:

npm run build

The project should build successfully without TypeScript or compilation errors.

Manual Testing

When applicable, manually verify:

Main success flow. Empty states. Error states. Loading states. Responsive behavior. Existing functionality
affected by the change.

Example:

For a new guest filter:

✓ Filter by one continent ✓ Filter by multiple continents ✓ Clear the filter ✓ Combine with date range ✓
Navigate pagination ✓ Verify API parameters ✓ Verify empty results 🧪 Testing New Features

When adding a new feature, think about at least these scenarios:

Success Given valid input When the user performs the action Then the expected result is displayed. Empty State
Given there are no matching records When the user performs the action Then an appropriate empty state is
displayed. Error State Given the API request fails When the user performs the action Then an appropriate error
state is displayed. Existing Functionality Given the feature already existed When the new change is introduced
Then existing behavior continues to work. 📝 Commit Guidelines

Use clear and consistent commit messages.

The recommended format is:

type: short description

Examples:

feat: add country filter fix: resolve map rendering issue docs: update installation guide refactor: simplify
guest service style: improve guest table layout test: add guest mapper tests chore: update dependencies perf:
optimize guest table rendering 🏷️ Commit Types Type Description feat New functionality fix Bug correction
refactor Code restructuring without changing intended behavior style Formatting or UI/style changes docs
Documentation changes test Tests chore Maintenance/configuration perf Performance improvements ✨ Commit
Message Guidelines

Keep commit messages:

Short. Specific. Written in the imperative style when possible. Focused on one logical change.

Good:

feat: add continent filter fix: preserve filters during pagination refactor: extract guest table mapper docs:
improve contributing guide

Avoid:

changes update fix stuff final changes new things asdf

A commit should ideally represent one logical change.

🧩 Splitting Commits

Avoid putting unrelated changes into one commit.

Avoid:

feat: add filters, fix map, update README and change button styles

Prefer:

feat: add continent filter fix: preserve map markers docs: update README style: improve filter button

This makes code review and future debugging easier.

🔀 Pull Request Guidelines

Before opening a Pull Request:

The branch is up to date with the appropriate base branch. The code follows the project structure. The
application builds successfully. Tests pass. Relevant manual testing was performed. Changes are documented
when necessary. No unnecessary dependencies were added. No secrets or API keys were committed. The Pull
Request has a clear purpose. 📋 Pull Request Description

A good Pull Request should explain:

What changed?

Example:

Added continent filtering to the guests module.

Why did it change?

Example:

Users needed a way to filter guests by geographic region.

How was it implemented?

Example:

Added a reusable filter control, updated the guest service query parameters, and preserved the filter state
during pagination.

How was it tested?

Example:

Tested single and multiple continent filters, pagination, empty results, and API request parameters.

🖼️ Pull Request Screenshots

For UI changes, include screenshots or GIFs showing the relevant behavior.

For example:

Before: Guest table without continent filter.

After: Guest table with continent filter applied.

For responsive changes, include screenshots of relevant screen sizes when useful.

🔗 Related Issues

Link the Pull Request to the relevant issue whenever applicable.

Examples:

Closes #25 Fixes #42 Related to #18

Using GitHub keywords such as Closes or Fixes can automatically close the related issue when the Pull Request
is merged.

⚠️ Breaking Changes

Clearly document breaking changes.

Examples:

API contract changes. Route changes. Component input/output changes. Interface changes. Service method
changes. Environment variable changes.

Example:

Changed the IGuest interface by replacing age with currentAge. Components consuming the old property were
updated accordingly.

If there are no breaking changes, explicitly state:

No breaking changes. 🚫 Avoid

Please avoid:

Large unrelated changes

Do not combine unrelated work.

Avoid:

Add guest filter

- Refactor entire project
- Update all dependencies
- Redesign dashboard

Prefer separate Pull Requests when possible.

Unnecessary architectural changes

Do not change the application's architecture just to implement a small feature.

Example:

If a new filter can be implemented using the existing service architecture, avoid introducing a completely new
state management system.

Discuss significant architectural changes before implementation.

Unnecessary dependencies

Before adding a dependency, check whether the functionality can be implemented using:

Existing project dependencies. Angular features. Native browser APIs. Existing utilities.

If a new dependency is necessary, explain why in the Pull Request.

Generated files

Do not commit generated files unless the project explicitly requires them.

Examples may include:

dist/ coverage/ node_modules/

Follow the repository's .gitignore configuration.

Hardcoded credentials

Never commit:

const apiKey = 'my-secret-key';

or:

PASSWORD=my-password

Use environment variables or the project's existing configuration mechanism.

🔐 Environment Variables

Never commit sensitive environment files.

For example:

.env .env.local

Use:

.env.example

as a template when appropriate.

Example:

API_URL= MAP_API_KEY=

The example file should contain variable names but not real credentials.

Never commit:

MAP_API_KEY=actual-secret-key 🔑 API Keys and Secrets

API keys, tokens, passwords, and credentials must never be committed to Git.

Before creating a commit, check your changes:

git diff

and:

git status

If you accidentally expose a secret:

Do not push it. Remove it from the commit. Rotate/revoke the exposed credential if it was already pushed.
Inform the project maintainer if necessary. 🧹 Code Formatting

Follow the formatting conventions already used by the project.

Keep:

Consistent indentation. Consistent quotation style. Consistent naming. Consistent import organization.
Consistent file structure.

Avoid formatting unrelated files just because they were touched during development.

A Pull Request should contain only the formatting changes that are necessary or intentionally part of the
work.

📁 File Organization

Place files according to their responsibility.

Example:

guests/ ├── guests.component.ts ├── guests.component.html ├── guests.component.scss ├── components/ │ ├──
guest-table/ │ ├── guest-card/ │ └── guest-filter/ ├── interfaces/ ├── services/ └── utils/

Follow the project's existing conventions instead of creating a new structure for every feature.

♻️ Reuse Before Creating

Before creating a new component, service, helper, or utility, check whether a reusable implementation already
exists.

Ask:

Does a similar component already exist? Is there already a helper for this? Does an existing service provide
this data? Can an existing interface be reused? Can the current component be extended safely?

Example:

Instead of creating:

formatGuestDate() formatGuestBirthDate() formatVisitDate()

when all three follow the same formatting rule, consider whether a reusable date formatting utility is more
appropriate.

Avoid premature abstraction, however. Only extract logic when reuse or complexity justifies it.

⚡ Performance Guidelines

Avoid unnecessary work in components and templates.

Consider:

Unnecessary API requests. Repeated calculations. Large lists. Expensive template expressions. Unnecessary
subscriptions. Repeated transformations.

Example:

Avoid making an API request every time a user changes an unrelated UI state.

Prefer reusing existing data when appropriate.

For large lists, consider Angular's available rendering and optimization strategies according to the project's
version and architecture.

🌐 API Error and Loading States

Features that depend on asynchronous operations should consider at least:

Loading ↓ Success ↓ Display data

and:

Loading ↓ Error ↓ Display error state

and:

Loading ↓ Success ↓ No data ↓ Display empty state

Example:

Loading: "Loading guests..."

Success: "125 guests found."

Empty: "No guests match the selected filters."

Error: "Unable to load guests. Please try again." 🧪 Definition of Done

A contribution is considered ready for review when:

The requested functionality has been implemented. The implementation follows the project's architecture.
Existing functionality remains intact. Relevant tests pass. The application builds successfully. Relevant edge
cases were considered. Loading, empty, and error states are handled when applicable. UI changes were manually
verified. Responsive behavior was checked when applicable. No unnecessary dependencies were added. No secrets
or credentials were committed. The code is readable and maintainable. Commits follow the project's
conventions. The Pull Request description is complete. Screenshots were added when required. Related issues
are linked. The contributor has reviewed their own changes. 🌱 Code Quality Checklist

Before submitting your contribution:

Code Clean and readable code. Proper TypeScript typing. No unnecessary any. Meaningful names. Single
responsibility where appropriate. No unnecessary duplicated logic. Reusable logic is extracted when justified.
Angular Components remain focused. Services handle appropriate business/API logic. Inputs and outputs are used
appropriately. RxJS patterns follow project conventions. Subscriptions are properly handled. Angular Material
conventions are followed where applicable. UI Responsive behavior preserved. Existing design conventions
followed. Accessible labels added where appropriate. Loading states handled. Empty states handled. Error
states handled. Testing npm test passes. npm run build passes. Main user flow was tested. Relevant edge cases
were tested. Existing functionality was verified. Security No API keys committed. No passwords committed. No
tokens committed. No sensitive information committed. Environment variables remain protected. 🆘 Need Help?

If you are unsure about an implementation:

Check existing code for similar patterns. Search existing issues and Pull Requests. Review the relevant
documentation. Ask before making significant architectural changes. Open an issue when the proposed change
requires discussion.

Example:

I want to introduce a reusable state-management solution for the statistics dashboard. Since this would affect
several components, I will open an issue before implementing it.

Asking early is better than implementing a large change that later needs to be completely redesigned.

🙌 Thank You

Every contribution helps improve Angular Couchsurfing Dashboard. 💙

Thank you for taking the time to:

Write maintainable code. Follow the project's conventions. Test your changes. Document important decisions.
Review your own work. Help improve the project for future contributors.

Happy coding! 🚀
