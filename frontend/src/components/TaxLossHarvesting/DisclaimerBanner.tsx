import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [expanded, setExpanded] = useState<boolean>(true);

  return (
    <div className="disclaimer-box">
      <div 
        className="disclaimer-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="disclaimer-title-area">
          {/* Info icon with hover tooltip */}
          <div className="tooltip-container" onClick={(e) => e.stopPropagation()}>
            <Info size={18} className="text-green" />
            <div className="tooltip-text">
              Lorem ipsum dolor sit amet consectetur. Euismod id posuere nibh semper mattis scelerisque tellus. Vel mattis diam duis morbi tellus dui consectetur. <span className="how-it-works-link" style={{ fontSize: '12px' }}>Know More</span>
            </div>
          </div>
          <span>Important Notes & Disclaimers</span>
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {expanded && (
        <div className="disclaimer-content">
          <ul>
            <li>Tax-loss harvesting is currently not allowed under Indian tax regulations. Please consult your tax advisor before making any decisions.</li>
            <li>Tax harvesting does not apply to derivatives or futures. These are handled separately as business income under tax rules.</li>
            <li>Price and market value data is fetched from Coingecko, not from individual exchanges. As a result, values may slightly differ from the ones on your exchange.</li>
            <li>Some countries do not have a short-term / long-term bifurcation. For now, we are calculating everything as long-term.</li>
            <li>Only realized losses are considered for harvesting. Unrealized losses in held assets are not counted.</li>
          </ul>
        </div>
      )}
    </div>
  );
};
