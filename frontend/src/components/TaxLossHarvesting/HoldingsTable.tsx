import React from 'react';
import { Search, ArrowUpDown, Info } from 'lucide-react';

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

interface HoldingsTableProps {
  visibleHoldings: Holding[];
  allFilteredHoldings: Holding[];
  selectedCoins: Set<string>;
  handleSelectCoin: (coinId: string) => void;
  handleSelectAll: (visibleCoins: Holding[]) => void;
  formatInr: (value: number) => string;
  formatNumber: (num: number, decimals?: number) => string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewAll: boolean;
  setViewAll: (val: boolean) => void;
  handleSort: (field: string) => void;
}

export const HoldingsTable: React.FC<HoldingsTableProps> = ({
  visibleHoldings,
  allFilteredHoldings,
  selectedCoins,
  handleSelectCoin,
  handleSelectAll,
  formatInr,
  formatNumber,
  searchQuery,
  setSearchQuery,
  viewAll,
  setViewAll,
  handleSort
}) => {
  const isAllChecked = visibleHoldings.length > 0 && 
    visibleHoldings.every(c => selectedCoins.has(c.coin + '-' + c.coinName));

  return (
    <div>
      <div className="holdings-header-row">
        <h3 className="holdings-title">Holdings</h3>
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search asset..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container" style={{ marginTop: '16px' }}>
        <table className="holdings-table">
          <thead>
            <tr>
              <th className="checkbox-cell">
                <div 
                  className={`custom-checkbox ${isAllChecked ? 'checked' : ''}`}
                  onClick={() => handleSelectAll(visibleHoldings)}
                >
                  {isAllChecked && '✓'}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('coin')}>
                Asset <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
              </th>
              <th>Holdings / Buy Price</th>
              <th className="sortable" onClick={() => handleSort('currentPrice')}>
                Current Price <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
              </th>
              <th className="sortable" onClick={() => handleSort('stcg')}>
                Short-Term Gain <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
              </th>
              <th className="sortable" onClick={() => handleSort('ltcg')}>
                Long-Term Gain <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
              </th>
              <th>Amount to Sell</th>
            </tr>
          </thead>
          <tbody>
            {visibleHoldings.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  <Info size={32} />
                  <p>No holdings found matching your criteria.</p>
                </td>
              </tr>
            ) : (
              visibleHoldings.map((h) => {
                const coinId = h.coin + '-' + h.coinName;
                const isSelected = selectedCoins.has(coinId);
                
                return (
                  <tr key={coinId} className={isSelected ? 'selected' : ''}>
                    <td className="checkbox-cell">
                      <div 
                        className={`custom-checkbox ${isSelected ? 'checked' : ''}`}
                        onClick={() => handleSelectCoin(coinId)}
                      >
                        {isSelected && '✓'}
                      </div>
                    </td>
                    <td>
                      <div className="asset-cell">
                        <img src={h.logo} alt={h.coin} className="asset-logo" />
                        <div className="asset-details">
                          <span className="asset-name">{h.coinName}</span>
                          <span className="asset-symbol">{h.coin}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="holdings-cell">
                        <span className="holding-amount">
                          {formatNumber(h.totalHolding)} {h.coin}
                        </span>
                        <span className="holding-value">
                          Avg: {formatInr(h.averageBuyPrice)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="holding-amount">{formatInr(h.currentPrice)}</span>
                    </td>
                    <td>
                      <div className="gain-cell">
                        <span className={`gain-value ${h.stcg.gain > 0 ? 'positive' : h.stcg.gain < 0 ? 'negative' : ''}`}>
                          {h.stcg.gain > 0 ? '+' : ''}{formatInr(h.stcg.gain)}
                        </span>
                        <span className="gain-balance">
                          {formatNumber(h.stcg.balance)} {h.coin}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="gain-cell">
                        <span className={`gain-value ${h.ltcg.gain > 0 ? 'positive' : h.ltcg.gain < 0 ? 'negative' : ''}`}>
                          {h.ltcg.gain > 0 ? '+' : ''}{formatInr(h.ltcg.gain)}
                        </span>
                        <span className="gain-balance">
                          {formatNumber(h.ltcg.balance)} {h.coin}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: isSelected ? '600' : 'normal' }}>
                        {isSelected ? `${formatNumber(h.totalHolding)} ${h.coin}` : '-'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {allFilteredHoldings.length > 6 && (
        <button 
          type="button" 
          className="view-all-btn"
          onClick={() => setViewAll(!viewAll)}
        >
          {viewAll ? 'View Less' : 'View All'}
        </button>
      )}
    </div>
  );
};
