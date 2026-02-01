# Admin Dashboard Project Structure

## Overview
This React + Vite project now uses a centralized AdminLayout component with proper routing using Wouter.

## Project Structure

```
client/src/
├── components/
│   ├── AdminLayout.jsx          # Main layout component with sidebar
│   ├── AdminLayout.css          # Layout-specific styles
│   ├── Layout.tsx              # Old layout (can be removed)
│   └── ui/                     # UI components
├── pages/
│   ├── home.tsx                # Orders page
│   ├── customerList.tsx        # Customers page
│   ├── reports.tsx             # Reports page
│   ├── settings.tsx            # Settings page
│   ├── login.tsx               # Login page
│   └── dashboard.tsx           # Old dashboard (can be removed)
├── App.tsx                     # Main app with routing
├── index.css                   # Global styles
└── main.tsx                    # App entry point
```

## Key Features

### AdminLayout Component
- Fixed sidebar with navigation
- Responsive design (mobile-friendly)
- Proper routing integration with Wouter
- Consistent header across all pages

### Routing Structure
- `/admin/orders` - Create Orders page
- `/admin/customers` - Customers page  
- `/admin/reports` - Reports page
- `/admin/settings` - Settings page
- `/` - Redirects to orders page

### CSS Architecture
- Plain CSS (no UI libraries)
- Fixed sidebar layout
- Responsive breakpoints
- Mobile-first approach

## Usage

The AdminLayout component automatically:
1. Renders the fixed sidebar
2. Handles mobile menu toggle
3. Shows active page in navigation
4. Provides logout functionality
5. Renders page content in main area

All admin pages are now wrapped in this layout automatically through the routing setup.