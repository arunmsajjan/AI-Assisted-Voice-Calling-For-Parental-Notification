import { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";
import type { StudentType, CreateAlertType } from "@/shared/types";

interface AlertFormProps {
  students: StudentType[];
  preselectedStudentId?: number;
  onClose: () => void;
  onSave: () => void;
}

export default function AlertForm({ students, preselectedStudentId, onClose, onSave }: AlertFormProps) {
  const [formData, setFormData] = useState<CreateAlertType>({
    student_id: preselectedStudentId || 0,
    title: "",
    description: "",
    severity: "medium",
    alert_type: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (preselectedStudentId) {
      setFormData(prev => ({ ...prev, student_id: preselectedStudentId }));
    }
  }, [preselectedStudentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
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
      setErrors({ general: "Failed to create alert" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateAlertType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const alertTemplates = [
    {
      type: "Low GPA",
      title: "Academic Performance Alert",
      description: "Student's GPA has fallen below the required threshold and requires immediate attention."
    },
    {
      type: "Multiple Absences",
      title: "Attendance Concern",
      description: "Student has been frequently absent from classes, affecting academic progress."
    },
    {
      type: "Medical Emergency",
      title: "Medical Emergency Alert",
      description: "Student requires immediate medical attention or has been involved in a health incident."
    },
    {
      type: "Disciplinary Issue",
      title: "Behavioral Concern",
      description: "Student has been involved in disciplinary issues that require parent notification."
    },
    {
      type: "Fee Payment",
      title: "Fee Payment Reminder",
      description: "Outstanding fees need to be cleared for continued enrollment."
    }
  ];

  const handleTemplateSelect = (template: typeof alertTemplates[0]) => {
    setFormData(prev => ({
      ...prev,
      alert_type: template.type,
      title: template.title,
      description: template.description
    }));
  };

  const selectedStudent = students.find(s => s.id === formData.student_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Alert</h2>
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

          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Student *
            </label>
            <select
              value={formData.student_id}
              onChange={(e) => handleChange("student_id", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value={0}>Choose a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.roll_number} ({student.major})
                </option>
              ))}
            </select>
          </div>

          {/* Student Info Display */}
          {selectedStudent && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Student Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <span className="font-medium">Name:</span> {selectedStudent.name}
                </div>
                <div>
                  <span className="font-medium">Roll:</span> {selectedStudent.roll_number}
                </div>
                <div>
                  <span className="font-medium">Major:</span> {selectedStudent.major}
                </div>
                <div>
                  <span className="font-medium">Year:</span> {selectedStudent.year_of_study}
                </div>
                <div>
                  <span className="font-medium">GPA:</span> {selectedStudent.gpa ? selectedStudent.gpa.toFixed(2) : "N/A"}
                </div>
                <div>
                  <span className="font-medium">Attendance:</span> {selectedStudent.attendance_percentage ? `${selectedStudent.attendance_percentage}%` : "N/A"}
                </div>
              </div>
            </div>
          )}

          {/* Alert Templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Templates
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {alertTemplates.map((template) => (
                <button
                  key={template.type}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-sm text-gray-900">{template.type}</div>
                  <div className="text-xs text-gray-600">{template.title}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Alert Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert Type *
              </label>
              <input
                type="text"
                value={formData.alert_type}
                onChange={(e) => handleChange("alert_type", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Low GPA, Attendance Issue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity Level *
              </label>
              <select
                value={formData.severity}
                onChange={(e) => handleChange("severity", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Brief title for the alert"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Detailed description of the alert that will be communicated to parents..."
              required
            />
          </div>

          {/* Voice Message Preview */}
          {selectedStudent && formData.title && formData.description && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">Voice Message Preview</h3>
              <p className="text-sm text-green-800 italic">
                "Hello, this is an automated message from C M R Institute of Technology regarding your ward {selectedStudent.name}, 
                Roll Number {selectedStudent.roll_number}, studying {selectedStudent.major} in {selectedStudent.year_of_study} year. 
                {selectedStudent.gpa && `Current GPA is ${selectedStudent.gpa.toFixed(2)}. `}
                Alert: {formData.title}. {formData.description} 
                Please contact the college administration for more details. Thank you."
              </p>
            </div>
          )}

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
              <span>Create Alert</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
