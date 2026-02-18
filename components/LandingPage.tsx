import React from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Zap, ArrowRight, Lock } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleExampleLogin = async () => {
    try {
      toast.info("Generating SSO Token...");
      const { token } = await api.generateTestToken();
      navigate(`/sso?token=${token}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to generate token");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 shadow-xl shadow-slate-200 border border-slate-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Zap className="w-6 h-6 text-white fill-current" />
          </div>
          <span className="font-bold text-2xl text-slate-900 tracking-tight">wizex</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Welcome</h1>
        <p className="text-slate-500 text-sm md:text-base mb-8">
          Use the example login below to enter the app via SSO.
        </p>

        <button
          onClick={handleExampleLogin}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-2"
        >
          <Lock className="w-5 h-5" /> Example Login <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-xs text-slate-400 mt-4">
          This button calls the backend SSO test token endpoint.
        </p>
      </div>
    </div>
  );
};