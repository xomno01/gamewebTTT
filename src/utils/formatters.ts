export function formatNumber(num?: number): string {
    if (num === undefined || num === null) return '0';
    if (num === Infinity) return "Vô Hạn";
    if (num < 1e6) return Math.floor(num).toLocaleString('en-US');
    if (num < 1e9) return (num / 1e6).toFixed(2) + ' Tr';
    if (num < 1e12) return (num / 1e9).toFixed(2) + ' Tỷ';
    if (num < 1e15) return (num / 1e12).toFixed(2) + ' N Tỷ';
    return (num / 1e15).toFixed(2) + ' Tr Tỷ';
}
