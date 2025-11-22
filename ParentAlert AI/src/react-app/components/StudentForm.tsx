import { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";
import type { StudentType, CreateStudentType } from "@/shared/types";

interface StudentFormProps {
  student?: StudentType | null;
  onClose: () => void;
  onSave: () => void;
}

export default function StudentForm({ student, onClose, onSave }: StudentFormProps) {
  const [formData, setFormData] = useState<CreateStudentType>({
    name: "",
    roll_number: "",
    major: "",
    year_of_study: 1,
    gpa: undefined,
    contact_number: "",
    email: "",
    attendance_percentage: undefined,
    disciplinary_notes: "",
    medical_alerts: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        roll_number: student.roll_number,
        major: student.major,
        year_of_study: student.year_of_study,
        gpa: student.gpa || undefined,
        contact_number: student.contact_number || "",
        email: student.email || "",
        attendance_percentage: student.attendance_percentage || undefined,
        disciplinary_notes: student.disciplinary_notes || "",
        medical_alerts: student.medical_alerts || "",
      });
    }
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const url = student ? `/api/students/${student.id}` : "/api/students";
      const method = student ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSave();
      } else {
        const errorData = await response.json();
        if (errorData.error) {
          setErrors({ general: errorData.error });
        }
      }
    } catch (error) {
      setErrors({ general: "Failed to save student" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateStudentType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {student ? "Edit Student" : "Add New Student"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Roll Number *
              </label>
              <input
                type="text"
                value={formData.roll_number}
                onChange={(e) => handleChange("roll_number", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Major/Department *
              </label>
              <input
                type="text"
                value={formData.major}
                onChange={(e) => handleChange("major", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Computer Science Engineering"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year of Study *
              </label>
              <select
                value={formData.year_of_study}
                onChange={(e) => handleChange("year_of_study", parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
                <option value={5}>5th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GPA
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={formData.gpa || ""}
                onChange={(e) => handleChange("gpa", e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00 - 10.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attendance Percentage
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.attendance_percentage || ""}
                onChange={(e) => handleChange("attendance_percentage", e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0 - 100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Contact Number
              </label>
              <input
                type="tel"
                value={formData.contact_number || ""}
                onChange={(e) => handleChange("contact_number", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="+91 9876543210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Email
              </label>
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="student@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medical Alerts
            </label>
            <textarea
              value={formData.medical_alerts || ""}
              onChange={(e) => handleChange("medical_alerts", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Any medical conditions, allergies, or health concerns..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Disciplinary Notes
            </label>
            <textarea
              value={formData.disciplinary_notes || ""}
              onChange={(e) => handleChange("disciplinary_notes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Any behavioral issues or disciplinary actions..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Next Step: Add Parent Contacts</h3>
            <p className="text-sm text-blue-800">
              After saving this student, you'll be able to add parent/guardian contact information 
              which is required for sending alerts and making calls.
            </p>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{student ? "Update Student" : "Add Student"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
