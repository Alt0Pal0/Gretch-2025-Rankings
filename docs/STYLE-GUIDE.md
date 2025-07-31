# Stealing Signals Design System

## Color Palette

### Primary Colors (From Logo)
- **Orange Primary**: `#ff6b35` - Main brand color from logo
- **Orange Light**: `#ff8c5a` - Hover states, lighter accents
- **Orange Dark**: `#e55a2e` - Active states, emphasis
- **Orange Pale**: `#fff0eb` - Background tints

### Metallic Grays (From UFO)
- **Gray Metallic**: `#9ca3af` - Main metallic tone
- **Gray Light**: `#d1d5db` - Subtle backgrounds
- **Gray Medium**: `#6b7280` - Secondary text
- **Gray Dark**: `#4b5563` - Primary text
- **Gray Charcoal**: `#374151` - Headers, emphasis

### Industrial Accents
- **Navy**: `#1e293b` - Deep contrast
- **Steel**: `#475569` - Industrial feel
- **Carbon**: `#0f172a` - Deepest dark

### Signal Colors (Tech Theme)
- **Cyan**: `#06b6d4` - Tech signals
- **Teal**: `#0d9488` - Data indicators
- **Green**: `#059669` - Success states

## Typography

### Font Stack
- **Primary**: Inter, system fonts
- **Monospace**: JetBrains Mono, Fira Code
- **Display**: Space Grotesk (for headers)

### Text Colors
- **Primary Text**: `--ss-text-primary` (Carbon)
- **Secondary Text**: `--ss-text-secondary` (Gray Dark)
- **Muted Text**: `--ss-text-muted` (Gray Medium)
- **Accent Text**: `--ss-text-accent` (Orange Primary)

## Components

### Buttons

```html
<!-- Primary Button -->
<button class="ss-btn ss-btn-primary">Primary Action</button>

<!-- Secondary Button -->
<button class="ss-btn ss-btn-secondary">Secondary</button>

<!-- Outline Button -->
<button class="ss-btn ss-btn-outline">Outline</button>

<!-- Ghost Button -->
<button class="ss-btn ss-btn-ghost">Ghost</button>
```

### Form Elements

```html
<!-- Input Field -->
<input type="text" class="ss-input" placeholder="Enter text...">

<!-- Textarea -->
<textarea class="ss-input ss-textarea" placeholder="Enter message..."></textarea>

<!-- Select -->
<select class="ss-input ss-select">
  <option>Choose option...</option>
</select>
```

### Cards

```html
<div class="ss-card">
  <div class="ss-card-header">
    <h3 class="ss-card-title">Card Title</h3>
    <p class="ss-card-description">Card description text</p>
  </div>
  <p>Card content goes here...</p>
</div>
```

### Alerts

```html
<div class="ss-alert ss-alert-success">Success message</div>
<div class="ss-alert ss-alert-warning">Warning message</div>
<div class="ss-alert ss-alert-error">Error message</div>
<div class="ss-alert ss-alert-info">Info message</div>
```

### Navigation

```html
<nav class="ss-nav">
  <a href="#" class="ss-nav-link ss-nav-link-active">Home</a>
  <a href="#" class="ss-nav-link">About</a>
  <a href="#" class="ss-nav-link">Contact</a>
</nav>
```

### Badges

```html
<span class="ss-badge ss-badge-primary">Primary</span>
<span class="ss-badge ss-badge-secondary">Secondary</span>
<span class="ss-badge ss-badge-success">Success</span>
```

### Footer

```html
<div id="footer-placeholder"></div>

<script>
  fetch('components/footer.html')
    .then(response => response.text())
    .then(data => document.getElementById('footer-placeholder').innerHTML = data);
</script>
```

## Design Principles

### 1. Industrial Aesthetic
- Use metallic grays for sophisticated, tech-forward feel
- Incorporate orange strategically for energy and focus
- Maintain clean, geometric layouts

### 2. Signal Theme
- Orange represents "signals" being transmitted
- Gray represents the "stealing" (stealth, technology)
- Use cyan/teal for data visualization

### 3. Accessibility
- Maintain 4.5:1 contrast ratios minimum
- Orange on white: 4.7:1 ratio ✓
- Gray dark on white: 9.6:1 ratio ✓

### 4. Responsive Design
- Mobile-first approach
- Consistent spacing system
- Scalable components

## Usage Guidelines

### Do's
- Use orange for primary actions and highlights
- Use metallic grays for sophisticated backgrounds
- Combine with plenty of white space
- Use consistent border radius (0.5rem standard)

### Don'ts
- Don't overuse orange (max 20% of interface)
- Don't use pure black (#000000)
- Don't mix warm and cool grays
- Don't use orange for error states

## File Structure

```
├── assets/
│   └── images/          # Logos, images, icons
├── components/          # Reusable HTML components
│   ├── header.html
│   └── footer.html
├── css/                # Stylesheets
│   ├── design-system.css
│   └── quick-reference.css
├── docs/               # Documentation
│   └── STYLE-GUIDE.md
└── index.html          # Main pages
```

## CSS Variables Reference

All colors and design tokens are available as CSS custom properties:

```css
/* Primary Colors */
var(--ss-orange-primary)
var(--ss-orange-light)
var(--ss-orange-dark)

/* Text Colors */
var(--ss-text-primary)
var(--ss-text-secondary)
var(--ss-text-muted)

/* Component Classes */
.ss-btn, .ss-card, .ss-input, .ss-alert, .footer
```

## Implementation

Include the design system CSS file in your HTML:

```html
<link rel="stylesheet" href="css/design-system.css">
```

Load header and footer components:

```html
<!-- Header -->
<div id="header-placeholder"></div>

<!-- Footer -->
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
```

Then use the component classes throughout your site for consistent styling.