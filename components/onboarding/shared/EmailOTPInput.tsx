'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface EmailOTPInputProps {
  isSending: boolean;
  isVerifying: boolean;
  error: string | null;
  onVerify: (code: string) => void;
  onResend: () => void;
}

export default function EmailOTPInput({
  isSending,
  isVerifying,
  error,
  onVerify,
  onResend,
}: EmailOTPInputProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(45);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const prevIsSending = useRef(isSending);

  const otpCode = digits.join('');

  // Auto-focus first box on mount
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Reset countdown after resend completes
  useEffect(() => {
    if (prevIsSending.current && !isSending) {
      setCountdown(45);
    }
    prevIsSending.current = isSending;
  }, [isSending]);

  // Clear boxes on new error
  const prevError = useRef(error);
  useEffect(() => {
    if (error !== null && error !== prevError.current) {
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
    prevError.current = error;
  }, [error]);

  // Auto-submit when all 6 digits filled
  const autoSubmitRef = useRef(false);
  useEffect(() => {
    if (otpCode.length === 6 && !autoSubmitRef.current && !isVerifying && !isSending) {
      autoSubmitRef.current = true;
      onVerify(otpCode);
    }
    if (otpCode.length < 6) {
      autoSubmitRef.current = false;
    }
  }, [otpCode, isVerifying, isSending, onVerify]);

  const handleChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setDigits(prev => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [digits]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  }, []);

  const isSubmitDisabled = otpCode.length !== 6 || isVerifying || isSending;
  const isResendDisabled = countdown > 0 || isSending || isVerifying;

  return (
    <div className="space-y-4">
      {/* 6 individual boxes */}
      <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={isVerifying || isSending}
            className={`w-10 h-12 text-center text-lg font-bold border-2 rounded-xl outline-none transition-all
              ${error ? 'border-red-400 bg-red-50' : d ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white'}
              focus:border-gray-900 focus:ring-1 focus:ring-gray-900
              disabled:bg-gray-100 disabled:border-gray-200 disabled:cursor-not-allowed`}
          />
        ))}
      </div>

      {/* Error */}
      {error && <p className="text-red-500 text-xs text-center">{error}</p>}

      {/* Verify button */}
      <button
        onClick={() => onVerify(otpCode)}
        disabled={isSubmitDisabled}
        className="w-full py-3 rounded-2xl font-semibold text-sm transition-all disabled:cursor-not-allowed"
        style={{
          backgroundColor: isSubmitDisabled ? '#E5E7EB' : '#DDFE71',
          color: isSubmitDisabled ? '#9CA3AF' : '#000',
        }}
      >
        {isVerifying ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
            Verifying...
          </span>
        ) : 'Verify OTP'}
      </button>

      {/* Resend */}
      <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
        <span>Didn't receive the code?</span>
        {countdown > 0 ? (
          <span className="text-gray-400 font-medium">Resend in {countdown}s</span>
        ) : (
          <button
            onClick={onResend}
            disabled={isResendDisabled}
            className="text-blue-600 font-semibold hover:underline disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline"
          >
            {isSending ? 'Sending...' : 'Resend OTP'}
          </button>
        )}
      </div>
    </div>
  );
}
