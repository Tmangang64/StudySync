import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAppContext } from "../context/AppContext";
import { BookOpen, CheckCircle, Target, Users, Loader2 } from "lucide-react";

export const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { user, login, signup } = useAppContext();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please fill out both fields.");
      return;
    }
    
    setLoading(true);
    try {
      if (isSignUp) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      navigate("/home");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Branding Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-900 text-white flex-col justify-center px-16 xl:px-24 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-800 rounded-bl-full opacity-50 transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500 rounded-tr-full opacity-20 transform -translate-x-1/3 translate-y-1/3"></div>
        
        <div className="relative z-10 max-w-lg">
          <div className="bg-orange-500 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-8">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight">
            Own your <br /><span className="text-orange-400">academic journey.</span>
          </h1>
          <p className="text-blue-100 text-xl leading-relaxed mb-12 opacity-90">
            StudySync helps you plan sessions, build lasting streaks, and recover gracefully when life gets in the way. Connect with study partners globally.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-blue-50">
              <CheckCircle size={24} className="text-orange-400 shrink-0" />
              <span className="font-medium">Plan and track your study commitments</span>
            </div>
            <div className="flex items-center gap-4 text-blue-50">
              <Target size={24} className="text-orange-400 shrink-0" />
              <span className="font-medium">Sync your data across all your devices securely</span>
            </div>
            <div className="flex items-center gap-4 text-blue-50">
              <Users size={24} className="text-orange-400 shrink-0" />
              <span className="font-medium">Stay accountable with solo or buddy sessions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 relative">
        <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-xl border border-slate-100">
          
          <div className="lg:hidden flex justify-center mb-6">
            <div className="bg-orange-100 text-orange-500 p-4 rounded-full">
              <BookOpen size={48} />
            </div>
          </div>

          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              {isSignUp ? "Create an account" : "Welcome back"}
            </h2>
            <p className="text-slate-500">
              {isSignUp ? "Sign up to track your learning journey." : "Sign in to your StudySync account."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="student@nsu.edu"
                aria-required="true"
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-700" htmlFor="password">
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
                aria-required="true"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 py-3 px-4 rounded-xl border border-red-100 flex items-start">
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-blue-900 hover:bg-blue-800 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
              {isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600 font-medium">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button 
                type="button" 
                onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                className="ml-2 text-orange-500 hover:text-orange-600 font-bold transition-colors"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
