import { useAuth } from "@getmocha/users-service/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Layout from "@/react-app/components/Layout";
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Loader2
} from "lucide-react";

interface CallLogType {
  id: number;
  alert_id: number;
  parent_id: number;
  phone_number: string;
  call_status: string;
  call_duration: number | null;
  external_call_id: string | null;
  message_template: string | null;
  student_name: string;
  parent_name: string;
  alert_title: string;
  created_at: string;
}

export default function CallLogsPage() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [callLogs, setCallLogs] = useState<CallLogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!isPending && !user) {
      navigate("/login");
    }
  }, [user, isPending, navigate]);

  useEffect(() => {
    if (user) {
      fetchCallLogs();
    }
  }, [user]);

  const fetchCallLogs = async () => {
    try {
      const response = await fetch("/api/call-logs");
      if (response.ok) {
        const data = await response.json();
        setCallLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch call logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "no_answer":
        return <PhoneOff className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "no_answer":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const filteredCallLogs = callLogs.filter(log => {
    const matchesSearch = 
      log.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.phone_number.includes(searchTerm) ||
      log.alert_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || log.call_status === statusFilter;
    
    return matchesSearch && matchesStatus;
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Logs</h1>
          <p className="text-gray-600 mt-1">View history of all parent calls and their status</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by student name, parent name, phone number, or alert..."
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
                <option value="initiated">Initiated</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="no_answer">No Answer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Call Logs List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCallLogs.map((log) => (
              <div key={log.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(log.call_status)}
                      <h3 className="text-lg font-semibold text-gray-900">{log.alert_title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.call_status)}`}>
                        {log.call_status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium text-gray-900">Student:</span> {log.student_name}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Parent:</span> {log.parent_name}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Phone:</span> {log.phone_number}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Duration:</span> {formatDuration(log.call_duration)}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-3">
                      Called on: {new Date(log.created_at).toLocaleDateString()} at {new Date(log.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <PhoneCall className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Voice Message Preview */}
                {log.message_template && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Voice Message:</h4>
                    <p className="text-sm text-gray-600 italic">"{log.message_template}"</p>
                  </div>
                )}
              </div>
            ))}

            {filteredCallLogs.length === 0 && !loading && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "No call logs found matching your filters." 
                    : "No calls have been made yet."
                  }
                </p>
                <button
                  onClick={() => navigate("/alerts")}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Create an alert to start making calls
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
