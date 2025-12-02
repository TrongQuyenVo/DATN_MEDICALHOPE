// src/lib/money.ts   ← TÊN FILE QUAN TRỌNG, DÙNG CHUNG TOÀN BỘ DỰ ÁN
export const formatMoney = (amount: number | null | undefined): string => {
  if (!amount || amount <= 0) return '0 VNĐ';

  if (amount >= 1_000_000_000) {
    const b = (amount / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '');
    return `${b.replace('.', ',')} tỷ VNĐ`;
  }
  if (amount >= 1_000_000) {
    const m = (amount / 1_000_000).toFixed(1).replace('.0', '');
    return `${m} triệu VNĐ`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1000)} ngàn VNĐ`;
  }
  return `${amount.toLocaleString('vi-VN')} VNĐ`;
};

export const formatMoneyShort = (amount: number | null | undefined): string => {
  if (!amount || amount <= 0) return '0';

  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1).replace('.0', '')} tỷ`;
  }
  if (amount >= 1_000_000) {
    return `${Math.round(amount / 1_000_000)}M`;
  }
  return amount.toLocaleString('vi-VN');
};