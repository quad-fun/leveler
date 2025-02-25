'use client';

import React from 'react';

const TokenReductionIndicator = ({ processing }) => {
  return (
    <div className="mt-2 text-sm text-gray-600 flex items-center">
      <div className="flex-shrink-0 mr-2">
        <div className={`h-2 w-2 rounded-full ${processing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
      </div>
      <div>
        Token optimization active {processing ? '(processing...)' : '(ready)'} - 
        <span className="text-green-600 font-medium"> ~50-70% token reduction</span>
      </div>
    </div>
  );
};

export default TokenReductionIndicator;