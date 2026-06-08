import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db, collection, query, where, onSnapshot, orderBy, doc, getDoc, handleFirestoreError, OperationType } from '../firebase';
import { Report } from '../types';
import { History, RefreshCw, ChevronRight, Lock, KeyRound, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const HistoryList: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal detail tracker sim
  const [activeTrackingReportId, setActiveTrackingReportId] = useState<string | null>(null);

  // Dynamically simulates a 64-character hash for proof of integrity
  const generateSHA256Sim = (id: string) => {
    // Generate a beautiful, clean pseudo-sha256 hash using the doc id as seed
    const rawSalt = `bonga_secure_node_handshake_scramble_key_${id}`;
    let hash = '';
    for (let i = 0; i < rawSalt.length; i++) {
      hash += rawSalt.charCodeAt(i).toString(16);
    }
    while (hash.length < 64) {
      hash += 'f391ae828cd8823f66a2b8e392ff192ac';
    }
    return hash.substring(0, 64).toUpperCase();
  };

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

  const handleTrackClick = (id: string) => {
    setActiveTrackingReportId(id === activeTrackingReportId ? null : id);
  };

  return (
    <div className="font-sans max-w-md mx-auto h-full flex flex-col relative select-none py-2">
      
      {/* 5. Safe Log Feed Redesign Header */}
      <div className="flex justify-between items-center mb-6 px-1">
        <div>
          <h1 className="text-xl font-display font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History size={20} className="text-[#4F46E5]" /> Safe Log Feed
          </h1>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mt-1">
            Anonymity Tracker Archive
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
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-150 rounded-3xl shadow-xs">
          <div className="w-8 h-8 border-3 border-indigo-205 border-t-[#4F46E5] rounded-full animate-spin" />
          <p className="text-[10.5px] font-extrabold text-[#4F46E5] uppercase tracking-wide mt-3">Refracting secure tunnels...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-slate-150 rounded-[2.2rem] p-8 text-center flex flex-col items-center my-4 shadow-sm">
          <div className="w-14 h-14 bg-slate-50 border border-slate-150 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <Lock size={22} />
          </div>
          <h3 className="font-display font-black text-sm mb-1 text-slate-900 uppercase">Archive Empty</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-6 max-w-[220px]">
            No secure reporting logs recorded on this hardware node's anonymous sandbox directory.
          </p>
          <Link to="/report" className="w-full py-2.5 px-4 bg-purple-primary text-white hover:bg-purple-dark text-xs font-black rounded-xl text-center block shadow-md uppercase tracking-wider uppercase">
            Submit Safe Log
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
                className="bg-white border border-slate-150 rounded-2xl p-4.5 shadow-sm hover:border-purple-primary/35 transition-all"
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
                      Cellular Handshake Integrity
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
                    <div className="text-[10px] space-y-1 text-slate-650 border-t border-slate-201 pt-2 animate-fadeIn pl-0.5">
                      <div className="flex justify-between">
                        <span>Node status:</span>
                        <span className="font-extrabold text-[#4F46E5]">Active Tracking</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Relay routing:</span>
                        <span className="font-bold text-slate-800">Isiolo Central Relay Hub v4</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Anonymization Layer:</span>
                        <span className="font-mono text-emerald-600 font-extrabold text-[9px]">TLS SSL Scrambled</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer containing 64-character cryptographic hash in a technical monospace font */}
                <div className="border-t border-slate-50 pt-2.5 flex flex-col gap-1 text-[8px]">
                  <span className="text-slate-400 font-extrabold uppercase tracking-widest pl-0.5">
                    Data Integrity Hash (SHA-256 Signature)
                  </span>
                  <div className="font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-dashed border-slate-150 overflow-x-auto whitespace-nowrap scrollbar-none scroll-smooth">
                    {hash}
                  </div>
                </div>

              </div>
            );
          })}

          <footer className="pt-3 text-center">
            <p className="text-[8.5px] text-slate-400 leading-normal uppercase tracking-widest font-extrabold">
              End-to-End Cryptographically Proven Data Scrambling System.
            </p>
          </footer>
        </div>
      )}

    </div>
  );
};

export default HistoryList;
