import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, CheckCircle2, AlertTriangle, KeyRound, Building2, UserPlus, LogIn, Sparkles } from 'lucide-react';
import { UserProfile, PRESET_USERS } from '../types/auth.ts';
import { login, register, AuthApiError } from '../services/authApi.ts';

// Shared dev/demo password for the seeded PRESET_USERS accounts (see
// backend/app/db/seed.py DEMO_SEED_PASSWORD / docs/DATA_SOURCES.md) — this
// is intentionally public, documented demo-only knowledge, not a leaked
// secret, and lets the "Quick Switch" buttons still work in one click while
// going through real backend authentication.
const PRESET_DEMO_PASSWORD = 'ChangeMe123!';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState(currentUser?.email || 'rudrachauhan12805@gmail.com');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState('Drilling Operations Engineer');
  const [signUpDepartment, setSignUpDepartment] = useState('Duliajan Operational Command');

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePresetSelect = async (preset: UserProfile) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const user = await login(preset.email, PRESET_DEMO_PASSWORD);
      onLogin(user);
      setSuccessMessage(`Switched active operator to ${user.name} (${user.role})`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMessage(err instanceof AuthApiError ? err.message : 'Could not reach authentication service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const user = await login(signInEmail.trim(), signInPassword);
      onLogin(user);
      setSuccessMessage(`Authenticated as ${user.name}`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMessage(err instanceof AuthApiError ? err.message : 'Could not reach authentication service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const user = await register(
        signUpName.trim(),
        signUpEmail.trim(),
        signUpPassword,
        signUpRole,
        signUpDepartment
      );
      onLogin(user);
      setSuccessMessage(`Registered and logged in as ${user.name}!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMessage(err instanceof AuthApiError ? err.message : 'Could not reach authentication service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 select-none animate-fadeIn">
      <div className="bg-[#fcf8f2] border-2 border-[#5c4f42] rounded-lg shadow-2xl max-w-lg w-full overflow-hidden flex flex-col relative">
        {/* Header Strip */}
        <div className="bg-[#463d35] text-white px-5 py-3.5 border-b-2 border-[#352d26] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center shrink-0">
              <img
                src="/oil_barrel_logo.svg"
                alt="eRTMAC-NWIS Logo"
                className="h-10 w-auto object-contain filter drop-shadow-xs"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold font-['Chakra_Petch',sans-serif] tracking-wide text-amber-300">
                OIL INDIA eRTMAC-NWIS RIG PORTAL
              </h3>
              <p className="text-[11px] text-stone-300 font-mono">
                Institutional Memory & Intelligence Authentication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle: Sign In vs Sign Up */}
        <div className="flex border-b border-[#c4b5a2] bg-[#ebdcc8]">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 py-2.5 text-xs font-bold font-mono flex items-center justify-center gap-2 transition-colors border-b-2 ${
              mode === 'signin'
                ? 'bg-[#fcf8f2] text-[#1c1815] border-amber-600'
                : 'text-[#695c4d] border-transparent hover:text-[#1c1815]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-amber-700" />
            <span>SIGN IN TO RIG CONSOLE</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-2.5 text-xs font-bold font-mono flex items-center justify-center gap-2 transition-colors border-b-2 ${
              mode === 'signup'
                ? 'bg-[#fcf8f2] text-[#1c1815] border-amber-600'
                : 'text-[#695c4d] border-transparent hover:text-[#1c1815]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-700" />
            <span>CREATE OPERATOR ACCOUNT</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-100 border-b border-emerald-300 text-emerald-900 px-4 py-2 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-red-100 border-b border-red-300 text-red-900 px-4 py-2 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-5 overflow-y-auto max-h-[75vh]">
          {/* Preset 1-Click Access for Evaluation & Demo */}
          <div className="mb-4 bg-[#f3e7d6] p-3 rounded border border-[#c4b5a2]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold font-['Chakra_Petch',sans-serif] text-[#3d3227] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Verified Personnel Profiles</span>
              </span>
              <span className="text-[10px] font-mono text-amber-800 font-semibold">Quick Switch</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_USERS.map((u) => {
                const isActive = currentUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handlePresetSelect(u)}
                    className={`text-left p-2 rounded border transition-all text-[11px] ${
                      isActive
                        ? 'bg-[#463d35] text-white border-amber-500 shadow-xs'
                        : 'bg-white hover:bg-[#fffdfa] text-[#1c1815] border-[#c4b5a2] hover:border-amber-600'
                    }`}
                  >
                    <div className="font-bold font-mono truncate">{u.name}</div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-amber-300' : 'text-[#695c4d]'}`}>
                      {u.role}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MODE: SIGN IN */}
          {mode === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#3d3227] font-['Chakra_Petch',sans-serif] mb-1">
                  Operator Email / ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7d6f5f]" />
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="e.g. rudrachauhan12805@gmail.com"
                    className="w-full bg-[#fdfaf5] border border-[#a89985] rounded pl-9 pr-3 py-2 text-xs font-mono text-[#1c1815] focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3d3227] font-['Chakra_Petch',sans-serif] mb-1">
                  Operational Security Key / PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7d6f5f]" />
                  <input
                    type="password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Security PIN or Master Passcode"
                    className="w-full bg-[#fdfaf5] border border-[#a89985] rounded pl-9 pr-3 py-2 text-xs font-mono text-[#1c1815] focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>
                <span className="text-[10px] text-[#7d6f5f] font-mono mt-1 block">
                  Authorized credentials for Oil India field operations.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded bg-[#2c241d] hover:bg-[#1a1612] disabled:opacity-60 text-amber-300 font-bold text-xs font-mono tracking-wide flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>{isSubmitting ? 'AUTHORIZING…' : 'AUTHORIZE & ACCESS CONSOLE'}</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE: SIGN UP */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#3d3227] font-['Chakra_Petch',sans-serif] mb-1">
                  Full Name & Title
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7d6f5f]" />
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="e.g. Er. Ananya Sharma"
                    className="w-full bg-[#fdfaf5] border border-[#a89985] rounded pl-9 pr-3 py-2 text-xs font-sans text-[#1c1815] focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3d3227] font-['Chakra_Petch',sans-serif] mb-1">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7d6f5f]" />
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="e.g. a_sharma@oilindia.in"
                    className="w-full bg-[#fdfaf5] border border-[#a89985] rounded pl-9 pr-3 py-2 text-xs font-mono text-[#1c1815] focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#3d3227] font-['Chakra_Petch',sans-serif] mb-1">
                    Designated Role
                  </label>
                  <select
                    value={signUpRole}
                    onChange={(e) => setSignUpRole(e.target.value)}
                    className="w-full bg-[#fdfaf5] border border-[#a89985] rounded px-2.5 py-2 text-xs font-mono text-[#1c1815] focus:outline-none focus:ring-1 focus:ring-amber-600"
                  >
                    <option value="Drilling Operations Engineer">Drilling Engineer</option>
                    <option value="Chief Geologist & Petrophysicist">Chief Geologist</option>
                    <option value="Mud & Fluids Rheology Specialist">Mud Specialist</option>
                    <option value="Director of Drilling Operations">Operations Director</option>
                    <option value="Wellsite Geologist">Wellsite Geologist</option>
                    <option value="Rig Superintendent">Rig Superintendent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3d3227] font-['Chakra_Petch',sans-serif] mb-1">
                    Department / Wing
                  </label>
                  <input
                    type="text"
                    value={signUpDepartment}
                    onChange={(e) => setSignUpDepartment(e.target.value)}
                    className="w-full bg-[#fdfaf5] border border-[#a89985] rounded px-2.5 py-2 text-xs font-sans text-[#1c1815] focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3d3227] font-['Chakra_Petch',sans-serif] mb-1">
                  Create Passcode / PIN
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7d6f5f]" />
                  <input
                    type="password"
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Enter secret passcode"
                    className="w-full bg-[#fdfaf5] border border-[#a89985] rounded pl-9 pr-3 py-2 text-xs font-mono text-[#1c1815] focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded bg-[#2c241d] hover:bg-[#1a1612] disabled:opacity-60 text-amber-300 font-bold text-xs font-mono tracking-wide flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>{isSubmitting ? 'REGISTERING…' : 'REGISTER & INITIALIZE SESSION'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Clearance Notice */}
          <div className="mt-4 pt-3 border-t border-[#c4b5a2] flex items-center gap-2 text-[10px] font-mono text-[#7d6f5f]">
            <Shield className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Role-Based Access Control (RBAC) enforced per OIL-DGMS well safety standards.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
