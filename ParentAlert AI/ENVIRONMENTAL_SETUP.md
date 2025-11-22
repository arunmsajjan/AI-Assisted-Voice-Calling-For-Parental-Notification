# ParentAlert AI - Environmental Setup Guide

## 🚀 Complete Setup Instructions for Development & Deployment

### 📋 Prerequisites

**Required Software:**
```bash
Node.js >= 18.0.0
npm >= 8.0.0 OR Bun >= 1.0.0
Git
```

**Required Accounts:**
- Google Cloud Console (for OAuth)
- Cloudflare Account (for Workers & D1)
- ClickSend Account (for voice calling)
- Mocha Users Service (provided)

---

## 🔧 1. Project Setup

### Clone & Install Dependencies
```bash
# Clone the repository
git clone <repository-url>
cd parentalert-ai

# Install dependencies (choose one)
npm install
# OR
bun install
```

### Project Structure Overview
```
parentalert-ai/
├── src/
│   ├── react-app/          # Frontend (React + Vite)
│   ├── worker/             # Backend (Cloudflare Worker)
│   └── shared/             # Shared TypeScript types
├── index.html              # Entry point
├── wrangler.json           # Cloudflare deployment config
└── package.json            # Dependencies
```

---

## 🔐 2. Environment Variables & Secrets

### Required Secrets (Already Configured)
```
MOCHA_USERS_SERVICE_API_URL    ✅ Set
MOCHA_USERS_SERVICE_API_KEY    ✅ Set
CLICKSEND_USERNAME             ✅ Set
CLICKSEND_API_KEY              ✅ Set
```

### Verify Secret Configuration
```bash
# Check if secrets are properly set
wrangler secret list
```

---

## 🗄️ 3. Database Setup (Cloudflare D1)

### Initialize D1 Database
```bash
# Create database
npx wrangler d1 create parentalert-db

# Update wrangler.json with database ID
# (Add the returned database_id to wrangler.json)
```

### Run Database Migrations
```bash
# Apply database schema
npx wrangler d1 execute parentalert-db --local --file=./schema.sql
npx wrangler d1 execute parentalert-db --file=./schema.sql
```

### Database Schema (Auto-created via app)
- **students** - Student information & academic data
- **parents** - Parent contact information
- **alerts** - Generated alerts for students  
- **call_logs** - Voice call history & status

---

## 🛠️ 4. Development Environment

### Start Development Server
```bash
# Start frontend + backend locally
npm run dev
# OR
bun run dev

# Runs on:
# Frontend: http://localhost:5173
# Backend: http://localhost:8787
```

### Development Tools
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

---

## ☁️ 5. Cloudflare Workers Deployment

### Install Wrangler CLI
```bash
npm install -g wrangler
# OR
bun install -g wrangler
```

### Authentication
```bash
# Login to Cloudflare
wrangler login

# Verify authentication
wrangler whoami
```

### Deploy to Production
```bash
# Deploy worker and database
wrangler publish

# Deploy with custom name
wrangler publish --name parentalert-production
```

### Environment Configuration (wrangler.json)
```json
{
  "name": "parentalert-ai",
  "main": "dist/worker.js",
  "compatibility_date": "2023-10-30",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "parentalert-db",
      "database_id": "your-database-id"
    }
  ]
}
```

---

## 📞 6. ClickSend Voice API Integration

### Account Setup
1. **Create ClickSend Account** → https://clicksend.com
2. **Get API Credentials** → Account Settings → API Keys
3. **Configure Secrets** (Already done):
   ```
   CLICKSEND_USERNAME = your_username
   CLICKSEND_API_KEY = your_api_key
   ```

### Test Integration
```bash
# Test API connection (via app)
curl https://parentalnotification.mocha.app/api/test-clicksend
```

### Voice Call Features
- **Automated Voice Messages** - Text-to-speech alerts
- **Call Status Tracking** - Real-time status updates
- **Webhook Integration** - Automatic status updates
- **Multiple Language Support** - Regional voice options

---

## 🔒 7. Authentication Setup (Google OAuth)

### Already Configured via Mocha Users Service
- **OAuth Provider**: Google
- **Session Management**: Mocha Users Service
- **Token Handling**: Automatic via SDK
- **Route Protection**: Built-in middleware

### Authentication Flow
1. User clicks "Login with Google"
2. Redirects to Google OAuth
3. Callback processed by Mocha Users Service  
4. Session token stored in secure cookie
5. Protected routes accessible

---

## 🧪 8. Testing & Verification

### Frontend Testing
```bash
# Start development server
npm run dev

# Verify pages load:
# - Login page: http://localhost:5173/login
# - Dashboard: http://localhost:5173/dashboard (after login)
# - Students: http://localhost:5173/students
# - Alerts: http://localhost:5173/alerts
```

### Backend Testing
```bash
# Test API endpoints
curl http://localhost:8787/api/dashboard/stats
curl http://localhost:8787/api/students
curl http://localhost:8787/api/test-clicksend
```

### Database Testing
```bash
# Check database connection
npx wrangler d1 execute parentalert-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

---

## 🌐 9. Production Deployment

### Deployed Application
**Live URL**: https://parentalnotification.mocha.app

### Deployment Verification
- ✅ Frontend loads correctly
- ✅ Authentication working
- ✅ Database connected
- ✅ API endpoints responding
- ✅ ClickSend integration active

### Post-Deployment Checklist
1. **Test Login Flow** - Google OAuth working
2. **Create Test Student** - Database write operations
3. **Add Parent Contact** - Relationship data
4. **Create Alert** - Alert generation
5. **Test Voice Call** - ClickSend integration
6. **Check Call Logs** - Status tracking

---

## 🔧 10. Troubleshooting

### Common Issues

**Database Connection Error:**
```bash
# Reset database binding
npx wrangler d1 execute parentalert-db --command="SELECT 1;"
```

**Authentication Issues:**
```bash
# Clear browser cookies
# Check Mocha Users Service status
# Verify environment variables
```

**ClickSend API Errors:**
```bash
# Test credentials
curl https://parentalnotification.mocha.app/api/test-clicksend

# Check account balance
# Verify phone number format (+91xxxxxxxxxx)
```

**Build Errors:**
```bash
# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Type check
npm run type-check
```

---

## 📱 11. Usage Instructions

### Admin Workflow
1. **Login** → Google OAuth authentication
2. **Add Students** → Student information & academic data
3. **Add Parents** → Contact information for each student
4. **Create Alerts** → Academic/behavioral/medical alerts
5. **Call Parents** → Automated voice notifications
6. **Monitor Calls** → Track call status & logs

### Key Features
- **Student Management** - Comprehensive student profiles
- **Parent Contacts** - Multiple contacts per student
- **Alert Templates** - Pre-defined alert types
- **Voice Calling** - Automated parent notifications
- **Analytics** - Call success rates & statistics

---

## 🎯 12. Next Steps

### Development
- Add more alert templates
- Implement SMS notifications
- Add bulk import features
- Create parent web portal

### Production
- Monitor call success rates
- Optimize voice messages
- Add regional language support
- Scale database capacity

---

**✅ Setup Complete!** Your ParentAlert AI system is ready for educational institution deployment.

**Support**: For issues, check the troubleshooting section or contact system administrator.
