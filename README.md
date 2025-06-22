# 🃏 Planning Poker – Agile Estimation Tool

An online **Planning Poker** web app for agile development teams to collaboratively estimate tickets — no login required.

Built with **Next.js**, **Tailwind CSS**, and **Firebase Firestore**.

---

## 🚀 Features

### Core Functionality
- **Real-time Collaboration**: Live voting with instant updates across all participants
- **Multiple Estimation Scales**: Choose from Fibonacci, Modified Fibonacci, T-Shirt sizes, or Powers of Two
- **Room Management**: Create and join rooms with unique codes
- **Admin Controls**: Host can manage room settings, reveal votes, and reset sessions
- **Auto-reveal Options**: Configurable automatic vote revealing when all players vote

### Voting Experience
- **Visual Vote Indicators**: Clear visual feedback when players have voted
- **Smart Average Calculation**: Automatically excludes non-numeric votes (?, ☕) from averages
- **Special Cards**: Support for "?" (unsure) and "☕" (break) cards
- **Vote Progress Indicator**: Real-time progress bar showing "X/Y voted" with visual completion status
- **Anonymous Voting**: Hide voter identities to reduce bias and peer pressure

### User Interface
- **Modern Design**: Clean, responsive interface built with Tailwind CSS
- **Dual Home Layout**: Separate areas for creating and joining rooms
- **Mobile Responsive**: Works seamlessly on all device sizes
- **Version Display**: App version shown for easy tracking

---

## 🧠 Stack

| Tech       | Purpose                   |
|------------|---------------------------|
| Next.js    | Frontend framework        |
| Tailwind   | Utility-first styling     |
| Firebase   | Real-time database (Firestore) |
| TypeScript | Type safety               |

---

## 📦 Installation

```bash
git clone https://github.com/your-username/planning-poker.git
cd planning-poker

# Install dependencies
npm install

# Setup Tailwind (if needed)
npx tailwindcss init -p
```

---

## 🔑 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore in **test mode**
4. Copy your config into `lib/firebase.ts`:

```ts
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  ...
};
```

5. (Optional) Add basic Firestore rules:
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read, write: if true;
    }
  }
}
```

---

## 🧱 Firestore Schema

```plaintext
rooms/{roomId}
 ┣ currentTicket: string
 ┣ votesRevealed: boolean
 ┣ createdAt: timestamp
 ┣ participants/{userId}
 ┃ ┣ name: string
 ┃ ┣ isHost: boolean
 ┗ votes/{userId}
    ┣ value: number | "?" | "☕"
```

---

## 🗺️ Project Structure

```bash
planning-poker/
├── pages/
│   ├── index.tsx          # Home page (create/join room)
│   └── room/[roomId].tsx  # Voting room
├── lib/
│   └── firebase.ts        # Firebase config
├── styles/
│   └── globals.css        # Tailwind base
├── tailwind.config.js
└── postcss.config.js
```

---

## ✅ Roadmap

- [x] Room creation
- [x] Share via room code/link
- [x] Realtime voting
- [x] Reveal/reset votes
- [ ] Assign ticket names
- [ ] Participant avatars
- [ ] Add timer & round history

---

## 👨‍💻 Author

Built by [Rob](https://github.com/your-username)

---

## 📄 License

MIT

---

## 🎯 Potential Future Enhancements

### 📋 Story Management
- **Multiple Stories**: Manage and estimate multiple stories per session
- **Story History**: Track previously estimated items
- **Re-voting**: Allow teams to re-estimate stories
- **Bulk Estimation**: Estimate multiple items in sequence

### 👥 Enhanced Team Features
- **User Profiles**: Avatars and display names
- **Team Templates**: Save common team configurations

### 📊 Analytics & Insights
- **Estimation Analytics**: Track team estimation patterns
- **Velocity Tracking**: Monitor team velocity over time
- **Export Capabilities**: Download session results
- **Consensus Metrics**: Measure team agreement levels

### 🎨 UI/UX Improvements
- **Sound Effects**: Optional audio feedback

### 🔧 Advanced Features
- **Jira/Azure DevOps Integration**: Import stories from project management tools
- **AI Estimation Suggestions**: ML-powered estimation recommendations
- **Session Recording**: Record and replay estimation sessions
- **Custom Voting Rules**: Flexible voting requirements

### 🏢 Enterprise Features
- **Organizations**: Multi-team workspace management
- **SSO Integration**: Enterprise authentication
- **Audit Logs**: Comprehensive action tracking
- **Advanced Reporting**: Detailed estimation analytics
- **Custom Branding**: White-label options

### 🎮 Gamification
- **Estimation Streaks**: Reward consistent participation
- **Accuracy Badges**: Recognize skilled estimators
- **Team Achievements**: Unlock estimation milestones
- **Leaderboards**: Friendly team competition

### 🔒 Security & Privacy
- **Room Passwords**: Additional access control
- **Data Retention**: Configurable data lifecycle
- **GDPR Compliance**: Data export and deletion tools
- **End-to-end Encryption**: Enhanced privacy for sensitive teams

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Firebase configuration
4. Run development server: `npm run dev`
5. Build for production: `npm run build`

## 📝 Version

Current version: v0.1.0

---

*Built with ❤️ for agile teams worldwide*
