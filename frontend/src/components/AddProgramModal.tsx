import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { addNewProgram } from '../api';
import type { Program } from '../types';

interface AddProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: number;
  onSuccess?: () => void;
}

export default function AddProgramModal({ isOpen, onClose, departmentId, onSuccess }: AddProgramModalProps) {
  const [programName, setProgramName] = useState('');
  const [programType, setProgramType] = useState('Major');
  const [collegeName, setCollegeName] = useState('College of Information');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await addNewProgram(departmentId, {
        type: programType.toLowerCase(),
        title: programName
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to add program:", error);
      alert("Failed to add program. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="+ New program">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* Program Name */}
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-semibold text-[#23417d]">Program Title</label>
          <input 
            type="text" 
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            placeholder="e.g. B.S. Computer Science"
            required
            className="border border-[#ccc] rounded-[4px] px-3 py-2 text-[14px] focus:outline-none focus:border-[#2854c5]"
          />
        </div>

        {/* Type & College */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-[14px] font-semibold text-[#23417d]">Type</label>
            <select 
              value={programType}
              onChange={(e) => setProgramType(e.target.value)}
              className="border border-[#ccc] rounded-[4px] px-3 py-2 text-[14px] bg-white focus:outline-none focus:border-[#2854c5]"
            >
              <option value="major">Major</option>
              <option value="minor">Minor</option>
              <option value="program">Program</option>
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end mt-4">
          <Button 
            content={isLoading ? "Creating..." : "Create"}
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
