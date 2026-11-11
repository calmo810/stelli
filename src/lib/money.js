/** One way to write money on the creator side. */
export default function money(value) {
  const amount = Number(value) || 0;
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}