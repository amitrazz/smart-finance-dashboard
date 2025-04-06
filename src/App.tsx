import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import DashboardCards from "./features/dashboard/DashboardCards";
import TransactionList from "./features/transactions/TransactionList";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />
          <main className="p-6 overflow-auto">
            <DashboardCards />
            <TransactionList />
          </main>
        </div>
      </div>
    </div>
  );
}
