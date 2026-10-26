'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import {
  DietaryPreference,
  Guest,
  GuestHousehold,
  GuestInput,
  InvitationStatus,
  RsvpStatus,
} from '../../features/guests/types';
import {
  DIETARY_PREFERENCES,
  INVITATION_STATUSES,
  RSVP_STATUSES,
  validateGuestInput,
} from '../../features/guests/guest-engine';
import { Shield, UserPlus, Info } from 'lucide-react';

export interface GuestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (guestData: GuestInput) => void;
  guest?: Guest | null;
  households: GuestHousehold[];
}

export function GuestDialog({
  isOpen,
  onClose,
  onSave,
  guest,
  households,
}: GuestDialogProps) {
  const isEditing = Boolean(guest);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [householdId, setHouseholdId] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('pending');
  const [invitationStatus, setInvitationStatus] = useState<InvitationStatus>('not_sent');
  const [plusOneAllowed, setPlusOneAllowed] = useState(false);
  const [plusOneExpected, setPlusOneExpected] = useState(false);
  const [plusOneName, setPlusOneName] = useState('');
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>('none');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (guest) {
      setFirstName(guest.firstName);
      setLastName(guest.lastName || '');
      setHouseholdId(guest.householdId || '');
      setRelationship(guest.relationship || '');
      setPhone(guest.phone || '');
      setEmail(guest.email || '');
      setRsvpStatus(guest.rsvpStatus);
      setInvitationStatus(guest.invitationStatus);
      setPlusOneAllowed(guest.plusOneAllowed);
      setPlusOneExpected(guest.plusOneExpected);
      setPlusOneName(guest.plusOneName || '');
      setDietaryPreference(guest.dietaryPreference || 'none');
      setDietaryNotes(guest.dietaryNotes || '');
      setNotes(guest.notes || '');
    } else {
      setFirstName('');
      setLastName('');
      setHouseholdId('');
      setRelationship('');
      setPhone('');
      setEmail('');
      setRsvpStatus('pending');
      setInvitationStatus('not_sent');
      setPlusOneAllowed(false);
      setPlusOneExpected(false);
      setPlusOneName('');
      setDietaryPreference('none');
      setDietaryNotes('');
      setNotes('');
    }
    setErrors({});
  }, [guest, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const inputData: GuestInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      householdId: householdId || undefined,
      relationship: relationship.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      rsvpStatus,
      invitationStatus,
      plusOneAllowed,
      plusOneExpected: plusOneAllowed ? plusOneExpected : false,
      plusOneName: plusOneAllowed && plusOneName.trim() ? plusOneName.trim() : undefined,
      dietaryPreference,
      dietaryNotes: dietaryNotes.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const validation = validateGuestInput(inputData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSave(inputData);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Guest Record' : 'Add Guest to Register'}
      description="Record individually tracked attendee, RSVP status, plus-one, and dietary preferences."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Privacy Notice */}
        <div className="bg-neutral-subtle/80 border border-neutral-border p-3.5 rounded-md flex items-start gap-2.5 text-xs text-neutral-muted leading-relaxed">
          <Shield className="w-4 h-4 text-status-success flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-neutral-text font-semibold">Private &amp; Local:</strong> All guest records, contact details, and dietary preferences remain 100% on this device in browser storage. Nothing is shared with external services.
          </p>
        </div>

        {/* Name & Household */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="guest-first-name" className="block text-xs font-semibold uppercase text-neutral-muted">
              First / Given Name <span className="text-status-danger">*</span>
            </label>
            <input
              id="guest-first-name"
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
              }}
              placeholder="e.g. Priya, Rajesh"
              aria-required="true"
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={errors.firstName ? 'guest-first-name-error' : undefined}
              className={`w-full px-3 py-2 text-sm bg-neutral-surface border rounded-md focus:outline-none focus:ring-1 ${
                errors.firstName
                  ? 'border-status-danger focus:ring-status-danger'
                  : 'border-neutral-border focus:ring-primary'
              }`}
            />
            {errors.firstName && (
              <p id="guest-first-name-error" className="text-xs text-status-danger mt-1">
                {errors.firstName}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="guest-last-name" className="block text-xs font-semibold uppercase text-neutral-muted">
              Surname / Family Name <span className="text-xs font-normal lowercase text-neutral-muted">(optional)</span>
            </label>
            <input
              id="guest-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Sharma, Verma"
              className="w-full px-3 py-2 text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="guest-household" className="block text-xs font-semibold uppercase text-neutral-muted">
              Household / Group Roster
            </label>
            <select
              id="guest-household"
              value={householdId}
              onChange={(e) => setHouseholdId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Ungrouped Individual</option>
              {households.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} {h.relationshipType ? `(${h.relationshipType})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="guest-rel" className="block text-xs font-semibold uppercase text-neutral-muted">
              Relationship / Role <span className="text-xs font-normal lowercase text-neutral-muted">(optional)</span>
            </label>
            <input
              id="guest-rel"
              type="text"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="e.g. Cousin, College Roommate, Colleague"
              className="w-full px-3 py-2 text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* RSVP & Invitation Status */}
        <div className="border-t border-neutral-border/60 pt-4 space-y-4">
          <h4 className="text-xs uppercase font-bold text-neutral-muted tracking-wider">
            RSVP &amp; Attendance Status
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="guest-rsvp" className="block text-xs font-semibold uppercase text-neutral-muted">
                RSVP Response <span className="text-status-danger">*</span>
              </label>
              <select
                id="guest-rsvp"
                value={rsvpStatus}
                onChange={(e) => setRsvpStatus(e.target.value as RsvpStatus)}
                className="w-full px-3 py-2 text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {RSVP_STATUSES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="guest-invitation" className="block text-xs font-semibold uppercase text-neutral-muted">
                Invitation Card Status
              </label>
              <select
                id="guest-invitation"
                value={invitationStatus}
                onChange={(e) => setInvitationStatus(e.target.value as InvitationStatus)}
                className="w-full px-3 py-2 text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {INVITATION_STATUSES.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Plus-One Allocation */}
          <div className="bg-neutral-subtle/50 border border-neutral-border p-3.5 rounded-md space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="guest-plus-one-allowed"
                type="checkbox"
                checked={plusOneAllowed}
                onChange={(e) => {
                  const allowed = e.target.checked;
                  setPlusOneAllowed(allowed);
                  if (!allowed) {
                    setPlusOneExpected(false);
                    setPlusOneName('');
                  }
                }}
                className="w-4 h-4 text-primary rounded border-neutral-border focus:ring-primary"
              />
              <label
                htmlFor="guest-plus-one-allowed"
                className="text-xs font-semibold text-neutral-text cursor-pointer select-none"
              >
                Allow Plus-One / Partner Invitation
              </label>
            </div>

            {plusOneAllowed && (
              <div className="pl-6 space-y-3 border-l-2 border-primary/30 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    id="guest-plus-one-expected"
                    type="checkbox"
                    checked={plusOneExpected}
                    onChange={(e) => setPlusOneExpected(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-neutral-border focus:ring-primary"
                  />
                  <label
                    htmlFor="guest-plus-one-expected"
                    className="text-xs font-medium text-neutral-text cursor-pointer select-none"
                  >
                    Partner is Attending &amp; Requires a Seat (Counts towards Expected Attendance &amp; Seating)
                  </label>
                </div>

                {plusOneExpected && (
                  <div className="space-y-1">
                    <label htmlFor="guest-plus-one-name" className="block text-xs font-semibold uppercase text-neutral-muted">
                      Plus-One Name <span className="text-xs font-normal lowercase text-neutral-muted">(optional)</span>
                    </label>
                    <input
                      id="guest-plus-one-name"
                      type="text"
                      value={plusOneName}
                      onChange={(e) => setPlusOneName(e.target.value)}
                      placeholder="e.g. Spouse / Partner Name"
                      className="w-full px-3 py-1.5 text-xs bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dietary Preferences Section */}
        <div className="border-t border-neutral-border/60 pt-4 space-y-4">
          <h4 className="text-xs uppercase font-bold text-neutral-muted tracking-wider">
            Dietary &amp; Food Restrictions
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="guest-diet" className="block text-xs font-semibold uppercase text-neutral-muted">
                Dietary Preference
              </label>
              <select
                id="guest-diet"
                value={dietaryPreference}
                onChange={(e) => setDietaryPreference(e.target.value as DietaryPreference)}
                className="w-full px-3 py-2 text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {DIETARY_PREFERENCES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="guest-diet-notes" className="block text-xs font-semibold uppercase text-neutral-muted">
                Allergy / Special Dietary Notes
              </label>
              <input
                id="guest-diet-notes"
                type="text"
                value={dietaryNotes}
                onChange={(e) => setDietaryNotes(e.target.value)}
                placeholder="e.g. Strict peanut allergy, low-sugar dessert, diabetic portion"
                className="w-full px-3 py-2 text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Contact Info & Notes (Optional) */}
        <div className="border-t border-neutral-border/60 pt-4 space-y-4">
          <h4 className="text-xs uppercase font-bold text-neutral-muted tracking-wider">
            Optional Contact Information
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="guest-phone" className="block text-xs font-semibold uppercase text-neutral-muted">
                Phone Number
              </label>
              <input
                id="guest-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 00000"
                className="w-full px-3 py-2 text-sm font-mono bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="guest-email" className="block text-xs font-semibold uppercase text-neutral-muted">
                Email
              </label>
              <input
                id="guest-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="guest@example.com"
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
            <label htmlFor="guest-notes" className="block text-xs font-semibold uppercase text-neutral-muted">
              General Planning Notes
            </label>
            <textarea
              id="guest-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Staying with Sharma family, airport pickup needed, ceremony speech..."
              className="w-full px-3 py-2 text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-y"
            />
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 pt-4 border-t border-neutral-border">
          <Button variant="ghost" type="button" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="primary" type="submit" className="w-full sm:w-auto">
            {isEditing ? 'Save Guest' : 'Add Guest'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
