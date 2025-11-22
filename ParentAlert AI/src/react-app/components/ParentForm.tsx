import { useState } from "react";
import { X, Save, Loader2, Phone, Mail, UserPlus, Trash2 } from "lucide-react";
import type { StudentType, ParentType, CreateParentType } from "@/shared/types";

interface ParentFormProps {
  student: StudentType;
  parents: ParentType[];
  onClose: () => void;
  onSave: () => void;
}

export default function ParentForm({ student, parents, onClose, onSave }: ParentFormProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<CreateParentType>({
    student_id: student.id,
    name: "",
    relationship: "",
    contact_number: "",
    email: "",
    is_primary_contact: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/parents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({
          student_id: student.id,
          name: "",
          relationship: "",
          contact_number: "",
          email: "",
          is_primary_contact: false,
        });
        setShowAddForm(false);
        onSave();
      } else {
        const errorData = await response.json();
        if (errorData.error) {
          setErrors({ general: errorData.error });
        }
      }
    } catch (error) {
      setErrors({ general: "Failed to save parent" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateParentType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Parent Contacts</h2>
            <p className="text-sm text-gray-600">{student.name} - {student.roll_number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Existing Parents */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Parent Contacts ({parents.length})
              </h3>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 text-sm transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Parent</span>
              </button>
            </div>
            
            {parents.length === 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm font-medium">
                  ⚠️ No parent contacts found. At least one parent contact is required for alerts.
                </p>
              </div>
            )}
            
            {parents.length > 0 && !parents.some(p => p.is_primary_contact === 1) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-700 text-sm font-medium">
                  ⚠️ No primary contact set. Please set one parent as the primary contact for emergency calls.
                </p>
              </div>
            )}

            {parents.length === 0 ? (
              <div className="text-center py-8 bg-amber-50 border border-amber-200 rounded-lg">
                <Phone className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-amber-700 font-medium mb-2">No parent contacts registered</p>
                <p className="text-amber-600 text-sm mb-4">
                  Parent contacts are required to send alerts and make emergency calls. 
                  Please add at least one parent contact for this student.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Add Parent Contact Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {parents.map((parent) => (
                  <div key={parent.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{parent.name}</h4>
                          {parent.is_primary_contact === 1 && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 capitalize">{parent.relationship}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{parent.contact_number}</span>
                          </div>
                          {parent.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{parent.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button className="p-1 hover:bg-gray-100 rounded text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Parent Form */}
          {showAddForm && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Parent</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {errors.general}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent Name *
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
                      Relationship *
                    </label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => handleChange("relationship", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">Select Relationship</option>
                      <option value="father">Father</option>
                      <option value="mother">Mother</option>
                      <option value="guardian">Guardian</option>
                      <option value="uncle">Uncle</option>
                      <option value="aunt">Aunt</option>
                      <option value="grandfather">Grandfather</option>
                      <option value="grandmother">Grandmother</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_number}
                      onChange={(e) => handleChange("contact_number", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_primary_contact"
                    checked={formData.is_primary_contact}
                    onChange={(e) => handleChange("is_primary_contact", e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="is_primary_contact" className="text-sm text-gray-700">
                    Set as primary contact for calls and alerts
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
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
                    <span>Add Parent</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
