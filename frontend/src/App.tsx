import { useState } from 'react';
import { 
  Calculator, Users, Home, Calendar, DollarSign, 
  Percent, Shield, Plus, Lock, Check, X, Building, 
  Search, Briefcase, FileText, AlertTriangle
} from 'lucide-react';

// Mock Data
const INITIAL_PORTFOLIOS = [
  {
    id: '1',
    tip: 'DAIRE',
    tur: 'SATILIK',
    fiyat: 4200000,
    kaparo: 100000,
    depozito: 0,
    il: 'İstanbul',
    ilce: 'Kadıköy',
    mahalle: 'Caferağa',
    gorevliUzman: 'Can Yılmaz',
    gorevliUzmanId: 'uzman-1',
    evSahibiAdi: 'Mehmet Yılmaz',
    evSahibiTelefon: '0533 222 3344',
    durum: 'BOSTA' // BOSTA, RANDEVULAR_MEVCUT, KAPARO_ASAMASINDA, KIRALANDI_SATILDI
  },
  {
    id: '2',
    tip: 'VILLA',
    tur: 'KIRALIK',
    fiyat: 65000,
    kaparo: 130000,
    depozito: 130000,
    il: 'İstanbul',
    ilce: 'Sarıyer',
    mahalle: 'Tarabya',
    gorevliUzman: 'Elif Kaya',
    gorevliUzmanId: 'uzman-2',
    evSahibiAdi: 'Ayşe Kaya',
    evSahibiTelefon: '0532 444 5566',
    durum: 'BOSTA'
  },
  {
    id: '3',
    tip: 'MUSTAKIL',
    tur: 'SATILIK',
    fiyat: 9500000,
    kaparo: 300000,
    depozito: 0,
    il: 'Muğla',
    ilce: 'Bodrum',
    mahalle: 'Yalıkavak',
    gorevliUzman: 'Can Yılmaz',
    gorevliUzmanId: 'uzman-1',
    evSahibiAdi: 'Kemal Arslan',
    evSahibiTelefon: '0535 777 8899',
    durum: 'KAPARO_ASAMASINDA'
  }
];

const INITIAL_EMPLOYEES = [
  { id: '1', ad: 'Can', soyad: 'Yılmaz', eposta: 'can@korfezemlak.com', sozlesmeSayisi: 14, getirdigiPara: 245000 },
  { id: '2', ad: 'Elif', soyad: 'Kaya', eposta: 'elif@korfezemlak.com', sozlesmeSayisi: 8, getirdigiPara: 180000 },
  { id: '3', ad: 'Mert', soyad: 'Demir', eposta: 'mert@korfezemlak.com', sozlesmeSayisi: 5, getirdigiPara: 95000 }
];

const INITIAL_CLIENTS = [
  { id: '1', ad: 'Murat', soyad: 'Demir', telefon: '0505 123 4567', butce: 3500000, tip: 'DAIRE' },
  { id: '2', ad: 'Zeynep', soyad: 'Öztürk', telefon: '0543 987 6543', butce: 75000, tip: 'VILLA' }
];

