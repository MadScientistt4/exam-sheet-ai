export type PlaceholderSection = {
  title: string;
  description: string;
};

export const PLACEHOLDER_SECTIONS: Record<string, PlaceholderSection> = {
  home: {
    title: "Home",
    description: "A dashboard overview of your classes, exams, and recent activity is on its way.",
  },
  "my-classroom": {
    title: "My Classroom",
    description: "Manage your classes and rosters from here — this section is still being built.",
  },
  assignments: {
    title: "Assignments",
    description: "Track and grade regular assignments alongside exams — coming soon.",
  },
  "my-library": {
    title: "My Library",
    description: "A saved library of past exams, question banks, and results is on the way.",
  },
  settings: {
    title: "Settings",
    description: "Account and school preferences will live here. Nothing to configure yet.",
  },
  toolkit: {
    title: "AI Teacher's Toolkit",
    description: "More AI-powered tools for teachers, beyond exam grading, are on the way.",
  },
  help: {
    title: "Help & Support",
    description: "A help center and support contact options are on the way.",
  },
};
