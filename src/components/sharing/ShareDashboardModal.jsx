import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FaCheck, FaCopy, FaLock, FaShareAlt, FaShieldAlt } from 'react-icons/fa';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { shareLinkService } from '../../services/api';

const FIELD_OPTIONS = [
  { key: 'status', label: 'Status', description: 'Applied, interviewed, selected, rejected, or ghosted.' },
  { key: 'rejectedRound', label: 'Round rejected at', description: 'Shows round number only when you recorded it.' },
  { key: 'dateApplied', label: 'Date applied', description: 'Gives viewers timeline context without notes.' },
];

const EXPIRY_OPTIONS = [
  { value: '24h', label: '24 hours', description: 'Best for quick peer review.' },
  { value: '7d', label: '7 days', description: 'Recommended for mentors and friends.' },
  { value: 'permanent', label: 'Permanent', description: 'Until you revoke it manually.' },
];

const ShareDashboardModal = ({ isOpen, onClose, opportunities, onShareCreated }) => {
  const [selectionMode, setSelectionMode] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [fields, setFields] = useState({
    status: true,
    rejectedRound: true,
    dateApplied: true,
  });
  const [expiry, setExpiry] = useState('7d');
  const [passcodeEnabled, setPasscodeEnabled] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [generatedShare, setGeneratedShare] = useState(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const internships = useMemo(
    () => opportunities.filter((opportunity) => opportunity.category === 'internship'),
    [opportunities]
  );

  const selectedCount = selectionMode === 'all' ? internships.length : selectedIds.length;
  const canGenerate = selectedCount > 0 && (!passcodeEnabled || /^\d{4}$/.test(passcode));

  const resetAndClose = () => {
    setGeneratedShare(null);
    setCopied(false);
    onClose();
  };

  const toggleOpportunity = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  };

  const handleCreateShare = async () => {
    if (!canGenerate) {
      toast.error('Select at least one internship and use a 4-digit passcode if enabled.');
      return;
    }

    try {
      setCreating(true);
      const share = await shareLinkService.create({
        opportunityIds: selectionMode === 'specific' ? selectedIds : undefined,
        fields,
        expiry,
        passcode: passcodeEnabled ? passcode : undefined,
      });
      setGeneratedShare(share);
      onShareCreated?.(share);
      toast.success('Share link generated');
    } catch (error) {
      console.error('Error creating share link:', error);
      toast.error('Failed to generate share link. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedShare?.url) return;

    try {
      await navigator.clipboard.writeText(generatedShare.url);
      setCopied(true);
      toast.success('Share link copied');
    } catch (error) {
      console.error('Error copying share link:', error);
      toast.error('Copy failed. You can select and copy the link manually.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Share Dashboard"
      className="max-w-3xl"
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-xl bg-blue-500/20 p-2 text-blue-300">
              <FaShieldAlt />
            </div>
            <div>
              <h4 className="font-semibold text-white">Private by default, public only by choice</h4>
              <p className="mt-1 text-sm text-blue-100/80">
                This creates a read-only snapshot. Notes, documents, prep data, and your identity are never shared.
              </p>
            </div>
          </div>
        </div>

        {generatedShare ? (
          <div className="space-y-4">
            <Card className="p-5 bg-gradient-to-br from-green-500/15 to-emerald-500/5 border-green-500/20">
              <div className="flex items-center gap-3 text-green-300">
                <FaCheck />
                <h4 className="font-semibold">Your link is ready</h4>
              </div>
              <p className="mt-2 text-sm text-gray-300">
                Copy it now. For security, the raw link is only shown after generation.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  readOnly
                  value={generatedShare.url}
                  className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  aria-label="Generated share link"
                />
                <Button onClick={handleCopy} variant="success" className="sm:w-auto">
                  <FaCopy className="mr-2" />
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </Card>
            <div className="flex justify-end">
              <Button onClick={resetAndClose}>Done</Button>
            </div>
          </div>
        ) : (
          <>
            <section>
              <h4 className="mb-3 font-semibold text-white">1. Choose companies</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectionMode('all')}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    selectionMode === 'all'
                      ? 'border-blue-500/60 bg-blue-500/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                  }`}
                >
                  <span className="font-semibold text-white">All internships</span>
                  <span className="mt-1 block text-sm text-gray-400">{internships.length} companies included</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionMode('specific')}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    selectionMode === 'specific'
                      ? 'border-blue-500/60 bg-blue-500/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                  }`}
                >
                  <span className="font-semibold text-white">Specific internships</span>
                  <span className="mt-1 block text-sm text-gray-400">{selectedIds.length} selected</span>
                </button>
              </div>
              {selectionMode === 'specific' && (
                <div className="mt-3 max-h-44 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-3">
                  {internships.length === 0 ? (
                    <p className="text-sm text-gray-400">Add an internship before creating a share link.</p>
                  ) : (
                    internships.map((opportunity) => (
                      <label key={opportunity.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(opportunity.id)}
                          onChange={() => toggleOpportunity(opportunity.id)}
                          className="h-4 w-4 accent-blue-500"
                        />
                        <span className="text-sm text-white">{opportunity.title}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </section>

            <section>
              <h4 className="mb-3 font-semibold text-white">2. Select visible fields</h4>
              <div className="grid gap-3">
                {FIELD_OPTIONS.map((option) => (
                  <label key={option.key} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <input
                      type="checkbox"
                      checked={fields[option.key]}
                      onChange={(event) =>
                        setFields((current) => ({ ...current, [option.key]: event.target.checked }))
                      }
                      className="mt-1 h-4 w-4 accent-blue-500"
                    />
                    <span>
                      <span className="block font-medium text-white">{option.label}</span>
                      <span className="text-sm text-gray-400">{option.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h4 className="mb-3 font-semibold text-white">3. Expiry and passcode</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                {EXPIRY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setExpiry(option.value)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      expiry === option.value
                        ? 'border-purple-500/60 bg-purple-500/10'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}
                  >
                    <span className="font-semibold text-white">{option.label}</span>
                    <span className="mt-1 block text-xs text-gray-400">{option.description}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={passcodeEnabled}
                    onChange={(event) => setPasscodeEnabled(event.target.checked)}
                    className="h-4 w-4 accent-blue-500"
                  />
                  <span className="flex items-center gap-2 font-medium text-white">
                    <FaLock className="text-blue-300" />
                    Require 4-digit passcode
                  </span>
                </label>
                {passcodeEnabled && (
                  <input
                    inputMode="numeric"
                    maxLength={4}
                    value={passcode}
                    onChange={(event) => setPasscode(event.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="1234"
                    className="mt-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-gray-600 sm:w-48"
                    aria-label="Share link passcode"
                  />
                )}
              </div>
            </section>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-400">
                {selectedCount} internship{selectedCount === 1 ? '' : 's'} will be included.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={resetAndClose}>
                  Cancel
                </Button>
                <Button onClick={handleCreateShare} disabled={!canGenerate || creating}>
                  <FaShareAlt className="mr-2" />
                  {creating ? 'Generating...' : 'Generate Link'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ShareDashboardModal;
