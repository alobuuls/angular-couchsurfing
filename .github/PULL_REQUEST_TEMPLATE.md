# 🚀 Pull Request

Thank you for contributing to **Angular Couchsurfing Dashboard**! 🙌

Please complete the following information before submitting your Pull Request.

A good Pull Request description should help reviewers quickly understand:

- 🎯 What changed.
- 💡 Why the change was necessary.
- 🛠️ How it was implemented.
- 🧪 How it was tested.
- ⚠️ What areas may be affected.
- 👀 What reviewers should pay special attention to.

Before submitting:

- 🔎 Make sure there is no duplicated or conflicting Pull Request.
- 🧹 Review your own changes before requesting review.
- 🧪 Run the appropriate tests and validation commands.
- 🔐 Make sure no secrets, API keys, credentials, or sensitive information are included.
- 📝 Keep the Pull Request focused on a clear purpose.

---

# 📌 Description

## What does this Pull Request do?

Describe clearly and concisely what this Pull Request changes.

Focus on **what was changed**, not only how it was implemented.

**Example:**

> Added continent filtering support to the guests module. Users can now select one or more continents and the
> selected values are sent to the REST API as query parameters.

**Changes:**

- Added continent filtering support.
- Updated the guests filter form.
- Updated API query parameter handling.
- Updated the guest table to reflect filtered results.

**Description:**

> <!-- Describe the main purpose of this Pull Request. -->

---

# 🎯 Motivation and Context

## Why is this change needed?

Explain the problem, requirement, issue, or feature that motivated this Pull Request.

Include:

- The problem being solved.
- Why the current behavior was insufficient.
- The expected improvement.
- The issue, feature request, or task that originated the change.

**Example:**

> The guests module previously allowed users to filter by date range but did not provide a way to filter
> guests by continent. This made it difficult to analyze guests from specific geographic regions.

**Problem solved:**

> Users could not filter guests by continent.

**Improvement:**

> Added a reusable continent filter integrated with the existing filter state and API service.

**Context:**

> <!-- Explain why this change was necessary. -->

---

# 📋 Scope

## What is included in this Pull Request?

Clearly define what this Pull Request includes and, when useful, what it intentionally does **not** include.

**Included:**

- <!-- Example: Added continent filter. -->
- <!-- Example: Updated API request parameters. -->
- <!-- Example: Updated table rendering. -->

**Not included:**

- <!-- Example: No changes to the map filtering behavior. -->
- <!-- Example: No backend changes. -->

This helps keep the Pull Request focused and makes review easier.

---

# 🛠️ Type of Change

Select all options that apply:

- [ ] ✨ New feature (`feat`)
- [ ] 🐛 Bug fix (`fix`)
- [ ] ♻️ Refactor (`refactor`)
- [ ] ⚡ Performance improvement (`perf`)
- [ ] 🎨 UI / Styling improvement (`style`)
- [ ] 📚 Documentation update (`docs`)
- [ ] 🧪 Test improvement (`test`)
- [ ] 🔧 Configuration / Maintenance (`chore`)
- [ ] 🔀 Other: <!-- Specify -->

---

# 🧩 Changes Made

Describe the main technical changes introduced by this Pull Request.

## Components

Describe the components modified, created, or removed.

**Example:**

- Updated `guests.component.ts` to handle new filter values.
- Updated `guests-table.component.ts` to display the filtered results.
- Added a reusable `guest-filters.component.ts`.
- Updated component inputs and outputs.

**Changes:**

> <!-- List component changes here. -->

---

## Services

Describe the services modified, created, or removed.

**Example:**

- Updated `guests.service.ts` to support the new `continent` query parameter.
- Added a method for retrieving filtered guests.
- Improved API error handling.

**Changes:**

> <!-- List service changes here. -->

---

## Interfaces / Types

Describe changes to TypeScript interfaces, types, enums, or models.

**Example:**

- Updated `IGuest` with the new `currentAge` property.
- Added `IGuestVisit` interface.
- Added a new `Continent` type.

**Changes:**

> <!-- List interface/type changes here. -->

---

## Mappers / Helpers / Utilities

Describe changes to data transformation or reusable utilities.

**Example:**

- Added `guest.mapper.ts` to transform API responses into table data.
- Added a helper for formatting guest ages.
- Extracted duplicated date formatting logic.

**Changes:**

> <!-- List mapper/helper/utility changes here. -->

---

## API / Data Changes

Describe changes related to API communication or data handling.

**Example:**

- Added `continent` as an optional query parameter.
- Updated request parameter serialization.
- Updated API response mapping.
- No backend changes were required.

**Changes:**

> <!-- Describe API/data changes here. -->

---

## Other Changes

Describe any additional modifications.

**Example:**

- Updated routing configuration.
- Updated Angular Material imports.
- Improved responsive styles.
- Updated documentation.
- Added or updated environment configuration.

**Changes:**

> <!-- Describe other changes here. -->

---

# 🏗️ Architecture Impact

Does this Pull Request affect the application architecture?

Select all options that apply:

