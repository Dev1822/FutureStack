import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FaBriefcase,
  FaChartLine,
  FaExternalLinkAlt,
  FaLock,
  FaRocket,
  FaShieldAlt,
  FaUserGraduate,
} from 'react-icons/fa';
import SEO from '../components/seo/SEO';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { shareLinkService } from '../services/api';

const STATUS_STYLES = {
  applied: 'bg-blue-500/10 text-blue-200 border-blue-500/20',
  interviewed: 'bg-purple-500/10 text-purple-200 border-purple-500/20',
  shortlisted: 'bg-amber-500/10 text-amber-200 border-amber-500/20',
  selected: 'bg-green-500/10 text-green-200 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-200 border-red-500/20',
  ghosted: 'bg-slate-500/10 text-slate-200 border-slate-500/20',
};

const statusLabel = (status) => {
  if (!status) return 'Hidden';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDate = (value) => {
  if (!value) return 'Not shown';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const PublicSharePage = () => {
  const { token } = useParams();
  const [share, setShare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [passcodeLoading, setPasscodeLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passcodeError, setPasscodeError] = useState('');

  const fetchPublicShare = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await shareLinkService.getPublic(token);
      setShare(data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 410) {
        setError('This link has expired or been revoked.');
      } else {
        setError('We could not load this shared dashboard.');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPublicShare();
  }, [fetchPublicShare]);

  const verifyPasscode = async (event) => {
    event.preventDefault();
    if (!/^\d{4}$/.test(passcode)) {
      setPasscodeError('Enter the 4-digit passcode.');
      return;
    }

    try {
      setPasscodeLoading(true);
      setPasscodeError('');
      const data = await shareLinkService.verifyPasscode(token, passcode);
      setShare(data);
    } catch (err) {
      setPasscodeError(err?.response?.data?.message || 'Incorrect passcode. Please try again.');
    } finally {
      setPasscodeLoading(false);
    }
  };

  const snapshot = share?.snapshot;
  const opportunities = snapshot?.opportunities || [];
  const summary = useMemo(() => snapshot?.summary || {}, [snapshot]);
  const fields = snapshot?.options?.fields || {};

  const heroStats = useMemo(
    () => [
      { label: 'Tracked', value: summary.total || 0, accent: 'text-blue-200' },
      { label: 'Selected', value: summary.selected || 0, accent: 'text-green-200' },
      { label: 'Rejected', value: summary.rejected || 0, accent: 'text-red-200' },
      { label: 'Ghosted', value: summary.ghosted || 0, accent: 'text-slate-200' },
    ],
    [summary]
  );

  const renderUnavailable = (message) => (
    <div className="min-h-screen bg-black px-4 py-12 text-white">
      <SEO
        title="Shared Dashboard Unavailable"
        description="This FutureStack shared dashboard link is unavailable."
        canonical={`/share/${token}`}
        noindex={true}
      />
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-300">
            <FaLock size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white">Shared dashboard unavailable</h1>
          <p className="mt-3 text-gray-400">{message}</p>
          <Link to="/" className="mt-6 inline-flex">
            <Button>
              Visit FutureStack
              <FaExternalLinkAlt className="ml-2 text-sm" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <SEO
          title="Loading Shared Dashboard"
          description="Loading a shared FutureStack placement dashboard."
          canonical={`/share/${token}`}
          noindex={true}
        />
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-400">Loading shared dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return renderUnavailable(error);
  }

  if (share?.requiresPasscode) {
    return (
      <div className="min-h-screen bg-black px-4 py-12 text-white">
        <SEO
          title="Passcode Required"
          description="Enter the passcode to view this shared FutureStack placement dashboard."
          canonical={`/share/${token}`}
          noindex={true}
        />
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <Card className="w-full p-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/15 text-blue-200">
              <FaLock size={24} />
            </div>
            <h1 className="text-center text-2xl font-bold text-white">Passcode required</h1>
            <p className="mt-3 text-center text-gray-300">
              This shared dashboard is protected. Enter the 4-digit passcode from the sender.
            </p>
            <form onSubmit={verifyPasscode} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-300">4-digit passcode</span>
                <input
                  value={passcode}
                  onChange={(event) => {
                    setPasscode(event.target.value.replace(/\D/g, '').slice(0, 4));
                    setPasscodeError('');
                  }}
                  inputMode="numeric"
                  maxLength={4}
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-blue-500"
                  aria-label="Share passcode"
                />
              </label>
              {passcodeError && <p className="text-sm text-red-300">{passcodeError}</p>}
              <Button type="submit" disabled={passcodeLoading} className="w-full">
                {passcodeLoading ? 'Verifying...' : 'Unlock Dashboard'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return renderUnavailable('This share link did not include a readable dashboard snapshot.');
  }

  return (
    <div className="min-h-screen overflow-hidden bg-black text-white">
      <SEO
        title="Shared Placement Dashboard"
        description="A read-only FutureStack placement tracker snapshot."
        canonical={`/share/${token}`}
        noindex={true}
      />

      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-20 right-0 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <header className="mb-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur sm:p-8 lg:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm text-blue-200">
                <FaShieldAlt />
                Read-only placement snapshot
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                A placement dashboard worth sharing.
              </h1>
              <p className="mt-4 text-base leading-7 text-gray-300 sm:text-lg">
                This student is tracking applications, outcomes, and interview progress in FutureStack.
                Private notes and owner identity are hidden.
              </p>
            </div>
            <Link to="/" className="inline-flex">
              <Button className="w-full sm:w-auto">
                Try FutureStack
                <FaRocket className="ml-2" />
              </Button>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {heroStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className={`mt-2 text-3xl font-bold ${stat.accent}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                <FaBriefcase className="text-blue-300" />
                Shared companies
              </h2>
              <span className="text-sm text-gray-500">Generated {formatDate(snapshot.generatedAt)}</span>
            </div>

            {opportunities.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-400">No companies were included in this shared snapshot.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {opportunities.map((opportunity) => (
                  <Card key={opportunity.id} className="p-5 hover:border-blue-500/20">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                          {opportunity.category || 'internship'}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-white">{opportunity.title}</h3>
                      </div>
                      {fields.status && (
                        <span className={`w-fit rounded-full border px-3 py-1 text-sm ${STATUS_STYLES[opportunity.status] || 'border-white/10 bg-white/5 text-gray-200'}`}>
                          {statusLabel(opportunity.status)}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {fields.rejectedRound && (
                        <div className="rounded-xl bg-white/[0.03] p-3">
                          <p className="text-xs text-gray-500">Pipeline stage</p>
                          <p className="mt-1 text-sm font-medium text-white">
                            {opportunity.rejectedRoundNumber
                              ? `Rejected at round ${opportunity.rejectedRoundNumber}`
                              : opportunity.currentRoundNumber
                                ? `Currently at round ${opportunity.currentRoundNumber}`
                                : 'Not recorded'}
                          </p>
                        </div>
                      )}
                      {fields.dateApplied && (
                        <div className="rounded-xl bg-white/[0.03] p-3">
                          <p className="text-xs text-gray-500">Date applied</p>
                          <p className="mt-1 text-sm font-medium text-white">{formatDate(opportunity.dateApplied)}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/5">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <FaChartLine className="text-purple-300" />
                Snapshot insights
              </h2>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>In progress</span>
                    <span>{summary.inProgress || 0}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-blue-400"
                      style={{ width: `${summary.total ? ((summary.inProgress || 0) / summary.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Selected</span>
                    <span>{summary.selected || 0}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-green-400"
                      style={{ width: `${summary.total ? ((summary.selected || 0) / summary.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Rejected or ghosted</span>
                    <span>{(summary.rejected || 0) + (summary.ghosted || 0)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-red-400"
                      style={{ width: `${summary.total ? (((summary.rejected || 0) + (summary.ghosted || 0)) / summary.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-blue-500/10 p-3 text-blue-300">
                  <FaUserGraduate />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Build your own tracker</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    FutureStack helps students organize applications, interview rounds, prep work,
                    documents, hackathons, analytics, and reports in one focused workspace.
                  </p>
                  <Link to="/" className="mt-4 inline-flex">
                    <Button variant="outline">
                      Explore FutureStack
                      <FaExternalLinkAlt className="ml-2 text-xs" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </aside>
        </section>
      </main>

      <footer className="relative border-t border-white/10 px-4 py-8 text-center text-sm text-gray-500">
        Shared via FutureStack — futurestack.online
      </footer>
    </div>
  );
};

export default PublicSharePage;
