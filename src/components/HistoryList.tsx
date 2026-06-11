import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db, collection, query, where, onSnapshot, orderBy, doc, getDoc, handleFirestoreError, OperationType, limit } from '../firebase';
import { Report } from '../types';
import { History, RefreshCw, ChevronRight, Lock, KeyRound, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { SkeletonReportItem } from './SkeletonLoader';

const HistoryList: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [localReportIds] = useLocalStorage<string[]>('bonga_anonymous_reports', []);

  // Modal detail tracker sim
  const [activeTrackingReportId, setActiveTrackingReportId] = useState<string | null>(null);

  // Generates a local receipt tracking reference code from the report document ID
  const generateSHA256Sim = (id: string) => {
    let hash = '';
    const text = `bonga_receipt_${id}`;
    for (let i = 0; i < text.length; i++) {
      hash += text.charCodeAt(i).toString(16);
    }
    return `BG-${hash.substring(0, 16).toUpperCase()}-${id.slice(-4).toUpperCase()}`;
  };

  const fetchReports = () => {
    setRefreshing(true);
    
    let unsubscribeFirestore = () => {};

    if (user) {
      // User is logged in: load both their profile reports AND local anonymous reports
      const q = query(
        collection(db, 'reports'),
        where('authorUid', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(100)
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

  const handleTrackClick = (id: string) => {
    setActiveTrackingReportId(id === activeTrackingReportId ? null : id);
  };

  return (
    <div className="font-sans max-w-md mx-auto h-full flex flex-col relative select-none py-2">
      
      {/* 5. Safe Log Feed Redesign Header */}
      <div className="flex justify-between items-center mb-6 px-1">
        <div>
          <h1 className="text-xl font-display font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History size={20} className="text-[#4F46E5]" /> Reports Feed
          </h1>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mt-1">
            Local Reports Tracking Archive
          </p>
        </div>
        
        <button 
          onClick={fetchReports} 
          className={`p-2 hover:bg-slate-150 rounded-xl text-slate-600 transition-colors ${refreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonReportItem />
          <SkeletonReportItem />
          <SkeletonReportItem />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-[20px] p-8 text-center flex flex-col items-center my-4 shadow-xs">
          <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <Lock size={22} />
          </div>
          <h3 className="font-display font-black text-sm mb-1 text-slate-900 uppercase">Archive Empty</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-6 max-w-[220px]">
            No report logs recorded locally on this browser. Reports are saved on your local device to support status tracking and receipt verification.
          </p>
          <Link to="/report" className="w-full py-2.5 px-4 bg-purple-primary text-white hover:bg-purple-dark text-xs font-black rounded-xl text-center block shadow-md uppercase tracking-wider uppercase">
            Submit Report
          </Link>
        </div>
      ) : (
        /* Clean vertical list of white cards on the light layout grid background */
        <div className="space-y-4">
          {reports.map((report) => {
            const hash = generateSHA256Sim(report.id || 'seed');
            const isTracking = activeTrackingReportId === report.id;

            return (
              <div 
                key={report.id} 
                className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-xs hover:border-[#4F46E5]/40 transition-all"
              >
                {/* Header section of cards */}
                <div className="flex justify-between items-center mb-2.5">
                  {/* Location in bold purple */}
                  <span className="text-sm font-display font-black text-purple-primary flex items-center gap-1">
                    {report.location}
                  </span>

                  {/* Status pill in soft-purple outline */}
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                    report.status === 'Pending' 
                      ? 'bg-amber-50/40 border-amber-205 text-amber-700' 
                      : 'bg-emerald-50/40 border-emerald-250 text-emerald-700'
                  }`}>
                    {report.status}
                  </span>
                </div>

                {/* Report Detail Paragraph */}
                <p className="text-slate-600 text-[11px] leading-relaxed mb-3.5 pl-0.5 font-medium">
                  {report.description}
                </p>

                {/* Tracking Interactive section */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block pl-0.5">
                      Report Routing Status
                    </span>
                    
                    {/* Track Button */}
                    <button
                      onClick={() => handleTrackClick(report.id || '')}
                      className="px-2.5 py-0.5 border border-purple-primary hover:bg-purple-primary/5 text-purple-primary hover:text-purple-dark text-[8.5px] font-black rounded-lg transition-colors flex items-center gap-0.5"
                    >
                      {isTracking ? 'Close Tracker' : 'Track Status'}
                    </button>
                  </div>

                  {isTracking && (
                    <div className="text-[10px] space-y-1 text-slate-655 border-t border-slate-201 pt-2 animate-fadeIn pl-0.5">
                      <div className="flex justify-between">
                        <span>Tracking Status:</span>
                        <span className="font-extrabold text-[#4F46E5]">Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Database Node:</span>
                        <span className="font-bold text-slate-800">Connected to Firebase</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Security:</span>
                        <span className="font-mono text-emerald-600 font-extrabold text-[9px]">Standard Encrypted SSL</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer containing reference code */}
                <div className="border-t border-slate-50 pt-2.5 flex flex-col gap-1 text-[8px]">
                  <span className="text-slate-400 font-extrabold uppercase tracking-widest pl-0.5">
                    Local Receipt Tracking ID
                  </span>
                  <div className="font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-dashed border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-none scroll-smooth text-left">
                    {hash}
                  </div>
                </div>

              </div>
            );
          })}

          <footer className="pt-3 text-center">
            <p className="text-[8.5px] text-slate-400 leading-normal uppercase tracking-widest font-extrabold">
              Bonga Box local reports history log. Clear browser cache to wipe local receipts.
            </p>
          </footer>
        </div>
      )}

    </div>
  );
};

export default HistoryList;
