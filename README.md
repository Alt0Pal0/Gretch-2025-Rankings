# Gretch 2025 Rankings

A data-driven ranking website powered by the Stealing Signals design system.

## 🛸 Project Overview

This website showcases rankings and analytics using the industrial, tech-forward aesthetic of the Stealing Signals brand. Built with signal intelligence in mind, the site features a custom design system inspired by data interception and analysis themes.

## 📁 Project Structure

```
Gretch-2025-Rankings/
├── assets/
│   └── images/              # Logos, images, icons, favicons
│       ├── logo.png         # Main Stealing Signals logo
│       └── favicon.png      # Browser favicon
├── components/              # Reusable HTML components
│   ├── header.html          # Site header with logo and navigation
│   └── footer.html          # Site footer with links and branding
├── css/                     # Stylesheets and design system
│   ├── design-system.css    # Complete design system and components
│   └── quick-reference.css  # Developer snippets and utilities
├── docs/                    # Documentation and guides
│   └── STYLE-GUIDE.md       # Complete design system documentation
├── index.html               # Main homepage
├── example-page.html        # Component demo page
└── README.md               # This file
```

## 🎨 Design System

### Color Palette
- **Primary Orange**: #ff6b35 (from logo)
- **Metallic Grays**: #9ca3af, #6b7280, #4b5563
- **Industrial Accents**: Navy, Steel, Carbon
- **Signal Colors**: Cyan, Teal for data visualization

### Typography
- **Primary**: Inter (clean, readable)
- **Display**: Space Grotesk (headers)
- **Monospace**: JetBrains Mono (code/data)

## 🚀 Getting Started

### 1. Clone and Setup
```bash
git clone [your-repo-url]
cd Gretch-2025-Rankings
```

### 2. Development
Open `index.html` in your browser or use a local server:
```bash
# With Python
python -m http.server 8000

# With Node.js
npx serve .
```

### 3. Build New Pages
Use this template for new pages:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title - Gretch 2025 Rankings</title>
    
    <link rel="icon" type="image/png" href="assets/images/favicon.png">
    <link rel="stylesheet" href="css/design-system.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div id="header-placeholder"></div>
    
    <main class="page-content">
        <!-- Your content here -->
    </main>
    
    <div id="footer-placeholder"></div>
    
    <script>
        // Load components
        fetch('components/header.html')
            .then(response => response.text())
            .then(data => document.getElementById('header-placeholder').innerHTML = data);
        
        fetch('components/footer.html')
            .then(response => response.text())
            .then(data => document.getElementById('footer-placeholder').innerHTML = data);
    </script>
</body>
</html>
```

## 🧩 Components

### Available Components
- **Buttons**: `.ss-btn-primary`, `.ss-btn-secondary`, `.ss-btn-outline`, `.ss-btn-ghost`
- **Cards**: `.ss-card` with headers and content areas
- **Forms**: `.ss-input`, `.ss-textarea`, `.ss-select`
- **Alerts**: `.ss-alert-success`, `.ss-alert-warning`, `.ss-alert-error`, `.ss-alert-info`
- **Badges**: `.ss-badge-primary`, `.ss-badge-secondary`, `.ss-badge-success`

### Quick Layouts
- **Hero Section**: `.hero` with title and subtitle
- **Feature Grid**: `.feature-grid` with `.feature-card`
- **Stats Display**: `.stats-grid` with `.stat-card`
- **CTA Section**: `.cta-section` for call-to-actions

## 📱 Responsive Design

The design system is mobile-first with these breakpoints:
- **Mobile**: < 480px
- **Tablet**: 481px - 768px  
- **Desktop**: > 768px

## 🔗 Links & Resources

- **Design System**: `docs/STYLE-GUIDE.md`
- **Quick Reference**: `css/quick-reference.css`
- **Component Demo**: `example-page.html`
- **Stealing Signals**: [bengretch.substack.com](https://bengretch.substack.com/)

## 🛠 Development Guidelines

### Adding New Components
1. Add styles to `css/design-system.css`
2. Follow the `.ss-*` naming convention
3. Include responsive breakpoints
4. Update documentation in `docs/STYLE-GUIDE.md`

### File Organization
- **Images**: Place in `assets/images/`
- **Components**: Create in `components/`
- **Styles**: Add to appropriate CSS file
- **Documentation**: Update relevant docs

### Color Usage
- **Orange**: Primary actions, highlights, accents (max 20% of interface)
- **Grays**: Text, backgrounds, subtle elements
- **Navy/Steel**: Deep contrasts, industrial feel
- **Cyan/Teal**: Data visualization, signal indicators

## 🚢 Deployment

This project is designed for **Vercel** deployment:

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect it as a static site
3. No build configuration needed
4. Favicon and assets will be served correctly

## 📊 Future Enhancements

- [ ] Add data visualization components
- [ ] Implement ranking tables and charts  
- [ ] Add search and filtering functionality
- [ ] Create admin interface for updating rankings
- [ ] Add animation and micro-interactions

---

**Powered by Stealing Signals intelligence** 🛸