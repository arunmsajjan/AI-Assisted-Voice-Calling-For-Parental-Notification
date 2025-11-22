import { useAuth } from "@getmocha/users-service/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Layout from "@/react-app/components/Layout";
import StudentForm from "@/react-app/components/StudentForm";
import ParentForm from "@/react-app/components/ParentForm";
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Phone, 
  UserPlus,
  Loader2,
  GraduationCap,
  AlertTriangle
} from "lucide-react";
import type { StudentType, ParentType } from "@/shared/types";

export default function StudentsPage() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showParentForm, setShowParentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentType | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null);
  const [studentParents, setStudentParents] = useState<ParentType[]>([]);

  useEffect(() => {
    if (!isPending && !user) {
      navigate("/login");
    }
  }, [user, isPending, navigate]);

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/students");
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentParents = async (studentId: number) => {
    try {
      const response = await fetch(`/api/students/${studentId}/parents`);
      if (response.ok) {
        const data = await response.json();
        setStudentParents(data);
      }
    } catch (error) {
      console.error("Failed to fetch parents:", error);
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setStudents(students.filter(s => s.id !== studentId));
      }
    } catch (error) {
      console.error("Failed to delete student:", error);
    }
  };

  const handleStudentSaved = () => {
    fetchStudents();
    setShowStudentForm(false);
    setEditingStudent(null);
  };

  const handleParentSaved = () => {
    if (selectedStudent) {
      fetchStudentParents(selectedStudent.id);
    }
    setShowParentForm(false);
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.major.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityColor = (gpa: number | null, attendance: number | null) => {
    if (!gpa && !attendance) return "text-gray-500";
    
    const hasLowGPA = gpa && gpa < 6.0;
    const hasLowAttendance = attendance && attendance < 75;
    
    if (hasLowGPA || hasLowAttendance) return "text-red-600";
    if (gpa && gpa < 7.0) return "text-yellow-600";
    return "text-green-600";
  };

  if (isPending || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-600 mt-1">Manage student information and parent contacts</p>
          </div>
          <button
            onClick={() => setShowStudentForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search students by name, roll number, or major..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Students Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-500">Roll: {student.roll_number}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingStudent(student);
                        setShowStudentForm(true);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit3 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{student.major} - Year {student.year_of_study}</span>
                  </div>
                  
                  <div className={`text-sm font-medium ${getSeverityColor(student.gpa, student.attendance_percentage)}`}>
                    GPA: {student.gpa ? student.gpa.toFixed(2) : "N/A"} | 
                    Attendance: {student.attendance_percentage ? `${student.attendance_percentage}%` : "N/A"}
                  </div>

                  {(student.medical_alerts || student.disciplinary_notes) && (
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-xs text-amber-600">Has alerts/notes</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedStudent(student);
                      fetchStudentParents(student.id);
                      setShowParentForm(true);
                    }}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg flex items-center justify-center space-x-1 text-sm transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Parents</span>
                  </button>
                  <button
                    onClick={() => navigate(`/alerts?student=${student.id}`)}
                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg flex items-center justify-center space-x-1 text-sm transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Create Alert</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredStudents.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? "No students found matching your search." : "No students registered yet."}
            </p>
            <button
              onClick={() => setShowStudentForm(true)}
              className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Add your first student
            </button>
          </div>
        )}
      </div>

      {/* Student Form Modal */}
      {showStudentForm && (
        <StudentForm
          student={editingStudent}
          onClose={() => {
            setShowStudentForm(false);
            setEditingStudent(null);
          }}
          onSave={handleStudentSaved}
        />
      )}

      {/* Parent Form Modal */}
      {showParentForm && selectedStudent && (
        <ParentForm
          student={selectedStudent}
          parents={studentParents}
          onClose={() => setShowParentForm(false)}
          onSave={handleParentSaved}
        />
      )}
    </Layout>
  );
}
