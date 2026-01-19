# Contributing to crowd-codes

Thank you for your interest in contributing to crowd-codes! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful and inclusive. We welcome contributions from everyone.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/crowd-codes.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature`

## Development Workflow

### Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run serve

# Build for production
npm run build
```

### Project Structure

- `src/` - Eleventy source files (templates, data)
- `public/` - Static assets (CSS, JS)
- `scripts/` - Pipeline scripts (scrape, parse, export)
- `data/` - SQLite database and regex patterns
- `tests/` - Test files

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages.

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, no logic change) |
| `refactor` | Code refactoring |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system or dependencies |
| `ci` | CI/CD configuration |
| `chore` | Other changes (tooling, etc.) |
| `revert` | Revert a previous commit |

### Examples

```bash
feat: add fuzzy search with Fuse.js
fix(parser): handle empty descriptions gracefully
docs: update deployment instructions
ci: add build timeout to workflow
refactor(scraper): extract YouTube adapter
```

### Rules

- Use imperative mood ("add" not "added")
- First line max 72 characters
- No trailing period
- Add `!` after type for breaking changes: `feat!: remove legacy API`

## Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following the code style
3. **Write tests** for new functionality
4. **Update documentation** if needed
5. **Commit** using conventional commits
6. **Push** to your fork
7. **Open a Pull Request** with a clear description

### PR Title Format

Use the same format as commit messages:

```
feat: add brand search autocomplete
fix(copy): handle clipboard API errors
```

### PR Description Template

```markdown
### Motivation

Brief description of why this change is needed.

### Implementation

What was changed and how.

### Testing

How to test the changes.

### Checklist

- [ ] Tests pass
- [ ] Documentation updated
- [ ] Conventional commit messages used
```

## Code Style

### JavaScript

- ES Modules (`import`/`export`, not `require()`)
- `async`/`await` for asynchronous code
- camelCase for variables and functions
- SCREAMING_SNAKE_CASE for constants

### CSS

- Vanilla CSS with custom properties
- Mobile-first approach
- kebab-case for class names

### File Naming

- kebab-case for all files: `my-component.js`, `user-profile.njk`
- Tests in `tests/` directory: `feature.test.js`

### JSON/SQLite

- snake_case for all field names
- ISO 8601 for dates: `2026-01-19T10:30:00Z`

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/parser.test.js
```

### Test Guidelines

- Place tests in `tests/` directory
- Name test files `*.test.js`
- Write meaningful test descriptions
- Cover edge cases and error handling

## Questions?

Open an issue or start a discussion. We're happy to help!
