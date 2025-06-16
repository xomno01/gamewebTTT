import React, { useState, useEffect } from 'react';
import Panel from './Panel';
import ActionButton from './ActionButton';

interface AuthScreenProps {
  onLogin: (email: string, pass: string) => Promise<boolean>; 
  onRegister: (email: string, pass: string) => Promise<boolean>; 
  initialError?: string;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister, initialError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState(initialError || '');
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); 
    setIsLoading(true);

    let success = false;
    if (isRegistering) {
      if (password !== confirmPassword) {
        setError('Mật khẩu không khớp!');
        setIsLoading(false);
        return;
      }
      if (!email.trim() || !password.trim()) {
        setError('Email và mật khẩu không được để trống!');
        setIsLoading(false);
        return;
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError('Định dạng email không hợp lệ!');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) { // Supabase default minimum password length
        setError('Mật khẩu phải có ít nhất 6 ký tự.');
        setIsLoading(false);
        return;
      }
      success = await onRegister(email, password);
    } else {
      if (!email.trim() || !password.trim()) {
        setError('Email và mật khẩu không được để trống!');
        setIsLoading(false);
        return;
      }
      success = await onLogin(email, password);
    }
    // If successful, App.tsx's onAuthStateChange will handle navigation.
    // If not successful, the `initialError` prop (set by App.tsx from Supabase error) should display.
    if (!success) {
        // Error is expected to be updated via initialError prop if the call in App.tsx sets it.
        // If onLogin/onRegister themselves don't trigger initialError update from App.tsx immediately,
        // we might not see the error from Supabase here unless initialError prop is updated.
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    if (initialError) {
        setError(initialError);
    }
  }, [initialError]);


  return (
    <div className="flex items-center justify-center h-full bg-gray-900 p-4">
      <Panel title={isRegistering ? "Đăng Ký Tài Khoản" : "Đăng Nhập"} className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-yellow-500 focus:border-yellow-500 outline-none"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Mật Khẩu</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-yellow-500 focus:border-yellow-500 outline-none"
              autoComplete={isRegistering ? "new-password" : "current-password"}
              disabled={isLoading}
            />
          </div>
          {isRegistering && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">Xác Nhận Mật Khẩu</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>
          )}
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <ActionButton type="submit" className="!mt-6" disabled={isLoading}>
            {isLoading ? (isRegistering ? "Đang Đăng Ký..." : "Đang Đăng Nhập...") : (isRegistering ? 'Đăng Ký' : 'Đăng Nhập')}
          </ActionButton>
        </form>
        <button
          onClick={() => { setIsRegistering(!isRegistering); setError(''); setEmail(''); setPassword(''); setConfirmPassword(''); }}
          className="mt-4 text-sm text-center w-full text-yellow-400 hover:text-yellow-300 focus:outline-none"
          disabled={isLoading}
        >
          {isRegistering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
        </button>
      </Panel>
    </div>
  );
};

export default AuthScreen;