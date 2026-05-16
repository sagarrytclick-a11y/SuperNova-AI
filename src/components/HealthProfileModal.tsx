'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface HealthProfile {
  age: number | null;
  weight: number | null;
  height: number | null;
  goal: string;
  diet: string;
  activityLevel: string;
}

interface HealthProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: HealthProfile;
  onSave: (data: HealthProfile) => Promise<void>;
}

export default function HealthProfileModal({ isOpen, onClose, initialData, onSave }: HealthProfileModalProps) {
  const [formData, setFormData] = useState<HealthProfile>({
    age: null,
    weight: null,
    height: null,
    goal: '',
    diet: '',
    activityLevel: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (name === 'age' || name === 'weight' || name === 'height') 
        ? (value ? Number(value) : null) 
        : value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#1e1f20] border border-[#444746] rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#444746]">
          <h3 className="text-lg font-semibold text-[#e3e3e3]">Your Health Profile</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-[#c4c7c5]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#c4c7c5]">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age || ''}
                onChange={handleChange}
                placeholder="25"
                className="w-full bg-[#131314] border border-[#444746] rounded-xl px-3 py-2 text-sm text-[#e3e3e3] outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#c4c7c5]">Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight || ''}
                onChange={handleChange}
                placeholder="70"
                className="w-full bg-[#131314] border border-[#444746] rounded-xl px-3 py-2 text-sm text-[#e3e3e3] outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#c4c7c5]">Height (cm)</label>
            <input
              type="number"
              name="height"
              value={formData.height || ''}
              onChange={handleChange}
              placeholder="175"
              className="w-full bg-[#131314] border border-[#444746] rounded-xl px-3 py-2 text-sm text-[#e3e3e3] outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#c4c7c5]">Primary Goal</label>
            <select
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              className="w-full bg-[#131314] border border-[#444746] rounded-xl px-3 py-2 text-sm text-[#e3e3e3] outline-none focus:border-blue-500"
            >
              <option value="">Select a goal</option>
              <option value="Weight Loss">Weight Loss</option>
              <option value="Muscle Gain">Muscle Gain</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Improved Stamina">Improved Stamina</option>
              <option value="Better Sleep">Better Sleep</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#c4c7c5]">Dietary Preference</label>
            <select
              name="diet"
              value={formData.diet}
              onChange={handleChange}
              className="w-full bg-[#131314] border border-[#444746] rounded-xl px-3 py-2 text-sm text-[#e3e3e3] outline-none focus:border-blue-500"
            >
              <option value="">No specific diet</option>
              <option value="Vegan">Vegan</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Keto">Keto</option>
              <option value="Paleo">Paleo</option>
              <option value="Low Carb">Low Carb</option>
              <option value="Gluten-Free">Gluten-Free</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#c4c7c5]">Activity Level</label>
            <select
              name="activityLevel"
              value={formData.activityLevel}
              onChange={handleChange}
              className="w-full bg-[#131314] border border-[#444746] rounded-xl px-3 py-2 text-sm text-[#e3e3e3] outline-none focus:border-blue-500"
            >
              <option value="">Select activity level</option>
              <option value="Sedentary">Sedentary (little or no exercise)</option>
              <option value="Lightly Active">Lightly Active (1-3 days/week)</option>
              <option value="Moderately Active">Moderately Active (3-5 days/week)</option>
              <option value="Very Active">Very Active (6-7 days/week)</option>
              <option value="Super Active">Super Active (very hard exercise/job)</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#444746] text-[#e3e3e3] hover:bg-white/5 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium text-sm disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
