# 🚨 AI-Powered Accident Detection & Automated Rescue Dispatch

A comprehensive Smart India Hackathon project that provides real-time accident detection and automated emergency response system.

## 🌟 Features

- **Real-time Accident Detection**: AI-powered system to detect and report accidents
- **Automated Emergency Response**: Instant notification to emergency services and hospitals
- **Multi-Dashboard System**: Separate interfaces for drivers and hospitals
- **Real-time Communication**: WebSocket-based live updates
- **Location Tracking**: GPS-based precise location reporting
- **Escalation System**: Automatic escalation for unacknowledged emergencies

## 🏗️ Architecture

This is a monorepo containing multiple components:

- **backend-api**: Node.js + Express + MongoDB + Socket.IO server
- **hospital-dashboard**: React dashboard for emergency responders
- **driver-dashboard**: React interface for drivers to report accidents
- **mobile-app**: React Native app with sensor integration
- **ai-model**: TensorFlow Lite model for accident detection

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd smartindia
```

### 2. Install Dependencies

```bash
# Backend API
cd backend-api
npm install

# Hospital Dashboard
cd ../hospital-dashboard
npm install

# Driver Dashboard
cd ../driver-dashboard
npm install
```

### 3. Start the Services

**Backend API (Port 4001):**
```bash
cd backend-api
npm run build
npm start
```

**Hospital Dashboard (Port 5177):**
```bash
cd hospital-dashboard
npm run dev
```

**Driver Dashboard (Port 5180):**
```bash
cd driver-dashboard
npm run dev
```

## 🌐 Access the Application

- **Backend API**: http://localhost:4001
- **Hospital Dashboard**: http://localhost:5177
- **Driver Dashboard**: http://localhost:5180

## 📱 How It Works

### For Drivers:
1. Open the Driver Dashboard
2. Use the "Report Accident" feature
3. Set accident severity and location
4. Submit report - emergency services are automatically notified
5. Track your report status in "My Events"

### For Emergency Responders:
1. Open the Hospital Dashboard
2. View real-time accident reports on the map
3. Accept, assign, and dispatch emergency services
4. Monitor all active incidents

## 🔧 API Endpoints

- `POST /api/report-accident` - Report a new accident
- `GET /api/events` - Get all accident events
- `GET /api/events/user/:userId` - Get user-specific events
- `POST /api/events/:id/ack` - Acknowledge an event
- `POST /api/events/:id/assign` - Assign medical team
- `POST /api/events/:id/dispatch` - Dispatch ambulance

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB (with in-memory fallback)
- **Real-time**: Socket.IO
- **Location**: Geolocation API, Google Maps integration
- **Notifications**: Twilio (SMS), Firebase (Push), SendGrid (Email)

## 📊 Project Structure

```
smartindia/
├── backend-api/          # Express.js API server
│   ├── src/
│   │   ├── models/       # MongoDB models
│   │   ├── services/     # Business logic
│   │   └── routes.ts     # API routes
├── hospital-dashboard/   # Emergency responder interface
│   └── src/
│       └── components/   # React components
├── driver-dashboard/     # Driver interface
│   └── src/
│       └── components/   # React components
├── mobile-app/          # React Native app
└── ai-model/            # ML models and training
```

## 🚑 Emergency Response Flow

1. **Accident Detection**: Driver reports or AI detects accident
2. **Immediate Response**: System automatically notifies emergency contacts
3. **Hospital Alert**: Real-time notification to hospital dashboard
4. **Resource Assignment**: Medical team assignment and ambulance dispatch
5. **Escalation**: Automatic escalation if no response within 2 minutes
6. **Real-time Updates**: Live status updates for all stakeholders

## 🔒 Environment Variables

Create `.env` files in respective directories:

```env
# Backend API
MONGO_URI=mongodb://localhost:27017/accidents
PORT=4001
MAPBOX_TOKEN=your_mapbox_token
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
FIREBASE_SERVER_KEY=your_firebase_key
```

## 🧪 Testing

Test the system by:

1. Opening both dashboards
2. Reporting an accident from the driver dashboard
3. Observing real-time updates in the hospital dashboard
4. Testing the action buttons (Accept, Assign, Dispatch)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🎯 Smart India Hackathon 2024

This project addresses the critical need for rapid emergency response in India's growing urban landscape, leveraging AI and real-time communication to save lives through faster accident detection and response coordination.

---

**Built with ❤️ for Smart India Hackathon 2024**


