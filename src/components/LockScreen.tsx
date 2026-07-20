import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldAlert, AlertCircle, Fingerprint, ShieldCheck, RefreshCw } from 'lucide-react';

interface LockScreenProps {
  correctPin: string;
  onUnlock: () => void;
  userName: string;
  biometricsEnabled?: boolean;
  shuffleKeypad?: boolean;
}

export default function LockScreen({
  correctPin,
  onUnlock,
  userName,
  biometricsEnabled = false,
  shuffleKeypad = false
}: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Biometrics simulation states
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  // Keypad shuffle
  const [keypadOrder, setKeypadOrder] = useState<string[]>(() => {
    const nums = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    if (shuffleKeypad) {
      return [...nums].sort(() => Math.random() - 0.5);
    }
    return nums;
  });

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const handleKeyPress = (num: string) => {
    if (lockoutTimer > 0) return;
    if (error) setError(false);

    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);

      if (newPin === correctPin) {
        setAttempts(0);
        setTimeout(() => {
          onUnlock();
        }, 300);
      } else if (newPin.length === 4) {
        // Wrong PIN entered
        setTimeout(() => {
          setError(true);
          setPin('');
          const nextAttempts = attempts + 1;
          setAttempts(nextAttempts);

          if (nextAttempts >= 3) {
            // Lock keypad for 15 seconds after 3 wrong attempts
            setLockoutTimer(15);
            setAttempts(0);
          }
        }, 300);
      }
    }
  };

  const handleBackspace = () => {
    if (lockoutTimer > 0) return;
    setPin(pin.slice(0, -1));
    if (error) setError(false);
  };

  const triggerBiometricsScan = () => {
    if (lockoutTimer > 0 || isScanning) return;
    setIsScanning(true);
    setScanSuccess(false);

    // Simulated scanner progress (1.5 seconds)
    setTimeout(() => {
      setScanSuccess(true);
      setIsScanning(false);
      setTimeout(() => {
        onUnlock();
      }, 500);
    }, 1500);
  };

  // Reshuffle keyboard helper
  const handleReshuffle = () => {
    const nums = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    setKeypadOrder([...nums].sort(() => Math.random() - 0.5));
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-[9999] p-4 select-none animate-fade-in">
      {/* Biometrics scanning feedback modal overlay */}
      {isScanning && (
        <div className="absolute inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-md">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-blue-600/10 border-2 border-blue-500 flex items-center justify-center text-blue-400 animate-pulse">
              <Fingerprint className="w-12 h-12" />
            </div>
            {/* Holographic scanner green/blue laser line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 shadow-[0_0_15px_#3b82f6] rounded animate-scanner-scan" />
          </div>
          <h3 className="text-lg font-bold text-white font-sans">Verificação Biométrica</h3>
          <p className="text-xs text-slate-400 font-sans mt-1">Escaneando impressão digital / Face ID cadastrado...</p>
        </div>
      )}

      {scanSuccess && (
        <div className="absolute inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-md">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-4 animate-scale-up">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-white font-sans">Acesso Autorizado!</h3>
          <p className="text-xs text-slate-400 font-sans mt-1">Bem-vindo(a) de volta, {userName}.</p>
        </div>
      )}

      <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-2xl flex flex-col items-center justify-between text-center min-h-[540px]">
        {/* Top Header */}
        <div className="space-y-2.5 w-full">
          <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto text-blue-400">
            {pin.length === 4 && !error ? (
              <Unlock className="w-6 h-6 animate-pulse" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white font-sans tracking-tight">
              Finança Ativa Protegida
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-xs mx-auto">
              Olá, <strong>{userName}</strong>. Digite seu PIN para acessar seu painel financeiro.
            </p>
          </div>
        </div>

        {/* PIN Indicators & Safety Lock Banner */}
        <div className="my-5 w-full">
          {lockoutTimer > 0 ? (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl max-w-xs mx-auto space-y-1">
              <ShieldAlert className="w-5 h-5 text-rose-500 mx-auto animate-bounce" />
              <p className="text-xs font-bold text-rose-400">Teclado Bloqueado Temporariamente</p>
              <p className="text-[11px] text-slate-400">
                Muitas tentativas incorretas. Tente novamente em <strong className="text-rose-400 font-mono text-xs">{lockoutTimer}s</strong>.
              </p>
            </div>
          ) : (
            <>
              <div className="flex gap-4 items-center justify-center">
                {[0, 1, 2, 3].map((index) => {
                  const hasVal = pin.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                        error
                          ? 'bg-rose-500 animate-bounce'
                          : hasVal
                          ? 'bg-blue-500 scale-125 shadow-xs shadow-blue-500/50'
                          : 'bg-slate-800 border border-slate-700'
                      }`}
                    />
                  );
                })}
              </div>
              {error && (
                <p className="text-xs text-rose-400 font-semibold font-sans mt-2.5 flex items-center gap-1 justify-center">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>PIN incorreto. Tentativas restantes: {3 - attempts}</span>
                </p>
              )}
            </>
          )}
        </div>

        {/* Keypad */}
        <div className="w-full grid grid-cols-3 gap-3 max-w-[270px] mx-auto opacity-95">
          {keypadOrder.map((num) => (
            <button
              key={num}
              disabled={lockoutTimer > 0}
              onClick={() => handleKeyPress(num)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-800 border border-slate-700/80 text-white font-bold text-lg flex items-center justify-center hover:bg-slate-700 active:bg-slate-600 transition cursor-pointer mx-auto disabled:opacity-30 disabled:cursor-not-allowed select-none"
            >
              {num}
            </button>
          ))}
          
          {/* Keypad Bottom Row */}
          {biometricsEnabled ? (
            <button
              disabled={lockoutTimer > 0}
              onClick={triggerBiometricsScan}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 flex flex-col items-center justify-center transition cursor-pointer mx-auto disabled:opacity-30 disabled:cursor-not-allowed select-none border border-blue-500/10"
              title="Acessar com Biometria"
            >
              <Fingerprint className="w-6 h-6" />
              <span className="text-[8px] font-bold mt-0.5 uppercase tracking-wider">Bio</span>
            </button>
          ) : (
            <button
              disabled={lockoutTimer > 0}
              onClick={() => setPin('')}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full text-slate-400 font-semibold text-xs flex items-center justify-center hover:text-white transition cursor-pointer mx-auto disabled:opacity-30 disabled:cursor-not-allowed select-none"
            >
              Limpar
            </button>
          )}
          
          <button
            disabled={lockoutTimer > 0}
            onClick={() => handleKeyPress('0')}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-800 border border-slate-700/80 text-white font-bold text-lg flex items-center justify-center hover:bg-slate-700 active:bg-slate-600 transition cursor-pointer mx-auto disabled:opacity-30 disabled:cursor-not-allowed select-none"
          >
            0
          </button>
          
          <button
            disabled={lockoutTimer > 0}
            onClick={handleBackspace}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full text-slate-400 font-semibold text-xs flex items-center justify-center hover:text-white transition cursor-pointer mx-auto disabled:opacity-30 disabled:cursor-not-allowed select-none"
          >
            Apagar
          </button>
        </div>

        {/* Dynamic Keypad Shuffling Controls info */}
        <div className="mt-5 flex flex-col items-center gap-1">
          {shuffleKeypad && (
            <button
              type="button"
              onClick={handleReshuffle}
              className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-400 hover:text-blue-300 transition uppercase tracking-wider cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 animate-spin-slow" />
              <span>Embaralhar Teclado</span>
            </button>
          )}
          <span className="text-[9px] text-slate-500 font-sans uppercase font-bold tracking-widest mt-1">
            Finança Ativa • Segurança Avançada Local e Sincronizada
          </span>
        </div>
      </div>
    </div>
  );
}
