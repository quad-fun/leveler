'use client';

import BidUpload from './features/BidUpload';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Bid Leveling Assistant</h1>
        <p className="text-gray-600 text-center mb-8">
          Upload your construction bid documents and get AI-powered analysis with automatic token optimization.
        </p>
        <BidUpload />
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>This application includes automatic token optimization to reduce API costs.</p>
        </footer>
      </div>
    </main>
  );
}