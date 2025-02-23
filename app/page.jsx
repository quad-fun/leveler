'use client';

import BidUpload from './features/BidUpload';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Bid Leveling Assistant</h1>
        <BidUpload />
      </div>
    </main>
  );
}