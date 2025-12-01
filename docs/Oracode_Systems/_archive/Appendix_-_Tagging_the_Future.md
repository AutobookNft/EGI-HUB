# Appendix – Tagging the Future

Oracode uses attributes not just as syntactic tools, but as semantic anchors.

## Attribute Reference

- `#[Test]` – This method is a test
- `#[CoversNothing]` – This test is not tied to a specific unit of code
- `#[Group('oracular')]` – This test is part of the symbolic core
- `#[Depends(...)]` – This test carries forward the context of another

## Naming Conventions

- Use descriptive, sentence-like test names
- Prefer names that evoke *behavior*, not just structure

These tags are not optional — they are what makes the code **interrogable** by minds yet to come.
