'use client';

/**
 * Collapsible coupon-code entry for the booking checkout flow.
 *
 * This component is preview-only: it calls `validateCoupon` to show the
 * visitor what a code would do, but never reserves it. The screen that owns
 * the actual booking (e.g. NewUserOnlinePaymentConfirmation) is responsible
 * for calling `applyCoupon` with the real appointmentId once one exists, and
 * must treat that response's quote as the authoritative final amount — not
 * the preview computed here.
 *
 * States: collapsed → empty / checking / valid / invalid. A code prefilled
 * from the URL (via lib/tracking.ts) starts expanded and auto-validates on
 * mount. If centerId/serviceId change while a code is valid, it re-validates
 * automatically (service/centre-changed case from the PRD).
 */

import React, { useEffect, useRef, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import { ChevronDown, ChevronUp, Tag, X, CheckCircle2 } from 'lucide-react';
import { VALIDATE_COUPON } from '@/gql/queries';
import { Button, Input } from '@/components/ui-atoms';

export type BenefitMechanism =
  | 'ATTRIBUTION_ONLY'
  | 'FLAT_DISCOUNT'
  | 'PERCENTAGE_DISCOUNT'
  | 'FUTURE_CREDIT'
  | 'BONUS_SESSIONS'
  | 'BUY_X_GET_Y'
  | 'DUAL_SIDED_REFERRAL'
  | 'FIXED_PROMOTIONAL_PRICE';

export interface CouponPreview {
  code: string;
  mechanism: BenefitMechanism;
  discountPaise: number;
  originalPaise: number;
  netPaise: number;
}

interface CouponEntryProps {
  /** Prefilled code, e.g. from a ?coupon= URL param. Auto-validates once on mount. */
  initialCode?: string;
  patientId?: string;
  centerId?: string;
  serviceId?: string;
  /** Current line price in paise — used as an estimate; ignored server-side once serviceId resolves a real Service.price. */
  invoiceAmountPaise: number;
  onPreviewChange: (preview: CouponPreview | null) => void;
  /** Disable all interaction, e.g. while the booking itself is being created/paid. */
  disabled?: boolean;
  /**
   * Whether the discount shown actually reduces what's being charged right
   * now. False for flows where the visitor is only paying a booking token —
   * the coupon still gets reserved and attached to the appointment, but the
   * token amount itself must never be discounted. Defaults to true.
   */
  discountAppliesNow?: boolean;
}

const MECHANISM_COPY: Record<BenefitMechanism, string> = {
  ATTRIBUTION_ONLY: 'This code tracks your referral — no discount applies to this payment.',
  FLAT_DISCOUNT: 'Discount applied to this payment.',
  PERCENTAGE_DISCOUNT: 'Discount applied to this payment.',
  FIXED_PROMOTIONAL_PRICE: 'Promotional price applied to this payment.',
  DUAL_SIDED_REFERRAL: 'Referral code applied.',
  FUTURE_CREDIT: 'Credit will be added to your account after this booking.',
  BONUS_SESSIONS: 'Bonus sessions will be added to your account.',
  BUY_X_GET_Y: 'Bonus offer will be applied to your account.',
};

/** Rupees display that only shows decimals when the amount isn't a whole rupee. */
export function formatPaiseAsRupees(paise: number): string {
  const rupees = paise / 100;
  return rupees % 1 === 0 ? rupees.toString() : rupees.toFixed(2);
}

export default function CouponEntry({
  initialCode,
  patientId,
  centerId,
  serviceId,
  invoiceAmountPaise,
  onPreviewChange,
  disabled,
  discountAppliesNow = true,
}: CouponEntryProps) {
  const [expanded, setExpanded] = useState(!!initialCode);
  const [code, setCode] = useState((initialCode ?? '').toUpperCase());
  const [status, setStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<CouponPreview | null>(null);
  const autoCheckedRef = useRef(false);
  const lastValidatedScopeRef = useRef<{ centerId?: string; serviceId?: string } | null>(null);

  const [runValidate] = useLazyQuery(VALIDATE_COUPON, { fetchPolicy: 'network-only' });

  const validate = async (codeToCheck: string) => {
    const trimmed = codeToCheck.trim();
    if (!trimmed) return;
    setStatus('checking');
    setMessage(null);
    try {
      const { data, error } = await runValidate({
        variables: {
          input: {
            code: trimmed,
            patientId: patientId || undefined,
            centerId: centerId || undefined,
            serviceId: serviceId || undefined,
            invoiceAmountPaise,
          },
        },
      });
      // A server-side exception resolves with no data rather than throwing —
      // log it so a real backend bug doesn't hide behind a generic message.
      if (error) console.error('❌ validateCoupon returned an error:', error);
      const result = data?.validateCoupon;
      if (result?.valid && result.quote) {
        const nextPreview: CouponPreview = {
          code: trimmed.toUpperCase(),
          mechanism: result.quote.mechanism,
          discountPaise: result.quote.discountPaise ?? 0,
          originalPaise: result.quote.originalPaise ?? invoiceAmountPaise,
          netPaise: result.quote.netPaise ?? invoiceAmountPaise,
        };
        setStatus('valid');
        setPreview(nextPreview);
        lastValidatedScopeRef.current = { centerId, serviceId };
        onPreviewChange(nextPreview);
      } else {
        setStatus('invalid');
        setMessage(result?.message || "This code isn't valid");
        setPreview(null);
        onPreviewChange(null);
      }
    } catch (err) {
      console.error('❌ validateCoupon failed:', err);
      setStatus('invalid');
      setMessage('Could not check this code right now. Please try again.');
      setPreview(null);
      onPreviewChange(null);
    }
  };

  // Auto-validate a URL-prefilled code once, on mount.
  useEffect(() => {
    if (initialCode && !autoCheckedRef.current) {
      autoCheckedRef.current = true;
      validate(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-validate a currently-applied code if centre/service changes underneath it.
  useEffect(() => {
    if (status !== 'valid' || !lastValidatedScopeRef.current) return;
    const prev = lastValidatedScopeRef.current;
    if (prev.centerId !== centerId || prev.serviceId !== serviceId) {
      validate(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerId, serviceId]);

  const handleApply = () => validate(code);

  const handleRemove = () => {
    setStatus('idle');
    setMessage(null);
    setPreview(null);
    setCode('');
    lastValidatedScopeRef.current = null;
    onPreviewChange(null);
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        disabled={disabled}
        className="w-full flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 mb-6 text-left disabled:opacity-50"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-[#203A37]">
          <Tag className="w-4 h-4" />
          Have a coupon code?
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 mb-6">
      <button
        type="button"
        onClick={() => !preview && setExpanded(false)}
        className="w-full flex items-center justify-between mb-3"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Tag className="w-4 h-4" />
          Coupon Code
        </span>
        {!preview && <ChevronUp className="w-4 h-4 text-gray-400" />}
      </button>

      {status === 'valid' && preview ? (
        <div className="flex items-center justify-between rounded-xl bg-[#203A37]/5 border border-[#203A37]/20 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#203A37] flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#203A37]">{preview.code} applied</p>
              <p className="text-xs text-gray-600">
                {preview.discountPaise > 0
                  ? discountAppliesNow
                    ? `You save ₹${formatPaiseAsRupees(preview.discountPaise)} on this payment.`
                    : `You'll save ₹${formatPaiseAsRupees(preview.discountPaise)} on your full invoice. This payment isn't affected.`
                  : MECHANISM_COPY[preview.mechanism]}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            aria-label="Remove coupon"
            title="Remove coupon"
            className="text-gray-400 hover:text-red-600 disabled:opacity-50 flex-shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (status === 'invalid') {
                  setStatus('idle');
                  setMessage(null);
                }
              }}
              placeholder="Enter coupon code"
              disabled={disabled || status === 'checking'}
              error={status === 'invalid' ? message || undefined : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApply();
                }
              }}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleApply}
            isLoading={status === 'checking'}
            disabled={disabled || !code.trim() || status === 'checking'}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
