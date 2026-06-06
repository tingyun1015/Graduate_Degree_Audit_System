import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { addNewCourse } from '../api';
import type { Course } from '../types';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminId: number;
  onSuccess?: () => void;
}

export default function AddCourseModal({ isOpen, onClose, adminId, onSuccess }: AddCourseModalProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [credit, setCredit] = useState(3);
  const [term, setTerm] = useState('Fall, 2025');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newCourse: Course = {
        id: Date.now(), // Mock ID
        code,
        name,
        credit,
        term
      };
      await addNewCourse(adminId, newCourse);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to add course:", error);
      alert("Failed to add course. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New course">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* Course Code & Name */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-2 w-1/3">
            <label className="text-[14px] font-semibold text-[#23417d]">Code</label>
            <input 
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. CS101"
              required
              className="border border-[#ccc] rounded-[4px] px-3 py-2 text-[14px] focus:outline-none focus:border-[#2854c5]"
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-[14px] font-semibold text-[#23417d]">Course Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter course name"
              required
              className="border border-[#ccc] rounded-[4px] px-3 py-2 text-[14px] focus:outline-none focus:border-[#2854c5]"
            />
          </div>
        </div>

        {/* Term & Credits */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-[14px] font-semibold text-[#23417d]">Term</label>
            <select 
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="border border-[#ccc] rounded-[4px] px-3 py-2 text-[14px] bg-white focus:outline-none focus:border-[#2854c5]"
            >
              <option value="Fall, 2025">Fall, 2025</option>
              <option value="Spring, 2026">Spring, 2026</option>
              <option value="Fall, 2026">Fall, 2026</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-[14px] font-semibold text-[#23417d]">Credits</label>
            <select 
              value={credit}
              onChange={(e) => setCredit(Number(e.target.value))}
              className="border border-[#ccc] rounded-[4px] px-3 py-2 text-[14px] bg-white focus:outline-none focus:border-[#2854c5]"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-semibold text-[#23417d]">Description</label>
          <textarea 
            rows={4}
            placeholder="Enter course description..."
            className="border border-[#ccc] rounded-[4px] px-3 py-2 text-[14px] focus:outline-none focus:border-[#2854c5] resize-none"
          ></textarea>
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
