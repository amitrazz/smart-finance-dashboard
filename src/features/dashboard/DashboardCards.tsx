export default function DashboardCards() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="rounded-2xl p-4 bg-white dark:bg-gray-800 shadow-md">
        <h2 className="text-lg font-semibold mb-2">Total Balance</h2>
        <p className="text-2xl font-bold">₹1,20,000</p>
      </div>

      <div className="rounded-2xl p-4 bg-white dark:bg-gray-800 shadow-md">
        <h2 className="text-lg font-semibold mb-2">Monthly Income</h2>
        <p className="text-2xl font-bold">₹80,000</p>
      </div>

      <div className="rounded-2xl p-4 bg-white dark:bg-gray-800 shadow-md">
        <h2 className="text-lg font-semibold mb-2">Monthly Expenses</h2>
        <p className="text-2xl font-bold">₹45,000</p>
      </div>
    </section>
  );
}
