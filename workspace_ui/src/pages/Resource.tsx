import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { resourceApi } from '../api/resourceApi';
import { borrowApi } from '../api/borrowApi';
import { workspaceApi } from '../api/workspaceApi';
import { Resource } from '../types';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Info, 
  Calendar,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Printer,
  RotateCcw
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export const ResourcePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [myBorrowId, setMyBorrowId] = useState<string | null>(null); // borrow_request id if user has this resource
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [returning, setReturning] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth() ?? { user: null };
  const [accessDenied, setAccessDenied] = useState(false);

  // Check if current user has this resource borrowed (for Return button)
  useEffect(() => {
    if (!user?.id || !resource?.id) return;
    borrowApi.getUserBorrows(user.id).then(borrows => {
      const mine = borrows.find(b => b.resource_id === resource.id);
      setMyBorrowId(mine?.id ?? null);
    });
  }, [user?.id, resource?.id]);

  // Generate QR code encoding the resource URL (so scanning opens this page).
  // Prefer VITE_PUBLIC_APP_ORIGIN for printed labels; otherwise use the current origin so any
  // deployment (or dev opened via http://LAN-IP:3000) encodes a URL that actually loads this app.
  useEffect(() => {
    if (!resource?.id) return;
    const fromEnv = import.meta.env.VITE_PUBLIC_APP_ORIGIN?.trim();
    const origin = (fromEnv || window.location.origin).replace(/\/$/, '');
    const url = `${origin}/resource/${resource.id}`;
    QRCode.toDataURL(url, { width: 256, margin: 2 })
      .then(setQrDataUrl)
      .catch(err => console.error('QR generation failed:', err));
  }, [resource?.id]);

  useEffect(() => {
    if (!id || !user?.id) return;

    let cancelled = false;
    setLoading(true);
    setAccessDenied(false);

    (async () => {
      try {
        const { resource: res, workspaceId: wsId } = await resourceApi.getByIdWithWorkspace(id);
        if (cancelled) return;

        const allowed = await workspaceApi.canAccessWorkspaceResource(user.id, wsId);
        if (cancelled) return;

        if (!allowed) {
          setAccessDenied(true);
          setResource(null);
          setWorkspaceId(null);
        } else {
          setResource(res);
          setWorkspaceId(wsId);
        }
      } catch {
        if (!cancelled) {
          setResource(null);
          setWorkspaceId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  const handleBorrow = async () => {
    if (!resource || !user?.id) return;
    setRequesting(true);
    try {
      await borrowApi.createRequest(resource.id, user.id, resource.reqApprovers ?? 0);
      setResource(prev => prev ? { ...prev, status: 'REQUESTED' } : null);
      setSuccess(true);
      setTimeout(() => navigate(workspaceId ? `/workspace/${workspaceId}` : '/'), 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setRequesting(false);
    }
  };

  const handleReturn = async () => {
    if (!resource || !myBorrowId) return;
    setReturning(true);
    try {
      await borrowApi.returnResource(myBorrowId, resource.id);
      setResource(prev => prev ? { ...prev, status: 'AVAILABLE' } : null);
      setMyBorrowId(null);
      setSuccess(true);
      setTimeout(() => navigate(workspaceId ? `/workspace/${workspaceId}` : '/'), 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setReturning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium">Loading resource details...</p>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-900">You are not a part of this workspace</h2>
        <Link to="/" className="text-indigo-600 hover:underline mt-4 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link 
        to={workspaceId ? `/workspace/${workspaceId}` : '/'} 
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors print:hidden"
      >
        <ArrowLeft size={16} />
        {workspaceId ? 'Back to Workspace' : 'Back to Dashboard'}
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm p-8">
        <div className="space-y-8">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4 print:hidden">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  resource.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                  resource.status === 'REQUESTED' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                  'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  {resource.status}
                </span>
                {(resource.reqApprovers ?? 0) > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                    <ShieldCheck size={10} />
                    Approval Required
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold text-slate-900 print:text-3xl">{resource.name}</h1>
            </div>

            {/* QR Code section - scan opens this resource page */}
            {qrDataUrl && (
              <div className="flex flex-col sm:flex-row items-start gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 print:p-4 print:border-2">
                <div className="flex-shrink-0 p-3 bg-white rounded-xl shadow-sm print:p-4 print:shadow-none print:border">
                  <img src={qrDataUrl} alt={`QR code for ${resource.name}`} className="w-40 h-40 sm:w-48 sm:h-48 print:w-56 print:h-56" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <QrCode size={20} className="text-indigo-600 print:hidden" />
                    <h4 className="font-bold text-slate-900 text-lg print:text-xl">Scan to view or manage</h4>
                  </div>
                  <p className="text-sm text-slate-600 print:hidden">
                    Scan this QR code with your phone to open this resource. Use it to check out or return items.
                  </p>
                  <p className="text-xs font-mono text-slate-500 print:text-base print:font-semibold">ID: {resource.id}</p>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors print:hidden"
                  >
                    <Printer size={16} />
                    Print
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-6 print:hidden">
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                <div className="mt-1 text-slate-400"><Info size={20} /></div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Description</h4>
                  <p className="text-sm text-slate-500 leading-relaxed mt-1">{resource.description}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                <div className="mt-1 text-slate-400"><Calendar size={20} /></div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Borrowing Terms</h4>
                  <p className="text-sm text-slate-500 leading-relaxed mt-1">
                    Standard 7-day borrow period. Please return in the same condition as received.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 print:hidden space-y-3">
            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-800"
              >
                <CheckCircle2 className="text-emerald-500" />
                <div>
                  <p className="font-bold">Success!</p>
                  <p className="text-sm opacity-90">Redirecting...</p>
                </div>
              </motion.div>
            ) : myBorrowId ? (
              <button
                onClick={handleReturn}
                disabled={returning}
                className="w-full py-4 rounded-2xl font-bold text-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 active:scale-[0.98] flex items-center justify-center gap-2 transition-all"
              >
                {returning ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    <RotateCcw size={20} />
                    Return Resource
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleBorrow}
                disabled={resource.status !== 'AVAILABLE' || requesting}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  resource.status === 'AVAILABLE'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-[0.98]'
                    : resource.status === 'REQUESTED'
                    ? 'bg-indigo-50 text-indigo-400 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {requesting ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : resource.status === 'AVAILABLE' ? (
                  'Request to Borrow'
                ) : resource.status === 'REQUESTED' ? (
                  'Borrow Requested'
                ) : (
                  <>
                    <AlertTriangle size={20} />
                    Currently Unavailable
                  </>
                )}
              </button>
            )}
          </div>
          </div>
        </div>
      </div>
  );
};