export default function App() {
  // Application State
  const [currentRole, setCurrentRole] = useState<'UZMAN' | 'YETKILI'>('UZMAN');
  const [currentUser] = useState({ id: 'uzman-1', ad: 'Can', soyad: 'Yılmaz' }); // Mock Logged in Agent
  const [activeTab, setActiveTab] = useState<'portfolios' | 'calculator' | 'appointments' | 'settings'>('portfolios');
  
  // Portfolios
  const [portfolios, setPortfolios] = useState(INITIAL_PORTFOLIOS);
  const [selectedPortfolio, setSelectedPortfolio] = useState<typeof INITIAL_PORTFOLIOS[0] | null>(null);
  
  // Commission Settings
  const [commSettings, setCommSettings] = useState({
    aOfis: 40,
    aDanisman: 60,
    bOfis: 40,
    bPortfoySahibi: 30,
    bMusteriGetiren: 30,
    cDisOrtak: 50,
    cOfis: 40,
    cDanisman: 60
  });

  // Commission Calculator State
  const [calcScenario, setCalcScenario] = useState<'A' | 'B' | 'C'>('A');
  const [grossCommission, setGrossCommission] = useState<number>(100000);

  // Employees & Limits
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [packageType, setPackageType] = useState<'BASIC' | 'PREMIUM'>('BASIC');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [empError, setEmpError] = useState<string | null>(null);

  // Appointments
  const [appointments, setAppointments] = useState([
    { id: '1', portfoyId: '1', portfoyTip: 'DAIRE', talepEden: 'Elif Kaya', musteri: 'Zeynep Öztürk', zaman: '2026-07-25 14:00', durum: 'APPROVED' },
    { id: '2', portfoyId: '2', portfoyTip: 'VILLA', talepEden: 'Can Yılmaz', musteri: 'Murat Demir', zaman: '2026-07-26 11:30', durum: 'PENDING' }
  ]);
  const [selectedMusteriId, setSelectedMusteriId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  
  // Clients (Musteriler)
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Calculations
  const calculateCommissionResult = () => {
    const K = grossCommission;
    if (calcScenario === 'A') {
      const ofis = (K * commSettings.aOfis) / 100;
      const danisman = (K * commSettings.aDanisman) / 100;
      return { ofis, danisman, disOrtak: 0, portfoySahibi: 0, musteriGetiren: 0 };
    } else if (calcScenario === 'B') {
      const ofis = (K * commSettings.bOfis) / 100;
      const portfoySahibi = (K * commSettings.bPortfoySahibi) / 100;
      const musteriGetiren = (K * commSettings.bMusteriGetiren) / 100;
      return { ofis, danisman: 0, disOrtak: 0, portfoySahibi, musteriGetiren };
    } else {
      const disOrtak = (K * commSettings.cDisOrtak) / 100;
      const kalan = K - disOrtak;
      const ofis = (kalan * commSettings.cOfis) / 100;
      const danisman = (kalan * commSettings.cDanisman) / 100;
      return { ofis, danisman, disOrtak, portfoySahibi: 0, musteriGetiren: 0 };
    }
  };

  const calcResults = calculateCommissionResult();

  // Employee Add Handler with subscription check
  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setEmpError(null);

    // Limit check
    if (packageType === 'BASIC' && employees.length >= 4) {
      setEmpError("Paket limitinize ulaştınız (BASIC pakette maksimum 4 çalışan kaydedilebilir). Lütfen Premium pakete yükseltin.");
      return;
    }

    if (newEmpName && newEmpEmail) {
      const [ad, ...soyadParts] = newEmpName.split(' ');
      const soyad = soyadParts.join(' ') || '';
      const newEmp = {
        id: String(employees.length + 1),
        ad,
        soyad,
        eposta: newEmpEmail,
        sozlesmeSayisi: 0,
        getirdigiPara: 0
      };
      setEmployees([...employees, newEmp]);
      setNewEmpName('');
      setNewEmpEmail('');
    }
  };

  // Client add handler
  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClientName && newClientPhone) {
      const newClient = {
        id: String(clients.length + 1),
        ad: newClientName,
        soyad: '',
        telefon: newClientPhone,
        butce: 2000000,
        tip: 'DAIRE'
      };
      setClients([...clients, newClient]);
      setNewClientName('');
      setNewClientPhone('');
    }
  };

  // Appointment Request Handler
  const handleRequestAppointment = (portfolio: typeof INITIAL_PORTFOLIOS[0]) => {
    if (!selectedMusteriId || !selectedDate) {
      alert("Lütfen bir müşteri ve randevu zamanı seçiniz.");
      return;
    }

    if (portfolio.durum === 'KAPARO_ASAMASINDA' || portfolio.durum === 'KIRALANDI_SATILDI') {
      alert("Bu portföy kaparo aşamasında veya satıldığı için randevu alınamaz.");
      return;
    }

    const clientObj = clients.find(c => c.id === selectedMusteriId);
    const newApp = {
      id: String(appointments.length + 1),
      portfoyId: portfolio.id,
      portfoyTip: portfolio.tip,
      talepEden: `${currentUser.ad} ${currentUser.soyad}`,
      musteri: clientObj ? `${clientObj.ad} ${clientObj.soyad}` : 'Bilinmeyen Müşteri',
      zaman: selectedDate,
      durum: 'PENDING'
    };

    setAppointments([...appointments, newApp]);
    setSelectedDate('');
    alert("Randevu talebi portföy sahibine iletildi (Beklemede/Pending durumunda).");
  };

  // Update Appointment Status
  const handleUpdateAppStatus = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setAppointments(appointments.map(app => {
      if (app.id === id) {
        if (newStatus === 'APPROVED') {
          // Check clash
          const clash = appointments.some(a => a.portfoyId === app.portfoyId && a.zaman === app.zaman && a.durum === 'APPROVED');
          if (clash) {
            alert("HATA: Aynı saat diliminde onaylanmış başka bir randevu mevcut! Çakışma engellendi.");
            return app;
          }
        }
        if (newStatus === 'REJECTED') {
          alert(`Teklif reddedildi. Teklif sahibine bildirim gönderildi!`);
        }
        return { ...app, durum: newStatus };
      }
      return app;
    }));
  };

  return (
    <div>
      {/* Premium Header */}
      <header className="app-header">
        <div className="logo-container">
          <svg className="logo-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          HOMEY
        </div>

        {/* User Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button 
              className={`btn btn-secondary`} 
              style={{ padding: '0.4rem 1rem', background: currentRole === 'UZMAN' ? 'var(--primary-light)' : 'transparent', color: currentRole === 'UZMAN' ? 'var(--primary)' : 'var(--text-secondary)', border: 'none', fontWeight: 600 }}
              onClick={() => { setCurrentRole('UZMAN'); setSelectedPortfolio(null); }}
            >
              Uzman Paneli
            </button>
            <button 
              className={`btn btn-secondary`} 
              style={{ padding: '0.4rem 1rem', background: currentRole === 'YETKILI' ? 'var(--primary-light)' : 'transparent', color: currentRole === 'YETKILI' ? 'var(--primary)' : 'var(--text-secondary)', border: 'none', fontWeight: 600 }}
              onClick={() => { setCurrentRole('YETKILI'); setSelectedPortfolio(null); }}
            >
              Yetkili (Broker)
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <Shield size={16} stroke="var(--primary)" />
            <span>{currentRole === 'YETKILI' ? 'Ahmet Körfez (Broker)' : 'Can Yılmaz (Uzman)'}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="app-container">
        
        {/* Navigation Tabs */}
        <div className="tab-navigation">
          <button className={`tab-btn ${activeTab === 'portfolios' ? 'active' : ''}`} onClick={() => setActiveTab('portfolios')}>
            <Home size={16} style={{ marginRight: 6 }} /> Portföyler
          </button>
          <button className={`tab-btn ${activeTab === 'calculator' ? 'active' : ''}`} onClick={() => setActiveTab('calculator')}>
            <Calculator size={16} style={{ marginRight: 6 }} /> Komisyon Hesaplayıcı
          </button>
          <button className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
            <Calendar size={16} style={{ marginRight: 6 }} /> Randevular
          </button>
          {currentRole === 'YETKILI' && (
            <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              <Users size={16} style={{ marginRight: 6 }} /> Çalışan & Ayarlar
            </button>
          )}
        </div>

        {/* Tab 1: Portfolios */}
        {activeTab === 'portfolios' && (
          <div className="grid-layout">
            
            {/* Portfolio List */}
            <div className="card">
              <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building stroke="var(--primary)" /> Ofis Portföy Listesi
              </h2>
              
              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Tip</th>
                      <th>Tür</th>
                      <th>Lokasyon</th>
                      <th>Fiyat</th>
                      <th>Emlakçı</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolios.map(p => (
                      <tr 
                        key={p.id} 
                        style={{ cursor: 'pointer', transition: '0.2s' }} 
                        onClick={() => setSelectedPortfolio(p)}
                      >
                        <td><strong>{p.tip}</strong></td>
                        <td>
                          <span style={{ color: p.tur === 'SATILIK' ? 'var(--accent-pink)' : 'var(--accent-cyan)', fontWeight: 600 }}>
                            {p.tur}
                          </span>
                        </td>
                        <td>{p.il} / {p.ilce}</td>
                        <td>{p.fiyat.toLocaleString('tr-TR')} TL</td>
                        <td>{p.gorevliUzman}</td>
                        <td>
                          <span className={`badge ${
                            p.durum === 'BOSTA' ? 'badge-approved' : 
                            p.durum === 'KAPARO_ASAMASINDA' ? 'badge-pending' : 'badge-rejected'
                          }`}>
                            {p.durum.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Portfolio Details & Appointment Request */}
            <div>
              {selectedPortfolio ? (
                <div className="card" style={{ border: '1px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ color: 'var(--primary)' }}>Portföy Detayı</h2>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setSelectedPortfolio(null)}>
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Tip / Tür:</span> <strong>{selectedPortfolio.tip} - {selectedPortfolio.tur}</strong></div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Lokasyon:</span> <strong>{selectedPortfolio.il} / {selectedPortfolio.ilce} / {selectedPortfolio.mahalle}</strong></div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Fiyat:</span> <strong className="calc-val-accent">{selectedPortfolio.fiyat.toLocaleString('tr-TR')} TL</strong></div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Depozito / Kaparo:</span> <strong>{selectedPortfolio.depozito.toLocaleString('tr-TR')} TL / {selectedPortfolio.kaparo.toLocaleString('tr-TR')} TL</strong></div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Portföy Görevlisi:</span> <strong>{selectedPortfolio.gorevliUzman}</strong></div>
                    
                    {/* Landlord details visibility rule */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Ev Sahibi Bilgisi:</span>
                      {currentRole === 'YETKILI' || selectedPortfolio.gorevliUzmanId === currentUser.id ? (
                        <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          <strong>{selectedPortfolio.evSahibiAdi}</strong> - {selectedPortfolio.evSahibiTelefon}
                        </div>
                      ) : (
                        <div style={{ color: 'var(--status-rejected)', background: 'rgba(239, 68, 68, 0.05)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Lock size={14} />
                          <span>Gizli Veri (Sadece yetkili ve ilgili emlakçı görebilir)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Appointment Request section for agents */}
                  {currentRole === 'UZMAN' && selectedPortfolio.gorevliUzmanId !== currentUser.id && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} stroke="var(--primary)" /> Randevu Teklifi Al
                      </h4>
                      
                      {selectedPortfolio.durum === 'KAPARO_ASAMASINDA' || selectedPortfolio.durum === 'KIRALANDI_SATILDI' ? (
                        <div style={{ color: 'var(--status-rejected)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                          <AlertTriangle size={16} />
                          <span>Bu portföyün durumu nedeniyle randevu alınamaz!</span>
                        </div>
                      ) : (
                        <>
                          <div className="form-group">
                            <label className="form-label">Müşteri Seçin (Alıcı Adayı)</label>
                            <select className="form-select" value={selectedMusteriId} onChange={e => setSelectedMusteriId(e.target.value)}>
                              <option value="">-- Müşteri Seçiniz --</option>
                              {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.ad} {c.soyad} ({c.tip})</option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Tarih & Saat</label>
                            <input type="datetime-local" className="form-input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                          </div>

                          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleRequestAppointment(selectedPortfolio)}>
                            Randevu Teklifi Gönder
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300, textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Search size={48} stroke="var(--border-color)" style={{ marginBottom: '1rem' }} />
                  <p>Detayları görüntülemek ve randevu teklif etmek için listeden bir portföy seçin.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 2: Commission Calculator */}
        {activeTab === 'calculator' && (
          <div className="grid-layout">
            
            {/* Input & Selector Card */}
            <div className="card">
              <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calculator stroke="var(--primary)" /> Dinamik Komisyon Hesaplayıcı
              </h2>
              
              <div className="form-group">
                <label className="form-label">Brüt Komisyon Bedeli (TL)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={grossCommission} 
                    onChange={e => setGrossCommission(Number(e.target.value))} 
                    style={{ paddingLeft: '2.25rem' }}
                  />
                  <DollarSign size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-secondary)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Paylaşım Senaryosu Seçin</label>
                <select className="form-select" value={calcScenario} onChange={e => setCalcScenario(e.target.value as any)}>
                  <option value="A">Senaryo A - Kendi Müşterisi (Ofis vs Danışman)</option>
                  <option value="B">Senaryo B - Ortak Çalışma (Ofis vs Portföy Sahibi vs Müşteri Getiren)</option>
                  <option value="C">Senaryo C - Dış Emlakçı ile Ortak Çalışma (%50 Dış Ortak)</option>
                </select>
              </div>

              {/* Dynamic Explanation Text based on Selected Scenario */}
              <div style={{ background: 'var(--primary-light)', border: '1px solid rgba(99,102,241,0.2)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {calcScenario === 'A' && (
                  <p>💡 <strong>Senaryo A:</strong> Portföy ve alıcı adayı aynı gayrimenkul uzmanına aittir. Brüt komisyondan Yetkilinin belirlediği <strong>%{commSettings.aOfis} Ofis Payı</strong> düşüldükten sonra kalanın tamamı size kalır.</p>
                )}
                {calcScenario === 'B' && (
                  <p>💡 <strong>Senaryo B:</strong> Ofis içi iki uzmanın ortak çalışması. Portföyü bulan danışman ile müşteriyi getiren danışman komisyonu Yetkilinin belirlediği oranlarda (Ofis: <strong>%{commSettings.bOfis}</strong>, Portföy Sahibi: <strong>%{commSettings.bPortfoySahibi}</strong>, Müşteri Getiren: <strong>%{commSettings.bMusteriGetiren}</strong>) paylaşır.</p>
                )}
                {calcScenario === 'C' && (
                  <p>💡 <strong>Senaryo C:</strong> Dış emlakçı ile paylaşım. Toplam komisyonun <strong>%{commSettings.cDisOrtak}</strong>'ı doğrudan dış ortağa aktarılır. Kalan %50 içinden <strong>%{commSettings.cOfis} Ofis Payı</strong> ve <strong>%{commSettings.cDanisman} Danışman Payı</strong> hesaplanır.</p>
                )}
              </div>
            </div>

            {/* Calculations Result View */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Percent stroke="var(--accent-cyan)" /> Dağılım Sonuçları
                </h3>
                
                <div className="calc-result-box">
                  <div className="calc-row">
                    <span>Brüt Komisyon Tutarı:</span>
                    <span className="calc-val-bold">{grossCommission.toLocaleString('tr-TR')} TL</span>
                  </div>
                  
                  {calcScenario === 'A' && (
                    <>
                      <div className="calc-row">
                        <span>Ofis Payı (%{commSettings.aOfis}):</span>
                        <span>{calcResults.ofis.toLocaleString('tr-TR')} TL</span>
                      </div>
                      <div className="calc-row" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                        <span style={{ fontWeight: 600 }}>Danışman Hakedişi (%{commSettings.aDanisman}):</span>
                        <span className="calc-val-accent">{calcResults.danisman.toLocaleString('tr-TR')} TL</span>
                      </div>
                    </>
                  )}

                  {calcScenario === 'B' && (
                    <>
                      <div className="calc-row">
                        <span>Ofis Payı (%{commSettings.bOfis}):</span>
                        <span>{calcResults.ofis.toLocaleString('tr-TR')} TL</span>
                      </div>
                      <div className="calc-row">
                        <span>Portföy Sahibi Danışman Payı (%{commSettings.bPortfoySahibi}):</span>
                        <span>{calcResults.portfoySahibi.toLocaleString('tr-TR')} TL</span>
                      </div>
                      <div className="calc-row" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                        <span style={{ fontWeight: 600 }}>Müşteriyi Getiren Danışman Payı (%{commSettings.bMusteriGetiren}):</span>
                        <span className="calc-val-accent">{calcResults.musteriGetiren.toLocaleString('tr-TR')} TL</span>
                      </div>
                    </>
                  )}

                  {calcScenario === 'C' && (
                    <>
                      <div className="calc-row">
                        <span>Dış Emlakçı Payı (%{commSettings.cDisOrtak}):</span>
                        <span>{calcResults.disOrtak.toLocaleString('tr-TR')} TL</span>
                      </div>
                      <div className="calc-row">
                        <span>Kalan Pay (İç Bölüşüm İçin):</span>
                        <span>{(grossCommission - calcResults.disOrtak).toLocaleString('tr-TR')} TL</span>
                      </div>
                      <div className="calc-row">
                        <span>Ofis Payı (%{commSettings.cOfis}):</span>
                        <span>{calcResults.ofis.toLocaleString('tr-TR')} TL</span>
                      </div>
                      <div className="calc-row" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                        <span style={{ fontWeight: 600 }}>Danışman Hakedişi (%{commSettings.cDanisman}):</span>
                        <span className="calc-val-accent">{calcResults.danisman.toLocaleString('tr-TR')} TL</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                * Not: Bu oranlar Yetkili (Broker) tarafından sistem ayarlarında dinamik olarak yapılandırılmış oranlardır.
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Appointments */}
        {activeTab === 'appointments' && (
          <div className="grid-layout">
            
            {/* Appointments List */}
            <div className="card">
              <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar stroke="var(--primary)" /> Randevu Takvimi & İstekleri
              </h2>
              
              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Portföy</th>
                      <th>Talep Eden</th>
                      <th>Müşteri (Alıcı)</th>
                      <th>Randevu Zamanı</th>
                      <th>Durum</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(app => (
                      <tr key={app.id}>
                        <td><strong>{app.portfoyTip}</strong></td>
                        <td>{app.talepEden}</td>
                        <td>{app.musteri}</td>
                        <td>{app.zaman}</td>
                        <td>
                          <span className={`badge ${
                            app.durum === 'APPROVED' ? 'badge-approved' : 
                            app.durum === 'PENDING' ? 'badge-pending' : 'badge-rejected'
                          }`}>
                            {app.durum}
                          </span>
                        </td>
                        <td>
                          {app.durum === 'PENDING' ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                onClick={() => handleUpdateAppStatus(app.id, 'APPROVED')}
                              >
                                <Check size={14} /> Onayla
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'var(--status-rejected)' }}
                                onClick={() => handleUpdateAppStatus(app.id, 'REJECTED')}
                              >
                                <X size={14} /> Reddet
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>İşlem Yapılamaz</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Clients Management (Musteriler) */}
            <div className="card">
              <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users stroke="var(--accent-cyan)" /> Müşteri Kayıt Modülü (Alıcı Adayları)
              </h2>
              
              <form onSubmit={handleAddClient} style={{ marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Ad Soyad</label>
                  <input type="text" className="form-input" placeholder="Örn: Murat Demir" value={newClientName} onChange={e => setNewClientName(e.target.value)} required />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Telefon Numarası</label>
                  <input type="text" className="form-input" placeholder="Örn: 0505 123 45 67" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} required />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <Plus size={16} /> Yeni Müşteri Kaydet
                </button>
              </form>

              <h4 style={{ marginBottom: '0.5rem' }}>Kayıtlı Müşteri Listesi</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {clients.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <div>
                      <strong>{c.ad} {c.soyad}</strong>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tel: {c.telefon}</span>
                    </div>
                    <span className="badge badge-approved" style={{ alignSelf: 'center' }}>{c.tip}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 4: Settings & Employee Admin (Only for YETKILI) */}
        {activeTab === 'settings' && currentRole === 'YETKILI' && (
          <div className="grid-layout">
            
            {/* Employee Management and Subscription Limit Check */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2>Çalışan Yönetimi</h2>
                
                {/* Subscription Plan Switcher */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: packageType === 'BASIC' ? 'var(--primary-light)' : 'transparent', color: packageType === 'BASIC' ? 'var(--primary)' : 'var(--text-secondary)', border: 'none' }}
                    onClick={() => { setPackageType('BASIC'); setEmpError(null); }}
                  >
                    BASIC (Maks 4)
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: packageType === 'PREMIUM' ? 'var(--primary-light)' : 'transparent', color: packageType === 'PREMIUM' ? 'var(--primary)' : 'var(--text-secondary)', border: 'none' }}
                    onClick={() => { setPackageType('PREMIUM'); setEmpError(null); }}
                  >
                    PREMIUM (Sınırsız)
                  </button>
                </div>
              </div>

              {empError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-rejected)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <AlertTriangle size={24} />
                  <span>{empError}</span>
                </div>
              )}

              <form onSubmit={handleAddEmployee} style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <input type="text" className="form-input" placeholder="Ad Soyad" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} required />
                </div>
                <div style={{ flex: 1 }}>
                  <input type="email" className="form-input" placeholder="E-posta" value={newEmpEmail} onChange={e => setNewEmpEmail(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Ekle
                </button>
              </form>

              <h4 style={{ marginBottom: '0.5rem' }}>Aktif Çalışanlar ({employees.length} Kişi)</h4>
              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Ad Soyad</th>
                      <th>E-posta</th>
                      <th>Sözleşme Sayısı</th>
                      <th>Kazandırdığı Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => (
                      <tr key={emp.id}>
                        <td><strong>{emp.ad} {emp.soyad}</strong></td>
                        <td>{emp.eposta}</td>
                        <td>{emp.sozlesmeSayisi}</td>
                        <td className="calc-val-bold">{emp.getirdigiPara.toLocaleString('tr-TR')} TL</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Broker Commission Settings Dashboard */}
            <div className="card">
              <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Percent stroke="var(--primary)" /> Komisyon Payı Ayarları
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Scenario A setting */}
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Senaryo A (Kendi Müşterisi)</h4>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Ofis Payı (%)</label>
                      <input type="number" className="form-input" value={commSettings.aOfis} onChange={e => setCommSettings({...commSettings, aOfis: Number(e.target.value)})} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Danışman Payı (%)</label>
                      <input type="number" className="form-input" value={commSettings.aDanisman} onChange={e => setCommSettings({...commSettings, aDanisman: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>

                {/* Scenario B setting */}
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Senaryo B (Ortak Çalışma)</h4>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Ofis Payı (%)</label>
                      <input type="number" className="form-input" value={commSettings.bOfis} onChange={e => setCommSettings({...commSettings, bOfis: Number(e.target.value)})} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Portföy Sahibi (%)</label>
                      <input type="number" className="form-input" value={commSettings.bPortfoySahibi} onChange={e => setCommSettings({...commSettings, bPortfoySahibi: Number(e.target.value)})} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Müşteri Getiren (%)</label>
                      <input type="number" className="form-input" value={commSettings.bMusteriGetiren} onChange={e => setCommSettings({...commSettings, bMusteriGetiren: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>

                {/* Scenario C setting */}
                <div>
                  <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Senaryo C (Dış Ortak Paylaşımı)</h4>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Dış Emlakçı (%)</label>
                      <input type="number" className="form-input" value={commSettings.cDisOrtak} onChange={e => setCommSettings({...commSettings, cDisOrtak: Number(e.target.value)})} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Kalandan Ofis (%)</label>
                      <input type="number" className="form-input" value={commSettings.cOfis} onChange={e => setCommSettings({...commSettings, cOfis: Number(e.target.value)})} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Kalandan Danışman (%)</label>
                      <input type="number" className="form-input" value={commSettings.cDanisman} onChange={e => setCommSettings({...commSettings, cDanisman: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
