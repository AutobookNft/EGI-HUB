/**
 * Register Page
 * 
 * Form di registrazione per EGI-HUB.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { authApi } from '../../services/authApi';
import { useAuth } from '../../contexts/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordsMatch = password === passwordConfirmation && password.length > 0;
  const passwordValid = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordsMatch) {
      setError('Le password non coincidono');
      return;
    }

    if (!passwordValid) {
      setError('La password deve essere di almeno 8 caratteri');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.register(name, email, password, passwordConfirmation);
      login(response.data.user, response.data.token);
      navigate('/my-projects');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Logo/Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-primary">EGI-HUB</h1>
            <p className="text-base-content/70 mt-2">Crea il tuo account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error mb-4">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Nome</span>
              </label>
              <input
                type="text"
                placeholder="Il tuo nome"
                className="input input-bordered w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="nome@esempio.com"
                className="input input-bordered w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input input-bordered w-full pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password.length > 0 && (
                <label className="label">
                  <span className={`label-text-alt ${passwordValid ? 'text-success' : 'text-error'}`}>
                    {passwordValid ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Minimo 8 caratteri
                      </span>
                    ) : (
                      'Minimo 8 caratteri richiesti'
                    )}
                  </span>
                </label>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Conferma Password</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="input input-bordered w-full"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                disabled={loading}
              />
              {passwordConfirmation.length > 0 && (
                <label className="label">
                  <span className={`label-text-alt ${passwordsMatch ? 'text-success' : 'text-error'}`}>
                    {passwordsMatch ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Le password coincidono
                      </span>
                    ) : (
                      'Le password non coincidono'
                    )}
                  </span>
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading || !passwordsMatch || !passwordValid}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Registrati
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="divider">oppure</div>
          <p className="text-center text-sm">
            Hai già un account?{' '}
            <Link to="/login" className="link link-primary">
              Accedi
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
