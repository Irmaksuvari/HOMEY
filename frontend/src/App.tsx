import { useState } from 'react';
import { 
  Calculator, Users, Home, Calendar, DollarSign, 
  Percent, Shield, Plus, Lock, Check, X, Building, 
  Search, AlertTriangle, TrendingUp, Menu, 
  ChevronLeft, LogOut, MapPin, User, Briefcase
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
  { id: '1', ad: 'Can', soyad: 'Yılmaz', eposta: 'can@korfezemlak.com', sozlesmeSayisi: 14, getirdigiPara: 245000, durum: 'Ofiste', listings: 3 },
  { id: '2', ad: 'Elif', soyad: 'Kaya', eposta: 'elif@korfezemlak.com', sozlesmeSayisi: 8, getirdigiPara: 180000, durum: 'Arazide', listings: 5 },
  { id: '3', ad: 'Mert', soyad: 'Demir', eposta: 'mert@korfezemlak.com', sozlesmeSayisi: 5, getirdigiPara: 95000, durum: 'Ofiste', listings: 2 }
];

const INITIAL_CLIENTS = [
  { id: '1', ad: 'Murat', soyad: 'Demir', telefon: '0505 123 4567', butce: 3500000, tip: 'DAIRE' },
  { id: '2', ad: 'Zeynep', soyad: 'Öztürk', telefon: '0543 987 6543', butce: 75000, tip: 'VILLA' }
];

