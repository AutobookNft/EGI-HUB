/**
 * 2FA Challenge Page
 * 
 * Schermata in cui l'admin inserisce il codice dell'app Authenticator.
 * Se è il primo accesso, mostra il QRCode per il pairing.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../../services/authApi';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function TwoFactorChallenge() {
  const navigate = useNavigate();
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [qrData, setQrData] = useState<{ secret: string; qr_code_url: string; is_confirmed: boolean } | null>(null);

  // Al montaggio, controlliamo lo status 2FA
  useEffect(() => {
    loadSetupData();
  }, []);

  const loadSetupData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authApi.setup2fa();
      setQrData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore nel caricamento dei dati 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerifying(true);

    try {
      if (qrData?.is_confirmed) {
        // Se è già stato configurato prima
        await authApi.verify2fa(code);
      } else {
        // Se è la prima volta (pairing code config)
        await authApi.confirm2fa(code);
      }
      
      // Una volta sbloccato, ricarichiamo l'utente per aggiornare l'ability se necessario, quindi lo buttiamo in app
      navigate('/my-projects', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Codice 2FA non valido.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner text-primary loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <ShieldCheck className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-2">Sicurezza 2FA</h2>
          
          {error && (
            <div className="alert alert-error mb-4">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {!qrData?.is_confirmed ? (
            <div className="text-center space-y-4">
              <div className="alert alert-warning text-sm">
                Essendo un Super Admin, l'uso dell'Autenticatore (es. Google Authenticator) è obbligatorio.
              </div>
              <p className="text-sm">Scansiona questo QR Code con la tua app:</p>
              
              <div className="flex justify-center p-4 bg-white rounded-lg inline-block mx-auto border-2 border-gray-100">
                {qrData?.qr_code_url && (
                    <QRCodeSVG value={qrData.qr_code_url} size={200} />
                )}
              </div>
              
              <p className="text-xs text-base-content/60">
                Se non puoi inquadrare, usa questo manual secret: <br/>
                <code className="bg-base-300 p-1 rounded font-mono text-sm mt-1">{qrData?.secret}</code>
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-base-content/70">
                Inserisci il codice a 6 cifre generato dalla tua app Authenticator.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="form-control">
              <input
                type="text"
                placeholder="Codice a 6 cifre"
                className="input input-bordered w-full text-center text-xl tracking-[0.5em] font-mono"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                maxLength={6}
                required
                disabled={verifying}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full mt-2"
              disabled={code.length !== 6 || verifying}
            >
              {verifying ? (
                <span className="loading loading-spinner loading-md"></span>
              ) : (
                'Verifica & Entra'
              )}
            </button>
          </form>
          
        </div>
      </div>
    </div>
  );
}