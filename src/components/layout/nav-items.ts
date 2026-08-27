import { ClipboardList, FileText, LayoutGrid, MonitorPlay, PieChart } from "lucide-react";

export const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: LayoutGrid },
  { label: "My Classroom", href: "/my-classroom", icon: MonitorPlay },
  { label: "Assignments", href: "/assignments", icon: FileText },
  { label: "Exams", href: "/exams/upload", icon: ClipboardList },
  { label: "My Library", href: "/my-library", icon: PieChart },
];
