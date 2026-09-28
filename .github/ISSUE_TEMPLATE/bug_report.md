# 🐛 Bug Report

Thank you for taking the time to report a problem in **Angular Couchsurfing Dashboard**! 🙌

A detailed bug report helps us reproduce the problem, identify its cause, and fix it faster.

Before creating this issue, please make sure:

- 🔎 The problem has not already been reported.
- 📦 You are using the latest version available, when possible.
- 🔁 You can reproduce the problem or provide enough information to investigate it.
- 🔐 You have removed passwords, API keys, tokens, personal information, or other sensitive data.
- 📝 You have included screenshots, logs, or API information when they are relevant.

---

# 📌 Bug Description

## What happened?

Describe the problem clearly and explain what you were doing when it occurred.

Try to answer:

- What were you trying to do?
- What action triggered the problem?
- What went wrong?
- Which part of the application was affected?

**Example:**

> When filtering guests by country, the selected country disappears after changing pages in the table. The
> table then displays all guests instead of keeping the selected filter.

**Description:**

> <!-- Describe what happened. Include enough context to understand the problem. -->

---

# 🎯 Problem Summary

Provide a short summary of the bug in one or two sentences.

**Example:**

> The guest country filter is reset when navigating between pagination pages.

**Summary:**

> <!-- Write a short summary of the problem. -->

---

# 🔄 Steps to Reproduce

Provide the exact steps needed to reproduce the issue.

Use numbered steps and include the relevant values selected by the user.

**Example:**

1. Open the **Guests** page.
2. Select **Spain** in the country filter.
3. Click the **Search** button.
4. Confirm that only guests from Spain are displayed.
5. Navigate to page 2.
6. Observe that the country filter is reset.
7. Observe that guests from other countries are displayed.

**Steps:**

1. <!-- Step 1 -->
2. <!-- Step 2 -->
3. <!-- Step 3 -->
4. <!-- Step 4 -->
5. <!-- Step 5 -->

**Reproduction data:**

> Example: Country = `Spain`, page = `2`, date range = `2025-01-01` to `2026-09-28`.

---

# 🔁 Reproducibility

How often does the problem occur?

- [ ] Every time
- [ ] Almost every time
- [ ] Sometimes
- [ ] Rarely
- [ ] Only once
- [ ] Unable to determine

**Example:**

> The bug occurs every time the user changes the pagination page after applying a country filter.

**Details:**

> <!-- Explain when or how often the problem occurs. -->

---

# 🆕 Regression

Did this functionality work correctly before?

- [ ] Yes, it worked correctly before.
- [ ] No, it has never worked correctly.
- [ ] Not sure.
- [ ] This is a new feature.

If this is a regression, provide the version, commit, or Pull Request where the behavior was last known to
work.

**Example:**

> The filter worked correctly before the pagination changes introduced in the related Pull Request.

**Details:**

> <!-- Explain whether this is a regression. -->

---

# 🎯 Expected Behavior

Describe what should happen instead.

The expected behavior should be specific and observable.

**Example:**

> The selected country filter should remain active when navigating through pagination. The table should
> continue displaying only guests matching the selected country.

**Expected result:**

> <!-- Describe the correct behavior. -->

---

# ❌ Actual Behavior

Describe exactly what happens instead.

Include visible effects, unexpected values, error messages, or changes in application state.

**Example:**

> The application resets the country filter after navigating to page 2. The table then displays guests from
> all countries.

**Actual result:**

> <!-- Describe what actually happens. -->

---

# 📊 Data Affected

Does the bug affect application data?

- [ ] No data is affected.
- [ ] Data is displayed incorrectly.
- [ ] Data is missing.
- [ ] Data is duplicated.
- [ ] Data is not updated.
- [ ] Data is sent incorrectly to the API.
- [ ] Data is saved incorrectly.
- [ ] Other: <!-- Specify -->

**Example:**

> The API data is correct, but the frontend displays unfiltered results after pagination.

**Details:**

> <!-- Explain how the bug affects the data. -->

---

# 🖥️ Environment

## Application

Provide the relevant application and development environment versions.

**Example:**

```text
Project: Angular Couchsurfing Dashboard
Angular: 16.2.x
Node: 18.x
npm: 9.x
```

## 🖥️ Environment

Provide the versions of the technologies used when the bug occurs.

**Project:** Angular Couchsurfing Dashboard

**Angular:**

```text
<!-- Example: 16.2.x -->
```

**Node:**

```text
<!-- Example: 18.x -->
```

**npm:**

```text
<!-- Example: 9.x -->
```

If you are unsure how to obtain these versions, run:

```bash
ng version
```

and:

```bash
node --version
npm --version
```

