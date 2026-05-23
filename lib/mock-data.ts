import { Assignment, GeneratedPaper } from "@/types";

export const seedAssignments: Assignment[] = Array.from(
  { length: 8 },
  (_, index) => ({
    _id: `seed-${index + 1}`,
    title: "Quiz on Electricity",
    userId: "user1",
    schoolId: "school1",
    dueDate: new Date("2025-06-21"),
    questionTypes: [],
    totalQuestions: 10,
    totalMarks: 20,
    status: "completed" as const,
    createdAt: new Date("2025-06-20"),
    updatedAt: new Date("2025-06-20"),
  })
);

export const generatedPaper: GeneratedPaper = {
  metadata: {
    subject: "Science",
    class: "8th",
    timeAllowed: "45 minutes",
    maxMarks: 20,
  },
  sections: [
    {
      name: "Section A",
      instruction: "Short Answer Questions",
      questions: [
        {
          number: 1,
          text: "Define electroplating. Explain its purpose.",
          difficulty: "Easy",
          marks: 2,
        },
        {
          number: 2,
          text: "What is the role of a conductor in the process of electrolysis?",
          difficulty: "Moderate",
          marks: 2,
        },
        {
          number: 3,
          text: "Why does a solution of copper sulfate conduct electricity?",
          difficulty: "Easy",
          marks: 2,
        },
        {
          number: 4,
          text: "Describe one example of the chemical effect of electric current in daily life.",
          difficulty: "Moderate",
          marks: 2,
        },
        {
          number: 5,
          text: "Explain why electric current is said to have chemical effects.",
          difficulty: "Moderate",
          marks: 2,
        },
        {
          number: 6,
          text: "How is sodium hydroxide prepared during the electrolysis of brine? Write the chemical reaction involved.",
          difficulty: "Challenging",
          marks: 2,
        },
        {
          number: 7,
          text: "What happens at the cathode and anode during the electrolysis of water? Name the gases evolved.",
          difficulty: "Challenging",
          marks: 2,
        },
        {
          number: 8,
          text: "Mention the type of current used in electroplating and justify why it is used.",
          difficulty: "Easy",
          marks: 2,
        },
        {
          number: 9,
          text: "What is the importance of electric current in the field of metallurgy?",
          difficulty: "Moderate",
          marks: 2,
        },
        {
          number: 10,
          text: "Explain with a chemical equation how copper is deposited during the electroplating of an object.",
          difficulty: "Challenging",
          marks: 2,
        },
      ],
    },
  ],
};

export const answerKey = [
  "Electroplating is the process of depositing a thin layer of metal on another metal using electric current. It prevents corrosion, improves appearance, or increases thickness.",
  "A conductor allows current to flow, causing ions in the electrolyte to move and enabling chemical changes at the electrodes.",
  "Copper sulfate solution contains free copper and sulfate ions that carry electric charge.",
  "Silver electroplating on jewellery is one daily-life example.",
  "Electric current moves ions and causes chemical changes at electrodes.",
  "Sodium hydroxide forms at the cathode during brine electrolysis: 2H2O + 2e- -> H2 + 2OH-; Na+ + OH- -> NaOH.",
  "At the cathode, water is reduced to hydrogen gas. At the anode, water is oxidized to oxygen gas.",
  "Direct current is used because it gives a consistent electron flow for controlled metal deposition.",
  "Electric current helps extract metals from ores and purify metals by electrolysis.",
  "Copper ions gain electrons at the cathode: Cu2+ + 2e- -> Cu(s).",
];
