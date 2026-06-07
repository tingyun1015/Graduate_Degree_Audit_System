import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { editAdminProgramRule } from '../api';
import { useAuthStore } from '../store/useAuthStore';

interface EditProgramRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleId: number | null;
  currentCredits: number;
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

export default function EditProgramRuleModal({ isOpen, onClose, ruleId, currentCredits, onSuccess, onError }: EditProgramRuleModalProps) {
  const [credits, setCredits] = useState(currentCredits);
  const [isLoading, setIsLoading] = useState(false);
  const { userId } = useAuthStore();

  useEffect(() => {
    setCredits(currentCredits);
  }, [currentCredits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleId || !userId) return;
    setIsLoading(true);
    try {
      await editAdminProgramRule(Number(userId), Number(ruleId), Number(credits));
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to edit rule:", error);
      if (onError) {
        onError("Failed to edit required credits. Please try again.");
      } else {
        alert("Failed to edit required credits. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Required Credits">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-semibold text-[#23417d]">Required Credits</label>
          <input 
            type="number" 
            min="0"
            value={credits}
            onChange={(e) => setCredits(Number(e.target.value))}
            required
            className="border border-[#ccc] rounded-[4px] px-3 py-2 text-[14px] focus:outline-none focus:border-[#2854c5]"
          />
        </div>
        <div className="flex justify-end mt-4 gap-3">
          <Button 
            content="Cancel"
            color="#6b7280"
            variant="outline"
            isFullWidth={false}
            onClick={onClose}
            type="button"
          />
          <Button 
            content={isLoading ? "Saving..." : "Save"}
            color="#2854c5"
            hasArrow={false}
            isFullWidth={false}
            onClick={() => {}}
            type="submit"
          />
        </div>
      </form>
    </Modal>
  );
}
