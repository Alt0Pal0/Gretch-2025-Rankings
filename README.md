# Gretch 2025 NFL Player Rankings

A dynamic NFL player rankings system with database-driven content management and cookie-based draft tracking.

## Features

- **Dynamic Player Rankings**: Database-driven player data with real-time updates
- **Draft Tracking**: Cookie-based player selection that persists across sessions
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Tier Breaks**: Visual indicators for player tiers (small and big breaks)
- **Player Styling**: Bold (target) and italic (fade) player indicators
- **Version Control**: Track ranking changes across updates

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Backend**: Vercel Functions (Node.js)
- **Database**: Vercel Postgres
- **Hosting**: Vercel
- **Styling**: CSS with custom design system

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- Vercel account
- Vercel CLI installed (`npm i -g vercel`)

### 2. Local Development
```bash
# Clone the repository
git clone <your-repo-url>
cd gretch-2025-rankings

# Install dependencies
npm install

# Set up Vercel project (creates local environment)
vercel link

# Connect Vercel Postgres database
vercel env add

# Run database setup (creates schema and migrates data)
npm run setup

# Start development server
vercel dev
```

### 3. Deployment
```bash
# Deploy to Vercel
vercel deploy

# Promote to production
vercel --prod
```

## Database Schema

### Tables
- **ranking_versions**: Tracks version history with notes
- **players**: Stores all player data including rankings, styling, and metadata

### Key Features
- Version-controlled rankings
- Tier break indicators
- Player styling (bold/italic)
- NFL team and bye week data
- Player news and ranking changes

## API Endpoints

### Public
- `GET /api/players` - Get current version player data

### Future (Edit Interface)
- `GET /api/edit/players` - Get editable player data
- `POST /api/edit/players` - Add new player
- `PUT /api/edit/players/:id` - Update player
- `DELETE /api/edit/players/:id` - Remove player
- `POST /api/edit/publish` - Create new version

## Project Structure

```
├── api/                    # Vercel Functions
│   └── players.js         # Player data API
├── assets/                # Static assets
│   └── images/           # Logos and images
├── components/           # Reusable HTML components
│   ├── header.html      # Site header
│   └── footer.html      # Site footer
├── css/                 # Stylesheets
│   └── design-system.css # Main design system
├── db/                  # Database files
│   └── schema.sql      # Database schema
├── scripts/            # Utility scripts
│   ├── setup.js       # Database setup
│   └── migrate.js     # Data migration
├── index.html         # Main rankings page
├── package.json       # Dependencies
└── vercel.json       # Vercel configuration
```

## Development Roadmap

### Phase 1: Database & API ✅
- [x] Database schema creation
- [x] API endpoints for player data
- [x] Frontend integration with API
- [x] Data migration from static content

### Phase 2: Edit Interface (Next)
- [ ] `/edit_rankings` page creation
- [ ] Player management interface
- [ ] Drag-and-drop reordering
- [ ] Version creation workflow

### Phase 3: Advanced Features (Future)
- [ ] Authentication system
- [ ] Player news management
- [ ] Ranking change analytics
- [ ] Performance optimizations

## Environment Variables

When connecting Vercel Postgres, these will be automatically configured:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NO_SSL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

## Contributing

1. Make changes to the codebase
2. Test locally with `vercel dev`
3. Deploy to preview with `vercel deploy`
4. Promote to production with `vercel --prod`