- [ ] No architectural changes
- [ ] New component added
- [ ] New reusable component added
- [ ] New service added
- [ ] New module added
- [ ] New interface/type added
- [ ] New mapper/helper/utility added
- [ ] Routing changes
- [ ] API communication changes
- [ ] Dependency injection changes
- [ ] State management changes
- [ ] Other architectural changes

**Details:**

> <!-- Explain how the architecture was affected. -->

**Example:**

> Added a reusable guest filter component inside the existing guests feature. No changes were made to the
> application's overall architecture.

---

# 🖥️ User Experience Changes

Does this Pull Request change how users interact with the application?

- [ ] No UX changes
- [ ] New user interaction
- [ ] Existing interaction changed
- [ ] New UI element
- [ ] Existing UI updated
- [ ] Responsive behavior changed

**Details:**

> <!-- Explain the user-facing changes. -->

**Example:**

> Users can now select multiple continents from the filter form. The selected filters are reflected in the
> guest table without requiring navigation to another page.

---

# 🖼️ Screenshots / Videos

Required when the Pull Request includes UI or UX changes.

## Before

Describe the previous behavior.

**Example:**

> The guest table displayed all guests without a continent filter.

**Screenshot:**

<!-- Add screenshot here -->

---

## After

Describe the new behavior.

**Example:**

> The guest table now displays only guests matching the selected continent filters.

**Screenshot:**

<!-- Add screenshot here -->

---

## Additional Visual References

If useful, add:

- Screen recordings.
- GIFs.
- Mockups.
- Figma designs.
- Before/after comparisons.

> <!-- Add additional visual references here. -->

---

# 🧪 Testing

## Testing Performed

Select all validation steps that were completed:

- [ ] `npm test`
- [ ] `npm run build`
- [ ] Manual browser testing
- [ ] Responsive design testing
- [ ] API integration testing
- [ ] Unit testing
- [ ] Component testing
- [ ] Cross-browser testing
- [ ] Other: <!-- Specify -->

---

## Test Scenarios

Describe the specific scenarios that were tested.

Avoid only writing:

> "Everything works."

Instead, describe what was actually verified.

**Example:**

- Created a new guest profile.
- Edited an existing guest.
- Applied continent and country filters.
- Combined multiple filters.
- Verified filtered results in the guest table.
- Verified the map updates correctly.
- Verified the statistics dashboard still loads.
- Tested the empty state when no guests match the selected filters.
- Tested API error handling.

**Test scenarios:**

> <!-- Describe the scenarios tested here. -->

---

# 🧪 Edge Cases Tested

Describe unusual or boundary cases that were verified.

**Examples:**

- Empty API response.
- No results after applying filters.
- Invalid or missing data.
- API request failure.
- Multiple filters selected.
- Very large datasets.
- Missing optional fields.
- Slow network response.
- Mobile viewport.

**Edge cases:**

> <!-- Describe edge cases tested here. -->

---

# ⚡ Performance Considerations

Does this Pull Request affect application performance?

- [ ] No expected performance impact
- [ ] Performance improved
- [ ] Performance may be affected
- [ ] Performance testing performed

**Details:**

> <!-- Explain any relevant performance considerations. -->

**Example:**

> Reused the existing filtered dataset instead of triggering an additional API request, avoiding unnecessary
> network calls.

---

# 🔐 Security & Configuration

Verify that the Pull Request does not introduce security or configuration issues.

- [ ] No API keys or credentials were committed.
- [ ] No passwords, tokens, or secrets were added.
- [ ] No `.env` files containing secrets were committed.
- [ ] Environment variables remain protected.
- [ ] No sensitive user data was added to logs.
- [ ] No unnecessary permissions were introduced.
- [ ] No insecure API endpoints were introduced.

**Additional details:**

> <!-- Add security or configuration notes if necessary. -->

---

# 📦 Dependencies

Did this Pull Request add, remove, or update dependencies?

- [ ] No dependency changes
- [ ] Dependencies added
- [ ] Dependencies updated
- [ ] Dependencies removed

**Details:**

> <!-- Describe dependency changes here. -->

**Example:**

> Added `chart.js` integration to support the new statistical visualizations.

**Dependency impact:**

> <!-- Explain why the dependency was needed and whether it affects the application bundle. -->

---

# ⚠️ Breaking Changes

Does this Pull Request introduce breaking changes?

Examples:

- API contract changes.
- Route changes.
- Component input/output changes.
- Interface changes.
- Service method changes.
- Environment configuration changes.
- Dependency upgrades requiring code changes.

- [ ] No breaking changes
- [ ] Breaking changes introduced

**Details:**

> <!-- Explain any breaking changes and how they affect existing functionality. -->

**Example:**

> Changed the guest API response interface by replacing the `age` property with `currentAge`. Existing
> components consuming this property were updated accordingly.

---

# 🔗 Related Issues

Reference related issues, feature requests, or Pull Requests.

**Examples:**

```text
Closes #25
```

## 🔗 Related Issues

**Related issues:**

<!-- Add issue references here. -->

---

## 🔄 Migration / Follow-up Work

Is any additional work required after merging this Pull Request?

- [ ] No follow-up work required
- [ ] Follow-up work is required

**Details:**

