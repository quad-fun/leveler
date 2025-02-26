// app/features/UploadModal.jsx
'use client';

import React from 'react';
import Modal from '../components/Modal';
import BidUpload from './BidUpload';

const UploadModal = ({ isOpen, onClose, projectId, onUploadComplete }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Bid Documents"
      size="large"
    >
      <BidUpload 
        projectId={projectId}
        onUploadComplete={(results) => {
          if (onUploadComplete) {
            onUploadComplete(results);
          }
        }}
      />
    </Modal>
  );
};

export default UploadModal;