import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Zap, MessageCircle, FileSignature, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { startWizeFlowSession, startWizeChatSession } = useAppStore();

  const handleDoctorEntry = async () => {
    try {
      // 1. Generate Token for Doctor
      toast.info("Generating SSO Token...");
      const { token } = await api.generateTestToken(); // Default mock data is Doctor only

      // 2. Redirect to SSO Handler
      navigate(`/sso?token=${token}`);

    } catch (err: any) {
      console.error(err);
      toast.error("Failed to generate token");
    }
  };

  const handlePatientEntry = async () => {
    try {
      // 1. Mock Data with Patient Context
      toast.info("Generating SSO Token with Deep Link...");
      const mockPayload = {
        user: {
          email: "sarah@demo.com",
          name: "Dr. Sarah Jenkins",
          role: "DOCTOR",
          user_id: "ext_u_1"
        },
        hospital: {
          name: "Demo Hospital",
          id: "h_demo"
        },
        patient: {
          id: "p1",
          name: "Ron Weasley",
          email: "ron.w@example.com",
          reg_no: "P-1024"
        }
      };

      const { token } = await api.generateTestToken(mockPayload);

      // 2. Redirect to SSO Handler
      navigate(`/sso?token=${token}`);

    } catch (err: any) {
      console.error(err);
      toast.error("Failed to generate token");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

        {/* Left: Doctor/WizeFlow Context */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200 border border-slate-100 flex flex-col relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>

          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Zap className="w-6 h-6 text-white fill-current" />
              </div>
              <span className="font-bold text-2xl text-slate-900 tracking-tight">wizex</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Doctor View</h2>
            <p className="text-slate-500 text-sm md:text-base">
              Simulate the workflow from the Hospital Management System (HMS).
            </p>
          </div>

          <div className="flex-1 bg-slate-50 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 border border-slate-200 relative">
            <div className="absolute -top-3 left-6 bg-white px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Mock Patient List</div>

            <div className="space-y-3">
              <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm md:text-base">RW</div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm md:text-base">Ron Weasley</p>
                    <p className="text-xs text-slate-500">ID: P-1024 • OP-D</p>
                  </div>
                </div>
                <button
                  onClick={handleDoctorEntry}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-colors"
                >
                  <FileSignature className="w-3.5 h-3.5" /> Sign
                </button>
              </div>
              <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-100 opacity-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm md:text-base">HG</div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm md:text-base">Hermione G.</p>
                    <p className="text-xs text-slate-500">ID: P-1025 • GEN</p>
                  </div>
                </div>
                <button disabled className="bg-slate-100 text-slate-400 px-3 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2">
                  <FileSignature className="w-3.5 h-3.5" /> Sign
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleDoctorEntry}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
          >
            Launch as Doctor <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Patient/WizeChat Context */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200 border border-slate-100 flex flex-col relative overflow-hidden group hover:border-emerald-200 transition-all">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>

          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <MessageCircle className="w-6 h-6 text-white fill-current" />
              </div>
              <span className="font-bold text-2xl text-slate-900 tracking-tight">wizex</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Patient View</h2>
            <p className="text-slate-500 text-sm md:text-base">
              Simulate the patient receiving a secure link via WhatsApp API.
            </p>
          </div>

          <div className="flex-1 bg-emerald-50/50 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 border border-emerald-100 relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            <div className="absolute -top-3 left-6 bg-white px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp Simulation</div>

            <div className="flex flex-col gap-4 max-w-[90%] mx-auto mt-4">
              <div className="self-start bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-xs md:text-sm text-slate-800 max-w-[85%]">
                Hello Ron, please sign your consent form for the upcoming procedure.
              </div>
              <div className="self-start bg-white p-1 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 max-w-[85%] overflow-hidden cursor-pointer hover:shadow-md transition-all" onClick={handlePatientEntry}>
                <div className="bg-slate-100 h-20 md:h-24 bg-center bg-cover" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=300&auto=format&fit=crop')" }}></div>
                <div className="p-3">
                  <p className="font-bold text-blue-600 text-xs md:text-sm mb-1">wizex.app/secure/xyz</p>
                  <p className="text-[10px] md:text-xs text-slate-500">Tap to review and sign document securely.</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handlePatientEntry}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
          >
            Launch as Patient <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};