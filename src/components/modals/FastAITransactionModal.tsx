import React from 'react';
import { X } from 'lucide-react';
import { AITransactionRecorder } from '../ai/AITransactionRecorder';

interface FastAITransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FastAITransactionModal: React.FC<FastAITransactionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl relative my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <AITransactionRecorder onSuccess={onClose} isModal={true} />
      </div>
    </div>
  );
};
