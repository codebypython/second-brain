import { useState, useEffect } from 'react';
import { 
  getPowerDevices, createPowerDevice, updatePowerDevice, deletePowerDevice,
  getElectricityBills, createElectricityBill, updateElectricityBill, deleteElectricityBill 
} from '../store/db';
import { useAppContext } from '../AppContext';
import { getTodayStr } from '../store/dateUtils';
import logger from '../store/logger';
import { calculateKwh, calculateFlatCost, calculateEvnCost } from '../store/powerUtils';

const MODULE = 'PowerHubPage';

export default function PowerHub() {
  const { t, timezone, profile } = useAppContext();
  const [devices, setDevices] = useState([]);
  const [bills, setBills] = useState([]);
  const [activeTab, setActiveTab] = useState('devices');
  
  // Tariff state (persisted per profile in localStorage)
  const [tariffType, setTariffType] = useState('flat'); // 'flat' | 'evn'
  const [flatRate, setFlatRate] = useState(3500);
  const [includeVat, setIncludeVat] = useState(true);

  // Modals state
  const [editingDevice, setEditingDevice] = useState(null); // 'new' or device object
  const [deviceForm, setDeviceForm] = useState({
    name: '',
    power: '',
    quantity: '1',
    hoursPerDay: '4',
    daysPerMonth: '30',
    category: 'study',
    room: 'study'
  });

  const [editingBill, setEditingBill] = useState(null); // 'new' or bill object
  const [billForm, setBillForm] = useState({
    month: getTodayStr(timezone).slice(0, 7), // YYYY-MM
    startIndex: '',
    endIndex: '',
    totalAmount: '',
    paid: 'false',
    note: ''
  });

  useEffect(() => {
    if (profile) {
      // Load saved settings
      const savedType = localStorage.getItem(`power_tariff_type_${profile.id}`);
      const savedRate = localStorage.getItem(`power_tariff_rate_${profile.id}`);
      const savedVat = localStorage.getItem(`power_tariff_vat_${profile.id}`);
      
      if (savedType) setTariffType(savedType);
      if (savedRate) setFlatRate(Number(savedRate));
      if (savedVat) setIncludeVat(savedVat === 'true');
      
      loadData();
    }
  }, [profile]);

  async function loadData() {
    try {
      logger.info(MODULE, 'Loading devices and bills...');
      const [deviceData, billData] = await Promise.all([
        getPowerDevices(),
        getElectricityBills()
      ]);
      setDevices(deviceData);
      setBills(billData);
      logger.success(MODULE, `Loaded ${deviceData.length} devices and ${billData.length} bills`);
    } catch (err) {
      logger.error(MODULE, 'Failed to load data', err);
    }
  }

  function handleSaveTariff(type, rate, vat) {
    setTariffType(type);
    setFlatRate(rate);
    setIncludeVat(vat);
    if (profile) {
      localStorage.setItem(`power_tariff_type_${profile.id}`, type);
      localStorage.setItem(`power_tariff_rate_${profile.id}`, rate.toString());
      localStorage.setItem(`power_tariff_vat_${profile.id}`, vat.toString());
    }
  }

  function getCost(kwh) {
    if (tariffType === 'flat') {
      return calculateFlatCost(kwh, flatRate, includeVat);
    } else {
      return calculateEvnCost(kwh, includeVat);
    }
  }

  // Devices calculations
  const totalCapacityWatts = devices.reduce((sum, d) => sum + (Number(d.power) * Number(d.quantity)), 0);
  const totalDailyKwh = devices.reduce((sum, d) => sum + calculateKwh(d.power, d.quantity, d.hoursPerDay), 0);
  const totalMonthlyKwh = devices.reduce((sum, d) => sum + (calculateKwh(d.power, d.quantity, d.hoursPerDay) * Number(d.daysPerMonth)), 0);
  
  const estimatedDailyCost = getCost(totalDailyKwh);
  const estimatedMonthlyCost = getCost(totalMonthlyKwh);

  // Device Form Actions
  function openNewDevice() {
    setDeviceForm({
      name: '',
      power: '',
      quantity: '1',
      hoursPerDay: '4',
      daysPerMonth: '30',
      category: 'study',
      room: 'study'
    });
    setEditingDevice('new');
  }

  function openEditDevice(d) {
    setDeviceForm({
      name: d.name,
      power: d.power.toString(),
      quantity: d.quantity.toString(),
      hoursPerDay: d.hoursPerDay.toString(),
      daysPerMonth: d.daysPerMonth.toString(),
      category: d.category || 'study',
      room: d.room || 'study'
    });
    setEditingDevice(d);
  }

  async function handleSaveDevice() {
    if (!deviceForm.name.trim() || !deviceForm.power || isNaN(Number(deviceForm.power)) || Number(deviceForm.power) <= 0) {
      alert('Vui lòng điền tên và công suất hợp lệ!');
      return;
    }
    const dData = {
      name: deviceForm.name.trim(),
      power: Number(deviceForm.power),
      quantity: Number(deviceForm.quantity) || 1,
      hoursPerDay: Number(deviceForm.hoursPerDay) || 0,
      daysPerMonth: Number(deviceForm.daysPerMonth) || 30,
      category: deviceForm.category,
      room: deviceForm.room
    };
    try {
      if (editingDevice === 'new') {
        await createPowerDevice(dData);
      } else {
        await updatePowerDevice(editingDevice.id, dData);
      }
      setEditingDevice(null);
      loadData();
    } catch (err) {
      logger.error(MODULE, 'Save device failed', err);
      alert('Lỗi lưu thiết bị: ' + err.message);
    }
  }

  async function handleDeleteDevice(id) {
    if (confirm(t('common.confirmDelete'))) {
      try {
        await deletePowerDevice(id);
        setEditingDevice(null);
        loadData();
      } catch (err) {
        logger.error(MODULE, 'Delete device failed', err);
      }
    }
  }

  // Bill Form Actions
  function openNewBill() {
    setBillForm({
      month: getTodayStr(timezone).slice(0, 7),
      startIndex: '',
      endIndex: '',
      totalAmount: '',
      paid: 'false',
      note: ''
    });
    setEditingBill('new');
  }

  function openEditBill(b) {
    setBillForm({
      month: b.month,
      startIndex: b.startIndex.toString(),
      endIndex: b.endIndex.toString(),
      totalAmount: b.totalAmount.toString(),
      paid: b.paid ? 'true' : 'false',
      note: b.note || ''
    });
    setEditingBill(b);
  }

  async function handleSaveBill() {
    const start = Number(billForm.startIndex);
    const end = Number(billForm.endIndex);
    const amt = Number(billForm.totalAmount);
    if (isNaN(start) || start < 0 || isNaN(end) || end < start) {
      alert('Chỉ số công tơ không hợp lệ! Chỉ số cuối phải lớn hơn hoặc bằng chỉ số đầu.');
      return;
    }
    if (isNaN(amt) || amt < 0) {
      alert('Số tiền điện thanh toán không hợp lệ!');
      return;
    }
    const totalKwh = end - start;
    const bData = {
      month: billForm.month,
      startIndex: start,
      endIndex: end,
      totalKwh,
      totalAmount: amt,
      paid: billForm.paid === 'true',
      note: billForm.note.trim()
    };
    try {
      if (editingBill === 'new') {
        await createElectricityBill(bData);
      } else {
        await updateElectricityBill(editingBill.id, bData);
      }
      setEditingBill(null);
      loadData();
    } catch (err) {
      logger.error(MODULE, 'Save bill failed', err);
      alert('Lỗi lưu hóa đơn: ' + err.message);
    }
  }

  async function handleDeleteBill(id) {
    if (confirm(t('common.confirmDelete'))) {
      try {
        await deleteElectricityBill(id);
        setEditingBill(null);
        loadData();
      } catch (err) {
        logger.error(MODULE, 'Delete bill failed', err);
      }
    }
  }

  // Analytics breakdown
  const categoryTotals = {};
  devices.forEach(d => {
    const kwh = calculateKwh(d.power, d.quantity, d.hoursPerDay) * Number(d.daysPerMonth);
    categoryTotals[d.category] = (categoryTotals[d.category] || 0) + kwh;
  });
  const sortedCategories = Object.keys(categoryTotals).map(cat => ({
    id: cat,
    kwh: categoryTotals[cat],
    cost: getCost(categoryTotals[cat]),
    label: t(`power.cat.${cat}`)
  })).sort((a, b) => b.kwh - a.kwh);

  const roomTotals = {};
  devices.forEach(d => {
    const kwh = calculateKwh(d.power, d.quantity, d.hoursPerDay) * Number(d.daysPerMonth);
    roomTotals[d.room] = (roomTotals[d.room] || 0) + kwh;
  });
  const sortedRooms = Object.keys(roomTotals).map(r => ({
    id: r,
    kwh: roomTotals[r],
    cost: getCost(roomTotals[r]),
    label: t(`power.room.${r}`)
  })).sort((a, b) => b.kwh - a.kwh);

  // Meter readings comparison for last logged month
  const lastBill = bills[0]; // array sorted descending by month
  let actualVsEstimatedDiff = 0;
  let diffPercent = 0;
  let comparisonText = '';
  let alertType = 'neutral'; // 'neutral' | 'warning' | 'info' | 'success'

  if (lastBill) {
    actualVsEstimatedDiff = lastBill.totalKwh - totalMonthlyKwh;
    if (totalMonthlyKwh > 0) {
      diffPercent = (actualVsEstimatedDiff / totalMonthlyKwh) * 100;
    }
    
    if (diffPercent > 20) {
      alertType = 'warning';
      comparisonText = `⚠️ Điện năng tiêu thụ thực tế (${lastBill.totalKwh.toFixed(1)} kWh) cao hơn ${diffPercent.toFixed(1)}% so với ước tính của thiết bị (${totalMonthlyKwh.toFixed(1)} kWh). Có khả năng thất thoát điện năng (dòng rò), thiết bị hao mòn giảm hiệu suất, hoặc chủ nhà trọ đang tính sai chỉ số điện!`;
    } else if (diffPercent < -20) {
      alertType = 'info';
      comparisonText = `ℹ️ Tiêu thụ thực tế (${lastBill.totalKwh.toFixed(1)} kWh) thấp hơn ${Math.abs(diffPercent).toFixed(1)}% so với ước tính của thiết bị (${totalMonthlyKwh.toFixed(1)} kWh). Bạn đang sử dụng các thiết bị điện ít hơn so với công suất thiết lập hàng ngày.`;
    } else {
      alertType = 'success';
      comparisonText = `✅ Tiêu thụ thực tế (${lastBill.totalKwh.toFixed(1)} kWh) khớp rất tốt với ước tính của thiết bị (${totalMonthlyKwh.toFixed(1)} kWh) (sai lệch chỉ ${diffPercent.toFixed(1)}%). Các thiết bị đang hoạt động ổn định và không phát hiện rò rỉ điện đáng kể.`;
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>{t('power.title')}</h2>
        <p>{t('power.desc')}</p>
      </div>

      {/* Electricity Overview KPIs */}
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-icon">⚡</div>
          <div className="stat-value">{totalCapacityWatts.toLocaleString()} W</div>
          <div className="stat-label">{t('power.stats.totalCapacity')}</div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">🔋</div>
          <div className="stat-value">{totalDailyKwh.toFixed(2)} kWh</div>
          <div className="stat-label">{t('power.stats.dailyKwh')}</div>
        </div>

        <div className="stat-card amber">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{totalMonthlyKwh.toFixed(1)} kWh</div>
          <div className="stat-label">{t('power.stats.monthlyKwh')}</div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">💸</div>
          <div className="stat-value">{Math.round(estimatedMonthlyCost).toLocaleString()} đ</div>
          <div className="stat-label">{t('power.stats.monthlyCost')} (Ước tính)</div>
        </div>
      </div>

      {/* Tariff Settings Box */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3>⚙️ {t('power.tariff.title')}</h3>
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="radio" name="tariffType" checked={tariffType === 'flat'} onChange={() => handleSaveTariff('flat', flatRate, includeVat)} />
              {t('power.tariff.flat')}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="radio" name="tariffType" checked={tariffType === 'evn'} onChange={() => handleSaveTariff('evn', flatRate, includeVat)} />
              {t('power.tariff.evn')}
            </label>
          </div>

          {tariffType === 'flat' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('power.tariff.rate')}:</span>
              <input className="input" type="number" value={flatRate} onChange={e => handleSaveTariff('flat', Number(e.target.value), includeVat)} style={{ width: '100px', padding: '6px 10px', fontSize: '0.85rem' }} />
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={includeVat} onChange={e => handleSaveTariff(tariffType, flatRate, e.target.checked)} />
            {t('power.tariff.vat')}
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'devices' ? 'active' : ''}`} onClick={() => setActiveTab('devices')}>
          {t('power.tab.devices')}
        </button>
        <button className={`tab ${activeTab === 'bills' ? 'active' : ''}`} onClick={() => setActiveTab('bills')}>
          {t('power.tab.bills')}
        </button>
        <button className={`tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
          {t('power.tab.stats')}
        </button>
      </div>

      {/* Tab content 1: Devices */}
      {activeTab === 'devices' && (
        <div>
          <div className="toolbar" style={{ marginTop: '12px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Liệt kê thiết bị điện để tính lượng hao tổn định mức hàng tháng</p>
            <div className="toolbar-spacer" />
            <button className="btn btn-primary" onClick={openNewDevice}>{t('power.btn.new')}</button>
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto', marginTop: '12px' }}>
            {devices.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px' }}>
                <div className="icon">🔌</div>
                <p>Chưa có thiết bị điện nào được thêm. Hãy bắt đầu kiểm soát điện năng tiêu thụ ngay!</p>
              </div>
            ) : (
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', opacity: 0.8 }}>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem' }}>{t('power.form.name')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem' }}>{t('power.form.category')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem' }}>{t('power.form.room')}</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'right' }}>Công suất (W)</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'right' }}>SL</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'right' }}>Giờ/ngày</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'right' }}>Ngày/tháng</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'right' }}>kWh/tháng</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'right' }}>Tiền/tháng</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map(d => {
                    const dkwh = calculateKwh(d.power, d.quantity, d.hoursPerDay) * Number(d.daysPerMonth);
                    const cost = getCost(dkwh);
                    return (
                      <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px 16px', fontSize: '0.88rem', fontWeight: '500' }}>{d.name}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.82rem' }}>
                          <span className="tag tag-accent">{t(`power.cat.${d.category}`)}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {t(`power.room.${d.room}`)}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', textAlign: 'right' }}>{d.power} W</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', textAlign: 'right' }}>{d.quantity}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', textAlign: 'right' }}>{d.hoursPerDay}h</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', textAlign: 'right' }}>{d.daysPerMonth} ngày</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.88rem', fontWeight: 'bold', textAlign: 'right', color: 'var(--blue)' }}>
                          {dkwh.toFixed(1)} kWh
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.88rem', fontWeight: 'bold', textAlign: 'right', color: 'var(--green)' }}>
                          {Math.round(cost).toLocaleString()} đ
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button className="btn btn-sm" onClick={() => openEditDevice(d)}>✏️</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDeleteDevice(d.id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab content 2: Bills / Meter readings */}
      {activeTab === 'bills' && (
        <div>
          <div className="toolbar" style={{ marginTop: '12px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Ghi lại chỉ số công tơ điện hàng tháng để đối chiếu và kiểm tra hóa đơn từ chủ nhà trọ</p>
            <div className="toolbar-spacer" />
            <button className="btn btn-primary" onClick={openNewBill}>{t('power.btn.newBill')}</button>
          </div>

          {/* Comparison warning alert */}
          {lastBill && (
            <div style={{ 
              background: alertType === 'warning' ? 'rgba(255, 107, 107, 0.12)' : alertType === 'info' ? 'rgba(84, 160, 255, 0.12)' : 'rgba(0, 210, 160, 0.12)', 
              border: `1px solid ${alertType === 'warning' ? 'var(--red)' : alertType === 'info' ? 'var(--blue)' : 'var(--green)'}`, 
              color: alertType === 'warning' ? 'var(--red)' : alertType === 'info' ? 'var(--blue)' : 'var(--green)',
              padding: '16px', 
              borderRadius: 'var(--radius-lg)', 
              marginBottom: '20px', 
              fontSize: '0.88rem', 
              lineHeight: 1.6,
              fontWeight: 500
            }}>
              {comparisonText}
            </div>
          )}

          <div className="card" style={{ padding: 0, overflowX: 'auto', marginTop: '12px' }}>
            {bills.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px' }}>
                <div className="icon">📝</div>
                <p>Chưa có bản ghi số điện nào. Hãy thêm số điện tháng này!</p>
              </div>
            ) : (
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', opacity: 0.8 }}>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem' }}>Tháng</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'right' }}>Chỉ số đầu</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'right' }}>Chỉ số cuối</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'right' }}>Tiêu thụ (kWh)</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'right' }}>Thành tiền thực tế</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem' }}>Ghi chú</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.82rem', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '0.88rem', fontWeight: 'bold' }}>{b.month}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', textAlign: 'right' }}>{b.startIndex}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', textAlign: 'right' }}>{b.endIndex}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.88rem', fontWeight: 'bold', textAlign: 'right', color: 'var(--blue)' }}>
                        {b.totalKwh} kWh
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.88rem', fontWeight: 'bold', textAlign: 'right', color: 'var(--green)' }}>
                        {b.totalAmount.toLocaleString()} đ
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span className={`tag ${b.paid ? 'tag-green' : 'tag-red'}`}>
                          {b.paid ? 'Đã trả' : 'Chưa trả'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.note || '--'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button className="btn btn-sm" onClick={() => openEditBill(b)}>✏️</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteBill(b.id)}>🗑️</button>
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

      {/* Tab content 3: Stats & Analytics */}
      {activeTab === 'stats' && (
        <div className="grid-2">
          {/* Category breakdown */}
          <div className="card">
            <div className="card-header">
              <h3>📊 Tiêu thụ theo nhóm thiết bị (kWh/tháng)</h3>
            </div>
            {sortedCategories.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Chưa có thiết bị nào để phân tích.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {sortedCategories.map(cat => {
                  const pct = totalMonthlyKwh > 0 ? (cat.kwh / totalMonthlyKwh) * 100 : 0;
                  return (
                    <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>{cat.label}</span>
                        <strong>{cat.kwh.toFixed(1)} kWh ({Math.round(pct)}%)</strong>
                      </div>
                      <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, background: 'var(--accent-light)', height: '100%', borderRadius: '4px' }} />
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Ước tính: ~{Math.round(cat.cost).toLocaleString()} đ
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Room breakdown */}
          <div className="card">
            <div className="card-header">
              <h3>🏠 Tiêu thụ theo Phòng lắp đặt (kWh/tháng)</h3>
            </div>
            {sortedRooms.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Chưa có thiết bị nào để phân tích.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {sortedRooms.map(r => {
                  const pct = totalMonthlyKwh > 0 ? (r.kwh / totalMonthlyKwh) * 100 : 0;
                  return (
                    <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>{r.label}</span>
                        <strong>{r.kwh.toFixed(1)} kWh ({Math.round(pct)}%)</strong>
                      </div>
                      <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, background: 'var(--blue)', height: '100%', borderRadius: '4px' }} />
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Ước tính: ~{Math.round(r.cost).toLocaleString()} đ
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Device Modal Dialog */}
      {editingDevice && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditingDevice(null)}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{editingDevice === 'new' ? '⚡ Thêm thiết bị mới' : '✏️ Sửa thiết bị'}</h3>
              <button className="modal-close" onClick={() => setEditingDevice(null)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">{t('power.form.name')} *</label>
              <input className="input" placeholder="Ví dụ: Điều hòa, Máy giặt, PC..." value={deviceForm.name} onChange={e => setDeviceForm({ ...deviceForm, name: e.target.value })} autoFocus />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{t('power.form.category')}</label>
                <select className="select" value={deviceForm.category} onChange={e => setDeviceForm({ ...deviceForm, category: e.target.value })}>
                  <option value="cooling">{t('power.cat.cooling')}</option>
                  <option value="kitchen">{t('power.cat.kitchen')}</option>
                  <option value="entertainment">{t('power.cat.entertainment')}</option>
                  <option value="study">{t('power.cat.study')}</option>
                  <option value="lighting">{t('power.cat.lighting')}</option>
                  <option value="appliances">{t('power.cat.appliances')}</option>
                  <option value="other">{t('power.cat.other')}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('power.form.room')}</label>
                <select className="select" value={deviceForm.room} onChange={e => setDeviceForm({ ...deviceForm, room: e.target.value })}>
                  <option value="living">{t('power.room.living')}</option>
                  <option value="bedroom">{t('power.room.bedroom')}</option>
                  <option value="kitchen">{t('power.room.kitchen')}</option>
                  <option value="study">{t('power.room.study')}</option>
                  <option value="other">{t('power.room.other')}</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{t('power.form.power')} *</label>
                <input className="input" type="number" placeholder="Ví dụ: 150" value={deviceForm.power} onChange={e => setDeviceForm({ ...deviceForm, power: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">{t('power.form.quantity')}</label>
                <input className="input" type="number" value={deviceForm.quantity} onChange={e => setDeviceForm({ ...deviceForm, quantity: e.target.value })} />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{t('power.form.hours')}</label>
                <input className="input" type="number" step="0.5" value={deviceForm.hoursPerDay} onChange={e => setDeviceForm({ ...deviceForm, hoursPerDay: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">{t('power.form.days')}</label>
                <input className="input" type="number" value={deviceForm.daysPerMonth} onChange={e => setDeviceForm({ ...deviceForm, daysPerMonth: e.target.value })} />
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              {editingDevice !== 'new' && (
                <button className="btn btn-danger" onClick={() => handleDeleteDevice(editingDevice.id)}>{t('common.delete')}</button>
              )}
              <div className="toolbar-spacer" />
              <button className="btn" onClick={() => setEditingDevice(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSaveDevice} disabled={!deviceForm.name.trim() || !deviceForm.power}>
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Modal Dialog */}
      {editingBill && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditingBill(null)}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{editingBill === 'new' ? '📝 Ghi chỉ số/Hóa đơn mới' : '✏️ Sửa hóa đơn'}</h3>
              <button className="modal-close" onClick={() => setEditingBill(null)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Chọn tháng</label>
              <input className="input" type="month" value={billForm.month} onChange={e => setBillForm({ ...billForm, month: e.target.value })} />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Chỉ số đầu công tơ *</label>
                <input className="input" type="number" placeholder="Ví dụ: 1240" value={billForm.startIndex} onChange={e => setBillForm({ ...billForm, startIndex: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Chỉ số cuối công tơ *</label>
                <input className="input" type="number" placeholder="Ví dụ: 1420" value={billForm.endIndex} onChange={e => setBillForm({ ...billForm, endIndex: e.target.value })} />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Thành tiền thực tế (đ) *</label>
                <input className="input" type="number" placeholder="Ví dụ: 630000" value={billForm.totalAmount} onChange={e => setBillForm({ ...billForm, totalAmount: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Trạng thái thanh toán</label>
                <select className="select" value={billForm.paid} onChange={e => setBillForm({ ...billForm, paid: e.target.value })}>
                  <option value="false">Chưa thanh toán</option>
                  <option value="true">Đã thanh toán</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Ghi chú thêm</label>
              <input className="input" placeholder="Ví dụ: Giá điện 4000đ/chữ..." value={billForm.note} onChange={e => setBillForm({ ...billForm, note: e.target.value })} />
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              {editingBill !== 'new' && (
                <button className="btn btn-danger" onClick={() => handleDeleteBill(editingBill.id)}>{t('common.delete')}</button>
              )}
              <div className="toolbar-spacer" />
              <button className="btn" onClick={() => setEditingBill(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSaveBill} disabled={!billForm.startIndex || !billForm.endIndex || !billForm.totalAmount}>
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
