import { useAuth } from "@getmocha/users-service/react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Layout from "@/react-app/components/Layout";
import AlertForm from "@/react-app/components/AlertForm";
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Phone, 
  Loader2
} from "lucide-react";
import type { StudentType, ParentType } from "@/shared/types";

export default function AlertsPage() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedStudentId = searchParams.get("student");

  const [alerts, setAlerts] = useState<any[]>([]);
  const [students, setStudents] = useState<StudentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [callingAlert, setCallingAlert] = useState<number | null>(null);

  useEffect(() => {
    if (!isPending && !user) {
      navigate("/login");
    }
  }, [user, isPending, navigate]);

  useEffect(() => {
    if (user) {
      fetchAlerts();
      fetchStudents();
    }
  }, [user]);

  useEffect(() => {
    if (selectedStudentId && students.length > 0) {
      setShowAlertForm(true);
    }
  }, [selectedStudentId, students]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/alerts");
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    }
  };

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

  const handleCallParent = async (alertId: number, studentId: number) => {
    setCallingAlert(alertId);
    try {
      // First, get the student's parents
      const parentsResponse = await fetch(`/api/students/${studentId}/parents`);
      if (!parentsResponse.ok) {
        alert("Failed to fetch parent contacts. Please try again.");
        setCallingAlert(null);
        return;
      }
      
      const parents: ParentType[] = await parentsResponse.json();
      
      if (parents.length === 0) {
        alert("No parent contacts found for this student. Please add parent contacts first by going to the Students page and clicking 'Parents' for this student.");
        setCallingAlert(null);
        return;
      }
      
      const primaryParent = parents.find(p => p.is_primary_contact === 1) || parents[0];
      
      if (!primaryParent || !primaryParent.contact_number) {
        alert("No valid parent contact number found. Please ensure parent contact information is complete.");
        setCallingAlert(null);
        return;
      }

      // Make the call
      const callResponse = await fetch("/api/call-parent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alert_id: alertId,
          parent_id: primaryParent.id,
          phone_number: primaryParent.contact_number,
        }),
      });

      if (callResponse.ok) {
        const result = await callResponse.json();
        alert(`Call initiated successfully to ${primaryParent.name} (${primaryParent.contact_number}). Status: ${result.call_status}`);
        fetchAlerts(); // Refresh alerts
      } else {
        const errorData = await callResponse.json();
        alert(`Failed to initiate call: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to call parent:", error);
      alert("Failed to initiate call. Please check your internet connection and try again.");
    } finally {
      setCallingAlert(null);
    }
  };

  const handleAlertSaved = () => {
    fetchAlerts();
    setShowAlertForm(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.roll_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

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
            <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
            <p className="text-gray-600 mt-1">Create and manage student alerts</p>
          </div>
          <button
            onClick={() => setShowAlertForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Alert</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search alerts by student name, title, or roll number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(alert.status)}`}>
                        {alert.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Student: <strong>{alert.student_name}</strong> ({alert.roll_number})
                    </p>
                    <p className="text-gray-700">{alert.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Created: {new Date(alert.created_at).toLocaleDateString()} at {new Date(alert.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {alert.status === 'pending' && (
                      <button
                        onClick={() => handleCallParent(alert.id, alert.student_id)}
                        disabled={callingAlert === alert.id}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        {callingAlert === alert.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Phone className="w-4 h-4" />
                        )}
                        <span>Call Parent</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredAlerts.length === 0 && !loading && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== "all" || severityFilter !== "all" 
                    ? "No alerts found matching your filters." 
                    : "No alerts created yet."
                  }
                </p>
                <button
                  onClick={() => setShowAlertForm(true)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Create your first alert
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alert Form Modal */}
      {showAlertForm && (
        <AlertForm
          students={students}
          preselectedStudentId={selectedStudentId ? parseInt(selectedStudentId) : undefined}
          onClose={() => setShowAlertForm(false)}
          onSave={handleAlertSaved}
        />
      )}
    </Layout>
  );
}
