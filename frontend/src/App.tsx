import { useState, useEffect } from 'react';
import { 
  TrendingDown, 
  Sparkles,
  GitCompare,
  AlertCircle
} from 'lucide-react';

// Subcomponents
import { DisclaimerBanner } from './components/TaxLossHarvesting/DisclaimerBanner';
import { HarvestingCards } from './components/TaxLossHarvesting/HarvestingCards';
import { HoldingsTable } from './components/TaxLossHarvesting/HoldingsTable';
import { ReconciliationPanel } from './components/Reconciliation/ReconciliationPanel';

interface Holding {
  coin: string;
  coinName: string;
  logo: string;
  currentPrice: number;
  totalHolding: number;
  averageBuyPrice: number;
  stcg: { balance: number; gain: number };
  ltcg: { balance: number; gain: number };
}

interface CapitalGains {
  stcg: { profits: number; losses: number };
  ltcg: { profits: number; losses: number };
}

// Read API URL from frontend environment configuration
const API_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [activeTab, setActiveTab] = useState<'harvesting' | 'reconciliation'>('harvesting');
  
  // Tax Harvesting states
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [preGains, setPreGains] = useState<CapitalGains | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection, Search & View Controls
  const [selectedCoins, setSelectedCoins] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewAll, setViewAll] = useState<boolean>(false);

  // Sorting state
  const [sortField, setSortField] = useState<string>('');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const fetchHarvestingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [holdingsRes, gainsRes] = await Promise.all([
        fetch(`${API_URL}/api/holdings`),
        fetch(`${API_URL}/api/capital-gains`)
      ]);

      if (!holdingsRes.ok || !gainsRes.ok) {
        throw new Error('Failed to load tax loss harvesting data from backend.');
      }

      const holdingsData = await holdingsRes.json();
      const gainsData = await gainsRes.json();

      setHoldings(holdingsData);
      setPreGains(gainsData.capitalGains);
    } catch (e: any) {
      console.error(e);
      setError(`Could not connect to the backend server at ${API_URL || 'origin'}. Please verify the Express backend is running.`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchHarvestingData();
  }, []);

  // Toggle selection for a single coin
  const handleSelectCoin = (coinId: string) => {
    const nextSelected = new Set(selectedCoins);
    if (nextSelected.has(coinId)) {
      nextSelected.delete(coinId);
    } else {
      nextSelected.add(coinId);
    }
    setSelectedCoins(nextSelected);
  };

  // Toggle selection for all visible coins
  const handleSelectAll = (visibleCoins: Holding[]) => {
    const allSelected = visibleCoins.every(c => selectedCoins.has(c.coin + '-' + c.coinName));
    const nextSelected = new Set(selectedCoins);
    
    visibleCoins.forEach(c => {
      const id = c.coin + '-' + c.coinName;
      if (allSelected) {
        nextSelected.delete(id);
      } else {
        nextSelected.add(id);
      }
    });
    
    setSelectedCoins(nextSelected);
  };

  // Sorting handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Format currency values nicely (INR format)
  const formatInr = (value: number) => {
    if (value === undefined || value === null) return '₹0';
    const isNegative = value < 0;
    const absVal = Math.abs(value);
    
    const formatted = absVal.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    });
    
    return `${isNegative ? '-' : ''}₹${formatted}`;
  };

  const formatNumber = (num: number, maxDecimals: number = 6) => {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString('en-IN', {
      maximumFractionDigits: maxDecimals,
      minimumFractionDigits: 0
    });
  };

  // Calculations for Pre and Post Harvesting Cards
  const getTaxCalculations = () => {
    if (!preGains) return null;

    // Pre-harvesting metrics
    const preStcgNet = preGains.stcg.profits - preGains.stcg.losses;
    const preLtcgNet = preGains.ltcg.profits - preGains.ltcg.losses;
    const preRealisedGains = preStcgNet + preLtcgNet;

    // Post-harvesting metrics (initialized to pre-harvesting)
    let postStcgProfits = preGains.stcg.profits;
    let postStcgLosses = preGains.stcg.losses;
    let postLtcgProfits = preGains.ltcg.profits;
    let postLtcgLosses = preGains.ltcg.losses;

    // Adjust based on selected holdings
    holdings.forEach(holding => {
      const id = holding.coin + '-' + holding.coinName;
      if (selectedCoins.has(id)) {
        // Adjust STCG
        if (holding.stcg.gain > 0) {
          postStcgProfits += holding.stcg.gain;
        } else if (holding.stcg.gain < 0) {
          postStcgLosses += Math.abs(holding.stcg.gain);
        }

        // Adjust LTCG
        if (holding.ltcg.gain > 0) {
          postLtcgProfits += holding.ltcg.gain;
        } else if (holding.ltcg.gain < 0) {
          postLtcgLosses += Math.abs(holding.ltcg.gain);
        }
      }
    });

    const postStcgNet = postStcgProfits - postStcgLosses;
    const postLtcgNet = postLtcgProfits - postLtcgLosses;
    const postRealisedGains = postStcgNet + postLtcgNet;

    // Calculate tax savings (30% STCG and 20% LTCG)
    const preStcgTax = preStcgNet > 0 ? preStcgNet * 0.30 : 0;
    const preLtcgTax = preLtcgNet > 0 ? preLtcgNet * 0.20 : 0;
    
    const postStcgTax = postStcgNet > 0 ? postStcgNet * 0.30 : 0;
    const postLtcgTax = postLtcgNet > 0 ? postLtcgNet * 0.20 : 0;

    const totalPreTax = preStcgTax + preLtcgTax;
    const totalPostTax = postStcgTax + postLtcgTax;

    const taxSavings = Math.max(0, totalPreTax - totalPostTax);

    return {
      pre: {
        stcg: { profits: preGains.stcg.profits, losses: preGains.stcg.losses, net: preStcgNet },
        ltcg: { profits: preGains.ltcg.profits, losses: preGains.ltcg.losses, net: preLtcgNet },
        realised: preRealisedGains
      },
      post: {
        stcg: { profits: postStcgProfits, losses: postStcgLosses, net: postStcgNet },
        ltcg: { profits: postLtcgProfits, losses: postLtcgLosses, net: postLtcgNet },
        realised: postRealisedGains
      },
      taxSavings
    };
  };

  const calcs = getTaxCalculations();

  // Filter and sort holdings
  const getProcessedHoldings = () => {
    let result = [...holdings];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(h => 
        h.coin.toLowerCase().includes(q) || 
        h.coinName.toLowerCase().includes(q)
      );
    }

    // Apply sorting
    if (sortField) {
      result.sort((a, b) => {
        let valA: any = a[sortField as keyof Holding];
        let valB: any = b[sortField as keyof Holding];

        if (sortField === 'stcg') {
          valA = a.stcg.gain;
          valB = b.stcg.gain;
        } else if (sortField === 'ltcg') {
          valA = a.ltcg.gain;
          valB = b.ltcg.gain;
        }

        if (valA === undefined || valA === null) valA = 0;
        if (valB === undefined || valB === null) valB = 0;

        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
          return sortAsc ? valA - valB : valB - valA;
        }
      });
    }

    return result;
  };

  const processedHoldings = getProcessedHoldings();
  const visibleHoldings = viewAll ? processedHoldings : processedHoldings.slice(0, 6);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-container">
          <TrendingDown size={28} className="text-green" />
          <h1 className="logo-text">Koin<span className="logo-highlight">X</span></h1>
        </div>

        <nav className="nav-tabs">
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'harvesting' ? 'active' : ''}`}
            onClick={() => setActiveTab('harvesting')}
          >
            <Sparkles size={16} />
            Tax Harvesting
          </button>
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'reconciliation' ? 'active' : ''}`}
            onClick={() => setActiveTab('reconciliation')}
          >
            <GitCompare size={16} />
            Reconciliation Engine
          </button>
        </nav>
      </header>

      {/* Tab Contents */}
      {activeTab === 'harvesting' ? (
        <div className="tax-harvesting-layout">
          {/* Title Row */}
          <div className="page-title-row">
            <h2 className="page-title">
              Tax Loss Harvesting
              <span className="how-it-works-link">How it works?</span>
            </h2>
          </div>

          {/* Collapsible Disclaimer Alert with custom hover tooltip */}
          <DisclaimerBanner />

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Fetching your holdings & gains details...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <AlertCircle size={32} className="text-red" />
              <p className="error-title">{error}</p>
              <button type="button" className="retry-btn" onClick={fetchHarvestingData}>
                Retry Loading
              </button>
            </div>
          ) : calcs && (
            <>
              {/* Pre & After Harvesting comparative Cards */}
              <HarvestingCards calcs={calcs} formatInr={formatInr} />

              {/* Asset Holdings Table */}
              <HoldingsTable 
                visibleHoldings={visibleHoldings}
                allFilteredHoldings={processedHoldings}
                selectedCoins={selectedCoins}
                handleSelectCoin={handleSelectCoin}
                handleSelectAll={handleSelectAll}
                formatInr={formatInr}
                formatNumber={formatNumber}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                viewAll={viewAll}
                setViewAll={setViewAll}
                handleSort={handleSort}
              />
            </>
          )}
        </div>
      ) : (
        <ReconciliationPanel />
      )}
    </div>
  );
}

export default App;
