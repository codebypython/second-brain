import { useState, useEffect } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../store/db';
import { useAppContext } from '../AppContext';
import { getTodayStr } from '../store/dateUtils';
import logger from '../store/logger';

const MODULE = 'ExpensesPage';

const ACCOUNTS = [
  { id: 'cash', label: 'Tiền mặt 💵', labelEn: 'Cash 💵' },
  { id: 'vietcombank', label: 'Vietcombank 💳', labelEn: 'Vietcombank 💳' },
  { id: 'momo', label: 'Ví MoMo 🍑', labelEn: 'Ví MoMo 🍑' },
  { id: 'zalopay', label: 'Ví ZaloPay 💚', labelEn: 'Ví ZaloPay 💚' }
];

const defaultBudgets = {
  food: 2000000,
  rent: 2500000,
  travel: 500000,
  study: 1000000,
  entertainment: 1000000,
  other: 1000000
};

export default function Expenses() {
  const { t, timezone, profile, setProfile } = useAppContext();
  const lang = profile?.language || 'vi';

  // Local Translations
  const localT = (key) => {
    const dict = {
      vi: {
        'expenses.tab.transactions': 'Giao dịch 💸',
        'expenses.tab.invoice': 'Tạo Hóa đơn 🧾',
        'expenses.tab.forecast': 'Dự báo & Ngân sách 📊',
        'expenses.wallet.title': 'Ví liên kết (Ledger)',
        'expenses.wallet.desc': 'Số dư khả dụng hiện tại trong các ví',
        'expenses.form.account': 'Tài khoản/Ví',
        'expenses.budget.category': 'Hạn mức ngân sách danh mục',
        'expenses.budget.setLimit': 'Cài đặt hạn mức',
        'expenses.forecast.title': 'Dự báo Dòng tiền 30 ngày tới',
        'expenses.forecast.avgDaily': 'Chi tiêu trung bình ngày:',
        'expenses.forecast.projected': 'Dự phóng chi tiêu 30 ngày:',
        'expenses.forecast.balance': 'Dự báo số dư khả dụng:',
        'expenses.forecast.recommendation': 'Khuyến nghị tài chính (Smart AI):',
        'invoice.title': 'Bộ tạo Hóa đơn Thanh toán',
        'invoice.client': 'Khách hàng / Doanh nghiệp nhận',
        'invoice.code': 'Mã hóa đơn',
        'invoice.issue': 'Ngày phát hành',
        'invoice.due': 'Hạn thanh toán',
        'invoice.desc': 'Tên sản phẩm / Dịch vụ',
        'invoice.qty': 'SL',
        'invoice.price': 'Đơn giá',
        'invoice.add': '+ Thêm dòng',
        'invoice.subtotal': 'Tạm tính',
        'invoice.tax': 'Thuế VAT',
        'invoice.total': 'Tổng cộng hóa đơn',
        'invoice.notes': 'Ghi chú hóa đơn',
        'invoice.print': '🖨️ In Hóa đơn / Xuất PDF',
        'invoice.preview': 'Xem trước hóa đơn (Preview)',
        'invoice.seller': 'ĐƠN VỊ CUNG CẤP'
      },
      en: {
        'expenses.tab.transactions': 'Transactions 💸',
        'expenses.tab.invoice': 'Invoice Generator 🧾',
        'expenses.tab.forecast': 'Forecast & Budget 📊',
        'expenses.wallet.title': 'Linked Wallets (Ledger)',
        'expenses.wallet.desc': 'Available balances across accounts',
        'expenses.form.account': 'Account / Wallet',
        'expenses.budget.category': 'Category Budget Limits',
        'expenses.budget.setLimit': 'Configure Limits',
        'expenses.forecast.title': '30-Day Cash Flow Forecast',
        'expenses.forecast.avgDaily': 'Avg Daily Spending:',
        'expenses.forecast.projected': 'Projected 30-Day Spend:',
        'expenses.forecast.balance': 'Projected Ending Balance:',
        'expenses.forecast.recommendation': 'Financial Advice (Smart AI):',
        'invoice.title': 'Payment Invoice Generator',
        'invoice.client': 'Client Name / Business Name',
        'invoice.code': 'Invoice Code',
        'invoice.issue': 'Issue Date',
        'invoice.due': 'Due Date',
        'invoice.desc': 'Description / Item Name',
        'invoice.qty': 'Qty',
        'invoice.price': 'Unit Price',
        'invoice.add': '+ Add Item',
        'invoice.subtotal': 'Subtotal',
        'invoice.tax': 'VAT Tax',
        'invoice.total': 'Total Invoice',
        'invoice.notes': 'Invoice Notes',
        'invoice.print': '🖨️ Print Invoice / PDF',
        'invoice.preview': 'Invoice Preview',
        'invoice.seller': 'SERVICE PROVIDER'
      }
    };
    return dict[lang]?.[key] || dict['vi']?.[key] || key;
  };

  const [activeTab, setActiveTab] = useState('transactions');

  // Multi-wallet Balances & Month Transactions
  const [expenses, setExpenses] = useState([]);
  const [allTimeExpenses, setAllTimeExpenses] = useState([]);
  const [month, setMonth] = useState(getTodayStr(timezone).slice(0, 7)); // YYYY-MM
  const [editingExpense, setEditingExpense] = useState(null); // 'new' or expense object
  const [form, setForm] = useState({
    amount: '',
    type: 'expense',
    category: 'food',
    date: getTodayStr(timezone),
    description: '',
    account: 'cash'
  });

  const budgetLimit = profile?.budgetLimit || 3000000;
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budgetLimit);

  // Category Budgets state
  const [catBudgets, setCatBudgets] = useState(() => {
    if (profile?.id) {
      const saved = localStorage.getItem(`secondbrain_category_budgets_${profile.id}`);
      if (saved) {
        try {
          return { ...defaultBudgets, ...JSON.parse(saved) };
        } catch (_) {}
      }
    }
    return defaultBudgets;
  });

  const [isEditingCatBudget, setIsEditingCatBudget] = useState(false);
  const [tempCatBudgets, setTempCatBudgets] = useState({ ...catBudgets });

  // Invoice Generator state
  const [invoice, setInvoice] = useState({
    clientName: 'Đại học Bách Khoa - ĐHĐN',
    invoiceCode: 'INV-2026-001',
    issueDate: getTodayStr(timezone),
    dueDate: getTodayStr(timezone),
    items: [{ id: 1, description: 'Phát triển module Ultimate Brain', qty: 1, price: 15000000 }],
    taxRate: 10,
    notes: 'Vui lòng thanh toán bằng cách chuyển khoản qua ngân hàng Vietcombank.'
  });

  useEffect(() => {
    loadData();
  }, [month, profile?.id]);

  async function loadData() {
    try {
      logger.info(MODULE, 'Loading expenses for month', { month });
      const data = await getExpenses({ month });
      setExpenses(data);

      const all = await getExpenses({});
      setAllTimeExpenses(all);

      logger.success(MODULE, `Loaded ${data.length} month expenses, total ${all.length} all-time expenses`);
    } catch (err) {
      logger.error(MODULE, 'Failed to load expenses', err);
    }
  }

  function openNew() {
    setForm({
      amount: '',
      type: 'expense',
      category: 'food',
      date: getTodayStr(timezone),
      description: '',
      account: 'cash'
    });
    setEditingExpense('new');
  }

  function openEdit(item) {
    setForm({ ...item, account: item.account || 'cash' });
    setEditingExpense(item);
  }

  async function handleSave() {
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ!');
      return;
    }

    try {
      const data = {
        ...form,
        amount: Number(form.amount)
      };

      if (editingExpense === 'new') {
        await createExpense(data);
      } else {
        await updateExpense(editingExpense.id, data);
      }

      setEditingExpense(null);
      loadData();
    } catch (err) {
      logger.error(MODULE, 'Failed to save expense', err);
      alert('Không thể lưu giao dịch: ' + err.message);
    }
  }

  async function handleDelete(id) {
    if (confirm(t('common.confirmDelete'))) {
      try {
        await deleteExpense(id);
        setEditingExpense(null);
        loadData();
      } catch (err) {
        logger.error(MODULE, 'Failed to delete expense', err);
      }
    }
  }

  async function handleSaveBudget() {
    const lim = Number(tempBudget);
    if (isNaN(lim) || lim < 0) {
      alert('Ngân sách không hợp lệ!');
      return;
    }
    try {
      const { updateProfile } = await import('../store/masterDb');
      await updateProfile(profile.id, { budgetLimit: lim });
      setProfile({ ...profile, budgetLimit: lim });
      setIsEditingBudget(false);
    } catch (err) {
      alert('Lỗi khi lưu ngân sách: ' + err.message);
    }
  }

  async function handleSaveCatBudgets() {
    try {
      localStorage.setItem(`secondbrain_category_budgets_${profile.id}`, JSON.stringify(tempCatBudgets));
      setCatBudgets({ ...tempCatBudgets });
      setIsEditingCatBudget(false);
      alert('Đã lưu hạn mức ngân sách danh mục!');
    } catch (err) {
      alert('Lỗi khi lưu hạn mức danh mục: ' + err.message);
    }
  }

  // Calculate totals
  const totalExpense = expenses
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalIncome = expenses
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const percentSpent = budgetLimit > 0 ? (totalExpense / budgetLimit) * 100 : 0;

  // Calculate wallet balances dynamically from allTimeExpenses
  const walletBalances = {};
  ACCOUNTS.forEach(acc => {
    walletBalances[acc.id] = 0;
  });

  allTimeExpenses.forEach(e => {
    const accId = e.account || 'cash';
    if (walletBalances[accId] !== undefined) {
      if (e.type === 'income') {
        walletBalances[accId] += e.amount;
      } else {
        walletBalances[accId] -= e.amount;
      }
    }
  });

  // Category expense calculations
  const categoryTotals = {};
  expenses
    .filter(e => e.type === 'expense')
    .forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

  const categoriesList = Object.keys(categoryTotals).map(cat => ({
    id: cat,
    amount: categoryTotals[cat],
    label: t(`expenses.cat.${cat}`)
  })).sort((a, b) => b.amount - a.amount);

  // Cash Flow Forecasting
  const calculateForecast = () => {
    const today = new Date();
    const daysElapsed = today.getMonth() + 1 === Number(month.slice(5, 7)) && today.getFullYear() === Number(month.slice(0, 4))
      ? today.getDate()
      : 30; // default to 30 days if viewing past months
    
    const avgDaily = daysElapsed > 0 ? Math.round(totalExpense / daysElapsed) : 0;
    const projectedSpend = avgDaily * 30;
    const totalCurrentBalance = Object.values(walletBalances).reduce((a, b) => a + b, 0);
    const projectedEndingBalance = totalCurrentBalance + totalIncome - projectedSpend;

    let recommendation = '';
    if (projectedSpend > budgetLimit) {
      const overAmount = projectedSpend - budgetLimit;
      recommendation = lang === 'en'
        ? `⚠️ Your projected monthly spending exceeds budget by ${overAmount.toLocaleString()} đ. Try reducing Entertainment or Food categories!`
        : `⚠️ Dự báo chi tiêu của bạn vượt quá hạn mức ${overAmount.toLocaleString()} đ. Hãy cắt giảm chi tiêu danh mục Giải trí hoặc Ăn uống!`;
    } else if (projectedSpend > totalIncome && totalIncome > 0) {
      recommendation = lang === 'en'
        ? `⚠️ You are spending more than you earn this month. We recommend cutting daily habits by 15%.`
        : `⚠️ Chi tiêu dự kiến lớn hơn thu nhập tháng này. Khuyên bạn nên cắt giảm chi tiêu thói quen khoảng 15%.`;
    } else {
      recommendation = lang === 'en'
        ? `✅ Budget is under control. You are saving approximately ${(totalIncome - projectedSpend).toLocaleString()} đ this month. Keep it up!`
        : `✅ Chi tiêu trong tầm kiểm soát. Bạn dự kiến tiết kiệm khoảng ${(totalIncome - projectedSpend).toLocaleString()} đ trong tháng. Hãy tiếp tục duy trì!`;
    }

    return { avgDaily, projectedSpend, projectedEndingBalance, recommendation };
  };

  const forecast = calculateForecast();

  // Invoice Actions
  const handleAddInvoiceItem = () => {
    setInvoice({
      ...invoice,
      items: [...invoice.items, { id: Date.now(), description: '', qty: 1, price: 0 }]
    });
  };

  const handleRemoveInvoiceItem = (id) => {
    if (invoice.items.length === 1) return;
    setInvoice({
      ...invoice,
      items: invoice.items.filter(x => x.id !== id)
    });
  };

  const handleInvoiceItemChange = (id, field, value) => {
    setInvoice({
      ...invoice,
      items: invoice.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'qty') updated.qty = Math.max(1, parseInt(value) || 0);
          if (field === 'price') updated.price = Math.max(0, parseInt(value) || 0);
          return updated;
        }
        return item;
      })
    });
  };

  const getInvoiceSubtotal = () => {
    return invoice.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  };

  const getInvoiceTotal = () => {
    const sub = getInvoiceSubtotal();
    return sub + (sub * (invoice.taxRate / 100));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page">
      {/* Print Style Injector */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 30px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="page-header no-print">
        <h2>{t('expenses.title')}</h2>
        <p>{t('expenses.desc')}</p>
      </div>

      {/* Tabs Menu */}
      <div className="tabs no-print" style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
        <button className={`tab-btn btn ${activeTab === 'transactions' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('transactions')}>
          {localT('expenses.tab.transactions')}
        </button>
        <button className={`tab-btn btn ${activeTab === 'forecast' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('forecast')}>
          {localT('expenses.tab.forecast')}
        </button>
        <button className={`tab-btn btn ${activeTab === 'invoice' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('invoice')}>
          {localT('expenses.tab.invoice')}
        </button>
      </div>

      {/* ── TAB 1: TRANSACTIONS ── */}
      {activeTab === 'transactions' && (
        <div className="no-print">
          {/* Wallet Balances Cards (Ledger) */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.88rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 600 }}>
              {localT('expenses.wallet.title')}
            </h4>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {ACCOUNTS.map(acc => {
                const bal = walletBalances[acc.id];
                const isNegative = bal < 0;
                return (
                  <div key={acc.id} className="stat-card" style={{ borderLeft: `4px solid ${isNegative ? 'var(--red)' : 'var(--green)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {lang === 'en' ? acc.labelEn : acc.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '6px', color: isNegative ? 'var(--red)' : 'var(--green)' }}>
                      {bal.toLocaleString()} đ
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Budget Alerts */}
          {percentSpent >= 100 ? (
            <div style={{ background: 'rgba(255, 76, 76, 0.15)', border: '1px solid rgba(255, 76, 76, 0.3)', color: '#ff4c4c', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '0.88rem', fontWeight: 600 }}>
              {t('expenses.alert.danger')}
            </div>
          ) : percentSpent >= 80 ? (
            <div style={{ background: 'rgba(255, 179, 0, 0.15)', border: '1px solid rgba(255, 179, 0, 0.3)', color: '#ffb300', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '0.88rem', fontWeight: 600 }}>
              {t('expenses.alert.warning')}
            </div>
          ) : null}

          {/* Totals Summary */}
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card green">
              <div className="stat-icon">🔺</div>
              <div className="stat-value">+{totalIncome.toLocaleString()} đ</div>
              <div className="stat-label">Tổng thu tháng này</div>
            </div>
            <div className="stat-card red">
              <div className="stat-icon">🔻</div>
              <div className="stat-value">-{totalExpense.toLocaleString()} đ</div>
              <div className="stat-label">Tổng chi tháng này</div>
            </div>
            <div className="stat-card accent">
              <div className="stat-icon">💵</div>
              <div className="stat-value">{(totalIncome - totalExpense).toLocaleString()} đ</div>
              <div className="stat-label">Số dư dòng tiền</div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: '24px' }}>
            {/* Total Budget Card */}
            <div className="card">
              <div className="card-header">
                <h3>{t('expenses.budget.title')}</h3>
                {!isEditingBudget ? (
                  <button className="btn btn-sm" onClick={() => { setTempBudget(budgetLimit); setIsEditingBudget(true); }}>✏️ Sửa hạn mức</button>
                ) : null}
              </div>

              {!isEditingBudget ? (
                <div style={{ padding: '8px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span>{t('expenses.budget.limit')}:</span>
                    <strong style={{ color: 'var(--accent-light)' }}>{budgetLimit.toLocaleString()} đ</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span>{t('expenses.budget.spent')}:</span>
                    <strong style={{ color: '#ff4c4c' }}>{totalExpense.toLocaleString()} đ</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' }}>
                    <span>{t('expenses.budget.remaining')}:</span>
                    <strong style={{ color: budgetLimit - totalExpense >= 0 ? '#4caf50' : '#ff4c4c' }}>
                      {(budgetLimit - totalExpense).toLocaleString()} đ
                    </strong>
                  </div>

                  <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.min(100, percentSpent)}%`, 
                      background: percentSpent >= 100 ? '#ff4c4c' : percentSpent >= 80 ? '#ffb300' : 'var(--accent-light)', 
                      height: '100%',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Đã sử dụng {Math.round(percentSpent)}% hạn mức chi tiêu.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 0' }}>
                  <input className="input" type="number" value={tempBudget} onChange={e => setTempBudget(e.target.value)} style={{ flex: 1 }} placeholder="Hạn mức (đ)" />
                  <button className="btn btn-primary" onClick={handleSaveBudget}>{t('common.save')}</button>
                  <button className="btn" onClick={() => setIsEditingBudget(false)}>{t('common.cancel')}</button>
                </div>
              )}
            </div>

            {/* Expenses Category Chart */}
            <div className="card">
              <div className="card-header">
                <h3>{t('expenses.chart.title')}</h3>
              </div>
              {categoriesList.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {t('expenses.empty')}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {categoriesList.map(cat => {
                    const pct = totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0;
                    return (
                      <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                          <span>{cat.label}</span>
                          <strong>{cat.amount.toLocaleString()} đ ({Math.round(pct)}%)</strong>
                        </div>
                        <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', height: '6px', borderRadius: '3px' }}>
                          <div style={{ width: `${pct}%`, background: 'var(--accent-light)', height: '100%' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Toolbar & Filter */}
          <div className="toolbar">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Chọn tháng:</span>
              <input className="input" type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '6px 12px', fontSize: '0.85rem', width: '150px' }} />
            </div>
            <div className="toolbar-spacer" />
            <button className="btn btn-primary" onClick={openNew}>
              {t('expenses.btn.new')}
            </button>
          </div>

          {/* Transactions list */}
          <div className="card" style={{ padding: 0, overflowX: 'auto', marginTop: '12px' }}>
            {expenses.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px' }}>
                <div className="icon">💸</div>
                <p>{t('expenses.empty')}</p>
              </div>
            ) : (
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', opacity: 0.8 }}>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem' }}>Ngày</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem' }}>Phân loại</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem' }}>Ví/Tài khoản</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem' }}>Danh mục</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem' }}>Mô tả</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'right' }}>Số tiền</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{item.date}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.82rem' }}>
                        <span className={`tag ${item.type === 'income' ? 'tag-green' : 'tag-amber'}`}>
                          {t(`expenses.type.${item.type}`)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--accent-light)', fontWeight: 500 }}>
                        {ACCOUNTS.find(a => a.id === item.account)?.label || 'Tiền mặt 💵'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                        {t(`expenses.cat.${item.category}`)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {item.description || '--'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.88rem', fontWeight: 'bold', textAlign: 'right', color: item.type === 'income' ? 'var(--green-light)' : '#ff4c4c' }}>
                        {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString()} đ
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button className="btn btn-sm" onClick={() => openEdit(item)}>✏️</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: FORECAST & BUDGETS ── */}
      {activeTab === 'forecast' && (
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Forecasting Card */}
          <div className="card">
            <div className="card-header">
              <h3>{localT('expenses.forecast.title')}</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{localT('expenses.forecast.avgDaily')}</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginTop: '4px', color: 'var(--text-primary)' }}>
                  {forecast.avgDaily.toLocaleString()} đ / ngày
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{localT('expenses.forecast.projected')}</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginTop: '4px', color: forecast.projectedSpend > budgetLimit ? 'var(--red)' : 'var(--accent-light)' }}>
                  {forecast.projectedSpend.toLocaleString()} đ
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{localT('expenses.forecast.balance')}</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginTop: '4px', color: forecast.projectedEndingBalance < 0 ? 'var(--red)' : 'var(--green)' }}>
                  {forecast.projectedEndingBalance.toLocaleString()} đ
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(108, 92, 231, 0.1)', border: '1px dashed var(--accent)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>
              <strong>{localT('expenses.forecast.recommendation')}</strong>
              <p style={{ marginTop: '6px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {forecast.recommendation}
              </p>
            </div>
          </div>

          {/* Category Budgets Config & Chart */}
          <div className="card">
            <div className="card-header">
              <h3>{localT('expenses.budget.category')}</h3>
              {!isEditingCatBudget ? (
                <button className="btn btn-sm" onClick={() => { setTempCatBudgets({ ...catBudgets }); setIsEditingCatBudget(true); }}>
                  {localT('expenses.budget.setLimit')}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-sm btn-primary" onClick={handleSaveCatBudgets}>{t('common.save')}</button>
                  <button className="btn btn-sm" onClick={() => setIsEditingCatBudget(false)}>{t('common.cancel')}</button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              {Object.keys(catBudgets).map(catKey => {
                const spent = categoryTotals[catKey] || 0;
                const limit = catBudgets[catKey];
                const pct = limit > 0 ? (spent / limit) * 100 : 0;
                
                return (
                  <div key={catKey} style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{t(`expenses.cat.${catKey}`)}</span>
                      {isEditingCatBudget ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input type="number" className="input" style={{ width: '120px', padding: '4px 8px', fontSize: '0.82rem' }}
                            value={tempCatBudgets[catKey]}
                            onChange={e => setTempCatBudgets({ ...tempCatBudgets, [catKey]: Math.max(0, parseInt(e.target.value) || 0) })} />
                          <span style={{ fontSize: '0.82rem' }}>đ</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.85rem' }}>
                          <strong>{spent.toLocaleString()} đ</strong> / {limit.toLocaleString()} đ ({Math.round(pct)}%)
                        </span>
                      )}
                    </div>

                    {!isEditingCatBudget && (
                      <div style={{ width: '100%', background: 'rgba(255,255,255,0.04)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, pct)}%`,
                          background: pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--amber)' : 'var(--accent)',
                          height: '100%',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: INVOICE GENERATOR ── */}
      {activeTab === 'invoice' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          
          {/* Invoice Setup Form */}
          <div className="card no-print">
            <div className="card-header">
              <h3>{localT('invoice.title')}</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              <div className="form-group">
                <label className="form-label">{localT('invoice.client')}</label>
                <input className="input" value={invoice.clientName} onChange={e => setInvoice({ ...invoice, clientName: e.target.value })} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{localT('invoice.code')}</label>
                  <input className="input" value={invoice.invoiceCode} onChange={e => setInvoice({ ...invoice, invoiceCode: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">{localT('invoice.tax')} (%)</label>
                  <select className="select" value={invoice.taxRate} onChange={e => setInvoice({ ...invoice, taxRate: Number(e.target.value) })}>
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="10">10%</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{localT('invoice.issue')}</label>
                  <input className="input" type="date" value={invoice.issueDate} onChange={e => setInvoice({ ...invoice, issueDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">{localT('invoice.due')}</label>
                  <input className="input" type="date" value={invoice.dueDate} onChange={e => setInvoice({ ...invoice, dueDate: e.target.value })} />
                </div>
              </div>

              {/* Line Items Editor */}
              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Danh sách dịch vụ / sản phẩm</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {invoice.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input className="input" style={{ flex: 2, padding: '6px 10px', fontSize: '0.82rem' }}
                        placeholder="Mô tả..." value={item.description}
                        onChange={e => handleInvoiceItemChange(item.id, 'description', e.target.value)} />
                      <input className="input" style={{ width: '50px', padding: '6px 6px', fontSize: '0.82rem', textAlign: 'center' }}
                        type="number" value={item.qty}
                        onChange={e => handleInvoiceItemChange(item.id, 'qty', e.target.value)} />
                      <input className="input" style={{ width: '100px', padding: '6px 8px', fontSize: '0.82rem' }}
                        type="number" placeholder="Đơn giá" value={item.price}
                        onChange={e => handleInvoiceItemChange(item.id, 'price', e.target.value)} />
                      <button className="btn btn-sm btn-danger" onClick={() => handleRemoveInvoiceItem(item.id)}>✕</button>
                    </div>
                  ))}
                </div>
                <button className="btn btn-sm" style={{ marginTop: '10px' }} onClick={handleAddInvoiceItem}>
                  {localT('invoice.add')}
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">{localT('invoice.notes')}</label>
                <textarea className="textarea" style={{ minHeight: '60px' }} value={invoice.notes} onChange={e => setInvoice({ ...invoice, notes: e.target.value })} />
              </div>

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }} onClick={handlePrint}>
                {localT('invoice.print')}
              </button>
            </div>
          </div>

          {/* Invoice Live Preview */}
          <div className="card" style={{ background: 'white', color: '#1a1a24', padding: '24px', border: '1px solid #d1d1e0' }}>
            <h4 className="no-print" style={{ fontSize: '0.88rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '16px', fontWeight: 600 }}>
              {localT('invoice.preview')}
            </h4>

            {/* Print Area */}
            <div id="print-area" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif' }}>
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #6c5ce7', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', color: '#6c5ce7', fontWeight: 700, margin: 0 }}>{profile?.name || 'STUDENT NAME'}</h2>
                    <span style={{ fontSize: '0.78rem', color: '#666' }}>{localT('invoice.seller')} | Developer Freelance</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: '#333', letterSpacing: '0.05em' }}>INVOICE</h1>
                    <span style={{ fontSize: '0.8rem', color: '#6c5ce7', fontWeight: 600 }}>{invoice.invoiceCode}</span>
                  </div>
                </div>

                {/* Client / Dates Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', fontSize: '0.85rem' }}>
                  <div>
                    <strong style={{ color: '#555', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.75rem' }}>BIỂU MẪU GỬI ĐẾN (BILL TO):</strong>
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#222' }}>{invoice.clientName}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div><span style={{ color: '#666' }}>{localT('invoice.issue')}:</span> <strong>{invoice.issueDate}</strong></div>
                    <div style={{ marginTop: '4px' }}><span style={{ color: '#ff6b6b', fontWeight: 600 }}>{localT('invoice.due')}:</span> <strong>{invoice.dueDate}</strong></div>
                  </div>
                </div>

                {/* Table of items */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f4f4f9', borderBottom: '1px solid #ddd' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>{localT('invoice.desc')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', width: '50px', fontWeight: 600 }}>{localT('invoice.qty')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', width: '120px', fontWeight: 600 }}>{localT('invoice.price')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', width: '120px', fontWeight: 600 }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px 12px', color: '#333' }}>{item.description || '(Chưa điền dịch vụ)'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#555' }}>{item.qty}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#555' }}>{item.price.toLocaleString()} đ</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#222' }}>{(item.qty * item.price).toLocaleString()} đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Total breakdown */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.85rem' }}>
                  <div style={{ width: '250px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
                      <span style={{ color: '#666' }}>{localT('invoice.subtotal')}:</span>
                      <strong>{getInvoiceSubtotal().toLocaleString()} đ</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
                      <span style={{ color: '#666' }}>{localT('invoice.tax')} ({invoice.taxRate}%):</span>
                      <strong>{(getInvoiceSubtotal() * (invoice.taxRate / 100)).toLocaleString()} đ</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', color: '#6c5ce7', fontSize: '1rem', fontWeight: 700 }}>
                      <span>{localT('invoice.total')}:</span>
                      <span>{getInvoiceTotal().toLocaleString()} đ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footnote */}
              <div style={{ borderTop: '1px solid #eee', paddingTop: '16px', marginTop: '40px', fontSize: '0.78rem', color: '#888' }}>
                <strong>Ghi chú bổ sung:</strong>
                <p style={{ marginTop: '4px', lineHeight: 1.4 }}>{invoice.notes || '--'}</p>
                <div style={{ marginTop: '20px', textAlign: 'center', color: '#aaa' }}>Cảm ơn bạn đã tin tưởng dịch vụ của tôi!</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Add/Edit Modal (Transactions) */}
      {editingExpense && (
        <div className="modal-overlay no-print" onClick={e => e.target === e.currentTarget && setEditingExpense(null)}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{editingExpense === 'new' ? t('expenses.btn.new') : 'Sửa giao dịch'}</h3>
              <button className="modal-close" onClick={() => setEditingExpense(null)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">{t('expenses.form.amount')} *</label>
              <input className="input" type="number" placeholder="Nhập số tiền..." value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} autoFocus />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{t('expenses.form.type')}</label>
                <select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value, category: e.target.value === 'income' ? 'income_family' : 'food' })}>
                  <option value="expense">Khoản Chi 🔻</option>
                  <option value="income">Khoản Thu 🔺</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{localT('expenses.form.account')}</label>
                <select className="select" value={form.account} onChange={e => setForm({ ...form, account: e.target.value })}>
                  {ACCOUNTS.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {lang === 'en' ? acc.labelEn : acc.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{t('expenses.form.category')}</label>
                <select className="select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {form.type === 'expense' ? (
                    <>
                      <option value="food">{t('expenses.cat.food')}</option>
                      <option value="rent">{t('expenses.cat.rent')}</option>
                      <option value="travel">{t('expenses.cat.travel')}</option>
                      <option value="study">{t('expenses.cat.study')}</option>
                      <option value="entertainment">{t('expenses.cat.entertainment')}</option>
                      <option value="other">{t('expenses.cat.other')}</option>
                    </>
                  ) : (
                    <>
                      <option value="income_family">{t('expenses.cat.income_family')}</option>
                      <option value="income_parttime">{t('expenses.cat.income_parttime')}</option>
                      <option value="income_scholarship">{t('expenses.cat.income_scholarship')}</option>
                      <option value="other">{t('expenses.cat.other')}</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('expenses.form.date')}</label>
                <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('expenses.form.desc')}</label>
              <input className="input" placeholder="Mua cơm trưa, đóng tiền phòng trọ..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              {editingExpense !== 'new' && (
                <button className="btn btn-danger" onClick={() => handleDelete(editingExpense.id)}>{t('common.delete')}</button>
              )}
              <div className="toolbar-spacer" />
              <button className="btn" onClick={() => setEditingExpense(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.amount}>
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
