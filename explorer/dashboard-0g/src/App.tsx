import React from "react";

function App() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="h-16 flex items-center justify-center border-b">
          <span className="font-bold text-xl text-blue-600">0G Explorer</span>
        </div>
        <nav className="flex-1 py-4">
          <ul>
            <li className="px-6 py-3 bg-blue-100 text-blue-700 rounded-r-full font-semibold">Dashboard</li>
            {/* Menu lain nanti di sini */}
          </ul>
        </nav>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white shadow flex items-center justify-between px-8">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Connect Wallet</button>
        </header>
        {/* Content */}
        <main className="flex-1 p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card: Latest Block */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-gray-500">Latest Block</span>
            <span className="text-3xl font-bold mt-2">#123456</span>
          </div>
          {/* Card: Transactions */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-gray-500">Transactions (24h)</span>
            <span className="text-3xl font-bold mt-2">8,900</span>
          </div>
          {/* Card: Active Validators */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-gray-500">Active Validators</span>
            <span className="text-3xl font-bold mt-2">42</span>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
