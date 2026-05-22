export const quotes = {
  solo_success: [
    "Nice work — you showed up for yourself today.",
    "One session at a time. You're building real discipline.",
    "Great job staying focused. Progress counts.",
    "You kept your promise to yourself today."
  ],
  group_success: [
    "Strong work — your team showed up and followed through.",
    "Accountability looks good on this group.",
    "Y'all did that. Keep the momentum going.",
    "A shared goal is easier when everybody commits."
  ],
  missed_goal: [
    "Missing one session doesn't erase your progress.",
    "It's okay. Reset and try again.",
    "Consistency is built by coming back.",
    "You're not behind — just take the next step.",
    "A missed session is a setback, not the end."
  ]
};

export const getRandomQuote = (category: keyof typeof quotes) => {
  const list = quotes[category];
  return list[Math.floor(Math.random() * list.length)];
};
