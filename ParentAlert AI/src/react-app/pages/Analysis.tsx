import { useAuth } from "@getmocha/users-service/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Layout from "@/react-app/components/Layout";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  AlertTriangle, 
  Phone, 
  Users, 
  Clock,
  BarChart3,
  Loader2
} from "lucide-react";

interface AnalyticsData {
  alerts_by_severity: Array<{ severity: string; count: number }>;
  alerts_by_status: Array<{ status: string; count: number }>;
  alerts_by_type: Array<{ alert_type: string; count: number }>;
  calls_by_relationship: Array<{ 
    relationship: string; 
    total_calls: number; 
    successful_calls: number; 
  }>;
  monthly_trends: Array<{ 
    month: string; 
    alerts_created: number; 
    calls_completed: number; 
  }>;
  student_performance: Array<{ 
    performance_category: string; 
    student_count: number; 
    students_with_alerts: number; 
  }>;
  response_time_analysis: Array<{ response_category: string; count: number }>;
}

const COLORS = {
  critical: '#EF4444',
  high: '#F97316', 
  medium: '#EAB308',
  pending: '#6B7280',
  in_progress: '#3B82F6',
  completed: '#10B981',
  primary: '#6366F1',
  secondary: '#8B5CF6',
  tertiary: '#EC4899',
  quaternary: '#14B8A6'
};

export default function AnalysisPage() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !user) {
      navigate("/login");
    }
  }, [user, isPending, navigate]);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch("/api/analytics/overview");
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonthLabel = (month: string) => {
    const [year, monthNum] = month.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
  };

  const calculateSuccessRate = (successful: number, total: number) => {
    return total > 0 ? ((successful / total) * 100).toFixed(1) : '0.0';
  };

  if (isPending || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  if (!analyticsData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Failed to load analytics data</p>
          <button
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive analysis of alerts, calls, and student performance data
          </p>
        </div>

        {/* Alert Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Alerts by Severity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Alerts by Severity</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analyticsData.alerts_by_severity}
                  dataKey="count"
                  nameKey="severity"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                >
                  {analyticsData.alerts_by_severity.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.severity as keyof typeof COLORS] || COLORS.primary} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Alerts by Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">Alert Status Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analyticsData.alerts_by_status}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                >
                  {analyticsData.alerts_by_status.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.status as keyof typeof COLORS] || COLORS.secondary} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Response Time Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900">Response Times</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analyticsData.response_time_analysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="response_category" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.tertiary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Types and Call Success */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Alert Types */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Alert Types</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.alerts_by_type} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="alert_type" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Call Success by Relationship */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Success by Parent Type</h3>
            <div className="space-y-3">
              {analyticsData.calls_by_relationship.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{item.relationship}</p>
                    <p className="text-sm text-gray-600">
                      {item.successful_calls} of {item.total_calls} calls successful
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {calculateSuccessRate(item.successful_calls, item.total_calls)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trends and Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Activity Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.monthly_trends.reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={formatMonthLabel}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={formatMonthLabel}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="alerts_created" 
                  stroke={COLORS.primary} 
                  name="Alerts Created"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="calls_completed" 
                  stroke={COLORS.completed} 
                  name="Calls Completed"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Student Performance Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Performance vs Alerts</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.student_performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="performance_category" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="student_count" fill={COLORS.secondary} name="Total Students" />
                <Bar dataKey="students_with_alerts" fill={COLORS.critical} name="Students with Alerts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analyticsData.alerts_by_severity.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-gray-700">Critical Alerts</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {analyticsData.alerts_by_severity.find(a => a.severity === 'critical')?.count || 0}
                </p>
              </div>
            )}
            
            {analyticsData.calls_by_relationship.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Phone className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">Avg Success Rate</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {analyticsData.calls_by_relationship.length > 0 ? 
                    calculateSuccessRate(
                      analyticsData.calls_by_relationship.reduce((sum, item) => sum + item.successful_calls, 0),
                      analyticsData.calls_by_relationship.reduce((sum, item) => sum + item.total_calls, 0)
                    ) : '0.0'}%
                </p>
              </div>
            )}
            
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Alert Types</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {analyticsData.alerts_by_type.length}
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Performance Categories</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {analyticsData.student_performance.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
