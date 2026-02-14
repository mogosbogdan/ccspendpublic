import { formatRon } from '../helpers';

interface SummaryHeaderProps {
  creditLimit: number;
  totalRemaining: number;
  available: number;
}

export function SummaryHeader({
  creditLimit,
  totalRemaining,
  available,
}: SummaryHeaderProps) {
  return (
    <header className="header">
      <h1>Credit Card Spending Tracker</h1>
      <div className="summary">
        <span>
          Limit: <strong>{formatRon(creditLimit)} RON</strong>
        </span>
        <span>
          Remaining debt: <strong>{formatRon(totalRemaining)} RON</strong>
        </span>
        <span>
          Available: <strong>{formatRon(available)} RON</strong>
        </span>
      </div>
    </header>
  );
}
