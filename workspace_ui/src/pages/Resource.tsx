import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { resourceApi } from '../api/resourceApi';
import { borrowApi } from '../api/borrowApi';
import { Resource } from '../types';
import { supabase } from '../supabaseClient';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Info, 
  Calendar,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';

export const ResourcePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    resourceApi.getById(id).then(data => {
      setResource(data || null);
      setLoading(false);
    });
  }, [id]);

  const handleBorrow = async () => {
    alert("DEBUG: handleBorrow started!");
    console.log("DEBUG: resource.reqApprovers value is:", resource.reqApprovers);
    console.log("DEBUG: resource object structure:", resource);

    if (!resource) return;

    // DEBUGGING STEP: Check if the value exists here


    setRequesting(true);

    try {
      // pull current user data
      //const { data: { user }, error: authError } = await supabase.auth.getUser();

      /*
      HARDCODED FOR TESTING


      HARDCODED FOR TESTING
       */
      const debugUserId = '07c3bcd0-bbd5-4481-a788-462410dc7411';


      /*
      //check if user is logged in
      if (authError || !user) {
        alert("You must be logged in to borrow resources.");
        return;
      }
       */

      alert("DEBUG: handleBorrow started!");
      console.log("DEBUG: resource.reqApprovers value is:", resource.reqApprovers);
      console.log("DEBUG: resource object structure:", resource);
      //create request to borrow in the database
      await borrowApi.createRequest(resource.id, debugUserId, resource.reqApprovers);

      setSuccess(true);

      //update local ui state
      setResource({ ...resource, status: 'REQUESTED' });

      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setRequesting(false);
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
        <h2 className="text-2xl font-bold text-slate-900">Resource not found</h2>
        <Link to="/" className="text-indigo-600 hover:underline mt-4 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link 
        to={`/workspace/${resource.workspaceId}`} 
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Workspace
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm p-8">
        <div className="space-y-8">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  resource.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                  resource.status === 'REQUESTED' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                  'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  {resource.status}
                </span>
                {resource.requiresApproval && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                    <ShieldCheck size={10} />
                    Approval Required
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold text-slate-900">{resource.name}</h1>
            </div>

            <div className="space-y-6">
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

          <div className="pt-4">
            {success ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-800"
                >
                  <CheckCircle2 className="text-emerald-500" />
                  <div>
                    <p className="font-bold">Request Submitted!</p>
                    <p className="text-sm opacity-90">Redirecting to dashboard...</p>
                  </div>
                </motion.div>
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
