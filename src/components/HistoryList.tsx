import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db, collection, query, where, onSnapshot, orderBy, doc, getDoc, handleFirestoreError, OperationType } from '../firebase';
import { Report } from '../types';
import { Clock, History, FileText, CheckCircle2, ShieldAlert, AlertTriangle, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

const HistoryList: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = () => {
    setRefreshing(true);
    
    // Get local anonymous report IDs
    const localReportIds: string[] = JSON.parse(localStorage.getItem('bonga_anonymous_reports') || '[]');

    let unsubscribeFirestore = () => {};

    if (user) {
      // User is logged in: load both their profile reports AND local anonymous reports
      const q = query(
        collection(db, 'reports'),
        where('authorUid', '==', user.uid),
        orderBy('timestamp', 'desc')
      );

      unsubscribeFirestore = onSnapshot(q, async (snapshot) => {
        let loggedInDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
        
        // Fetch any outstanding local anonymous reports
        if (localReportIds.length > 0) {
          try {
            const promises = localReportIds.map(async (id) => {
              try {
                const snap = await getDoc(doc(db, 'reports', id));
                if (snap.exists()) {
                  return { id: snap.id, ...snap.data() } as Report;
                }
              } catch (err) {
                handleFirestoreError(err, OperationType.GET, `reports/${id}`);
              }
              return null;
            });
            const snaps = await Promise.all(promises);
            const anonDocs = snaps.filter((d): d is Report => d !== null);

            // Merge both lists
            const merged = [...loggedInDocs, ...anonDocs];
            
            // Remove duplicates and sort by timestamp
            const unique = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
            unique.sort((a, b) => {
              const tA = a.timestamp?.seconds || 0;
              const tB = b.timestamp?.seconds || 0;
              return tB - tA;
            });
            setReports(unique);
          } catch (e) {
            console.error(e);
            setReports(loggedInDocs);
          }
        } else {
          setReports(loggedInDocs);
        }
        setLoading(false);
        setRefreshing(false);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'reports');
        setLoading(false);
        setRefreshing(false);
      });
    } else {
      // User is visitor / anonymous: fetch only local anonymous reports
      if (localReportIds.length > 0) {
        const fetchAnon = async () => {
          try {
            const promises = localReportIds.map(async (id) => {
              try {
                const snap = await getDoc(doc(db, 'reports', id));
                if (snap.exists()) {
                  return { id: snap.id, ...snap.data() } as Report;
                }
              } catch (err) {
                handleFirestoreError(err, OperationType.GET, `reports/${id}`);
              }
              return null;
            });
            const snaps = await Promise.all(promises);
            const filtered = snaps.filter((d): d is Report => d !== null);
            
            filtered.sort((a, b) => {
              const tA = a.timestamp?.seconds || 0;
              const tB = b.timestamp?.seconds || 0;
              return tB - tA;
            });
            
            setReports(filtered);
            setLoading(false);
            setRefreshing(false);
          } catch (err) {
            console.error(err);
            setLoading(false);
            setRefreshing(false);
          }
        };

        fetchAnon();
      } else {
        setReports([]);
        setLoading(false);
        setRefreshing(false);
      }
    }

    return unsubscribeFirestore;
  };

  useEffect(() => {
    const unsub = fetchReports();
    return () => {
      if (unsub) unsub();
    };
  }, [user]);

  return (
    <div className="p-5 text-slate-800 font-sans max-w-md mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
            <History size={20} className="text-[#4F46E5]" /> Safe Log
          </h1>
          <p className="text-[10px] text-text-dim font-semibold uppercase tracking-wider">Anon Submission Archives</p>
        </div>
        <button 
          onClick={fetchReports} 
          className={`p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-all ${refreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 grow">
          <div className="w-8 h-8 border-3 border-indigo-200 border-t-[#4F46E5] rounded-full animate-spin" />
          <p className="text-xs text-text-dim mt-2 font-medium">Loading safe notes...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-150 p-8 text-center my-6 flex-grow flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-slate-50 border border-slate-150 rounded-full flex items-center justify-center mb-4 shadow-sm text-slate-400">
            <AlertCircle size={24} />
          </div>
          <h3 className="font-display font-extrabold text-sm mb-1 text-slate-900">No Submissions Found</h3>
          <p className="text-xs text-text-dim leading-relaxed mb-6 max-w-[240px]">
            You have not submitted any localized anonymous emergency report logs on this device yet.
          </p>
          <Link to="/report" className="w-full py-2.5 px-4 bg-[#4F46E5] text-white hover:bg-[#3F37C9] text-xs font-bold rounded-xl shadow-sm text-center block">
            Submit New Report
          </Link>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto pr-0.5 max-h-[640px]">
          {reports.map((report) => (
            <div 
              key={report.id} 
              className="bg-white border border-slate-150 rounded-xl p-3.5 shadow-xs hover:border-[#4F46E5]/45 transition-colors group"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    report.category === 'FGM Risk' ? 'bg-indigo-50 text-[#4F46E5]' : 'bg-cyan-50 text-[#06B6D4]'
                  }`}>
                    {report.category}
                  </span>
                  {report.isAnonymous && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-full">
                      ANON
                    </span>
                  )}
                </div>
                
                <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${
                  report.status === 'Pending' ? 'text-amber-500' :
                  report.status === 'In Progress' ? 'text-[#4F46E5]' : 'text-green-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    report.status === 'Pending' ? 'bg-amber-500 animate-pulse' :
                    report.status === 'In Progress' ? 'bg-[#4F46E5]' : 'bg-green-600'
                  }`} />
                  {report.status}
                </span>
              </div>

              <h4 className="font-display font-bold text-xs text-slate-950 mb-1 leading-snug">
                {report.location}
              </h4>
              <p className="text-slate-600 text-[11px] leading-relaxed mb-3 line-clamp-2">
                {report.description}
              </p>

              <div className="flex justify-between items-center text-[9px] text-text-dim font-bold border-t border-slate-50 pt-2 shrink-0">
                <span>
                  {report.timestamp?.toDate 
                    ? new Date(report.timestamp.toDate()).toLocaleDateString()
                    : report.timestamp?.seconds
                    ? new Date(report.timestamp.seconds * 1000).toLocaleDateString()
                    : 'Recent Secures'
                  }
                </span>
                
                <div className="text-[#4F46E5] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Track ID {report.id?.substring(0, 6).toUpperCase()}</span>
                  <ChevronRight size={10} />
                </div>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-center text-text-dim font-medium py-3">
            Secure tracking hashes are cryptographically local to this client device.
          </p>
        </div>
      )}
    </div>
  );
};

export default HistoryList;
