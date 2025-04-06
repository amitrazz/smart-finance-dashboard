export default function TransactionList() {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
      <ul className="space-y-2">
        <li className="flex justify-between p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
          <span>Grocery Shopping</span>
          <span>-₹2,000</span>
        </li>
        <li className="flex justify-between p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
          <span>Freelance Payment</span>
          <span>+₹15,000</span>
        </li>
        <li className="flex justify-between p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
          <span>Electricity Bill</span>
          <span>-₹1,800</span>
        </li>
      </ul>
    </section>
  );
}