---

## 🌐 Browser

Select the affected browser:

- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari
- [ ] Other: <!-- Specify -->

**Browser version:**

Example:

```text
Chrome 153.0.0.0
```

**Version:**

```text
<!-- Example: Chrome 153.0.0.0 -->
```

If the issue occurs in multiple browsers, list all affected browsers.

**Example:**

```text
Chrome 153.0.0.0
Firefox 143.0
```

---

## 📱 Device Information

Provide the device and operating system where the problem occurs.

**Example:**

```text
Device: Desktop / Laptop
Operating System: Windows 11
Architecture: x64
```

**Device:**

```text
Device: <!-- Example: Desktop / Laptop -->
Operating System: <!-- Example: Windows 11 -->
Architecture: <!-- Example: x64 -->
```

---

## 📐 Screen Size

Complete this section when the problem is related to:

- UI.
- Layout.
- Responsiveness.
- Visual rendering.

**Example:**

```text
1920x1080
```

**Screen size:**

```text
<!-- Example: 1920x1080 -->
```

For responsive issues, also mention the approximate viewport size where the problem occurs.

**Example:**

```text
Desktop: 1920x1080 → works correctly
Tablet: 1024x768 → layout breaks
Mobile: 390x844 → filter overlaps the table
```

---

## 🧩 Affected Feature

Select the area where the bug occurs:

- [ ] Guests list
- [ ] Guest cards
- [ ] Guest table
- [ ] Guest details
- [ ] Guest creation form
- [ ] Guest edit form
- [ ] Map view
- [ ] Statistics dashboard
- [ ] Filters
- [ ] Pagination
- [ ] Sorting
- [ ] Routing
- [ ] API communication
- [ ] Loading states
- [ ] Error handling
- [ ] Responsive layout
- [ ] UI / UX
- [ ] Other: <!-- Specify -->

**Details:**

```text
<!-- Explain which feature is affected and how. -->
```

**Example:**

> The bug affects the guest table pagination and the country filter because changing pages resets the selected
> filter.

---

## 🚦 Severity

How significantly does this bug affect the application?

- **Low** — Minor visual or usability issue with an available workaround.
- **Medium** — A feature does not work correctly, but the application remains usable.
- **High** — A major feature is broken or produces incorrect results.
- **Critical** — The application cannot be used correctly, data may be lost, or a severe failure occurs.

**Example:**

> **Medium** — The application remains usable, but users cannot reliably navigate filtered guest results.

**Severity details:**

```text
<!-- Explain why you selected this severity. -->
```

---

## 🛠️ Workaround

Is there a temporary workaround?

- [ ] Yes
- [ ] No
- [ ] Not known

**Example:**

> Users can reapply the filter after navigating to each page.

**Workaround:**

```text
<!-- Describe the workaround or explain why none is available. -->
```

---

## 📸 Screenshots / Videos

Add screenshots, screen recordings, or GIFs when they help demonstrate the problem.

Screenshots are especially useful for:

- UI layout problems.
- Incorrect data displayed.
- Broken responsive behavior.
- Unexpected states.
- Error messages.
- Map or chart problems.

**Example:**

> Screenshot showing the selected country filter before navigating to page 2 and the reset filter after
> navigation.

### Before the problem

```text
<!-- Add screenshot here -->
```

### After the problem

```text
<!-- Add screenshot here -->
```

### Video / GIF

```text
<!-- Add recording here if available -->
```

> [!WARNING] Remember to remove or hide sensitive information before uploading screenshots.

---

## 📋 Console Errors

Check the browser **Developer Tools → Console** and include relevant errors.

If there are no errors, mention that as well.

**Example:**

```text
ERROR TypeError: Cannot read properties of undefined
at GuestsComponent.loadGuests()
```

**Console output:**

```text
<!-- Paste relevant console errors here. -->
```

If there are no errors:

```text
No console errors were found.
```

---

## 🌐 API Information

Complete this section when the problem involves:

- API communication.
- Incorrect data.
- Filters.
- Pagination.
- Authentication.
- Network requests.

### Endpoint

**Example:**

```text
GET /api/v1/guests
```

**Endpoint:**

```text
<!-- Example: GET /api/v1/guests -->
```

### Request

Include relevant:

- Query parameters.
- Request body.
- Headers.

> [!WARNING] Do not include authentication tokens, API keys, passwords, or other sensitive information.

**Example:**

```text
GET /api/v1/guests?limit=10&page=2&country=Spain
```

**Request:**

```text
<!-- Add the relevant request information here. -->
```

### Expected API Response

If applicable, show what the API should return.

**Example:**

```json
{
  "status": "success",
  "data": {
    "items": []
  }
}
```

