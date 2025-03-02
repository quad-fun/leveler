// app/features/UploadModal.jsx
'use client';

import React from 'react';
import Modal from '../components/Modal';
import BidUpload from './BidUpload';

/**
 * Modal component for uploading bid documents
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {string} props.projectId - Project ID for the uploads
 * @param {boolean} props.analyzeFiles - Whether to analyze files after upload
 * @param {Function} props.onUploadComplete - Callback when uploads are complete
 */
const UploadModal = ({ isOpen, onClose, projectId, analyzeFiles = false, onUploadComplete }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Upload${analyzeFiles ? ' & Analyze' : ''} Bid Documents`}
      size="large"
    >
      <BidUpload 
        projectId={projectId}
        analyzeFiles={analyzeFiles}
        onUploadComplete={(results) => {
          if (onUploadComplete) {
            onUploadComplete(results);
          }
          onClose();
        }}
      />
    </Modal>
  );
};

export default UploadModal;