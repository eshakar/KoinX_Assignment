import React from 'react';
import { Sparkles } from 'lucide-react';

interface GainsData {
  stcg: { profits: number; losses: number; net: number };
  ltcg: { profits: number; losses: number; net: number };
  realised: number;
}

interface HarvestingCardsProps {
  calcs: {
    pre: GainsData;
    post: GainsData;
    taxSavings: number;
  };
  formatInr: (value: number) => string;
}

export const HarvestingCards: React.FC<HarvestingCardsProps> = ({ calcs, formatInr }) => {
  return (
    <div className="cards-grid">
      {/* Pre Harvesting Card */}
      <div className="harvesting-card pre">
        <div>
          <h3 className="card-title">Pre Harvesting</h3>
          <table className="card-table">
            <thead>
              <tr>
                <th>Capital Gains</th>
                <th>Short-term</th>
                <th>Long-term</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="card-label">Profits</td>
                <td className="card-val">{formatInr(calcs.pre.stcg.profits)}</td>
                <td className="card-val">{formatInr(calcs.pre.ltcg.profits)}</td>
              </tr>
              <tr>
                <td className="card-label">Losses</td>
                <td className="card-val text-red">-{formatInr(calcs.pre.stcg.losses).replace('-', '')}</td>
                <td className="card-val text-red">-{formatInr(calcs.pre.ltcg.losses).replace('-', '')}</td>
              </tr>
              <tr>
                <td className="card-label" style={{ fontWeight: '600' }}>Net Capital Gains</td>
                <td className="card-val" style={{ fontWeight: '600' }}>{formatInr(calcs.pre.stcg.net)}</td>
                <td className="card-val" style={{ fontWeight: '600' }}>{formatInr(calcs.pre.ltcg.net)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card-footer">
          <div className="footer-row">
            <span className="footer-label">Realised Capital Gains:</span>
            <span className="footer-val">{formatInr(calcs.pre.realised)}</span>
          </div>
        </div>
      </div>

      {/* After Harvesting Card */}
      <div className="harvesting-card post">
        <div>
          <h3 className="card-title">After Harvesting</h3>
          <table className="card-table">
            <thead>
              <tr>
                <th>Capital Gains</th>
                <th>Short-term</th>
                <th>Long-term</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="card-label">Profits</td>
                <td className="card-val">{formatInr(calcs.post.stcg.profits)}</td>
                <td className="card-val">{formatInr(calcs.post.ltcg.profits)}</td>
              </tr>
              <tr>
                <td className="card-label">Losses</td>
                <td className="card-val text-white" style={{ opacity: 0.9 }}>
                  -{formatInr(calcs.post.stcg.losses).replace('-', '')}
                </td>
                <td className="card-val text-white" style={{ opacity: 0.9 }}>
                  -{formatInr(calcs.post.ltcg.losses).replace('-', '')}
                </td>
              </tr>
              <tr>
                <td className="card-label" style={{ fontWeight: '700' }}>Net Capital Gains</td>
                <td className="card-val" style={{ fontWeight: '700' }}>{formatInr(calcs.post.stcg.net)}</td>
                <td className="card-val" style={{ fontWeight: '700' }}>{formatInr(calcs.post.ltcg.net)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card-footer">
          <div className="footer-row">
            <span className="footer-label">Effective Capital Gains:</span>
            <span className="footer-val">{formatInr(calcs.post.realised)}</span>
          </div>
          {calcs.taxSavings > 0 && (
            <div className="footer-row" style={{ marginTop: '8px' }}>
              <div className="savings-badge">
                <Sparkles size={14} />
                <span>You are going to save upto {formatInr(calcs.taxSavings)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