**Expected response:**

```json
{
  "status": "success"
}
```

### Actual API Response

If the API returns unexpected data, include the relevant response.

**Example:**

```json
{
  "status": "error",
  "message": "Invalid page parameter"
}
```

**Actual response:**

```json
{
  "status": "error"
}
```

### Network Request

If relevant, include information from the browser's **Network** tab.

**Example:**

```text
Request: GET /api/v1/guests?limit=10&page=2&country=Spain
Status: 200 OK
Response: Unexpected unfiltered guest list
```

**Network details:**

```text
<!-- Add relevant Network information here. -->
```

---

## 🧪 Additional Context

Add any information that could help reproduce, investigate, or understand the issue.

Useful examples include:

- The problem only happens with specific filters.
- The problem only occurs after refreshing the page.
- The problem started after a recent change.
- The problem only occurs on mobile.
- The problem only occurs with a specific dataset.
- The problem occurs only when multiple filters are combined.
- The problem disappears after restarting the application.

**Example:**

> The problem only occurs when the country filter is combined with pagination. Filtering by country works
> correctly when viewing the first page.

**Additional information:**

```text
<!-- Add any relevant context here. -->
```

---

## 🔗 Related Issues / Pull Requests

If this bug is related to another issue, feature request, or Pull Request, reference it here.

**Examples:**

```text
Related to #25
Introduced by #42
Regression from #58
```

**Related references:**

```text
<!-- Add related issue or Pull Request references here. -->
```

---

## 🔍 Possible Cause

If you have an idea about what might be causing the problem, describe it here.

> [!NOTE] This section is optional and should be treated as a hypothesis, not a confirmed diagnosis.

**Example:**

> The filter state may be lost because the pagination event triggers a new API request without including the
> current filter parameters.

**Possible cause:**

```text
<!-- Describe your hypothesis if you have one. -->
```

---

## 📝 Additional Notes

Add anything else that may be useful for investigation.

Examples:

- Relevant commits.
- Recent changes.
- Specific datasets.
- Temporary workarounds.
- Related components.
- Known limitations.
- Additional reproduction information.

**Example:**

> The issue started after the guest table pagination was refactored. No backend changes were made during the
> same period.

**Notes:**

```text
<!-- Add additional information here. -->
```

---

# ✅ Reporter Checklist

Before submitting this issue:

- [ ] I searched existing issues for similar problems.
- [ ] I provided a clear description of the problem.
- [ ] I included reproducible steps.
- [ ] I described the expected behavior.
- [ ] I described the actual behavior.
- [ ] I provided the relevant browser and environment information.
- [ ] I included screenshots or videos when useful.
- [ ] I checked the browser console for errors.
- [ ] I included API information when relevant.
- [ ] I described whether the issue is reproducible.
- [ ] I identified the affected feature.
- [ ] I removed API keys, credentials, tokens, and sensitive information.
- [ ] I included related issues or Pull Requests when applicable.
- [ ] I provided a workaround if one is known.
- [ ] I have provided enough information for someone else to reproduce the issue.

---

# 👀 Maintainer / Developer Notes

This section is intended for investigation and resolution.

## 🔍 Investigation

**Example:**

> Reproduced locally using Chrome 153 and Angular 16.2.x. The filter state is lost when the pagination event
> triggers `loadGuests()`.

**Investigation notes:**

```text
<!-- Add investigation findings here. -->
```

---

## 🎯 Root Cause

Complete this section once the cause has been identified.

**Example:**

> The pagination handler recreated the API query parameters without including the currently selected continent
> and country filters.

**Root cause:**

```text
<!-- Describe the confirmed root cause here. -->
```

---

## 🔧 Fix

Describe how the issue was resolved.

**Example:**

> Updated the pagination handler to preserve the active filter state and include all selected filter values in
> subsequent API requests.

**Fix:**

```text
<!-- Describe the implemented fix here. -->
```

---

## 🧪 Verification

Explain how the fix was verified.

**Example:**

> Verified that country and continent filters remain active while navigating between pages. Also verified that
> clearing the filters continues to return the complete guest list.

**Verification performed:**

- [ ] Bug can no longer be reproduced.
- [ ] Original reproduction steps were retested.
- [ ] Related functionality was tested.
- [ ] Relevant tests were added or updated.
- [ ] No new console errors were introduced.
- [ ] Production build succeeds.

**Additional verification:**

```text
<!-- Describe the verification performed. -->
```

---

# 🚀 Thank You!

Thank you for helping improve **Angular Couchsurfing Dashboard**! 💙

Clear and reproducible bug reports make it easier to identify problems, implement reliable fixes, and keep the
project stable as it grows.
