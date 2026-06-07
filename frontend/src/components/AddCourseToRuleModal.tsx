import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { addCourseIntoProgramRule, getAdminCourseList } from '../api';
import { useAuthStore } from '../store/useAuthStore';
import { useAdminStore } from '../store/useAdminStore';
import type { Course } from '../types';

interface AddCourseToRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleId: number | null;
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

export default function AddCourseToRuleModal({ isOpen, onClose, ruleId, onSuccess, onError }: AddCourseToRuleModalProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { userId } = useAuthStore();
  const { activeDepartment } = useAdminStore();

  useEffect(() => {
    if (isOpen && activeDepartment?.id) {
      getAdminCourseList(1).then((res) => {
        setCourses(res || []);
        setSelectedCourseId('');
      });
    }
  }, [isOpen, activeDepartment?.id, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleId || !selectedCourseId) return;
    setIsLoading(true);
    try {
      await addCourseIntoProgramRule(Number(userId), Number(ruleId), Number(selectedCourseId));
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to add course:", error);
      if (onError) {
        onError("Failed to add course. Please try again.");
      } else {
        alert("Failed to add course. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Course to Requirement">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-semibold text-[#23417d]">Select Course</label>
          <select 
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(Number(e.target.value))}
            className="border border-[#ccc] rounded-[4px] px-3 py-2 text-[14px] bg-white focus:outline-none focus:border-[#2854c5]"
            required
          >
            <option value="" disabled>-- Select a course --</option>
            {courses.map(course => (
              <option key={course.course_id} value={course.course_id}>
                {course.course_code} - {course.course_name} ({course.credits} cr)
              </option>
            ))}
          </select>
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
            content={isLoading ? "Adding..." : "Add"}
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
