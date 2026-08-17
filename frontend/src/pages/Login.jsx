import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, ShieldCheck, Recycle, Loader2 } from "lucide-react";
import { api, setUser } from "@/lib/appApi";

export default function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState("signin"); // signin | signup
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const finish = (data) => {
    setUser(data.user);
    toast.success(`Welcome, ${data.user.name}!`);
    nav(data.user.role === "admin" ? "/admin" : "/app");
  };

  const doLogin = async (mail, pass) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email: (mail || "").trim(), password: (pass || "").trim() });
      finish(data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const doSignup = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.trim().length < 4) return toast.error("Enter name, email and a 4+ char password");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { name: name.trim(), email: email.trim(), password: password.trim() });
      finish(data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-emerald-50 via-white to-lime-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 mb-4">
            <Recycle className="w-8 h-8" />
          </div>
          <h1 className="font-head text-3xl font-extrabold text-gray-900">Waste2Worth</h1>
          <p className="text-gray-500 mt-1">{mode === "signin" ? "Choose how you'd like to continue" : "Create your account"}</p>
        </div>

        <div className="bg-white rounded-3xl p-7 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] border border-gray-100">
          {mode === "signin" && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button data-testid="continue-user-btn" disabled={loading}
                onClick={() => doLogin("user@ecosort.demo", "user123")}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50 transition-all disabled:opacity-60">
                <User className="w-7 h-7 text-emerald-600" />
                <span className="font-semibold text-gray-800 text-sm">Continue as User</span>
              </button>
              <button data-testid="continue-admin-btn" disabled={loading}
                onClick={() => doLogin("admin@ecosort.demo", "admin123")}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-teal-100 hover:border-teal-400 hover:bg-teal-50 transition-all disabled:opacity-60">
                <ShieldCheck className="w-7 h-7 text-teal-600" />
                <span className="font-semibold text-gray-800 text-sm">Continue as Admin</span>
              </button>
            </div>
          )}

          <div className="relative my-5 text-center">
            <span className="bg-white px-3 text-xs text-gray-400 relative z-10">
              {mode === "signin" ? "or sign in with email" : "sign up with email"}
            </span>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-100" />
          </div>

          {mode === "signin" ? (
            <form onSubmit={(e) => { e.preventDefault(); doLogin(email, password); }} className="space-y-3">
              <input data-testid="login-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                autoCapitalize="none" autoCorrect="off" spellCheck={false}
                placeholder="you@ecosort.demo"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              <input data-testid="login-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoCapitalize="none" autoCorrect="off" spellCheck={false}
                placeholder="password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              <button data-testid="login-submit-btn" type="submit" disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Sign in
              </button>
            </form>
          ) : (
            <form onSubmit={doSignup} className="space-y-3">
              <input data-testid="signup-name-input" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              <input data-testid="signup-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                autoCapitalize="none" autoCorrect="off" spellCheck={false}
                placeholder="you@waste2worth.app"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              <input data-testid="signup-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              <button data-testid="signup-submit-btn" type="submit" disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create account
              </button>
            </form>
          )}

          <div className="mt-5 text-center text-sm text-gray-500">
            {mode === "signin" ? (
              <>New here?{" "}
                <button data-testid="switch-to-signup-btn" onClick={() => setMode("signup")} className="text-emerald-600 font-semibold hover:underline">Create an account</button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button data-testid="switch-to-signin-btn" onClick={() => setMode("signin")} className="text-emerald-600 font-semibold hover:underline">Sign in</button>
              </>
            )}
          </div>

          {mode === "signin" && (
            <div className="mt-5 text-xs text-gray-400 bg-gray-50 rounded-xl p-3 leading-relaxed">
              <b className="text-gray-500">Demo:</b> user@ecosort.demo / user123 · admin@ecosort.demo / admin123
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
