# 🚀 SB AI Learning Platform Framework

**Complete framework for building AI-powered learning applications with authentication, payments, and modular AI features.**

Transform this template into language learning apps, tutoring platforms, or any AI-powered educational tool in minutes.

## ✨ What's Included

### 🔐 Complete Authentication System
- Google OAuth integration
- Email/password authentication  
- Session management
- Admin user roles

### 💳 Payment & Subscription System
- Paddle payment integration (KRW support)
- Flexible pricing tiers
- Usage limit management
- Subscription lifecycle

### 🤖 AI Feature Suite
- OpenAI GPT-4o conversation
- DALL-E 3 image generation
- High-quality TTS with multiple voices
- Character creation and management

### 🎨 Modern UI/UX
- Responsive design (mobile + desktop)
- Dark/light mode support
- Beautiful components (Shadcn/ui)
- Professional animations

### 🏗️ Modular Architecture
- Reusable SB modules (sb_auth, sb_payment, sb_ai)
- Clean separation of concerns
- Easy to customize and extend

## 🚀 Quick Start

### 1. Clone & Setup
```bash
git clone [your-repo-url]
cd sb-ai-learning-platform
cp .env.example .env
```

### 2. Configure Environment
Edit `.env` with your API keys:
```env
DATABASE_URL=your_postgresql_url
GOOGLE_CLIENT_ID=your_google_client_id
OPENAI_API_KEY=your_openai_api_key
PADDLE_VENDOR_ID=your_paddle_vendor_id
SESSION_SECRET=your_random_secret
```

### 3. Install & Run
```bash
npm install
npm run db:push
npm run dev
```

### 4. Customize Your App
- Edit `shared/schema.ts` for app name/config
- Modify pricing in `client/src/pages/Subscription.tsx`
- Update branding in `client/src/index.css`
- Change AI prompts in `server/routes.ts`

## 🎯 Use Cases & Examples

### Language Learning Apps
- **English Tutor** (current implementation)
- **Japanese Learning** - Change prompts, add hiragana/katakana
- **Chinese Learning** - HSK levels, character practice
- **Any Language** - Minimal configuration needed

### Educational Platforms
- **Math Tutoring** - AI explains problems step-by-step
- **Science Learning** - Interactive experiments and explanations
- **History Lessons** - Chat with historical characters
- **Coding Bootcamp** - AI code review and guidance

### Business Applications
- **Customer Service Training** - Role-play scenarios
- **Sales Training** - Practice pitches with AI prospects
- **Language for Business** - Industry-specific vocabulary
- **Soft Skills Development** - Communication practice

## 📁 SB Module System

This framework includes reusable modules that can be mixed and matched:

```typescript
// Use all modules (full learning platform)
import { SBAuthConfig } from '@modules/sb_auth';
import { SBPaymentConfig } from '@modules/sb_payment';
import { SBAIConfig } from '@modules/sb_ai';

// Use only what you need (simple AI tool)
import { SBAIConfig } from '@modules/sb_ai';
```

### Available Modules
- **sb_auth**: Authentication and user management
- **sb_payment**: Subscription and payment processing
- **sb_ai**: AI conversation, image generation, TTS

## 🔧 Customization Guide

### Change App Purpose
1. **Update app config** in `shared/schema.ts`
2. **Modify landing page** in `client/src/pages/Landing.tsx`
3. **Adjust AI prompts** in `server/routes.ts`
4. **Update pricing model** in subscription pages

### Add New Features  
1. **Extend SB modules** with new capabilities
2. **Add custom components** in `client/src/components/`
3. **Create new API routes** in `server/routes.ts`
4. **Update database schema** in `shared/schema.ts`

### Multi-tenant Support
- User workspace isolation
- Custom branding per tenant
- Separate usage limits
- White-label options

## 📊 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: OpenAI (GPT-4o, DALL-E 3, TTS)
- **Auth**: Passport.js + Google OAuth
- **Payments**: Paddle + Korean Won support
- **UI**: Tailwind CSS + Shadcn/ui + Framer Motion
- **Deployment**: Replit (production-ready)

## 🚀 Deployment Options

### 1. Replit Deployment (Recommended)
- One-click deployment
- Automatic scaling
- Built-in database
- Custom domains

### 2. Developer Framework
- Publish as Replit template
- Others can remix your framework
- Community contributions

### 3. Self-hosted
- Deploy to Vercel, Netlify, etc.
- Custom infrastructure
- Full control

## 📚 Documentation

- **[SB_MODULES_README.md](./SB_MODULES_README.md)** - Module system guide
- **[TEMPLATE_GUIDE.md](./TEMPLATE_GUIDE.md)** - Customization instructions  
- **[PROJECT_BACKUP_INSTRUCTIONS.md](./PROJECT_BACKUP_INSTRUCTIONS.md)** - Deployment guide

## 🤝 Contributing

This framework is designed to be:
1. **Forked** for your own projects
2. **Remixed** on Replit
3. **Extended** with new modules
4. **Shared** as templates

## 📄 License

MIT License - Use freely for commercial and personal projects.

## 💡 Support

- **Documentation**: Check the guides in this repo
- **Community**: Replit Discord and forums
- **Issues**: GitHub Issues for bugs and features

---

**Ready to build your AI-powered learning platform?** 
- 🔄 **Remix this Repl** to get started instantly
- 📖 **Read the guides** for customization help
- 🚀 **Deploy** and share your creation

Transform this template into your vision in minutes, not months!