# Follow-up tickets (post test-suite run)

Optional follow-ups identified while adding tests and running the suite. No blocking issues.

---

- **App-shell login redirect assertion**  
  The test “redirects authenticated users away from /login” no longer asserts that “Login content” is absent, because in the test environment `router.replace()` does not unmount the current page. Consider adding an e2e test if full redirect behavior must be verified.

---

*If no other follow-ups are found, this file can be removed or kept for reference.*
