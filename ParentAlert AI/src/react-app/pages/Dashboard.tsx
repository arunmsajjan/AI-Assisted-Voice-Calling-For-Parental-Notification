import { useAuth } from "@getmocha/users-service/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Layout from "@/react-app/components/Layout";
import StatsCard from "@/react-app/components/StatsCard";
import { 
  Users, 
  UserCheck, 
  AlertTriangle, 
  Phone, 
  TrendingUp, 
  Clock,
  Loader2
} from "lucide-react";
import type { DashboardStatsType } from "@/shared/types";

export default function DashboardPage() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !user) {
      navigate("/login");
    }
  }, [user, isPending, navigate]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user.email}. Here's an overview of your system.
          </p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <StatsCard
              title="Total Students"
              value={stats.total_students}
              icon={Users}
              color="blue"
              description="Registered students"
            />
            <StatsCard
              title="Total Parents"
              value={stats.total_parents}
              icon={UserCheck}
              color="green"
              description="Parent contacts"
            />
            <StatsCard
              title="Active Alerts"
              value={stats.active_alerts}
              icon={AlertTriangle}
              color="yellow"
              description="Ongoing alerts"
            />
            <StatsCard
              title="Completed Calls"
              value={stats.completed_calls}
              icon={Phone}
              color="indigo"
              description="Successful calls"
            />
            <StatsCard
              title="Success Rate"
              value={`${stats.success_rate.toFixed(1)}%`}
              icon={TrendingUp}
              color="green"
              description="Call success rate"
            />
            <StatsCard
              title="Pending Alerts"
              value={stats.pending_alerts}
              icon={Clock}
              color="red"
              description="Awaiting action"
            />
            <StatsCard
              title="Avg Response Time"
              value={`${stats.average_response_time}min`}
              icon={Clock}
              color="purple"
              description="Average call response"
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Failed to load dashboard statistics</p>
            <button
              onClick={fetchStats}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => navigate("/students")}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Users className="w-6 h-6 text-indigo-600" />
              <div>
                <h3 className="font-medium text-gray-900">Manage Students</h3>
                <p className="text-sm text-gray-500">Add, edit, or view student details</p>
              </div>
            </button>
            <button
              onClick={() => navigate("/alerts")}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <div>
                <h3 className="font-medium text-gray-900">Create Alert</h3>
                <p className="text-sm text-gray-500">Send alerts to parents</p>
              </div>
            </button>
            <button
              onClick={() => navigate("/call-logs")}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Phone className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-medium text-gray-900">View Call Logs</h3>
                <p className="text-sm text-gray-500">Review call history and status</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
