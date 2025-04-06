import { LayoutDashboard, ListOrdered, Settings } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 hidden md:flex flex-col gap-6 p-6 bg-white dark:bg-gray-800 shadow-md">
      <nav className="flex flex-col gap-4">
        <a
          href="#"
          className="flex items-center gap-3 text-sm font-medium hover:text-blue-600"
        >
          <LayoutDashboard className="w-5 h-5" /> Dashboard
        </a>
        <a
          href="#"
          className="flex items-center gap-3 text-sm font-medium hover:text-blue-600"
        >
          <ListOrdered className="w-5 h-5" /> Transactions
        </a>
        <a
          href="#"
          className="flex items-center gap-3 text-sm font-medium hover:text-blue-600"
        >
          <Settings className="w-5 h-5" /> Settings
        </a>
      </nav>
    </aside>
  );
}
