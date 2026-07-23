import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Calculator, Users, Home, Calendar, DollarSign, 
  Percent, Shield, Plus, Lock, Check, X, Building, 
  Search, AlertTriangle, TrendingUp, Menu, 
  ChevronLeft, LogOut, MapPin, User, Briefcase,
  FileText, Clock, LayoutDashboard, Loader2
} from 'lucide-react';

// Mock Data for Phase 3/4
const INITIAL_PORTFOLIOS = [
  {
    id: '1',
    tip: 'DAIRE',
    tur: 'SATILIK',
    fiyat: 4200000,
    metrekare: 120,
    odaSayisi: '3+1',
    kapora: 100000,
    depozito: 0,
    il: 'İstanbul',
    ilce: 'Kadıköy',
    mahalle: 'Caferağa',
    gorevliUzman: 'Can Yılmaz',
    gorevliUzmanId: 'uzman-1',
    evSahibiAdi: 'Mehmet Yılmaz',
    evSahibiTelefon: '0533 222 3344',
    durum: 'BOSTA' // BOSTA, RANDEVULAR_MEVCUT, KAPORA_ASAMASINDA, KIRALANDI_SATILDI
  },
  {
    id: '2',
    tip: 'VILLA',
    tur: 'KIRALIK',
    fiyat: 65000,
    metrekare: 350,
    odaSayisi: '5+2',
    kapora: 130000,
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
    metrekare: 210,
    odaSayisi: '4+1',
    kapora: 300000,
    depozito: 0,
    il: 'Muğla',
    ilce: 'Bodrum',
    mahalle: 'Yalıkavak',
    gorevliUzman: 'Can Yılmaz',
    gorevliUzmanId: 'uzman-1',
    evSahibiAdi: 'Kemal Arslan',
    evSahibiTelefon: '0535 777 8899',
    durum: 'KAPORA_ASAMASINDA'
  }
];

const INITIAL_CLIENTS = [
  { id: '1', ad: 'Murat', soyad: 'Demir', telefon: '0505 123 4567', butce: 3500000, tip: 'DAIRE', musteriTipi: 'ALICI' },
  { id: '2', ad: 'Zeynep', soyad: 'Öztürk', telefon: '0543 987 6543', butce: 75000, tip: 'VILLA', musteriTipi: 'KIRACI' }
];

