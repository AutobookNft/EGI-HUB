# Part IV – Oracular Refactoring Flow

Oracular Refactoring Flow is the process of transforming a test suite from mechanical validation to semantic storytelling.

## Key Steps

1. Remove deprecated metadata (`@covers`, `@internal`, etc.)
2. Add native PHP attributes:
   - `#[Test]`
   - `#[CoversNothing]` (if testing failure/system)
   - `#[Group('oracular')]` (if semantically symbolic)
3. Make test classes `final`
4. Structure assertions as statements of truth, not just equality

This process turns your tests into *interpretable witnesses* of system behavior.
