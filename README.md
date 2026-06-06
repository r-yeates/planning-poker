# Planning Poker – Agile Estimation Tool

An online **Planning Poker** web app for agile development teams to collaboratively estimate tickets — no login required.

Built with **Next.js**, **Tailwind CSS**, and **Firebase Firestore**.

[https://agilepoker.vercel.app]

---

## Features

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

## Stack

| Tech       | Purpose                   |
|------------|---------------------------|
| Next.js    | Frontend framework        |
| Tailwind   | Utility-first styling     |
| Firebase   | Real-time database (Firestore) |
| TypeScript | Type safety               |

---

## 📄 License

MIT
---

*Built with ❤️ for agile teams worldwide*