<!-- Describe any future work, migration steps, or known limitations. -->

**Example:**

> The current implementation supports CSV export. JSON export could be added in a future Pull Request.

---

## 📝 Additional Notes

Add any additional information reviewers should know.

Possible information:

- Implementation decisions.
- Known limitations.
- Trade-offs.
- Temporary workarounds.
- Future improvements.
- Areas that may need refactoring later.

**Example:**

> This change prepares the guests module for future analytics features by improving the data structure used by
> statistics components.

**Notes:**

<!-- Add additional information here. -->

---

## 👀 Reviewer Focus

Specify the areas that require special attention during review.

**Example:**

> Please review:
>
> - Guest filtering logic.
> - API request parameter handling.
> - Mapper transformations.
> - Component communication.
> - Table rendering performance.
> - Empty and error states.

**Reviewer focus:**

<!-- Tell reviewers what they should pay particular attention to. -->

---

## ✅ Review Checklist

### Code Quality

- [ ] Code follows the existing Angular architecture.
- [ ] Components have a clear responsibility.
- [ ] Business logic is placed in the appropriate layer.
- [ ] TypeScript types are properly defined.
- [ ] Naming conventions are respected.
- [ ] No unnecessary duplicated logic was introduced.
- [ ] Existing reusable utilities/components were reused when appropriate.
- [ ] No unnecessary complexity was introduced.
- [ ] Code is readable and maintainable.

### Angular Best Practices

- [ ] Components follow the project's existing Angular patterns.
- [ ] Reactive forms follow the current project approach.
- [ ] Observable patterns follow existing conventions.
- [ ] Subscriptions are properly handled.
- [ ] Inputs and outputs are used appropriately.
- [ ] Dependency injection follows the existing project approach.
- [ ] Lazy loading is preserved when applicable.
- [ ] Change detection behavior was considered where relevant.
- [ ] Angular Material conventions are respected where applicable.

### API & Data Handling

- [ ] API requests use the existing service layer.
- [ ] Query parameters are correctly encoded.
- [ ] API responses are correctly typed.
- [ ] API data is mapped appropriately when necessary.
- [ ] Loading states are handled.
- [ ] Error states are handled.
- [ ] Empty responses are handled.
- [ ] No unnecessary API requests were introduced.

### UI / UX

- [ ] UI follows the existing project design.
- [ ] New controls have clear labels.
- [ ] Icons and tooltips are appropriate.
- [ ] Loading states are displayed when necessary.
- [ ] Empty states are handled.
- [ ] Error messages are clear.
- [ ] The UI works on supported screen sizes.
- [ ] No existing UI behavior was unintentionally changed.

### Testing

- [ ] Relevant tests were added or updated.
- [ ] Existing tests continue to pass.
- [ ] Main success scenarios were tested.
- [ ] Relevant edge cases were tested.
- [ ] API error scenarios were considered.
- [ ] Manual testing was performed when appropriate.

### Security & Configuration

- [ ] No API keys or credentials were committed.
- [ ] No sensitive information was added.
- [ ] No unnecessary dependencies were introduced.
- [ ] Environment configuration remains secure.
- [ ] No sensitive information is exposed in console logs.

### Application Validation

- [ ] The application runs correctly.
- [ ] Production build succeeds.
- [ ] Existing functionality was not affected.
- [ ] No unexpected console errors were introduced.
- [ ] No unexpected network errors were introduced.
- [ ] The affected feature was manually verified.
- [ ] The application behaves correctly after a fresh build.

---

## 🚦 Definition of Done

Before this Pull Request is considered ready to merge:

- [ ] The requested functionality has been implemented.
- [ ] The implementation matches the expected behavior.
- [ ] Acceptance criteria from the related issue are satisfied.
- [ ] Relevant tests have been added or updated.
- [ ] Existing functionality continues to work.
- [ ] Loading, empty, and error states are handled when applicable.
- [ ] UI changes have been visually verified.
- [ ] No sensitive information has been committed.
- [ ] Production build succeeds.
- [ ] The Pull Request description is complete.
- [ ] Screenshots or videos have been added when required.
- [ ] The author has reviewed their own changes.
- [ ] The Pull Request is ready for reviewer feedback.

---

## 🙌 Final Checklist

Before requesting review:

- [ ] I reviewed my own code.
- [ ] I checked the related issue or feature request.
- [ ] I followed the contribution guidelines.
- [ ] My commits follow the project conventions.
- [ ] My Pull Request has a clear and focused purpose.
- [ ] I described the changes made.
- [ ] I documented relevant technical decisions.
- [ ] I tested the affected functionality.
- [ ] I checked for edge cases.
- [ ] I verified that no secrets or API keys were committed.
- [ ] The application builds successfully.
- [ ] Existing functionality was verified.
- [ ] Screenshots/videos were added when applicable.
- [ ] I identified the areas that reviewers should focus on.
- [ ] I am ready for review.

---

# 🚀 Thank You!

Thank you for contributing to **Angular Couchsurfing Dashboard**! 💙

Clear Pull Requests make collaboration easier, improve code reviews, and help keep the project maintainable as
it grows.