export default function App() {
  // Authentication & Session States
  const [token, setToken] = useState<string | null>(localStorage.getItem('homey_token'));
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('homey_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register Form States
  const [regFirmaName, setRegFirmaName] = useState('');
  const [regVergiNo, setRegVergiNo] = useState('');
  const [regSehir, setRegSehir] = useState('İstanbul');
  const [regAd, setRegAd] = useState('');
  const [regSoyad, setRegSoyad] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPaketTipi, setRegPaketTipi] = useState<'DENEME' | 'BASIC' | 'PREMIUM'>('DENEME');
  const [regAbonelikTipi, setRegAbonelikTipi] = useState<'AYLIK' | 'YILLIK'>('AYLIK');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Password Change States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changePassError, setChangePassError] = useState<string | null>(null);

  // Navigation & Layout States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolios' | 'appointments' | 'clients' | 'calculator' | 'analytics' | 'team' | 'subscription' | 'settings'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // Filter tags in top bar
  const [filterTag, setFilterTag] = useState<string>('Tümü');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Global Search Autocomplete States
  const [searchResults, setSearchResults] = useState<{
    portfolios: any[];
    clients: any[];
    employees: any[];
    appointments: any[];
    pages: any[];
  } | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Business Logic States
  const [portfolios, setPortfolios] = useState(INITIAL_PORTFOLIOS);
  const [selectedPortfolio, setSelectedPortfolio] = useState<typeof INITIAL_PORTFOLIOS[0] | null>(null);
  const [portfolioScope, setPortfolioScope] = useState<'all' | 'mine'>('all');
  
  // Add Portfolio Modal Form States
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false);
  const [newPortTip, setNewPortTip] = useState('DAIRE');
  const [newPortTur, setNewPortTur] = useState('SATILIK');
  const [newPortFiyat, setNewPortFiyat] = useState('');
  const [newPortMetrekare, setNewPortMetrekare] = useState('');
  const [newPortOdaSayisi, setNewPortOdaSayisi] = useState('2+1');
  const [newPortIl, setNewPortIl] = useState('İstanbul');
  const [newPortIlce, setNewPortIlce] = useState('');
  const [newPortMahalle, setNewPortMahalle] = useState('');
  const [newPortLandlordName, setNewPortLandlordName] = useState('');
  const [newPortLandlordPhone, setNewPortLandlordPhone] = useState('');

  // Edit Portfolio Modal Form States
  const [isEditingPortfolio, setIsEditingPortfolio] = useState(false);
  const [editPortTip, setEditPortTip] = useState('DAIRE');
  const [editPortTur, setEditPortTur] = useState('SATILIK');
  const [editPortFiyat, setEditPortFiyat] = useState('');
  const [editPortMetrekare, setEditPortMetrekare] = useState('');
  const [editPortOdaSayisi, setEditPortOdaSayisi] = useState('2+1');
  const [editPortIl, setEditPortIl] = useState('İstanbul');
  const [editPortIlce, setEditPortIlce] = useState('');
  const [editPortMahalle, setEditPortMahalle] = useState('');
  const [editPortLandlordName, setEditPortLandlordName] = useState('');
  const [editPortLandlordPhone, setEditPortLandlordPhone] = useState('');
  
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
  const [employees, setEmployees] = useState<any[]>([]);
  const [packageType, setPackageType] = useState<'BASIC' | 'PREMIUM'>('BASIC');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [empError, setEmpError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Subscription Details & Schedule States
  const [subInfo, setSubInfo] = useState<any>(null);
  const [schedPaketTipi, setSchedPaketTipi] = useState<'BASIC' | 'PREMIUM'>('PREMIUM');
  const [schedPeriyot, setSchedPeriyot] = useState<'AYLIK' | 'YILLIK'>('AYLIK');

  // Ofis Presence States
  const [isOfisteMi, setIsOfisteMi] = useState<boolean>(false);
  const [officeUsers, setOfficeUsers] = useState<any[]>([]);
  const [presenceLoading, setPresenceLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Appointments
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedMusteriId, setSelectedMusteriId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  
  // Clients (Musteriler)
  const [clients, setClients] = useState<any[]>([]);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientBudget, setNewClientBudget] = useState('');
  const [newClientType, setNewClientType] = useState('DAIRE');
  const [newClientMusteriTipi, setNewClientMusteriTipi] = useState('ALICI');

  // Dynamic Month/Year Navigation States for Mini Calendar
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date(2026, 6, 1)); // Default July 2026
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(22);

  const calendarYear = currentCalendarDate.getFullYear();
  const calendarMonth = currentCalendarDate.getMonth(); // 0-indexed (0 = Jan, 6 = Jul)
  
  // Month Name in Turkish (e.g. "Temmuz 2026")
  const calendarMonthName = currentCalendarDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  
  // First day of month (Monday = 0 ... Sunday = 6)
  const rawFirstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const firstDayOfWeek = (rawFirstDay + 6) % 7; // Monday = 0

  // Total days in current month
  const daysInCurrentMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const daysInMonthArray = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);
  const blankLeadingDays = Array.from({ length: firstDayOfWeek });

  const handlePrevMonth = () => {
    const prev = new Date(calendarYear, calendarMonth - 1, 1);
    setCurrentCalendarDate(prev);
    setSelectedCalendarDay(1);
  };

  const handleNextMonth = () => {
    const next = new Date(calendarYear, calendarMonth + 1, 1);
    setCurrentCalendarDate(next);
    setSelectedCalendarDay(1);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentCalendarDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedCalendarDay(today.getDate());
  };

  // Portfolio Detail Modal Specific Mini Calendar States
  const [popCalendarDate, setPopCalendarDate] = useState<Date>(new Date(2026, 6, 1));
  const [popSelectedDay, setPopSelectedDay] = useState<number>(22);
  const [popAppointments, setPopAppointments] = useState<any[]>([]);

  const popYear = popCalendarDate.getFullYear();
  const popMonth = popCalendarDate.getMonth();
  const popMonthName = popCalendarDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const popRawFirstDay = new Date(popYear, popMonth, 1).getDay();
  const popFirstDayOfWeek = (popRawFirstDay + 6) % 7;
  const popDaysInMonth = new Date(popYear, popMonth + 1, 0).getDate();
  const popDaysArray = Array.from({ length: popDaysInMonth }, (_, i) => i + 1);
  const popBlankDays = Array.from({ length: popFirstDayOfWeek });

  const handlePopPrevMonth = () => {
    setPopCalendarDate(new Date(popYear, popMonth - 1, 1));
    setPopSelectedDay(1);
  };

  const handlePopNextMonth = () => {
    setPopCalendarDate(new Date(popYear, popMonth + 1, 1));
    setPopSelectedDay(1);
  };

  const handlePopToday = () => {
    const today = new Date();
    setPopCalendarDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setPopSelectedDay(today.getDate());
  };

  // Fetch employees list from real backend
  const fetchEmployees = async (currentToken: string) => {
    try {
      const res = await fetch('/api/employees/list', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
        
        // Sync selected employee state
        setSelectedEmployee((prev: any) => {
          if (!prev) return null;
          const updated = Array.isArray(data) ? data.find((e: any) => e.id === prev.id) : null;
          return updated || null;
        });
      } else {
        console.error('Failed to fetch employees: HTTP', res.status);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  // Fetch portfolios list from real backend
  const fetchPortfolios = async (currentToken: string) => {
    try {
      const res = await fetch('/api/portfolios/list', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPortfolios(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch portfolios:', err);
    }
  };

  // Fetch clients list from real backend
  const fetchClients = async (currentToken: string) => {
    try {
      const res = await fetch('/api/clients/list', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  // Fetch appointments list from real backend for currently selected month
  const fetchAppointments = async (currentToken: string, dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth();
    const startDate = new Date(y, m, 1, 0, 0, 0, 0).toISOString();
    const endDate = new Date(y, m + 1, 0, 23, 59, 59, 999).toISOString();

    try {
      const res = await fetch(`/api/appointments/list?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    }
  };

  // Fetch appointments for a specific portfolio (property modal calendar)
  const fetchPortfolioAppointments = async (currentToken: string, portId: string, dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth();
    const startDate = new Date(y, m, 1, 0, 0, 0, 0).toISOString();
    const endDate = new Date(y, m + 1, 0, 23, 59, 59, 999).toISOString();

    try {
      const res = await fetch(`/api/appointments/list?portfoyId=${encodeURIComponent(portId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPopAppointments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch portfolio appointments:', err);
    }
  };

  // Fetch subscription details from real backend
  const fetchSubscriptionDetails = async (currentToken: string) => {
    try {
      const res = await fetch('/api/subscription/details', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubInfo(data);
        if (data.mevcutPaket?.paketAdi) {
          const upper = data.mevcutPaket.paketAdi.toUpperCase();
          if (upper === 'PREMIUM') setPackageType('PREMIUM');
          else setPackageType('BASIC');
        }
      }
    } catch (err) {
      console.error('Failed to fetch subscription details:', err);
    }
  };

  // Fetch my current office status
  const fetchMyOfficeStatus = async (currentToken: string) => {
    try {
      const res = await fetch('/api/user/my-status', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsOfisteMi(!!data.ofisteMi);
      }
    } catch (err) {
      console.error('Failed to fetch office status:', err);
    }
  };

  // Fetch users currently in office
  const fetchOfficeUsers = async (currentToken: string) => {
    try {
      const res = await fetch('/api/user/active-in-office', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOfficeUsers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch office users:', err);
    }
  };

  // Toggle office presence
  const handleToggleOfficeStatus = async () => {
    if (!token) return;
    setPresenceLoading(true);
    try {
      const res = await fetch('/api/user/toggle-office-status', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsOfisteMi(data.ofisteMi);
        showToast(data.message, 'success');
        fetchOfficeUsers(token);
      } else {
        showToast('Durum güncellenemedi.', 'error');
      }
    } catch (err) {
      showToast('Sunucu bağlantı hatası.', 'error');
    } finally {
      setPresenceLoading(false);
    }
  };

  // Schedule future package change handler
  const handleSchedulePackageChange = async (targetPaket: 'BASIC' | 'PREMIUM', targetPeriyot: 'AYLIK' | 'YILLIK') => {
    if (!token) return;
    try {
      const res = await fetch('/api/subscription/schedule-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gelecekPaketAdi: targetPaket === 'PREMIUM' ? 'Premium' : 'Basic',
          gelecekPeriyot: targetPeriyot
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchSubscriptionDetails(token);
      } else {
        alert(data.message || 'Paket değişimi planlanırken hata oluştu.');
      }
    } catch (err) {
      alert('Sunucuyla bağlantı kurulamadı.');
    }
  };

  // Cancel scheduled package change handler
  const handleCancelScheduledChange = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/subscription/cancel-schedule', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchSubscriptionDetails(token);
      } else {
        alert(data.message || 'Planlama iptal edilirken hata oluştu.');
      }
    } catch (err) {
      alert('Sunucu bağlantı hatası.');
    }
  };

  // Reset Employee Password Handler
  const handleResetEmployeePassword = async (empId: string) => {
    if (!window.confirm("Bu danışmanın şifresini sıfırlamak istediğinize emin misiniz?")) {
      return;
    }

    try {
      const res = await fetch('/api/employees/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: empId
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert("Şifre başarıyla sıfırlandı!\nYeni Geçici Şifre: Homey123!\nDanışman ilk girişte bu şifre ile giriş yapıp yeni şifresini belirlemelidir.");
        fetchEmployees(token!);
      } else {
        alert(data.message || "Şifre sıfırlanırken hata oluştu.");
      }
    } catch (err) {
      alert("Sunucu bağlantı hatası.");
    }
  };

  // Sync state and database on login or update
  useEffect(() => {
    if (token) {
      fetchEmployees(token);
      fetchPortfolios(token);
      fetchClients(token);
      fetchSubscriptionDetails(token);
      fetchMyOfficeStatus(token);
      fetchOfficeUsers(token);
    }
  }, [token]);

  // 300ms Debounce for Global Search
  useEffect(() => {
    if (!token) return;
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchLoading(true);
      setShowSearchDropdown(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSearchDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Smart Navigation: when user clicks a search result
  const handleSelectSearchResult = useCallback((type: string, item: any) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    setSearchResults(null);

    if (type === 'portfolio') {
      // Navigate to portfolios tab and open the portfolio detail modal
      setActiveTab('portfolios');
      // Find matching portfolio from local state or use the search result item
      const found = portfolios.find((p: any) => p.id === item.id) || item;
      setSelectedPortfolio(found);
    } else if (type === 'client') {
      setActiveTab('clients');
    } else if (type === 'employee') {
      setActiveTab('team');
    } else if (type === 'appointment') {
      setActiveTab('appointments');
    } else if (type === 'page') {
      setActiveTab(item.id as any);
    }
  }, [portfolios]);

  useEffect(() => {
    if (token) {
      fetchAppointments(token, currentCalendarDate);
    }
  }, [token, currentCalendarDate]);

  // Fetch portfolio specific appointments when modal is open
  useEffect(() => {
    if (token && selectedPortfolio?.id) {
      fetchPortfolioAppointments(token, selectedPortfolio.id, popCalendarDate);
    }
  }, [token, selectedPortfolio, popCalendarDate]);

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eposta: loginEmail,
          sifre: loginPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('homey_token', data.token);
        localStorage.setItem('homey_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setPackageType(data.user.paketTipi);
        // Reset inputs
        setLoginEmail('');
        setLoginPassword('');
      } else {
        setLoginError(data.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol ediniz.');
      }
    } catch (err) {
      setLoginError('Sunucuyla bağlantı kurulamadı.');
    }
  };

  // Register Broker Handler
  const handleRegisterBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    try {
      const res = await fetch('/api/auth/register-broker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firmaAdi: regFirmaName,
          vergiNo: regVergiNo,
          sehir: regSehir,
          ad: regAd,
          soyad: regSoyad,
          eposta: regEmail,
          sifre: regPassword,
          telefon: regPhone,
          paketTipi: regPaketTipi,
          abonelikTipi: regPaketTipi === 'DENEME' ? 'AYLIK' : regAbonelikTipi
        })
      });

      const data = await res.json();
      if (res.ok) {
        setRegSuccess('Firma kaydı başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.');
        setAuthMode('login');
        setLoginEmail(regEmail);
        // Reset fields
        setRegFirmaName('');
        setRegVergiNo('');
        setRegAd('');
        setRegSoyad('');
        setRegEmail('');
        setRegPassword('');
        setRegPhone('');
      } else {
        setRegError(data.message || 'Firma kaydı oluşturulurken hata oluştu.');
      }
    } catch (err) {
      setRegError('Sunucuyla bağlantı kurulamadı.');
    }
  };

  // Change Password Handler (Mandatory on first login)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eskiSifre: oldPassword,
          yeniSifre: newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert('Şifreniz başarıyla değiştirildi! Yeni şifrenizle giriş yapınız.');
        handleLogout();
      } else {
        setChangePassError(data.message || 'Şifre değiştirme başarısız.');
      }
    } catch (err) {
      setChangePassError('Sunucuyla bağlantı kurulamadı.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('homey_token');
    localStorage.removeItem('homey_user');
    setToken(null);
    setUser(null);
    setPortfolios(INITIAL_PORTFOLIOS);
    setClients(INITIAL_CLIENTS);
    setActiveTab('dashboard');
  };

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

  // Employee Add Handler with real subscription check
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpError(null);

    if (newEmpName && newEmpEmail) {
      const [ad, ...soyadParts] = newEmpName.split(' ');
      const soyad = soyadParts.join(' ') || '';

      try {
        const res = await fetch('/api/employees/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ad,
            soyad,
            eposta: newEmpEmail
          })
        });

        const data = await res.json();
        if (res.ok) {
          alert(`Gayrimenkul uzmanı başarıyla eklendi!\nGeçici şifresi: Homey123!`);
          setNewEmpName('');
          setNewEmpEmail('');
          fetchEmployees(token!);
        } else {
          setEmpError(data.message || 'Çalışan eklenirken hata oluştu.');
        }
      } catch (err) {
        setEmpError('Sunucu bağlantı hatası.');
      }
    }
  };

  // Client Add Handler
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientPhone || !newClientMusteriTipi) {
      alert("Lütfen zorunlu alanları doldurunuz.");
      return;
    }

    const [ad, ...soyadParts] = newClientName.split(' ');
    const soyad = soyadParts.join(' ') || '';

    try {
      const res = await fetch('/api/clients/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ad,
          soyad,
          telefon: newClientPhone,
          aradigiButce: (newClientMusteriTipi === 'SATICI' || newClientMusteriTipi === 'KIRAYA_VEREN') ? null : (newClientBudget ? Number(newClientBudget) : null),
          aradigiEmlakTipi: newClientType,
          musteriTipi: newClientMusteriTipi
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert("Müşteri başarıyla veritabanına kaydedildi!");
        setNewClientName('');
        setNewClientPhone('');
        setNewClientBudget('');
        setNewClientType('DAIRE');
        setNewClientMusteriTipi('ALICI');
        fetchClients(token!);
      } else {
        alert(data.message || "Müşteri eklenirken hata oluştu.");
      }
    } catch (err) {
      alert("Sunucu bağlantı hatası.");
    }
  };

  // Portfolio Add Handler
  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortFiyat || !newPortIlce || !newPortLandlordName || !newPortLandlordPhone || !newPortMetrekare) {
      alert("Lütfen tüm alanları doldurunuz.");
      return;
    }

    try {
      const res = await fetch('/api/portfolios/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tip: newPortTip,
          tur: newPortTur,
          fiyat: Number(newPortFiyat),
          metrekare: Number(newPortMetrekare),
          odaSayisi: newPortTip === 'ARSA' ? '' : newPortOdaSayisi,
          il: newPortIl,
          ilce: newPortIlce,
          mahalle: newPortMahalle,
          evSahibiAdi: newPortLandlordName,
          evSahibiTelefon: newPortLandlordPhone
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert("Yeni portföy veritabanına başarıyla kaydedildi!");
        setShowAddPortfolioModal(false);
        // Reset fields
        setNewPortTip('DAIRE');
        setNewPortTur('SATILIK');
        setNewPortFiyat('');
        setNewPortMetrekare('');
        setNewPortOdaSayisi('2+1');
        setNewPortIlce('');
        setNewPortMahalle('');
        setNewPortLandlordName('');
        setNewPortLandlordPhone('');
        fetchPortfolios(token!);
      } else {
        alert(data.message || "Portföy eklenirken hata oluştu.");
      }
    } catch (err) {
      alert("Sunucu bağlantı hatası.");
    }
  };

  // Start Edit Portfolio Handler
  const startEditPortfolio = (p: any) => {
    setEditPortTip(p.tip);
    setEditPortTur(p.tur);
    setEditPortFiyat(String(p.fiyat));
    setEditPortMetrekare(String(p.metrekare || ''));
    setEditPortOdaSayisi(p.odaSayisi || '2+1');
    setEditPortIl(p.il);
    setEditPortIlce(p.ilce);
    setEditPortMahalle(p.mahalle || '');
    setEditPortLandlordName(p.evSahibiAdi);
    setEditPortLandlordPhone(p.evSahibiTelefon);
    setIsEditingPortfolio(true);
  };

  // Save Edit Portfolio Handler
  const handleSaveEditPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortfolio) return;
    if (!editPortFiyat || !editPortIlce || !editPortLandlordName || !editPortLandlordPhone || !editPortMetrekare) {
      alert("Lütfen tüm alanları doldurunuz.");
      return;
    }

    try {
      const res = await fetch(`/api/portfolios/edit/${selectedPortfolio.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tip: editPortTip,
          tur: editPortTur,
          fiyat: Number(editPortFiyat),
          metrekare: Number(editPortMetrekare),
          odaSayisi: editPortTip === 'ARSA' ? '' : editPortOdaSayisi,
          il: editPortIl,
          ilce: editPortIlce,
          mahalle: editPortMahalle,
          evSahibiAdi: editPortLandlordName,
          evSahibiTelefon: editPortLandlordPhone
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert("Portföy başarıyla veritabanında güncellendi!");
        setIsEditingPortfolio(false);
        
        const updated = {
          ...selectedPortfolio,
          tip: editPortTip,
          tur: editPortTur,
          fiyat: Number(editPortFiyat),
          metrekare: Number(editPortMetrekare),
          odaSayisi: editPortTip === 'ARSA' ? '' : editPortOdaSayisi,
          il: editPortIl,
          ilce: editPortIlce,
          mahalle: editPortMahalle,
          evSahibiAdi: editPortLandlordName,
          evSahibiTelefon: editPortLandlordPhone
        };
        setSelectedPortfolio(updated);
        fetchPortfolios(token!);
      } else {
        alert(data.message || "Portföy güncellenirken hata oluştu.");
      }
    } catch (err) {
      alert("Sunucu bağlantı hatası.");
    }
  };

  // Appointment Request Handler
  const handleRequestAppointment = (portfolio: typeof INITIAL_PORTFOLIOS[0]) => {
    if (!selectedMusteriId || !selectedDate) {
      alert("Lütfen bir müşteri ve randevu zamanı seçiniz.");
      return;
    }

    if (portfolio.durum === 'KAPORA_ASAMASINDA' || portfolio.durum === 'KIRALANDI_SATILDI') {
      alert("Bu portföy kapora aşamasında veya satıldığı için randevu alınamaz.");
      return;
    }

    const clientObj = clients.find(c => c.id === selectedMusteriId);
    const newApp = {
      id: String(appointments.length + 1),
      portfoyId: portfolio.id,
      portfoyTip: portfolio.tip,
      talepEden: `${user?.ad || 'Can'} ${user?.soyad || 'Yılmaz'}`,
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
  const handleUpdateAppStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    if (!token) {
      setAppointments(appointments.map(app => app.id === id ? { ...app, durum: newStatus } : app));
      return;
    }
    try {
      const res = await fetch('/api/appointments/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentId: id,
          durum: newStatus
        })
      });
      if (res.ok) {
        fetchAppointments(token, currentCalendarDate);
      } else {
        setAppointments(appointments.map(app => app.id === id ? { ...app, durum: newStatus } : app));
      }
    } catch (err) {
      setAppointments(appointments.map(app => app.id === id ? { ...app, durum: newStatus } : app));
    }
  };

  // Filter logic for portfolios list
  const filteredPortfolios = portfolios.filter(p => {
    // 1. Tag filter
    if (filterTag !== 'Tümü') {
      if (filterTag === 'Satılık' && p.tur !== 'SATILIK') return false;
      if (filterTag === 'Kiralık' && p.tur !== 'KIRALIK') return false;
      if (filterTag === 'Konut' && !['DAIRE', 'MUSTAKIL', 'VILLA'].includes(p.tip)) return false;
      if (filterTag === 'Arsa' && p.tip !== 'ARSA') return false;
    }
    // 2. Scope filter (All vs Mine)
    if (portfolioScope === 'mine') {
      const myName = `${user?.ad || ''} ${user?.soyad || ''}`.trim();
      if (p.gorevliUzmanId !== user?.id && p.gorevliUzman !== myName) return false;
    }
    // 3. Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTip = (p.tip || '').toLowerCase().includes(q);
      const matchTur = (p.tur || '').toLowerCase().includes(q);
      const matchIl = (p.il || '').toLowerCase().includes(q);
      const matchIlce = (p.ilce || '').toLowerCase().includes(q);
      const matchMahalle = (p.mahalle || '').toLowerCase().includes(q);
      const matchUzman = (p.gorevliUzman || '').toLowerCase().includes(q);
      if (!matchTip && !matchTur && !matchIl && !matchIlce && !matchMahalle && !matchUzman) {
        return false;
      }
    }
    return true;
  });

  // RENDER 1: AUTHENTICATION SCREEN (LOGIN / REGISTER)
  if (!token) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Left Branding Panel */}
          <div className="bg-charcoal text-white rounded-3xl p-8 flex flex-col justify-between border-none shadow-none">
            <div>
              <span className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-pastelYellow via-pastelPink to-pastelBlue bg-clip-text text-transparent">
                HOMEY
              </span>
              <h2 className="text-4xl font-extrabold mt-6 leading-tight">Emlak SaaS Platformu</h2>
              <p className="text-zinc-400 text-sm mt-4 leading-relaxed">
                Ofisinizi, gayrimenkul danışmanlarınızı, müşteri taleplerinizi ve komisyon paylaşım senaryolarını tek merkezden yönetmenin en modern yolu.
              </p>
            </div>
            
            <div className="mt-8 pt-8 border-t border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pastelYellow border-none flex items-center justify-center font-bold text-charcoal text-xs">
                  ★
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Üyelik Modeli</span>
                  <span className="text-sm font-semibold text-white">30 Günlük Deneme Sürümüyle Başlayın</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="bg-white rounded-3xl p-8 flex flex-col justify-between border-none shadow-none">
            <div>
              {/* Tab Switcher */}
              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => { setAuthMode('login'); setLoginError(null); }}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-full transition-all border-none ${
                    authMode === 'login' ? 'bg-[#FEF08A] text-charcoal' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                  }`}
                >
                  Giriş Yap
                </button>
                <button 
                  onClick={() => { setAuthMode('register'); setRegError(null); }}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-full transition-all border-none ${
                    authMode === 'register' ? 'bg-[#FEF08A] text-charcoal' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                  }`}
                >
                  Firma Kaydı
                </button>
              </div>

              {regSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-950 text-xs font-semibold mb-4 border-none">
                  {regSuccess}
                </div>
              )}

              {/* Login Form */}
              {authMode === 'login' ? (
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <h3 className="text-2xl font-extrabold text-charcoal">Hesabınıza Giriş Yapın</h3>
                  
                  {loginError && (
                    <div className="p-4 rounded-2xl bg-red-100 text-red-950 text-xs font-semibold border-none flex items-center gap-2">
                      <AlertTriangle size={16} />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-1">E-posta Adresi</label>
                    <input 
                      type="email" 
                      className="w-full text-sm p-3 rounded-2xl bg-zinc-50 border-none focus:outline-none" 
                      placeholder="ad@ofisiniz.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-1">Şifre</label>
                    <input 
                      type="password" 
                      className="w-full text-sm p-3 rounded-2xl bg-zinc-50 border-none focus:outline-none" 
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="w-full py-3 bg-charcoal text-white font-extrabold rounded-full hover:bg-black transition-all border-none mt-2">
                    Giriş Yap
                  </button>
                </form>
              ) : (
                /* Registration Form */
                <form onSubmit={handleRegisterBroker} className="flex flex-col gap-3 overflow-y-auto max-h-[420px] pr-2">
                  <h3 className="text-xl font-extrabold text-charcoal">Yeni Firma ve Broker Kaydı</h3>

                  {regError && (
                    <div className="p-3 rounded-2xl bg-red-100 text-red-950 text-xs font-semibold border-none flex items-center gap-2">
                      <AlertTriangle size={16} />
                      <span>{regError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-0.5">Firma Adı</label>
                      <input type="text" className="w-full text-xs p-2 rounded-xl bg-zinc-50 border-none focus:outline-none" placeholder="Örn: Körfez Emlak" value={regFirmaName} onChange={e => setRegFirmaName(e.target.value)} required />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-0.5">Vergi Numarası</label>
                      <input type="text" className="w-full text-xs p-2 rounded-xl bg-zinc-50 border-none focus:outline-none" placeholder="10 Haneli No" value={regVergiNo} onChange={e => setRegVergiNo(e.target.value)} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-0.5">Şehir</label>
                      <input type="text" className="w-full text-xs p-2 rounded-xl bg-zinc-50 border-none focus:outline-none" value={regSehir} onChange={e => setRegSehir(e.target.value)} required />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-0.5">Telefon</label>
                      <input type="text" className="w-full text-xs p-2 rounded-xl bg-zinc-50 border-none focus:outline-none" placeholder="05xx..." value={regPhone} onChange={e => setRegPhone(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-0.5">Broker Adı</label>
                      <input type="text" className="w-full text-xs p-2 rounded-xl bg-zinc-50 border-none focus:outline-none" placeholder="Ad" value={regAd} onChange={e => setRegAd(e.target.value)} required />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-0.5">Soyadı</label>
                      <input type="text" className="w-full text-xs p-2 rounded-xl bg-zinc-50 border-none focus:outline-none" placeholder="Soyad" value={regSoyad} onChange={e => setRegSoyad(e.target.value)} required />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-0.5">E-posta</label>
                    <input type="email" className="w-full text-xs p-2 rounded-xl bg-zinc-50 border-none focus:outline-none" placeholder="broker@ofis.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-0.5">Giriş Şifresi</label>
                    <input type="password" className="w-full text-xs p-2 rounded-xl bg-zinc-50 border-none focus:outline-none" placeholder="En az 6 karakter" value={regPassword} onChange={e => setRegPassword(e.target.value)} required />
                  </div>

                  {/* Abonelik Paketi Seçimi */}
                  <div className="flex flex-col gap-2 my-1">
                    <label className="text-[10px] font-extrabold text-zinc-500 uppercase block tracking-wider">Abonelik Paketi Seçin</label>
                    
                    {/* Period Switcher (Aylık / Yıllık) */}
                    {regPaketTipi !== 'DENEME' && (
                      <div className="flex bg-zinc-100 p-1 rounded-xl mb-1">
                        <button 
                          type="button" 
                          onClick={() => setRegAbonelikTipi('AYLIK')}
                          className={`flex-1 py-1 text-[10px] font-extrabold rounded-lg transition-all border-none ${
                            regAbonelikTipi === 'AYLIK' ? 'bg-white text-charcoal shadow-sm' : 'text-zinc-400 bg-transparent'
                          }`}
                        >
                          Aylık Ödeme
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setRegAbonelikTipi('YILLIK')}
                          className={`flex-1 py-1 text-[10px] font-extrabold rounded-lg transition-all border-none ${
                            regAbonelikTipi === 'YILLIK' ? 'bg-white text-charcoal shadow-sm' : 'text-zinc-400 bg-transparent'
                          }`}
                        >
                          Yıllık Ödeme (%20 İndirimli)
                        </button>
                      </div>
                    )}

                    {/* Package Cards */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <div 
                        onClick={() => setRegPaketTipi('DENEME')}
                        className={`p-2 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          regPaketTipi === 'DENEME' ? 'border-charcoal bg-[#FEF08A]' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100'
                        }`}
                      >
                        <span className="text-[10px] font-extrabold block">Deneme</span>
                        <span className="text-[9px] text-zinc-600 block mt-0.5">30 Gün Ücretsiz</span>
                        <span className="text-[8px] font-bold text-zinc-500 mt-1 block">4 Danışman</span>
                      </div>

                      <div 
                        onClick={() => setRegPaketTipi('BASIC')}
                        className={`p-2 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          regPaketTipi === 'BASIC' ? 'border-charcoal bg-[#BAE6FD]' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100'
                        }`}
                      >
                        <span className="text-[10px] font-extrabold block">Basic</span>
                        <span className="text-[9px] text-zinc-600 block mt-0.5">Standart Paket</span>
                        <span className="text-[8px] font-bold text-zinc-500 mt-1 block">4 Danışman</span>
                      </div>

                      <div 
                        onClick={() => setRegPaketTipi('PREMIUM')}
                        className={`p-2 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          regPaketTipi === 'PREMIUM' ? 'border-charcoal bg-[#BBF7D0]' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100'
                        }`}
                      >
                        <span className="text-[10px] font-extrabold block">Premium</span>
                        <span className="text-[9px] text-zinc-600 block mt-0.5">Tam Sınırsız</span>
                        <span className="text-[8px] font-bold text-zinc-500 mt-1 block">Sınırsız Danışman</span>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="w-full py-2.5 bg-charcoal text-white text-xs font-extrabold rounded-full hover:bg-black transition-all border-none mt-2">
                    {regPaketTipi === 'DENEME' ? 'Kaydol ve 30 Gün Ücretsiz Başlat' : `Kaydol (${regPaketTipi} Paket - ${regAbonelikTipi === 'YILLIK' ? 'Yıllık' : 'Aylık'})`}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // RENDER 2: FIRST TIME MANDATORY PASSWORD RESET
  if (user?.ilkGirisMi) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border-none shadow-none">
          <h2 className="text-2xl font-extrabold text-charcoal mb-2 flex items-center gap-2">
            <Lock className="text-pastelPink" /> Şifrenizi Değiştirin
          </h2>
          <p className="text-zinc-500 text-xs mb-6 leading-relaxed">
            Yöneticiniz tarafından kaydınız başarıyla tamamlanmıştır. Güvenliğiniz için lütfen size verilen geçici şifreyi kendi belirleyeceğiniz yeni bir şifre ile güncelleyin.
          </p>

          {changePassError && (
            <div className="p-4 rounded-2xl bg-red-100 text-red-950 text-xs font-semibold mb-4 border-none flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{changePassError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 block mb-1">Geçici Şifre (Size Verilen)</label>
              <input 
                type="password" 
                className="w-full text-sm p-3 rounded-2xl bg-zinc-50 border-none focus:outline-none" 
                placeholder="Örn: Homey123!"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 block mb-1">Yeni Güvenli Şifre</label>
              <input 
                type="password" 
                className="w-full text-sm p-3 rounded-2xl bg-zinc-50 border-none focus:outline-none" 
                placeholder="Yeni şifreniz"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="w-full py-3 bg-charcoal text-white font-extrabold rounded-full hover:bg-black transition-all border-none mt-2">
              Şifreyi Güncelle
            </button>
          </form>

          <button onClick={handleLogout} className="w-full text-xs text-zinc-400 font-semibold underline hover:text-zinc-600 mt-4 text-center block">
            Giriş Ekranına Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // RENDER 3: FULL COMPLETED DASHBOARD AND APPLICATION
  return (
    <div className="min-h-screen bg-cream text-charcoal flex font-sans overflow-x-hidden">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-semibold transition-all animate-bounce-in border-none ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success'
            ? <Check size={16} className="shrink-0" />
            : <AlertTriangle size={16} className="shrink-0" />
          }
          {toast.message}
        </div>
      )}
      
      {/* LEFT SIDEBAR */}
      <aside className={`bg-charcoal text-white flex flex-col justify-between transition-all duration-300 z-40 border-r-4 border-charcoal shrink-0 ${
        sidebarCollapsed ? 'w-20 px-3 py-6 items-center' : 'w-64 p-6'
      }`}>
        <div className="flex flex-col gap-8 w-full">
          {/* Logo / Header */}
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!sidebarCollapsed ? (
              <span className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-pastelYellow via-pastelPink to-pastelBlue bg-clip-text text-transparent">
                HOMEY
              </span>
            ) : (
              <span className="text-xl font-extrabold bg-gradient-to-r from-pastelYellow via-pastelPink to-pastelBlue bg-clip-text text-transparent">
                H
              </span>
            )}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-white ${sidebarCollapsed ? 'mt-2' : 'ml-auto'}`}
              title={sidebarCollapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'}
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-2 w-full">
              {!sidebarCollapsed ? (
                <span className="text-xs font-bold text-zinc-500 tracking-widest pl-4">GENEL</span>
              ) : (
                <div className="w-full border-t border-zinc-800 my-1" title="GENEL" />
              )}
              <button 
                onClick={() => setActiveTab('dashboard')} 
                title="Ana Sayfa"
                className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Home size={20} className="shrink-0" />
                {!sidebarCollapsed && <span>Ana Sayfa</span>}
              </button>
              <button 
                onClick={() => setActiveTab('portfolios')} 
                title="Portföyler"
                className={`sidebar-link ${activeTab === 'portfolios' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Building size={20} className="shrink-0" />
                {!sidebarCollapsed && <span>Portföyler</span>}
              </button>
              <button 
                onClick={() => setActiveTab('appointments')} 
                title="Randevular"
                className={`sidebar-link ${activeTab === 'appointments' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Calendar size={20} className="shrink-0" />
                {!sidebarCollapsed && <span>Randevular</span>}
              </button>
              <button 
                onClick={() => setActiveTab('clients')} 
                title="Müşteriler"
                className={`sidebar-link ${activeTab === 'clients' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <User size={20} className="shrink-0" />
                {!sidebarCollapsed && <span>Müşteriler</span>}
              </button>
              <button 
                onClick={() => setActiveTab('calculator')} 
                title="Hesaplayıcı"
                className={`sidebar-link ${activeTab === 'calculator' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Calculator size={20} className="shrink-0" />
                {!sidebarCollapsed && <span>Hesaplayıcı</span>}
              </button>
            </div>

            {/* Admin Management Section - Only visible to YETKILI (Broker) */}
            {user?.rol === 'YETKILI' && (
              <div className="flex flex-col gap-2 w-full">
                {!sidebarCollapsed ? (
                  <span className="text-xs font-bold text-zinc-500 tracking-widest pl-4">YÖNETİM</span>
                ) : (
                  <div className="w-full border-t border-zinc-800 my-1" title="YÖNETİM" />
                )}
                <button 
                  onClick={() => setActiveTab('analytics')} 
                  title="Ciro Raporları"
                  className={`sidebar-link ${activeTab === 'analytics' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <TrendingUp size={20} className="shrink-0" />
                  {!sidebarCollapsed && <span>Ciro Raporları</span>}
                </button>
                <button 
                  onClick={() => setActiveTab('team')} 
                  title="Danışman Yönetimi"
                  className={`sidebar-link ${activeTab === 'team' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Users size={20} className="shrink-0" />
                  {!sidebarCollapsed && <span>Danışman Yönetimi</span>}
                </button>
                <button 
                  onClick={() => setActiveTab('subscription')} 
                  title="Abonelik Yönetimi"
                  className={`sidebar-link ${activeTab === 'subscription' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Shield size={20} className="shrink-0" />
                  {!sidebarCollapsed && <span>Abonelik Yönetimi</span>}
                </button>
                <button 
                  onClick={() => setActiveTab('settings')} 
                  title="Komisyon Ayarları"
                  className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Percent size={20} className="shrink-0" />
                  {!sidebarCollapsed && <span>Komisyon Ayarları</span>}
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar Footer / User info & Logout */}
        <div className="flex flex-col gap-4 w-full">
          <div className={`border-t border-zinc-800 pt-4 flex gap-2 ${sidebarCollapsed ? 'justify-center' : 'items-center'}`}>
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0" title={`${user?.ad || ''} ${user?.soyad || ''}`}>
              {user?.ad ? user.ad[0] : 'C'}{user?.soyad ? user.soyad[0] : 'Y'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col leading-none">
                <span className="text-sm font-semibold">{user?.ad} {user?.soyad}</span>
                <span className="text-xs text-zinc-500 mt-1">{user?.rol === 'YETKILI' ? 'Ofis Yetkilisi' : 'Gayrimenkul Uzmanı'}</span>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout} 
            title="Çıkış Yap"
            className={`sidebar-link text-red-400 hover:text-red-300 hover:bg-red-950/20 border-none ${sidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
          >
            <LogOut size={20} className="shrink-0" />
            {!sidebarCollapsed && <span>Çıkış Yap</span>}
          </button>
        </div>
      </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden flex flex-col gap-6 min-w-0">

          {/* Global Top Header Bar with Autocomplete */}
          <header className="flex flex-wrap items-center w-full gap-3 header-bar">
            {activeTab === 'dashboard' && (
              <div className="shrink-0 min-w-0">
                <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal leading-tight">İyi günler, {user?.ad || 'Can'} 👋</h1>
                <p className="text-zinc-500 text-sm mt-1">Bugün ofis genelinde 3 aktif randevu ve 1 bekleyen teklif bulunuyor.</p>
              </div>
            )}
            
            {/* Global Smart Search with Autocomplete */}
            <div
              ref={searchContainerRef}
              className={`relative transition-all duration-300 ${
                activeTab === 'dashboard' ? 'w-64 ml-auto' : 'w-full'
              } min-w-0`}
            >
              {/* Search Input */}
              <input
                type="text"
                placeholder="Portföy, müşteri, danışman veya sayfa ara..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim().length >= 2) setShowSearchDropdown(true);
                }}
                onFocus={() => { if (searchQuery.trim().length >= 2) setShowSearchDropdown(true); }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    setActiveTab('portfolios');
                    setShowSearchDropdown(false);
                  }
                }}
                className="w-full bg-white border-2 border-charcoal rounded-full px-5 py-2.5 pl-11 pr-10 text-sm focus:outline-none transition-all shadow-none"
              />
              {/* Search Icon or Loader */}
              {isSearchLoading
                ? <Loader2 size={16} className="absolute left-4 top-3.5 text-zinc-500 animate-spin" />
                : <Search size={16} className="absolute left-4 top-3.5 text-zinc-500" />
              }
              {/* Clear button */}
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults(null); setShowSearchDropdown(false); }}
                  className="absolute right-4 top-3 text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  <X size={14} />
                </button>
              )}

              {/* Autocomplete Dropdown Panel */}
              {showSearchDropdown && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white border-2 border-charcoal rounded-3xl shadow-xl z-50 overflow-hidden max-h-[480px] overflow-y-auto">
                  {isSearchLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-zinc-500 text-sm">
                      <Loader2 size={18} className="animate-spin" />
                      <span>Aranıyor...</span>
                    </div>
                  ) : searchResults ? (
                    <>
                      {/* No results at all */}
                      {!searchResults.portfolios.length && !searchResults.clients.length && !searchResults.employees.length && !searchResults.appointments.length && !searchResults.pages.length ? (
                        <div className="py-10 text-center">
                          <Search size={28} className="mx-auto text-zinc-300 mb-2" />
                          <p className="text-zinc-500 text-sm font-medium">"{searchQuery}" için sonuç bulunamadı.</p>
                          <button
                            onClick={() => { setActiveTab('portfolios'); setShowSearchDropdown(false); }}
                            className="mt-3 text-xs text-blue-600 hover:underline font-semibold"
                          >
                            Tüm portföyleri görüntüle →
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-zinc-100">

                          {/* Portföyler Category */}
                          {searchResults.portfolios.length > 0 && (
                            <div>
                              <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                                <Building size={13} className="text-zinc-400" />
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Portföyler</span>
                              </div>
                              {searchResults.portfolios.map((p: any) => (
                                <button
                                  key={`port-${p.id}`}
                                  onClick={() => handleSelectSearchResult('portfolio', p)}
                                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-zinc-50 transition-colors group"
                                >
                                  <div className="w-8 h-8 rounded-xl bg-[#FEF08A] flex items-center justify-center shrink-0">
                                    <Home size={14} className="text-charcoal" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-charcoal truncate">{p.tip} — {p.tur}</p>
                                    <p className="text-xs text-zinc-500 truncate">{p.mahalle}, {p.ilce} / {p.il} · {p.fiyat?.toLocaleString('tr-TR')} ₺</p>
                                  </div>
                                  <span className="ml-auto text-xs text-zinc-300 group-hover:text-zinc-500 shrink-0">→</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Müşteriler Category */}
                          {searchResults.clients.length > 0 && (
                            <div>
                              <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                                <User size={13} className="text-zinc-400" />
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Müşteriler</span>
                              </div>
                              {searchResults.clients.map((c: any) => (
                                <button
                                  key={`cli-${c.id}`}
                                  onClick={() => handleSelectSearchResult('client', c)}
                                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-zinc-50 transition-colors group"
                                >
                                  <div className="w-8 h-8 rounded-xl bg-[#BAE6FD] flex items-center justify-center shrink-0">
                                    <User size={14} className="text-charcoal" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-charcoal truncate">{c.ad}</p>
                                    <p className="text-xs text-zinc-500 truncate">{c.musteriTipi} · {c.telefon}</p>
                                  </div>
                                  <span className="ml-auto text-xs text-zinc-300 group-hover:text-zinc-500 shrink-0">→</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Danışmanlar Category */}
                          {searchResults.employees.length > 0 && (
                            <div>
                              <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                                <Briefcase size={13} className="text-zinc-400" />
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Danışman Kadrosu</span>
                              </div>
                              {searchResults.employees.map((e: any) => (
                                <button
                                  key={`emp-${e.id}`}
                                  onClick={() => handleSelectSearchResult('employee', e)}
                                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-zinc-50 transition-colors group"
                                >
                                  <div className="w-8 h-8 rounded-xl bg-[#BBF7D0] flex items-center justify-center shrink-0">
                                    <Users size={14} className="text-charcoal" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-charcoal truncate">{e.ad} {e.soyad}</p>
                                    <p className="text-xs text-zinc-500 truncate">{e.rol === 'YETKILI' ? 'Ofis Yetkilisi' : 'Gayrimenkul Uzmanı'} · {e.eposta}</p>
                                  </div>
                                  <span className="ml-auto text-xs text-zinc-300 group-hover:text-zinc-500 shrink-0">→</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Randevular Category */}
                          {searchResults.appointments.length > 0 && (
                            <div>
                              <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                                <Clock size={13} className="text-zinc-400" />
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Randevular</span>
                              </div>
                              {searchResults.appointments.map((a: any) => (
                                <button
                                  key={`app-${a.id}`}
                                  onClick={() => handleSelectSearchResult('appointment', a)}
                                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-zinc-50 transition-colors group"
                                >
                                  <div className="w-8 h-8 rounded-xl bg-[#E9D5FF] flex items-center justify-center shrink-0">
                                    <Calendar size={14} className="text-charcoal" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-charcoal truncate">{a.portfoyTip} — {a.ilce}</p>
                                    <p className="text-xs text-zinc-500 truncate">{a.musteri} · {new Date(a.randevuZamani).toLocaleDateString('tr-TR')} · <span className={a.durum === 'APPROVED' ? 'text-emerald-600' : a.durum === 'REJECTED' ? 'text-red-500' : 'text-amber-600'}>{a.durum}</span></p>
                                  </div>
                                  <span className="ml-auto text-xs text-zinc-300 group-hover:text-zinc-500 shrink-0">→</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Sistem Sayfaları Category */}
                          {searchResults.pages.length > 0 && (
                            <div>
                              <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                                <LayoutDashboard size={13} className="text-zinc-400" />
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Sistem Sayfaları</span>
                              </div>
                              {searchResults.pages.map((pg: any) => (
                                <button
                                  key={`pg-${pg.id}`}
                                  onClick={() => handleSelectSearchResult('page', pg)}
                                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-zinc-50 transition-colors group"
                                >
                                  <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                                    <FileText size={14} className="text-zinc-500" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-charcoal truncate">{pg.title}</p>
                                    <p className="text-xs text-zinc-500 truncate">{pg.description}</p>
                                  </div>
                                  <span className="ml-auto text-xs text-zinc-300 group-hover:text-zinc-500 shrink-0">→</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Footer: Show all results */}
                          <div className="px-4 py-3 bg-zinc-50">
                            <button
                              onClick={() => { setActiveTab('portfolios'); setShowSearchDropdown(false); }}
                              className="w-full text-xs text-center font-semibold text-zinc-500 hover:text-charcoal transition-colors"
                            >
                              Tüm sonuçları portföylerde gör →
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </div>
          </header>


          {/* Subscription Expiration / Scheduled Package Warning Alert Banner */}
          {subInfo && (subInfo.kalanGun <= 7 || subInfo.gelecekPaket) && (
            <div className="bg-[#FEF08A] border-2 border-charcoal text-charcoal px-6 py-4 rounded-3xl flex justify-between items-center shadow-none">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-amber-800 shrink-0" size={22} />
                <div className="text-xs font-medium leading-relaxed">
                  {subInfo.kalanGun <= 7 ? (
                    <span>
                      <strong className="font-extrabold text-sm block mb-0.5 text-amber-950">Abonelik Döneminizin Bitmesine {subInfo.kalanGun} Gün Kaldı!</strong>
                      {subInfo.gelecekPaket 
                        ? `Süre dolduğunda (${new Date(subInfo.mevcutPaket.bitisTarihi).toLocaleDateString('tr-TR')}) otomatik olarak ${subInfo.gelecekPaket.paketAdi} (${subInfo.gelecekPaket.periyot === 'Yillik' ? 'Yıllık' : 'Aylık'}) paketine geçiş yapılacaktır.` 
                        : 'Paketiniz bitmeden kesintisiz devam etmek için Danışman Yönetimi alanından gelecek döneminizi planlayabilirsiniz.'}
                    </span>
                  ) : (
                    <span>
                      <strong className="font-extrabold text-sm block mb-0.5 text-charcoal">Gelecek Paket Değişimi Planlandı!</strong>
                      Mevcut paketiniz sona erdiğinde ({new Date(subInfo.mevcutPaket.bitisTarihi).toLocaleDateString('tr-TR')}), hesabınız otomatik olarak <strong>{subInfo.gelecekPaket?.paketAdi} ({subInfo.gelecekPaket?.periyot === 'Yillik' ? 'Yıllık' : 'Aylık'})</strong> paketine yükseltilecektir.
                    </span>
                  )}
                </div>
              </div>
              {user?.rol === 'YETKILI' && (
                <button 
                  onClick={() => setActiveTab('subscription')} 
                  className="px-4 py-2 bg-charcoal text-white rounded-full text-xs font-extrabold hover:bg-black transition-colors shrink-0 border-none ml-4 cursor-pointer"
                >
                  Aboneliği Yönet
                </button>
              )}
            </div>
          )}

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
                {employees.length > 0 ? (
                  employees.map(emp => (
                    <div 
                      key={emp.id}
                      onClick={() => { setSelectedEmployee(emp); setActiveTab('team'); }}
                      className="rounded-2xl p-4 bg-cream flex flex-col justify-between shadow-none border-none cursor-pointer hover:bg-zinc-100/60 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2.5 items-center">
                          <div className="w-10 h-10 rounded-full bg-pastelPurple border-none flex items-center justify-center font-bold text-xs">
                            {(emp.ad || 'U')[0]}{(emp.soyad || '')[0] || ''}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm">{emp.ad || ''} {emp.soyad || ''}</h4>
                            <span className="text-xs text-zinc-500">{emp.sozlesmeSayisi || 0} Aktif Portföy</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-charcoal uppercase ${
                          emp.durum === 'Ofiste' ? 'bg-[#BBF7D0]' : 'bg-[#FEF08A]'
                        }`}>
                          {emp.durum || 'Ofiste'}
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-charcoal/10 flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Kazanılan Ciro:</span>
                        <strong className="text-charcoal font-bold">{(emp.getirdigiPara || 0).toLocaleString('tr-TR')} TL</strong>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 py-6 text-center text-zinc-400 text-xs font-semibold">
                    Kayıtlı danışman bulunmuyor.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Data Table: Recent listings */}
            <div className="bento-card bg-white">
              <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <h3 className="text-xl font-extrabold text-charcoal">Son Eklenen Portföyler</h3>
                <button 
                  onClick={() => setActiveTab('portfolios')}
                  className="text-xs font-bold text-charcoal underline hover:text-black"
                >
                  Tümünü Gör
                </button>
              </div>

              <div className="table-responsive">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-zinc-200 text-xs font-extrabold text-zinc-500 uppercase">
                      <th className="pb-3 whitespace-nowrap">Tip / Tür</th>
                      <th className="pb-3 whitespace-nowrap">Lokasyon</th>
                      <th className="pb-3 text-right whitespace-nowrap">Fiyat</th>
                      <th className="pb-3 whitespace-nowrap">Görevli</th>
                      <th className="pb-3 text-right whitespace-nowrap">Durum</th>
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
                            p.tur === 'SATILIK' ? 'bg-[#FBCFE8]' : 'bg-[#BAE6FD]'
                          }`}>
                            {p.tur}
                          </span>
                        </td>
                        <td className="py-3.5 text-zinc-500">{p.il || ''} / {p.ilce || ''}</td>
                        <td className="py-3.5 text-right font-extrabold">{(p.fiyat || 0).toLocaleString('tr-TR')} TL</td>
                        <td className="py-3.5 font-medium">{p.gorevliUzman || ''}</td>
                        <td className="py-3.5 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-charcoal ${
                            p.durum === 'BOSTA' ? 'bg-[#BBF7D0] text-emerald-900' :
                            p.durum === 'KAPORA_ASAMASINDA' ? 'bg-[#FEF08A] text-amber-950' : 'bg-zinc-200 text-zinc-800'
                          }`}>
                            {(p.durum || 'BOSTA').replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ofis Durumu (Presence) Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Kendi Durumum: Toggle Switch Card */}
              <div className="bento-card bg-charcoal text-white flex flex-col justify-between min-h-[160px]">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/50 mb-1">Ofis Durumum</p>
                  <h3 className="text-2xl font-extrabold leading-tight">
                    {isOfisteMi ? 'Ofisteyim 🏢' : 'Ofiste Değilim 🏠'}
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    {isOfisteMi ? 'Ekip arkadaşların seni ofiste görüyor.' : 'Konumunuz diğerlerine görünmüyor.'}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/60">
                    {isOfisteMi ? '✓ Aktif' : '○ Pasif'}
                  </span>
                  {/* Toggle Switch */}
                  <button
                    onClick={handleToggleOfficeStatus}
                    disabled={presenceLoading}
                    className={`relative inline-flex items-center w-14 h-7 rounded-full transition-all duration-300 focus:outline-none border-none ${
                      isOfisteMi ? 'bg-emerald-400' : 'bg-white/20'
                    } ${presenceLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                    title={isOfisteMi ? 'Ofisten Ayrılıyorum' : 'Ofise Geldim'}
                  >
                    <span
                      className={`inline-block w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${
                        isOfisteMi ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Bugün Ofistekiler Paneli */}
              <div className="bento-card bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-extrabold text-charcoal flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    Bugün Ofistekiler
                  </h3>
                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {officeUsers.length} Kişi
                  </span>
                </div>
                {officeUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-zinc-400">
                    <Users size={28} className="mb-2 opacity-30" />
                    <p className="text-xs font-medium">Şu an ofiste kimse yok.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {officeUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 transition-colors">
                        {/* Avatar with pulsing online dot */}
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-full bg-[#BBF7D0] flex items-center justify-center text-xs font-extrabold text-charcoal">
                            {(u.ad || 'U')[0]}{(u.soyad || '')[0] || ''}
                          </div>
                          <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white"></span>
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-charcoal truncate">{u.ad} {u.soyad}</p>
                          <p className="text-xs text-zinc-500">{u.rol === 'YETKILI' ? 'Ofis Yetkilisi' : 'Gayrimenkul Uzmanı'}</p>
                        </div>
                        <span className="ml-auto text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">Ofiste</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Portfolios Tab */}
        {activeTab === 'portfolios' && (
          <div className="w-full">
            {/* Portfolios list (Full Width) */}
            <div className="bento-card bg-white">
              <div className="flex flex-wrap justify-between items-start mb-6 gap-3">
                <h2 className="text-xl md:text-2xl font-extrabold min-w-0 break-words">Portföy Yönetimi ({filterTag} Filtreli)</h2>
                <button 
                  onClick={() => setShowAddPortfolioModal(true)}
                  className="px-5 py-2 bg-charcoal text-white text-xs font-bold rounded-full hover:bg-black transition-colors flex items-center gap-1.5 border-none"
                >
                  <Plus size={14} /> Yeni Portföy Ekle
                </button>
              </div>

              {/* Category Filter Pills (Sadece Portföyler sayfasında) */}
              <div className="flex flex-wrap gap-2 mb-4">
                {['Tümü', 'Satılık', 'Kiralık', 'Konut', 'Arsa'].map((tag) => (
                  <button 
                    key={tag}
                    onClick={() => setFilterTag(tag)}
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
              
              {/* Scope Switcher: Portföyler vs Portföylerim */}
              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => setPortfolioScope('all')}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all border-none ${
                    portfolioScope === 'all' ? 'bg-[#FEF08A] text-charcoal' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                  }`}
                >
                  Tüm Portföyler
                </button>
                <button 
                  onClick={() => setPortfolioScope('mine')}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all border-none ${
                    portfolioScope === 'mine' ? 'bg-[#FEF08A] text-charcoal' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                  }`}
                >
                  Portföylerim
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPortfolios.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPortfolio(p)}
                    className="p-4 rounded-2xl cursor-pointer hover:bg-cream/60 transition-colors flex flex-wrap justify-between items-start gap-3 bg-cream/30 border-none min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2 items-center">
                        <strong className="text-md font-bold text-charcoal">{p.tip}</strong>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 border border-charcoal rounded-full uppercase ${
                          p.tur === 'SATILIK' ? 'bg-[#FBCFE8]' : 'bg-[#BAE6FD]'
                        }`}>
                          {p.tur}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 border border-charcoal rounded-full uppercase ${
                          p.durum === 'BOSTA' ? 'bg-[#BBF7D0]' : 'bg-[#FEF08A]'
                        }`}>
                          {(p.durum || 'BOSTA').replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 mt-2 flex items-center gap-1 min-w-0">
                        <MapPin size={12} className="shrink-0" /> <span className="truncate">{p.il || ''} / {p.ilce || ''} - {p.mahalle || ''}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-md text-charcoal whitespace-nowrap">{(p.fiyat || 0).toLocaleString('tr-TR')} TL</div>
                      <span className="text-[10px] text-zinc-400 font-semibold mt-1 block truncate max-w-[120px]">Uzman: {p.gorevliUzman || ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio Details Popup Modal */}
            {selectedPortfolio && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-3 md:p-4 overflow-y-auto">
                {isEditingPortfolio ? (
                  /* Edit Mode Form */
                  <form 
                    onSubmit={handleSaveEditPortfolio}
                    className="bg-white rounded-3xl p-5 md:p-8 max-w-lg w-full relative border-none shadow-none flex flex-col gap-4 max-h-[90vh] overflow-y-auto my-auto"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Portföy Düzenle</span>
                        <h2 className="text-2xl font-extrabold text-charcoal mt-1">Bilgileri Güncelle</h2>
                      </div>
                      <button 
                        type="button"
                        className="p-1.5 border border-charcoal rounded-full hover:bg-zinc-100 text-charcoal" 
                        onClick={() => setIsEditingPortfolio(false)}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-zinc-600 font-semibold block mb-1">Emlak Tipi</label>
                        <select 
                          className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                          value={editPortTip} 
                          onChange={e => setEditPortTip(e.target.value)}
                        >
                          <option value="DAIRE">Daire</option>
                          <option value="VILLA">Villa</option>
                          <option value="MUSTAKIL">Müstakil Ev</option>
                          <option value="ARSA">Arsa</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-xs text-zinc-600 font-semibold block mb-1">İşlem Türü</label>
                        <select 
                          className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                          value={editPortTur} 
                          onChange={e => setEditPortTur(e.target.value)}
                        >
                          <option value="SATILIK">Satılık</option>
                          <option value="KIRALIK">Kiralık</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-zinc-600 font-semibold block mb-1">Fiyat (TL)</label>
                        <input 
                          type="number" 
                          className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                          value={editPortFiyat} 
                          onChange={e => setEditPortFiyat(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-600 font-semibold block mb-1">Metrekare (m²)</label>
                        <input 
                          type="number" 
                          className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                          value={editPortMetrekare} 
                          onChange={e => setEditPortMetrekare(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {editPortTip !== 'ARSA' && (
                      <div>
                        <label className="text-xs text-zinc-600 font-semibold block mb-1">Oda Sayısı</label>
                        <select 
                          className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                          value={editPortOdaSayisi} 
                          onChange={e => setEditPortOdaSayisi(e.target.value)}
                        >
                          <option value="1+0">1+0 (Stüdyo)</option>
                          <option value="1+1">1+1</option>
                          <option value="2+1">2+1</option>
                          <option value="3+1">3+1</option>
                          <option value="4+1">4+1</option>
                          <option value="4+2">4+2</option>
                          <option value="5+1">5+1 ve üzeri</option>
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-zinc-600 font-semibold block mb-1">İl</label>
                        <input 
                          type="text" 
                          className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                          value={editPortIl} 
                          onChange={e => setEditPortIl(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-600 font-semibold block mb-1">İlçe</label>
                        <input 
                          type="text" 
                          className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                          value={editPortIlce} 
                          onChange={e => setEditPortIlce(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-600 font-semibold block mb-1">Mahalle</label>
                        <input 
                          type="text" 
                          className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                          value={editPortMahalle} 
                          onChange={e => setEditPortMahalle(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-cream border-none flex flex-col gap-3">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block">Ev Sahibi (Mülk Sahibi) İletişim Bilgileri</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-600 block mb-0.5">Adı Soyadı</label>
                          <input 
                            type="text" 
                            className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none"
                            value={editPortLandlordName} 
                            onChange={e => setEditPortLandlordName(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-600 block mb-0.5">Telefon</label>
                          <input 
                            type="text" 
                            className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none"
                            value={editPortLandlordPhone} 
                            onChange={e => setEditPortLandlordPhone(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button 
                        type="submit"
                        className="flex-1 py-2.5 bg-charcoal text-white text-xs font-bold rounded-full hover:bg-black transition-colors border-none"
                      >
                        Değişiklikleri Kaydet
                      </button>
                      <button 
                        type="button" 
                        className="flex-1 py-2 text-zinc-500 text-xs font-bold rounded-full hover:bg-zinc-100 transition-colors border-none"
                        onClick={() => setIsEditingPortfolio(false)}
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                ) : (
                  /* View Mode */
                  <div className="bg-white rounded-3xl p-5 md:p-8 max-w-lg w-full relative border-none shadow-none flex flex-col gap-6 max-h-[90vh] overflow-y-auto my-auto">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Portföy Detayı</span>
                        <h2 className="text-xl md:text-2xl font-extrabold text-charcoal mt-1 break-words">{selectedPortfolio.tip} - {selectedPortfolio.tur}</h2>
                      </div>
                      <button className="p-1.5 border border-charcoal rounded-full hover:bg-zinc-100 text-charcoal" onClick={() => setSelectedPortfolio(null)}>
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 text-sm">
                      <div className="flex flex-wrap justify-between gap-2 py-2 border-b border-zinc-200">
                        <span className="text-zinc-500 shrink-0">Konum Bilgisi:</span>
                        <strong className="font-bold text-right min-w-0 break-words">{selectedPortfolio.il} / {selectedPortfolio.ilce} / {selectedPortfolio.mahalle} Mah.</strong>
                      </div>
                      <div className="flex flex-wrap justify-between gap-2 py-2 border-b border-zinc-200">
                        <span className="text-zinc-500 shrink-0">Fiyat:</span>
                        <strong className="font-extrabold text-indigo-700 whitespace-nowrap">{selectedPortfolio.fiyat.toLocaleString('tr-TR')} TL</strong>
                      </div>
                      <div className="flex justify-between py-2 border-b border-zinc-200">
                        <span className="text-zinc-500">Metrekare:</span>
                        <strong className="font-semibold">{selectedPortfolio.metrekare ? `${selectedPortfolio.metrekare} m²` : 'Belirtilmedi'}</strong>
                      </div>
                      {selectedPortfolio.tip !== 'ARSA' && selectedPortfolio.odaSayisi && (
                        <div className="flex justify-between py-2 border-b border-zinc-200">
                          <span className="text-zinc-500">Oda Sayısı:</span>
                          <strong className="font-semibold">{selectedPortfolio.odaSayisi}</strong>
                        </div>
                      )}
                      <div className="flex justify-between py-2 border-b border-zinc-200">
                        <span className="text-zinc-500">Kapora / Depozito:</span>
                        <strong className="font-semibold">{(selectedPortfolio.kapora || 0).toLocaleString('tr-TR')} TL / {selectedPortfolio.depozito.toLocaleString('tr-TR')} TL</strong>
                      </div>
                      <div className="flex justify-between py-2 border-b border-zinc-200">
                        <span className="text-zinc-500">Portföy Danışmanı:</span>
                        <strong className="font-semibold">{selectedPortfolio.gorevliUzman}</strong>
                      </div>
                      
                      {/* Landlord details privacy checks */}
                      <div className="mt-2 p-4 rounded-2xl bg-cream border-none leading-relaxed">
                        <span className="text-xs text-zinc-500 font-bold block mb-1">Ev Sahibi (Landlord) İletişim Bilgileri:</span>
                        {user?.rol === 'YETKILI' || selectedPortfolio.gorevliUzmanId === user?.id ? (
                          <div className="flex flex-col gap-0.5">
                            <strong className="text-sm font-extrabold text-charcoal">{selectedPortfolio.evSahibiAdi}</strong>
                            <span className="text-xs text-zinc-600">{selectedPortfolio.evSahibiTelefon}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-red-700 text-xs font-semibold mt-1">
                            <Lock size={14} />
                            <span>Gizli Veri (Sadece yetkili ve ilgili uzman görebilir)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Appointment Form */}
                    {user?.rol === 'UZMAN' && selectedPortfolio.gorevliUzmanId !== user?.id && (
                      <div className="p-4 rounded-2xl bg-[#E9D5FF]/20 border-none flex flex-col gap-3">
                        <h4 className="font-extrabold text-sm flex items-center gap-2">
                          <Calendar size={16} /> Randevu Teklifi Gönder
                        </h4>
                        
                        {selectedPortfolio.durum === 'KAPORA_ASAMASINDA' || selectedPortfolio.durum === 'KIRALANDI_SATILDI' ? (
                          <div className="flex items-center gap-1.5 text-xs text-red-700 font-medium">
                            <AlertTriangle size={14} />
                            <span>Bu portföyün durumundan dolayı randevu alınamaz!</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            <div>
                              <label className="text-xs text-zinc-600 font-semibold block mb-1">Katılacak Müşteriniz</label>
                              <select className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none" value={selectedMusteriId} onChange={e => setSelectedMusteriId(e.target.value)}>
                                <option value="">-- Alıcı Adayı Seçin --</option>
                                {clients.map(c => (
                                  <option key={c.id} value={c.id}>{c.ad} ({c.tip})</option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="text-xs text-zinc-600 font-semibold block mb-1">Tarih & Saat</label>
                              <input type="datetime-local" className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                            </div>

                            <button className="w-full py-2.5 bg-charcoal text-white text-xs font-extrabold rounded-full hover:bg-black transition-colors border-none" onClick={() => { handleRequestAppointment(selectedPortfolio); setSelectedPortfolio(null); }}>
                              Teklifi İlet
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Edit actions for owners/admins */}
                    {(user?.rol === 'YETKILI' || selectedPortfolio.gorevliUzmanId === user?.id) && (
                      <button 
                        onClick={() => startEditPortfolio(selectedPortfolio)}
                        className="w-full py-2.5 bg-[#FEF08A] hover:bg-[#FEF08A]/80 text-charcoal text-xs font-bold rounded-full transition-colors border-none cursor-pointer"
                      >
                        Portföyü Düzenle
                      </button>
                    )}

                    {/* Specific Property Appointments Calendar Section */}
                    <div className="p-5 rounded-3xl bg-cream border-2 border-charcoal/10 flex flex-col gap-4 mt-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">ÖZEL RANDEVU TAKVİMİ</span>
                          <h4 className="font-extrabold text-sm text-charcoal">Bu İlana Ait Gösterimler</h4>
                        </div>
                        <span className="text-xs font-extrabold px-2.5 py-1 bg-white border border-charcoal rounded-full text-indigo-700">
                          {popAppointments.length} Toplam
                        </span>
                      </div>

                      {/* Pop-Up Mini Calendar Controls & Grid */}
                      <div className="bg-white p-4 rounded-2xl border border-zinc-200">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-extrabold text-xs capitalize">{popMonthName}</span>
                          <div className="flex gap-1 items-center">
                            <button 
                              type="button"
                              onClick={handlePopToday}
                              className="px-2 py-0.5 text-[9px] font-extrabold border border-charcoal rounded-md hover:bg-zinc-200 transition-all cursor-pointer"
                              title="Bugüne Git"
                            >
                              Bugün
                            </button>
                            <button 
                              type="button"
                              onClick={handlePopPrevMonth}
                              className="p-1 border border-charcoal rounded-md hover:bg-zinc-200 transition-all cursor-pointer"
                              title="Önceki Ay"
                            >
                              <ChevronLeft size={12} />
                            </button>
                            <button 
                              type="button"
                              onClick={handlePopNextMonth}
                              className="p-1 border border-charcoal rounded-md hover:bg-zinc-200 transition-all cursor-pointer"
                              title="Sonraki Ay"
                            >
                              <ChevronLeft className="rotate-180" size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-7 gap-1 text-[9px] text-center font-bold">
                          {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(d => (
                            <span key={d} className="text-zinc-400">{d}</span>
                          ))}
                          {popBlankDays.map((_, i) => (
                            <span key={`pop-blank-${i}`} className="p-1"></span>
                          ))}
                          {popDaysArray.map(day => {
                            const hasApp = popAppointments.some((a: any) => Number(a.gun) === day && Number(a.ay) === (popMonth + 1) && Number(a.yil) === popYear);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => setPopSelectedDay(day)}
                                className={`p-1 rounded transition-colors relative flex flex-col items-center justify-center cursor-pointer ${
                                  popSelectedDay === day ? 'bg-charcoal text-white font-extrabold' : 'hover:bg-zinc-100'
                                }`}
                              >
                                <span>{day}</span>
                                {hasApp && (
                                  <span className={`w-1.5 h-1.5 rounded-full absolute bottom-0.5 ${
                                    popSelectedDay === day ? 'bg-pastelYellow' : 'bg-indigo-600'
                                  }`} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Selected Day Timeline for this Property */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-extrabold uppercase text-zinc-500">
                          {popSelectedDay} {popMonthName} Randevu Akışı
                        </span>
                        {(() => {
                          const dayApps = popAppointments.filter((a: any) => Number(a.gun) === popSelectedDay && Number(a.ay) === (popMonth + 1) && Number(a.yil) === popYear);
                          if (dayApps.length === 0) {
                            return (
                              <span className="text-xs text-zinc-400 italic p-2.5 bg-white rounded-xl text-center border border-zinc-200">
                                Bu tarihte bu ev için henüz randevu alınmamıştır.
                              </span>
                            );
                          }
                          return (
                            <div className="flex flex-col gap-2">
                              {dayApps.map((app: any) => (
                                <div key={app.id} className="p-3 rounded-xl bg-white border border-zinc-200 flex justify-between items-center text-xs">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-extrabold text-charcoal">{app.zaman || '12:00'} - Gösterim</span>
                                    <span className="text-zinc-500 text-[10px]">Uzman: {app.talepEden} | Müşteri: {app.musteri}</span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border border-charcoal uppercase ${
                                    app.durum === 'APPROVED' ? 'bg-[#BBF7D0] text-emerald-950' : 
                                    app.durum === 'PENDING' ? 'bg-[#FEF08A] text-amber-950' : 'bg-[#FBCFE8] text-red-950'
                                  }`}>
                                    {app.durum}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <button className="w-full py-2 text-zinc-500 text-xs font-bold rounded-full hover:bg-zinc-100 transition-colors border-none" onClick={() => setSelectedPortfolio(null)}>
                      Kapat
                    </button>

                  </div>
                )}
              </div>
            )}

            {/* Add Portfolio Modal */}
            {showAddPortfolioModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <form 
                  onSubmit={handleAddPortfolio} 
                  className="bg-white rounded-3xl p-8 max-w-lg w-full relative border-none shadow-none flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Portföy İşlemleri</span>
                      <h2 className="text-2xl font-extrabold text-charcoal mt-1">Yeni Portföy Ekle</h2>
                    </div>
                    <button 
                      type="button" 
                      className="p-1.5 border border-charcoal rounded-full hover:bg-zinc-100 text-charcoal" 
                      onClick={() => setShowAddPortfolioModal(false)}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-600 font-semibold block mb-1">Emlak Tipi</label>
                      <select 
                        className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                        value={newPortTip} 
                        onChange={e => setNewPortTip(e.target.value)}
                      >
                        <option value="DAIRE">Daire</option>
                        <option value="VILLA">Villa</option>
                        <option value="MUSTAKIL">Müstakil Ev</option>
                        <option value="ARSA">Arsa</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-xs text-zinc-600 font-semibold block mb-1">İşlem Türü</label>
                      <select 
                        className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                        value={newPortTur} 
                        onChange={e => setNewPortTur(e.target.value)}
                      >
                        <option value="SATILIK">Satılık</option>
                        <option value="KIRALIK">Kiralık</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-600 font-semibold block mb-1">Fiyat (TL)</label>
                      <input 
                        type="number" 
                        placeholder="Fiyat girin"
                        className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                        value={newPortFiyat} 
                        onChange={e => setNewPortFiyat(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-600 font-semibold block mb-1">Metrekare (m²)</label>
                      <input 
                        type="number" 
                        placeholder="Örn: 120"
                        className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                        value={newPortMetrekare} 
                        onChange={e => setNewPortMetrekare(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {newPortTip !== 'ARSA' && (
                    <div>
                      <label className="text-xs text-zinc-600 font-semibold block mb-1">Oda Sayısı</label>
                      <select 
                        className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                        value={newPortOdaSayisi} 
                        onChange={e => setNewPortOdaSayisi(e.target.value)}
                      >
                        <option value="1+0">1+0 (Stüdyo)</option>
                        <option value="1+1">1+1</option>
                        <option value="2+1">2+1</option>
                        <option value="3+1">3+1</option>
                        <option value="4+1">4+1</option>
                        <option value="4+2">4+2</option>
                        <option value="5+1">5+1 ve üzeri</option>
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-zinc-600 font-semibold block mb-1">İl</label>
                      <input 
                        type="text" 
                        className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                        value={newPortIl} 
                        onChange={e => setNewPortIl(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-600 font-semibold block mb-1">İlçe</label>
                      <input 
                        type="text" 
                        placeholder="İlçe"
                        className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                        value={newPortIlce} 
                        onChange={e => setNewPortIlce(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-600 font-semibold block mb-1">Mahalle</label>
                      <input 
                        type="text" 
                        placeholder="Mahalle"
                        className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                        value={newPortMahalle} 
                        onChange={e => setNewPortMahalle(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-cream border-none flex flex-col gap-3">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase block">Ev Sahibi (Mülk Sahibi) İrtibat Bilgileri</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-600 block mb-0.5">Adı Soyadı</label>
                        <input 
                          type="text" 
                          placeholder="Ad Soyad"
                          className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none"
                          value={newPortLandlordName} 
                          onChange={e => setNewPortLandlordName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-600 block mb-0.5">Telefon</label>
                        <input 
                          type="text" 
                          placeholder="05xx..."
                          className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none"
                          value={newPortLandlordPhone} 
                          onChange={e => setNewPortLandlordPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button 
                      type="submit"
                      className="flex-1 py-2.5 bg-charcoal text-white text-xs font-bold rounded-full hover:bg-black transition-colors border-none"
                    >
                      Portföyü Kaydet
                    </button>
                    <button 
                      type="button" 
                      className="flex-1 py-2 text-zinc-500 text-xs font-bold rounded-full hover:bg-zinc-100 transition-colors border-none"
                      onClick={() => setShowAddPortfolioModal(false)}
                    >
                      İptal
                    </button>
                  </div>

                </form>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="bento-card bg-white">
            <h2 className="text-2xl font-extrabold mb-4">Gelen Randevu Talepleri</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-zinc-200 text-xs font-extrabold text-zinc-500 uppercase">
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
                          app.durum === 'APPROVED' ? 'bg-[#BBF7D0] text-emerald-950' : 
                          app.durum === 'PENDING' ? 'bg-[#FEF08A] text-amber-950' : 'bg-[#FBCFE8] text-red-950'
                        }`}>
                          {app.durum}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {app.durum === 'PENDING' ? (
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => handleUpdateAppStatus(app.id, 'APPROVED')}
                              className="px-3 py-1 bg-[#BBF7D0] border border-charcoal rounded-full text-[11px] font-extrabold hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                            >
                              Onayla
                            </button>
                            <button 
                              onClick={() => handleUpdateAppStatus(app.id, 'REJECTED')}
                              className="px-3 py-1 bg-[#FBCFE8] border border-charcoal rounded-full text-[11px] font-extrabold hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
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
              <h2 className="text-2xl font-extrabold mb-4">Müşterilerim (Portföy & Alıcı Talepleri)</h2>
              <div className="flex flex-col gap-3">
                {clients.map(c => (
                  <div key={c.id} className="p-4 rounded-2xl bg-cream flex justify-between items-center shadow-none border-none">
                    <div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <strong className="font-extrabold text-sm">{c.ad} {c.soyad}</strong>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 border border-charcoal rounded-full uppercase ${
                          c.musteriTipi === 'ALICI' ? 'bg-[#BBF7D0]' :
                          c.musteriTipi === 'KIRACI' ? 'bg-[#BAE6FD]' :
                          c.musteriTipi === 'SATICI' ? 'bg-[#FBCFE8]' : 'bg-[#FED7AA]'
                        }`}>
                          {c.musteriTipi === 'ALICI' ? 'ALICI' :
                           c.musteriTipi === 'KIRACI' ? 'KİRACI' :
                           c.musteriTipi === 'SATICI' ? 'SATICI' : 'KİRAYA VEREN'}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 block mt-1">Telefon: {c.telefon}</span>
                      {c.musteriTipi !== 'SATICI' && c.musteriTipi !== 'KIRAYA_VEREN' && c.butce > 0 && (
                        <span className="text-xs text-indigo-600 font-semibold block mt-0.5">Bütçe: {c.butce.toLocaleString('tr-TR')} TL</span>
                      )}
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-pastelYellow">
                      {c.tip}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bento-card bg-white">
              <h2 className="text-xl font-extrabold mb-4">Yeni Müşteri Ekle</h2>
              <form onSubmit={handleAddClient} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 block mb-1">Ad Soyad</label>
                  <input 
                    type="text" 
                    className="w-full text-sm p-3 rounded-2xl bg-zinc-50 focus:outline-none" 
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
                    className="w-full text-sm p-3 rounded-2xl bg-zinc-50 focus:outline-none" 
                    placeholder="Örn: 0505 123 45 67"
                    value={newClientPhone}
                    onChange={e => setNewClientPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-1">Müşteri Tipi</label>
                    <select 
                      className="w-full text-sm p-3 rounded-2xl bg-zinc-50 focus:outline-none"
                      value={newClientMusteriTipi}
                      onChange={e => setNewClientMusteriTipi(e.target.value)}
                    >
                      <option value="ALICI">Alıcı (Satın Almak İstiyor)</option>
                      <option value="KIRACI">Kiracı (Kiralamak İstiyor)</option>
                      <option value="SATICI">Satıcı (Mülkünü Satıyor)</option>
                      <option value="KIRAYA_VEREN">Kiraya Veren (Mülkünü Kiralıyor)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-1">Tercih Ettiği Tip</label>
                    <select 
                      className="w-full text-sm p-3 rounded-2xl bg-zinc-50 focus:outline-none"
                      value={newClientType}
                      onChange={e => setNewClientType(e.target.value)}
                    >
                      <option value="DAIRE">Daire</option>
                      <option value="VILLA">Villa</option>
                      <option value="MUSTAKIL">Müstakil Konut</option>
                      <option value="ARSA">Arsa</option>
                    </select>
                  </div>
                </div>

                {newClientMusteriTipi !== 'SATICI' && newClientMusteriTipi !== 'KIRAYA_VEREN' && (
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-1">Maksimum Bütçe / Fiyat (TL)</label>
                    <input 
                      type="number" 
                      className="w-full text-sm p-3 rounded-2xl bg-zinc-50 focus:outline-none" 
                      placeholder="Örn: 3500000"
                      value={newClientBudget}
                      onChange={e => setNewClientBudget(e.target.value)}
                    />
                  </div>
                )}

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
                      className="w-full text-sm p-3 rounded-2xl pl-10 bg-zinc-50 focus:outline-none" 
                      value={grossCommission}
                      onChange={e => setGrossCommission(Number(e.target.value))}
                    />
                    <DollarSign size={16} className="absolute left-3.5 top-4 text-zinc-400" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 block mb-1">Çalışma Senaryosu</label>
                  <select 
                    className="w-full text-sm p-3 rounded-2xl bg-zinc-50 focus:outline-none"
                    value={calcScenario}
                    onChange={e => setCalcScenario(e.target.value as any)}
                  >
                    <option value="A">Senaryo A - Kendi Müşterisi</option>
                    <option value="B">Senaryo B - Ortak Çalışma (Ofis İçi)</option>
                    <option value="C">Senaryo C - Dış Ortaklı Paylaşım</option>
                  </select>
                </div>

                {/* Scenario details text */}
                <div className="p-4 rounded-2xl bg-[#E9D5FF]/20 text-xs flex flex-col gap-1.5 leading-relaxed">
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
                
                <div className="p-4 rounded-2xl bg-cream flex flex-col gap-3 border-none">
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
        {activeTab === 'analytics' && user?.rol === 'YETKILI' && (
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
        {activeTab === 'team' && user?.rol === 'YETKILI' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bento-card bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-extrabold">Ofis Çalışan Yönetimi</h2>
                <span className={`px-3 py-1 border border-charcoal rounded-full text-xs font-bold ${
                  packageType === 'BASIC' ? 'bg-[#FEF08A]' : 'bg-[#BBF7D0]'
                }`}>
                  Paket: {packageType}
                </span>
              </div>

              {empError && (
                <div className="p-4 rounded-2xl bg-red-100 text-red-900 text-xs font-semibold mb-4 flex items-center gap-2 border-none">
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
                    className="flex-1 text-xs p-2 border-2 border-charcoal rounded-full bg-cream focus:outline-none"
                    value={newEmpName}
                    onChange={e => setNewEmpName(e.target.value)}
                    required
                  />
                  <input 
                    type="email" 
                    placeholder="E-posta"
                    className="flex-1 text-xs p-2 border-2 border-charcoal rounded-full bg-cream focus:outline-none"
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
                  <div 
                    key={emp.id} 
                    onClick={() => setSelectedEmployee(emp)}
                    className={`p-3 rounded-xl cursor-pointer transition-colors flex justify-between items-center text-xs border-none ${
                      selectedEmployee?.id === emp.id ? 'bg-[#FEF08A]' : 'bg-cream hover:bg-zinc-100'
                    }`}
                  >
                    <div>
                      <strong>{emp.ad || ''} {emp.soyad || ''}</strong>
                      <span className="block text-zinc-500 mt-0.5">{emp.eposta || ''}</span>
                    </div>
                    <div className="text-right">
                      <strong>{(emp.getirdigiPara || 0).toLocaleString('tr-TR')} TL</strong>
                      <span className="block text-[10px] text-zinc-400 mt-0.5">{emp.sozlesmeSayisi || 0} Sözleşme</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detail Card or Subscription */}
            {selectedEmployee ? (
              <div className="bento-card bg-white flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Danışman Detayı</span>
                      <h3 className="text-xl font-extrabold text-charcoal mt-1">{selectedEmployee.ad} {selectedEmployee.soyad}</h3>
                    </div>
                    <button className="p-1 border border-charcoal rounded-full hover:bg-zinc-100" onClick={() => setSelectedEmployee(null)}>
                      <X size={14} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 text-xs mb-6">
                    <div className="flex justify-between py-2 border-b border-zinc-200">
                      <span className="text-zinc-500">E-posta:</span>
                      <strong className="font-semibold">{selectedEmployee.eposta}</strong>
                    </div>
                    <div className="flex justify-between py-2 border-b border-zinc-200">
                      <span className="text-zinc-500">Rol:</span>
                      <strong className="font-semibold">{selectedEmployee.rol === 'YETKILI' ? 'Ofis Yetkilisi (Broker)' : 'Gayrimenkul Uzmanı'}</strong>
                    </div>
                    <div className="flex justify-between py-2 border-b border-zinc-200">
                      <span className="text-zinc-500">Durum:</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-950 font-bold rounded-full">{selectedEmployee.durum}</span>
                    </div>

                    <div className="mt-4 p-4 rounded-2xl bg-cream border-none leading-relaxed">
                      <span className="text-[10px] text-zinc-500 font-bold block mb-1">GİRİŞ ŞİFRESİ BİLGİSİ:</span>
                      {selectedEmployee.ilkGirisMi ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-indigo-700 font-extrabold text-sm">
                            <Lock size={14} />
                            <span>Geçici Şifre: Homey123!</span>
                          </div>
                          <span className="text-[10px] text-zinc-500">Danışman henüz ilk girişini yapmamıştır, geçici şifre geçerlidir.</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-sm">
                            <Check size={14} />
                            <span>Şifre Özel Olarak Güncellendi</span>
                          </div>
                          <span className="text-[10px] text-zinc-500">Güvenlik gereği, kullanıcının kendi belirlediği şifre şifrelenmiş olarak tutulur ve görüntülenemez.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleResetEmployeePassword(selectedEmployee.id)}
                    className="w-full py-2.5 bg-charcoal text-white text-xs font-bold rounded-full hover:bg-black transition-colors"
                  >
                    Şifreyi "Homey123!" Olarak Sıfırla
                  </button>
                  <button 
                    onClick={() => setSelectedEmployee(null)}
                    className="w-full py-2 text-zinc-500 text-xs font-bold rounded-full hover:bg-zinc-100 transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            ) : (
              /* Default Consultant Info Card when no employee is selected */
              <div className="bento-card bg-white flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest block">Danışman Yönetimi</span>
                      <h3 className="text-xl font-extrabold text-charcoal mt-0.5">Ofis Ekip Özeti</h3>
                    </div>
                    <span className="px-3 py-1 bg-pastelYellow border border-charcoal rounded-full text-xs font-extrabold uppercase">
                      {employees.length} Aktif Uzman
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                    Sol taraftaki listeden bir danışman seçerek detaylarını inceleyebilir, şifresini sıfırlayabilir veya performansını takip edebilirsiniz.
                  </p>

                  <div className="p-4 rounded-2xl bg-cream flex flex-col gap-3 text-xs border-none mb-4">
                    <div className="flex justify-between items-center">
                      <span>Mevcut Danışman Sayısı:</span>
                      <strong className="font-extrabold">{employees.length} Kullanıcı</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Mevcut Lisans Limiti:</span>
                      <strong className="font-extrabold text-indigo-700">
                        {subInfo?.mevcutPaket?.calisanKotasi ? `${subInfo.mevcutPaket.calisanKotasi} Kişi (BASIC)` : 'Sınırsız (PREMIUM)'}
                      </strong>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveTab('subscription')}
                  className="w-full py-2.5 bg-charcoal text-white text-xs font-extrabold rounded-full hover:bg-black transition-all border-none"
                >
                  Abonelik ve Paket Detaylarını Gör →
                </button>
              </div>
            )}

          </div>
        )}

        {/* Tab 8: Dedicated Subscription & License Management Page (YETKILI only) */}
        {activeTab === 'subscription' && user?.rol === 'YETKILI' && (
          <div className="bento-card bg-white">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Lisans ve Paket Yönetimi</span>
                <h2 className="text-2xl font-extrabold text-charcoal mt-1">Abonelik & Lisans Yönetimi</h2>
              </div>
              <span className="px-4 py-1.5 bg-[#FEF08A] border-2 border-charcoal rounded-full text-xs font-extrabold uppercase tracking-wide">
                {subInfo?.mevcutPaket?.paketAdi || packageType} PAKET
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Box: Active Subscription Details & Remaining Days Progress Bar */}
              <div className="p-6 rounded-3xl bg-cream border-none flex flex-col justify-between gap-6">
                <div>
                  <h3 className="text-lg font-extrabold text-charcoal mb-2">Aktif Abonelik Durumu</h3>
                  <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                    BASIC planda en fazla 4 gayrimenkul uzmanı ekleyebilirsiniz. PREMIUM planda ise sınırsız danışman lisansı tanımlanır.
                  </p>

                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center text-sm font-extrabold">
                      <span className="text-zinc-600">Abonelik Dönemi Kalan Süre:</span>
                      <span className="text-charcoal text-base">{subInfo?.kalanGun ?? 30} Gün</span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full bg-zinc-200 h-4 rounded-full overflow-hidden border border-charcoal/30 relative">
                      <div 
                        className="h-full bg-gradient-to-r from-pastelYellow via-pastelBlue to-pastelGreen transition-all duration-500"
                        style={{ width: `${subInfo?.ilerlemeYuzdesi ?? 10}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs text-zinc-500 font-semibold">
                      <span>Başlangıç: {subInfo?.mevcutPaket?.baslangicTarihi ? new Date(subInfo.mevcutPaket.baslangicTarihi).toLocaleDateString('tr-TR') : 'Bugün'}</span>
                      <span>Bitiş: {subInfo?.mevcutPaket?.bitisTarihi ? new Date(subInfo.mevcutPaket.bitisTarihi).toLocaleDateString('tr-TR') : '30 Gün Sonra'}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border-none flex flex-col gap-2 mt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Mevcut Ödeme Periyodu:</span>
                        <strong className="font-extrabold">{subInfo?.mevcutPaket?.periyot === 'Yillik' ? 'Yıllık Abonelik' : subInfo?.mevcutPaket?.periyot === 'Aylik' ? 'Aylık Abonelik' : 'Deneme Süreci'}</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-zinc-100 pt-2">
                        <span className="text-zinc-500">Mevcut Danışman Kullanımı:</span>
                        <strong className="font-extrabold">{employees.length} / {subInfo?.mevcutPaket?.calisanKotasi ?? (subInfo?.mevcutPaket?.paketAdi === 'Premium' ? 'Sınırsız' : 4)} Kullanıcı</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Box: Scheduled Package Selector / Current Schedule Badge */}
              <div className="p-6 rounded-3xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between gap-6">
                <div>
                  <h3 className="text-lg font-extrabold text-charcoal mb-2">Gelecek Dönem Paket Planlayıcı</h3>
                  <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                    O anki paketinizin süresi dolana kadar kesinti yaşanmaz. Seçtiğiniz yeni paket mevcut abonelik bitiminde otomatik aktifleşir.
                  </p>

                  {/* Scheduled Future Package Notification if scheduled */}
                  {subInfo?.gelecekPaket ? (
                    <div className="p-5 rounded-2xl bg-[#BBF7D0]/60 border-2 border-emerald-600 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide">✓ Gelecek Paket Planlandı</span>
                        <button 
                          onClick={handleCancelScheduledChange}
                          className="text-xs font-bold text-red-700 underline hover:text-red-900 border-none bg-transparent cursor-pointer"
                        >
                          Planı İptal Et
                        </button>
                      </div>
                      <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                        Mevcut paketinizin süresi dolduğunda ({new Date(subInfo.mevcutPaket.bitisTarihi).toLocaleDateString('tr-TR')}), hesabınız otomatik olarak <strong>{subInfo.gelecekPaket.paketAdi} ({subInfo.gelecekPaket.periyot === 'Yillik' ? 'Yıllık' : 'Aylık'})</strong> paketine geçecektir.
                      </p>
                    </div>
                  ) : (
                    /* Future Package Change Selector Form */
                    <div className="flex flex-col gap-4">
                      {/* Billing Period Switcher for Next Term */}
                      <div className="flex bg-zinc-200/80 p-1 rounded-xl">
                        <button 
                          type="button" 
                          onClick={() => setSchedPeriyot('AYLIK')}
                          className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all border-none ${
                            schedPeriyot === 'AYLIK' ? 'bg-white text-charcoal shadow-sm' : 'text-zinc-500 bg-transparent'
                          }`}
                        >
                          Aylık Ödeme
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setSchedPeriyot('YILLIK')}
                          className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all border-none ${
                            schedPeriyot === 'YILLIK' ? 'bg-white text-charcoal shadow-sm' : 'text-zinc-500 bg-transparent'
                          }`}
                        >
                          Yıllık Ödeme (%20 İndirimli)
                        </button>
                      </div>

                      {/* Target Package Selection Cards */}
                      <div className="grid grid-cols-2 gap-3">
                        <div 
                          onClick={() => setSchedPaketTipi('BASIC')}
                          className={`p-3 rounded-2xl cursor-pointer border-2 transition-all flex flex-col justify-between ${
                            schedPaketTipi === 'BASIC' ? 'border-charcoal bg-[#BAE6FD]' : 'border-zinc-200 bg-white hover:bg-zinc-100'
                          }`}
                        >
                          <span className="text-xs font-extrabold block">BASIC Paket</span>
                          <span className="text-[10px] text-zinc-600 block mt-1">4 Danışman Kotası</span>
                        </div>

                        <div 
                          onClick={() => setSchedPaketTipi('PREMIUM')}
                          className={`p-3 rounded-2xl cursor-pointer border-2 transition-all flex flex-col justify-between ${
                            schedPaketTipi === 'PREMIUM' ? 'border-charcoal bg-[#BBF7D0]' : 'border-zinc-200 bg-white hover:bg-zinc-100'
                          }`}
                        >
                          <span className="text-xs font-extrabold block">PREMIUM Paket</span>
                          <span className="text-[10px] text-zinc-600 block mt-1">Sınırsız Danışman</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleSchedulePackageChange(schedPaketTipi, schedPeriyot)}
                        className="w-full py-3 bg-charcoal text-white text-xs font-extrabold rounded-full hover:bg-black transition-all border-none mt-2 cursor-pointer"
                      >
                        Mevcut Paket Bitiminde {schedPaketTipi} Pakete Geç ({schedPeriyot === 'YILLIK' ? 'Yıllık' : 'Aylık'})
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 8: Commission settings (YETKILI only) */}
        {activeTab === 'settings' && user?.rol === 'YETKILI' && (
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

      {/* RIGHT PANEL (Widgets & Schedule / Ajanda) */}
      <aside className={`bg-cream border-none flex flex-col transition-all duration-300 z-10 shrink-0 ${
        rightPanelCollapsed ? 'w-20 p-4 items-center gap-6' : 'w-80 p-6 gap-6'
      } overflow-y-auto`}>
        
        {/* Toggle Button */}
        <div className="flex w-full items-center justify-between">
          {!rightPanelCollapsed && <span className="text-xs font-bold text-zinc-500 tracking-widest uppercase">Ajanda</span>}
          <button 
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            className="p-1 rounded-lg hover:bg-zinc-200 border border-charcoal text-charcoal ml-auto"
          >
            {rightPanelCollapsed ? <ChevronLeft className="rotate-180" size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {rightPanelCollapsed ? (
          <div className="flex flex-col items-center gap-6 mt-4">
            {/* Collapsed Calendar Icon representing calendar */}
            <button 
              onClick={() => setRightPanelCollapsed(false)}
              className="p-3 rounded-full bg-white hover:bg-zinc-100 border border-charcoal shadow-none transition-all"
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
            <div className="rounded-3xl p-4 bg-white shadow-none border-none">
              <div className="flex justify-between items-center mb-3">
                <span className="font-extrabold text-sm capitalize">{calendarMonthName}</span>
                <div className="flex gap-1 items-center">
                  <button 
                    onClick={handleToday}
                    className="px-2 py-1 text-[10px] font-extrabold border border-charcoal rounded-lg hover:bg-zinc-200 transition-all cursor-pointer"
                    title="Bugüne Git"
                  >
                    Bugün
                  </button>
                  <button 
                    onClick={handlePrevMonth}
                    className="p-1 border border-charcoal rounded-lg hover:bg-zinc-200 transition-all cursor-pointer"
                    title="Önceki Ay"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button 
                    onClick={handleNextMonth}
                    className="p-1 border border-charcoal rounded-lg hover:bg-zinc-200 transition-all cursor-pointer"
                    title="Sonraki Ay"
                  >
                    <ChevronLeft className="rotate-180" size={14} />
                  </button>
                </div>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-[10px] text-center font-bold">
                {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(d => (
                  <span key={d} className="text-zinc-400">{d}</span>
                ))}
                {/* Dynamic Blank leading days */}
                {blankLeadingDays.map((_, i) => (
                  <span key={`blank-${i}`} className="p-1"></span>
                ))}
                {/* Dynamic days in month */}
                {daysInMonthArray.map(day => {
                  const hasAppointments = appointments.some((app: any) => {
                    if (app.gun && app.ay && app.yil) {
                      return Number(app.gun) === day && Number(app.ay) === (calendarMonth + 1) && Number(app.yil) === calendarYear;
                    }
                    return false;
                  });
                  return (
                    <button 
                      key={day}
                      onClick={() => setSelectedCalendarDay(day)}
                      className={`p-1 rounded transition-colors relative flex flex-col items-center justify-center cursor-pointer ${
                        selectedCalendarDay === day 
                          ? 'bg-charcoal text-white font-extrabold' 
                          : 'hover:bg-zinc-200'
                      }`}
                    >
                      <span>{day}</span>
                      {hasAppointments && (
                        <span className={`w-1.5 h-1.5 rounded-full absolute bottom-0.5 ${
                          selectedCalendarDay === day ? 'bg-pastelYellow' : 'bg-indigo-600'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Button: Solid Black Pill Button */}
            <button 
              onClick={() => { setActiveTab('portfolios'); setShowAddPortfolioModal(true); }}
              className="w-full bg-charcoal hover:bg-black text-white py-3.5 px-6 rounded-full font-extrabold text-sm flex items-center justify-center gap-2 shadow-none transition-all border-none"
            >
              <Plus size={16} /> Yeni Portföy / Randevu
            </button>

            {/* Bottom: "Seçilen Günün Randevu Akışı" Timeline */}
            <div className="flex flex-col gap-4">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-500">
                {selectedCalendarDay} {calendarMonthName} Randevu Akışı
              </h4>
              
              {(() => {
                const dayAppointments = appointments.filter((app: any) => {
                  if (app.gun && app.ay && app.yil) {
                    return Number(app.gun) === selectedCalendarDay && Number(app.ay) === (calendarMonth + 1) && Number(app.yil) === calendarYear;
                  }
                  return false;
                });

                if (dayAppointments.length === 0) {
                  return (
                    <div className="p-4 rounded-2xl bg-zinc-50 text-center flex flex-col items-center justify-center gap-2 border border-zinc-200">
                      <Calendar className="text-zinc-400" size={24} />
                      <span className="text-xs font-semibold text-zinc-500 leading-relaxed">
                        {selectedCalendarDay} {calendarMonthName} tarihinde henüz randevu planlanmadı.
                      </span>
                      <button 
                        onClick={() => setActiveTab('appointments')}
                        className="text-[11px] text-indigo-600 font-extrabold underline hover:text-indigo-800 border-none bg-transparent cursor-pointer"
                      >
                        Tüm Randevulara Git →
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="relative border-l-2 border-charcoal ml-2.5 pl-5 flex flex-col gap-6">
                    {dayAppointments.map((app: any) => (
                      <div key={app.id} className="relative">
                        <span className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-none ${
                          app.durum === 'APPROVED' ? 'bg-[#BBF7D0]' :
                          app.durum === 'PENDING' ? 'bg-[#FEF08A]' : 'bg-[#FBCFE8]'
                        }`} />
                        <div className="text-xs flex flex-col gap-0.5">
                          <span className="font-extrabold text-charcoal">
                            {app.zaman || '12:00'} - {app.portfoyTip || 'Portföy'} Gösterimi
                          </span>
                          <span className="text-zinc-500">Uzman: {app.talepEden}</span>
                          <span className="text-zinc-500">Müşteri: {app.musteri}</span>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border border-charcoal uppercase ${
                              app.durum === 'APPROVED' ? 'bg-[#BBF7D0] text-emerald-950' : 
                              app.durum === 'PENDING' ? 'bg-[#FEF08A] text-amber-950' : 'bg-[#FBCFE8] text-red-950'
                            }`}>
                              {app.durum}
                            </span>
                            {app.durum === 'PENDING' && (
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => handleUpdateAppStatus(app.id, 'APPROVED')}
                                  className="px-2 py-0.5 bg-[#BBF7D0] border border-charcoal rounded-full text-[9px] font-extrabold hover:bg-emerald-300 transition-colors cursor-pointer"
                                >
                                  Onayla
                                </button>
                                <button 
                                  onClick={() => handleUpdateAppStatus(app.id, 'REJECTED')}
                                  className="px-2 py-0.5 bg-[#FBCFE8] border border-charcoal rounded-full text-[9px] font-extrabold hover:bg-pink-300 transition-colors cursor-pointer"
                                >
                                  Reddet
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </>
        )}

      </aside>

    </div>
  );
}
