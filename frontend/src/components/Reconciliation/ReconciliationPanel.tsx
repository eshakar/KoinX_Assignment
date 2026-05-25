import React, { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  Info
} from 'lucide-react';

interface RunSummary {
  runId: string;
  timestamp: string;
  config: {
    timestampToleranceSeconds: number;
    quantityTolerancePct: number;
  };
  summary: {
    matched: number;
    conflicting: number;
    unmatchedUser: number;
    unmatchedExchange: number;
    dataQualityIssues: number;
  };
}

interface Transaction {
  transaction_id: string;
  timestamp: string;
  type: string;
  asset: string;
  quantity: number;
  price_usd: number;
  fee: number;
  note: string;
  isValid: boolean;
  validationError?: string;
}

interface ReportItem {
  _id?: string;
  category: string;
  reason: string;
  userTransaction?: Transaction;
  exchangeTransaction?: Transaction;
}

// Read API base URL from frontend environment configuration
const API_URL = import.meta.env.VITE_API_URL || '';

export const ReconciliationPanel: React.FC = () => {
  // Config state
  const [timestampTolerance, setTimestampTolerance] = useState<number>(300);
  const [quantityTolerance, setQuantityTolerance] = useState<number>(0.01);
  
  // App state
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [activeRun, setActiveRun] = useState<RunSummary | null>(null);
  
  // Loading & Error states
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [reconciling, setReconciling] = useState<boolean>(false);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Tab details state
  const [activeSubTab, setActiveSubTab] = useState<string>('all');
  const [allReportItems, setAllReportItems] = useState<ReportItem[]>([]);
  const [qualityIssues, setQualityIssues] = useState<{ user: Transaction[]; exchange: Transaction[] }>({ user: [], exchange: [] });

  // Fetch runs history on mount
  useEffect(() => {
    fetchRunsHistory();
  }, []);

  // Fetch run details when selected run changes
  useEffect(() => {
    if (selectedRunId) {
      fetchRunDetails(selectedRunId);
    } else {
      setActiveRun(null);
      setAllReportItems([]);
      setQualityIssues({ user: [], exchange: [] });
    }
  }, [selectedRunId]);

  const fetchRunsHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`${API_URL}/api/runs`);
      if (!response.ok) throw new Error('Failed to fetch runs history');
      const data = await response.json();
      setRuns(data);
      if (data.length > 0 && !selectedRunId) {
        setSelectedRunId(data[0].runId);
      }
    } catch (e: any) {
      console.error(e);
      setError(`Could not connect to the backend server at ${API_URL || 'origin'}. Please verify the Express backend is running.`);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchRunDetails = async (runId: string) => {
    setLoadingDetails(true);
    try {
      // 1. Fetch summary
      const sumResponse = await fetch(`${API_URL}/report/${runId}/summary`);
      if (!sumResponse.ok) throw new Error('Failed to fetch run summary');
      const sumData = await sumResponse.json();
      setActiveRun(sumData);

      // 2. Fetch full items
      const reportResponse = await fetch(`${API_URL}/report/${runId}`);
      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        setAllReportItems(reportData.items || []);
      } else {
        setAllReportItems([]);
      }

      // 3. Fetch unmatched & quality issues
      const unmatchedResponse = await fetch(`${API_URL}/report/${runId}/unmatched`);
      if (unmatchedResponse.ok) {
        const unmatchedData = await unmatchedResponse.json();
        setQualityIssues(unmatchedData.dataQualityIssues || { user: [], exchange: [] });
      } else {
        setQualityIssues({ user: [], exchange: [] });
      }
    } catch (e: any) {
      console.error(e);
      setError('Failed to load run details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleReconcile = async () => {
    setReconciling(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/reconcile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          TIMESTAMP_TOLERANCE_SECONDS: timestampTolerance,
          QUANTITY_TOLERANCE_PCT: quantityTolerance
        })
      });
      if (!response.ok) throw new Error('Reconciliation run failed.');
      const data = await response.json();
      
      // Refresh history list and select new run
      await fetchRunsHistory();
      setSelectedRunId(data.runId);
    } catch (e: any) {
      console.error(e);
      setError('Reconciliation request failed. Please check backend logs.');
    } finally {
      setReconciling(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!selectedRunId) return;
    window.open(`${API_URL}/report/${selectedRunId}?format=csv`, '_blank');
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '-';
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return isoStr;
      return date.toLocaleString();
    } catch (e) {
      return isoStr;
    }
  };

  const formatUsd = (num: number) => {
    if (num === undefined || num === null || isNaN(num) || num === 0) return '-';
    return '$' + Number(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };


  // Filter report items based on selected tab
  const getFilteredItems = () => {
    switch (activeSubTab) {
      case 'matched':
        return allReportItems.filter(item => item.category === 'Matched');
      case 'conflicting':
        return allReportItems.filter(item => item.category === 'Conflicting');
      case 'unmatched-user':
        return allReportItems.filter(item => item.category === 'Unmatched (User only)');
      case 'unmatched-exchange':
        return allReportItems.filter(item => item.category === 'Unmatched (Exchange only)');
      case 'all':
      default:
        return allReportItems;
    }
  };

  return (
    <div className="reconciliation-layout">
      {/* Control Panel */}
      <div className="reconcile-ctrl-panel">
        <h3 className="panel-title">
          <Play size={18} className="text-green" />
          Reconciliation Engine Controls
        </h3>
        
        <div className="config-form">
          <div className="form-group">
            <label htmlFor="time-tolerance">Timestamp Tolerance (Seconds)</label>
            <input 
              id="time-tolerance"
              type="number" 
              className="form-input" 
              value={timestampTolerance} 
              onChange={(e) => setTimestampTolerance(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="qty-tolerance">Quantity Tolerance (%)</label>
            <input 
              id="qty-tolerance"
              type="number" 
              step="0.001"
              className="form-input" 
              value={quantityTolerance * 100} 
              onChange={(e) => setQuantityTolerance(Math.max(0, parseFloat(e.target.value) || 0) / 100)}
            />
          </div>

          <button 
            type="button" 
            className="action-btn" 
            onClick={handleReconcile}
            disabled={reconciling}
          >
            {reconciling ? (
              <>
                <RefreshCw size={16} className="spinner" />
                Reconciling...
              </>
            ) : (
              <>
                <Play size={16} />
                Run Reconciliation
              </>
            )}
          </button>
          
          {runs.length > 0 && (
            <div className="run-selector-group">
              <label htmlFor="run-history">Select Reconciliation Run</label>
              <select 
                id="run-history"
                className="form-select"
                value={selectedRunId}
                onChange={(e) => setSelectedRunId(e.target.value)}
              >
                {runs.map((r) => (
                  <option key={r.runId} value={r.runId}>
                    {r.runId} ({new Date(r.timestamp).toLocaleDateString()} - Matched: {r.summary.matched})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            className="action-btn secondary"
            onClick={fetchRunsHistory}
            disabled={loadingHistory}
            title="Refresh runs history"
          >
            <RefreshCw size={16} className={loadingHistory ? 'spinner' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="error-container">
          <AlertCircle size={32} className="text-red" />
          <p className="error-title">{error}</p>
          <button type="button" className="retry-btn" onClick={fetchRunsHistory}>
            Retry Connection
          </button>
        </div>
      )}

      {/* Selected Run Details */}
      {activeRun && !loadingDetails && (
        <>
          {/* Summary Row */}
          <div className="metrics-row">
            <div className="metric-card">
              <div className="metric-icon-wrapper matched">
                <CheckCircle2 size={24} />
              </div>
              <div className="metric-details">
                <span className="metric-val">{activeRun.summary.matched}</span>
                <span className="metric-label">Matched</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrapper conflicting">
                <AlertTriangle size={24} />
              </div>
              <div className="metric-details">
                <span className="metric-val">{activeRun.summary.conflicting}</span>
                <span className="metric-label">Conflicting</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrapper unmatched">
                <AlertCircle size={24} />
              </div>
              <div className="metric-details">
                <span className="metric-val">{activeRun.summary.unmatchedUser}</span>
                <span className="metric-label">Unmatched (User)</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrapper unmatched">
                <AlertCircle size={24} />
              </div>
              <div className="metric-details">
                <span className="metric-val">{activeRun.summary.unmatchedExchange}</span>
                <span className="metric-label">Unmatched (Exch)</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrapper issues">
                <FileSpreadsheet size={24} />
              </div>
              <div className="metric-details">
                <span className="metric-val">{activeRun.summary.dataQualityIssues}</span>
                <span className="metric-label">Data Issues</span>
              </div>
            </div>
          </div>

          {/* Details Tables Card */}
          <div className="details-card">
            <div className="details-header">
              <h3 className="details-title">Reconciliation Results Detail</h3>
              <button 
                type="button" 
                className="action-btn secondary" 
                onClick={handleDownloadCsv}
                disabled={allReportItems.length === 0}
              >
                <Download size={16} />
                Download CSV Report
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="category-tabs">
              <button 
                type="button" 
                className={`category-tab-btn ${activeSubTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('all')}
              >
                All Pairs ({allReportItems.length})
              </button>
              <button 
                type="button" 
                className={`category-tab-btn ${activeSubTab === 'matched' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('matched')}
              >
                Matched ({activeRun.summary.matched})
              </button>
              <button 
                type="button" 
                className={`category-tab-btn ${activeSubTab === 'conflicting' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('conflicting')}
              >
                Conflicts ({activeRun.summary.conflicting})
              </button>
              <button 
                type="button" 
                className={`category-tab-btn ${activeSubTab === 'unmatched-user' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('unmatched-user')}
              >
                User Only ({activeRun.summary.unmatchedUser})
              </button>
              <button 
                type="button" 
                className={`category-tab-btn ${activeSubTab === 'unmatched-exchange' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('unmatched-exchange')}
              >
                Exchange Only ({activeRun.summary.unmatchedExchange})
              </button>
              <button 
                type="button" 
                className={`category-tab-btn ${activeSubTab === 'quality-issues' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('quality-issues')}
              >
                Data Issues ({activeRun.summary.dataQualityIssues})
              </button>
            </div>

            {/* Tab content */}
            {activeSubTab !== 'quality-issues' && (
              <div className="table-container">
                {getFilteredItems().length === 0 ? (
                  <div className="empty-state">
                    <Info size={32} />
                    <p>No reconciliation records fit this category.</p>
                  </div>
                ) : (
                  <table className="holdings-table">
                    <thead>
                      <tr>
                        <th style={{ width: '120px' }}>Category</th>
                        <th>User Tx details</th>
                        <th>Exchange Tx details</th>
                        <th>Matching Notes / Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredItems().map((item, idx) => {
                        const badgeClass = item.category === 'Matched' 
                          ? 'matched' 
                          : item.category === 'Conflicting' 
                          ? 'conflicting' 
                          : item.category.includes('User') 
                          ? 'unmatched-user' 
                          : 'unmatched-exchange';
                        
                        return (
                          <tr key={item._id || idx}>
                            <td>
                              <span className={`badge ${badgeClass}`}>{item.category}</span>
                            </td>
                            <td>
                              {item.userTransaction ? (
                                <div className="holdings-cell">
                                  <span className="holding-amount">
                                    {item.userTransaction.transaction_id} (<strong>{item.userTransaction.type}</strong>)
                                  </span>
                                  <span className="holding-value">
                                    {item.userTransaction.quantity} {item.userTransaction.asset} @ {formatUsd(item.userTransaction.price_usd)}
                                  </span>
                                  <span className="holding-value text-secondary" style={{ fontSize: '10px' }}>
                                    {formatDate(item.userTransaction.timestamp)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-secondary">- Not Found -</span>
                              )}
                            </td>
                            <td>
                              {item.exchangeTransaction ? (
                                <div className="holdings-cell">
                                  <span className="holding-amount">
                                    {item.exchangeTransaction.transaction_id} (<strong>{item.exchangeTransaction.type}</strong>)
                                  </span>
                                  <span className="holding-value">
                                    {item.exchangeTransaction.quantity} {item.exchangeTransaction.asset} @ {formatUsd(item.exchangeTransaction.price_usd)}
                                  </span>
                                  <span className="holding-value text-secondary" style={{ fontSize: '10px' }}>
                                    {formatDate(item.exchangeTransaction.timestamp)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-secondary">- Not Found -</span>
                              )}
                            </td>
                            <td>
                              <span className="holding-value text-primary">{item.reason}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Quality Issues Tab */}
            {activeSubTab === 'quality-issues' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="table-container">
                  <div className="holdings-title" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', fontSize: '14px' }}>
                    User Transactions - Flagged Data Quality Issues ({qualityIssues.user.length})
                  </div>
                  {qualityIssues.user.length === 0 ? (
                    <div className="empty-state">
                      <CheckCircle2 size={32} className="text-green" />
                      <p>All user transaction rows were clean!</p>
                    </div>
                  ) : (
                    <table className="holdings-table">
                      <thead>
                        <tr>
                          <th>Row ID / ID</th>
                          <th>Timestamp</th>
                          <th>Asset</th>
                          <th>Quantity</th>
                          <th>Price USD</th>
                          <th>Flagged Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {qualityIssues.user.map((tx, idx) => (
                          <tr key={idx} className="text-red">
                            <td>{tx.transaction_id || `Row ${idx + 1}`}</td>
                            <td style={{ fontSize: '12px' }}>{tx.timestamp}</td>
                            <td>{tx.asset}</td>
                            <td>{tx.quantity}</td>
                            <td>{formatUsd(tx.price_usd)}</td>
                            <td style={{ fontWeight: '500' }}>
                              <span className="badge invalid">{tx.validationError}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="table-container">
                  <div className="holdings-title" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', fontSize: '14px' }}>
                    Exchange Transactions - Flagged Data Quality Issues ({qualityIssues.exchange.length})
                  </div>
                  {qualityIssues.exchange.length === 0 ? (
                    <div className="empty-state">
                      <CheckCircle2 size={32} className="text-green" />
                      <p>All exchange transaction rows were clean!</p>
                    </div>
                  ) : (
                    <table className="holdings-table">
                      <thead>
                        <tr>
                          <th>Row ID / ID</th>
                          <th>Timestamp</th>
                          <th>Asset</th>
                          <th>Quantity</th>
                          <th>Price USD</th>
                          <th>Flagged Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {qualityIssues.exchange.map((tx, idx) => (
                          <tr key={idx} className="text-red">
                            <td>{tx.transaction_id || `Row ${idx + 1}`}</td>
                            <td style={{ fontSize: '12px' }}>{tx.timestamp}</td>
                            <td>{tx.asset}</td>
                            <td>{tx.quantity}</td>
                            <td>{formatUsd(tx.price_usd)}</td>
                            <td style={{ fontWeight: '500' }}>
                              <span className="badge invalid">{tx.validationError}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {loadingDetails && (
        <div className="loading-container">
          <RefreshCw size={32} className="spinner" />
          <p>Loading run details...</p>
        </div>
      )}
    </div>
  );
};
