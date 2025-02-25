// app/layout.jsx
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { Home, FolderKanban } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Bid Leveling Assistant',
  description: 'AI-powered construction bid analysis tool',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <Link href="/" className="font-bold text-xl text-blue-600">
                      Bid Leveler
                    </Link>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <Link
                      href="/"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      <Home className="w-4 h-4 mr-1" />
                      Home
                    </Link>
                    <Link
                      href="/projects"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      <FolderKanban className="w-4 h-4 mr-1" />
                      Projects
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-grow bg-gray-50">
            {children}
          </main>
          <footer className="bg-white border-t border-gray-200 py-4">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Bid Leveler. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}