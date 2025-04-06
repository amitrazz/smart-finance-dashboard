import { Dispatch, SetStateAction } from "react";
import { Moon, Sun } from "lucide-react";

type HeaderProps = {
  darkMode: boolean;
  setDarkMode: Dispatch<SetStateAction<boolean>>;
};

export default function Header({ darkMode, setDarkMode }: HeaderProps) {
  return (
    <header className="px-6 py-4 flex justify-between items-center border-b bg-white dark:bg-gray-800">
      <h1 className="text-2xl font-bold">Smart Finance Dashboard</h1>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:scale-105 transition-transform"
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </header>
  );
}
