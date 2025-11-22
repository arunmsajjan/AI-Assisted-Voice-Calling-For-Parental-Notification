import { useAuth } from "@getmocha/users-service/react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Shield, Users, Phone, BarChart3 } from "lucide-react";

export default function LoginPage() {
  const { user, redirectToLogin, isPending } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-pulse text-indigo-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ParentAlert AI</h1>
            <p className="text-gray-600">Smart parent communication system</p>
            <p className="text-sm text-indigo-600 font-medium">C M R Institute of Technology</p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-indigo-600" />
              <span className="text-sm text-gray-700">Student & Parent Management</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-indigo-600" />
              <span className="text-sm text-gray-700">Automated Parent Calling</span>
            </div>
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span className="text-sm text-gray-700">Analytics & Reporting</span>
            </div>
          </div>

          <button
            onClick={redirectToLogin}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
          >
            <span>Login with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
