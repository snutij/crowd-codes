# crowd-codes

A community-driven promo code aggregator that scrapes YouTube video descriptions to extract discount codes. Built with radical transparency, zero friction, and designed to be easily forked.

## Philosophy

- **Radical transparency** - Public stats page, open-source codebase
- **Zero friction** - No accounts, no ads, instant copy
- **Self-improving** - System gets smarter over time with LLM-suggested regex patterns
- **Fork-friendly** - Easy for anyone to deploy their own instance

## Features

- Search for promo codes by brand name with fuzzy matching
- One-click copy to clipboard
- Daily automated scraping from YouTube FR
- Regex + LLM fallback parsing for maximum extraction
- Static site generation for blazing-fast performance
- Mobile-first, accessible design (WCAG 2.1 AA)

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- npm (included with Node.js)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/crowd-codes.git
cd crowd-codes

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install

# Run development server
npm run serve
```

The site will be available at `http://localhost:8080`.

## Development

```bash
# Build the site (outputs to _site/)
npm run build

# Run development server with hot reload
npm run serve

# Run tests (when available)
npm test
```

## Project Structure

```
crowd-codes/
├── .github/workflows/     # CI/CD pipelines
├── data/                  # SQLite database + regex patterns
├── scripts/               # Pipeline scripts (scrape, parse, export)
├── src/                   # Eleventy source files
│   ├── _data/             # JSON data for templates
│   ├── _includes/         # Shared Nunjucks templates
│   └── brands/            # Brand page templates
├── public/                # Static assets (CSS, JS)
├── tests/                 # Test files
├── .eleventy.js           # Eleventy configuration
└── package.json
```

## Deployment

### Cloudflare Pages

1. Fork this repository to your GitHub account

2. Create a [Cloudflare](https://cloudflare.com) account (free)

3. Go to Cloudflare Dashboard → Pages → Create a project

4. Connect your GitHub repository

5. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `_site`

6. Cloudflare will automatically deploy on every push to `main`

7. Your site will be available at `https://your-project.pages.dev`

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

### Required for Data Pipeline

| Variable | Description |
|----------|-------------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 key ([Get one here](https://console.cloud.google.com/apis/credentials)) |
| `GEMINI_API_KEY` | Google Gemini API key for LLM fallback ([Get one here](https://aistudio.google.com/app/apikey)) |

> **Note:** These variables must also be added as GitHub Secrets for the daily pipeline workflow.

### Optional

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | For creating PRs with regex suggestions |
| `SITE_HOSTNAME` | Custom hostname for sitemap (default: `crowd-codes.pages.dev`) |
| `DISCORD_WEBHOOK_URL` | Discord webhook for build failure notifications |
| `SLACK_WEBHOOK_URL` | Slack webhook for build failure notifications |

## Contributing

Contributions are welcome! Please read our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Format

```
type(scope): description

# Examples:
feat: add search functionality
fix(parser): handle edge case in regex
docs: update deployment instructions
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with [Eleventy](https://www.11ty.dev/) v3.0
- Hosted on [Cloudflare Pages](https://pages.cloudflare.com/)
- Search powered by [Fuse.js](https://fusejs.io/)
