import { useState, useEffect } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../store/db';
import { useAppContext } from '../AppContext';
import { getTodayStr } from '../store/dateUtils';
import logger from '../store/logger';

const MODULE = 'ExpensesPage';

export default function Expenses() {
  const { t, timezone } = useAppContext();
  const [expenses, setExpenses] = useState([]);
  const [month, setMonth] = useState(getTodayStr(timezone).slice(0, 7)); // YYYY-MM
  const [editingExpense, setEditingExpense] = useState(null); // 'new' or expense object
  const [form, setForm] = useState({
    amount: '',
    type: 'expense',
    category: 'food',
    date: getTodayStr(timezone),
    description: ''
  });
  const [budgetLimit, setBudgetLimit] = useState(() => {
    return Number(localStorage.getItem('secondbrain_budget_limit')) || 3000000;
  });
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budgetLimit);

  useEffect(() => {
    loadData();
  }, [month]);

  async function loadData() {
    try {
      logger.info(MODULE, 'Loading expenses for month', { month });
      const data = await getExpenses({ month });
      setExpenses(data);
      logger.success(MODULE, `Loaded ${data.length} expenses`);
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
      description: ''
    });
    setEditingExpense('new');
  }

  function openEdit(item) {
    setForm({ ...item });
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

  function handleSaveBudget() {
    const lim = Number(tempBudget);
    if (isNaN(lim) || lim < 0) {
      alert('Ngân sách không hợp lệ!');
      return;
    }
    setBudgetLimit(lim);
    localStorage.setItem('secondbrain_budget_limit', lim.toString());
    setIsEditingBudget(false);
  }

  // Calculate totals
  const totalExpense = expenses
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalIncome = expenses
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const percentSpent = budgetLimit > 0 ? (totalExpense / budgetLimit) * 100 : 0;

  // Group by category for charts
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

  return (
    <div className="page">
      <div className="page-header">
        <h2>{t('expenses.title')}</h2>
        <p>{t('expenses.desc')}</p>
      </div>

      {/* Budget Limit Alerts */}
      {percentSpent >= 100 ? (
        <div style={{ background: 'rgba(255, 76, 76, 0.15)', border: '1px solid rgba(255, 76, 76, 0.3)', color: '#ff4c4c', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '0.88rem', fontWeight: 600 }}>
          {t('expenses.alert.danger')}
        </div>
      ) : percentSpent >= 80 ? (
        <div style={{ background: 'rgba(255, 179, 0, 0.15)', border: '1px solid rgba(255, 179, 0, 0.3)', color: '#ffb300', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '0.88rem', fontWeight: 600 }}>
          {t('expenses.alert.warning')}
        </div>
      ) : null}

      {/* Financial Overview Cards */}
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
        {/* Budget Planning Card */}
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

              {/* Progress bar */}
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

      {/* Add/Edit Modal */}
      {editingExpense && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditingExpense(null)}>
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
            </div>

            <div className="form-group">
              <label className="form-label">{t('expenses.form.date')}</label>
              <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
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
