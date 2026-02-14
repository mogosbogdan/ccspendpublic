import type { PaymentsByMonth, TableRow } from '../types';
import { formatRon, TABLE_COLUMN_COUNT } from '../helpers';

interface InstallmentsTableProps {
  rows: TableRow[];
  payments: PaymentsByMonth;
}

function getVisibleRows(rows: TableRow[]): TableRow[] {
  return rows.filter(
    (row, index) =>
      row.isFirstRow ||
      index === 0 ||
      rows[index - 1].rowMonth !== row.rowMonth
  );
}

function shouldShowMonth(visibleRows: TableRow[], rowIndex: number): boolean {
  return (
    rowIndex === 0 ||
    visibleRows[rowIndex - 1].rowMonth !== visibleRows[rowIndex].rowMonth
  );
}

function displayedPaymentForMonth(
  payments: PaymentsByMonth,
  rowMonth: string,
  showMonth: boolean
): string {
  const totalPaidThisMonth = payments[rowMonth] ?? 0;
  if (!showMonth || totalPaidThisMonth <= 0) {
    return '';
  }
  return formatRon(totalPaidThisMonth);
}

export function InstallmentsTable({ rows, payments }: InstallmentsTableProps) {
  const visibleRows = getVisibleRows(rows);

  return (
    <section className="table-section">
      <h2>Installments table</h2>
      <div className="table-wrap">
        <table className="main-table">
          <thead>
            <tr>
              <th>Purchase name</th>
              <th>Amount (RON)</th>
              <th>Month and year</th>
              <th>Amount paid (RON)</th>
              <th>Projected monthly (RON)</th>
              <th>Installments</th>
              <th>Amount left (RON)</th>
              <th>Months passed</th>
              <th>Months left</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMN_COUNT}>
                  No purchases yet. Add a purchase above.
                </td>
              </tr>
            ) : (
              visibleRows.map((row, index) => {
                const showMonth = shouldShowMonth(visibleRows, index);
                const paymentValue = displayedPaymentForMonth(
                  payments,
                  row.rowMonth,
                  showMonth
                );

                return (
                  <tr key={`${row.purchaseId}-${row.rowMonth}-${index}`}>
                    <td>{row.isFirstRow ? row.purchaseName : ''}</td>
                    <td className="num">{row.isFirstRow ? formatRon(row.amount) : ''}</td>
                    <td>{showMonth ? row.monthYear : ''}</td>
                    <td className="num">{paymentValue}</td>
                    <td className="num">
                      {showMonth ? formatRon(row.projectedMonthlyPayment) : ''}
                    </td>
                    <td className="num">{row.isFirstRow ? row.installments : ''}</td>
                    <td className="num">{row.isFirstRow ? formatRon(row.amountLeft) : ''}</td>
                    <td className="num">{row.isFirstRow ? row.monthsPassed : ''}</td>
                    <td className="num">{row.isFirstRow ? row.monthsLeft : ''}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