export default function App() {
  // Navigation & Layout States
  const [currentRole, setCurrentRole] = useState<'UZMAN' | 'YETKILI'>('UZMAN');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolios' | 'appointments' | 'clients' | 'calculator' | 'analytics' | 'team' | 'settings'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [currentUser] = useState({ id: 'uzman-1', ad: 'Can', soyad: 'Yılmaz' });

  // Filter tags in top bar
  const [filterTag, setFilterTag] = useState<string>('Tümü');

  // Business Logic States
  const [portfolios] = useState(INITIAL_PORTFOLIOS);
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
    { id: '1', portfoyId: '1', portfoyTip: 'DAIRE', talepEden: 'Elif Kaya', musteri: 'Zeynep Öztürk', zaman: '14:00', tarih: '25 Temmuz', durum: 'APPROVED' },
    { id: '2', portfoyId: '2', portfoyTip: 'VILLA', talepEden: 'Can Yılmaz', musteri: 'Murat Demir', zaman: '11:30', tarih: '26 Temmuz', durum: 'PENDING' }
  ]);
  const [selectedMusteriId, setSelectedMusteriId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  
  // Clients (Musteriler)
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Interactive Mini Calendar States
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(22);
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  // Commission Calculator Handler
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
        getirdigiPara: 0,
        durum: 'Ofiste',
        listings: 0
      };
      setEmployees([...employees, newEmp]);
      setNewEmpName('');
      setNewEmpEmail('');
    }
  };

  // Client Add Handler
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
      zaman: selectedDate.split('T')[1] || '12:00',
      tarih: selectedDate.split('T')[0] || 'Bugün',
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
          const clash = appointments.some(a => a.portfoyId === app.portfoyId && a.zaman === app.zaman && a.tarih === app.tarih && a.durum === 'APPROVED');
          if (clash) {
            alert("HATA: Aynı saat diliminde onaylanmış başka bir randevu mevcut! Çakışma engellendi.");
            return app;
          }
        }
        return { ...app, durum: newStatus };
      }
      return app;
    }));
  };

  // Filter logic for portfolios list
  const filteredPortfolios = portfolios.filter(p => {
    if (filterTag === 'Tümü') return true;
    if (filterTag === 'Satılık' && p.tur === 'SATILIK') return true;
    if (filterTag === 'Kiralık' && p.tur === 'KIRALIK') return true;
    if (filterTag === 'Konut' && (p.tip === 'DAIRE' || p.tip === 'MUSTAKIL' || p.tip === 'VILLA')) return true;
    if (filterTag === 'Arsa' && p.tip === 'ARSA') return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-cream text-charcoal flex font-sans">
      
      {/* 2. LEFT SIDEBAR */}
      <aside className={`bg-charcoal text-white flex flex-col justify-between transition-all duration-300 p-6 z-40 border-r-4 border-charcoal shrink-0 ${
        sidebarCollapsed ? 'w-20' : 'w-72'
      }`}>
        <div className="flex flex-col gap-8">
          {/* Logo / Header */}
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <span className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-pastelYellow via-pastelPink to-pastelBlue bg-clip-text text-transparent">
                HOMEY
              </span>
            )}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded-lg hover:bg-zinc-800 transition-colors text-white ml-auto"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              {!sidebarCollapsed && <span className="text-xs font-bold text-zinc-500 tracking-widest pl-4">GENEL</span>}
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              >
                <Home size={18} />
                {!sidebarCollapsed && <span>Ana Sayfa</span>}
              </button>
              <button 
                onClick={() => setActiveTab('portfolios')} 
                className={`sidebar-link ${activeTab === 'portfolios' ? 'active' : ''}`}
              >
                <Building size={18} />
                {!sidebarCollapsed && <span>Portföyler</span>}
              </button>
              <button 
                onClick={() => setActiveTab('appointments')} 
                className={`sidebar-link ${activeTab === 'appointments' ? 'active' : ''}`}
              >
                <Calendar size={18} />
                {!sidebarCollapsed && <span>Randevular</span>}
              </button>
              <button 
                onClick={() => setActiveTab('clients')} 
                className={`sidebar-link ${activeTab === 'clients' ? 'active' : ''}`}
              >
                <User size={18} />
                {!sidebarCollapsed && <span>Müşteriler</span>}
              </button>
              <button 
                onClick={() => setActiveTab('calculator')} 
                className={`sidebar-link ${activeTab === 'calculator' ? 'active' : ''}`}
              >
                <Calculator size={18} />
                {!sidebarCollapsed && <span>Hesaplayıcı</span>}
              </button>
            </div>

            {/* Admin Management Section */}
            {currentRole === 'YETKILI' && (
              <div className="flex flex-col gap-2">
                {!sidebarCollapsed && <span className="text-xs font-bold text-zinc-500 tracking-widest pl-4">YÖNETİM</span>}
                <button 
                  onClick={() => setActiveTab('analytics')} 
                  className={`sidebar-link ${activeTab === 'analytics' ? 'active' : ''}`}
                >
                  <TrendingUp size={18} />
                  {!sidebarCollapsed && <span>Ciro Raporları</span>}
                </button>
                <button 
                  onClick={() => setActiveTab('team')} 
                  className={`sidebar-link ${activeTab === 'team' ? 'active' : ''}`}
                >
                  <Users size={18} />
                  {!sidebarCollapsed && <span>Danışman Yönetimi</span>}
                </button>
                <button 
                  onClick={() => setActiveTab('settings')} 
                  className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`}
                >
                  <Percent size={18} />
                  {!sidebarCollapsed && <span>Komisyon Ayarları</span>}
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar Footer / Role switch & Logout */}
        <div className="flex flex-col gap-4">
          <div className="border-t border-zinc-800 pt-4 flex flex-col gap-2">
            {!sidebarCollapsed && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-zinc-500 font-semibold">Rol Değiştir:</span>
                <select 
                  className="bg-zinc-800 text-xs text-white p-1 rounded border border-zinc-700"
                  value={currentRole}
                  onChange={(e) => {
                    setCurrentRole(e.target.value as any);
                    if (e.target.value === 'UZMAN' && ['analytics', 'team', 'settings'].includes(activeTab)) {
                      setActiveTab('dashboard');
                    }
                  }}
                >
                  <option value="UZMAN">Uzman (Can)</option>
                  <option value="YETKILI">Yetkili (Ahmet)</option>
                </select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                {currentRole === 'YETKILI' ? 'A' : 'C'}
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-semibold">{currentRole === 'YETKILI' ? 'Ahmet Broker' : 'Can Yılmaz'}</span>
                  <span className="text-xs text-zinc-500 mt-1">{currentRole === 'YETKILI' ? 'Ofis Yetkilisi' : 'Gayrimenkul Uzmanı'}</span>
                </div>
              )}
            </div>
          </div>
          <button className="sidebar-link text-red-400 hover:text-red-300 hover:bg-red-950/20 border-none justify-start">
            <LogOut size={18} />
            {!sidebarCollapsed && <span>Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      {/* 3. MIDDLE MAIN DASHBOARD */}
      <main className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto max-w-[1000px]">
        
        {/* Top greeting bar and filters */}
        <header className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-charcoal">İyi günler, {currentRole === 'YETKILI' ? 'Ahmet' : 'Can'} 👋</h1>
              <p className="text-zinc-500 text-sm mt-1">Bugün ofis genelinde 3 aktif randevu ve 1 bekleyen teklif bulunuyor.</p>
            </div>
            
            {/* Search input in Soft Brutalism style */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Portföy ara..." 
                className="bg-white border-2 border-charcoal rounded-full px-5 py-2 pl-11 text-sm focus:outline-none transition-all w-64"
              />
              <Search size={16} className="absolute left-4 top-3 text-zinc-500" />
            </div>
          </div>

          {/* Pill filters tags */}
          <div className="flex gap-2">
            {['Tümü', 'Satılık', 'Kiralık', 'Konut', 'Arsa'].map((tag) => (
              <button 
                key={tag}
                onClick={() => { setFilterTag(tag); setActiveTab('portfolios'); }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border-2 border-charcoal transition-all ${
                  filterTag === tag 
                    ? 'bg-charcoal text-white shadow-none' 
                    : 'bg-white text-charcoal hover:bg-zinc-50'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </header>

        {/* MAIN TABS SWITCHER */}

        {/* Tab 1: Bento Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            
            {/* Metric Bento Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Active Listings (Pastel Yellow) */}
              <div className="bento-card bg-[#FEF08A]">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-charcoal/60">Aktif Portföyler</span>
                  <Building size={20} className="text-charcoal" />
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-extrabold text-charcoal">{portfolios.length}</span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">+1 Bu hafta</span>
                </div>
                {/* Mini bar chart */}
                <div className="flex items-end gap-1.5 h-12 pt-2">
                  <div className="bg-charcoal w-full rounded-t" style={{ height: '40%' }}></div>
                  <div className="bg-charcoal w-full rounded-t" style={{ height: '60%' }}></div>
                  <div className="bg-charcoal w-full rounded-t" style={{ height: '35%' }}></div>
                  <div className="bg-charcoal w-full rounded-t" style={{ height: '75%' }}></div>
                  <div className="bg-charcoal w-full rounded-t" style={{ height: '90%' }}></div>
                </div>
              </div>

              {/* Card 2: Sales & Revenue summary (Pastel Pink) */}
              <div className="bento-card bg-[#FBCFE8]">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-charcoal/60">Aylık Toplam Ciro</span>
                  <DollarSign size={20} className="text-charcoal" />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-extrabold text-charcoal">520.000 TL</span>
                </div>
                <p className="text-xs text-charcoal/80 mb-2">Ofis Payı: <strong>210.000 TL</strong></p>
                {/* Visual Area Line Chart SVG */}
                <svg className="w-full h-12" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <path d="M0,30 Q25,5 50,20 T100,5 L100,30 L0,30 Z" fill="rgba(17,17,17,0.1)" />
                  <path d="M0,30 Q25,5 50,20 T100,5" fill="none" stroke="#111111" strokeWidth="2" />
                </svg>
              </div>

              {/* Card 3: Upcoming Showings (Pastel Purple) */}
              <div className="bento-card bg-[#E9D5FF]">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-charcoal/60">Bugünkü Randevular</span>
                  <Calendar size={20} className="text-charcoal" />
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-extrabold text-charcoal">
                    {appointments.filter(a => a.durum === 'APPROVED').length} Onaylı
                  </span>
                </div>
                <div className="text-xs text-charcoal/80 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    <span>14:00 - Caferağa Mah. Daire Gösterimi</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-charcoal/50">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    <span>11:30 - Sarıyer (Onay Bekliyor)</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Middle Section: Top Real Estate Agents */}
            <div className="bento-card bg-white">
              <h3 className="text-xl font-extrabold text-charcoal mb-4 flex items-center gap-2">
                <Users stroke="var(--primary)" /> Danışman Durumları & Ciro Performansı
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {employees.map(emp => (
                  <div 
                    key={emp.id}
                    className="rounded-2xl p-4 bg-cream flex flex-col justify-between shadow-none border-none"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2.5 items-center">
                        <div className="w-10 h-10 rounded-full bg-pastelPurple border-2 border-charcoal flex items-center justify-center font-bold text-xs">
                          {emp.ad[0]}{emp.soyad[0]}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm">{emp.ad} {emp.soyad}</h4>
                          <span className="text-xs text-zinc-500">{emp.listings} Aktif Portföy</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-charcoal uppercase ${
                        emp.durum === 'Ofiste' ? 'bg-pastelGreen' : 'bg-pastelYellow'
                      }`}>
                        {emp.durum}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-charcoal/10 flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Kazanılan Ciro:</span>
                      <strong className="text-charcoal font-bold">{emp.getirdigiPara.toLocaleString('tr-TR')} TL</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Data Table: Recent listings */}
            <div className="bento-card bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-extrabold text-charcoal">Son Eklenen Portföyler</h3>
                <button 
                  onClick={() => setActiveTab('portfolios')}
                  className="text-xs font-bold text-charcoal underline hover:text-black"
                >
                  Tümünü Gör
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-charcoal text-xs font-extrabold text-zinc-500 uppercase">
                      <th className="pb-3">Tip / Tür</th>
                      <th className="pb-3">Lokasyon</th>
                      <th className="pb-3 text-right">Fiyat</th>
                      <th className="pb-3">Görevli</th>
                      <th className="pb-3 text-right">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolios.slice(0, 3).map(p => (
                      <tr 
                        key={p.id} 
                        onClick={() => { setSelectedPortfolio(p); setActiveTab('portfolios'); }}
                        className="border-b border-zinc-100 text-sm hover:bg-cream/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5">
                          <strong className="font-extrabold">{p.tip}</strong> 
                          <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full border border-charcoal ${
                            p.tur === 'SATILIK' ? 'bg-pastelPink' : 'bg-pastelBlue'
                          }`}>
                            {p.tur}
                          </span>
                        </td>
                        <td className="py-3.5 text-zinc-500">{p.il} / {p.ilce}</td>
                        <td className="py-3.5 text-right font-extrabold">{p.fiyat.toLocaleString('tr-TR')} TL</td>
                        <td className="py-3.5 font-medium">{p.gorevliUzman}</td>
                        <td className="py-3.5 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-charcoal ${
                            p.durum === 'BOSTA' ? 'bg-pastelGreen text-emerald-900' :
                            p.durum === 'KAPARO_ASAMASINDA' ? 'bg-pastelYellow text-amber-950' : 'bg-zinc-200 text-zinc-800'
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

          </div>
        )}

        {/* Tab 2: Portfolios Tab */}
        {activeTab === 'portfolios' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Portfolios list */}
            <div className="bento-card bg-white">
              <h2 className="text-2xl font-extrabold mb-4">Portföy Yönetimi ({filterTag} Filtreli)</h2>
              <div className="flex flex-col gap-3">
                {filteredPortfolios.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => setSelectedPortfolio(p)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all flex justify-between items-center border-none ${
                      selectedPortfolio?.id === p.id 
                        ? 'bg-[#FEF08A]' 
                        : 'bg-cream hover:bg-white shadow-none'
                    }`}
                  >
                    <div>
                      <div className="flex gap-2 items-center">
                        <strong className="text-md font-bold">{p.tip}</strong>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 border border-charcoal rounded-full uppercase ${
                          p.tur === 'SATILIK' ? 'bg-pastelPink' : 'bg-pastelBlue'
                        }`}>
                          {p.tur}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                        <MapPin size={12} /> {p.il} / {p.ilce} - {p.mahalle}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-sm">{p.fiyat.toLocaleString('tr-TR')} TL</div>
                      <span className="text-[10px] text-zinc-500 font-medium">Uzman: {p.gorevliUzman}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio Details Card */}
            <div>
              {selectedPortfolio ? (
                <div className="bento-card bg-white">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Seçili Portföy Detayı</span>
                      <h2 className="text-2xl font-extrabold text-charcoal mt-1">{selectedPortfolio.tip} - {selectedPortfolio.tur}</h2>
                    </div>
                    <button className="p-1 border border-charcoal rounded-full hover:bg-zinc-100" onClick={() => setSelectedPortfolio(null)}>
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-4 text-sm mb-6">
                    <div className="flex justify-between py-2 border-b border-charcoal/10">
                      <span className="text-zinc-500">Konum Bilgisi:</span>
                      <strong className="font-bold">{selectedPortfolio.il} / {selectedPortfolio.ilce} / {selectedPortfolio.mahalle} Mah.</strong>
                    </div>
                    <div className="flex justify-between py-2 border-b border-charcoal/10">
                      <span className="text-zinc-500">Fiyat:</span>
                      <strong className="font-extrabold text-indigo-700">{selectedPortfolio.fiyat.toLocaleString('tr-TR')} TL</strong>
                    </div>
                    <div className="flex justify-between py-2 border-b border-charcoal/10">
                      <span className="text-zinc-500">Kaparo / Depozito:</span>
                      <strong className="font-semibold">{selectedPortfolio.kaparo.toLocaleString('tr-TR')} TL / {selectedPortfolio.depozito.toLocaleString('tr-TR')} TL</strong>
                    </div>
                    <div className="flex justify-between py-2 border-b border-charcoal/10">
                      <span className="text-zinc-500">Portföy Danışmanı:</span>
                      <strong className="font-semibold">{selectedPortfolio.gorevliUzman}</strong>
                    </div>
                    
                    {/* Landlord details privacy checks */}
                    <div className="mt-4 p-4 rounded-2xl bg-cream border-none">
                      <span className="text-xs text-zinc-500 font-bold block mb-2">Ev Sahibi (Landlord) İletişim Bilgileri:</span>
                      {currentRole === 'YETKILI' || selectedPortfolio.gorevliUzmanId === currentUser.id ? (
                        <div className="flex flex-col gap-1">
                          <strong className="text-sm font-extrabold">{selectedPortfolio.evSahibiAdi}</strong>
                          <span className="text-xs text-zinc-600">{selectedPortfolio.evSahibiTelefon}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-700 text-xs font-semibold">
                          <Lock size={14} />
                          <span>Gizli Veri (Sadece yetkili ve ilgili uzman görebilir)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Appointment Form (only for specialists on colleague's portfolio) */}
                  {currentRole === 'UZMAN' && selectedPortfolio.gorevliUzmanId !== currentUser.id && (
                    <div className="p-4 rounded-2xl bg-pastelPurple/20 border-none">
                      <h4 className="font-extrabold text-sm mb-3 flex items-center gap-2">
                        <Calendar size={16} /> Randevu Teklifi Gönder
                      </h4>
                      
                      {selectedPortfolio.durum === 'KAPARO_ASAMASINDA' || selectedPortfolio.durum === 'KIRALANDI_SATILDI' ? (
                        <div className="flex items-center gap-1.5 text-xs text-red-700 font-medium">
                          <AlertTriangle size={14} />
                          <span>Bu portföyün durumundan dolayı randevu alınamaz!</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div>
                            <label className="text-xs text-zinc-600 font-semibold block mb-1">Katılacak Müşteriniz</label>
                            <select className="w-full text-xs p-2 border-2 border-charcoal rounded-full bg-white" value={selectedMusteriId} onChange={e => setSelectedMusteriId(e.target.value)}>
                              <option value="">-- Alıcı Adayı Seçin --</option>
                              {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.ad} ({c.tip})</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="text-xs text-zinc-600 font-semibold block mb-1">Tarih & Saat</label>
                            <input type="datetime-local" className="w-full text-xs p-2 border-2 border-charcoal rounded-full bg-white" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                          </div>

                          <button className="w-full py-2 bg-charcoal text-white text-xs font-extrabold rounded-full hover:bg-black transition-colors" onClick={() => handleRequestAppointment(selectedPortfolio)}>
                            Teklifi İlet
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ) : (
                <div className="bento-card bg-white flex flex-col items-center justify-center min-h-[300px] text-zinc-400">
                  <Search size={36} className="mb-2" />
                  <p className="text-xs font-semibold">Görüntülemek için listeden bir portföy seçin.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 3: Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="bento-card bg-white">
            <h2 className="text-2xl font-extrabold mb-4">Gelen Randevu Talepleri</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-charcoal text-xs font-extrabold text-zinc-500 uppercase">
                    <th className="pb-3">Portföy</th>
                    <th className="pb-3">Talep Eden</th>
                    <th className="pb-3">Müşteri</th>
                    <th className="pb-3">Zaman</th>
                    <th className="pb-3 text-center">Durum</th>
                    <th className="pb-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(app => (
                    <tr key={app.id} className="border-b border-zinc-100 text-sm">
                      <td className="py-4"><strong>{app.portfoyTip}</strong></td>
                      <td className="py-4">{app.talepEden}</td>
                      <td className="py-4 font-medium">{app.musteri}</td>
                      <td className="py-4 text-zinc-500">{app.tarih} - {app.zaman}</td>
                      <td className="py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border border-charcoal uppercase ${
                          app.durum === 'APPROVED' ? 'bg-pastelGreen text-emerald-950' : 
                          app.durum === 'PENDING' ? 'bg-pastelYellow text-amber-950' : 'bg-pastelPink text-red-950'
                        }`}>
                          {app.durum}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {app.durum === 'PENDING' ? (
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => handleUpdateAppStatus(app.id, 'APPROVED')}
                              className="px-3 py-1 bg-pastelGreen border border-charcoal rounded-full text-[11px] font-extrabold hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                            >
                              Onayla
                            </button>
                            <button 
                              onClick={() => handleUpdateAppStatus(app.id, 'REJECTED')}
                              className="px-3 py-1 bg-pastelPink border border-charcoal rounded-full text-[11px] font-extrabold hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                            >
                              Reddet
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 font-medium">Tamamlandı</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Clients Tab */}
        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bento-card bg-white">
              <h2 className="text-2xl font-extrabold mb-4">Müşterilerim (Alıcı Adayları)</h2>
              <div className="flex flex-col gap-3">
                {clients.map(c => (
                  <div key={c.id} className="p-4 rounded-2xl bg-cream flex justify-between items-center shadow-none">
                    <div>
                      <strong className="font-extrabold text-sm block">{c.ad} {c.soyad}</strong>
                      <span className="text-xs text-zinc-500">Telefon: {c.telefon}</span>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-pastelYellow">
                      {c.tip}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bento-card bg-white">
              <h2 className="text-xl font-extrabold mb-4">Yeni Alıcı Adayı Ekle</h2>
              <form onSubmit={handleAddClient} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 block mb-1">Ad Soyad</label>
                  <input 
                    type="text" 
                    className="w-full text-sm p-3 rounded-2xl bg-zinc-50" 
                    placeholder="Örn: Murat Demir"
                    value={newClientName}
                    onChange={e => setNewClientName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 block mb-1">Telefon Numarası</label>
                  <input 
                    type="text" 
                    className="w-full text-sm p-3 rounded-2xl bg-zinc-50" 
                    placeholder="Örn: 0505 123 45 67"
                    value={newClientPhone}
                    onChange={e => setNewClientPhone(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-charcoal text-white font-extrabold rounded-full hover:bg-black transition-colors shadow-none">
                  Müşteriyi Kaydet
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 5: Calculator Tab */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bento-card bg-white">
              <h2 className="text-2xl font-extrabold mb-4">Komisyon Payı Hesaplama</h2>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 block mb-1">Brüt Komisyon Bedeli (TL)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="w-full text-sm p-3 rounded-2xl pl-10 bg-zinc-50" 
                      value={grossCommission}
                      onChange={e => setGrossCommission(Number(e.target.value))}
                    />
                    <DollarSign size={16} className="absolute left-3.5 top-4 text-zinc-400" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 block mb-1">Çalışma Senaryosu</label>
                  <select 
                    className="w-full text-sm p-3 rounded-2xl bg-zinc-50"
                    value={calcScenario}
                    onChange={e => setCalcScenario(e.target.value as any)}
                  >
                    <option value="A">Senaryo A - Kendi Müşterisi</option>
                    <option value="B">Senaryo B - Ortak Çalışma (Ofis İçi)</option>
                    <option value="C">Senaryo C - Dış Ortaklı Paylaşım</option>
                  </select>
                </div>

                {/* Scenario details text */}
                <div className="p-4 rounded-2xl bg-pastelPurple/20 text-xs flex flex-col gap-1.5 leading-relaxed">
                  {calcScenario === 'A' && (
                    <p>💡 **Senaryo A:** Portföy de alıcı da size aittir. Brüt komisyondan Yetkili tarafından belirlenen **%{commSettings.aOfis} Ofis Payı** kesildikten sonra kalanın tamamı (%{commSettings.aDanisman}) sizin hakedişinizdir.</p>
                  )}
                  {calcScenario === 'B' && (
                    <p>💡 **Senaryo B:** Ofis içi iş ortaklığı. Komisyon oranları: Ofis **%{commSettings.bOfis}**, Portföyü getiren danışman **%{commSettings.bPortfoySahibi}**, Müşteriyi getiren danışman **%{commSettings.bMusteriGetiren}**.</p>
                  )}
                  {calcScenario === 'C' && (
                    <p>💡 **Senaryo C:** Dış emlakçıyla ortak çalışma. Toplam komisyonun **%{commSettings.cDisOrtak}**'ı doğrudan dış ortağa ödenir. Kalan %50 içinden ofis payı **%{commSettings.cOfis}** ve sizin payınız **%{commSettings.cDanisman}** hesaplanır.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Results views */}
            <div className="bento-card bg-white flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-extrabold mb-4">Paylaşım Sonuçları</h3>
                
                <div className="p-4 rounded-2xl bg-cream flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-200">
                    <span>Toplam Komisyon:</span>
                    <strong className="font-extrabold">{grossCommission.toLocaleString('tr-TR')} TL</strong>
                  </div>
                  
                  {calcScenario === 'A' && (
                    <>
                      <div className="flex justify-between items-center text-xs">
                        <span>Ofis Payı (%{commSettings.aOfis}):</span>
                        <strong className="font-bold">{calcResults.ofis.toLocaleString('tr-TR')} TL</strong>
                      </div>
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-charcoal/10">
                        <span className="font-bold">Hakedişiniz (%{commSettings.aDanisman}):</span>
                        <strong className="font-extrabold text-indigo-700">{calcResults.danisman.toLocaleString('tr-TR')} TL</strong>
                      </div>
                    </>
                  )}

                  {calcScenario === 'B' && (
                    <>
                      <div className="flex justify-between items-center text-xs">
                        <span>Ofis Payı (%{commSettings.bOfis}):</span>
                        <strong className="font-bold">{calcResults.ofis.toLocaleString('tr-TR')} TL</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span>Portföy Getiren Danışman (%{commSettings.bPortfoySahibi}):</span>
                        <strong className="font-bold">{calcResults.portfoySahibi.toLocaleString('tr-TR')} TL</strong>
                      </div>
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-charcoal/10">
                        <span className="font-bold">Müşteri Getiren Danışman (%{commSettings.bMusteriGetiren}):</span>
                        <strong className="font-extrabold text-indigo-700">{calcResults.musteriGetiren.toLocaleString('tr-TR')} TL</strong>
                      </div>
                    </>
                  )}

                  {calcScenario === 'C' && (
                    <>
                      <div className="flex justify-between items-center text-xs">
                        <span>Dış Ortak Payı (%{commSettings.cDisOrtak}):</span>
                        <strong className="font-bold">{calcResults.disOrtak.toLocaleString('tr-TR')} TL</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span>Kalan Pay (İç Bölüşüm):</span>
                        <strong className="font-bold">{(grossCommission - calcResults.disOrtak).toLocaleString('tr-TR')} TL</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span>Ofis Payı (%{commSettings.cOfis} of remaining):</span>
                        <strong className="font-bold">{calcResults.ofis.toLocaleString('tr-TR')} TL</strong>
                      </div>
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-charcoal/10">
                        <span className="font-bold">Hakedişiniz (%{commSettings.cDanisman} of remaining):</span>
                        <strong className="font-extrabold text-indigo-700">{calcResults.danisman.toLocaleString('tr-TR')} TL</strong>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-zinc-500 leading-relaxed border-t border-charcoal/10 pt-4 mt-4">
                * Bu oranlar Yetkili (Broker) tarafından belirlenen oranlar üzerinden dinamik hesaplanır.
              </div>
            </div>

          </div>
        )}

        {/* Tab 6: Office Analytics (YETKILI only) */}
        {activeTab === 'analytics' && currentRole === 'YETKILI' && (
          <div className="bento-card bg-white">
            <h2 className="text-2xl font-extrabold mb-4">Ofis Finansal Raporları</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="p-5 bg-[#FBCFE8] rounded-2xl shadow-none border-none">
                <span className="text-xs uppercase font-extrabold text-charcoal/60">Yıllık Toplam Hacim</span>
                <h3 className="text-3xl font-extrabold mt-1">4.820.000 TL</h3>
                <p className="text-xs text-charcoal/80 mt-2">Bu ciro ofisteki gayrimenkul uzmanlarının ortak başarıları ile elde edilmiştir.</p>
              </div>

              <div className="p-5 bg-[#BAE6FD] rounded-2xl shadow-none border-none">
                <span className="text-xs uppercase font-extrabold text-charcoal/60">Ofis Net Geliri</span>
                <h3 className="text-3xl font-extrabold mt-1">1.928.000 TL</h3>
                <p className="text-xs text-charcoal/80 mt-2">Komisyon bölüşüm senaryolarından ofise kalan net payı ifade eder.</p>
              </div>

            </div>
          </div>
        )}

        {/* Tab 7: Team / Consultant Management (YETKILI only) */}
        {activeTab === 'team' && currentRole === 'YETKILI' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bento-card bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-extrabold">Ofis Çalışan Yönetimi</h2>
                <span className={`px-3 py-1 border border-charcoal rounded-full text-xs font-bold ${
                  packageType === 'BASIC' ? 'bg-pastelYellow' : 'bg-pastelGreen'
                }`}>
                  Paket: {packageType}
                </span>
              </div>

              {empError && (
                <div className="p-4 border-2 border-charcoal rounded-2xl bg-red-100 text-red-900 text-xs font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  <span>{empError}</span>
                </div>
              )}

              {/* Add Employee Form */}
              <form onSubmit={handleAddEmployee} className="flex flex-col gap-3 mb-6">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ad Soyad"
                    className="flex-1 text-xs p-2 border-2 border-charcoal rounded-full bg-cream"
                    value={newEmpName}
                    onChange={e => setNewEmpName(e.target.value)}
                    required
                  />
                  <input 
                    type="email" 
                    placeholder="E-posta"
                    className="flex-1 text-xs p-2 border-2 border-charcoal rounded-full bg-cream"
                    value={newEmpEmail}
                    onChange={e => setNewEmpEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="py-2.5 bg-charcoal text-white text-xs font-bold rounded-full hover:bg-black transition-all shadow-none">
                  Yeni Çalışan Ekle
                </button>
              </form>

              {/* Active Consultants list */}
              <h4 className="font-extrabold text-sm mb-3">Aktif Danışmanlar ({employees.length} / 4)</h4>
              <div className="flex flex-col gap-2">
                {employees.map(emp => (
                  <div key={emp.id} className="p-3 rounded-xl bg-cream flex justify-between items-center text-xs border-none">
                    <div>
                      <strong>{emp.ad} {emp.soyad}</strong>
                      <span className="block text-zinc-500 mt-0.5">{emp.eposta}</span>
                    </div>
                    <div className="text-right">
                      <strong>{emp.getirdigiPara.toLocaleString('tr-TR')} TL</strong>
                      <span className="block text-[10px] text-zinc-400 mt-0.5">{emp.sozlesmeSayisi} Sözleşme</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Package details / Subscription */}
            <div className="bento-card bg-white flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-extrabold mb-3">Abonelik & Lisans Yönetimi</h3>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">BASIC plan dahilinde en fazla 4 gayrimenkul uzmanı ekleyebilirsiniz. PREMIUM planda ise herhangi bir lisans sınırlaması bulunmamaktadır.</p>
                
                <div className="p-4 rounded-2xl bg-cream flex flex-col gap-3 text-xs mb-4 border-none">
                  <div className="flex justify-between items-center">
                    <span>Mevcut Lisans Durumu:</span>
                    <strong className="font-extrabold">{employees.length} / 4 Kullanıcı</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Abonelik Dönemi:</span>
                    <strong className="font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">Yıllık Abonelik</strong>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => { setPackageType('BASIC'); setEmpError(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all border-none ${
                    packageType === 'BASIC' ? 'bg-[#FEF08A]' : 'bg-white hover:bg-zinc-50'
                  }`}
                >
                  BASIC Paket
                </button>
                <button 
                  onClick={() => { setPackageType('PREMIUM'); setEmpError(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all border-none ${
                    packageType === 'PREMIUM' ? 'bg-pastelGreen' : 'bg-white hover:bg-zinc-50'
                  }`}
                >
                  PREMIUM Paket
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Tab 8: Commission settings (YETKILI only) */}
        {activeTab === 'settings' && currentRole === 'YETKILI' && (
          <div className="bento-card bg-white">
            <h2 className="text-2xl font-extrabold mb-4">Küresel Komisyon Payı Ayarları</h2>
            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">Broker (Yetkili) olarak emlakçılar hesaplama yaparken baz alınacak senaryo oranlarını buradan düzenleyebilirsiniz. Değişiklikler anlık olarak komisyon hesaplayıcısına yansıyacaktır.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Senaryo A set */}
              <div className="p-4 rounded-2xl bg-cream border-none">
                <h4 className="font-extrabold text-sm mb-3">Senaryo A (Kendi Müşterisi)</h4>
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-500 block">Ofis Payı (%)</label>
                    <input type="number" className="w-full text-xs p-2 border-2 border-charcoal rounded-lg" value={commSettings.aOfis} onChange={e => setCommSettings({...commSettings, aOfis: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 block">Danışman Payı (%)</label>
                    <input type="number" className="w-full text-xs p-2 border-2 border-charcoal rounded-lg" value={commSettings.aDanisman} onChange={e => setCommSettings({...commSettings, aDanisman: Number(e.target.value)})} />
                  </div>
                </div>
              </div>

              {/* Senaryo B set */}
              <div className="p-4 rounded-2xl bg-cream border-none">
                <h4 className="font-extrabold text-sm mb-3">Senaryo B (Ortak Çalışma)</h4>
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-500 block">Ofis Payı (%)</label>
                    <input type="number" className="w-full text-xs p-2 border-2 border-charcoal rounded-lg" value={commSettings.bOfis} onChange={e => setCommSettings({...commSettings, bOfis: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 block">Portföy Sahibi (%)</label>
                    <input type="number" className="w-full text-xs p-2 border-2 border-charcoal rounded-lg" value={commSettings.bPortfoySahibi} onChange={e => setCommSettings({...commSettings, bPortfoySahibi: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 block">Müşteri Getiren (%)</label>
                    <input type="number" className="w-full text-xs p-2 border-2 border-charcoal rounded-lg" value={commSettings.bMusteriGetiren} onChange={e => setCommSettings({...commSettings, bMusteriGetiren: Number(e.target.value)})} />
                  </div>
                </div>
              </div>

              {/* Senaryo C set */}
              <div className="p-4 rounded-2xl bg-cream border-none">
                <h4 className="font-extrabold text-sm mb-3">Senaryo C (Dış Emlakçı)</h4>
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-500 block">Dış Ortak Payı (%)</label>
                    <input type="number" className="w-full text-xs p-2 border-2 border-charcoal rounded-lg" value={commSettings.cDisOrtak} onChange={e => setCommSettings({...commSettings, cDisOrtak: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 block">Kalandan Ofis (%)</label>
                    <input type="number" className="w-full text-xs p-2 border-2 border-charcoal rounded-lg" value={commSettings.cOfis} onChange={e => setCommSettings({...commSettings, cOfis: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 block">Kalandan Danışman (%)</label>
                    <input type="number" className="w-full text-xs p-2 border-2 border-charcoal rounded-lg" value={commSettings.cDanisman} onChange={e => setCommSettings({...commSettings, cDanisman: Number(e.target.value)})} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* 4. RIGHT PANEL (Widgets & Schedule) */}
      <aside className={`bg-white border-l-4 border-charcoal flex flex-col transition-all duration-300 z-10 shrink-0 ${
        rightPanelCollapsed ? 'w-20 p-4 items-center gap-6' : 'w-80 p-6 gap-6'
      } overflow-y-auto`}>
        
        {/* Toggle Button */}
        <div className="flex w-full items-center justify-between">
          {!rightPanelCollapsed && <span className="text-xs font-bold text-zinc-500 tracking-widest uppercase">Ajanda</span>}
          <button 
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            className="p-1 rounded-lg hover:bg-zinc-100 border border-charcoal text-charcoal ml-auto"
          >
            {rightPanelCollapsed ? <ChevronLeft className="rotate-180" size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {rightPanelCollapsed ? (
          <div className="flex flex-col items-center gap-6 mt-4">
            {/* Collapsed Calendar Icon representing calendar */}
            <button 
              onClick={() => setRightPanelCollapsed(false)}
              className="p-3 rounded-full bg-cream hover:bg-zinc-100 shadow-none transition-all border-none"
            >
              <Calendar size={18} />
            </button>

            {/* Collapsed Add Button */}
            <button 
              onClick={() => { setActiveTab('portfolios'); setRightPanelCollapsed(false); }}
              className="p-3 bg-charcoal text-white rounded-full hover:bg-black shadow-none transition-all border-none"
            >
              <Plus size={18} />
            </button>
          </div>
        ) : (
          <>
            {/* Top: Mini Interactive Calendar */}
            <div className="rounded-3xl p-4 bg-cream shadow-none border-none">
              <div className="flex justify-between items-center mb-3">
                <span className="font-extrabold text-sm">Temmuz 2026</span>
                <div className="flex gap-1">
                  <button className="p-0.5 border border-charcoal rounded hover:bg-zinc-200"><ChevronLeft size={14} /></button>
                  <button className="p-0.5 border border-charcoal rounded hover:bg-zinc-200"><ChevronLeft className="rotate-180" size={14} /></button>
                </div>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-[10px] text-center font-bold">
                {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(d => (
                  <span key={d} className="text-zinc-400">{d}</span>
                ))}
                {/* Blank leading days (July 2026 starts on Wednesday/Çarşamba, so 2 blank days) */}
                <span className="p-1"></span>
                <span className="p-1"></span>
                {daysInMonth.map(day => (
                  <button 
                    key={day}
                    onClick={() => setSelectedCalendarDay(day)}
                    className={`p-1 rounded transition-colors ${
                      selectedCalendarDay === day 
                        ? 'bg-charcoal text-white' 
                        : 'hover:bg-zinc-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button: Solid Black Pill Button */}
            <button 
              onClick={() => setActiveTab('portfolios')}
              className="w-full bg-charcoal hover:bg-black text-white py-3.5 px-6 rounded-full font-extrabold text-sm flex items-center justify-center gap-2 shadow-none transition-all border-none"
            >
              <Plus size={16} /> Yeni Portföy / Randevu
            </button>

            {/* Bottom: "Bugünün Randevu Akışı" Timeline */}
            <div className="flex flex-col gap-4">
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-zinc-500">Bugünün Randevu Akışı</h4>
              
              <div className="relative border-l-2 border-charcoal ml-2.5 pl-5 flex flex-col gap-6">
                
                {/* Timeline item 1 */}
                <div className="relative">
                  <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-pastelYellow border-2 border-charcoal"></span>
                  <div className="text-xs">
                    <span className="font-extrabold block text-charcoal">11:30 - Sarıyer Daire Gösterimi</span>
                    <span className="text-zinc-500 block mt-0.5">Uzman: Can Yılmaz</span>
                    <span className="text-zinc-500 block">Müşteri: Murat Demir</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border border-charcoal bg-pastelYellow inline-block mt-2">
                      PENDING
                    </span>
                  </div>
                </div>

                {/* Timeline item 2 */}
                <div className="relative">
                  <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-pastelGreen border-2 border-charcoal"></span>
                  <div className="text-xs">
                    <span className="font-extrabold block text-charcoal">14:00 - Caferağa Villa Tanıtımı</span>
                    <span className="text-zinc-500 block mt-0.5">Uzman: Elif Kaya</span>
                    <span className="text-zinc-500 block">Müşteri: Zeynep Öztürk</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border border-charcoal bg-pastelGreen inline-block mt-2">
                      APPROVED
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

      </aside>

    </div>
  );
}
