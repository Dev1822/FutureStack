import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FaEye, FaLink, FaRegClock, FaTrashAlt } from 'react-icons/fa';
import Button from '../common/Button';
import Card from '../common/Card';
import { shareLinkService } from '../../services/api';

const formatDate = (value) => {
  if (!value) return 'Permanent';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const isExpired = (share) => Boolean(share.expiresAt && new Date(share.expiresAt) <= new Date());

const ManageSharesPanel = ({ refreshKey = 0 }) => {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);

  useEffect(() => {
    fetchShares();
  }, [refreshKey]);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const data = await shareLinkService.list();
      setShares(data);
    } catch (error) {
      console.error('Error fetching share links:', error);
      toast.error('Failed to load share links');
    } finally {
      setLoading(false);
    }
  };

  const revokeShare = async (id) => {
    try {
      setRevokingId(id);
      const revoked = await shareLinkService.revoke(id);
      setShares((current) =>
        current.map((share) => (share.id === id ? { ...share, ...revoked } : share))
      );
      toast.success('Share link revoked');
    } catch (error) {
      console.error('Error revoking share link:', error);
      toast.error('Failed to revoke share link');
    } finally {
      setRevokingId(null);
    }
  };

  const activeShares = shares.filter((share) => share.isActive && !isExpired(share));

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <FaLink className="text-blue-400" />
            Active Share Links
          </h3>
          <p className="text-sm text-gray-400">
            Revoke access anytime. Raw URLs are only shown when generated.
          </p>
        </div>
        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm text-blue-200">
          {activeShares.length} active
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : activeShares.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-300">
            <FaLink />
          </div>
          <h4 className="font-semibold text-white">No active shares yet</h4>
          <p className="mt-1 text-sm text-gray-400">
            Generate a link from the dashboard when you want to share progress with someone.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeShares.map((share) => (
            <div
              key={share.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Created</p>
                    <p className="text-sm font-medium text-white">{formatDate(share.createdAt)}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-gray-500">
                      <FaRegClock />
                      Expiry
                    </p>
                    <p className="text-sm font-medium text-white">{formatDate(share.expiresAt)}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-gray-500">
                      <FaEye />
                      Views
                    </p>
                    <p className="text-sm font-medium text-white">{share.viewCount || 0}</p>
                  </div>
                </div>
                <Button
                  variant="danger"
                  onClick={() => revokeShare(share.id)}
                  disabled={revokingId === share.id}
                  className="w-full md:w-auto"
                >
                  <FaTrashAlt className="mr-2" />
                  {revokingId === share.id ? 'Revoking...' : 'Revoke'}
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400">
                <span className="rounded-full bg-white/5 px-2 py-1">
                  {share.summary?.total || 0} internships
                </span>
                {share.hasPasscode && (
                  <span className="rounded-full bg-purple-500/10 px-2 py-1 text-purple-200">
                    Passcode protected
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default ManageSharesPanel;
