---
'tracktive': minor
---

Add the login screen and the session it creates.

Enter a Productive API token and organization ID to sign in. The person behind the token is
resolved from the API rather than typed, and the credentials are kept in this browser so a refresh
keeps you signed in; the account menu's Log out removes them and clears everything cached for them.

Failed sign-ins say which thing is wrong: a rejected token, a token with no person in that
organization, and an unreachable API each read differently. Every screen now sits behind the
session, so opening one without signing in lands on the login screen instead.

The screen is built from the design source rather than from its exports, so the brand mark,
type sizes, control heights, alert treatment and icons match it exactly.
