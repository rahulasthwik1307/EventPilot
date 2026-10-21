'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import {
  Vendor,
  VendorCategory,
  VendorInput,
  VendorStatus,
} from '../../features/vendors/types';
import {
  VENDOR_CATEGORIES,
  VENDOR_STATUSES,
  validateVendorInput,
} from '../../features/vendors/vendor-engine';
import { BudgetCategory, CurrencyCode } from '../../features/events/types';
import { formatCurrency, getCurrencySymbol } from '../../features/events/validation';
import { AlertCircle, Info } from 'lucide-react';

export interface VendorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendorData: VendorInput) => void;
  vendor?: Vendor | null;
  categories: BudgetCategory[];
  currency: CurrencyCode;
}

export function VendorDialog({
  isOpen,
  onClose,
  onSave,
  vendor,
  categories,
  currency,
}: VendorDialogProps) {
  const isEditing = Boolean(vendor);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<VendorCategory>('venue');
  const [status, setStatus] = useState<VendorStatus>('researching');
  const [quotedCost, setQuotedCost] = useState('');
  const [agreedCost, setAgreedCost] = useState('');
  const [depositPaid, setDepositPaid] = useState('0');
  const [amountPaid, setAmountPaid] = useState('0');
  const [linkedCategoryId, setLinkedCategoryId] = useState<string>('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (vendor) {
      setName(vendor.name);
      setCategory(vendor.category);
      setStatus(vendor.status);
      setQuotedCost(String(vendor.quotedCost));
      setAgreedCost(vendor.agreedCost != null ? String(vendor.agreedCost) : '');
      setDepositPaid(String(vendor.depositPaid));
      setAmountPaid(String(vendor.amountPaid));
      setLinkedCategoryId(vendor.linkedCategoryId || '');
      setContactPerson(vendor.contactPerson || '');
      setPhone(vendor.phone || '');
      setEmail(vendor.email || '');
      setWebsite(vendor.website || '');
      setNotes(vendor.notes || '');
    } else {
      setName('');
      setCategory('venue');
      setStatus('researching');
      setQuotedCost('');
      setAgreedCost('');
      setDepositPaid('0');
      setAmountPaid('0');
      setLinkedCategoryId('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setWebsite('');
      setNotes('');
    }
    setErrors({});
  }, [vendor, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedQuoted = parseFloat(quotedCost);
    const parsedAgreed = agreedCost.trim() ? parseFloat(agreedCost) : undefined;
    const parsedDeposit = depositPaid.trim() ? parseFloat(depositPaid) : 0;
    const parsedPaid = amountPaid.trim() ? parseFloat(amountPaid) : 0;

    const inputData: VendorInput = {
      name: name.trim(),
      category,
      status,
      quotedCost: Number.isFinite(parsedQuoted) ? parsedQuoted : 0,
      agreedCost: parsedAgreed != null && Number.isFinite(parsedAgreed) ? parsedAgreed : undefined,
      depositPaid: Number.isFinite(parsedDeposit) ? parsedDeposit : 0,
      amountPaid: Number.isFinite(parsedPaid) ? parsedPaid : 0,
      linkedCategoryId: linkedCategoryId || undefined,
      contactPerson: contactPerson.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      website: website.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const validation = validateVendorInput(inputData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSave(inputData);
    onClose();
  };

  const currencySymbol = getCurrencySymbol(currency);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Vendor Record' : 'Record New Vendor'}
      description="Track quotes, contracted agreed rates, payment deposits, and private contact notes."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Accounting Separation Notice */}
        <div className="bg-neutral-subtle/80 border border-neutral-border p-3.5 rounded-md flex items-start gap-2.5 text-xs text-neutral-muted leading-relaxed">
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-neutral-text font-semibold">Accounting Guardrail:</strong> Vendor contract quotes and payments are maintained for contract tracking and do not automatically alter Budget Ledger expenses or actual spending totals.
          </p>
        </div>

        {/* Basic Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="vendor-name" className="block text-xs font-semibold uppercase text-neutral-muted">
              Vendor / Business Name <span className="text-status-danger">*</span>
            </label>
            <input
              id="vendor-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="e.g. The Tamarind Tree, Drishti Photography"
              className={`w-full px-3 py-2 text-sm bg-neutral-surface border rounded-md focus:outline-none focus:ring-1 ${
                errors.name
                  ? 'border-status-danger focus:ring-status-danger'
                  : 'border-neutral-border focus:ring-primary'
              }`}
            />
            {errors.name && <p className="text-xs text-status-danger mt-1">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="vendor-category" className="block text-xs font-semibold uppercase text-neutral-muted">
              Category <span className="text-status-danger">*</span>
            </label>
            <select
              id="vendor-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as VendorCategory)}
              className="w-full px-3 py-2 text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="vendor-status" className="block text-xs font-semibold uppercase text-neutral-muted">
              Engagement Status <span className="text-status-danger">*</span>
            </label>
            <select
              id="vendor-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as VendorStatus)}
              className="w-full px-3 py-2 text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {VENDOR_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Financial Tracking Section */}
        <div className="border-t border-neutral-border/60 pt-4 space-y-4">
          <h4 className="text-xs uppercase font-bold text-neutral-muted tracking-wider">
            Contract &amp; Payment Ledger ({currency})
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="vendor-quoted" className="block text-xs font-semibold uppercase text-neutral-muted">
                Initial Quoted Cost <span className="text-status-danger">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-mono text-neutral-muted">
                  {currencySymbol}
                </span>
                <input
                  id="vendor-quoted"
                  type="number"
                  min="0"
                  step="any"
                  value={quotedCost}
                  onChange={(e) => {
                    setQuotedCost(e.target.value);
                    if (errors.quotedCost) setErrors((prev) => ({ ...prev, quotedCost: '' }));
                  }}
                  placeholder="0"
                  className={`w-full pl-8 pr-3 py-2 text-sm font-mono bg-neutral-surface border rounded-md focus:outline-none focus:ring-1 ${
                    errors.quotedCost
                      ? 'border-status-danger focus:ring-status-danger'
                      : 'border-neutral-border focus:ring-primary'
                  }`}
                />
              </div>
              {errors.quotedCost && (
                <p className="text-xs text-status-danger mt-1">{errors.quotedCost}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="vendor-agreed" className="block text-xs font-semibold uppercase text-neutral-muted">
                Agreed / Final Contract Cost <span className="text-xs font-normal lowercase text-neutral-muted">(optional until agreed)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-mono text-neutral-muted">
                  {currencySymbol}
                </span>
                <input
                  id="vendor-agreed"
                  type="number"
                  min="0"
                  step="any"
                  value={agreedCost}
                  onChange={(e) => {
                    setAgreedCost(e.target.value);
                    if (errors.agreedCost) setErrors((prev) => ({ ...prev, agreedCost: '' }));
                  }}
                  placeholder="Leave empty if negotiating"
                  className={`w-full pl-8 pr-3 py-2 text-sm font-mono bg-neutral-surface border rounded-md focus:outline-none focus:ring-1 ${
                    errors.agreedCost
                      ? 'border-status-danger focus:ring-status-danger'
                      : 'border-neutral-border focus:ring-primary'
                  }`}
                />
              </div>
              {errors.agreedCost && (
                <p className="text-xs text-status-danger mt-1">{errors.agreedCost}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="vendor-deposit" className="block text-xs font-semibold uppercase text-neutral-muted">
                Deposit Paid
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-mono text-neutral-muted">
                  {currencySymbol}
                </span>
                <input
                  id="vendor-deposit"
                  type="number"
                  min="0"
                  step="any"
                  value={depositPaid}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDepositPaid(val);
                    // Helpful copy shortcut: if amountPaid is 0 or matches previous deposit, update amountPaid
                    if (amountPaid === '0' || amountPaid === depositPaid) {
                      setAmountPaid(val);
                    }
                    if (errors.depositPaid) setErrors((prev) => ({ ...prev, depositPaid: '' }));
                  }}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 text-sm font-mono bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="vendor-amount-paid" className="block text-xs font-semibold uppercase text-neutral-muted">
                Total Amount Paid to Date <span className="text-xs font-normal lowercase text-neutral-muted">(includes deposit)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-mono text-neutral-muted">
                  {currencySymbol}
                </span>
                <input
                  id="vendor-amount-paid"
                  type="number"
                  min="0"
                  step="any"
                  value={amountPaid}
                  onChange={(e) => {
                    setAmountPaid(e.target.value);
                    if (errors.amountPaid) setErrors((prev) => ({ ...prev, amountPaid: '' }));
                  }}
                  placeholder="0"
                  className={`w-full pl-8 pr-3 py-2 text-sm font-mono bg-neutral-surface border rounded-md focus:outline-none focus:ring-1 ${
                    errors.amountPaid
                      ? 'border-status-danger focus:ring-status-danger'
                      : 'border-neutral-border focus:ring-primary'
                  }`}
                />
              </div>
              {errors.amountPaid && (
                <p className="text-xs text-status-danger mt-1">{errors.amountPaid}</p>
              )}
            </div>
          </div>

          {/* Linked Budget Category */}
          <div className="space-y-1">
            <label htmlFor="vendor-linked-category" className="block text-xs font-semibold uppercase text-neutral-muted">
              Link to Budget Category <span className="text-xs font-normal lowercase text-neutral-muted">(optional organizational link)</span>
            </label>
            <select
              id="vendor-linked-category"
              value={linkedCategoryId}
              onChange={(e) => setLinkedCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">None (Unlinked)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({formatCurrency(cat.allocatedAmount, currency)} allocated)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contact & Private Notes Section */}
        <div className="border-t border-neutral-border/60 pt-4 space-y-4">
          <h4 className="text-xs uppercase font-bold text-neutral-muted tracking-wider">
            Contact Person &amp; Private Details
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label htmlFor="vendor-contact" className="block text-xs font-semibold uppercase text-neutral-muted">
                Contact Person
              </label>
              <input
                id="vendor-contact"
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3 py-2 text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="vendor-phone" className="block text-xs font-semibold uppercase text-neutral-muted">
                Phone Number
              </label>
              <input
                id="vendor-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 12345"
                className="w-full px-3 py-2 text-sm font-mono bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="vendor-email" className="block text-xs font-semibold uppercase text-neutral-muted">
                Email
              </label>
              <input
                id="vendor-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="contact@business.com"
                className={`w-full px-3 py-2 text-sm bg-neutral-surface border rounded-md focus:outline-none focus:ring-1 ${
                  errors.email
                    ? 'border-status-danger focus:ring-status-danger'
                    : 'border-neutral-border focus:ring-primary'
                }`}
              />
              {errors.email && <p className="text-xs text-status-danger mt-1">{errors.email}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="vendor-website" className="block text-xs font-semibold uppercase text-neutral-muted">
              Website / Portfolio URL
            </label>
            <input
              id="vendor-website"
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="vendor-notes" className="block text-xs font-semibold uppercase text-neutral-muted">
              Contract Notes &amp; Terms
            </label>
            <textarea
              id="vendor-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Inclusions, overtime rates, cancellation window, electrical load requirements..."
              className="w-full px-3 py-2 text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-y"
            />
          </div>
        </div>

        {/* Dialog Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-border">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {isEditing ? 'Save Changes' : 'Record Vendor'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
