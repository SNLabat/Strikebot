# Strikebot - Chatbot Builder Platform

An internal tool for building and configuring AI chatbots that can be deployed as WordPress plugins. Similar to Chatbase and Botsonic, this platform allows you to create customized chatbot configurations and download them as ready-to-install WordPress plugins.

## Features

### Web Application (Builder Tool)
- **Tier-based Configuration**: Select from Free, Hobby, Standard, or Pro plans with different limits
- **Model Selection**: Choose from various AI models (GPT-4o, GPT-3.5, Claude, etc.)
- **Theme Customization**: Full color customization with light/dark mode support
- **Widget Settings**: Configure position, welcome messages, and custom icons
- **Live Preview**: See your chatbot appearance in real-time
- **Plugin Generator**: Download a pre-configured WordPress plugin as a ZIP file

### WordPress Plugin
- **Pre-configured**: All settings from the builder are baked into the plugin
- **Knowledge Base Management**:
  - Sitemap crawling
  - Website URL crawling
  - File uploads (TXT, PDF, DOC, DOCX)
  - Copy/paste text content
  - Q&A pairs
- **Customizable Appearance**: Change colors, icons (from Media Library), and themes after installation
- **Usage Tracking**: Monitor message usage against plan limits
- **Storage Limits**: Enforced storage limits based on tier
- **Clean Uninstall**: Complete data removal when plugin is deleted

## Tier Plans

| Feature | Free | Hobby | Standard | Pro |
|---------|------|-------|----------|-----|
| Price | $0/mo | $40/mo | $150/mo | $500/mo |
| Messages/Month | 50 | 1,500 | 10,000 | 40,000 |
| Storage | 400 KB | 20 MB | 40 MB | 60 MB |
| Training Links | 10 | Unlimited | Unlimited | Unlimited |
| Model Access | Limited | Advanced | Advanced | Advanced |
| API Access | No | Yes | Yes | Yes |
| Analytics | None | Basic | Basic | Advanced |
| Auto Retrain | No | No | Yes | Yes |

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Strikebot

# Install dependencies
npm install

# Run development server
npm run dev
```

### Deployment to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with default settings

Or use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

## Usage

1. **Select a Tier**: Choose the plan that matches your client's needs
2. **Configure Settings**: Enter the chatbot name, API key, and select the AI model
3. **Customize Theme**: Pick colors and enable light/dark mode
4. **Set Widget Options**: Configure welcome message, placeholder text, and position
5. **Preview**: Review all settings in the Preview tab
6. **Download**: Click "Download Plugin" to get the WordPress plugin ZIP file
7. **Install**: Upload the ZIP file to WordPress via Plugins > Add New > Upload Plugin

## WordPress Plugin Structure

```
strikebot/
├── strikebot.php          # Main plugin file
├── uninstall.php          # Clean uninstall handler
├── assets/
│   ├── css/
│   │   ├── admin.css      # Admin dashboard styles
│   │   └── widget.css     # Frontend widget styles
│   └── js/
│       ├── admin.js       # Admin functionality
│       └── widget.js      # Widget chat functionality
└── templates/
    ├── admin/
    │   ├── dashboard.php  # Main dashboard
    │   ├── knowledge.php  # Knowledge base management
    │   ├── appearance.php # Theme customization
    │   └── settings.php   # Plugin settings
    └── widget.php         # Frontend chat widget
```

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Plugin Generator**: archiver (ZIP creation)
- **WordPress Plugin**: PHP 7.4+, WordPress 5.0+
- **Deployment**: Vercel

## API Endpoints

### POST /api/generate-plugin
Generates a WordPress plugin ZIP file based on the provided configuration.

**Request Body:**
```json
{
  "config": {
    "id": "uuid",
    "name": "My Chatbot",
    "tier": "hobby",
    "model": "gpt-4o",
    "apiKey": "sk-...",
    "apiEndpoint": "https://api.openai.com/v1",
    "theme": { ... },
    "widget": { ... },
    "limits": { ... },
    "features": { ... }
  }
}
```

**Response:** ZIP file download

## License

This is an internal tool. All rights reserved.
