// app/features/AnalyzeModal.jsx
'use client';

import React from 'react';
import { X } from 'lucide-react';
import AnalyzeBids from './AnalyzeBids';

export default function AnalyzeModal({ isOpen, onClose, projectId, bids, selectedBids, onComplete }) {
  if (!isOpen) return null;

  // Handle click outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Analyze Bids</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <AnalyzeBids 
          projectId={projectId}
          bids={bids}
          selectedBids={selectedBids}
          onComplete={(results) => {
            if (onComplete) {
              onComplete(results);
            }
          }}
        />
      </div>
    </div>
  );
}