"use client";
import { useState, useEffect } from "react";

export default function PlanningPokerDemo() {
  // Demo states: 0 = ticket shown, 1 = participants join, 2 = voting, 3 = reveal, 4 = consensus
  const [step, setStep] = useState(0);
  // For card flip animation
  const [flipped, setFlipped] = useState([false, false, false, false, false]);
  // For card reveal
  const [revealed, setRevealed] = useState(false);
  // Demo participants and votes
  const participants = [
    { name: "Amy", color: "bg-slate-500 border-slate-500", vote: "3" },
    { name: "Sam", color: "bg-emerald-500 border-emerald-500", vote: "5" },
    { name: "Jamie", color: "bg-amber-500 border-amber-500", vote: "5" },
    { name: "Taylor", color: "bg-violet-500 border-violet-500", vote: "5" },
    { name: "Morgan", color: "bg-pink-500 border-pink-500", vote: "8" },
  ];

  // Step through the demo
  useEffect(() => {
    // Voting order (scattered timing)
    const votingOrder = [0, 3, 1, 4, 2]; // Amy, Taylor, Sam, Morgan, Jamie
    const timers: NodeJS.Timeout[] = [];
    if (step === 0) {
      // Show ticket for 2s, then go to participants joining
      timers.push(setTimeout(() => setStep(1), 2000));
    } else if (step === 1) {
      // After 1s, go to voting
      timers.push(setTimeout(() => setStep(2), 1000));
    } else if (step === 2) {
      // Flip cards in scattered order
      votingOrder.forEach((participantIndex, orderIndex) => {
        timers.push(
          setTimeout(() => {
            setFlipped((f) => {
              const arr = [...f];
              arr[participantIndex] = true;
              return arr;
            });
          }, 300 + orderIndex * 600)
        );
      });
      // After all cards flipped, go to reveal
      timers.push(setTimeout(() => setStep(3), 3500));
    } else if (step === 3) {
      // Reveal cards
      timers.push(
        setTimeout(() => {
          setRevealed(true);
          setStep(4);
        }, 1200)
      );
    } else if (step === 4) {
      // After consensus, reset demo
      timers.push(
        setTimeout(() => {
          setFlipped([false, false, false, false, false]);
          setRevealed(false);
          setStep(0);
        }, 2500)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [step]);

  return (
    <div className="relative max-w-lg mx-auto mb-8">
      {/* Ticket Display */}
      {/* <div
        className={`mb-4 p-3 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-opacity duration-500 ${step === 0 ? "opacity-100" : "opacity-40"}`}
      >
        <div className="text-center">
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium mb-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            User Story
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm">
            "As a user, I want to filter search results for faster content discovery"
          </p>
        </div>
      </div> */}

      {/* Participants */}
      <div className="flex justify-center gap-2 mb-4">
        {participants.map((p) => (
          <div
            key={p.name}
            className={`flex flex-col items-center transition-opacity duration-500 ${step >= 1 ? "opacity-100" : "opacity-0"}`}
          >
            <div
              className={`w-8 h-8 rounded-full ${p.color} flex items-center justify-center text-white font-bold text-sm shadow-md mb-1`}
            >
              {p.name[0]}
            </div>
            <span className="text-xs text-slate-700 dark:text-[#cccccc] font-medium">{p.name}</span>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-5 gap-3">
        {participants.map((p, i) => (
          <div key={i} className="relative aspect-[3/4]">
            {/* Card back (before flip) */}
            <div
              className={`absolute inset-0 flex items-center justify-center rounded-xl shadow-md border-2 border-slate-300 dark:border-[#404040] bg-gradient-to-br from-slate-200 to-slate-300 dark:from-[#303030] dark:to-[#404040] transition-transform duration-500 ${flipped[i] ? "rotate-y-180" : ""}`}
              style={{ backfaceVisibility: "hidden", zIndex: 1 }}
            >
              <span className="text-2xl font-bold text-slate-500 dark:text-[#888888]">?</span>
            </div>
            {/* Card front (after flip) */}
            <div
              className={`absolute inset-0 flex items-center justify-center rounded-xl shadow-md border-2 ${p.color} bg-gradient-to-br ${
                i === 0
                  ? "from-slate-500 to-slate-600"
                  : i === 1
                  ? "from-emerald-500 to-emerald-600"
                  : i === 2
                  ? "from-amber-500 to-amber-600"
                  : i === 3
                  ? "from-violet-500 to-violet-600"
                  : "from-pink-500 to-pink-600"
              } text-white font-bold text-2xl transition-all duration-500 ${
                flipped[i] ? "rotate-y-0" : "rotate-y-180"
              } ${revealed ? "scale-110 ring-4 ring-emerald-400 dark:ring-emerald-500" : ""}`}
              style={{
                backfaceVisibility: "hidden",
                zIndex: 2,
                transform: flipped[i] ? "rotateY(0deg)" : "rotateY(180deg)",
              }}
            >
              {revealed ? p.vote : ""}
            </div>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="mt-6 text-center min-h-8">
        {step === 0 && (
          <span className="text-slate-500 dark:text-[#aaaaaa] text-sm animate-pulse">
            Reading user story...
          </span>
        )}
        {step === 1 && (
          <span className="text-slate-500 dark:text-[#aaaaaa] text-sm animate-pulse">
            Team members joining...
          </span>
        )}
        {step === 2 && (
          <span className="text-slate-500 dark:text-[#aaaaaa] text-sm animate-pulse">
            Voting in progress...
          </span>
        )}
        {step === 3 && (
          <span className="text-slate-500 dark:text-[#aaaaaa] text-sm animate-pulse">
            Revealing cards...
          </span>
        )}
        {step === 4 && (
          <span className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-base">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Consensus: 5 story points
          </span>
        )}
      </div>
    </div>
  );
}
