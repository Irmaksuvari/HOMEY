import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
import {
  Calculator, Users, Home, Calendar, DollarSign,
  Percent, Shield, Plus, Lock, Check, X, Building,
  Search, AlertTriangle, TrendingUp, Menu,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, LogOut, MapPin, User, Briefcase,
  FileText, Clock, LayoutDashboard, Loader2,
  Trophy, Banknote, UserPlus, BadgeCheck, Building2, Bell,
  Bed, Ruler, Tag, Key, Image as ImageIcon, CheckCircle2, Filter, Info, HelpCircle, RotateCcw, Sparkles, Map as MapIcon,
  GitPullRequest, Layers, UploadCloud, Trash2, Download, Settings, Moon, Sun, Monitor,
  ArrowUpDown, Car, Flame, Sofa, Scroll, FileCheck, Snowflake, GripVertical, MoreVertical
} from 'lucide-react';

// Helper for case-insensitive UUID & string comparisons
const compareIds = (id1?: string | number, id2?: string | number) => {
  if (id1 === undefined || id1 === null || id2 === undefined || id2 === null) return false;
  return String(id1).trim().toLowerCase() === String(id2).trim().toLowerCase();
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// ─── Dikey Portföy Kart Bileşeni (Üstte Görsel Carousel, Altta Bilgiler) ─────
function PortfolioCardItem({ portfolio, photos, onSelect, isPublished, onTogglePublish, publishLoading, isOwner, requireAuthAgreement }: { portfolio: any; photos: string[]; onSelect: () => void; isPublished: boolean; onTogglePublish: () => void; publishLoading: boolean; isOwner: boolean; requireAuthAgreement?: boolean }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const hasPhotos = photos && photos.length > 0;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasPhotos) return;
    setCurrentIdx(prev => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasPhotos) return;
    setCurrentIdx(prev => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleTogglePublishClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePublish();
  };

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-3xl overflow-hidden border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer group"
    >
      {/* 1. ÜST GÖRSEL ALANI (CAROUSEL / SLIDER / PLACEHOLDER - DİNAMİK ORANTILI YÜKSEKLİK) */}
      <div className="relative w-full aspect-[16/9] md:aspect-[16/8] min-h-[180px] bg-zinc-900 overflow-hidden flex items-center justify-center shrink-0">
        {hasPhotos ? (
          <>
            <img
              src={photos[currentIdx]}
              alt={portfolio.tip}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
            />

            {/* Sol ve Sağ Kaydırma Butonları */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 cursor-pointer z-10"
                  title="Önceki Görsel"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 cursor-pointer z-10"
                  title="Sonraki Görsel"
                >
                  <ChevronLeft size={14} className="rotate-180" />
                </button>

                {/* Alt Sayfa İndikatör Noktaları (Dots) */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                  {photos.map((_, dotIdx) => (
                    <span
                      key={dotIdx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${currentIdx === dotIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                        }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          /* Görsel Yoksa Varsayılan Şık Placeholder */
          <div className="w-full h-full bg-gradient-to-br from-cream via-cream/80 to-amber-50 dark:from-slate-950 dark:via-slate-950/80 dark:to-zinc-800 flex flex-col items-center justify-center text-zinc-400 gap-1 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 text-charcoal/5 dark:text-zinc-500/10 pointer-events-none">
              {portfolio.tip === 'ARSA' ? <MapPin size={90} /> : <Home size={90} />}
            </div>
            {portfolio.tip === 'ARSA' ? (
              <MapPin size={32} className="text-zinc-400 opacity-60" />
            ) : (
              <Building2 size={32} className="text-zinc-400 opacity-60" />
            )}
            <span className="text-[11px] font-bold text-zinc-400">Görsel Yok</span>
          </div>
        )}

        {/* Üst Rozetler (Satılık/Kiralık & Durum) */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-start z-10 pointer-events-none gap-2">

          <div className="flex flex-col gap-1.5 items-start">
            <span className={`text-[10px] font-extrabold px-3 py-1 rounded-md shadow-md uppercase tracking-wider border-none text-[#FFFFFF] ${portfolio.tur === 'SATILIK' ? 'bg-slate-900' : 'bg-indigo-600'
              }`}>
              {portfolio.tur}
            </span>
            {requireAuthAgreement && !portfolio.yetkilendirmeSozlesmesiYapildi && (
              <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-red-200 text-red-700 px-2 py-1 rounded-md shadow-sm" title="Yetkilendirme Sözleşmesi Eksik">
                <X size={12} strokeWidth={3} className="text-red-500" />
                <span className="text-[9px] font-extrabold uppercase tracking-wider truncate">Yetki Sözleşmesi Yok</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
            {portfolio.durum && portfolio.durum !== 'BOSTA' && (
              <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm ${portfolio.durum === 'BOSTA' ? 'bg-pastelGreen text-emerald-950 dark:text-white' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                {portfolio.durum.replace('_', ' ')}
              </span>
            )}
            <button
              type="button"
              onClick={handleTogglePublishClick}
              disabled={publishLoading || !isOwner}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider shadow-sm transition-all ${isPublished
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-zinc-200 bg-white text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600'} ${publishLoading ? 'opacity-60' : ''}`}
              title={isPublished ? 'Yayından kaldır' : 'Yayınla'}
            >
              <span className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${isPublished ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                <span className={`inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${isPublished ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
              </span>
              <span>{isPublished ? 'Gizle' : 'Yayınla'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. ALT BİLGİ GÖVDE ALANI (TEMİZ BEYAZ ARKA PLAN) */}
      <div className="p-4 flex flex-col justify-between flex-1 gap-3 bg-white min-w-0">
        <div className="flex flex-col gap-2 min-w-0">
          {/* Mülk Tipi ve Fiyat */}
          <div className="flex justify-between items-center gap-2 min-w-0 flex-wrap">
            <h3 className="text-base font-extrabold text-charcoal whitespace-nowrap truncate" title={portfolio.baslik || portfolio.tip}>{portfolio.baslik || portfolio.tip}</h3>
            <span className="text-base font-black text-indigo-700 dark:text-indigo-400 whitespace-nowrap shrink-0">
              {(portfolio.fiyat || 0).toLocaleString('tr-TR')} TL
            </span>
          </div>

          {/* Özellikler: m², Oda Sayısı vb. (Metinler dikey kırılmasın) */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 font-semibold">
            {portfolio.metrekare && (
              <span className="inline-flex items-center gap-1 bg-zinc-100 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                <Ruler size={12} className="text-zinc-500 shrink-0" />
                {portfolio.metrekare} m²
              </span>
            )}
            {portfolio.tip !== 'ARSA' && portfolio.odaSayisi && (
              <span className="inline-flex items-center gap-1 bg-zinc-100 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                <Bed size={12} className="text-zinc-500 shrink-0" />
                {portfolio.odaSayisi}
              </span>
            )}
          </div>
        </div>

        {/* Lokasyon ve Uzman Bilgisi */}
        <div className="pt-2 border-t border-zinc-100 flex flex-wrap justify-between items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-zinc-600 font-medium min-w-0 flex-1 truncate">
            <MapPin size={13} className="shrink-0 text-zinc-400" />
            <span className="truncate">{portfolio.il || ''} / {portfolio.ilce || ''} - {portfolio.mahalle || ''}</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-bold whitespace-nowrap shrink-0">
            Uzman: <span className="text-charcoal">{portfolio.gorevliUzman || 'Belirtilmedi'}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

const FirmDocumentsTab = ({ token, showToast }: { token: string | null, showToast: (msg: string, type?: 'success' | 'error' | 'info') => void }) => {
  const [docs, setDocs] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const docTypes = [
    { id: 'KiraKontratSablonu', label: 'Kira Kontrat Şablonu' },
    { id: 'TahliyeTaahhutnamesiSablonu', label: 'Tahliye Taahhütnamesi Şablonu' },
    { id: 'SenetSablonu', label: 'Senet Şablonu' },
    { id: 'OnSatisSozlesmesiSablonu', label: 'Ön Satış Sözleşmesi Şablonu' },
    { id: 'YetkilendirmeSozlesmesiSablonu', label: 'Yetkilendirme Sözleşmesi Şablonu' }
  ];

  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/upload/firm-documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDocs();
  }, [token]);

  const handleDrop = async (e: React.DragEvent, docType: string) => {
    e.preventDefault();
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    const file = e.dataTransfer.files[0];
    await handleUpload(file, docType);
  };

  const handleUpload = async (file: File, docType: string) => {
    const formData = new FormData();
    formData.append('document', file);

    setUploading(docType);
    try {
      const res = await fetch(`/api/upload/firm-document/${docType}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        showToast('Belge başarıyla yüklendi.', 'success');
        fetchDocs();
      } else {
        const data = await res.json();
        showToast(data.message || 'Yükleme başarısız.', 'error');
      }
    } catch (err) {
      showToast('Sunucu hatası.', 'error');
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (docType: string) => {
    if (!window.confirm('Bu belgeyi silmek istediğinize emin misiniz?')) return;
    setUploading(docType);
    try {
      const res = await fetch(`/api/upload/firm-document/${docType}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Belge silindi.', 'success');
        fetchDocs();
      } else {
        showToast('Silme başarısız.', 'error');
      }
    } catch (err) {
      showToast('Sunucu hatası.', 'error');
    } finally {
      setUploading(null);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-zinc-400" size={32} /></div>;

  return (
    <div className="flex flex-col gap-6 w-full pb-4 sm:pb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-600">
          <FileText size={20} />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-charcoal">Firma Evrakları</h2>
          <p className="text-xs text-zinc-500 font-medium mt-1">Firma genelinde kullanılacak şablon evraklarınızı bu alandan yükleyebilirsiniz.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docTypes.map(type => (
          <div key={type.id} className="bg-white p-5 rounded-3xl border border-zinc-200/60 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-bold text-charcoal">{type.label}</h3>

            {docs[type.id] ? (
              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex-wrap gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <a
                    href={docs[type.id]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-zinc-700 hover:text-emerald-600 truncate transition-colors"
                  >
                    Şablon Yüklendi (Görüntüle)
                  </a>
                </div>
                <button
                  onClick={() => handleDelete(type.id)}
                  disabled={uploading === type.id}
                  className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-full transition-colors cursor-pointer border-none shrink-0"
                  title="Sil"
                >
                  {uploading === type.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 transition-all text-center group cursor-pointer relative"
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, type.id)}
                onClick={() => document.getElementById(`file-input-${type.id}`)?.click()}
              >
                {uploading === type.id ? (
                  <Loader2 size={24} className="animate-spin text-zinc-400 mb-2" />
                ) : (
                  <UploadCloud size={24} className="text-zinc-400 group-hover:text-emerald-500 mb-2 transition-colors" />
                )}
                <span className="text-xs font-semibold text-zinc-600">Sürükle bırak veya seç</span>
                <span className="text-[10px] text-zinc-400 mt-1">PDF, Word, Excel</span>
                <input
                  type="file"
                  id={`file-input-${type.id}`}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], type.id)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const DocumentOperationsTab = ({ token, portfolios, user, clientProcesses = [], fetchClientProcesses, showToast }: { token: string | null, portfolios: any[], user: any, clientProcesses?: any[], fetchClientProcesses?: () => void, showToast?: (msg: string, type: 'success' | 'error') => void }) => {
  const [firmDocs, setFirmDocs] = useState<any>({});
  const [selectedPortfolio, setSelectedPortfolio] = useState<any>(null);
  const [expandedProcesses, setExpandedProcesses] = useState<string[]>([]);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, Record<string, boolean>>>({});

  const toggleDocCheck = (processId: string, docName: string) => {
    setCheckedDocs(prev => ({
      ...prev,
      [processId]: {
        ...(prev[processId] || {}),
        [docName]: !prev[processId]?.[docName]
      }
    }));
  };

  const handleQuickCompleteProcess = async (process: any) => {
    const islemTuru = process.portfoyTur === 'SATILIK' ? 'SATIS' : 'KIRALAMA';
    const islemBedeli = process.portfoyFiyat || 0;
    const islemTarihi = new Date().toISOString().split('T')[0];

    if (!window.confirm(`Bu işlemi ${islemTuru === 'SATIS' ? 'Satıldı' : 'Kiralandı'} olarak sonlandırmak istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/portfoyler/${process.portfoyId}/satis-kapat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          islemTuru,
          islemBedeli,
          hizmetBedeliCiro: 0,
          islemTarihi,
          musteriAciklama: 'Evraklar bölümünden hızlı işlem onaylandı.'
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'İşlem tamamlanamadı.');
      }
      if (showToast) showToast('İşlem başarıyla tamamlandı.', 'success');
      if (fetchClientProcesses) fetchClientProcesses();
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast(err.message || 'İşlem sırasında hata oluştu.', 'error');
    }
  };

  const toggleProcessExpand = (id: string) => {
    setExpandedProcesses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const pendingPortfolios = portfolios.filter(p => p.yetkilendirmeSozlesmesiYapildi === false && compareIds(p.gorevliUzmanId, user?.id));

  const agreementProcesses = clientProcesses.filter(p => Number(p.asamaId) === 3);
  const saleProcesses = agreementProcesses.filter(p => p.portfoyTur === 'SATILIK');
  const rentProcesses = agreementProcesses.filter(p => p.portfoyTur === 'KIRALIK');

  const handleToggleDocumentsComplete = async (processId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/appointments/update-documents-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ processId, status: !currentStatus })
      });
      if (!res.ok) throw new Error('Evrak güncellenemedi');
      if (showToast) showToast('Evrak durumu başarıyla güncellendi.', 'success');
      if (fetchClientProcesses) fetchClientProcesses();
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Evrak durumu güncellenirken hata oluştu.', 'error');
    }
  };

  useEffect(() => {
    if (token) {
      fetch('/api/upload/firm-documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setFirmDocs(data))
        .catch(console.error);
    }
  }, [token]);

  return (
    <div className="flex flex-col gap-6 w-full pb-4 sm:pb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-600">
          <Layers size={20} />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-charcoal">Evrak İşlemleri</h2>
          <p className="text-xs text-zinc-500 font-medium mt-1">Yetkilendirme sözleşmesi bekleyen portföyleriniz ve evrak işlemleri.</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-charcoal mb-4">Yetkilendirme Sözleşmesi Beklenenler ({pendingPortfolios.length})</h3>
        {pendingPortfolios.length === 0 ? (
          <div className="p-8 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-3xl text-zinc-500 text-sm">
            Tüm portföylerinizin yetkilendirme sözleşmeleri tamamlanmış görünüyor.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingPortfolios.map(p => {
              const isExpanded = expandedProcesses.includes(p.id);
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col group overflow-hidden"
                >
                  <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 w-full">
                      <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors shrink-0">
                        <FileText size={16} className="text-zinc-400 group-hover:text-emerald-600" />
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 md:items-center">
                        <div>
                          <h4 className="font-bold text-charcoal group-hover:text-emerald-600 transition-colors">
                            {p.il} / {p.ilce}
                          </h4>
                          <p className="text-xs text-zinc-500 mt-1">{p.mahalle} Mah. {p.tur} {p.tip}</p>
                        </div>
                        <div className="md:text-center">
                          <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-lg uppercase tracking-wider whitespace-nowrap">Eksik Evrak</span>
                        </div>
                        <div className="md:text-right">
                          <p className="font-semibold text-charcoal">{p.fiyat.toLocaleString('tr-TR')} ₺</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 md:mt-0">
                      <button
                        onClick={() => toggleProcessExpand(p.id)}
                        className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-colors whitespace-nowrap shadow-sm flex items-center gap-2"
                      >
                        {isExpanded ? 'Gizle' : 'Evraklar / Oluştur'}
                        <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="bg-zinc-50 border-t border-zinc-200 p-5 flex flex-col gap-5 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Yetkilendirme Sözleşmesi</h5>
                        <div className="flex flex-wrap gap-2">
                          {firmDocs['YetkilendirmeSozlesmesiSablonu'] ? (
                            <a href={firmDocs['YetkilendirmeSozlesmesiSablonu']} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg hover:border-emerald-300 dark:border-emerald-800 hover:shadow-sm transition-all text-xs font-semibold text-charcoal">
                              <Download size={14} className="text-emerald-600" />
                              Sözleşmeyi İndir
                            </a>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-400 cursor-not-allowed" title="Firma tarafından henüz şablon yüklenmedi.">
                              <Download size={14} />
                              Sözleşmeyi İndir
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-3">İndirdiğiniz sözleşmeyi doldurduktan sonra, mülk sahibine onaylatıp dosyalarınızda saklayınız.</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-12">
        <h3 className="text-lg font-bold text-charcoal mb-4">Anlaşma Aşamasındaki İşlemler</h3>
        <div className="flex flex-col gap-8">

          {/* Satış Kısmı */}
          <div>
            <h4 className="font-semibold text-emerald-800 bg-emerald-50 py-2 px-4 rounded-xl mb-4 border border-emerald-100 flex items-center justify-between flex-wrap gap-3">
              Satış İşlemleri
              <span className="text-xs bg-emerald-200 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-100 px-2 py-0.5 rounded-full whitespace-nowrap">{saleProcesses.length}</span>
            </h4>
            {saleProcesses.length === 0 ? (
              <p className="text-sm text-zinc-400 italic">Satış aşamasında evrak bekleyen işlem yok.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {saleProcesses.map(p => {
                  const isExpanded = expandedProcesses.includes(p.id);
                  return (
                    <div key={p.id} className={`bg-white rounded-3xl border shadow-sm hover:shadow-md transition-all group overflow-hidden ${p.evraklarTamamlandi ? 'border-emerald-200' : 'border-zinc-200/60 hover:border-emerald-200'}`}>
                      <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 w-full">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${p.evraklarTamamlandi ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-50 text-zinc-400 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
                            <FileText size={16} />
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:items-center">
                            <div>
                              <h4 className="font-bold text-charcoal group-hover:text-emerald-600 transition-colors">
                                {p.portfoyIl} / {p.portfoyIlce}
                              </h4>
                              <p className="text-xs text-zinc-500 mt-1">Alıcı: <span className="font-semibold text-charcoal">{p.musteriAd} {p.musteriSoyad}</span></p>
                            </div>
                            <div className="md:text-right">
                              {!p.evraklarTamamlandi ? (
                                <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-lg uppercase tracking-wider whitespace-nowrap">Evrak Bekliyor</span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg uppercase tracking-wider whitespace-nowrap">Onaylandı</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 md:mt-0">
                          <button
                            onClick={() => toggleProcessExpand(p.id)}
                            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-colors whitespace-nowrap shadow-sm flex items-center gap-2"
                          >
                            {isExpanded ? 'Gizle' : 'Evraklar / Oluştur'}
                            <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="bg-zinc-50 border-t border-zinc-200 p-5 flex flex-col gap-5 animate-in fade-in slide-in-from-top-2">
                          <div>
                            <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">İndirilebilir Şablonlar</h5>
                            <div className="flex flex-col gap-2">
                              {firmDocs['OnSatisSozlesmesiSablonu'] ? (
                                <div className="flex items-center gap-4 w-full justify-between bg-white px-4 py-2 border border-zinc-200 rounded-xl">
                                  <a href={firmDocs['OnSatisSozlesmesiSablonu']} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-emerald-600 transition-all text-sm font-semibold text-charcoal">
                                    <Download size={16} className="text-emerald-600" />
                                    Ön Satış Sözleşmesi
                                  </a>
                                  <label className="inline-flex items-center cursor-pointer">
                                    <span className={`mr-3 text-xs font-bold text-right w-16 transition-colors ${checkedDocs[p.id]?.['OnSatis'] ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                      {checkedDocs[p.id]?.['OnSatis'] ? 'Onaylandı' : 'Onayla'}
                                    </span>
                                    <input type="checkbox" className="sr-only peer" checked={!!checkedDocs[p.id]?.['OnSatis']} onChange={() => toggleDocCheck(p.id, 'OnSatis')} />
                                    <div className="relative w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                  </label>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-400 cursor-not-allowed" title="Firma tarafından henüz şablon yüklenmedi.">
                                  <Download size={14} />
                                  Ön Satış Sözleşmesi
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-zinc-200 mt-2">
                            <button
                              onClick={() => handleQuickCompleteProcess(p)}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                            >
                              Süreci Tamamla (Satıldı Olarak İşaretle)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Kiralama Kısmı */}
          <div>
            <h4 className="font-semibold text-blue-800 bg-blue-50 py-2 px-4 rounded-xl mb-4 border border-blue-100 flex items-center justify-between flex-wrap gap-3">
              Kiralama İşlemleri
              <span className="text-xs bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full whitespace-nowrap">{rentProcesses.length}</span>
            </h4>
            {rentProcesses.length === 0 ? (
              <p className="text-sm text-zinc-400 italic">Kiralama aşamasında evrak bekleyen işlem yok.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {rentProcesses.map(p => {
                  const isExpanded = expandedProcesses.includes(p.id);
                  return (
                    <div key={p.id} className={`bg-white rounded-3xl border shadow-sm hover:shadow-md transition-all group overflow-hidden ${p.evraklarTamamlandi ? 'border-blue-200' : 'border-zinc-200/60 hover:border-blue-200'}`}>
                      <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 w-full">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${p.evraklarTamamlandi ? 'bg-blue-100 text-blue-600' : 'bg-zinc-50 text-zinc-400 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                            <FileText size={16} />
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:items-center">
                            <div>
                              <h4 className="font-bold text-charcoal group-hover:text-blue-600 transition-colors">
                                {p.portfoyIl} / {p.portfoyIlce}
                              </h4>
                              <p className="text-xs text-zinc-500 mt-1">Kiracı: <span className="font-semibold text-charcoal">{p.musteriAd} {p.musteriSoyad}</span></p>
                            </div>
                            <div className="md:text-right">
                              {!p.evraklarTamamlandi ? (
                                <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-lg uppercase tracking-wider whitespace-nowrap">Evrak Bekliyor</span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-lg uppercase tracking-wider whitespace-nowrap">Onaylandı</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 md:mt-0">
                          <button
                            onClick={() => toggleProcessExpand(p.id)}
                            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-colors whitespace-nowrap shadow-sm flex items-center gap-2"
                          >
                            {isExpanded ? 'Gizle' : 'Evraklar / Oluştur'}
                            <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="bg-zinc-50 border-t border-zinc-200 p-5 flex flex-col gap-5 animate-in fade-in slide-in-from-top-2">
                          <div>
                            <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">İndirilebilir Şablonlar</h5>
                            <div className="flex flex-col gap-2">
                              {/* Kira Kontratı */}
                              {firmDocs['KiraKontratSablonu'] ? (
                                <div className="flex items-center gap-4 w-full justify-between bg-white px-4 py-2 border border-zinc-200 rounded-xl">
                                  <a href={firmDocs['KiraKontratSablonu']} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-blue-600 transition-all text-sm font-semibold text-charcoal">
                                    <Download size={16} className="text-blue-600" />
                                    Kira Kontratı
                                  </a>
                                  <label className="inline-flex items-center cursor-pointer">
                                    <span className={`mr-3 text-xs font-bold text-right w-16 transition-colors ${checkedDocs[p.id]?.['KiraKontrati'] ? 'text-blue-600' : 'text-zinc-400'}`}>
                                      {checkedDocs[p.id]?.['KiraKontrati'] ? 'Onaylandı' : 'Onayla'}
                                    </span>
                                    <input type="checkbox" className="sr-only peer" checked={!!checkedDocs[p.id]?.['KiraKontrati']} onChange={() => toggleDocCheck(p.id, 'KiraKontrati')} />
                                    <div className="relative w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                  </label>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-400 cursor-not-allowed" title="Firma tarafından henüz şablon yüklenmedi.">
                                  <Download size={14} />
                                  Kira Kontratı
                                </div>
                              )}

                              {/* Tahliye Taahhütnamesi */}
                              {firmDocs['TahliyeTaahhutnamesiSablonu'] ? (
                                <div className="flex items-center gap-4 w-full justify-between bg-white px-4 py-2 border border-zinc-200 rounded-xl">
                                  <a href={firmDocs['TahliyeTaahhutnamesiSablonu']} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-blue-600 transition-all text-sm font-semibold text-charcoal">
                                    <Download size={16} className="text-blue-600" />
                                    Tahliye Taahhütnamesi
                                  </a>
                                  <label className="inline-flex items-center cursor-pointer">
                                    <span className={`mr-3 text-xs font-bold text-right w-16 transition-colors ${checkedDocs[p.id]?.['Tahliye'] ? 'text-blue-600' : 'text-zinc-400'}`}>
                                      {checkedDocs[p.id]?.['Tahliye'] ? 'Onaylandı' : 'Onayla'}
                                    </span>
                                    <input type="checkbox" className="sr-only peer" checked={!!checkedDocs[p.id]?.['Tahliye']} onChange={() => toggleDocCheck(p.id, 'Tahliye')} />
                                    <div className="relative w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                  </label>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-400 cursor-not-allowed" title="Firma tarafından henüz şablon yüklenmedi.">
                                  <Download size={14} />
                                  Tahliye Taahhütnamesi
                                </div>
                              )}

                              {/* Senet */}
                              {firmDocs['SenetSablonu'] ? (
                                <div className="flex items-center gap-4 w-full justify-between bg-white px-4 py-2 border border-zinc-200 rounded-xl">
                                  <a href={firmDocs['SenetSablonu']} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-blue-600 transition-all text-sm font-semibold text-charcoal">
                                    <Download size={16} className="text-blue-600" />
                                    Senet
                                  </a>
                                  <label className="inline-flex items-center cursor-pointer">
                                    <span className={`mr-3 text-xs font-bold text-right w-16 transition-colors ${checkedDocs[p.id]?.['Senet'] ? 'text-blue-600' : 'text-zinc-400'}`}>
                                      {checkedDocs[p.id]?.['Senet'] ? 'Onaylandı' : 'Onayla'}
                                    </span>
                                    <input type="checkbox" className="sr-only peer" checked={!!checkedDocs[p.id]?.['Senet']} onChange={() => toggleDocCheck(p.id, 'Senet')} />
                                    <div className="relative w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                  </label>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-400 cursor-not-allowed" title="Firma tarafından henüz şablon yüklenmedi.">
                                  <Download size={14} />
                                  Senet
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-zinc-200 mt-2">
                            <button
                              onClick={() => handleQuickCompleteProcess(p)}
                              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                            >
                              Süreci Tamamla (Kiralandı Olarak İşaretle)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
function CustomScrollWheelZoom() {
  const map = useMap();
  useEffect(() => {
    let mouseScrolling = false;
    let mouseStopTimer: any = null;
    let touchpadDelta = 0;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const isMouse = Math.abs(e.deltaY) >= 100 || e.deltaMode === 1;

      if (isMouse) {
        // Mouse: one tick = one zoom level
        if (mouseStopTimer) clearTimeout(mouseStopTimer);
        mouseStopTimer = setTimeout(() => { mouseScrolling = false; }, 30);
        if (mouseScrolling) return;
        mouseScrolling = true;
        const currentZoom = map.getZoom();
        map.setZoom(e.deltaY > 0 ? currentZoom - 1 : currentZoom + 1, { animate: true });
      } else {
        // Touchpad: accumulate deltaY, zoom when threshold reached
        touchpadDelta += e.deltaY;
        if (Math.abs(touchpadDelta) >= 80) {
          const currentZoom = map.getZoom();
          map.setZoom(touchpadDelta > 0 ? currentZoom - 1 : currentZoom + 1, { animate: true });
          touchpadDelta = 0;
        }
      }
    };

    const container = map.getContainer();
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (mouseStopTimer) clearTimeout(mouseStopTimer);
    };
  }, [map]);
  return null;
}

const MapLayers = () => {
  const [provider, setProvider] = useState(localStorage.getItem('mapProvider') || 'google');

  useEffect(() => {
    const handleProviderChange = (e: any) => setProvider(e.detail);
    window.addEventListener('mapProviderChange', handleProviderChange);
    return () => window.removeEventListener('mapProviderChange', handleProviderChange);
  }, []);

  if (provider === 'leaflet') {
    return (
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    );
  }

  return (
    <LayersControl position="topright" key={provider}>
      <LayersControl.BaseLayer checked name="Google Sokak">
        <TileLayer
          attribution='&copy; Google Maps'
          url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0','mt1','mt2','mt3']}
        />
      </LayersControl.BaseLayer>
      <LayersControl.BaseLayer name="Google Uydu">
        <TileLayer
          attribution='&copy; Google Maps'
          url="http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          subdomains={['mt0','mt1','mt2','mt3']}
        />
      </LayersControl.BaseLayer>
      <LayersControl.BaseLayer name="Google Karma">
        <TileLayer
          attribution='&copy; Google Maps'
          url="http://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          subdomains={['mt0','mt1','mt2','mt3']}
        />
      </LayersControl.BaseLayer>
    </LayersControl>
  );
};

function LocationPickerMap({ position, setPosition, className, onMapClick }: { position: [number, number] | null; setPosition: (pos: [number, number]) => void; className?: string; onMapClick?: (lat: number, lng: number) => void }) {
  const defaultPos: [number, number] = [41.0082, 28.9784]; // Istanbul by default

  function LocationMarker() {
    const map = useMap();
    const isMapClick = useRef(false);

    useMapEvents({
      click(e) {
        isMapClick.current = true;
        setPosition([e.latlng.lat, e.latlng.lng]);
        if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
      },
    });

    useEffect(() => {
      if (position) {
        if (isMapClick.current) {
          isMapClick.current = false;
          return;
        }
        const currentCenter = map.getCenter();
        const dist = currentCenter.distanceTo(L.latLng(position[0], position[1]));
        if (dist > 10) {
          map.setView(position, map.getZoom() < 13 ? 15 : map.getZoom(), { animate: false });
        }
      }
    }, [position, map]);

    return position === null ? null : (
      <Marker position={position}></Marker>
    );
  }

  return (
    <div className={`w-full rounded-2xl overflow-hidden border-2 border-zinc-200 z-0 relative ${className || 'h-64'}`}>
      <MapContainer center={position || defaultPos} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <CustomScrollWheelZoom />
        <MapLayers />
        <LocationMarker />
      </MapContainer>
    </div>
  );
}

function StaticMap({ position }: { position: [number, number] | null }) {
  if (!position) return null;
  return (
    <div className="h-48 w-full rounded-2xl overflow-hidden border-2 border-zinc-200 z-0 relative mt-4">
      <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }} dragging={false} zoomControl={false} scrollWheelZoom={false}>
        <CustomScrollWheelZoom />
        <MapLayers />
        <Marker position={position}></Marker>
      </MapContainer>
    </div>
  );
}

function createHouseIcon(isHovered: boolean, tip?: string) {
  const color = '#ef4444';
  const size = isHovered ? 46 : 38;
  const shadow = isHovered ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="22" fill="${color}" opacity="0.15"/>
      <circle cx="24" cy="24" r="20" fill="white" stroke="${color}" stroke-width="2.5"/>
      <g transform="translate(12, 11)">
        <path d="M12 3L2 11h3v11h5v-7h4v7h5V11h3z" fill="${color}" opacity="0.9"/>
      </g>
    </svg>
  `;
  return L.divIcon({
    html: `<div style="filter:${shadow};transition:all 0.2s;">${svg}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function MultiMarkerMap({ portfolios, hoveredPortfolioId, onMarkerClick }: { portfolios: any[], hoveredPortfolioId: string | null, onMarkerClick?: (p: any) => void }) {
  const defaultCenter: [number, number] = [41.0082, 28.9784];

  // Calculate bounds to fit all markers
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && portfolios.length > 0) {
      const validPorts = portfolios.filter(p => p.latitude && p.longitude);
      if (validPorts.length > 0) {
        const bounds = L.latLngBounds(validPorts.map(p => [p.latitude, p.longitude]));
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [portfolios]);

  return (
    <div className="h-full min-h-[500px] w-full rounded-3xl overflow-hidden border-2 border-zinc-200 z-0 relative shadow-sm sticky top-6">
      <MapContainer
        center={defaultCenter}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        scrollWheelZoom={true}
      >
        <CustomScrollWheelZoom />
        <MapLayers />
        {portfolios.map(p => {
          if (!p.latitude || !p.longitude) return null;
          const isHovered = hoveredPortfolioId === p.id;

          return (
            <Marker
              key={p.id}
              position={[p.latitude, p.longitude]}
              icon={createHouseIcon(isHovered, p.tip)}
              zIndexOffset={isHovered ? 1000 : 0}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) {
                    onMarkerClick(p);
                  }
                },
              }}
            >
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

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

  // Password Reset States
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetPasswordNew, setResetPasswordNew] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolios' | 'completedPortfolios' | 'appointments' | 'processManagement' | 'clients' | 'calculator' | 'analytics' | 'team' | 'subscription' | 'settings' | 'firmDocuments' | 'documentOperations'>('dashboard');
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false);

  // Süreç Yönetimi Modal State
  const [openProcessMenuId, setOpenProcessMenuId] = useState<string | null>(null);
  const [openDetailsMenuId, setOpenDetailsMenuId] = useState<string | null>(null);

  // Çalışan Silme Modal State
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [reassignedUserId, setReassignedUserId] = useState<string>('');

  // Map Provider State
  const [mapProvider, setMapProvider] = useState<'google' | 'leaflet'>(() => {
    return (localStorage.getItem('mapProvider') as any) || 'google';
  });

  const handleMapProviderChange = (provider: 'google' | 'leaflet') => {
    setMapProvider(provider);
    localStorage.setItem('mapProvider', provider);
    window.dispatchEvent(new CustomEvent('mapProviderChange', { detail: provider }));
  };

  // Theme Preference State
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>(() => {
    const savedUser = localStorage.getItem('homey_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.temaTercihi) return parsed.temaTercihi;
      } catch (e) { }
    }
    return (localStorage.getItem('themePreference') as 'light' | 'dark' | 'system') || 'light';
  });

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    setThemePreference(theme);
    if (user && token) {
      try {
        await fetch('/api/auth/theme', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ theme })
        });
        const updatedUser = { ...user, temaTercihi: theme };
        setUser(updatedUser);
        localStorage.setItem('homey_user', JSON.stringify(updatedUser));
      } catch (err) {
        console.error("Theme update failed", err);
      }
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    // İlk giriş şifre değiştirme ekranında veya kullanıcı giriş yapmamışsa karanlık modu devre dışı bırak
    if (user?.ilkGirisMi || !user) {
      root.classList.add('light');
      return;
    }

    if (themePreference === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(themePreference);
    }

    localStorage.setItem('themePreference', themePreference);
  }, [themePreference, user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resetToken');
    if (token) {
      setResetToken(token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Completed Portfolios States
  const [completedPortfolios, setCompletedPortfolios] = useState<any[]>([]);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [completedScopeFilter, setCompletedScopeFilter] = useState<'all' | 'mine' | 'others'>('mine');
  const [completedTypeFilter, setCompletedTypeFilter] = useState<'all' | 'SATILDI' | 'KIRALANDI'>('all');
  const [completedSearchQuery, setCompletedSearchQuery] = useState('');
  const [selectedCompletedPortfolio, setSelectedCompletedPortfolio] = useState<any | null>(null);
  // Process Stages State (Süreç Aşamaları)
  const [processStages, setProcessStages] = useState<any[]>([
    { id: 1, asamaAdi: 'Portföy & Randevu Süreci', sira: 1 },
    { id: 3, asamaAdi: 'Anlaşma süreci', sira: 2 },
    { id: 4, asamaAdi: 'Satıldı/Kiralandı', sira: 3 },
    { id: 5, asamaAdi: 'Vazgeçildi', sira: 4 }
  ]);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  // Müşteri Süreçleri (MusteriSurecleri tablosundan)
  const [clientProcesses, setClientProcesses] = useState<any[]>([]);
  const [clientProcessesLoading, setClientProcessesLoading] = useState(false);



  const [firmaSettings, setFirmaSettings] = useState({
    YetkilendirmeSarti: false,
    KiralamaKomisyonOrani: 1.00,
    KiralamaKdv: 20.00,
    KiralamaDepozitoSiniri: 3,
    KiralamaPesinKira: 1,
    KiralamaKaporaTipi: 'ESNEK',
    SatisAliciKomisyon: 2.00,
    SatisSaticiKomisyon: 2.00,
    TapuHarciAlici: 2.00,
    TapuHarciSatici: 2.00,
    DonerSermayeBedeli: 0.00,
    SatisKaporaOrani: 5.00,
    DisOfisPortfoyPayi: 50.00,
    DisOfisMusteriPayi: 50.00,
    IciPortfoyPayi: 50.00,
    IciMusteriPayi: 50.00,
    BrokerDanismanPayi: 50.00,
    BrokerOfisPayi: 50.00,
    KademeliDanismanPayi: 60.00,
    KademeliOfisPayi: 40.00,
    MasaUcretiTutar: 0.00,
    MasaDanismanPayi: 70.00
  });
  const [settingsActiveTab, setSettingsActiveTab] = useState<'standartlar' | 'disOfis' | 'iciOfis'>('standartlar');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({ eskiSifre: '', yeniSifre: '', yeniSifreTekrar: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.yeniSifre !== passwordForm.yeniSifreTekrar) {
      showToast('Yeni şifreler eşleşmiyor.', 'error');
      return;
    }
    if (passwordForm.yeniSifre.length < 6) {
      showToast('Yeni şifre en az 6 karakter olmalıdır.', 'error');
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ eskiSifre: passwordForm.eskiSifre, yeniSifre: passwordForm.yeniSifre })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Şifreniz başarıyla güncellendi.', 'success');
        setPasswordForm({ eskiSifre: '', yeniSifre: '', yeniSifreTekrar: '' });
      } else {
        showToast(data.message || 'Şifre güncellenirken hata oluştu.', 'error');
      }
    } catch (err) {
      showToast('Sunucu bağlantı hatası.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };
  const [personalCiro, setPersonalCiro] = useState(0);

  // Fetch settings when user logs in
  useEffect(() => {
    if (user && token) {
      const fetchSettings = async () => {
        try {
          const res = await fetch('/api/firma/komisyon-ayarlari', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setFirmaSettings(data);
          }
        } catch (e) {
          console.error(e);
        }
      };
      const fetchPersonalStats = async () => {
        try {
          const res = await fetch('/api/dashboard/personal-stats', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setPersonalCiro(data.aylikCiro || 0);
          }
        } catch (e) {
          console.error(e);
        }
      };
      const fetchProcessStages = async () => {
        try {
          const res = await fetch('/api/appointments/process-stages', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) setProcessStages(data);
          }
        } catch (e) {
          console.error('Process stages error:', e);
        }
      };
      const fetchCompletedPortfolios = async (authToken?: string) => {
        const t = authToken || token;
        if (!t) return;
        setCompletedLoading(true);
        try {
          const res = await fetch('/api/portfolios/completed', {
            headers: { 'Authorization': `Bearer ${t}` }
          });
          if (res.ok) {
            const data = await res.json();
            setCompletedPortfolios(Array.isArray(data) ? data : []);
          }
        } catch (e) {
          console.error('Completed portfolios error:', e);
        } finally {
          setCompletedLoading(false);
        }
      };

      const fetchPortfolios = async (authToken?: string) => {
        const t = authToken || token;
        if (!t) return;
        try {
          const res = await fetch('/api/portfolios/list', {
            headers: { 'Authorization': `Bearer ${t}` }
          });
          if (res.ok) {
            const data = await res.json();
            setPortfolios(Array.isArray(data) ? data : []);
          }
        } catch (e) {
          console.error('Portfolios error:', e);
        }
      };

      fetchSettings();
      fetchPersonalStats();
      fetchProcessStages();
      fetchPortfolios();
      fetchCompletedPortfolios();
    }
  }, [user, token]);







  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/firma/komisyon-ayarlari', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(firmaSettings)
      });
      if (res.ok) {
        showToast('Ayarlar başarıyla kaydedildi.', 'success');
      } else {
        showToast('Ayarlar kaydedilirken hata oluştu.', 'error');
      }
    } catch (e) {
      showToast('Sunucu hatası.', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // Sekme değiştiğinde sağ paneli (ajandayı) otomatik kapat
  useEffect(() => {
    setRightPanelCollapsed(true);
  }, [activeTab]);

  // Filter tags in top bar
  const [filterTag, setFilterTag] = useState<string>('Tümü');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterIlanTipi, setFilterIlanTipi] = useState<string>('');
  const [filterTip, setFilterTip] = useState<string>('');
  const [filterOdaSayisi, setFilterOdaSayisi] = useState<string>('');
  const [filterIl, setFilterIl] = useState<string>('');
  const [filterIlce, setFilterIlce] = useState<string>('');
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
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<any | null>(null);

  // Portfolio Images States
  const [portfolioImages, setPortfolioImages] = useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Fetch Portfolio Images
  const fetchPortfolioImages = async (portfoyId: string) => {
    setImagesLoading(true);
    try {
      const res = await fetch(`/api/upload/portfolio-images/${portfoyId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPortfolioImages(Array.isArray(data) ? data : []);
        setActiveImageIndex(0);
      }
    } catch (err) {
      console.error('Fotoğraflar alınırken hata:', err);
    } finally {
      setImagesLoading(false);
    }
  };

  // Upload New Image (Max 12 check)
  const handleUploadPortfolioImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPortfolio) return;

    if (portfolioImages.length >= 12) {
      showToast("Bir portföye en fazla 12 adet fotoğraf yükleyebilirsiniz.", 'error');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('portfoyId', selectedPortfolio.id);

    setUploadLoading(true);
    try {
      const res = await fetch('/api/upload/portfolio-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Fotoğraf başarıyla yüklendi!", "success");
        fetchPortfolioImages(selectedPortfolio.id);
        if (token) fetchPortfolios(token);
      } else {
        showToast(data.message || "Fotoğraf yüklenirken hata oluştu.", 'error');
      }
    } catch (err) {
      showToast("Sunucu bağlantı hatası.", 'error');
    } finally {
      setUploadLoading(false);
      e.target.value = '';
    }
  };

  // Delete Image
  const handleDeletePortfolioImage = async (fotoId: string, url: string) => {
    if (!confirm("Bu fotoğrafı silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch('/api/upload/portfolio-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fotoId, url })
      });
      if (res.ok) {
        showToast("Fotoğraf silindi.", "success");
        fetchPortfolioImages(selectedPortfolio.id);
        if (token) fetchPortfolios(token);
      } else {
        showToast("Fotoğraf silinirken hata oluştu.", 'error');
      }
    } catch (err) {
      showToast("Sunucu hatası.", 'error');
    }
  };

  // Set Cover Image
  const handleSetCoverImage = async (fotoId: string) => {
    try {
      const res = await fetch('/api/upload/portfolio-image/set-cover', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ portfoyId: selectedPortfolio.id, fotoId })
      });
      if (res.ok) {
        showToast("Kapak fotoğrafı güncellendi!", "success");
        fetchPortfolioImages(selectedPortfolio.id);
        if (token) fetchPortfolios(token);
      } else {
        showToast("Kapak fotoğrafı ayarlanırken hata oluştu.", 'error');
      }
    } catch (err) {
      showToast("Sunucu hatası.", 'error');
    }
  };

  const handleUploadProfileImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user || !token) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        const updatedUser = { ...user, profilFoto: data.url };
        setUser(updatedUser);
        localStorage.setItem('homey_user', JSON.stringify(updatedUser));
        showToast("Profil fotoğrafı güncellendi!", "success");
      } else {
        showToast(data.message || "Fotoğraf yüklenemedi.", 'error');
      }
    } catch (err) {
      showToast("Sunucu hatası.", 'error');
    }
    e.target.value = '';
  };

  const handleDeleteProfileImage = async () => {
    if (!user || !user.profilFoto || !token) return;
    if (!confirm("Profil fotoğrafınızı silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch('/api/upload/profile-picture', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updatedUser = { ...user, profilFoto: null };
        setUser(updatedUser);
        localStorage.setItem('homey_user', JSON.stringify(updatedUser));
        showToast("Profil fotoğrafı silindi.", "info");
      } else {
        showToast("Fotoğraf silinemedi.", 'error');
      }
    } catch (err) {
      showToast("Sunucu hatası.", 'error');
    }
  };

  // Auto fetch images when selectedPortfolio changes
  useEffect(() => {
    if (selectedPortfolio?.id && token) {
      fetchPortfolioImages(selectedPortfolio.id);
    } else {
      setPortfolioImages([]);
    }
  }, [selectedPortfolio?.id, token]);




  const isOwnPortfolio = (portfolio: any) => {
    const myName = `${user?.ad || ''} ${user?.soyad || ''}`.trim();
    return compareIds(portfolio.gorevliUzmanId, user?.id) || portfolio.gorevliUzman === myName;
  };

  const isPortfolioPublished = (portfolio: any) => {
    if (firmaSettings.YetkilendirmeSarti && !portfolio.yetkilendirmeSozlesmesiYapildi) {
      return false; // Zorunluluk varken sözleşmesi yoksa yayından kaldırılır
    }
    const value = portfolio.isPublished;
    if (value === undefined || value === null || value === '') return true;
    return value === true || value === 1 || value === '1' || value === 'true' || value === 'TRUE';
  };

  const [portfolioScope, setPortfolioScope] = useState<'all' | 'mine'>('all');
  const [portfolioVisibilityMode, setPortfolioVisibilityMode] = useState<'published' | 'unpublished'>('published');
  const [publishLoadingPortfolioId, setPublishLoadingPortfolioId] = useState<string | null>(null);

  // Profil Menüsü State'i
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Add Portfolio Modal Form States
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false);

  // Add Appointment Modal Form States
  const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false);
  const [newAppPortfolioId, setNewAppPortfolioId] = useState('');
  const [newAppMusteriId, setNewAppMusteriId] = useState('');
  const [newAppDate, setNewAppDate] = useState('');
  const [newPortBaslik, setNewPortBaslik] = useState('');
  const [newPortTip, setNewPortTip] = useState('DAIRE');
  const [newPortTur, setNewPortTur] = useState('SATILIK');
  const [newPortFiyat, setNewPortFiyat] = useState('');
  const [newPortMetrekare, setNewPortMetrekare] = useState('');
  const [newPortOdaSayisi, setNewPortOdaSayisi] = useState('2+1');
  const [newPortIl, setNewPortIl] = useState('İstanbul');
  const [newPortIlce, setNewPortIlce] = useState('');
  const [newPortMahalle, setNewPortMahalle] = useState('');
  const [newPortSemt, setNewPortSemt] = useState('');
  const [newPortCadde, setNewPortCadde] = useState('');
  const [newPortSokak, setNewPortSokak] = useState('');
  const [newPortKapora, setNewPortKapora] = useState('');
  const [newPortDepozito, setNewPortDepozito] = useState('');
  const [newPortLandlordName, setNewPortLandlordName] = useState('');
  const [newPortLandlordPhone, setNewPortLandlordPhone] = useState('');
  const [newPortAciklama, setNewPortAciklama] = useState('');
  const [newPortOtoparkTipi, setNewPortOtoparkTipi] = useState('');
  const [newPortIsinmaTipi, setNewPortIsinmaTipi] = useState('');
  const [newPortBalkonDurumu, setNewPortBalkonDurumu] = useState('');
  const [newPortEsyaDurumu, setNewPortEsyaDurumu] = useState('');
  const [newPortKullanimDurumu, setNewPortKullanimDurumu] = useState('');
  const [newPortTapuDurumu, setNewPortTapuDurumu] = useState('');
  const [newPortHasAsansor, setNewPortHasAsansor] = useState(false);
  const [newPortIsKrediyeUygun, setNewPortIsKrediyeUygun] = useState(false);
  const [newPortIsTakasaUygun, setNewPortIsTakasaUygun] = useState(false);
  const [newPortIsAcilSatilik, setNewPortIsAcilSatilik] = useState(false);
  const [newPortIsFiyatiDustu, setNewPortIsFiyatiDustu] = useState(false);
  const [newPortPos, setNewPortPos] = useState<[number, number] | null>(null);
  const [newPortFiles, setNewPortFiles] = useState<File[]>([]);
  const [newPortSubmitting, setNewPortSubmitting] = useState(false);

  // Edit Portfolio Modal Form States
  const [isEditingPortfolio, setIsEditingPortfolio] = useState(false);
  const [editPortBaslik, setEditPortBaslik] = useState('');
  const [editPortTip, setEditPortTip] = useState('DAIRE');
  const [editPortTur, setEditPortTur] = useState('SATILIK');
  const [editPortFiyat, setEditPortFiyat] = useState('');
  const [editPortMetrekare, setEditPortMetrekare] = useState('');
  const [editPortOdaSayisi, setEditPortOdaSayisi] = useState('2+1');
  const [editPortIl, setEditPortIl] = useState('İstanbul');
  const [editPortIlce, setEditPortIlce] = useState('');
  const [editPortSemt, setEditPortSemt] = useState('');
  const [editPortMahalle, setEditPortMahalle] = useState('');
  const [editPortCadde, setEditPortCadde] = useState('');
  const [editPortSokak, setEditPortSokak] = useState('');
  const [editPortKapora, setEditPortKapora] = useState('');
  const [editPortDepozito, setEditPortDepozito] = useState('');
  const [editPortLandlordName, setEditPortLandlordName] = useState('');
  const [editPortLandlordPhone, setEditPortLandlordPhone] = useState('');
  const [editPortAciklama, setEditPortAciklama] = useState('');
  const [editPortOtoparkTipi, setEditPortOtoparkTipi] = useState('');
  const [editPortIsinmaTipi, setEditPortIsinmaTipi] = useState('');
  const [editPortBalkonDurumu, setEditPortBalkonDurumu] = useState('');
  const [editPortEsyaDurumu, setEditPortEsyaDurumu] = useState('');
  const [editPortKullanimDurumu, setEditPortKullanimDurumu] = useState('');
  const [editPortTapuDurumu, setEditPortTapuDurumu] = useState('');
  const [editPortHasAsansor, setEditPortHasAsansor] = useState(false);
  const [editPortIsKrediyeUygun, setEditPortIsKrediyeUygun] = useState(false);
  const [editPortIsTakasaUygun, setEditPortIsTakasaUygun] = useState(false);
  const [editPortIsAcilSatilik, setEditPortIsAcilSatilik] = useState(false);
  const [editPortIsFiyatiDustu, setEditPortIsFiyatiDustu] = useState(false);
  const [editPortPos, setEditPortPos] = useState<[number, number] | null>(null);
  const [editPortSubmitting, setEditPortSubmitting] = useState(false);

  // Map-Address Sync State
  const [syncMapAddress, setSyncMapAddress] = useState(true);

  // New Portfolio Debounce
  const debouncedNewPortIl = useDebounce(newPortIl, 1000);
  const debouncedNewPortIlce = useDebounce(newPortIlce, 1000);
  const debouncedNewPortSemt = useDebounce(newPortSemt, 1000);
  const debouncedNewPortMahalle = useDebounce(newPortMahalle, 1000);
  const debouncedNewPortCadde = useDebounce(newPortCadde, 1000);
  const debouncedNewPortSokak = useDebounce(newPortSokak, 1000);

  // Edit Portfolio Debounce
  const debouncedEditPortIl = useDebounce(editPortIl, 1000);
  const debouncedEditPortIlce = useDebounce(editPortIlce, 1000);
  const debouncedEditPortSemt = useDebounce(editPortSemt, 1000);
  const debouncedEditPortMahalle = useDebounce(editPortMahalle, 1000);
  const debouncedEditPortCadde = useDebounce(editPortCadde, 1000);
  const debouncedEditPortSokak = useDebounce(editPortSokak, 1000);

  const skipGeocodeRef = useRef(false);

  // Geocoding function
  const geocodeAddress = async (il: string, ilce: string, semt: string, mahalle: string, cadde: string, sokak: string, setter: (pos: [number, number]) => void) => {
    if (!syncMapAddress) return;
    const queryParts = [];
    if (sokak) queryParts.push(sokak);
    if (cadde) queryParts.push(cadde);
    if (mahalle) queryParts.push(mahalle);
    if (semt) queryParts.push(semt);
    if (ilce) queryParts.push(ilce);
    if (il) queryParts.push(il);
    
    if (queryParts.length === 0) return;
    
    const q = queryParts.join(' ');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      }
    } catch (e) {
      console.error("Geocoding error", e);
    }
  };

  // Reverse Geocoding function
  const reverseGeocode = async (lat: number, lng: number, setIl: any, setIlce: any, setSemt: any, setMahalle: any, setCadde: any, setSokak: any) => {
    if (!syncMapAddress) return;
    skipGeocodeRef.current = true;
    setTimeout(() => { skipGeocodeRef.current = false; }, 2000); // Rescue if effect doesn't fire
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const a = data.address;
          if (a.province || a.city || a.state) setIl(a.province || a.city || a.state || '');
          if (a.town || a.county || a.district || a.city_district || a.borough || a.municipality) setIlce(a.town || a.county || a.district || a.city_district || a.borough || a.municipality || '');
          if (a.quarter || a.city_district) setSemt(a.quarter || a.city_district || '');
          if (a.suburb || a.village || a.neighbourhood || a.quarter) setMahalle(a.suburb || a.village || a.neighbourhood || a.quarter || '');
          const road = a.road || a.pedestrian || a.path || '';
          if (road.toLowerCase().includes('cadde') || road.toLowerCase().includes('bulvar')) {
            setCadde(road);
            setSokak('');
          } else {
            setSokak(road);
            setCadde('');
          }
        }
      }
    } catch (e) {
      console.error("Reverse geocoding error", e);
    }
  };

  useEffect(() => {
    if (showAddPortfolioModal) {
      if (skipGeocodeRef.current) {
        skipGeocodeRef.current = false;
        return;
      }
      geocodeAddress(debouncedNewPortIl, debouncedNewPortIlce, debouncedNewPortSemt, debouncedNewPortMahalle, debouncedNewPortCadde, debouncedNewPortSokak, setNewPortPos);
    }
  }, [debouncedNewPortIl, debouncedNewPortIlce, debouncedNewPortSemt, debouncedNewPortMahalle, debouncedNewPortCadde, debouncedNewPortSokak, showAddPortfolioModal]);

  useEffect(() => {
    if (isEditingPortfolio) {
      if (skipGeocodeRef.current) {
        skipGeocodeRef.current = false;
        return;
      }
      geocodeAddress(debouncedEditPortIl, debouncedEditPortIlce, debouncedEditPortSemt, debouncedEditPortMahalle, debouncedEditPortCadde, debouncedEditPortSokak, setEditPortPos);
    }
  }, [debouncedEditPortIl, debouncedEditPortIlce, debouncedEditPortSemt, debouncedEditPortMahalle, debouncedEditPortCadde, debouncedEditPortSokak, isEditingPortfolio]);

  // Close Portfolio Transaction Modal States
  const [expandedCompletedCardId, setExpandedCompletedCardId] = useState<string | null>(null);
  const [hoveredPortfolioId, setHoveredPortfolioId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState<boolean>(true);
  const [showCloseTransactionModal, setShowCloseTransactionModal] = useState(false);
  const [closePortPortfolio, setClosePortPortfolio] = useState<any>(null);
  const [closeIslemTuru, setCloseIslemTuru] = useState<'SATIS' | 'KIRALAMA'>('SATIS');
  const [closeIslemBedeli, setCloseIslemBedeli] = useState('');
  const [closeHizmetBedeliCiro, setCloseHizmetBedeliCiro] = useState('');
  const [closeIslemTarihi, setCloseIslemTarihi] = useState(new Date().toISOString().split('T')[0]);
  const [closeAciklama, setCloseAciklama] = useState('');
  const [closeAliciMusteriId, setCloseAliciMusteriId] = useState('');
  const [closeLoading, setCloseLoading] = useState(false);

  // Dashboard (Analytics) State
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Appointments
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentScope, setAppointmentScope] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [selectedMusteriId, setSelectedMusteriId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Appointment Action Modal
  const [showAppointmentActionModal, setShowAppointmentActionModal] = useState(false);
  const [selectedAppointmentToAction, setSelectedAppointmentToAction] = useState<any>(null);
  const [appActionType, setAppActionType] = useState<'SATILDI' | 'KIRALANDI' | 'VAZGECILDI'>('SATILDI');
  const [appActionBedel, setAppActionBedel] = useState('');
  const [appActionCiro, setAppActionCiro] = useState('');
  const [appActionLoading, setAppActionLoading] = useState(false);

  // Clients (Musteriler)
  const [clients, setClients] = useState<any[]>([]);
  const [clientTabScope, setClientTabScope] = useState<'active' | 'passive'>('active');
  const [clientTypeScope, setClientTypeScope] = useState<'all' | 'owner' | 'seeker'>('all');
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientBudget, setNewClientBudget] = useState('');
  const [newClientType, setNewClientType] = useState('DAIRE');
  const [newClientMusteriTipi, setNewClientMusteriTipi] = useState('ALICI');

  const handleToggleClientStatus = async (clientId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/clients/toggle-status/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, isActive: !currentStatus } : c));
      } else {
        const err = await res.json();
        showToast(err.message || 'Müşteri durumu değiştirilemedi.', 'error');
      }
    } catch (e: any) {
      showToast('Müşteri durumu değiştirilirken hata oluştu: ' + e.message, 'error');
    }
  };

  // Interactive Chart States (Dashboard Cards)
  const [portfoyTimeframe, setPortfoyTimeframe] = useState<'HAFTALIK' | 'AYLIK'>('HAFTALIK');
  const [hoveredPortfoyIndex, setHoveredPortfoyIndex] = useState<number | null>(null);
  const portfoyBarContainerRef = useRef<HTMLDivElement>(null);

  const scrollPortfoyChart = (direction: 'left' | 'right') => {
    if (portfoyBarContainerRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      portfoyBarContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const [ciroTimeframe, setCiroTimeframe] = useState<'6A_1' | '6A_2' | '1Y'>(
    new Date().getMonth() < 6 ? '6A_1' : '6A_2'
  );
  const [hoveredCiroIndex, setHoveredCiroIndex] = useState<number | null>(
    new Date().getMonth() % 6
  );
  const ciroBarContainerRef = useRef<HTMLDivElement>(null);

  const scrollCiroChart = (direction: 'left' | 'right') => {
    if (ciroBarContainerRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      ciroBarContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Dynamic Real-Database-Driven Datasets for Interactive Dashboard Bento Cards
  const portfoyChartData = useMemo(() => {
    const weeklyDays = [
      { label: 'Pzt', dayIndex: 1 },
      { label: 'Sal', dayIndex: 2 },
      { label: 'Çar', dayIndex: 3 },
      { label: 'Per', dayIndex: 4 },
      { label: 'Cum', dayIndex: 5 },
      { label: 'Cmt', dayIndex: 6 },
      { label: 'Paz', dayIndex: 0 },
    ];

    const totalActivePortfolios = portfolios.filter(p => !['SATILDI', 'KIRALANDI', 'KIRALANDI_SATILDI', 'TAMAMLANDI'].includes((p.durum || '').toUpperCase()));

    const haftalikRaw = weeklyDays.map(({ label, dayIndex }) => {
      const dayPorts = totalActivePortfolios.filter(p => {
        const d = p.createdAt ? new Date(p.createdAt) : null;
        return d ? d.getDay() === dayIndex : false;
      });
      const satilik = dayPorts.filter(p => (p.tur || '').toUpperCase() === 'SATILIK').length;
      const kiralik = dayPorts.filter(p => (p.tur || '').toUpperCase() === 'KIRALIK').length;
      const val = satilik + kiralik;
      return { label, val, satilik, kiralik };
    });

    const maxHaftalikVal = Math.max(...haftalikRaw.map(d => d.val), 1);
    const HAFTALIK = haftalikRaw.map(d => ({
      ...d,
      pct: Math.max(15, Math.round((d.val / maxHaftalikVal) * 100))
    }));

    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const aylikRaw = monthNames.map((label, monthIndex) => {
      const monthPorts = totalActivePortfolios.filter(p => {
        const d = p.createdAt ? new Date(p.createdAt) : null;
        return d ? d.getMonth() === monthIndex : false;
      });
      const satilik = monthPorts.filter(p => (p.tur || '').toUpperCase() === 'SATILIK').length;
      const kiralik = monthPorts.filter(p => (p.tur || '').toUpperCase() === 'KIRALIK').length;
      const val = satilik + kiralik;
      return { label, val, satilik, kiralik };
    });

    const maxAylikVal = Math.max(...aylikRaw.map(d => d.val), 1);
    const AYLIK = aylikRaw.map(d => ({
      ...d,
      pct: Math.max(15, Math.round((d.val / maxAylikVal) * 100))
    }));

    return { HAFTALIK, AYLIK };
  }, [portfolios]);

  const ciroChartData = useMemo(() => {
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

    const monthlyCiroSums = monthNames.map((label, monthIndex) => {
      const monthCompleted = completedPortfolios.filter(p => {
        // Sadece giriş yapan kullanıcının işlemi olanları filtrele (Bireysel Ciro)
        if (!compareIds(p.islemYapanDanismanId, user?.id) && !compareIds(p.gorevliUzmanId, user?.id)) return false;

        const dateStr = p.islemTarihi || p.updatedAt || p.createdAt;
        const d = dateStr ? new Date(dateStr) : null;
        return d ? d.getMonth() === monthIndex : false;
      });
      const totalCiro = monthCompleted.reduce((sum, p) => sum + (Number(p.hizmetBedeliCiro) || Number(p.ciro) || 0), 0);
      return { label, ciro: totalCiro };
    });

    const maxCiroVal = Math.max(...monthlyCiroSums.map(d => d.ciro), 100000);

    const mapCiroToY = (ciro: number) => {
      if (ciro <= 0) return 25;
      const ratio = ciro / maxCiroVal;
      return Math.max(2, Math.round(25 - ratio * 23));
    };

    return {
      '6A_1': monthlyCiroSums.slice(0, 6).map(d => ({ label: d.label, ciro: d.ciro, y: mapCiroToY(d.ciro) })),
      '6A_2': monthlyCiroSums.slice(6, 12).map(d => ({ label: d.label, ciro: d.ciro, y: mapCiroToY(d.ciro) })),
      '1Y': monthlyCiroSums.map(d => ({ label: d.label, ciro: d.ciro, y: mapCiroToY(d.ciro) }))
    };
  }, [completedPortfolios, user?.id]);

  // Dynamic Month/Year Navigation States for Mini Calendar
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); // Default to current month
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(new Date().getDate());

  const calendarYear = currentCalendarDate.getFullYear();
  const calendarMonth = currentCalendarDate.getMonth(); // 0-indexed (0 = Jan, 6 = Jul)

  // Month Name in Turkish (e.g. "Temmuz")
  const calendarMonthName = currentCalendarDate.toLocaleDateString('tr-TR', { month: 'long' });

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
  const [popCalendarDate, setPopCalendarDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); // Default to current month
  const [popSelectedDay, setPopSelectedDay] = useState<number>(new Date().getDate());
  const [popAppointments, setPopAppointments] = useState<any[]>([]);

  const popYear = popCalendarDate.getFullYear();
  const popMonth = popCalendarDate.getMonth();
  const popMonthName = popCalendarDate.toLocaleDateString('tr-TR', { month: 'long' });
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

  // Fetch completed portfolios (Satıldı / Kiralandı) from backend
  const fetchCompletedPortfolios = async (currentToken?: string) => {
    const t = currentToken || token;
    if (!t) return;
    setCompletedLoading(true);
    try {
      const res = await fetch('/api/portfoyler/completed', {
        headers: {
          'Authorization': `Bearer ${t}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setCompletedPortfolios(Array.isArray(data) ? data : []);
      } else {
        console.error('[DEBUG] completed portfolios error:', data);
      }
    } catch (err) {
      console.error('Failed to fetch completed portfolios:', err);
    } finally {
      setCompletedLoading(false);
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
  // Fetch all appointments list from real backend
  const fetchAppointments = async (currentToken: string, _dateObj: Date) => {
    try {
      const res = await fetch(`/api/appointments/list`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const validAppointments = (Array.isArray(data) ? data : []).filter(
          (app: any) => app.durum !== 'DENIED' && app.durum !== 'REJECTED'
        );
        setAppointments(validAppointments);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    }
  };

  // Müşteri Süreçlerini Getir (MusteriSurecleri tablosundan)
  const fetchClientProcesses = async (currentToken: string) => {
    setClientProcessesLoading(true);
    try {
      const res = await fetch('/api/appointments/client-processes', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClientProcesses(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch client processes:', err);
    } finally {
      setClientProcessesLoading(false);
    }
  };

  // Fetch Dashboard Summary (Analytics Tab)
  const fetchDashboardData = async (currentToken: string) => {
    setDashboardLoading(true);
    try {
      const res = await fetch('/api/dashboard/summary', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setDashboardLoading(false);
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
        fetchEmployees(token);
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
        showToast(data.message, 'error');
        fetchSubscriptionDetails(token);
      } else {
        showToast(data.message || 'Paket değişimi planlanırken hata oluştu.', 'error');
      }
    } catch (err) {
      showToast('Sunucuyla bağlantı kurulamadı.', 'error');
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
        showToast(data.message, 'error');
        fetchSubscriptionDetails(token);
      } else {
        showToast(data.message || 'Planlama iptal edilirken hata oluştu.', 'error');
      }
    } catch (err) {
      showToast('Sunucu bağlantı hatası.', 'error');
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
        showToast("Şifre başarıyla sıfırlandı!\nYeni Geçici Şifre: Homey123!\nDanışman ilk girişte bu şifre ile giriş yapıp yeni şifresini belirlemelidir.", 'success');
        fetchEmployees(token!);
      } else {
        showToast(data.message || "Şifre sıfırlanırken hata oluştu.", 'error');
      }
    } catch (err) {
      showToast("Sunucu bağlantı hatası.", 'error');
    }
  };

  // Sync state and database on login or update
  useEffect(() => {
    if (token) {
      fetchEmployees(token);
      fetchPortfolios(token);
      fetchCompletedPortfolios(token);
      fetchClients(token);
      fetchSubscriptionDetails(token);
      fetchMyOfficeStatus(token);
      fetchOfficeUsers(token);
    }
  }, [token]);

  // Re-fetch completed portfolios dynamically when switching to completedPortfolios tab
  useEffect(() => {
    if (token && activeTab === 'completedPortfolios') {
      fetchCompletedPortfolios(token);
    }
  }, [activeTab, token]);



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

  // Mevcut randevuları MusteriSurecleri'ne sadece bir kez ekle (uygulama ilk açıldığında)
  const backfillDoneRef = useRef(false);
  useEffect(() => {
    if (token && !backfillDoneRef.current) {
      backfillDoneRef.current = true;
      fetch('/api/appointments/backfill-stages', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
        .then(r => r.json())
        .then(d => console.log('[HOMEY] Backfill:', d.message))
        .catch(e => console.warn('[HOMEY] Backfill skipped:', e));
    }
  }, [token]);

  // Fetch dashboard data when analytics tab is activated
  useEffect(() => {
    if (token && activeTab === 'analytics' && user?.rol === 'YETKILI') {
      fetchDashboardData(token);
    }
  }, [token, activeTab]);

  // Süreç yönetimi tabı açıldığında MusteriSurecleri verilerini çek
  useEffect(() => {
    if (token && activeTab === 'processManagement') {
      fetchClientProcesses(token);
    }
  }, [token, activeTab]);

  // Fetch portfolio specific appointments when modal is open
  useEffect(() => {
    if (token && selectedPortfolio?.id) {
      fetchPortfolioAppointments(token, selectedPortfolio.id, popCalendarDate);
    }
  }, [token, selectedPortfolio, popCalendarDate]);

  // Login Handler
  // Auto-fill Kapora and Depozito based on FirmaSettings when adding a portfolio
  useEffect(() => {
    if (showAddPortfolioModal && newPortFiyat) {
      const fiyatNum = Number(newPortFiyat);
      if (isNaN(fiyatNum) || fiyatNum <= 0) return;

      if (newPortTur === 'KIRALIK') {
        setNewPortDepozito(String(fiyatNum * (firmaSettings.KiralamaDepozitoSiniri || 1)));
        if (firmaSettings.KiralamaKaporaTipi === '1_KIRA') {
          setNewPortKapora(String(fiyatNum));
        } else {
          setNewPortKapora('');
        }
      } else if (newPortTur === 'SATILIK') {
        const orani = firmaSettings.SatisKaporaOrani || 5;
        setNewPortKapora(String(fiyatNum * (orani / 100)));
        setNewPortDepozito('');
      }
    }
  }, [showAddPortfolioModal, newPortFiyat, newPortTur, firmaSettings]);

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      showToast("Lütfen önce e-posta adresinizi giriniz.", "error");
      return;
    }
    setIsForgotPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
      } else {
        showToast(data.message, "error");
      }
    } catch (e) {
      showToast("Bir hata oluştu, lütfen daha sonra tekrar deneyin.", "error");
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !resetPasswordNew) return;
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword: resetPasswordNew })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
        setResetToken(null);
      } else {
        setResetPasswordError(data.message);
      }
    } catch (e) {
      setResetPasswordError("Bir hata oluştu, lütfen daha sonra tekrar deneyin.");
    }
  };

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
        if (data.user.temaTercihi) {
          setThemePreference(data.user.temaTercihi);
        }
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

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoginError(null);
      try {
        const res = await fetch('/api/auth/google-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: tokenResponse.access_token })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('homey_token', data.token);
          localStorage.setItem('homey_user', JSON.stringify(data.user));
          setToken(data.token);
          setUser(data.user);
          setPackageType(data.user.paketTipi);
          if (data.user.temaTercihi) {
            setThemePreference(data.user.temaTercihi);
          }
        } else {
          setLoginError(data.message || 'Google ile giriş başarısız.');
        }
      } catch (err) {
        setLoginError('Sunucuyla bağlantı kurulamadı.');
      }
    },
    onError: () => {
      setLoginError('Google ile giriş işlemi iptal edildi veya başarısız oldu.');
    }
  });

  const fillWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setRegError(null);
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const payload = await res.json();
        if (payload && payload.email) {
          setRegEmail(payload.email);
          setRegAd(payload.given_name || '');
          setRegSoyad(payload.family_name || '');
          showToast('Yetkili bilgileri Google üzerinden çekildi!', 'success');
        }
      } catch (err) {
        setRegError('Google bilgileri alınamadı.');
      }
    },
    onError: () => {
      setRegError('Google işlemi iptal edildi.');
    }
  });

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
        showToast('Şifreniz başarıyla değiştirildi! Yeni şifrenizle giriş yapınız.', 'success');
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
    setPortfolios([]);
    setCompletedPortfolios([]);
    setClients([]);
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

  const handleDeleteEmployee = async () => {
    if (!userToDelete || !reassignedUserId) {
      showToast('Lütfen portföylerin kime aktarılacağını seçin.', 'error');
      return;
    }
    
    if (userToDelete.id === reassignedUserId) {
      showToast('Portföyler aynı kişiye aktarılamaz.', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/employees/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reassignedUserId })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Kullanıcı başarıyla silindi ve portföyler aktarıldı.', 'success');
        setShowDeleteUserModal(false);
        setUserToDelete(null);
        setReassignedUserId('');
        if (selectedEmployee?.id === userToDelete.id) {
          setSelectedEmployee(null);
        }
        if (token) {
          fetchEmployees(token);
        }
      } else {
        showToast(data.message || 'Silme işlemi başarısız.', 'error');
      }
    } catch (err) {
      showToast('Sunucu hatası oluştu.', 'error');
    }
  };

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
          showToast(`Gayrimenkul uzmanı başarıyla eklendi!\nGeçici şifresi: Homey123!`, 'success');
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
      showToast("Lütfen zorunlu alanları doldurunuz.", 'error');
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
        showToast("Müşteri başarıyla veritabanına kaydedildi!", 'success');
        setNewClientName('');
        setNewClientPhone('');
        setNewClientBudget('');
        setNewClientType('DAIRE');
        setNewClientMusteriTipi('ALICI');
        setShowAddClientModal(false);
        fetchClients(token!);
      } else {
        showToast(data.message || "Müşteri eklenirken hata oluştu.", 'error');
      }
    } catch (err) {
      showToast("Sunucu bağlantı hatası.", 'error');
    }
  };

  // Portfolio Add Handler
  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortFiyat || !newPortIlce || !newPortLandlordName || !newPortLandlordPhone || !newPortMetrekare) {
      showToast("Lütfen tüm alanları doldurunuz.", 'error');
      return;
    }

    setNewPortSubmitting(true);
    try {
      const res = await fetch('/api/portfolios/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          baslik: newPortBaslik,
          tip: newPortTip,
          tur: newPortTur,
          fiyat: Number(newPortFiyat),
          metrekare: Number(newPortMetrekare),
          odaSayisi: newPortTip === 'ARSA' ? '' : newPortOdaSayisi,
          il: newPortIl,
          ilce: newPortIlce,
          mahalle: newPortMahalle,
          semt: newPortSemt,
          cadde: newPortCadde,
          sokak: newPortSokak,
          kaporaMiktari: newPortKapora,
          depozitoMiktari: newPortDepozito,
          evSahibiAdi: newPortLandlordName,
          evSahibiTelefon: newPortLandlordPhone,
          aciklama: newPortAciklama,
          otoparkTipi: newPortOtoparkTipi,
          isinmaTipi: newPortIsinmaTipi,
          balkonDurumu: newPortBalkonDurumu,
          esyaDurumu: newPortEsyaDurumu,
          kullanimDurumu: newPortKullanimDurumu,
          tapuDurumu: newPortTapuDurumu,
          hasAsansor: newPortHasAsansor,
          isKrediyeUygun: newPortIsKrediyeUygun,
          isTakasaUygun: newPortIsTakasaUygun,
          isAcilSatilik: newPortIsAcilSatilik,
          isFiyatiDustu: newPortIsFiyatiDustu,
          latitude: newPortPos?.[0] || null,
          longitude: newPortPos?.[1] || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        const createdPortfolioId = data.portfolioId;

        // Seçilen fotoğrafları Azure Blob Storage & DB'ye sırayla yükle
        if (newPortFiles.length > 0 && createdPortfolioId) {
          for (let i = 0; i < newPortFiles.length; i++) {
            const formData = new FormData();
            formData.append('image', newPortFiles[i]);
            formData.append('portfoyId', createdPortfolioId);
            if (i === 0) {
              formData.append('isKapak', 'true');
            }
            try {
              await fetch('/api/upload/portfolio-image', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
              });
            } catch (imgErr) {
              console.error(`Fotoğraf #${i + 1} yüklenirken hata:`, imgErr);
            }
          }
        }

        showToast("Yeni portföy ve fotoğrafları başarıyla veritabanına kaydedildi!", 'success');
        setShowAddPortfolioModal(false);
        // Reset fields
        setNewPortBaslik('');
        setNewPortTip('DAIRE');
        setNewPortTur('SATILIK');
        setNewPortFiyat('');
        setNewPortMetrekare('');
        setNewPortOdaSayisi('2+1');
        setNewPortIlce('');
        setNewPortMahalle('');
        setNewPortSemt('');
        setNewPortCadde('');
        setNewPortSokak('');
        setNewPortKapora('');
        setNewPortDepozito('');
        setNewPortLandlordName('');
        setNewPortLandlordPhone('');
        setNewPortAciklama('');
        setNewPortOtoparkTipi('');
        setNewPortIsinmaTipi('');
        setNewPortBalkonDurumu('');
        setNewPortEsyaDurumu('');
        setNewPortKullanimDurumu('');
        setNewPortTapuDurumu('');
        setNewPortHasAsansor(false);
        setNewPortIsKrediyeUygun(false);
        setNewPortIsTakasaUygun(false);
        setNewPortIsAcilSatilik(false);
        setNewPortIsFiyatiDustu(false);
        setNewPortPos(null);
        setNewPortFiles([]);
        fetchPortfolios(token!);
        setActiveTab('documentOperations');
      } else {
        showToast(data.message || "Portföy eklenirken hata oluştu.", 'error');
      }
    } catch (err) {
      showToast("Sunucu bağlantı hatası.", 'error');
    } finally {
      setNewPortSubmitting(false);
    }
  };

  // Start Edit Portfolio Handler
  const startEditPortfolio = (p: any) => {
    setIsEditingPortfolio(true);
    setEditPortBaslik(p.baslik || '');
    setEditPortTip(p.tip);
    setEditPortTur(p.tur);
    setEditPortFiyat(String(p.fiyat));
    setEditPortMetrekare(String(p.metrekare || ''));
    setEditPortOdaSayisi(p.odaSayisi || '2+1');
    setEditPortIl(p.il);
    setEditPortIlce(p.ilce);
    setEditPortSemt(p.semt || '');
    setEditPortMahalle(p.mahalle || '');
    setEditPortCadde(p.cadde || '');
    setEditPortSokak(p.sokak || '');
    setEditPortKapora(p.kapora ? String(p.kapora) : '');
    setEditPortDepozito(p.depozito ? String(p.depozito) : '');
    setEditPortLandlordName(p.evSahibiAdi);
    setEditPortLandlordPhone(p.evSahibiTelefon);
    setEditPortAciklama(p.aciklama || '');
    setEditPortOtoparkTipi(p.otoparkTipi || '');
    setEditPortIsinmaTipi(p.isinmaTipi || '');
    setEditPortBalkonDurumu(p.balkonDurumu || '');
    setEditPortEsyaDurumu(p.esyaDurumu || '');
    setEditPortKullanimDurumu(p.kullanimDurumu || '');
    setEditPortTapuDurumu(p.tapuDurumu || '');
    setEditPortHasAsansor(Boolean(p.hasAsansor) || false);
    setEditPortIsKrediyeUygun(Boolean(p.isKrediyeUygun) || false);
    setEditPortIsTakasaUygun(Boolean(p.isTakasaUygun) || false);
    setEditPortIsAcilSatilik(Boolean(p.isAcilSatilik) || false);
    setEditPortIsFiyatiDustu(Boolean(p.isFiyatiDustu) || false);
    setIsEditingPortfolio(true);
  };

  // Save Edit Portfolio Handler
  const handleSaveEditPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortfolio) return;
    if (!editPortFiyat || !editPortIlce || !editPortLandlordName || !editPortLandlordPhone || !editPortMetrekare) {
      showToast("Lütfen tüm alanları doldurunuz.", 'error');
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
          baslik: editPortBaslik,
          tip: editPortTip,
          tur: editPortTur,
          fiyat: Number(editPortFiyat),
          metrekare: Number(editPortMetrekare),
          odaSayisi: editPortTip === 'ARSA' ? '' : editPortOdaSayisi,
          il: editPortIl,
          ilce: editPortIlce,
          semt: editPortSemt,
          mahalle: editPortMahalle,
          cadde: editPortCadde,
          sokak: editPortSokak,
          kapora: editPortKapora ? Number(editPortKapora) : null,
          depozito: editPortTur === 'KIRALIK' && editPortDepozito ? Number(editPortDepozito) : null,
          evSahibiAdi: editPortLandlordName,
          evSahibiTelefon: editPortLandlordPhone,
          aciklama: editPortAciklama,
          otoparkTipi: editPortOtoparkTipi,
          isinmaTipi: editPortIsinmaTipi,
          balkonDurumu: editPortBalkonDurumu,
          esyaDurumu: editPortEsyaDurumu,
          kullanimDurumu: editPortKullanimDurumu,
          tapuDurumu: editPortTapuDurumu,
          hasAsansor: editPortHasAsansor,
          isKrediyeUygun: editPortIsKrediyeUygun,
          isTakasaUygun: editPortIsTakasaUygun,
          isAcilSatilik: editPortIsAcilSatilik,
          isFiyatiDustu: editPortIsFiyatiDustu,
          latitude: editPortPos?.[0] || null,
          longitude: editPortPos?.[1] || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Portföy başarıyla veritabanında güncellendi!", 'success');
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
          semt: editPortSemt,
          mahalle: editPortMahalle,
          cadde: editPortCadde,
          sokak: editPortSokak,
          kapora: editPortKapora ? Number(editPortKapora) : null,
          depozito: editPortTur === 'KIRALIK' && editPortDepozito ? Number(editPortDepozito) : null,
          evSahibiAdi: editPortLandlordName,
          evSahibiTelefon: editPortLandlordPhone,
          aciklama: editPortAciklama,
          otoparkTipi: editPortOtoparkTipi,
          isinmaTipi: editPortIsinmaTipi,
          balkonDurumu: editPortBalkonDurumu,
          esyaDurumu: editPortEsyaDurumu,
          kullanimDurumu: editPortKullanimDurumu,
          tapuDurumu: editPortTapuDurumu,
          hasAsansor: editPortHasAsansor,
          isKrediyeUygun: editPortIsKrediyeUygun,
          isTakasaUygun: editPortIsTakasaUygun,
          isAcilSatilik: editPortIsAcilSatilik,
          isFiyatiDustu: editPortIsFiyatiDustu,
          latitude: editPortPos?.[0] || null,
          longitude: editPortPos?.[1] || null
        };
        setSelectedPortfolio(updated);
        fetchPortfolios(token!);
      } else {
        showToast(data.message || "Portföy güncellenirken hata oluştu.", 'error');
      }
    } catch (err) {
      showToast("Sunucu bağlantı hatası.", 'error');
    }
  };

  // Open Close Transaction Modal & calculate default ciro
  const openCloseTransactionModal = (portfolio: any) => {
    setClosePortPortfolio(portfolio);
    const defaultTuru = portfolio.tur === 'KIRALIK' ? 'KIRALAMA' : 'SATIS';
    setCloseIslemTuru(defaultTuru);
    const amount = Number(portfolio.fiyat) || 0;
    setCloseIslemBedeli(String(amount));
    const defaultCiro = defaultTuru === 'SATIS' ? amount * 0.02 : amount;
    setCloseHizmetBedeliCiro(String(defaultCiro));
    setCloseIslemTarihi(new Date().toISOString().split('T')[0]);
    setCloseAciklama('');
    setCloseAliciMusteriId('');
    setShowCloseTransactionModal(true);
  };

  const handleIslemTuruChange = (turu: 'SATIS' | 'KIRALAMA') => {
    setCloseIslemTuru(turu);
    const amount = Number(closeIslemBedeli) || 0;
    const defaultCiro = turu === 'SATIS' ? amount * 0.02 : amount;
    setCloseHizmetBedeliCiro(String(defaultCiro));
  };

  const handleIslemBedeliChange = (val: string) => {
    setCloseIslemBedeli(val);
    const amount = Number(val) || 0;
    const defaultCiro = closeIslemTuru === 'SATIS' ? amount * 0.02 : amount;
    setCloseHizmetBedeliCiro(String(defaultCiro));
  };

  const handleCloseTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closePortPortfolio || !closeIslemBedeli || !closeHizmetBedeliCiro) {
      showToast("Lütfen tüm zorunlu alanları doldurunuz.", 'error');
      return;
    }

    setCloseLoading(true);

    if (token) {
      try {
        const res = await fetch(`/api/portfoyler/${closePortPortfolio.id}/satis-kapat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            islemTuru: closeIslemTuru,
            islemBedeli: Number(closeIslemBedeli),
            hizmetBedeliCiro: Number(closeHizmetBedeliCiro),
            islemTarihi: closeIslemTarihi,
            aciklama: closeAciklama,
            aliciMusteriId: closeAliciMusteriId || null
          })
        });

        const data = await res.json();
        if (res.ok) {
          showToast(data.message || 'Portföy işlemi başarıyla kapatıldı!', 'success');
          // Portföyü anında listeden kaldır (fetchPortfolios tamamlanmadan önce de görünmesin)
          setPortfolios(prev => prev.filter(p => p.id !== closePortPortfolio.id));
          setShowCloseTransactionModal(false);
          setSelectedPortfolio(null);
          fetchPortfolios(token);
          fetchCompletedPortfolios(token);
          fetchEmployees(token);
          fetchClients(token);
          fetchAppointments(token, currentCalendarDate);
        } else {
          showToast(data.message || 'İşlem kapatılırken hata oluştu.', 'error');
        }
      } catch (err) {
        showToast('Sunucu bağlantı hatası.', 'error');
      } finally {
        setCloseLoading(false);
      }
    } else {
      const finalDurum = closeIslemTuru === 'KIRALAMA' ? 'KIRALANDI' : 'SATILDI';
      const updatedPort = {
        ...closePortPortfolio,
        durum: finalDurum,
        islemTuru: closeIslemTuru,
        islemBedeli: Number(closeIslemBedeli),
        hizmetBedeliCiro: Number(closeHizmetBedeliCiro),
        islemTarihi: closeIslemTarihi || new Date().toISOString(),
        islemAciklama: closeAciklama,
        islemYapanDanisman: user ? `${user.ad || ''} ${user.soyad || ''}`.trim() : (closePortPortfolio.gorevliUzman || 'Danışman'),
        islemYapanDanismanId: user?.id || closePortPortfolio.gorevliUzmanId
      };
      setPortfolios(prev => prev.filter(p => p.id !== closePortPortfolio.id));
      setCompletedPortfolios(prev => [updatedPort, ...prev.filter(p => p.id !== closePortPortfolio.id)]);
      showToast(`Portföy işlemi '${finalDurum}' olarak kapatıldı!`, 'success');
      setShowCloseTransactionModal(false);
      setSelectedPortfolio(null);
      setCloseLoading(false);
    }

  };

  // Appointment Create / Request Handler
  const handleCreateOrRequestAppointment = async (portfolio: any, isOwner: boolean) => {
    if (!selectedMusteriId || !selectedDate) {
      showToast("Lütfen katılacak müşteri ve randevu tarihi/saati seçiniz.", 'error');
      return;
    }

    if (portfolio.durum === 'KAPORA_ASAMASINDA' || portfolio.durum === 'KIRALANDI_SATILDI') {
      showToast("Bu portföy kapora aşamasında veya satıldığı için randevu oluşturulamaz.", 'error');
      return;
    }

    if (firmaSettings.YetkilendirmeSarti && !portfolio.yetkilendirmeSozlesmesiYapildi) {
      showToast("Bu portföyün yetkilendirme sözleşmesi eksik olduğu için randevu oluşturulamaz.", 'error');
      return;
    }

    const targetStatus = isOwner ? 'APPROVED' : 'PENDING';

    if (token) {
      try {
        const res = await fetch('/api/appointments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            portfoyId: portfolio.id,
            musteriId: selectedMusteriId,
            randevuZamani: selectedDate,
            durum: targetStatus
          })
        });

        const data = await res.json();
        if (res.ok) {
          showToast(
            isOwner ? 'Randevu başarıyla oluşturuldu ve takviminize eklendi!' : 'Randevu talebi ilan sahibine iletildi!',
            'success'
          );
          setSelectedMusteriId('');
          setSelectedDate('');
          setSelectedPortfolio(null);
          fetchAppointments(token, currentCalendarDate);
        } else {
          showToast(data.message || 'Randevu oluşturulurken hata oluştu.', 'error');
        }
      } catch (err) {
        showToast('Sunucu bağlantı hatası.', 'error');
      }
    } else {
      const clientObj = clients.find(c => c.id === selectedMusteriId);
      const newApp = {
        id: String(appointments.length + 1),
        portfoyId: portfolio.id,
        portfoyTip: portfolio.tip,
        talepEden: `${user?.ad || 'Can'} ${user?.soyad || 'Yılmaz'}`,
        talepEdenId: user?.id,
        portfoySahibi: portfolio.gorevliUzman || 'Gayrimenkul Uzmanı',
        portfoySahibiId: portfolio.gorevliUzmanId,
        musteri: clientObj ? `${clientObj.ad} ${clientObj.soyad}` : 'Bilinmeyen Müşteri',
        musteriTelefon: clientObj?.telefon || '',
        zaman: selectedDate.split('T')[1] || '12:00',
        tarih: selectedDate.split('T')[0] || 'Bugün',
        randevuZamani: selectedDate,
        durum: targetStatus
      };
      setAppointments([...appointments, newApp]);
      setSelectedMusteriId('');
      setSelectedDate('');
      setSelectedPortfolio(null);
      showToast(isOwner ? 'Randevunuz oluşturuldu.' : 'Randevu talebiniz iletildi.', 'success');
    }
  };

  // Create or Request Appointment from Right Sidebar Modal
  const handleCreateAppointmentFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppPortfolioId || !newAppMusteriId || !newAppDate) {
      showToast("Lütfen portföy, müşteri ve randevu tarihi/saati seçiniz.", 'error');
      return;
    }

    const targetPortfolio = portfolios.find(p => compareIds(p.id, newAppPortfolioId));
    if (!targetPortfolio) {
      showToast("Seçilen portföy bulunamadı.", 'error');
      return;
    }

    if (targetPortfolio.durum === 'KAPORA_ASAMASINDA' || targetPortfolio.durum === 'KIRALANDI_SATILDI') {
      showToast("Bu portföy kapora aşamasında veya satıldığı için yeni randevu oluşturulamaz.", 'error');
      return;
    }

    if (firmaSettings.YetkilendirmeSarti && !targetPortfolio.yetkilendirmeSozlesmesiYapildi) {
      showToast("Bu portföyün yetkilendirme sözleşmesi eksik olduğu için yeni randevu oluşturulamaz.", 'error');
      return;
    }

    const isOwner = compareIds(targetPortfolio.gorevliUzmanId, user?.id);
    const targetStatus = isOwner ? 'APPROVED' : 'PENDING';

    if (token) {
      try {
        const res = await fetch('/api/appointments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            portfoyId: targetPortfolio.id,
            musteriId: newAppMusteriId,
            randevuZamani: newAppDate,
            durum: targetStatus
          })
        });

        const data = await res.json();
        if (res.ok) {
          showToast(
            isOwner ? 'Randevunuz doğrudan oluşturuldu ve takvime eklendi!' : 'Randevu talebiniz ilan sahibine iletildi!',
            'success'
          );
          setNewAppPortfolioId('');
          setNewAppMusteriId('');
          setNewAppDate('');
          setShowAddAppointmentModal(false);
          fetchAppointments(token, currentCalendarDate);
        } else {
          showToast(data.message || 'Randevu oluşturulurken hata oluştu.', 'error');
        }
      } catch (err) {
        showToast('Sunucu bağlantı hatası.', 'error');
      }
    } else {
      const clientObj = clients.find(c => c.id === newAppMusteriId);
      const newApp = {
        id: String(appointments.length + 1),
        portfoyId: targetPortfolio.id,
        portfoyTip: targetPortfolio.tip,
        talepEden: `${user?.ad || 'Can'} ${user?.soyad || 'Yılmaz'}`,
        talepEdenId: user?.id,
        portfoySahibi: targetPortfolio.gorevliUzman || 'Gayrimenkul Uzmanı',
        portfoySahibiId: targetPortfolio.gorevliUzmanId,
        musteri: clientObj ? `${clientObj.ad} ${clientObj.soyad}` : 'Bilinmeyen Müşteri',
        musteriTelefon: clientObj?.telefon || '',
        zaman: newAppDate.split('T')[1] || '12:00',
        tarih: newAppDate.split('T')[0] || 'Bugün',
        randevuZamani: newAppDate,
        durum: targetStatus
      };
      setAppointments([...appointments, newApp]);
      setNewAppPortfolioId('');
      setNewAppMusteriId('');
      setNewAppDate('');
      setShowAddAppointmentModal(false);
      showToast(isOwner ? 'Randevunuz doğrudan oluşturuldu.' : 'Randevu talebiniz iletildi.', 'success');
    }
  };

  // Update Appointment Status
  const handleUpdateAppStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED' | 'CANCELLED') => {
    if (!token) {
      if (newStatus === 'REJECTED') {
        setAppointments(appointments.filter(app => app.id !== id));
      } else {
        setAppointments(appointments.map(app => app.id === id ? { ...app, durum: newStatus } : app));
      }
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
      const data = await res.json();
      if (res.ok) {
        showToast(
          data.message || (newStatus === 'APPROVED' ? 'Randevu onaylandı!' : newStatus === 'REJECTED' ? 'Randevu reddedildi.' : 'Randevu talebi iptal edildi.'),
          'success'
        );
        fetchAppointments(token, currentCalendarDate);
      } else {
        showToast(data.message || 'Randevu durumu güncellenirken yetki hatası oluştu.', 'error');
      }
    } catch (err) {
      showToast('Sunucu bağlantı hatası.', 'error');
    }
  };

  const handleAppointmentAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointmentToAction) return;

    if (appActionType === 'VAZGECILDI') {
      await handleUpdateAppStatus(selectedAppointmentToAction.id, 'CANCELLED');
      setShowAppointmentActionModal(false);
      setSelectedAppointmentToAction(null);
      return;
    }

    setAppActionLoading(true);
    try {
      const currentStage = processStages.find((s: any, idx: number) => s.id === selectedStageId || (idx === 0 && !selectedStageId));
      const targetStageId = currentStage?.id || selectedStageId || 1;
      const targetAsamaAdi = currentStage?.asamaAdi || 'Süreç Güncellendi';

      const isCompletedStageSelected = (
        targetStageId === 4 ||
        currentStage?.sira === 3 ||
        (currentStage?.asamaAdi && (currentStage.asamaAdi.toLowerCase().includes('tamamland') || currentStage.asamaAdi.toLowerCase().includes('satıldı')))
      );

      // EVRAK KONTROLÜ: Eğer hedeflenen aşama Satıldı/Kiralandı ise, evrakların tam olup olmadığını kontrol et
      if (isCompletedStageSelected) {
        const process = clientProcesses.find(p => p.randevuId === selectedAppointmentToAction.id || (p.portfoyId === selectedAppointmentToAction.portfoyId && p.musteriId === selectedAppointmentToAction.musteriId));
        if (process && process.evraklarTamamlandi !== true) {
          showToast('Satış/Kiralama işlemini kapatmadan önce lütfen Evrak İşlemleri sayfasından evrak onayını yapınız.', 'error');
          setAppActionLoading(false);
          return;
        }
      }

      // 1. Her durumda randevunun süreç aşamasını backend'e gönder (MusteriSurecleri tablosuna kaydet)
      if (token) {
        await fetch('/api/appointments/update-stage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            appointmentId: selectedAppointmentToAction.id,
            stageId: targetStageId,
            asamaAdi: targetAsamaAdi
          })
        }).catch(err => console.log('Update stage note:', err));

        // UI'ın anında tepki vermesi için optimistik state güncellemesi:
        setClientProcesses(prev => prev.map(p =>
          String(p.randevuId) === String(selectedAppointmentToAction.id)
            ? { ...p, asamaId: targetStageId, asamaAdi: targetAsamaAdi }
            : p
        ));
      }

      // 2. Eğer Ara Aşama (1-5) seçildiyse; portföy kapatma çağırma, sadece aşama güncellemesini bildir
      if (!isCompletedStageSelected) {
        showToast(`Müşteri süreç aşaması '${targetAsamaAdi}' olarak atandı.`, 'success');
        setShowAppointmentActionModal(false);
        setSelectedAppointmentToAction(null);
        setAppActionLoading(false);
        return;
      }

      // 3. Eğer Son Aşama (6 - Tamamlandı / Satıldı - Kiralandı) seçildiyse portföy işlemini kapat
      const portfoyId = selectedAppointmentToAction.portfoyId;
      const aciklamaMetni = `Randevu üzerinden işlem: Katılan Müşteri - ${selectedAppointmentToAction.musteri || ''} (${selectedAppointmentToAction.musteriTelefon || ''}). Talep Eden: ${selectedAppointmentToAction.talepEden || ''}. Randevu: ${selectedAppointmentToAction.tarih} ${selectedAppointmentToAction.zaman}`;

      const res = await fetch(`/api/portfoyler/${portfoyId}/satis-kapat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          islemTuru: appActionType === 'KIRALANDI' ? 'KIRALAMA' : 'SATIS',
          islemBedeli: Number(appActionBedel),
          hizmetBedeliCiro: appActionType === 'KIRALANDI' ? Number(appActionBedel) : Number(appActionBedel) * 0.02,
          islemTarihi: new Date().toISOString().split('T')[0],
          aciklama: aciklamaMetni,
          aliciMusteriId: selectedAppointmentToAction.musteriId || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'İşlem başarıyla tamamlandı ve ciro kaydı işlendi!', 'success');
        setPortfolios(prev => prev.filter(p => p.id !== portfoyId));
        if (token) {
          fetchPortfolios(token);
          fetchCompletedPortfolios(token);
          fetchClients(token);
          fetchAppointments(token, currentCalendarDate);
          fetchClientProcesses(token);
        }
        setShowAppointmentActionModal(false);
        setSelectedAppointmentToAction(null);
      } else {
        showToast(`${data.message || 'Hata:'} ${data.error || ''}`, 'error');
      }
    } catch (err: any) {
      showToast(`Sunucu hatası: ${err?.message || err}`, 'error');
    } finally {
      setAppActionLoading(false);
    }
  };

  // Extract unique options for dependent dropdowns based on existing filters
  const availableIlanTipleri = [...new Set(portfolios.map(p => p.tur).filter(Boolean))].sort();
  const availableTips = [...new Set(portfolios.filter(p => !filterIlanTipi || p.tur === filterIlanTipi).map(p => p.tip).filter(Boolean))].sort();
  const availableOdaSayilari = [...new Set(portfolios.filter(p => (!filterIlanTipi || p.tur === filterIlanTipi) && (!filterTip || p.tip === filterTip)).map(p => p.odaSayisi).filter(Boolean))].sort();
  const availableIller = [...new Set(portfolios.filter(p => (!filterIlanTipi || p.tur === filterIlanTipi) && (!filterTip || p.tip === filterTip) && (!filterOdaSayisi || p.odaSayisi === filterOdaSayisi)).map(p => p.il).filter(Boolean))].sort();
  const availableIlceler = [...new Set(portfolios.filter(p => (!filterIlanTipi || p.tur === filterIlanTipi) && (!filterTip || p.tip === filterTip) && (!filterOdaSayisi || p.odaSayisi === filterOdaSayisi) && (!filterIl || p.il === filterIl)).map(p => p.ilce).filter(Boolean))].sort();

  const handleTogglePortfolioPublish = async (portfolio: any) => {
    if (!token) return;
    if (!isOwnPortfolio(portfolio)) return;

    if (firmaSettings.YetkilendirmeSarti && !portfolio.yetkilendirmeSozlesmesiYapildi) {
      showToast('Yetkilendirme sözleşmesi alınmadığı için bu portföy yayınlanamaz.', 'error');
      return;
    }

    const nextValue = !isPortfolioPublished(portfolio);
    setPublishLoadingPortfolioId(portfolio.id);

    try {
      const res = await fetch(`/api/portfolios/${portfolio.id}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPublished: nextValue })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Yayın durumu güncellenemedi.');

      setPortfolios(prev => prev.map(item => item.id === portfolio.id ? { ...item, isPublished: nextValue } : item));
      setSelectedPortfolio((prev: any) => prev && prev.id === portfolio.id ? { ...prev, isPublished: nextValue } : prev);
      showToast(data.message || 'Portföy yayın durumu güncellendi.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Sunucu hatası.', 'error');
    } finally {
      setPublishLoadingPortfolioId(null);
    }
  };

  // Filter logic for portfolios list
  const filteredPortfolios = portfolios.filter(p => {
    // -1. Tamamlanan portföyleri daima gizle (SATILDI / KIRALANDI)
    const durumUpper = (p.durum || '').toUpperCase();
    if (['SATILDI', 'KIRALANDI', 'KIRALANDI_SATILDI', 'TAMAMLANDI'].includes(durumUpper)) return false;

    const publishedState = isPortfolioPublished(p);
    if (portfolioVisibilityMode === 'published' && !publishedState) return false;
    if (portfolioVisibilityMode === 'unpublished' && publishedState) return false;
    if (portfolioVisibilityMode === 'unpublished' && !isOwnPortfolio(p)) return false;

    // 0. Dependent Filters
    if (filterIlanTipi && p.tur !== filterIlanTipi) return false;
    if (filterTip && p.tip !== filterTip) return false;
    if (filterOdaSayisi && p.odaSayisi !== filterOdaSayisi) return false;
    if (filterIl && p.il !== filterIl) return false;
    if (filterIlce && p.ilce !== filterIlce) return false;

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
            <div className="text-center mt-12 mb-4">
              <span className="text-4xl font-extrabold tracking-widest bg-gradient-to-r from-pastelYellow via-pastelPink to-pastelBlue bg-clip-text text-transparent inline-block">
                HOMEY
              </span>
              <p className="text-zinc-400 text-sm mt-6 leading-relaxed max-w-sm mx-auto">
                Ofisinizi, gayrimenkul danışmanlarınızı, müşteri taleplerinizi ve komisyon paylaşım senaryolarını tek merkezden yönetmenin en modern yolu.
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-4">Üyelik Modellerimiz</span>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-pastelYellow border-none flex items-center justify-center font-bold text-charcoal text-[10px]">
                      ★
                    </div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Deneme</span>
                  </div>
                  <span className="text-sm font-semibold text-white ml-8">4 Danışman</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-pastelBlue border-none flex items-center justify-center font-bold text-charcoal text-[10px]">
                      ★
                    </div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Basic</span>
                  </div>
                  <span className="text-sm font-semibold text-white ml-8">4 Danışman</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-pastelGreen border-none flex items-center justify-center font-bold text-charcoal text-[10px]">
                      ★
                    </div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Premium</span>
                  </div>
                  <span className="text-sm font-semibold text-white ml-8">∞ Danışman</span>
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
                  className={`flex-1 py-2 text-xs font-extrabold rounded-full transition-all border-none ${authMode === 'login' ? 'bg-pastelYellow text-charcoal' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                    }`}
                >
                  Giriş Yap
                </button>
                <button
                  onClick={() => { setAuthMode('register'); setRegError(null); }}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-full transition-all border-none ${authMode === 'register' ? 'bg-pastelYellow text-charcoal' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
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
              {resetToken ? (
                <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-charcoal">Yeni Şifre Belirle</h3>
                  <p className="text-xs text-zinc-500">Lütfen hesabınız için yeni bir şifre girin.</p>
                  
                  {resetPasswordError && (
                    <div className="p-4 rounded-2xl bg-red-100 text-red-950 text-xs font-semibold border-none flex items-center gap-2">
                      <AlertTriangle size={16} />
                      <span>{resetPasswordError}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-1">Yeni Şifre</label>
                    <input
                      type="password"
                      className="w-full text-sm p-3 rounded-2xl bg-zinc-50 border-none focus:outline-none"
                      placeholder="••••••••"
                      value={resetPasswordNew}
                      onChange={e => setResetPasswordNew(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="w-full py-3 bg-emerald-500 text-white font-extrabold rounded-full hover:bg-emerald-600 transition-all border-none mt-2">
                    Şifreyi Güncelle
                  </button>
                  
                  <button type="button" onClick={() => { setResetToken(null); window.history.replaceState({}, document.title, window.location.pathname); }} className="w-full py-3 bg-zinc-100 text-zinc-700 font-extrabold rounded-full hover:bg-zinc-200 transition-all border-none mt-1">
                    Giriş Ekranına Dön
                  </button>
                </form>
              ) : authMode === 'login' ? (
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-charcoal">Hesabınıza Giriş Yapın</h3>

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
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-zinc-500 block">Şifre</label>
                      <button 
                        type="button" 
                        onClick={handleForgotPassword} 
                        disabled={isForgotPasswordLoading}
                        className="text-[10px] font-extrabold text-charcoal hover:underline bg-transparent border-none p-0 cursor-pointer disabled:opacity-50"
                      >
                        {isForgotPasswordLoading ? 'Gönderiliyor...' : 'Şifremi unuttum'}
                      </button>
                    </div>
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

                  <div className="flex items-center gap-2 my-1">
                    <div className="h-px bg-zinc-200 flex-1"></div>
                    <span className="text-[10px] font-bold text-zinc-400">VEYA</span>
                    <div className="h-px bg-zinc-200 flex-1"></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => loginWithGoogle()}
                    className="w-full py-3 bg-white text-charcoal border-2 border-zinc-200 font-extrabold rounded-full hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google ile Giriş Yap
                  </button>
                </form>
              ) : (
                /* Registration Form */
                <form onSubmit={handleRegisterBroker} className="flex flex-col gap-3 overflow-y-auto max-h-[420px] pr-2">
                  <h3 className="text-lg sm:text-xl font-extrabold text-charcoal">Yeni Firma ve Yetkili Kaydı</h3>

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

                  <div className="mt-2 mb-1 p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex flex-col gap-2">
                    <p className="text-[10px] font-bold text-zinc-500 text-center">Yetkili Bilgilerini Manuel veya Google ile Doldurun</p>
                    <button
                      type="button"
                      onClick={() => fillWithGoogle()}
                      className="w-full py-2 bg-white text-charcoal border border-zinc-200 font-bold text-xs rounded-lg hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google ile Bilgileri Çek
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-0.5">Yetkili Adı</label>
                      <input type="text" className="w-full text-xs p-2 rounded-xl bg-zinc-50 border-none focus:outline-none" placeholder="Ad" value={regAd} onChange={e => setRegAd(e.target.value)} required />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-0.5">Soyadı</label>
                      <input type="text" className="w-full text-xs p-2 rounded-xl bg-zinc-50 border-none focus:outline-none" placeholder="Soyad" value={regSoyad} onChange={e => setRegSoyad(e.target.value)} required />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-0.5">E-posta</label>
                    <input type="email" className="w-full text-xs p-2 rounded-xl bg-zinc-50 border-none focus:outline-none" placeholder="yetkili@ofis.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
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
                          className={`flex-1 py-1 text-[10px] font-extrabold rounded-lg transition-all border-none ${regAbonelikTipi === 'AYLIK' ? 'bg-white text-charcoal shadow-sm' : 'text-zinc-400 bg-transparent'
                            }`}
                        >
                          Aylık Ödeme
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegAbonelikTipi('YILLIK')}
                          className={`flex-1 py-1 text-[10px] font-extrabold rounded-lg transition-all border-none ${regAbonelikTipi === 'YILLIK' ? 'bg-white text-charcoal shadow-sm' : 'text-zinc-400 bg-transparent'
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
                        className={`p-2 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${regPaketTipi === 'DENEME' ? 'border-charcoal bg-pastelYellow' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100'
                          }`}
                      >
                        <span className="text-[10px] font-extrabold block">Deneme</span>
                        <span className="text-[9px] text-zinc-600 block mt-0.5">30 Gün Ücretsiz</span>
                        <span className="text-[8px] font-bold text-zinc-500 mt-1 block">4 Danışman</span>
                      </div>

                      <div
                        onClick={() => setRegPaketTipi('BASIC')}
                        className={`p-2 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${regPaketTipi === 'BASIC' ? 'border-charcoal bg-pastelBlue' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100'
                          }`}
                      >
                        <span className="text-[10px] font-extrabold block">Basic</span>
                        <span className="text-[9px] text-zinc-600 block mt-0.5">Standart Paket</span>
                        <span className="text-[8px] font-bold text-zinc-500 mt-1 block">4 Danışman</span>
                      </div>

                      <div
                        onClick={() => setRegPaketTipi('PREMIUM')}
                        className={`p-2 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${regPaketTipi === 'PREMIUM' ? 'border-charcoal bg-pastelGreen' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100'
                          }`}
                      >
                        <span className="text-[10px] font-extrabold block">Premium</span>
                        <span className="text-[9px] text-zinc-600 block mt-0.5">Tam Sınırsız</span>
                        <span className="text-[8px] font-bold text-zinc-500 mt-1 block">∞ Danışman</span>
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
          <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal mb-2 flex items-center gap-2">
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
    <div className="relative min-h-screen bg-cream text-charcoal flex font-sans overflow-x-hidden">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-semibold transition-all animate-bounce-in border-none ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}>
          {toast.type === 'success'
            ? <Check size={16} className="shrink-0" />
            : <AlertTriangle size={16} className="shrink-0" />
          }
          {toast.message}
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`bg-sidebar text-slate-100 flex flex-col justify-start transition-all duration-300 ease-in-out z-40 border-r-4 border-sidebar shrink-0 ${sidebarCollapsed ? 'w-20 px-3 py-6 items-center' : 'w-64 p-6'
        }`}>
        <div className="flex flex-col gap-8 w-full">
          {/* Logo / Header */}
          <div className={`flex items-center transition-all duration-300 ${sidebarCollapsed ? 'justify-center w-full' : 'justify-between'}`}>
            {!sidebarCollapsed ? (
              <div className="flex items-center justify-between w-full relative flex-wrap gap-3">
                {/* Left spacer matching right button width to guarantee exact 100% centering */}
                <div className="w-10 h-10 shrink-0" />

                {/* Centered HOMEY Logo Text & Firm Badge */}
                <div 
                  className="flex flex-col items-center justify-center text-center leading-tight transition-all duration-300 flex-1 min-w-0 cursor-pointer hover:opacity-80"
                  onClick={() => setActiveTab('dashboard')}
                  title="Anasayfaya Dön"
                >
                  <span className="text-xl sm:text-2xl font-extrabold tracking-wider bg-gradient-to-r from-pastelYellow via-pastelPink to-pastelBlue bg-clip-text text-transparent leading-none">
                    HOMEY
                  </span>
                  {user?.firmaAdi && (
                    <span className="text-[10px] font-extrabold text-amber-300/80 uppercase tracking-widest truncate max-w-[140px] mt-0.5" title={user.firmaAdi}>
                      {user.firmaAdi}
                    </span>
                  )}
                </div>

                {/* Right Hamburger Menu Button */}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="w-10 h-10 rounded-xl hover:bg-zinc-800 transition-all duration-300 hover:rotate-90 text-white flex items-center justify-center border-none cursor-pointer active:scale-90 shrink-0"
                  title="Menüyü Daralt"
                >
                  <Menu size={20} />
                </button>
              </div>
            ) : (
              /* Collapsed State: HOMEY Gradient Animated Circle Ring around 3 Lines (Menu Icon) */
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="relative group p-0.5 rounded-full bg-gradient-to-r from-pastelYellow via-pastelPink to-pastelBlue shadow-lg hover:scale-115 active:scale-95 transition-all duration-300 border-none cursor-pointer animate-in fade-in zoom-in-90"
                title="Menüyü Genişlet (HOMEY)"
              >
                {/* Glowing Aura Ring */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pastelYellow via-pastelPink to-pastelBlue rounded-full blur-xs opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse"></div>

                {/* Inner Circle Container holding the 3 Lines (Menu Icon) */}
                <div className="relative w-10 h-10 bg-zinc-950 rounded-full flex items-center justify-center text-white border border-zinc-800 transition-transform duration-300">
                  <Menu size={18} className="text-white group-hover:rotate-180 transition-transform duration-500 ease-out" />
                </div>
              </button>
            )}
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
                title="Portföy Yönetimi"
                className={`sidebar-link ${activeTab === 'portfolios' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Building size={20} className="shrink-0" />
                {!sidebarCollapsed && <span>Portföy Yönetimi</span>}
              </button>
              <button
                onClick={() => {
                  setActiveTab('completedPortfolios');
                  fetchCompletedPortfolios();
                }}
                title="Tamamlanan İşlemler"
                className={`sidebar-link ${activeTab === 'completedPortfolios' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <BadgeCheck size={20} className="shrink-0" />
                {!sidebarCollapsed && <span>Tamamlanan İşlemler</span>}
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
                onClick={() => setActiveTab('processManagement')}
                title="Süreç Yönetimi"
                className={`sidebar-link ${activeTab === 'processManagement' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <GitPullRequest size={20} className="shrink-0" />
                {!sidebarCollapsed && <span>Süreç Yönetimi</span>}
              </button>
              <button
                onClick={() => setActiveTab('clients')}
                title="Müşterilerim"
                className={`sidebar-link ${activeTab === 'clients' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <User size={20} className="shrink-0" />
                {!sidebarCollapsed && <span>Müşterilerim</span>}
              </button>
              <button
                onClick={() => setActiveTab('documentOperations')}
                title="Evrak İşlemleri"
                className={`sidebar-link ${activeTab === 'documentOperations' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Layers size={20} className="shrink-0" />
                {!sidebarCollapsed && <span>Evrak İşlemleri</span>}
              </button>
              <button
                onClick={() => setActiveTab('calculator')}
                title="Komisyon Payı Hesap Makinesi"
                className={`sidebar-link ${activeTab === 'calculator' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Calculator size={20} className="shrink-0" />
                {!sidebarCollapsed && <span>Hesap Makinesi</span>}
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
                  title="Ciro & Performans"
                  className={`sidebar-link ${activeTab === 'analytics' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <TrendingUp size={20} className="shrink-0" />
                  {!sidebarCollapsed && <span>Ciro & Performans</span>}
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  title="Ekip Yönetimi"
                  className={`sidebar-link ${activeTab === 'team' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Users size={20} className="shrink-0" />
                  {!sidebarCollapsed && <span>Ekip Yönetimi</span>}
                </button>
                <button
                  onClick={() => setActiveTab('subscription')}
                  title="Lisans & Abonelik"
                  className={`sidebar-link ${activeTab === 'subscription' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Shield size={20} className="shrink-0" />
                  {!sidebarCollapsed && <span>Lisans & Abonelik</span>}
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  title="Komisyon Ayarları"
                  className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Percent size={20} className="shrink-0" />
                  {!sidebarCollapsed && <span>Komisyon Ayarları</span>}
                </button>
                <button
                  onClick={() => setActiveTab('firmDocuments')}
                  title="Firma Evrakları"
                  className={`sidebar-link ${activeTab === 'firmDocuments' ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <FileText size={20} className="shrink-0" />
                  {!sidebarCollapsed && <span>Firma Evrakları</span>}
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar Footer / User info & Logout */}
        <div className="flex flex-col gap-4 w-full mt-12">
          <div className={`border-t border-zinc-800 pt-4 flex gap-2 ${sidebarCollapsed ? 'justify-center' : 'items-center'} relative`}>
            <div className="relative">
              <div
                className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xl shrink-0 cursor-pointer overflow-hidden border border-transparent hover:border-indigo-400 transition-colors shadow-sm"
                title={`${user?.ad || ''} ${user?.soyad || ''}`}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                {user?.profilFoto ? (
                  <img src={user.profilFoto} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <>{user?.ad ? user.ad[0] : 'C'}{user?.soyad ? user.soyad[0] : 'Y'}</>
                )}
              </div>

              {showProfileMenu && (
                <div className="absolute bottom-20 left-0 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl p-1 z-50 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowAccountSettingsModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white rounded-lg cursor-pointer transition-colors text-left border-none bg-transparent"
                  >
                    <Settings size={14} /> Hesap Ayarları
                  </button>
                  <label className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white rounded-lg cursor-pointer transition-colors mt-1 border-t border-zinc-700 pt-2">
                    <UploadCloud size={14} /> Fotoğraf Değiştir
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      setShowProfileMenu(false);
                      handleUploadProfileImage(e);
                    }} />
                  </label>
                  {user?.profilFoto && (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleDeleteProfileImage();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors text-left border-none bg-transparent"
                    >
                      <Trash2 size={14} /> Fotoğrafı Kaldır
                    </button>
                  )}
                </div>
              )}
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

      {/* Account Settings Modal */}
      {showAccountSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 md:p-6 max-w-2xl w-full relative border-none shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-1">
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Kullanıcı İşlemleri</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal mt-0.5">Hesap Ayarları</h2>
              </div>
              <button
                onClick={() => setShowAccountSettingsModal(false)}
                className="p-1.5 border border-charcoal rounded-full hover:bg-zinc-100 text-charcoal cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Sol Sütun: Şifre Değiştir */}
              <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50 shadow-inner h-fit">
                <h4 className="font-bold text-charcoal mb-3 flex items-center gap-2 text-sm"><Lock size={14} /> Şifre Değiştir</h4>
                <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 block mb-1">Mevcut Şifre</label>
                    <input type="password" required className="w-full text-xs p-2.5 border-2 border-zinc-200 rounded-xl focus:border-emerald-500 focus:outline-none bg-white" placeholder="••••••••" value={passwordForm.eskiSifre} onChange={e => setPasswordForm({ ...passwordForm, eskiSifre: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 block mb-1">Yeni Şifre</label>
                    <input type="password" required className="w-full text-xs p-2.5 border-2 border-zinc-200 rounded-xl focus:border-emerald-500 focus:outline-none bg-white" placeholder="••••••••" value={passwordForm.yeniSifre} onChange={e => setPasswordForm({ ...passwordForm, yeniSifre: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 block mb-1">Yeni Şifre (Tekrar)</label>
                    <input type="password" required className="w-full text-xs p-2.5 border-2 border-zinc-200 rounded-xl focus:border-emerald-500 focus:outline-none bg-white mb-1" placeholder="••••••••" value={passwordForm.yeniSifreTekrar} onChange={e => setPasswordForm({ ...passwordForm, yeniSifreTekrar: e.target.value })} />
                  </div>
                  <button type="submit" disabled={isChangingPassword} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 mt-1">
                    {isChangingPassword ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
                  </button>
                </form>
              </div>

              {/* Sağ Sütun: Tercihler */}
              <div className="flex flex-col gap-5">
                <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50 shadow-inner">
                  <h4 className="font-bold text-charcoal mb-3 flex items-center gap-2 text-sm"><Monitor size={14} /> Görüntüleme Tercihi</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${themePreference === 'light' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'}`}
                    >
                      <Sun size={18} />
                      <span className="text-[10px] font-bold">Açık Tema</span>
                    </button>
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${themePreference === 'dark' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'}`}
                    >
                      <Moon size={18} />
                      <span className="text-[10px] font-bold">Koyu Tema</span>
                    </button>
                  </div>
                </div>

                <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50 shadow-inner">
                  <h4 className="font-bold text-charcoal mb-3 flex items-center gap-2 text-sm"><MapIcon size={14} /> Harita Sağlayıcısı</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleMapProviderChange('google')}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${mapProvider === 'google' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'}`}
                    >
                      <MapIcon size={18} />
                      <span className="text-[10px] font-bold text-center">Google Haritalar</span>
                    </button>
                    <button
                      onClick={() => handleMapProviderChange('leaflet')}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${mapProvider === 'leaflet' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'}`}
                    >
                      <MapIcon size={18} />
                      <span className="text-[10px] font-bold text-center">Leaflet (OSM)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden flex flex-col gap-6 min-w-0">

        {/* Global Top Header Bar with Autocomplete */}
        <header className="flex flex-wrap justify-between items-center w-full gap-3 sm:gap-4 mb-8 sm:mb-10">
          {activeTab === 'dashboard' && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-charcoal leading-tight flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-3 flex-wrap">
                      <span className="whitespace-nowrap">İyi günler, {user?.ad || ''} </span>
                      {/* Notification Bell Inline next to Welcome text */}
                      <div className="relative inline-flex items-center">
                        {(() => {
                          const now = new Date();
                          const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

                          // Giriş yapan kullanıcının taraf olduğu tüm randevular (Teklif Eden veya Portföy Sahibi Uzman)
                          const userApps = appointments.filter(a => compareIds(a.portfoySahibiId, user?.id) || compareIds(a.talepEdenId, user?.id));

                          // 1. Onay Bekleyen Talepler
                          const pendingApps = userApps.filter(a => a.durum === 'PENDING');

                          // 2. 1 Günde Az Kalmış / Aynı Gün Olan Yaklaşan Onaylı Randevular
                          const upcomingApps = userApps.filter(a => {
                            if (a.durum === 'CANCELLED' || a.durum === 'REJECTED') return false;
                            const appDate = a.randevuZamani ? new Date(a.randevuZamani) : null;
                            if (!appDate || isNaN(appDate.getTime())) return false;
                            // Tarih geçmiş değil ve 24 saatten az kalmış veya bugün ise
                            return appDate >= now && appDate <= oneDayLater;
                          });

                          const totalNotifCount = pendingApps.length + upcomingApps.length;

                          return (
                            <>
                              <button
                                type="button"
                                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                                className="relative p-2 rounded-2xl bg-white border-2 border-charcoal text-charcoal hover:bg-cream transition-all cursor-pointer flex items-center justify-center shadow-xs"
                                title="Bildirimler"
                              >
                                <Bell size={18} className="text-charcoal" />
                                {totalNotifCount > 0 && (
                                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center border border-white animate-pulse">
                                    {totalNotifCount}
                                  </span>
                                )}
                              </button>

                              {/* Dropdown Panel */}
                              {showNotificationsDropdown && (
                                <div className="absolute top-full mt-2 left-0 sm:right-0 sm:left-auto w-72 sm:w-80 bg-white border-2 border-charcoal rounded-3xl shadow-2xl z-[100] p-4 animate-in fade-in zoom-in-95 font-normal text-left">
                                  <div className="flex justify-between items-center border-b border-zinc-100 pb-2 mb-3 flex-wrap gap-3">
                                    <h4 className="font-extrabold text-sm text-charcoal flex items-center gap-1.5">
                                      <Bell size={16} /> Bildirimler & Yaklaşan Randevular
                                    </h4>
                                    <button
                                      onClick={() => setShowNotificationsDropdown(false)}
                                      className="text-zinc-400 hover:text-zinc-700 text-xs font-bold"
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto custom-scrollbar">
                                    {/* Section 1: Yaklaşan Randevular (1 gün veya daha az kalan) */}
                                    {upcomingApps.map(app => (
                                      <div
                                        key={`notif-up-${app.id}`}
                                        onClick={() => { setActiveTab('appointments'); setShowNotificationsDropdown(false); }}
                                        className="p-2.5 bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-200 rounded-2xl cursor-pointer transition-colors text-xs"
                                      >
                                        <div className="flex justify-between items-start font-bold text-charcoal mb-0.5">
                                          <span>⏰ Yaklaşan Randevu!</span>
                                          <span className="text-[10px] font-extrabold text-emerald-950 bg-emerald-200 px-1.5 py-0.2 rounded-full">
                                            {app.tarih}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-zinc-700 font-semibold">
                                          {app.portfoyTip} ({app.ilce || 'Lokasyon'}) — Müşteri: {app.musteri}
                                        </p>
                                        <span className="text-[10px] text-zinc-500 block mt-0.5 font-bold">Saat: {app.zaman}</span>
                                      </div>
                                    ))}

                                    {/* Section 2: Onay Bekleyen Talepler */}
                                    {pendingApps.map(app => (
                                      <div
                                        key={`notif-pen-${app.id}`}
                                        onClick={() => { setActiveTab('appointments'); setShowNotificationsDropdown(false); }}
                                        className="p-2.5 bg-amber-50/90 hover:bg-amber-100/90 border border-amber-200 rounded-2xl cursor-pointer transition-colors text-xs"
                                      >
                                        <div className="flex justify-between items-start font-bold text-charcoal mb-0.5">
                                          <span>📩 {app.portfoyTip} ({app.ilce || 'Lokasyon'})</span>
                                          <span className="text-[10px] text-amber-900 dark:text-amber-100 bg-amber-200 dark:bg-amber-800/80 px-1.5 py-0.2 rounded-full">Onay Bekliyor</span>
                                        </div>
                                        <p className="text-[11px] text-zinc-600">
                                          Müşteri: {app.musteri} · Tarih: {app.tarih} ({app.zaman})
                                        </p>
                                      </div>
                                    ))}

                                    {upcomingApps.length === 0 && pendingApps.length === 0 && (
                                      <div className="py-6 text-center text-zinc-400 text-xs">
                                        Yaklaşan randevunuz veya bekleyen yeni bildiriminiz bulunmuyor.
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => { setActiveTab('appointments'); setShowNotificationsDropdown(false); }}
                                    className="w-full mt-3 text-center text-xs font-extrabold text-indigo-900 hover:underline pt-2 border-t border-zinc-100 block"
                                  >
                                    Tüm Randevuları Gör →
                                  </button>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </span>
                    {user?.firmaAdi && (
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full truncate max-w-[200px]" title={user.firmaAdi}>
                        {user.firmaAdi}
                      </span>
                    )}
                  </h1>

                  {(() => {
                    const userApps = appointments.filter(a => compareIds(a.portfoySahibiId, user?.id) || compareIds(a.talepEdenId, user?.id));
                    const pendingCount = userApps.filter(a => a.durum === 'PENDING').length;
                    return (
                      <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">
                        Bugün <strong className="text-amber-700">{pendingCount} yanıt bekleyen talebiniz</strong> bulunuyor.
                      </p>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}



          {/* Global Smart Search with Autocomplete (Narrowed Width) */}
          <div
            ref={searchContainerRef}
            className={`relative w-full min-w-0 ${activeTab === 'dashboard' ? 'sm:w-56 md:w-72' : ''}`}
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
                                <div className="w-8 h-8 rounded-xl bg-pastelYellow flex items-center justify-center shrink-0">
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
                                <div className="w-8 h-8 rounded-xl bg-pastelBlue flex items-center justify-center shrink-0">
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
                                <div className="w-8 h-8 rounded-xl bg-pastelGreen flex items-center justify-center shrink-0">
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
                                <div className="w-8 h-8 rounded-xl bg-pastelPurple flex items-center justify-center shrink-0">
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
          <div className="bg-pastelYellow border-2 border-charcoal text-charcoal px-6 py-4 rounded-3xl flex justify-between items-center shadow-none flex-wrap gap-3">
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
                    <strong className="font-extrabold text-sm block mb-0.5 text-slate-900">Gelecek Paket Değişimi Planlandı!</strong>
                    Mevcut paketiniz sona erdiğinde ({new Date(subInfo.mevcutPaket.bitisTarihi).toLocaleDateString('tr-TR')}), hesabınız otomatik olarak <strong>{subInfo.gelecekPaket?.paketAdi} ({subInfo.gelecekPaket?.periyot === 'Yillik' ? 'Yıllık' : 'Aylık'})</strong> paketine yükseltilecektir.
                  </span>
                )}
              </div>
            </div>
            {user?.rol === 'YETKILI' && (
              <button
                onClick={() => setActiveTab('subscription')}
                className="px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-extrabold hover:bg-black transition-colors shrink-0 border-none ml-4 cursor-pointer"
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

              {/* Card 1: Active Listings (Pastel Yellow - Interactive Bar Chart) */}
              <div className="bento-card bg-pastelYellow flex flex-col justify-between relative overflow-visible">
                <div>
                  <div className="flex justify-between items-center mb-3 gap-1.5 flex-wrap">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Aktif Portföyler</h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex bg-slate-900/10 p-0.5 rounded-lg text-[10px] font-bold">
                        <button
                          onClick={() => { setPortfoyTimeframe('HAFTALIK'); setHoveredPortfoyIndex(null); }}
                          className={`px-1.5 py-0.5 rounded-md transition-all border-none cursor-pointer font-bold ${portfoyTimeframe === 'HAFTALIK' ? 'bg-slate-900 text-[#FFFFFF] shadow-xs' : 'text-slate-900/70 hover:text-slate-900'}`}
                          title="Haftalık Görünüm"
                        >
                          H
                        </button>
                        <button
                          onClick={() => { setPortfoyTimeframe('AYLIK'); setHoveredPortfoyIndex(null); }}
                          className={`px-1.5 py-0.5 rounded-md transition-all border-none cursor-pointer font-bold ${portfoyTimeframe === 'AYLIK' ? 'bg-slate-900 text-[#FFFFFF] shadow-xs' : 'text-slate-900/70 hover:text-slate-900'}`}
                          title="Aylık Görünüm"
                        >
                          A
                        </button>
                      </div>
                      <Building size={18} className="text-slate-900 shrink-0" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between h-9 mb-2 gap-1.5 flex-wrap">
                    <div className="flex items-baseline gap-1.5 shrink-0">
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">
                        {hoveredPortfoyIndex !== null
                          ? portfoyChartData[portfoyTimeframe][hoveredPortfoyIndex].val
                          : portfolios.length}
                      </span>
                      {hoveredPortfoyIndex !== null ? (
                        <span className="text-[11px] font-bold text-emerald-950 bg-emerald-300/90 px-2 py-0.5 rounded-full border border-emerald-400 font-mono whitespace-nowrap">
                          {portfoyChartData[portfoyTimeframe][hoveredPortfoyIndex].label}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-900/60">
                          Toplam
                        </span>
                      )}
                    </div>

                    <div className="h-7 flex items-center shrink-0">
                      {hoveredPortfoyIndex !== null ? (
                        <div className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-900/90 bg-slate-900/10 px-2 py-0.5 rounded-lg border border-slate-900/15 flex items-center gap-1">
                          <span>Sat: <strong className="text-emerald-900 font-extrabold">{portfoyChartData[portfoyTimeframe][hoveredPortfoyIndex].satilik}</strong></span>
                          <span className="text-slate-900/30">|</span>
                          <span>Kir: <strong className="text-indigo-900 font-extrabold">{portfoyChartData[portfoyTimeframe][hoveredPortfoyIndex].kiralik}</strong></span>
                        </div>
                      ) : (
                        <span className="text-[9px] sm:text-[10px] font-mono font-semibold text-slate-900/50 bg-slate-900/5 px-1.5 py-0.5 rounded-lg">
                          Detay için üzerine gelin
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Interactive Bar Chart Container with Side Scroll Arrows */}
                <div className="pt-2 relative flex items-center gap-1">
                  <button
                    onClick={() => scrollPortfoyChart('left')}
                    className="p-1 rounded-full bg-slate-900/15 hover:bg-slate-900 text-slate-900 hover:text-white transition-colors border-none cursor-pointer z-10 shrink-0 shadow-xs"
                    title="Sola Kaydır"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <div
                    ref={portfoyBarContainerRef}
                    className="flex-1 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-2"
                  >
                    <div className={`flex justify-between items-end gap-3 h-20 relative ${portfoyTimeframe === 'AYLIK' ? 'min-w-[580px]' : 'w-full min-w-[320px]'}`}>
                      {portfoyChartData[portfoyTimeframe].map((item, idx) => {
                        const isHovered = hoveredPortfoyIndex === idx;
                        return (
                          <div
                            key={`port-bar-${idx}`}
                            className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer px-0.5"
                            onClick={() => setHoveredPortfoyIndex(prev => prev === idx ? null : idx)}
                          >
                            {/* Interactive Bar */}
                            <div
                              className={`w-full ${portfoyTimeframe === 'HAFTALIK' ? 'max-w-[56px] md:max-w-[64px]' : 'max-w-[44px]'} rounded-t-xl transition-all duration-200 ${isHovered ? 'bg-black scale-y-105 shadow-lg' : 'bg-slate-900/90 hover:bg-black'
                                }`}
                              style={{ height: `${Math.max(item.pct, 15)}%` }}
                            />

                            <span className={`text-[10px] font-mono font-bold mt-1.5 transition-colors ${isHovered ? 'text-black font-extrabold scale-110' : 'text-slate-900/70'}`}>
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => scrollPortfoyChart('right')}
                    className="p-1 rounded-full bg-slate-900/15 hover:bg-slate-900 text-slate-900 hover:text-white transition-colors border-none cursor-pointer z-10 shrink-0 shadow-xs"
                    title="Sağa Kaydır"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 2: Sales & Revenue summary (Pastel Pink - Interactive Line Chart) */}
              <div className="bento-card bg-pastelPink flex flex-col justify-between relative overflow-visible">
                <div>
                  <div className="flex justify-between items-center mb-3 gap-1.5 flex-wrap">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Aylık Ciro</h4>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="flex bg-slate-900/10 p-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold">
                        <button
                          onClick={() => { setCiroTimeframe('6A_1'); setHoveredCiroIndex(null); }}
                          className={`px-1.5 py-0.5 rounded-md transition-all border-none cursor-pointer ${ciroTimeframe === '6A_1' ? 'bg-slate-900 text-[#FFFFFF] shadow-xs' : 'text-slate-900/70 hover:text-slate-900'}`}
                          title="1. Altı Ay (Oca - Haz)"
                        >
                          1. Yarı
                        </button>
                        <button
                          onClick={() => { setCiroTimeframe('6A_2'); setHoveredCiroIndex(null); }}
                          className={`px-1.5 py-0.5 rounded-md transition-all border-none cursor-pointer ${ciroTimeframe === '6A_2' ? 'bg-slate-900 text-[#FFFFFF] shadow-xs' : 'text-slate-900/70 hover:text-slate-900'}`}
                          title="2. Altı Ay (Tem - Ara)"
                        >
                          2. Yarı
                        </button>
                        <button
                          onClick={() => { setCiroTimeframe('1Y'); setHoveredCiroIndex(null); }}
                          className={`px-1.5 py-0.5 rounded-md transition-all border-none cursor-pointer ${ciroTimeframe === '1Y' ? 'bg-slate-900 text-[#FFFFFF] shadow-xs' : 'text-slate-900/70 hover:text-slate-900'}`}
                          title="Tüm Yıl (Oca - Ara)"
                        >
                          1 Yıl
                        </button>
                      </div>
                      <DollarSign size={18} className="text-slate-900 shrink-0" />
                    </div>
                  </div>

                  {(() => {
                    const currentDataList = ciroChartData[ciroTimeframe];
                    let activePoint = null;
                    if (hoveredCiroIndex !== null && currentDataList[hoveredCiroIndex]) {
                      activePoint = currentDataList[hoveredCiroIndex];
                    } else {
                      // Hover yapılmadığında her zaman bu ayın bireysel cirosunu göster
                      const currentMonthIndex = new Date().getMonth();
                      activePoint = {
                        ciro: ciroChartData['1Y'][currentMonthIndex].ciro,
                        label: ciroChartData['1Y'][currentMonthIndex].label
                      };
                    }
                    const displayCiro = activePoint.ciro;
                    const officeShare = displayCiro * (commSettings.aOfis / 100);
                    const userEarned = displayCiro * (commSettings.aDanisman / 100);

                    return (
                      <>
                        <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            {displayCiro.toLocaleString('tr-TR')} TL
                          </span>
                          {hoveredCiroIndex !== null && activePoint && (
                            <span className="text-[10px] font-mono font-extrabold bg-slate-900 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                              {activePoint.label}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-900/80 mb-2 flex justify-between items-center flex-wrap gap-x-2 gap-y-0.5">
                          <span>Net Hakediş: <strong className="text-emerald-950 font-extrabold">{userEarned.toLocaleString('tr-TR')} TL</strong></span>
                          <span className="text-[11px] text-slate-900/70">Ofis Payı: {officeShare.toLocaleString('tr-TR')} TL</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Interactive SVG Line Chart */}
                <div className="pt-2 relative">
                  {(() => {
                    const data = ciroChartData[ciroTimeframe];
                    const step = 100 / (data.length - 1);
                    const pts = data.map((d, i) => ({ x: i * step, y: d.y }));

                    // Build smooth cubic Bezier curve
                    let linePath = `M ${pts[0].x},${pts[0].y}`;
                    for (let i = 0; i < pts.length - 1; i++) {
                      const curr = pts[i];
                      const next = pts[i + 1];
                      const cp1x = curr.x + (next.x - curr.x) / 2;
                      const cp1y = curr.y;
                      const cp2x = curr.x + (next.x - curr.x) / 2;
                      const cp2y = next.y;
                      linePath += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
                    }
                    const areaPath = `${linePath} L 100,30 L 0,30 Z`;

                    const handleChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      if (rect.width <= 0) return;
                      const mouseX = e.clientX - rect.left;
                      const pct = mouseX / rect.width;
                      let closestIdx = Math.round(pct * (data.length - 1));
                      if (closestIdx < 0) closestIdx = 0;
                      if (closestIdx >= data.length) closestIdx = data.length - 1;
                      setHoveredCiroIndex(closestIdx);
                    };

                    return (
                      <div className="relative w-full h-12">
                        <svg
                          className="absolute inset-0 w-full h-full cursor-pointer overflow-visible"
                          viewBox="0 0 100 30"
                          preserveAspectRatio="none"
                          onClick={handleChartClick}
                        >
                          <defs>
                            <linearGradient id="ciroGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#111111" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#111111" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          <path d={areaPath} fill="url(#ciroGrad)" />
                          <path d={linePath} fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>

                        {/* Absolutely positioned HTML dots overlaid on top */}
                        {data.map((d, i) => {
                          const isHovered = hoveredCiroIndex === i;
                          const cx = i * step; // percentage 0-100
                          const cy = (d.y / 30) * 100; // percentage 0-100
                          
                          return (
                            <div
                              key={`ciro-pt-${i}`}
                              className="absolute w-6 h-6 -ml-3 -mt-3 flex items-center justify-center cursor-pointer z-10"
                              style={{ left: `${cx}%`, top: `${cy}%` }}
                              onClick={() => setHoveredCiroIndex(prev => prev === i ? null : i)}
                            >
                              <div
                                className="rounded-full transition-all duration-150"
                                style={{
                                  width: isHovered ? '12px' : '10px',
                                  height: isHovered ? '12px' : '10px',
                                  backgroundColor: isHovered ? '#059669' : '#111111',
                                  border: isHovered ? '2px solid #FFFFFF' : '2px solid #111111',
                                  boxShadow: isHovered ? '0 0 4px rgba(0,0,0,0.3)' : 'none'
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Axis Month Labels */}
                  <div className="flex justify-between items-center text-[8px] sm:text-[9px] font-bold text-slate-900/60 mt-1 overflow-hidden flex-wrap gap-3">
                    {ciroChartData[ciroTimeframe].map((item, idx) => {
                      // Shorten label to 3 letters (e.g., 'Ocak' -> 'Oca') or 1 letter for 1Y if tight
                      const shortLabel = item.label.length > 3 ? item.label.substring(0, 3) : item.label;
                      return (
                        <span
                          key={`lbl-${idx}`}
                          className={`cursor-pointer transition-colors whitespace-nowrap text-center ${hoveredCiroIndex === idx ? 'text-black font-extrabold underline' : ''}`}
                          onClick={() => setHoveredCiroIndex(prev => prev === idx ? null : idx)}
                        >
                          {shortLabel}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card 3: Upcoming Showings (Pastel Purple) */}
              <div
                className="bento-card bg-pastelPurple cursor-pointer hover:bg-pastelPurple/90 transition-colors flex flex-col justify-between"
                onClick={() => setActiveTab('appointments')}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-extrabold text-slate-900">Randevularım & Talepler</h4>
                    <Calendar size={20} className="text-slate-900" />
                  </div>
                  {(() => {
                    const userApps = appointments.filter(a => compareIds(a.portfoySahibiId, user?.id) || compareIds(a.talepEdenId, user?.id));
                    const approvedApps = userApps.filter(a => a.durum === 'APPROVED');
                    const pendingApps = userApps.filter(a => a.durum === 'PENDING');
                    return (
                      <>
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-3xl font-extrabold text-slate-900">
                            {approvedApps.length}
                          </span>
                          <span
                            className="w-7 h-7 inline-flex items-center justify-center text-xs font-extrabold text-amber-950 bg-pastelYellow rounded-full border border-amber-300 dark:border-amber-800 cursor-default"
                            title={`${pendingApps.length} Bekleyen Randevu`}
                          >
                            {pendingApps.length}
                          </span>
                        </div>
                        <div className="text-xs text-slate-900/80 flex flex-col gap-2">
                          {userApps.slice(0, 3).map(app => {
                            const isIncoming = compareIds(app.portfoySahibiId, user?.id);
                            return (
                              <div key={`dash-app-${app.id}`} className="flex items-center justify-between gap-1 flex-wrap">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${app.durum === 'APPROVED' ? 'bg-emerald-600' : app.durum === 'PENDING' ? 'bg-amber-600' : 'bg-red-500'
                                    }`}></span>
                                  <span className="truncate font-semibold text-[11px]">
                                    {app.zaman} · {app.portfoyTip} ({app.ilce || 'Lokasyon'})
                                  </span>
                                </div>
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shrink-0 border ${isIncoming ? 'bg-indigo-100 text-indigo-950 border-indigo-300' : 'bg-amber-100 text-amber-950 border-amber-300'
                                  }`}>
                                  {isIncoming ? '📥 Gelen' : '📤 Giden'}
                                </span>
                              </div>
                            );
                          })}
                          {userApps.length === 0 && (
                            <span className="text-zinc-500 text-xs italic">Aktif randevu veya talebiniz bulunmuyor.</span>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
                <span className="text-[10px] font-extrabold text-indigo-900 mt-2 block underline">Randevular Yönetimine Git →</span>
              </div>

            </div>

            {/* Middle Section: Top Real Estate Agents (YETKILI only) */}
            {user?.rol === 'YETKILI' && (
              <div className="bento-card bg-white">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <Users stroke="var(--primary)" /> Danışman Durumları & Ciro Performansı
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {employees.length > 0 ? (
                    employees.map(emp => (
                      <div
                        key={emp.id}
                        onClick={() => { setSelectedEmployee(emp); setActiveTab('team'); }}
                        className="rounded-2xl p-4 bg-cream flex flex-col justify-between shadow-none border-none cursor-pointer hover:bg-zinc-100/60 transition-colors min-w-0"
                      >
                        <div className="flex justify-between items-start min-w-0">
                          <div className="flex gap-2.5 items-center min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 border-none flex items-center justify-center font-bold text-white text-xs shrink-0 overflow-hidden shadow-sm">
                              {emp.profilFoto ? (
                                <img src={emp.profilFoto} alt="Profil" className="w-full h-full object-cover" />
                              ) : (
                                <>{(emp.ad || 'U')[0]}{(emp.soyad || '')[0] || ''}</>
                              )}
                            </div>
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <h4 className="font-extrabold text-sm truncate" title={`${emp.ad || ''} ${emp.soyad || ''}`}>{emp.ad || ''} {emp.soyad || ''}</h4>
                              <span className="text-xs text-zinc-500 block truncate">{emp.sozlesmeSayisi || 0} Aktif Portföy</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-900/10 flex justify-between items-center text-xs flex-wrap gap-1">
                          <span className="text-zinc-500 whitespace-nowrap">Kazanılan Ciro:</span>
                          <strong className="text-charcoal font-bold whitespace-nowrap">{(emp.getirdigiPara || 0).toLocaleString('tr-TR')} TL</strong>
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
            )}

            {/* Bottom Data Table: Recent listings */}
            <div className="bento-card bg-white">
              <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-charcoal">Son Eklenen Portföyler</h3>
                <button
                  onClick={() => setActiveTab('portfolios')}
                  className="text-xs font-bold text-charcoal underline hover:text-black"
                >
                  Tümünü Gör
                </button>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-zinc-200 text-xs font-extrabold text-zinc-500 uppercase">
                      <th className="pb-3 pr-4 whitespace-nowrap">Tip</th>
                      <th className="pb-3 px-4 whitespace-nowrap">Tür</th>
                      <th className="pb-3 px-4 whitespace-nowrap">Lokasyon</th>
                      <th className="pb-3 px-4 whitespace-nowrap">Fiyat</th>
                      <th className="pb-3 pl-4 whitespace-nowrap">Görevli</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolios.filter(p => !['SATILDI', 'KIRALANDI', 'KIRALANDI_SATILDI', 'TAMAMLANDI'].includes((p.durum || '').toUpperCase())).slice(0, 3).map(p => (
                      <tr
                        key={p.id}
                        onClick={() => { setSelectedPortfolio(p); setActiveTab('portfolios'); }}
                        className="border-b border-zinc-100 text-sm hover:bg-cream/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 pr-4 whitespace-nowrap">
                          <strong className="font-extrabold">{p.tip}</strong>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-zinc-700 whitespace-nowrap">{p.tur}</td>
                        <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap">{p.il || ''} / {p.ilce || ''}</td>
                        <td className="py-3.5 px-4 font-extrabold whitespace-nowrap">{(p.fiyat || 0).toLocaleString('tr-TR')} TL</td>
                        <td className="py-3.5 pl-4 font-medium whitespace-nowrap">{p.gorevliUzman || ''}</td>
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
                  <h3 className="text-xl sm:text-2xl font-extrabold leading-tight">
                    {isOfisteMi ? 'Ofisteyim 🏢' : 'Ofiste Değilim 🏠'}
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    {isOfisteMi ? 'Ekip arkadaşların seni ofiste görüyor.' : 'Konumunuz diğerlerine görünmüyor.'}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs font-semibold text-white/60">
                    {isOfisteMi ? '✓ Aktif' : '○ Pasif'}
                  </span>
                  {/* Toggle Switch */}
                  <button
                    onClick={handleToggleOfficeStatus}
                    disabled={presenceLoading}
                    className={`relative inline-flex items-center w-14 h-7 rounded-full transition-all duration-300 focus:outline-none border-none ${isOfisteMi ? 'bg-emerald-400' : 'bg-white/20'
                      } ${presenceLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                    title={isOfisteMi ? 'Ofisten Ayrılıyorum' : 'Ofise Geldim'}
                  >
                    <span
                      className={`inline-block w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${isOfisteMi ? 'translate-x-8' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>

              {/* Bugün Ofistekiler Paneli */}
              <div className="bento-card bg-white">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h3 className="text-base font-extrabold text-charcoal flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    Bugün Ofistekiler
                  </h3>
                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full whitespace-nowrap">
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
                          <div className="w-9 h-9 rounded-full bg-pastelGreen flex items-center justify-center text-xs font-extrabold text-slate-900">
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
                        <span className="ml-auto text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0 whitespace-nowrap">Ofiste</span>
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
            <div className="">
              <div className="flex flex-wrap justify-between items-center md:items-start mb-6 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-charcoal">Portföy Yönetimi</h2>
                    <p className="text-xs text-zinc-500 font-medium mt-1">Tüm portföylerinizi görüntüleyin, filtreleyin ve yönetin.</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 border-2 ${showFilters ? 'bg-zinc-200 text-charcoal border-transparent' : 'bg-white border-zinc-200 text-charcoal hover:bg-zinc-50 shadow-sm'}`}
                  >
                    <Filter size={14} /> Filtrele
                  </button>
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className={`px-4 py-2 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 border-2 ${showMap ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 shadow-sm'}`}
                  >
                    <MapPin size={14} /> {showMap ? 'Haritayı Gizle' : 'Haritada Göster'}
                  </button>
                  <button
                    onClick={() => setShowAddPortfolioModal(true)}
                    className="px-5 py-2 bg-charcoal text-white text-xs font-bold rounded-full hover:bg-black transition-colors flex items-center gap-1.5 border-none"
                  >
                    <Plus size={14} /> Yeni Portföy Ekle
                  </button>
                </div>
              </div>

              {/* Dependent Dropdown Filters */}
              {showFilters && (
                <div className="flex flex-col md:flex-row flex-wrap gap-3 mb-4 bg-zinc-50 p-4 rounded-2xl border border-charcoal/10 shadow-sm">
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-[10px] text-zinc-500 font-extrabold uppercase ml-1 block mb-1">İlan Tipi</label>
                    <select
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-bold text-charcoal focus:outline-none focus:border-charcoal transition-colors cursor-pointer"
                      value={filterIlanTipi}
                      onChange={(e) => {
                        setFilterIlanTipi(e.target.value);
                        setFilterTip('');
                        setFilterOdaSayisi('');
                        setFilterIl('');
                        setFilterIlce('');
                      }}
                    >
                      <option value="">Tümü</option>
                      {availableIlanTipleri.map(tur => <option key={tur} value={tur}>{tur}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-[10px] text-zinc-500 font-extrabold uppercase ml-1 block mb-1">Mülk Tipi</label>
                    <select
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-bold text-charcoal focus:outline-none focus:border-charcoal transition-colors cursor-pointer"
                      value={filterTip}
                      onChange={(e) => {
                        setFilterTip(e.target.value);
                        setFilterOdaSayisi('');
                        setFilterIl('');
                        setFilterIlce('');
                      }}
                    >
                      <option value="">Tümü</option>
                      {availableTips.map(tip => <option key={tip} value={tip}>{tip}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-[10px] text-zinc-500 font-extrabold uppercase ml-1 block mb-1">Oda Sayısı</label>
                    <select
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-bold text-charcoal focus:outline-none focus:border-charcoal transition-colors cursor-pointer"
                      value={filterOdaSayisi}
                      onChange={(e) => {
                        setFilterOdaSayisi(e.target.value);
                        setFilterIl('');
                        setFilterIlce('');
                      }}
                    >
                      <option value="">Tümü</option>
                      {availableOdaSayilari.map(oda => <option key={oda} value={oda}>{oda}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-[10px] text-zinc-500 font-extrabold uppercase ml-1 block mb-1">İl</label>
                    <select
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-bold text-charcoal focus:outline-none focus:border-charcoal transition-colors cursor-pointer"
                      value={filterIl}
                      onChange={(e) => {
                        setFilterIl(e.target.value);
                        setFilterIlce('');
                      }}
                    >
                      <option value="">Tümü</option>
                      {availableIller.map(il => <option key={il} value={il}>{il}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-[10px] text-zinc-500 font-extrabold uppercase ml-1 block mb-1">İlçe</label>
                    <select
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-bold text-charcoal focus:outline-none focus:border-charcoal transition-colors cursor-pointer"
                      value={filterIlce}
                      onChange={(e) => setFilterIlce(e.target.value)}
                    >
                      <option value="">Tümü</option>
                      {availableIlceler.map(ilce => <option key={ilce} value={ilce}>{ilce}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterIlanTipi('');
                        setFilterTip('');
                        setFilterOdaSayisi('');
                        setFilterIl('');
                        setFilterIlce('');
                      }}
                      className="w-full md:w-auto px-4 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-charcoal text-xs font-extrabold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-xs"
                      title="Tüm Filtreleri Temizle"
                    >
                      <RotateCcw size={13} /> Sıfırla
                    </button>
                  </div>
                </div>
              )}


              {showMap && (
                <div className="w-full h-[400px] mb-6 rounded-3xl overflow-hidden shadow-sm">
                  <MultiMarkerMap portfolios={filteredPortfolios} hoveredPortfolioId={hoveredPortfolioId} onMarkerClick={setSelectedPortfolio} />
                </div>
              )}

              <div className="flex flex-col gap-3 mb-6">
                {/* Visibility Mode Toggle Switch */}
                <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                  <div className="flex-1">
                    <p className="text-xs font-extrabold uppercase tracking-widest text-zinc-500 mb-2">Portföy Görünürlüğü</p>
                    <button
                      onClick={() => setPortfolioVisibilityMode(portfolioVisibilityMode === 'published' ? 'unpublished' : 'published')}
                      className="relative w-full h-10 rounded-full bg-white border-2 border-zinc-200 transition-all hover:border-charcoal/50 focus:outline-none overflow-hidden"
                      title={portfolioVisibilityMode === 'published' ? 'Yayınlanmayan Portföyleri Göster' : 'Yayınlanan Portföyleri Göster'}
                    >
                      {/* Slider Background - moves between left and right */}
                      <span className={`absolute top-1 bottom-1 w-1/2 rounded-full bg-pastelYellow transition-all duration-300 ${portfolioVisibilityMode === 'published' ? 'left-1' : 'right-1'}`} />

                      {/* Labels Container */}
                      <div className="relative w-full h-full flex items-center justify-between px-4 flex-wrap gap-3">
                        <span className={`text-xs font-extrabold transition-all z-10 ${portfolioVisibilityMode === 'published' ? 'text-slate-900' : 'text-zinc-400'}`}>
                          Yayınlanan
                        </span>
                        <span className={`text-xs font-extrabold transition-all z-10 ${portfolioVisibilityMode === 'unpublished' ? 'text-slate-900' : 'text-zinc-400'}`}>
                          Yayınlanmayan
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {portfolioVisibilityMode === 'published' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPortfolioScope('all')}
                      className={`flex-1 py-2 text-xs font-bold rounded-full transition-all border-none ${portfolioScope === 'all' ? 'bg-charcoal text-white' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'}`}
                    >
                      Tüm Portföyler
                    </button>
                    <button
                      onClick={() => setPortfolioScope('mine')}
                      className={`flex-1 py-2 text-xs font-bold rounded-full transition-all border-none ${portfolioScope === 'mine' ? 'bg-charcoal text-white' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'}`}
                    >
                      Portföylerim
                    </button>
                  </div>
                )}
              </div>

              <div className="w-full">
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  {filteredPortfolios.map(p => {
                    const photos = p.fotograflar || (p.kapakFoto ? [p.kapakFoto] : []);
                    return (
                      <div key={p.id} onMouseEnter={() => showMap && setHoveredPortfolioId(p.id)} onMouseLeave={() => showMap && setHoveredPortfolioId(null)}>
                        <PortfolioCardItem
                          portfolio={p}
                          photos={photos}
                          onSelect={() => setSelectedPortfolio(p)}
                          isPublished={isPortfolioPublished(p)}
                          onTogglePublish={() => handleTogglePortfolioPublish(p)}
                          publishLoading={publishLoadingPortfolioId === p.id}
                          isOwner={isOwnPortfolio(p)} requireAuthAgreement={firmaSettings.YetkilendirmeSarti === true}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Portfolio Details Popup Modal */}
            {selectedPortfolio && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-3 md:p-4 overflow-y-auto">
                {isEditingPortfolio ? (
                  /* Edit Mode Form */
                  <div className="flex flex-col lg:flex-row gap-4 max-w-5xl w-full my-auto items-stretch h-[90vh] max-h-[90vh]">
                    <form
                      onSubmit={handleSaveEditPortfolio}
                      className="bg-white rounded-3xl p-5 md:p-8 flex-1 relative border-none shadow-none flex flex-col gap-4 overflow-y-auto"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Portföy İşlemleri</span>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal mt-1">Portföy Düzenle</h2>
                        </div>
                        <button
                          type="button"
                          className="p-1.5 border border-charcoal rounded-full hover:bg-zinc-100 text-charcoal"
                          onClick={() => setIsEditingPortfolio(false)}
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Satılık / Kiralık Toggle Tab */}
                      <div className="flex gap-2 mb-2 p-1 bg-zinc-100 rounded-full border border-zinc-200">
                        <button
                          type="button"
                          className={`flex-1 py-2 text-xs font-bold rounded-full transition-colors ${editPortTur === 'SATILIK' ? 'bg-white text-charcoal shadow-sm' : 'text-zinc-500 hover:text-charcoal'}`}
                          onClick={() => { setEditPortTur('SATILIK'); setEditPortDepozito(''); }}
                        >
                          Satılık
                        </button>
                        <button
                          type="button"
                          className={`flex-1 py-2 text-xs font-bold rounded-full transition-colors ${editPortTur === 'KIRALIK' ? 'bg-white text-charcoal shadow-sm' : 'text-zinc-500 hover:text-charcoal'}`}
                          onClick={() => setEditPortTur('KIRALIK')}
                        >
                          Kiralık
                        </button>
                      </div>

                      <div>
                        <label className="text-xs text-zinc-600 font-semibold block mb-1">Başlık</label>
                        <input
                          type="text"
                          placeholder="Örn: Deniz Manzaralı Lüks Daire"
                          className="w-full text-xs p-2.5 border-2 border-charcoal rounded-xl bg-white focus:outline-none mb-3"
                          value={editPortBaslik}
                          onChange={e => setEditPortBaslik(e.target.value)}
                        />
                      </div>

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

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-zinc-600 font-semibold block mb-1">Fiyat (TL)</label>
                          <input
                            type="number"
                            placeholder="Fiyat girin"
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
                            placeholder="Örn: 120"
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

                      <div className={`grid gap-3 ${editPortTur === 'KIRALIK' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <div>
                          <label className="text-xs text-zinc-600 font-semibold block mb-1">Kapora Miktarı (Otomatik)</label>
                          <input
                            type="number"
                            placeholder="Örn: 50000"
                            className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                            value={editPortKapora}
                            onChange={e => setEditPortKapora(e.target.value)}
                          />
                        </div>
                        {editPortTur === 'KIRALIK' && (
                          <div>
                            <label className="text-xs text-zinc-600 font-semibold block mb-1">Depozito Miktarı (Otomatik)</label>
                            <input
                              type="number"
                              placeholder="Örn: 20000"
                              className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                              value={editPortDepozito}
                              onChange={e => setEditPortDepozito(e.target.value)}
                            />
                          </div>
                        )}
                      </div>

                      {(() => {
                        const f = Number(editPortFiyat) || 0;
                        if (f <= 0) return null;
                        let komisyon = 0;
                        if (editPortTur === 'KIRALIK') {
                          komisyon = f * (Number(firmaSettings.KiralamaKomisyonOrani) || 1);
                        } else {
                          const oran = (Number(firmaSettings.SatisAliciKomisyon) || 2) + (Number(firmaSettings.SatisSaticiKomisyon) || 2);
                          komisyon = f * (oran / 100);
                        }
                        return (
                          <div className="bg-[#FDF8F2] p-4 rounded-2xl border border-charcoal/10">
                            <div className="flex justify-between items-center flex-wrap gap-3">
                              <div>
                                <span className="text-xs font-bold text-zinc-600 block">Öngörülen Hizmet Bedeli (KDV Dahil)</span>
                                <span className="text-[10px] text-zinc-400">Senaryo A (Kendi Müşterisi)</span>
                              </div>
                              <div className="text-lg font-extrabold text-charcoal">
                                {komisyon.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="flex items-center justify-between mt-4 mb-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-200">
                        <span className="text-xs font-semibold text-zinc-600 flex items-center gap-2">
                          <MapPin size={16} className="text-emerald-600" />
                          Harita & Adres Senkronizasyonu
                        </span>
                        <button
                          type="button"
                          onClick={() => setSyncMapAddress(!syncMapAddress)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${syncMapAddress ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                        >
                          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${syncMapAddress ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                      </div>

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
                            placeholder="İlçe"
                            className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                            value={editPortIlce}
                            onChange={e => setEditPortIlce(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-600 font-semibold block mb-1">Semt</label>
                          <input
                            type="text"
                            placeholder="Semt"
                            className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                            value={editPortSemt}
                            onChange={e => setEditPortSemt(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-zinc-600 font-semibold block mb-1">Mahalle</label>
                          <input
                            type="text"
                            placeholder="Mahalle"
                            className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                            value={editPortMahalle}
                            onChange={e => setEditPortMahalle(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-600 font-semibold block mb-1">Cadde</label>
                          <input
                            type="text"
                            placeholder="Cadde adı"
                            className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                            value={editPortCadde}
                            onChange={e => setEditPortCadde(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-600 font-semibold block mb-1">Sokak</label>
                          <input
                            type="text"
                            placeholder="Sokak adı"
                            className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                            value={editPortSokak}
                            onChange={e => setEditPortSokak(e.target.value)}
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
                              value={editPortLandlordName}
                              onChange={e => setEditPortLandlordName(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-600 block mb-0.5">Telefon</label>
                            <input
                              type="text"
                              placeholder="05xx..."
                              className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none"
                              value={editPortLandlordPhone}
                              onChange={e => setEditPortLandlordPhone(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Property Features Section */}
                      <div className="p-4 rounded-2xl bg-cream border-none flex flex-col gap-3">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase block">Yapı Özellikleri</span>

                        <div>
                          <label className="text-[10px] text-zinc-600 block mb-1">Açıklama</label>
                          <textarea
                            placeholder="Portföy hakkında detaylı açıklama yazınız..."
                            className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none resize-none"
                            rows={3}
                            value={editPortAciklama}
                            onChange={e => setEditPortAciklama(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-600 block mb-1">Otopark Tipi</label>
                          <select
                            className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none"
                            value={editPortOtoparkTipi}
                            onChange={e => setEditPortOtoparkTipi(e.target.value)}
                          >
                            <option value="">Seçiniz</option>
                            <option value="Açık Otopark">Açık Otopark</option>
                            <option value="Kapalı Otopark">Kapalı Otopark</option>
                            <option value="Otopark Yok">Otopark Yok</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-600 block mb-1">Isıtma Tipi</label>
                          <select
                            className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none"
                            value={editPortIsinmaTipi}
                            onChange={e => setEditPortIsinmaTipi(e.target.value)}
                          >
                            <option value="">Seçiniz</option>
                            <option value="Kombi (Doğalgaz)">Kombi (Doğalgaz)</option>
                            <option value="Merkezi Sistem">Merkezi Sistem</option>
                            <option value="Yerden Isıtma">Yerden Isıtma</option>
                            <option value="Klima">Klima</option>
                            <option value="Soba">Soba</option>
                            <option value="Yok">Yok</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-600 block mb-1">Balkon Durumu</label>
                          <select
                            className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none"
                            value={editPortBalkonDurumu}
                            onChange={e => setEditPortBalkonDurumu(e.target.value)}
                          >
                            <option value="">Seçiniz</option>
                            <option value="Balkonlu">Balkonlu</option>
                            <option value="Çift Balkonlu">Çift Balkonlu</option>
                            <option value="Teraslı">Teraslı</option>
                            <option value="Cam Balkon">Cam Balkon</option>
                            <option value="Balkon Yok">Balkon Yok</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-600 block mb-1">Eşya Durumu</label>
                          <select
                            className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none"
                            value={editPortEsyaDurumu}
                            onChange={e => setEditPortEsyaDurumu(e.target.value)}
                          >
                            <option value="">Seçiniz</option>
                            <option value="Eşyalı">Eşyalı</option>
                            <option value="Eşyasız">Eşyasız</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-600 block mb-1">Kullanım Durumu</label>
                          <select
                            className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none"
                            value={editPortKullanimDurumu}
                            onChange={e => setEditPortKullanimDurumu(e.target.value)}
                          >
                            <option value="">Seçiniz</option>
                            <option value="Mülk Sahibi Oturuyor">Mülk Sahibi Oturuyor</option>
                            <option value="Kiracı Var">Kiracı Var</option>
                            <option value="Boş (Hemen Taşınmaya Uygun)">Boş (Hemen Taşınmaya Uygun)</option>
                          </select>
                        </div>

                        {editPortTur === 'SATILIK' && (
                          <div>
                            <label className="text-[10px] text-zinc-600 block mb-1">Tapu Durumu</label>
                            <select
                              className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none"
                              value={editPortTapuDurumu}
                              onChange={e => setEditPortTapuDurumu(e.target.value)}
                            >
                              <option value="">Seçiniz</option>
                              <option value="Kat Mülkiyetli (İskanlı)">Kat Mülkiyetli (İskanlı)</option>
                              <option value="Kat İrtifaklı">Kat İrtifaklı</option>
                              <option value="Hisseli Tapu">Hisseli Tapu</option>
                              <option value="Arsa Tapulu">Arsa Tapulu</option>
                            </select>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 border-2 border-zinc-300 rounded bg-white focus:outline-none"
                              checked={editPortHasAsansor}
                              onChange={e => setEditPortHasAsansor(e.target.checked)}
                            />
                            <span className="text-[10px] text-zinc-600">Asansör Var</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 border-2 border-zinc-300 rounded bg-white focus:outline-none"
                              checked={editPortIsAcilSatilik}
                              onChange={e => setEditPortIsAcilSatilik(e.target.checked)}
                            />
                            <span className="text-[10px] text-zinc-600">Acil Satılık</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 border-2 border-zinc-300 rounded bg-white focus:outline-none"
                              checked={editPortIsFiyatiDustu}
                              onChange={e => setEditPortIsFiyatiDustu(e.target.checked)}
                            />
                            <span className="text-[10px] text-zinc-600">Fiyatı Düştü</span>
                          </label>
                        </div>

                        {editPortTur === 'SATILIK' && (
                          <div className="flex flex-wrap gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-4 h-4 border-2 border-zinc-300 rounded bg-white focus:outline-none"
                                checked={editPortIsKrediyeUygun}
                                onChange={e => setEditPortIsKrediyeUygun(e.target.checked)}
                              />
                              <span className="text-[10px] text-zinc-600">Krediye Uygun</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-4 h-4 border-2 border-zinc-300 rounded bg-white focus:outline-none"
                                checked={editPortIsTakasaUygun}
                                onChange={e => setEditPortIsTakasaUygun(e.target.checked)}
                              />
                              <span className="text-[10px] text-zinc-600">Takas Yapılabilir</span>
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-2">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-bold rounded-full transition-colors border-none"
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
                    {/* Right: Map Content for Edit Mode */}
                    <div className="hidden lg:flex w-full lg:w-[400px] bg-white rounded-3xl p-5 shadow-2xl flex-col gap-3 relative overflow-hidden shrink-0">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 z-10">
                        <MapPin size={14} className="text-zinc-400" /> HARİTADA KONUM SEÇİN
                      </span>
                      <span className="text-[9px] text-zinc-400 font-normal block -mt-2 mb-1 z-10">Tam konumu işaretlemek için haritaya tıklayın.</span>
                      <div className="flex-1 rounded-2xl overflow-hidden relative">
                        <LocationPickerMap position={editPortPos} setPosition={setEditPortPos} className="h-full border-none" onMapClick={(lat, lng) => reverseGeocode(lat, lng, setEditPortIl, setEditPortIlce, setEditPortSemt, setEditPortMahalle, setEditPortCadde, setEditPortSokak)} />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="flex flex-col lg:flex-row gap-4 max-w-5xl w-full my-auto items-stretch h-[90vh] max-h-[90vh]">
                    <div className="bg-white rounded-3xl p-5 md:p-6 flex-1 relative border-none shadow-2xl flex flex-col gap-5 overflow-y-auto">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Portföy Detayı</span>
                          <h2 className="text-xl md:text-xl sm:text-2xl font-extrabold text-charcoal mt-1 break-words">{selectedPortfolio.tip} - {selectedPortfolio.tur}</h2>
                        </div>
                        <button className="p-1.5 border border-charcoal rounded-full hover:bg-zinc-100 text-charcoal" onClick={() => setSelectedPortfolio(null)}>
                          <X size={16} />
                        </button>
                      </div>

                      {/* Fotoğraf Galerisi & Kaydırılabilir Yapı (Max 12) */}
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center flex-wrap gap-3">
                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                            <ImageIcon size={14} /> Fotoğraf Galerisi ({portfolioImages.length}/12)
                          </span>
                          {(compareIds(selectedPortfolio.gorevliUzmanId, user?.id)) && portfolioImages.length < 12 && (
                            <label className="cursor-pointer px-3 py-1 bg-charcoal hover:bg-black text-white text-[11px] font-extrabold rounded-full transition-all flex items-center gap-1 shrink-0">
                              {uploadLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                              <span>Fotoğraf Ekle</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleUploadPortfolioImage}
                                disabled={uploadLoading}
                              />
                            </label>
                          )}
                        </div>

                        {/* Ana Görsel Gösterim Alanı (İki Tarafa Kaydırılabilir) */}
                        {imagesLoading ? (
                          <div className="h-[280px] rounded-2xl bg-zinc-100 flex items-center justify-center text-xs text-zinc-400">
                            <Loader2 size={24} className="animate-spin text-charcoal" />
                          </div>
                        ) : portfolioImages.length > 0 ? (
                          <div className="relative group rounded-2xl overflow-hidden bg-zinc-950 h-[280px] md:h-[320px] flex items-center justify-center shadow-md">
                            <img
                              src={portfolioImages[activeImageIndex]?.FotografUrl}
                              alt="Portföy Görseli"
                              className="max-h-full max-w-full object-contain transition-all duration-300"
                            />

                            {/* Kapak Rozeti */}
                            {portfolioImages[activeImageIndex]?.IsKapak && (
                              <span className="absolute top-3 left-3 bg-pastelYellow text-charcoal text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-charcoal shadow-sm flex items-center gap-1">
                                <CheckCircle2 size={12} /> KAPAK FOTOĞRAFI
                              </span>
                            )}

                            {/* Sol / Sağ Kaydırma Okları */}
                            {portfolioImages.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setActiveImageIndex(prev => (prev === 0 ? portfolioImages.length - 1 : prev - 1))}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-all backdrop-blur-sm cursor-pointer"
                                  title="Önceki Fotoğraf"
                                >
                                  <ChevronLeft size={18} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveImageIndex(prev => (prev === portfolioImages.length - 1 ? 0 : prev + 1))}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-all backdrop-blur-sm cursor-pointer"
                                  title="Sonraki Fotoğraf"
                                >
                                  <ChevronLeft size={18} className="rotate-180" />
                                </button>
                              </>
                            )}

                            {/* Fotoğraf Sayacı */}
                            <span className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap">
                              {activeImageIndex + 1} / {portfolioImages.length}
                            </span>
                          </div>
                        ) : (
                          <div className="h-44 rounded-2xl bg-zinc-50 border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-2 text-zinc-400 p-4 text-center">
                            <ImageIcon size={32} className="opacity-40" />
                            <span className="text-xs font-semibold">Bu portföye henüz fotoğraf eklenmemiş.</span>
                            {(compareIds(selectedPortfolio.gorevliUzmanId, user?.id)) && (
                              <span className="text-[11px] text-zinc-500">Yukarıdaki "Fotoğraf Ekle" butonunu kullanarak en fazla 12 görsel yükleyebilirsiniz.</span>
                            )}
                          </div>
                        )}

                        {/* Yatay Kaydırılabilir Küçük Resim (Thumbnail) Listesi */}
                        {portfolioImages.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            {portfolioImages.map((img, idx) => (
                              <div
                                key={img.Id || idx}
                                onClick={() => setActiveImageIndex(idx)}
                                className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${activeImageIndex === idx ? 'border-charcoal scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                                  }`}
                              >
                                <img src={img.FotografUrl} alt="" className="w-full h-full object-cover" />
                                {img.IsKapak && (
                                  <span className="absolute bottom-0.5 left-0.5 bg-pastelYellow text-charcoal text-[8px] font-black px-1 rounded">
                                    Kapak
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Seçili Fotoğraf İşlem Alanı (Kapak Yap / Sil) */}
                        {(compareIds(selectedPortfolio.gorevliUzmanId, user?.id)) && portfolioImages.length > 0 && (
                          <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-cream/70 border border-zinc-200 text-xs flex-wrap">
                            <span className="font-semibold text-zinc-600 truncate">Seçili Fotoğraf: #{activeImageIndex + 1}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              {!portfolioImages[activeImageIndex]?.IsKapak && (
                                <button
                                  type="button"
                                  onClick={() => handleSetCoverImage(portfolioImages[activeImageIndex].Id)}
                                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold rounded-full transition-colors border border-amber-300 flex items-center gap-1 cursor-pointer"
                                >
                                  <BadgeCheck size={12} /> Kapak Yap
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeletePortfolioImage(portfolioImages[activeImageIndex].Id, portfolioImages[activeImageIndex].FotografUrl)}
                                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold rounded-full transition-colors border border-red-200 flex items-center gap-1 cursor-pointer"
                              >
                                <X size={12} /> Sil
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Kare Kartlı Yan Yana Kompakt Bilgi Alanı */}
                      {/* 2 Kolonlu Kompakt Bilgi ve Özellikler Alanı */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Sol Taraf: Temel Bilgiler (Alt Alta) */}
                        <div className="flex flex-col gap-2">
                          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5"><DollarSign size={13} /> Fiyat</span>
                            <strong className="text-sm font-black text-indigo-900">{selectedPortfolio.fiyat.toLocaleString('tr-TR')} TL</strong>
                          </div>

                          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><MapPin size={13} /> Konum</span>
                            <strong className="text-xs font-extrabold text-charcoal truncate ml-2" title={`${selectedPortfolio.il} / ${selectedPortfolio.ilce} - ${selectedPortfolio.mahalle}`}>
                              {selectedPortfolio.ilce} / {selectedPortfolio.mahalle}
                            </strong>
                          </div>

                          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Ruler size={13} /> Metrekare</span>
                            <strong className="text-xs font-extrabold text-charcoal">{selectedPortfolio.metrekare ? `${selectedPortfolio.metrekare} m²` : 'Belirtilmedi'}</strong>
                          </div>

                          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                              {selectedPortfolio.tip === 'ARSA' ? <MapPin size={13} /> : <Bed size={13} />} {selectedPortfolio.tip === 'ARSA' ? 'İlan Tipi' : 'Oda Sayısı'}
                            </span>
                            <strong className="text-xs font-extrabold text-charcoal">
                              {selectedPortfolio.tip === 'ARSA' ? selectedPortfolio.tur : (selectedPortfolio.odaSayisi || 'Belirtilmedi')}
                            </strong>
                          </div>

                          <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5"><Banknote size={13} /> Kapora / Depozito</span>
                            <strong className="text-xs font-extrabold text-amber-950 truncate ml-2">
                              {(selectedPortfolio.kapora || 0).toLocaleString('tr-TR')} / {(selectedPortfolio.depozito || 0).toLocaleString('tr-TR')} TL
                            </strong>
                          </div>

                          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5"><User size={13} /> Sorumlu Uzman</span>
                            <strong className="text-xs font-extrabold text-emerald-950 truncate ml-2">{selectedPortfolio.gorevliUzman || 'Belirtilmedi'}</strong>
                          </div>

                          <div className="p-3 rounded-2xl bg-cream border border-charcoal/10 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"><Building size={13} /> Ev Sahibi İletişim Bilgileri</span>
                            {compareIds(selectedPortfolio.gorevliUzmanId, user?.id) ? (
                              <div className="flex items-center gap-1.5 min-w-0 flex-wrap justify-end">
                                <strong className="text-xs font-extrabold text-charcoal truncate">{selectedPortfolio.evSahibiAdi}</strong>
                                {selectedPortfolio.evSahibiTelefon && (
                                  <strong className="text-xs font-extrabold text-charcoal shrink-0">
                                    {selectedPortfolio.evSahibiTelefon}
                                  </strong>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-red-600 text-[11px] font-bold">
                                <Lock size={12} />
                                <span>Gizli Veri</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Sağ Taraf: Özellikler */}
                        <div className="p-5 rounded-2xl bg-zinc-50/50 border border-zinc-200 flex flex-col gap-4 h-full">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                            <Sparkles size={14} className="text-indigo-500" /> ÖZELLİKLER
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {selectedPortfolio.isAcilSatilik && (
                              <div className="flex items-center gap-2 text-xs font-extrabold text-red-700">
                                <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0"><AlertTriangle size={13} className="text-red-600" /></div> <span>Acil Satılık</span>
                              </div>
                            )}
                            {selectedPortfolio.isFiyatiDustu && (
                              <div className="flex items-center gap-2 text-xs font-extrabold text-green-700">
                                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0"><TrendingUp size={13} className="text-green-600" /></div> <span>Fiyatı Düştü</span>
                              </div>
                            )}
                            {selectedPortfolio.isKrediyeUygun && (
                              <div className="flex items-center gap-2 text-xs font-extrabold text-blue-700">
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><Banknote size={13} className="text-blue-600" /></div> <span>Krediye Uygun</span>
                              </div>
                            )}
                            {selectedPortfolio.isTakasaUygun && (
                              <div className="flex items-center gap-2 text-xs font-extrabold text-purple-700">
                                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0"><RotateCcw size={13} className="text-purple-600" /></div> <span>Takasa Uygun</span>
                              </div>
                            )}

                            {selectedPortfolio.hasAsansor && (
                              <div className="flex items-center gap-2 text-xs font-extrabold text-charcoal">
                                <div className="w-7 h-7 rounded-full bg-white border border-zinc-200 flex items-center justify-center shrink-0"><ArrowUpDown size={13} className="text-zinc-500" /></div> <span>Asansör</span>
                              </div>
                            )}

                            {selectedPortfolio.otoparkTipi && (
                              <div className="flex items-center gap-2 text-xs font-extrabold text-charcoal">
                                <div className="w-7 h-7 rounded-full bg-white border border-zinc-200 flex items-center justify-center shrink-0"><Car size={13} className="text-zinc-500" /></div>
                                <span className="leading-tight">{selectedPortfolio.otoparkTipi}</span>
                              </div>
                            )}

                            {selectedPortfolio.isinmaTipi && (
                              <div className="flex items-center gap-2 text-xs font-extrabold text-charcoal">
                                <div className="w-7 h-7 rounded-full bg-white border border-zinc-200 flex items-center justify-center shrink-0"><Flame size={13} className="text-zinc-500" /></div>
                                <span className="leading-tight">{selectedPortfolio.isinmaTipi}</span>
                              </div>
                            )}

                            {selectedPortfolio.balkonDurumu && (
                              <div className="flex items-center gap-2 text-xs font-extrabold text-charcoal">
                                <div className="w-7 h-7 rounded-full bg-white border border-zinc-200 flex items-center justify-center shrink-0"><Layers size={13} className="text-zinc-500" /></div>
                                <span className="leading-tight">{selectedPortfolio.balkonDurumu}</span>
                              </div>
                            )}

                            {selectedPortfolio.esyaDurumu && (
                              <div className="flex items-center gap-2 text-xs font-extrabold text-charcoal">
                                <div className="w-7 h-7 rounded-full bg-white border border-zinc-200 flex items-center justify-center shrink-0"><Sofa size={13} className="text-zinc-500" /></div>
                                <span className="leading-tight">
                                  {selectedPortfolio.esyaDurumu === 'Boş' ? 'Eşyasız' : selectedPortfolio.esyaDurumu}
                                </span>
                              </div>
                            )}

                            {selectedPortfolio.kullanimDurumu && (
                              <div className="flex items-center gap-2 text-xs font-extrabold text-charcoal">
                                <div className="w-7 h-7 rounded-full bg-white border border-zinc-200 flex items-center justify-center shrink-0"><Key size={13} className="text-zinc-500" /></div>
                                <span className="leading-tight">{selectedPortfolio.kullanimDurumu}</span>
                              </div>
                            )}

                            {selectedPortfolio.tapuDurumu && (
                              <div className="flex items-center gap-2 text-xs font-extrabold text-charcoal">
                                <div className="w-7 h-7 rounded-full bg-white border border-zinc-200 flex items-center justify-center shrink-0"><FileCheck size={13} className="text-zinc-500" /></div>
                                <span className="leading-tight">{selectedPortfolio.tapuDurumu}</span>
                              </div>
                            )}
                          </div>

                          {/* Eğer hiçbir özellik yoksa */}
                          {!(selectedPortfolio.hasAsansor || selectedPortfolio.isKrediyeUygun || selectedPortfolio.isTakasaUygun || selectedPortfolio.isAcilSatilik || selectedPortfolio.isFiyatiDustu || selectedPortfolio.otoparkTipi || selectedPortfolio.isinmaTipi || selectedPortfolio.balkonDurumu || selectedPortfolio.esyaDurumu || selectedPortfolio.kullanimDurumu || selectedPortfolio.tapuDurumu) && (
                            <div className="text-xs text-zinc-500 italic py-4 text-center">Belirtilmiş ekstra özellik bulunmuyor.</div>
                          )}
                        </div>
                      </div>

                      {/* Edit & Close actions for owners/admins */}
                      {compareIds(selectedPortfolio.gorevliUzmanId, user?.id) && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => startEditPortfolio(selectedPortfolio)}
                            className="w-full py-2.5 bg-pastelYellow hover:bg-pastelYellow/80 text-amber-950 dark:text-amber-950 text-xs font-bold rounded-full transition-colors border-none cursor-pointer"
                          >
                            Portföyü Düzenle
                          </button>

                          {selectedPortfolio.durum !== 'SATILDI' && selectedPortfolio.durum !== 'KIRALANDI' && (
                            <button
                              onClick={() => openCloseTransactionModal(selectedPortfolio)}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-full transition-colors border-none cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Check size={16} /> İşlemi Kapat / Satıldı-Kiralandı Yap
                            </button>
                          )}
                        </div>
                      )}

                      {/* Randevu Oluşturma & Özel Randevu Takvimi (Yan Yana Kompakt 2 Kolonlu Alan) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        {/* SOL KOLON: Randevu Oluştur / Talep Et Formu */}
                        {(() => {
                          const isOwner = compareIds(selectedPortfolio.gorevliUzmanId, user?.id);

                          return (
                            <div className={`p-4 rounded-2xl border-2 flex flex-col justify-between gap-3 ${isOwner ? 'bg-pastelGreen/20 border-emerald-300' : 'bg-pastelPurple/20 border-indigo-300'}`}>
                              <div>
                                <div className="flex justify-between items-center gap-2 mb-2 flex-wrap">
                                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500">
                                    {isOwner ? 'DOĞRUDAN RANDEVU' : 'RANDEVU TALEBİ'}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${isOwner ? 'bg-pastelGreen text-emerald-950 border-emerald-400' : 'bg-indigo-100 text-indigo-950 border-indigo-400'}`}>
                                    {isOwner ? 'İlan Sahibisiniz' : `Uzman: ${selectedPortfolio.gorevliUzman || 'Uzman'}`}
                                  </span>
                                </div>
                                <h4 className="font-extrabold text-xs text-charcoal flex items-center gap-1.5">
                                  <Calendar size={14} />
                                  {isOwner ? 'Doğrudan Randevu Ekle' : 'Randevu Talep Et'}
                                </h4>
                              </div>

                              {selectedPortfolio.durum === 'KAPORA_ASAMASINDA' || selectedPortfolio.durum === 'KIRALANDI_SATILDI' ? (
                                <div className="flex items-center gap-1.5 text-[11px] text-red-700 font-semibold p-2.5 bg-red-50 rounded-xl border border-red-200">
                                  <AlertTriangle size={14} className="shrink-0" />
                                  <span>Bu portföy kapora aşamasında veya satıldığı için yeni randevu oluşturulamaz.</span>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2 text-xs">
                                  <div>
                                    <label className="text-[11px] text-zinc-600 font-semibold block mb-0.5">
                                      Müşteri <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                      className="w-full text-xs p-2 border border-charcoal/40 rounded-xl bg-white focus:outline-none font-medium"
                                      value={selectedMusteriId}
                                      onChange={e => setSelectedMusteriId(e.target.value)}
                                    >
                                      <option value="">-- Müşteri Seçin --</option>
                                      {clients.map(c => (
                                        <option key={c.id} value={c.id}>
                                          {c.ad} {c.soyad} ({c.musteriTipi || c.tip})
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-[11px] text-zinc-600 font-semibold block mb-0.5">
                                      Tarih & Saat <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="datetime-local"
                                      className="w-full text-xs p-2 border border-charcoal/40 rounded-xl bg-white focus:outline-none font-medium"
                                      value={selectedDate}
                                      min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                                      onChange={e => setSelectedDate(e.target.value)}
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    className={`w-full py-2.5 text-xs font-extrabold rounded-xl transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 mt-1 ${isOwner
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                      : 'bg-charcoal hover:bg-black text-white'
                                      }`}
                                    onClick={() => handleCreateOrRequestAppointment(selectedPortfolio, isOwner)}
                                  >
                                    {isOwner ? '➕ Randevu Oluştur' : '📤 Talep Gönder'}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* SAĞ KOLON: Skeuomorphic & Modern Masa Takvimi (Desk Calendar Card) */}
                        <div className="relative bg-[#FFFBEB] dark:bg-zinc-100 p-4 rounded-3xl border-2 border-amber-900/10 dark:border-zinc-200 shadow-xl flex flex-col justify-between gap-3 overflow-hidden">

                          {/* 1. Spiral Halkalar (Ring Binding Details) */}
                          <div className="absolute -top-3 left-0 right-0 flex justify-around px-6 pointer-events-none z-20">
                            {[...Array(6)].map((_, i) => (
                              <div key={`modal-spiral-${i}`} className="w-3 h-6 bg-gradient-to-b from-zinc-300 via-zinc-100 to-zinc-400 dark:from-zinc-400 dark:via-zinc-300 dark:to-zinc-500 rounded-full border border-zinc-500 shadow-sm flex flex-col justify-between items-center py-0.5">
                                <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full shadow-inner"></div>
                                <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full shadow-inner"></div>
                              </div>
                            ))}
                          </div>

                          {/* Takvim Yaprak Banner */}
                          <div className="flex justify-center items-center mt-1 border-b border-amber-200/60 dark:border-zinc-200/50 pb-2">
                            <h4 className="font-black text-xs text-charcoal flex items-center justify-center gap-1.5 w-full">
                              <Calendar size={14} className="text-amber-800 dark:text-zinc-500" />
                              <span>RANDEVU TAKVİMİ</span>
                            </h4>
                          </div>

                          {/* Fiziksel Takvim Yaprağı (Dev Gün Rakamı & Ay) */}
                          <div className="bg-white p-3 rounded-2xl border border-amber-200/80 dark:border-zinc-200/50 shadow-sm flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                              {/* Dev Rakam Yaprağı */}
                              <div className="w-14 h-14 rounded-xl bg-amber-50 dark:bg-zinc-200 border border-amber-200 dark:border-zinc-300 flex flex-col items-center justify-center p-1 shrink-0 shadow-inner">
                                <span className="text-2xl font-black text-charcoal leading-none">
                                  {popSelectedDay}
                                </span>
                                <span className="text-[8px] font-extrabold text-amber-800 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                                  {popMonthName.slice(0, 3)}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">SEÇİLİ TARİH</span>
                                <strong className="text-xs font-black text-charcoal capitalize block">
                                  {popSelectedDay} {popMonthName} {popYear}
                                </strong>
                              </div>
                            </div>

                            {/* Takvim Navigasyonu */}
                            <div className="flex gap-1 items-center shrink-0">
                              <button
                                type="button"
                                onClick={handlePopToday}
                                className="px-1.5 py-0.5 text-[8px] font-extrabold border border-amber-300 dark:border-zinc-400 rounded bg-amber-50 dark:bg-zinc-200 hover:bg-amber-100 dark:hover:bg-zinc-300 text-amber-900 dark:text-zinc-600 cursor-pointer transition-colors"
                              >
                                Bugün
                              </button>
                              <button
                                type="button"
                                onClick={handlePopPrevMonth}
                                className="p-1 border border-zinc-200 dark:border-zinc-200/50 rounded hover:bg-zinc-100 dark:hover:bg-zinc-200 cursor-pointer text-zinc-700 dark:text-zinc-300 transition-colors"
                              >
                                <ChevronLeft size={10} />
                              </button>
                              <button
                                type="button"
                                onClick={handlePopNextMonth}
                                className="p-1 border border-zinc-200 dark:border-zinc-200/50 rounded hover:bg-zinc-100 dark:hover:bg-zinc-200 cursor-pointer text-zinc-700 dark:text-zinc-300 transition-colors"
                              >
                                <ChevronLeft className="rotate-180" size={10} />
                              </button>
                            </div>
                          </div>

                          {/* Izgara Gün Seçici */}
                          <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-200/50">
                            <div className="grid grid-cols-7 gap-0.5 text-[8px] text-center font-black">
                              {['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].map((d, di) => (
                                <span key={di} className="text-zinc-400">{d}</span>
                              ))}
                              {popBlankDays.map((_, i) => (
                                <span key={`pop-blank-${i}`} className="p-0.5"></span>
                              ))}
                              {popDaysArray.map(day => {
                                const hasApp = popAppointments.some((a: any) => Number(a.gun) === day && Number(a.ay) === (popMonth + 1) && Number(a.yil) === popYear && a.durum !== 'REJECTED' && a.durum !== 'CANCELLED');
                                const isPastDate = new Date(popYear, popMonth, day) < new Date(new Date().setHours(0, 0, 0, 0));
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => !isPastDate && setPopSelectedDay(day)}
                                    disabled={isPastDate}
                                    className={`p-1 rounded transition-all relative flex flex-col items-center justify-center ${isPastDate ? 'text-zinc-300 line-through cursor-not-allowed' :
                                      popSelectedDay === day ? 'bg-charcoal text-white font-black scale-105 shadow-sm cursor-pointer' : 'hover:bg-amber-50 cursor-pointer'
                                      }`}
                                  >
                                    <span>{day}</span>
                                    {hasApp && (
                                      <span className={`w-1 h-1 rounded-full absolute bottom-0.5 ${popSelectedDay === day ? 'bg-amber-300' : 'bg-amber-600'}`} />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Randevu Defteri Detaylı Bilgilendirme Kartları (Reddedilenler Gizlenir) */}
                          <div className="flex flex-col gap-1 text-[10px]">
                            {(() => {
                              const dayApps = popAppointments.filter((a: any) => Number(a.gun) === popSelectedDay && Number(a.ay) === (popMonth + 1) && Number(a.yil) === popYear && a.durum !== 'REJECTED');
                              if (dayApps.length === 0) {
                                return (
                                  <span className="text-[10px] text-amber-900/60 italic p-2 bg-white/80 rounded-lg text-center border border-amber-200/50">
                                    📝 {popSelectedDay} {popMonthName} tarihinde gösterim bulunmuyor.
                                  </span>
                                );
                              }
                              return (
                                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                                  {dayApps.map((app: any) => {
                                    const canManageAppointment = compareIds(selectedPortfolio?.gorevliUzmanId, user?.id);
                                    const canCancelAppointment = compareIds(app.talepEdenId, user?.id);

                                    return (
                                      <div key={app.id} className="p-2 rounded-xl bg-white border-l-4 border-l-amber-600 border border-zinc-200 flex flex-col gap-1 text-xs shadow-2xs">
                                        <div className="flex justify-between items-center gap-1 flex-wrap">
                                          <div className="flex items-center gap-1">
                                            <Clock size={11} className="text-amber-800 shrink-0" />
                                            <strong className="font-extrabold text-charcoal">{app.saat || app.zaman || '12:00'}</strong>
                                          </div>
                                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${app.durum === 'APPROVED' ? 'bg-pastelGreen text-emerald-950 border-emerald-300' :
                                            app.durum === 'PENDING' ? 'bg-pastelYellow text-amber-950 border-amber-300' :
                                              app.durum === 'CANCELLED' ? 'bg-zinc-200 text-zinc-700 border-zinc-300' :
                                                'bg-pastelPink text-red-950 border-red-300'
                                            }`}>
                                            {app.durum === 'APPROVED' ? 'Onaylı ✅' :
                                              app.durum === 'PENDING' ? 'Bekliyor ⏳' :
                                                app.durum === 'CANCELLED' ? 'İptal 🚫' : 'Reddedildi ❌'}
                                          </span>
                                        </div>

                                        <div className="text-[10px] text-zinc-600 font-medium flex flex-col gap-0.5">
                                          <div><span className="text-zinc-400 font-semibold">Uzman:</span> <strong className="text-charcoal font-bold">{app.talepEden || 'Belirtilmedi'}</strong></div>
                                          <div><span className="text-zinc-400 font-semibold">Müşteri:</span> <strong className="text-charcoal font-bold">{app.musteriAdi || app.musteri || 'Belirtilmedi'}</strong> {app.musteriTelefon && <span className="text-zinc-400">({app.musteriTelefon})</span>}</div>
                                        </div>

                                        {/* Onayla / Reddet / İptal Aksiyon Butonları */}
                                        {app.durum === 'PENDING' && (
                                          <div className="flex justify-end items-center gap-1 mt-1 pt-1 border-t border-zinc-100">
                                            {canManageAppointment && (
                                              <>
                                                <button
                                                  type="button"
                                                  onClick={() => handleUpdateAppStatus(app.id, 'APPROVED')}
                                                  className="px-2 py-0.5 bg-pastelGreen border border-emerald-400 rounded text-[9px] font-extrabold text-emerald-950 hover:bg-emerald-300 cursor-pointer"
                                                >
                                                  Onayla
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleUpdateAppStatus(app.id, 'REJECTED')}
                                                  className="px-2 py-0.5 bg-pastelPink border border-red-300 rounded text-[9px] font-extrabold text-red-950 hover:bg-pink-200 cursor-pointer"
                                                >
                                                  Reddet
                                                </button>
                                              </>
                                            )}
                                            {!canManageAppointment && canCancelAppointment && (
                                              <button
                                                type="button"
                                                onClick={() => handleUpdateAppStatus(app.id, 'CANCELLED')}
                                                className="px-2 py-0.5 bg-zinc-100 border border-zinc-300 rounded text-[9px] font-extrabold text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                                              >
                                                İptal Et 🚫
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      <button className="w-full py-2.5 text-zinc-500 text-xs font-bold rounded-full hover:bg-zinc-100 transition-colors border-none cursor-pointer mt-2" onClick={() => setSelectedPortfolio(null)}>
                        Kapat
                      </button>

                    </div>
                    {/* Right: Map Content */}
                    {selectedPortfolio.latitude && selectedPortfolio.longitude && (
                      <div className="hidden lg:flex w-full lg:w-[400px] bg-white rounded-3xl p-5 shadow-2xl flex-col gap-3 relative overflow-hidden shrink-0">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 z-10">
                          <MapPin size={14} className="text-zinc-400" /> HARİTADA KONUM
                        </span>
                        <div className="flex-1 rounded-2xl overflow-hidden relative border-2 border-zinc-200">
                          <MapContainer center={[selectedPortfolio.latitude, selectedPortfolio.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} dragging={false} zoomControl={false} scrollWheelZoom={true}>
                            <CustomScrollWheelZoom />
                            <MapLayers />
                            <Marker position={[selectedPortfolio.latitude, selectedPortfolio.longitude]}></Marker>
                          </MapContainer>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Add Portfolio Modal */}
            {showAddPortfolioModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-3 md:p-4 overflow-y-auto">
                <div className="flex flex-col lg:flex-row gap-4 max-w-5xl w-full my-auto items-stretch h-[90vh] max-h-[90vh]">
                  <form
                    onSubmit={handleAddPortfolio}
                    className="bg-white rounded-3xl p-5 md:p-8 flex-1 relative border-none shadow-none flex flex-col gap-4 overflow-y-auto"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Portföy İşlemleri</span>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal mt-1">Yeni Portföy Ekle</h2>
                      </div>
                      <button
                        type="button"
                        className="p-1.5 border border-charcoal rounded-full hover:bg-zinc-100 text-charcoal"
                        onClick={() => setShowAddPortfolioModal(false)}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex gap-2 mb-2 p-1 bg-zinc-100 rounded-full border border-zinc-200">
                      <button
                        type="button"
                        className={`flex-1 py-2 text-xs font-bold rounded-full transition-colors ${newPortTur === 'SATILIK' ? 'bg-white text-charcoal shadow-sm' : 'text-zinc-500 hover:text-charcoal'}`}
                        onClick={() => { setNewPortTur('SATILIK'); setNewPortDepozito(''); }}
                      >
                        Satılık
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-2 text-xs font-bold rounded-full transition-colors ${newPortTur === 'KIRALIK' ? 'bg-white text-charcoal shadow-sm' : 'text-zinc-500 hover:text-charcoal'}`}
                        onClick={() => setNewPortTur('KIRALIK')}
                      >
                        Kiralık
                      </button>
                    </div>

                    <div>
                      <label className="text-xs text-zinc-600 font-semibold block mb-1">Başlık</label>
                      <input
                        type="text"
                        placeholder="Örn: Deniz Manzaralı Lüks Daire"
                        className="w-full text-xs p-2.5 border-2 border-charcoal rounded-xl bg-white focus:outline-none mb-3"
                        value={newPortBaslik}
                        onChange={e => setNewPortBaslik(e.target.value)}
                      />
                    </div>

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

                    <div className={`grid gap-3 ${newPortTur === 'KIRALIK' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      <div>
                        <label className="text-xs text-zinc-600 font-semibold block mb-1">Kapora Miktarı (Otomatik)</label>
                        <input
                          type="number"
                          placeholder="Örn: 50000"
                          className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                          value={newPortKapora}
                          onChange={e => setNewPortKapora(e.target.value)}
                        />
                      </div>
                      {newPortTur === 'KIRALIK' && (
                        <div>
                          <label className="text-xs text-zinc-600 font-semibold block mb-1">Depozito Miktarı (Otomatik)</label>
                          <input
                            type="number"
                            placeholder="Örn: 20000"
                            className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                            value={newPortDepozito}
                            onChange={e => setNewPortDepozito(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    {(() => {
                      const f = Number(newPortFiyat) || 0;
                      if (f <= 0) return null;
                      let komisyon = 0;
                      if (newPortTur === 'KIRALIK') {
                        komisyon = f * (Number(firmaSettings.KiralamaKomisyonOrani) || 1);
                      } else {
                        const oran = (Number(firmaSettings.SatisAliciKomisyon) || 2) + (Number(firmaSettings.SatisSaticiKomisyon) || 2);
                        komisyon = f * (oran / 100);
                      }
                      return (
                        <div className="bg-[#FDF8F2] p-4 rounded-2xl border border-charcoal/10">
                          <div className="flex justify-between items-center flex-wrap gap-3">
                            <div>
                              <span className="text-xs font-bold text-zinc-600 block">Öngörülen Hizmet Bedeli (KDV Dahil)</span>
                              <span className="text-[10px] text-zinc-400">Senaryo A (Kendi Müşterisi)</span>
                            </div>
                            <div className="text-lg font-extrabold text-charcoal">
                              {komisyon.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex items-center justify-between mt-4 mb-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-200">
                      <span className="text-xs font-semibold text-zinc-600 flex items-center gap-2">
                        <MapPin size={16} className="text-emerald-600" />
                        Harita & Adres Senkronizasyonu
                      </span>
                      <button
                        type="button"
                        onClick={() => setSyncMapAddress(!syncMapAddress)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${syncMapAddress ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${syncMapAddress ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </div>

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
                        <label className="text-xs text-zinc-600 font-semibold block mb-1">Semt</label>
                        <input
                          type="text"
                          placeholder="Semt"
                          className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                          value={newPortSemt}
                          onChange={e => setNewPortSemt(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
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
                      <div>
                        <label className="text-xs text-zinc-600 font-semibold block mb-1">Cadde</label>
                        <input
                          type="text"
                          placeholder="Cadde adı"
                          className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                          value={newPortCadde}
                          onChange={e => setNewPortCadde(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-600 font-semibold block mb-1">Sokak</label>
                        <input
                          type="text"
                          placeholder="Sokak adı"
                          className="w-full text-xs p-2.5 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                          value={newPortSokak}
                          onChange={e => setNewPortSokak(e.target.value)}
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

                    {/* Fotoğraf Yükleme Alanı (Max 12) */}
                    <div className="p-4 rounded-2xl bg-zinc-50 border-2 border-dashed border-zinc-200 flex flex-col gap-3">
                      <div className="flex justify-between items-center flex-wrap gap-3">
                        <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-1.5">
                          <ImageIcon size={14} /> Portföy Fotoğrafları ({newPortFiles.length}/12)
                        </span>
                        {newPortFiles.length < 12 && (
                          <label className="cursor-pointer px-3 py-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-[11px] font-extrabold rounded-full transition-all flex items-center gap-1 shrink-0">
                            <Plus size={12} />
                            <span>Fotoğraf Seç</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const selectedFiles = Array.from(e.target.files || []);
                                if (selectedFiles.length === 0) return;
                                const combined = [...newPortFiles, ...selectedFiles].slice(0, 12);
                                setNewPortFiles(combined);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {newPortFiles.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                          {newPortFiles.map((file, idx) => (
                            <div key={idx} className="relative group w-full h-16 rounded-xl overflow-hidden border border-zinc-200 bg-white">
                              <img
                                src={URL.createObjectURL(file)}
                                alt="Önizleme"
                                className="w-full h-full object-cover"
                              />
                              {idx === 0 && (
                                <span className="absolute bottom-0.5 left-0.5 bg-pastelYellow text-charcoal text-[8px] font-black px-1 rounded">
                                  Kapak
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setNewPortFiles(newPortFiles.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 p-0.5 bg-black/70 hover:bg-black text-white rounded-full transition-all cursor-pointer"
                                title="Fotoğrafı Kaldır"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-400 text-center italic">
                          İsteğe bağlı: En fazla 12 adet fotoğraf yükleyebilirsiniz. İlk seçilen fotoğraf varsayılan kapak fotoğrafı olacaktır.
                        </p>
                      )}
                    </div>

                    {/* Property Features Section */}
                    <div className="p-4 rounded-2xl bg-cream border-none flex flex-col gap-3">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block">Yapı Özellikleri</span>

                      <div>
                        <label className="text-[10px] text-zinc-600 block mb-1">Açıklama</label>
                        <textarea
                          placeholder="Portföy hakkında detaylı açıklama yazınız..."
                          className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none resize-none"
                          rows={3}
                          value={newPortAciklama}
                          onChange={e => setNewPortAciklama(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-600 block mb-1">Otopark Tipi</label>
                        <select
                          className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none"
                          value={newPortOtoparkTipi}
                          onChange={e => setNewPortOtoparkTipi(e.target.value)}
                        >
                          <option value="">Seçiniz</option>
                          <option value="Açık Otopark">Açık Otopark</option>
                          <option value="Kapalı Otopark">Kapalı Otopark</option>
                          <option value="Otopark Yok">Otopark Yok</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-600 block mb-1">Isıtma Tipi</label>
                        <select
                          className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none"
                          value={newPortIsinmaTipi}
                          onChange={e => setNewPortIsinmaTipi(e.target.value)}
                        >
                          <option value="">Seçiniz</option>
                          <option value="Kombi (Doğalgaz)">Kombi (Doğalgaz)</option>
                          <option value="Merkezi Sistem">Merkezi Sistem</option>
                          <option value="Yerden Isıtma">Yerden Isıtma</option>
                          <option value="Klima">Klima</option>
                          <option value="Soba">Soba</option>
                          <option value="Yok">Yok</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-600 block mb-1">Balkon Durumu</label>
                        <select
                          className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none"
                          value={newPortBalkonDurumu}
                          onChange={e => setNewPortBalkonDurumu(e.target.value)}
                        >
                          <option value="">Seçiniz</option>
                          <option value="Balkonlu">Balkonlu</option>
                          <option value="Çift Balkonlu">Çift Balkonlu</option>
                          <option value="Teraslı">Teraslı</option>
                          <option value="Cam Balkon">Cam Balkon</option>
                          <option value="Balkon Yok">Balkon Yok</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-600 block mb-1">Eşya Durumu</label>
                        <select
                          className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none"
                          value={newPortEsyaDurumu}
                          onChange={e => setNewPortEsyaDurumu(e.target.value)}
                        >
                          <option value="">Seçiniz</option>
                          <option value="Eşyalı">Eşyalı</option>
                          <option value="Eşyasız">Eşyasız</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-600 block mb-1">Kullanım Durumu</label>
                        <select
                          className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none"
                          value={newPortKullanimDurumu}
                          onChange={e => setNewPortKullanimDurumu(e.target.value)}
                        >
                          <option value="">Seçiniz</option>
                          <option value="Mülk Sahibi Oturuyor">Mülk Sahibi Oturuyor</option>
                          <option value="Kiracı Var">Kiracı Var</option>
                          <option value="Boş (Hemen Taşınmaya Uygun)">Boş (Hemen Taşınmaya Uygun)</option>
                        </select>
                      </div>

                      {newPortTur === 'SATILIK' && (
                        <div>
                          <label className="text-[10px] text-zinc-600 block mb-1">Tapu Durumu</label>
                          <select
                            className="w-full text-xs p-2 border-2 border-zinc-300 rounded-lg bg-white focus:outline-none"
                            value={newPortTapuDurumu}
                            onChange={e => setNewPortTapuDurumu(e.target.value)}
                          >
                            <option value="">Seçiniz</option>
                            <option value="Kat Mülkiyetli (İskanlı)">Kat Mülkiyetli (İskanlı)</option>
                            <option value="Kat İrtifaklı">Kat İrtifaklı</option>
                            <option value="Hisseli Tapu">Hisseli Tapu</option>
                            <option value="Arsa Tapulu">Arsa Tapulu</option>
                          </select>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 border-2 border-zinc-300 rounded bg-white focus:outline-none"
                            checked={newPortHasAsansor}
                            onChange={e => setNewPortHasAsansor(e.target.checked)}
                          />
                          <span className="text-[10px] text-zinc-600">Asansör Var</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 border-2 border-zinc-300 rounded bg-white focus:outline-none"
                            checked={newPortIsAcilSatilik}
                            onChange={e => setNewPortIsAcilSatilik(e.target.checked)}
                          />
                          <span className="text-[10px] text-zinc-600">Acil Satılık</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 border-2 border-zinc-300 rounded bg-white focus:outline-none"
                            checked={newPortIsFiyatiDustu}
                            onChange={e => setNewPortIsFiyatiDustu(e.target.checked)}
                          />
                          <span className="text-[10px] text-zinc-600">Fiyatı Düştü</span>
                        </label>
                      </div>

                      {newPortTur === 'SATILIK' && (
                        <div className="flex flex-wrap gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 border-2 border-zinc-300 rounded bg-white focus:outline-none"
                              checked={newPortIsKrediyeUygun}
                              onChange={e => setNewPortIsKrediyeUygun(e.target.checked)}
                            />
                            <span className="text-[10px] text-zinc-600">Krediye Uygun</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 border-2 border-zinc-300 rounded bg-white focus:outline-none"
                              checked={newPortIsTakasaUygun}
                              onChange={e => setNewPortIsTakasaUygun(e.target.checked)}
                            />
                            <span className="text-[10px] text-zinc-600">Takas Yapılabilir</span>
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        type="submit"
                        disabled={newPortSubmitting}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-bold rounded-full transition-colors border-none flex items-center justify-center gap-2"
                      >
                        {newPortSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                        <span>{newPortSubmitting ? 'Portföy & Fotoğraflar Kaydediliyor...' : 'Portföy Oluştur ve Yetkilendirme Sözleşmesine Git'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={newPortSubmitting}
                        className="flex-1 py-2 text-zinc-500 text-xs font-bold rounded-full hover:bg-zinc-100 transition-colors border-none"
                        onClick={() => { setShowAddPortfolioModal(false); setNewPortFiles([]); }}
                      >
                        İptal
                      </button>
                    </div>

                  </form>
                  {/* Right: Map Content for Add Mode */}
                  <div className="hidden lg:flex w-full lg:w-[400px] bg-white rounded-3xl p-5 shadow-2xl flex-col gap-3 relative overflow-hidden shrink-0">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 z-10">
                      <MapPin size={14} className="text-zinc-400" /> HARİTADA KONUM SEÇİN
                    </span>
                    <span className="text-[9px] text-zinc-400 font-normal block -mt-2 mb-1 z-10">Tam konumu işaretlemek için haritaya tıklayın.</span>
                    <div className="flex-1 rounded-2xl overflow-hidden relative">
                      <LocationPickerMap position={newPortPos} setPosition={setNewPortPos} className="h-full border-none" onMapClick={(lat, lng) => reverseGeocode(lat, lng, setNewPortIl, setNewPortIlce, setNewPortSemt, setNewPortMahalle, setNewPortCadde, setNewPortSokak)} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Completed Portfolios & Ciro Analysis Tab */}
        {activeTab === 'completedPortfolios' && (
          <div className="w-full flex flex-col gap-6">

            {/* Header and Search Container */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                  <BadgeCheck size={20} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-charcoal">Tamamlanan İşlemler</h2>
                  <p className="text-xs text-zinc-500 font-medium mt-1">
                    {completedScopeFilter === 'mine' 
                      ? 'Size ait satışı ve kiralaması tamamlanmış bireysel portföyler.'
                      : (user?.firmaAdi ? `${user.firmaAdi} firmasına` : 'Giriş yapılı firmaya') + ' ait satışı ve kiralaması tamamlanmış portföyler.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => fetchCompletedPortfolios(token!)}
                  disabled={completedLoading}
                  className="px-4 py-2 bg-white border border-zinc-200 text-charcoal rounded-full text-xs font-bold hover:bg-zinc-50 transition-all flex items-center gap-2 shrink-0 shadow-sm"
                >
                  {completedLoading ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                  Yenile
                </button>
              </div>
            </div>

            {/* Calculate stats based on all completed portfolios */}
            {(() => {
              const allItems = Array.isArray(completedPortfolios) ? completedPortfolios : [];
              const filtered = allItems.filter(p => {
                if (!p) return false;
                const isMine = compareIds(p.gorevliUzmanId, user?.id) || compareIds(p.islemYapanDanismanId, user?.id);
                if (completedScopeFilter === 'mine' && !isMine) return false;
                if (completedScopeFilter === 'others' && isMine) return false;

                const dUpper = String(p.durum || '').toUpperCase();
                const tUpper = String(p.islemTuru || '').toUpperCase();

                if (completedTypeFilter === 'SATILDI' && !dUpper.includes('SATIL') && !tUpper.includes('SATIS')) return false;
                if (completedTypeFilter === 'KIRALANDI' && !dUpper.includes('KIRAL') && !tUpper.includes('KIRAL')) return false;

                if (completedSearchQuery.trim()) {
                  const q = completedSearchQuery.toLowerCase();
                  const matches = (
                    (p.tip && p.tip.toLowerCase().includes(q)) ||
                    (p.il && p.il.toLowerCase().includes(q)) ||
                    (p.ilce && p.ilce.toLowerCase().includes(q)) ||
                    (p.evSahibiAdi && p.evSahibiAdi.toLowerCase().includes(q)) ||
                    (p.gorevliUzman && p.gorevliUzman.toLowerCase().includes(q)) ||
                    (p.islemYapanDanisman && p.islemYapanDanisman.toLowerCase().includes(q))
                  );
                  if (!matches) return false;
                }
                return true;
              });

              // Calculated metrics
              const totalTransactionVolume = filtered.reduce((sum, p) => sum + (Number(p.islemBedeli) || Number(p.fiyat) || 0), 0);
              const totalRevenueCiro = filtered.reduce((sum, p) => sum + (Number(p.hizmetBedeliCiro) || 0), 0);
              const danismanPayOran = Number(firmaSettings?.BrokerDanismanPayi || 50);
              const totalDanismanHakedis = (totalRevenueCiro * danismanPayOran) / 100;
              const totalOfisPayi = (totalRevenueCiro * (100 - danismanPayOran)) / 100;
              const satilanCount = filtered.filter(p => String(p.durum || '').toUpperCase().includes('SATIL') || String(p.islemTuru || '').toUpperCase().includes('SATIS')).length;
              const kiralananCount = filtered.filter(p => String(p.durum || '').toUpperCase().includes('KIRAL') || String(p.islemTuru || '').toUpperCase().includes('KIRAL')).length;


              // Mine vs Others counts
              const mineCount = allItems.filter(p => compareIds(p.gorevliUzmanId, user?.id) || compareIds(p.islemYapanDanismanId, user?.id)).length;
              const othersCount = allItems.length - mineCount;

              return (
                <>
                  {/* Top 4 Bento Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* Card 1: Total Transaction Volume */}
                    <div className="bento-card bg-[#E0F2FE] border border-sky-300 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-900">Toplam İşlem Hacmi</span>
                        <div className="w-8 h-8 rounded-full bg-sky-200 flex items-center justify-center">
                          <Banknote size={18} className="text-sky-900" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-sky-950 truncate">
                          {totalTransactionVolume.toLocaleString('tr-TR')} ₺
                        </h3>
                        <p className="text-[11px] font-semibold text-sky-800/80 mt-1">
                          Kapanan tüm mülk işlem tutarları
                        </p>
                      </div>
                    </div>

                    {/* Card 2: Total Service Fee / Revenue */}
                    <div className="bento-card bg-[#DCFCE7] border border-emerald-300 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900/70">Elde Edilen Toplam Ciro</span>
                        <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center">
                          <DollarSign size={18} className="text-emerald-900" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-emerald-950 truncate">
                          {totalRevenueCiro.toLocaleString('tr-TR')} ₺
                        </h3>
                        <p className="text-[11px] font-semibold text-emerald-800/80 mt-1">
                          Tahsil edilen toplam hizmet bedeli
                        </p>
                      </div>
                    </div>

                    {/* Card 3: Advisor Revenue Share */}
                    <div className="bento-card bg-[#FEF3C7] border border-amber-300 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900/70">Danışman Hakedişi (%{danismanPayOran})</span>
                        <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center">
                          <Trophy size={18} className="text-amber-900" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-amber-950 truncate">
                          {totalDanismanHakedis.toLocaleString('tr-TR')} ₺
                        </h3>
                        <p className="text-[11px] font-semibold text-amber-800/80 mt-1">
                          Danışman payına düşen toplam tutar
                        </p>
                      </div>
                    </div>

                    {/* Card 4: Total Completed Count */}
                    <div className="bento-card bg-[#F3E8FF] border border-purple-300 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-900">Kapanan İşlem Adedi</span>
                        <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center">
                          <BadgeCheck size={18} className="text-purple-900" />
                        </div>
                      </div>
                      <div className="flex-1 flex items-center justify-center py-2">
                        <h3 className="text-3xl font-black text-purple-950 text-center">
                          {filtered.length} <span className="text-xs font-bold text-purple-800">Portföy</span>
                        </h3>
                      </div>
                    </div>

                  </div>

                  {/* Revenue Distribution Banner (Danışman Payı vs Ofis Payı) */}
                  <div className="bento-card bg-white border border-zinc-200">
                    <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
                      <div className="flex items-center gap-2">
                        <Percent size={18} className="text-charcoal" />
                        <h3 className="text-base font-extrabold text-charcoal">Firma Ciro Dağılım Modeli</h3>
                      </div>
                      <span className="text-xs font-bold text-zinc-500">
                        Kayıtlı Sözleşme Oranı: Danışman %{danismanPayOran} / Ofis %{100 - danismanPayOran}
                      </span>
                    </div>

                    {/* Progress Bar Visualizer */}
                    <div className="w-full bg-zinc-100 rounded-2xl p-3 border border-zinc-200">
                      <div className="flex justify-between text-xs font-extrabold mb-1.5">
                        <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                          Danışman Hakedişi (%{danismanPayOran}): {totalDanismanHakedis.toLocaleString('tr-TR')} ₺
                        </span>
                        <span className="text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                          Ofis Payı (%{100 - danismanPayOran}): {totalOfisPayi.toLocaleString('tr-TR')} ₺
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                        </span>
                      </div>
                      <div className="w-full h-4 bg-indigo-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${totalRevenueCiro > 0 ? danismanPayOran : 50}%` }}
                          title={`Danışman Payı: %${danismanPayOran}`}
                        />
                        <div
                          className="h-full bg-indigo-600 transition-all duration-500"
                          style={{ width: `${totalRevenueCiro > 0 ? (100 - danismanPayOran) : 50}%` }}
                          title={`Ofis Payı: %${100 - danismanPayOran}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filter Toolbar (Scope, Type) */}
                  <div className="flex flex-col md:flex-row flex-wrap justify-between items-center gap-4">

                    {/* Scope Tabs: Tüm Ofis / Kendi Portföylerim / Başkasının Portföyü */}
                    <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-2xl border border-zinc-200 shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => setCompletedScopeFilter('all')}
                        className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all border-none cursor-pointer flex-1 sm:flex-initial ${completedScopeFilter === 'all' ? 'bg-charcoal text-white shadow-md' : 'text-zinc-600 hover:text-charcoal'
                          }`}
                      >
                        Tüm Ofis ({allItems.length})
                      </button>
                      <button
                        onClick={() => setCompletedScopeFilter('mine')}
                        className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all border-none cursor-pointer flex-1 sm:flex-initial flex items-center justify-center gap-1 ${completedScopeFilter === 'mine' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-600 hover:text-emerald-700'
                          }`}
                      >
                        <User size={13} /> Kendi Portföylerim ({mineCount})
                      </button>
                      <button
                        onClick={() => setCompletedScopeFilter('others')}
                        className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all border-none cursor-pointer flex-1 sm:flex-initial flex items-center justify-center gap-1 ${completedScopeFilter === 'others' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-600 hover:text-indigo-700'
                          }`}
                      >
                        <Building size={13} /> Ofis / Diğer Danışmanlar ({othersCount})
                      </button>
                    </div>

                    {/* Type Filter */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                      <select
                        value={completedTypeFilter}
                        onChange={(e: any) => setCompletedTypeFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-bold text-charcoal focus:outline-none focus:border-charcoal cursor-pointer shadow-sm"
                      >
                        <option value="all">Tüm İşlem Türleri</option>
                        <option value="SATILDI">Satılanlar (SATILDI)</option>
                        <option value="KIRALANDI">Kiralananlar (KIRALANDI)</option>
                      </select>
                    </div>

                  </div>

                  {/* Completed Portfolios Grid View */}
                  {completedLoading ? (
                    <div className="bento-card bg-white py-16 flex flex-col items-center justify-center text-zinc-500 gap-3">
                      <Loader2 size={32} className="animate-spin text-charcoal" />
                      <p className="text-sm font-semibold">Tamamlanan portföyler yükleniyor...</p>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="bento-card bg-white py-16 text-center text-zinc-400">
                      <BadgeCheck size={40} className="mx-auto mb-3 opacity-30 text-charcoal" />
                      <h4 className="text-base font-extrabold text-charcoal mb-1">Seçilen Kriterlere Uygun İşlem Bulunamadı</h4>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        {allItems.length === 0
                          ? `${user?.firmaAdi || 'Firmanıza'} ait veritabanında henüz tamamlanmış (Satıldı/Kiralandı) bir portföy kaydı bulunmamaktadır.`
                          : completedScopeFilter === 'mine'
                            ? 'Size ait henüz kapatılmış bir satılık veya kiralık portföy kaydı bulunmuyor.'
                            : 'Filtrelerinizi değiştirerek daha fazla sonuç arayabilirsiniz.'}
                      </p>

                    </div>
                  ) : (
                    <div className="bento-card bg-white p-4 md:p-6 overflow-hidden">
                      <div className="table-responsive overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b-2 border-zinc-200 text-xs font-extrabold text-zinc-500 uppercase tracking-wider">
                              <th className="pb-3 pr-4 whitespace-nowrap">Tip</th>
                              <th className="pb-3 px-4 whitespace-nowrap">Tür</th>
                              <th className="pb-3 px-4 whitespace-nowrap">Lokasyon</th>
                              <th className="pb-3 px-4 whitespace-nowrap">Görevli Uzman</th>
                              <th className="pb-3 px-4 text-right whitespace-nowrap">İşlem Bedeli</th>
                              <th className="pb-3 px-4 text-right whitespace-nowrap">Toplanan Ciro</th>
                              <th className="pb-3 px-4 text-right whitespace-nowrap">Danışman Payı</th>
                              <th className="pb-3 px-4 whitespace-nowrap">Kapanış Tarihi</th>
                              <th className="pb-3 pl-4 text-center whitespace-nowrap">Aksiyon</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 text-xs">
                            {filtered.map(p => {
                              const isMine = compareIds(p.gorevliUzmanId, user?.id) || compareIds(p.islemYapanDanismanId, user?.id);
                              const ciroNum = Number(p.hizmetBedeliCiro) || 0;
                              const danismanHakedisNum = (ciroNum * danismanPayOran) / 100;
                              const isSatildim = p.durum === 'SATILDI';
                              const cardKey = p.satisIslemId ? `satis-${p.satisIslemId}` : `port-${p.id}`;

                              return (
                                <tr
                                  key={cardKey}
                                  onClick={() => setSelectedCompletedPortfolio(p)}
                                  className="group hover:bg-zinc-100 cursor-pointer transition-colors"
                                >
                                  {/* Tip ve Tür */}
                                  <td className="py-3.5 pr-4 whitespace-nowrap">
                                    <strong className="font-extrabold text-charcoal">{p.tip}</strong>
                                  </td>
                                  <td className="py-3.5 px-4 font-medium text-zinc-700 whitespace-nowrap">
                                    {p.tur}
                                  </td>

                                  {/* Lokasyon */}
                                  <td className="py-3.5 px-4 whitespace-nowrap text-zinc-600 font-medium">
                                    {p.ilce ? `${p.ilce}, ` : ''}{p.il}
                                  </td>

                                  {/* Görevli Uzman */}
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-2 h-2 rounded-full ${isMine ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
                                      <span className="font-bold text-charcoal">{p.gorevliUzman || 'Uzman'}</span>
                                      {isMine && <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">SİZ</span>}
                                    </div>
                                  </td>

                                  {/* İşlem Bedeli */}
                                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-extrabold text-charcoal">
                                    {(Number(p.islemBedeli) || Number(p.fiyat) || 0).toLocaleString('tr-TR')} ₺
                                  </td>

                                  {/* Toplanan Ciro */}
                                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-black text-emerald-700">
                                    {ciroNum.toLocaleString('tr-TR')} ₺
                                  </td>

                                  {/* Danışman Payı */}
                                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-black text-indigo-900">
                                    {danismanHakedisNum.toLocaleString('tr-TR')} ₺
                                  </td>

                                  {/* Kapanış Tarihi */}
                                  <td className="py-3.5 px-4 whitespace-nowrap text-zinc-500 font-semibold">
                                    {p.islemTarihi ? new Date(p.islemTarihi).toLocaleDateString('tr-TR') : '-'}
                                  </td>

                                  {/* Aksiyon */}
                                  <td className="py-3.5 pl-4 text-center whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCompletedPortfolio(p);
                                      }}
                                      className="px-3 py-1 bg-charcoal group-hover:bg-black text-white text-[11px] font-extrabold rounded-full transition-all shadow-xs border-none cursor-pointer flex items-center gap-1 mx-auto"
                                    >
                                      <Info size={12} />
                                      <span>Detay Gör</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Read-Only Completed Portfolio Detail Modal */}
                  {selectedCompletedPortfolio && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full relative border-none shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">

                        {/* Modal Header */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                              <BadgeCheck size={14} /> Kapanmış Portföy Detayı (Salt Okunur)
                            </span>
                            <h2 className="text-2xl font-black text-charcoal mt-1">
                              {selectedCompletedPortfolio.tip} - {selectedCompletedPortfolio.durum}
                            </h2>
                          </div>
                          <button
                            onClick={() => setSelectedCompletedPortfolio(null)}
                            className="p-2 border border-charcoal rounded-full hover:bg-zinc-100 text-charcoal cursor-pointer"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {/* Lock Warning Note */}
                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-900">
                          <Lock size={18} className="shrink-0 text-amber-700" />
                          <span>Bu işlem tamamlanmış ve finansal kaydı işlenmiş olduğu için üzerinde düzenleme veya silme yapılamaz.</span>
                        </div>

                        {/* Detailed Specs Grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-cream rounded-xl border border-zinc-200">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase block">Mülk Tipi & Türü</span>
                            <strong className="text-charcoal font-black text-sm">{selectedCompletedPortfolio.tip} ({selectedCompletedPortfolio.tur})</strong>
                          </div>
                          <div className="p-3 bg-cream rounded-xl border border-zinc-200">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase block">Kapanış Tarihi</span>
                            <strong className="text-charcoal font-black text-sm">
                              {selectedCompletedPortfolio.islemTarihi ? new Date(selectedCompletedPortfolio.islemTarihi).toLocaleDateString('tr-TR') : '-'}
                            </strong>
                          </div>
                          <div className="p-3 bg-cream rounded-xl border border-zinc-200">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase block">Lokasyon</span>
                            <strong className="text-charcoal font-black text-sm">{selectedCompletedPortfolio.il} / {selectedCompletedPortfolio.ilce}</strong>
                          </div>
                          <div className="p-3 bg-cream rounded-xl border border-zinc-200">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase block">Sorumlu Uzman</span>
                            <strong className="text-charcoal font-black text-sm">{selectedCompletedPortfolio.gorevliUzman}</strong>
                          </div>
                        </div>

                        {/* Financial Table */}
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex flex-col gap-3">
                          <h4 className="text-xs font-black uppercase text-charcoal tracking-wider">İşlem & Ciro Hesaplama Dökümü</h4>
                          <div className="flex justify-between text-xs py-1 border-b border-zinc-200">
                            <span className="text-zinc-600">İşlem Bedeli:</span>
                            <strong className="font-extrabold text-charcoal">
                              {(Number(selectedCompletedPortfolio.islemBedeli) || Number(selectedCompletedPortfolio.fiyat) || 0).toLocaleString('tr-TR')} ₺
                            </strong>
                          </div>
                          <div className="flex justify-between text-xs py-1 border-b border-zinc-200">
                            <span className="text-emerald-800 font-bold">Toplanan Hizmet Bedeli (Ciro):</span>
                            <strong className="font-black text-emerald-700 text-sm">
                              {(Number(selectedCompletedPortfolio.hizmetBedeliCiro) || 0).toLocaleString('tr-TR')} ₺
                            </strong>
                          </div>
                          <div className="flex justify-between text-xs py-1 border-b border-zinc-200">
                            <span className="text-emerald-900 font-bold">Danışman Payı (%{danismanPayOran}):</span>
                            <strong className="font-black text-emerald-900">
                              {(((Number(selectedCompletedPortfolio.hizmetBedeliCiro) || 0) * danismanPayOran) / 100).toLocaleString('tr-TR')} ₺
                            </strong>
                          </div>
                          <div className="flex justify-between text-xs py-1">
                            <span className="text-indigo-900 font-bold">Ofis Payı (%{100 - danismanPayOran}):</span>
                            <strong className="font-black text-indigo-900">
                              {(((Number(selectedCompletedPortfolio.hizmetBedeliCiro) || 0) * (100 - danismanPayOran)) / 100).toLocaleString('tr-TR')} ₺
                            </strong>
                          </div>
                        </div>

                        {/* Landlord Contact Info */}
                        <div className="p-4 bg-cream rounded-2xl border border-zinc-200">
                          <span className="text-[10px] font-extrabold uppercase text-zinc-500 block mb-1">Mülk Sahibi İletişim</span>
                          <p className="text-xs font-black text-charcoal">{selectedCompletedPortfolio.evSahibiAdi}</p>
                          <p className="text-xs font-semibold text-zinc-600 mt-0.5">{selectedCompletedPortfolio.evSahibiTelefon}</p>
                        </div>

                        {/* Close Button */}
                        <button
                          onClick={() => setSelectedCompletedPortfolio(null)}
                          className="w-full py-3 bg-charcoal hover:bg-black text-white font-extrabold rounded-full text-xs transition-colors border-none cursor-pointer"
                        >
                          Kapat
                        </button>

                      </div>
                    </div>
                  )}

                </>
              );
            })()}

          </div>
        )}


        {/* Tab 3: Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="flex flex-col gap-6 w-full">

            {/* Page Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                <Calendar size={20} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-charcoal">Randevular</h2>
                <p className="text-xs text-zinc-500 font-medium mt-1">
                  Tüm müşteri gösterimlerini ve randevu taleplerini yönetin.
                </p>
              </div>
            </div>

            {/* Top Card: Kendi Oluşturulan Randevular (My Appointments Card) */}
            {(() => {
              const now = new Date();
              const myApps = appointments.filter(a => {
                const isUserApp = compareIds(a.talepEdenId, user?.id) || (user?.rol === 'YETKILI' && compareIds(a.talepEdenId, a.portfoySahibiId));
                if (!isUserApp) return false;
                // Günü/tarihi geçmiş randevuları aktif listede gösterme
                const appDate = a.randevuZamani ? new Date(a.randevuZamani) : null;
                if (appDate && !isNaN(appDate.getTime()) && appDate < now) return false;
                return true;
              });

              return (
                <div className="bento-card bg-white">
                  <div className="flex justify-between items-center mb-4 border-b border-zinc-100 pb-3 flex-wrap gap-3">
                    <div>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">MÜŞTERİ GÖSTERİMLERİM</span>
                      <h3 className="text-lg sm:text-xl font-extrabold text-charcoal">Oluşturulan Randevular</h3>
                    </div>
                    <span className="text-xs font-extrabold text-charcoal">
                      {myApps.length} Aktif Randevu
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-zinc-200 text-xs font-extrabold text-zinc-500 uppercase">
                          <th className="pb-3 min-w-[140px]">Portföy Tipi</th>
                          <th className="pb-3 min-w-[160px]">Lokasyon</th>
                          <th className="pb-3 min-w-[160px]">Portföy Sahibi</th>
                          <th className="pb-3 min-w-[160px]">Randevuyu Alan Uzman</th>
                          <th className="pb-3 min-w-[150px]">Katılan Müşteri</th>
                          <th className="pb-3 min-w-[140px]">Randevu Zamanı</th>
                          <th className="pb-3 text-center min-w-[110px]">Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          if (myApps.length === 0) {
                            return (
                              <tr>
                                <td colSpan={7} className="py-8 text-center text-zinc-400 text-xs font-semibold">
                                  Kendi tarafınızdan oluşturulan aktif ve tarihi geçmemiş randevu bulunmuyor. Portföyler sayfasından yeni randevu teklifi oluşturabilirsiniz.
                                </td>
                              </tr>
                            );
                          }

                          return myApps.map(app => (
                            <tr
                              key={`my-app-${app.id}`}
                              className="border-b border-zinc-100 text-sm hover:bg-zinc-50/50 transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedAppointmentToAction(app);
                                setAppActionType(app.portfoyTur === 'KIRALIK' ? 'KIRALANDI' : 'SATILDI');
                                const fiyatNum = Number(app.portfoyFiyat || 0);
                                setAppActionBedel(fiyatNum.toString());
                                setAppActionCiro(app.portfoyTur === 'SATILIK' ? (fiyatNum * 0.02).toString() : fiyatNum.toString());
                                setShowAppointmentActionModal(true);
                              }}
                            >
                              <td className="py-4">
                                <strong className="font-extrabold text-charcoal">{app.portfoyTip}</strong>
                                <span className="text-xs text-zinc-500 block">{app.portfoyTur}</span>
                              </td>
                              <td className="py-4 text-xs font-medium text-zinc-600">
                                {app.ilce} / {app.il}
                                {app.mahalle && <span className="block text-zinc-400 text-[11px]">{app.mahalle} Mah.</span>}
                              </td>
                              <td className="py-4 text-xs font-bold text-charcoal">
                                {app.portfoySahibi || 'Belirtilmemiş'}
                              </td>
                              <td className="py-4 text-xs font-bold text-emerald-700">
                                {app.talepEden || 'Belirtilmemiş'}
                              </td>
                              <td className="py-4 text-xs">
                                <div className="font-bold text-charcoal">{app.musteri}</div>
                                <div className="text-zinc-500">{app.musteriTelefon}</div>
                              </td>
                              <td className="py-4 text-xs font-semibold text-zinc-600">
                                <div>{app.tarih}</div>
                                <div className="font-extrabold text-charcoal">{app.zaman}</div>
                              </td>
                              <td className="py-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase ${app.durum === 'APPROVED' ? 'bg-pastelGreen text-emerald-950 border-emerald-300' :
                                    app.durum === 'PENDING' ? 'bg-pastelYellow text-amber-950 border-amber-300' :
                                      app.durum === 'CANCELLED' ? 'bg-zinc-200 text-zinc-700 border-zinc-300' :
                                        'bg-pastelPink text-red-950 border-red-300'
                                    }`}>
                                    {app.durum === 'APPROVED' ? 'Onaylandı ✅' :
                                      app.durum === 'PENDING' ? 'Onay Bekliyor ⏳' :
                                        app.durum === 'CANCELLED' ? 'İptal Edildi 🚫' : 'Reddedildi ❌'}
                                  </span>
                                  {app.durum === 'PENDING' && compareIds(app.talepEdenId, user?.id) && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateAppStatus(app.id, 'CANCELLED')}
                                      className="text-[10px] text-red-600 font-extrabold underline hover:text-red-800 transition-colors mt-0.5 cursor-pointer"
                                    >
                                      Talebi İptal Et 🚫
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Middle Card: Sonuçlandırılması Bekleyen Randevular (Past / Expired Appointments needing resolution) */}
            <div className="bento-card bg-amber-50/60 dark:bg-zinc-100 border border-amber-200 dark:border-zinc-200">
              <div className="flex justify-between items-center mb-4 border-b border-amber-200/80 dark:border-zinc-200 pb-3 flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600 dark:bg-amber-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-500/80 uppercase tracking-widest block">GÜNÜ/SAATİ GEÇMİŞ RANDEVULAR</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-charcoal dark:text-zinc-950">Süreç Değişimi Gereken Randevular</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Tarihi ve saati geçmiş, henüz sonuç kaydı (Satıldı/Kiralandı/Vazgeçildi) girilmemiş randevularınız.</p>
                </div>
                {(() => {
                  const now = new Date();
                  const expiredAppsCount = appointments.filter(a => {
                    const isUserApp = compareIds(a.talepEdenId, user?.id) || compareIds(a.portfoySahibiId, user?.id) || (user?.rol === 'YETKILI');
                    if (!isUserApp) return false;
                    if (a.durum === 'CANCELLED' || a.durum === 'REJECTED') return false;

                    // Süreci "Portföy & Randevu Süreci" (1) dışına çıkmışsa gösterme
                    const process = clientProcesses.find(p => String(p.randevuId) === String(a.id));
                    if (process && Number(process.asamaId) > 1) return false;

                    const appDate = a.randevuZamani ? new Date(a.randevuZamani) : null;
                    return appDate && !isNaN(appDate.getTime()) && appDate < now;
                  }).length;

                  return (
                    <span className="text-xs font-extrabold text-amber-950 bg-pastelYellow px-3 py-1 rounded-full border border-amber-300 shadow-xs">
                      {expiredAppsCount} Sonuç Bekleyen
                    </span>
                  );
                })()}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-amber-200 dark:border-zinc-200 text-xs font-extrabold text-amber-900 dark:text-zinc-400 uppercase">
                      <th className="pb-3 min-w-[140px]">Portföy Tipi</th>
                      <th className="pb-3 min-w-[160px]">Lokasyon</th>
                      <th className="pb-3 min-w-[160px]">Portföy Sahibi</th>
                      <th className="pb-3 min-w-[160px]">Talep Eden Uzman</th>
                      <th className="pb-3 min-w-[150px]">Müşteri</th>
                      <th className="pb-3 min-w-[140px]">Randevu Zamanı</th>
                      <th className="pb-3 text-center min-w-[130px]">Aksiyon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const now = new Date();
                      const expiredApps = appointments.filter(a => {
                        const isUserApp = compareIds(a.talepEdenId, user?.id) || compareIds(a.portfoySahibiId, user?.id) || (user?.rol === 'YETKILI');
                        if (!isUserApp) return false;
                        if (a.durum === 'CANCELLED' || a.durum === 'REJECTED') return false;

                        // Süreci "Portföy & Randevu Süreci" (1) dışına çıkmışsa gösterme
                        const process = clientProcesses.find(p => String(p.randevuId) === String(a.id));
                        if (process && Number(process.asamaId) > 1) return false;

                        const appDate = a.randevuZamani ? new Date(a.randevuZamani) : null;
                        return appDate && !isNaN(appDate.getTime()) && appDate < now;
                      });

                      if (expiredApps.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-zinc-400 text-xs font-semibold">
                              🎉 Harika! Süreç değişimi bekleyen günü geçmiş randevunuz bulunmuyor.
                            </td>
                          </tr>
                        );
                      }

                      return expiredApps.map(app => (
                        <tr
                          key={`expired-app-${app.id}`}
                          className="border-b border-amber-100 dark:border-zinc-200/50 text-sm hover:bg-amber-100/60 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedAppointmentToAction(app);
                            setAppActionType(app.portfoyTur === 'KIRALIK' ? 'KIRALANDI' : 'SATILDI');
                            const fiyatNum = Number(app.portfoyFiyat || 0);
                            setAppActionBedel(fiyatNum.toString());
                            setAppActionCiro(app.portfoyTur === 'SATILIK' ? (fiyatNum * 0.02).toString() : fiyatNum.toString());
                            setShowAppointmentActionModal(true);
                          }}
                        >
                          <td className="py-4">
                            <strong className="font-extrabold text-charcoal">{app.portfoyTip}</strong>
                            <span className="text-xs text-zinc-500 block">{app.portfoyTur}</span>
                          </td>
                          <td className="py-4 text-xs font-medium text-zinc-600">
                            {app.ilce} / {app.il}
                            {app.mahalle && <span className="block text-zinc-400 text-[11px]">{app.mahalle} Mah.</span>}
                          </td>
                          <td className="py-4 text-xs font-bold text-charcoal">
                            {app.portfoySahibi || 'Belirtilmemiş'}
                          </td>
                          <td className="py-4 text-xs font-bold text-emerald-700">
                            {app.talepEden || 'Belirtilmemiş'}
                          </td>
                          <td className="py-4 text-xs">
                            <div className="font-bold text-charcoal">{app.musteri}</div>
                            <div className="text-zinc-500">{app.musteriTelefon}</div>
                          </td>
                          <td className="py-4 text-xs font-semibold text-amber-900 dark:text-amber-200/80">
                            <div>{app.tarih}</div>
                            <div className="font-extrabold text-amber-950 dark:text-amber-100">{app.zaman}</div>
                          </td>
                          <td className="py-4 text-center">
                            <button
                              type="button"
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-amber-950 rounded-full text-[11px] font-extrabold transition-all shadow-xs border-none cursor-pointer flex items-center gap-1 mx-auto"
                            >
                              ⚡ Süreci Güncelle
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Wide Main Card Container: Randevu Talepleri Akışı */}
            <div className="bento-card bg-white mt-2">
              <div className="flex flex-wrap justify-between items-center mb-2 border-b border-zinc-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">RANDEVU TAKVİMİ & TALEP YÖNETİMİ</span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-charcoal">Randevu Talepleri Akışı</h3>
                </div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const pendingCount = appointments.filter(a => (compareIds(a.portfoySahibiId, user?.id) || compareIds(a.talepEdenId, user?.id)) && a.durum === 'PENDING').length;
                    return (
                      <button
                        type="button"
                        className="relative p-2 rounded-2xl bg-cream hover:bg-zinc-100 text-charcoal transition-all border border-zinc-200 cursor-pointer flex items-center gap-2 font-bold text-xs shadow-xs"
                        title={pendingCount > 0 ? `${pendingCount} Yanıt Bekleyen Talep Bulunuyor` : 'Bildirimler'}
                      >
                        <Bell size={18} className="text-charcoal" />
                        <span>Bildirimler</span>
                        {pendingCount > 0 && (
                          <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full animate-pulse whitespace-nowrap">
                            {pendingCount} Yeni
                          </span>
                        )}
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* 2-Split Grid: Left (Giden Talepler 📤) & Right (Gelen Talepler 📥) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">

                {/* Left Section: Giden Talepler 📤 */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-3 flex-wrap gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div>
                        <h3 className="font-extrabold text-base text-charcoal">📤Giden Talepler</h3>
                        <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Sizin gönderdiğiniz gösterim istekleri</span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {appointments.filter(a => compareIds(a.talepEdenId, user?.id) && !compareIds(a.talepEdenId, a.portfoySahibiId)).length}
                    </span>
                  </div>

                  {/* Outgoing List */}
                  <div className="flex flex-col max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {(() => {
                      const now = new Date();
                      const outgoingApps = appointments.filter(a => {
                        if (!compareIds(a.talepEdenId, user?.id) || compareIds(a.talepEdenId, a.portfoySahibiId)) return false;
                        const appDate = a.randevuZamani ? new Date(a.randevuZamani) : null;
                        if (appDate && !isNaN(appDate.getTime()) && appDate < now) return false;
                        return true;
                      });
                      if (outgoingApps.length === 0) {
                        return (
                          <div className="py-6 text-center text-zinc-400 text-xs italic">
                            Henüz başka bir portföye gönderdiğiniz aktif randevu bulunmuyor.
                          </div>
                        );
                      }
                      return outgoingApps.map((app, idx) => (
                        <div key={app.id} className={`py-4 flex flex-col gap-2 ${idx !== outgoingApps.length - 1 ? 'border-b border-zinc-100' : ''}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <strong className="text-sm font-extrabold text-charcoal block">{app.portfoyTip} ({app.portfoyTur})</strong>
                              <span className="text-xs text-zinc-500">{app.ilce} / {app.il}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase ${app.durum === 'APPROVED' ? 'bg-pastelGreen text-emerald-950 border-emerald-300' :
                              app.durum === 'PENDING' ? 'bg-pastelYellow text-amber-950 border-amber-300 animate-pulse' :
                                app.durum === 'CANCELLED' ? 'bg-zinc-200 text-zinc-700 border-zinc-300' :
                                  'bg-pastelPink text-red-950 border-red-300'
                              }`}>
                              {app.durum === 'APPROVED' ? 'Onaylandı ✅' :
                                app.durum === 'PENDING' ? 'Onay Bekliyor ⏳' :
                                  app.durum === 'CANCELLED' ? 'İptal Edildi 🚫' : 'Reddedildi ❌'}
                            </span>
                          </div>

                          <div className="flex justify-between text-xs mt-1">
                            <div>
                              <span className="text-zinc-500 block">İlan Sahibi: <span className="font-bold text-charcoal">{app.portfoySahibi || 'Uzman'}</span></span>
                              <span className="text-zinc-500 block">Müşteri: <span className="font-bold text-charcoal">{app.musteri}</span></span>
                            </div>
                            <div className="text-right">
                              <span className="text-zinc-500 font-medium block">📅 {app.tarih}</span>
                              <strong className="text-charcoal block">{app.zaman}</strong>
                            </div>
                          </div>

                          <div className="mt-2 flex justify-end">
                            {app.durum === 'PENDING' ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateAppStatus(app.id, 'CANCELLED')}
                                className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md text-[10px] font-extrabold transition-all cursor-pointer"
                              >
                                Talebi İptal Et 🚫
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-zinc-400 italic">
                                {app.durum === 'APPROVED' ? 'Onaylandı' : app.durum === 'CANCELLED' ? 'İptal Edildi' : 'Reddedildi'}
                              </span>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Right Section: Gelen Talepler 📥 */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-3 flex-wrap gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div>
                        <h3 className="font-extrabold text-base text-charcoal">📥Gelen Talepler</h3>
                        <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Size gelen gösterim istekleri</span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      {appointments.filter(a => (user?.rol === 'YETKILI' ? !compareIds(a.talepEdenId, user?.id) : compareIds(a.portfoySahibiId, user?.id)) && !compareIds(a.talepEdenId, a.portfoySahibiId)).length}
                    </span>
                  </div>

                  {/* Incoming List */}
                  <div className="flex flex-col max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {(() => {
                      const now = new Date();
                      const incomingApps = appointments.filter(a => {
                        const isTargetUser = user?.rol === 'YETKILI' ? !compareIds(a.talepEdenId, user?.id) : compareIds(a.portfoySahibiId, user?.id);
                        if (!isTargetUser || compareIds(a.talepEdenId, a.portfoySahibiId)) return false;
                        const appDate = a.randevuZamani ? new Date(a.randevuZamani) : null;
                        if (appDate && !isNaN(appDate.getTime()) && appDate < now) return false;
                        return true;
                      });
                      if (incomingApps.length === 0) {
                        return (
                          <div className="py-6 text-center text-zinc-400 text-xs italic">
                            Henüz size gelen aktif bir randevu talebi bulunmuyor.
                          </div>
                        );
                      }
                      return incomingApps.map((app, idx) => {
                        const canManageAppointment = compareIds(app.portfoySahibiId, user?.id);

                        return (
                          <div key={app.id} className={`py-4 flex flex-col gap-2 ${idx !== incomingApps.length - 1 ? 'border-b border-zinc-100' : ''}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <strong className="text-sm font-extrabold text-charcoal block">{app.portfoyTip} ({app.portfoyTur})</strong>
                                <span className="text-xs text-zinc-500">{app.ilce} / {app.il}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase ${app.durum === 'APPROVED' ? 'bg-pastelGreen text-emerald-950 border-emerald-300' :
                                app.durum === 'PENDING' ? 'bg-pastelYellow text-amber-950 border-amber-300 animate-pulse' :
                                  app.durum === 'CANCELLED' ? 'bg-zinc-200 text-zinc-700 border-zinc-300' :
                                    'bg-pastelPink text-red-950 border-red-300'
                                }`}>
                                {app.durum === 'APPROVED' ? 'Onaylandı ✅' :
                                  app.durum === 'PENDING' ? 'Onay Bekliyor ⏳' :
                                    app.durum === 'CANCELLED' ? 'İptal Edildi 🚫' : 'Reddedildi ❌'}
                              </span>
                            </div>

                            <div className="flex justify-between text-xs mt-1">
                              <div>
                                <span className="text-zinc-500 block">Talep Eden: <span className="font-bold text-charcoal">{app.talepEden}</span></span>
                                <span className="text-zinc-500 block">Müşteri: <span className="font-bold text-charcoal">{app.musteri}</span> <span className="text-[10px] text-zinc-400">({app.musteriTelefon})</span></span>
                              </div>
                              <div className="text-right">
                                <span className="text-zinc-500 font-medium block">📅 {app.tarih}</span>
                                <strong className="text-charcoal block">{app.zaman}</strong>
                              </div>
                            </div>

                            <div className="mt-2 flex justify-end">
                              {canManageAppointment && app.durum === 'PENDING' ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdateAppStatus(app.id, 'APPROVED')}
                                    className="px-4 py-1.5 bg-pastelGreen border border-emerald-400 rounded-md text-[10px] font-extrabold hover:bg-emerald-300 transition-all cursor-pointer text-emerald-950"
                                  >
                                    Onayla
                                  </button>
                                  <button
                                    onClick={() => handleUpdateAppStatus(app.id, 'REJECTED')}
                                    className="px-4 py-1.5 bg-white border border-red-200 text-red-600 rounded-md text-[10px] font-extrabold hover:bg-red-50 transition-all cursor-pointer"
                                  >
                                    Reddet
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-zinc-400 italic">
                                  {app.durum === 'APPROVED' ? 'Onaylandı' : app.durum === 'CANCELLED' ? 'İptal Edildi' : app.durum === 'REJECTED' ? 'Reddedildi' : 'Onay Bekliyor ⏳'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* Tab 3.5: Process Management Tab (Süreç Yönetimi - 6 Aşamalı Kanban Takibi) */}
        {activeTab === 'processManagement' && (
          <div className="flex flex-col gap-6 w-full">

            {/* Page Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                <GitPullRequest size={20} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-charcoal">Süreç Yönetimi</h2>
                <p className="text-xs text-zinc-500 font-medium mt-1">
                  Randevuların ve satış/kiralama fırsatlarının aşama aşama takibini yapabileceğiniz kanban süreç panosu.
                </p>
              </div>
            </div>

            {/* 6 Stage Kanban Board Columns - MusteriSurecleri tablosundan besleniyor */}
            {clientProcessesLoading ? (
              <div className="flex items-center justify-center py-20 text-zinc-400">
                <Loader2 size={28} className="animate-spin mr-2" />
                <span className="text-sm font-semibold">Süreç kayıtları yükleniyor...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {(() => {
                  const handleProcessUpdate = async (procIdStr: string, targetStageId: number, targetStageLabel: string) => {
                    const droppedProc = clientProcesses.find(p => p.id === procIdStr);
                    if (!droppedProc) return;

                    if (Number(droppedProc.asamaId) === targetStageId) return;

                    if (targetStageId === 4 || targetStageId === 5) {
                      const relatedApp = appointments.find(a => a.id === droppedProc.randevuId);
                      if (relatedApp) {
                        setSelectedAppointmentToAction(relatedApp);
                        if (targetStageId === 4) {
                          setAppActionType(relatedApp.portfoyTur === 'KIRALIK' ? 'KIRALANDI' : 'SATILDI');
                          const fiyatNum = Number(relatedApp.portfoyFiyat || 0);
                          setAppActionBedel(fiyatNum.toString());
                          setAppActionCiro(relatedApp.portfoyTur === 'SATILIK' ? (fiyatNum * 0.02).toString() : fiyatNum.toString());
                        } else {
                          setAppActionType('VAZGECILDI');
                          setAppActionBedel('');
                          setAppActionCiro('');
                        }
                        setShowAppointmentActionModal(true);
                      } else {
                        alert("Bu işlem için ilişkili randevu kaydı bulunamadı. Lütfen eski kayıtlarınızı kontrol edin.");
                      }
                      return;
                    }

                    try {
                      await fetch('/api/appointments/update-stage', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          appointmentId: droppedProc.randevuId,
                          stageId: targetStageId,
                          asamaAdi: targetStageLabel
                        })
                      });
                      if (token) await fetchClientProcesses(token);
                    } catch (err) {
                      console.error(err);
                      alert("Aşama güncellenirken bir hata oluştu.");
                    }
                  };

                  return [
                    { stageId: 1, label: 'Portföy & Randevu Süreci', color: 'sky' },
                    { stageId: 3, label: 'Anlaşma süreci', color: 'amber' },
                    { stageId: 4, label: 'Satıldı/Kiralandı', color: 'emerald' },
                    { stageId: 5, label: 'Vazgeçildi', color: 'rose' },
                  ].map(({ stageId, label, color }) => {
                    const stageItems = clientProcesses.filter(p => Number(p.asamaId) === stageId);
                    const colorMap: Record<string, { card: string; border: string; dot: string; title: string; badge: string; empty: string; itemBorder: string }> = {
                      sky: { card: 'bg-sky-50 border-sky-200', border: 'border-sky-200', dot: 'bg-sky-500', title: 'text-sky-950', badge: 'bg-sky-200 text-sky-900', empty: 'text-sky-400', itemBorder: 'border-sky-100' },
                      amber: { card: 'bg-amber-50 border-amber-200', border: 'border-amber-200', dot: 'bg-amber-500', title: 'text-amber-950', badge: 'bg-amber-200 text-amber-900', empty: 'text-amber-300', itemBorder: 'border-amber-100' },
                      emerald: { card: 'bg-emerald-50 border-emerald-200', border: 'border-emerald-200', dot: 'bg-emerald-500', title: 'text-emerald-950', badge: 'bg-emerald-200 text-emerald-900', empty: 'text-emerald-300', itemBorder: 'border-emerald-100' },
                      rose: { card: 'bg-rose-50 border-rose-200', border: 'border-rose-200', dot: 'bg-rose-500', title: 'text-rose-950', badge: 'bg-rose-200 text-rose-900', empty: 'text-rose-300', itemBorder: 'border-rose-100' },
                    };
                    const c = colorMap[color] || colorMap.sky;

                    return (
                      <div
                        key={stageId}
                        className={`bento-card ${c.card} border p-4 flex flex-col gap-3 min-h-[500px] shadow-sm`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.opacity = '0.7';
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          e.currentTarget.style.opacity = '1';
                          const procIdStr = e.dataTransfer.getData('text/plain');
                          if (!procIdStr) return;
                          await handleProcessUpdate(procIdStr, stageId, label);
                        }}
                      >
                        <div className={`flex justify-between items-center pb-2 border-b ${c.border}`}>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`}></span>
                            <h3 className={`text-xs font-black uppercase tracking-wider ${c.title}`}>{label}</h3>
                          </div>
                          <span className={`text-[10px] font-extrabold ${c.badge} px-2 py-0.5 rounded-full`}>
                            {stageItems.length}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[650px] custom-scrollbar pr-1 mt-1">
                          {stageItems.map(proc => (
                            <div
                              key={proc.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', proc.id.toString());
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onClick={() => {
                                const relatedApp = appointments.find(a => a.id === proc.randevuId);
                                if (relatedApp) {
                                  setSelectedAppointmentToAction(relatedApp);
                                  setAppActionType(relatedApp.portfoyTur === 'KIRALIK' ? 'KIRALANDI' : 'SATILDI');
                                  const fiyatNum = Number(relatedApp.portfoyFiyat || 0);
                                  setAppActionBedel(fiyatNum.toString());
                                  setAppActionCiro(relatedApp.portfoyTur === 'SATILIK' ? (fiyatNum * 0.02).toString() : fiyatNum.toString());
                                  setSelectedStageId(Number(proc.asamaId));
                                  setShowAppointmentActionModal(true);
                                } else {
                                  alert("Bu işlem için ilişkili randevu kaydı bulunamadı.");
                                }
                              }}
                              className={`p-3 bg-white rounded-2xl border ${c.itemBorder} shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing flex flex-col gap-1.5 group relative`}
                            >
                              <div className="absolute top-2 right-2 text-zinc-400 group-hover:text-charcoal transition-colors">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDetailsMenuId(openDetailsMenuId === proc.id ? null : proc.id);
                                    setOpenProcessMenuId(null);
                                  }}
                                  className="p-1 hover:bg-zinc-100 rounded-lg cursor-pointer border-none bg-transparent flex items-center justify-center"
                                >
                                  <ChevronDown size={16} className={`transition-transform duration-200 ${openDetailsMenuId === proc.id ? 'rotate-180' : ''}`} />
                                </button>
                              </div>

                              <div className="pr-8">
                                <span className="text-xs font-black text-charcoal block truncate">
                                  {proc.portfoyBaslik || proc.portfoyIlce + ' - ' + proc.portfoyTip || 'Portföy Bilinmiyor'}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-bold block mt-0.5">
                                  {proc.portfoyTip} {proc.portfoyTur ? `· ${proc.portfoyTur}` : ''}
                                </span>
                              </div>

                              <div className="text-[10px] text-zinc-600 bg-zinc-50 p-2 rounded-xl border border-zinc-100 flex flex-col gap-1 mt-1">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-zinc-500">Müşteri:</span>
                                  <span className="font-bold text-charcoal truncate ml-1">{proc.musteri || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-zinc-500">Ev Sahibi:</span>
                                  <span className="font-bold text-zinc-700 truncate ml-1">{proc.evSahibi || '—'}</span>
                                </div>
                              </div>



                              {openDetailsMenuId === proc.id && (
                                <div className="mt-2 w-full bg-zinc-50 border border-zinc-200 shadow-inner rounded-xl p-3 z-10 animate-in fade-in slide-in-from-top-2 text-xs flex flex-col gap-2">
                                  <div className="flex justify-between items-center mb-1 border-b border-zinc-200 pb-2">
                                    <span className="font-black uppercase text-zinc-500 text-[9px]">Süreç Detayları</span>
                                    <button onClick={(e) => { e.stopPropagation(); setOpenDetailsMenuId(null); }} className="p-1 hover:bg-zinc-200 rounded-full text-zinc-500 border-none bg-transparent cursor-pointer flex items-center justify-center">
                                      <X size={12} />
                                    </button>
                                  </div>

                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500 font-semibold text-[10px]">Fiyat:</span>
                                      <span className="font-bold text-charcoal">{proc.portfoyFiyat ? `${Number(proc.portfoyFiyat).toLocaleString('tr-TR')} ₺` : '—'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500 font-semibold text-[10px]">Danışman:</span>
                                      <span className="font-bold text-charcoal">{proc.danisman || '—'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500 font-semibold text-[10px]">Müşteri Tel:</span>
                                      <span className="font-bold text-charcoal">{proc.musteriTelefon || '—'}</span>
                                    </div>
                                    <div className="flex justify-between mt-1 pt-2 border-t border-zinc-200/60">
                                      <span className="text-zinc-400 text-[9px]">Güncelleme:</span>
                                      <span className="text-zinc-500 text-[9px] font-medium">{proc.guncellemeTarihi ? new Date(proc.guncellemeTarihi).toLocaleDateString('tr-TR') : '—'}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {stageItems.length === 0 && (
                            <div className={`py-12 text-center ${c.empty} text-xs font-semibold italic`}>
                              Bu aşamada aktif kayıt bulunmuyor.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}

          </div>
        )}

        {/* Tab 4: Clients Tab */}
        {activeTab === 'clients' && (
          <div className="flex flex-col gap-6">
            <div className="">
              <div className="flex flex-wrap justify-between items-center md:items-start mb-6 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-charcoal">Müşterilerim</h2>
                    <p className="text-xs text-zinc-500 font-medium mt-1">Tüm müşteri ilişkilerinizi ve iletişim kayıtlarınızı yönetin.</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddClientModal(true)}
                    className="px-5 py-2 bg-charcoal text-white text-xs font-bold rounded-full hover:bg-black transition-colors flex items-center gap-1.5 border-none shadow-sm cursor-pointer"
                  >
                    <Plus size={14} /> Yeni Müşteri Ekle
                  </button>
                </div>
              </div>

              {/* Aktif ve Pasif Müşteri Sekme Geçişi */}
              <div className="flex gap-2 mb-4 p-1 bg-zinc-100 rounded-full border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setClientTabScope('active')}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-full transition-colors ${clientTabScope === 'active' ? 'bg-emerald-500 text-white shadow-sm' : 'text-zinc-500 hover:text-charcoal'}`}
                >
                  🟢 Aktif Müşteriler ({clients.filter(c => c.isActive !== false).length})
                </button>
                <button
                  type="button"
                  onClick={() => setClientTabScope('passive')}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-full transition-colors ${clientTabScope === 'passive' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-charcoal'}`}
                >
                  ⚪ Pasif Müşteriler ({clients.filter(c => c.isActive === false).length})
                </button>
              </div>

              <div className="flex gap-2 mb-4 p-1 bg-zinc-100/70 rounded-full border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setClientTypeScope('all')}
                  className={`flex-1 py-1.5 text-[11px] font-extrabold rounded-full transition-colors ${clientTypeScope === 'all' ? 'bg-indigo-500 text-white shadow-sm' : 'text-zinc-500 hover:text-charcoal'}`}
                >
                  Tümü
                </button>
                <button
                  type="button"
                  onClick={() => setClientTypeScope('owner')}
                  className={`flex-1 py-1.5 text-[11px] font-extrabold rounded-full transition-colors ${clientTypeScope === 'owner' ? 'bg-indigo-500 text-white shadow-sm' : 'text-zinc-500 hover:text-charcoal'}`}
                >
                  🏠 Mülk Sahipleri
                </button>
                <button
                  type="button"
                  onClick={() => setClientTypeScope('seeker')}
                  className={`flex-1 py-1.5 text-[11px] font-extrabold rounded-full transition-colors ${clientTypeScope === 'seeker' ? 'bg-indigo-500 text-white shadow-sm' : 'text-zinc-500 hover:text-charcoal'}`}
                >
                  🔍 Mülk Arayanlar
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {(() => {
                  const filteredClients = clients.filter(c => {
                    const isTabMatch = clientTabScope === 'active' ? (c.isActive !== false) : (c.isActive === false);
                    if (!isTabMatch) return false;

                    if (clientTypeScope === 'all') return true;
                    if (clientTypeScope === 'owner') return c.musteriTipi === 'Mülk Sahibi' || c.musteriTipi === 'SATICI' || c.musteriTipi === 'KIRAYA_VEREN' || c.musteriTipi === 'KİRAYA VEREN';
                    if (clientTypeScope === 'seeker') return c.musteriTipi === 'ALICI' || c.musteriTipi === 'KIRACI' || c.musteriTipi === 'KİRACI';
                    return true;
                  });

                  return filteredClients.length === 0 ? (
                    <div className="p-8 text-center text-zinc-400 text-xs font-bold border-2 border-dashed border-zinc-200 rounded-2xl">
                      Bu kategoride müşteri bulunmamaktadır.
                    </div>
                  ) : (
                    filteredClients.map(c => (
                      <div key={c.id} className={`p-4 rounded-2xl flex justify-between items-center border transition-all group hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-500/50 ${c.isActive !== false ? 'bg-white dark:bg-zinc-100 border-zinc-200 dark:border-zinc-200 shadow-sm' : 'bg-white dark:bg-zinc-100 border-zinc-200 dark:border-zinc-200 opacity-70'}`}>
                        <div className="flex items-center sm:items-start gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                          <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-200 border border-zinc-100 dark:border-zinc-200 flex items-center justify-center text-zinc-400 dark:text-zinc-400 shrink-0 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/20 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:border-emerald-100 dark:group-hover:border-emerald-500/30 transition-colors">
                            <User size={18} />
                          </div>
                          <div>
                            <div className="flex gap-2 items-center flex-wrap">
                              <strong className="font-extrabold text-sm text-charcoal dark:text-zinc-950 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{c.ad} {c.soyad}</strong>
                              <span className={`text-[9px] font-extrabold text-slate-900 px-2 py-0.5 border border-slate-900/50 rounded-full uppercase ${c.musteriTipi === 'ALICI' ? 'bg-pastelGreen' :
                                c.musteriTipi === 'KIRACI' ? 'bg-pastelBlue' :
                                  c.musteriTipi === 'SATICI' ? 'bg-pastelPink' : 'bg-[#FED7AA]'
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
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-xs font-bold text-slate-900 px-3 py-1 rounded-full bg-pastelYellow">
                            {c.tip}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleClientStatus(c.id, c.isActive !== false)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${c.isActive !== false
                              ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800 border-zinc-400'
                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-400'
                              }`}
                          >
                            {c.isActive !== false ? 'Pasife Al' : 'Aktife Al'}
                          </button>
                        </div>
                      </div>
                    ))
                  );
                })()}
              </div>
            </div>

            {/* Yeni Müşteri Ekle Pop-up Modal */}
            {showAddClientModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full relative border-none shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-3">
                    <div>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Müşteri İşlemleri</span>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal mt-0.5">Yeni Müşteri Ekle</h2>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 border border-charcoal rounded-full hover:bg-zinc-100 text-charcoal cursor-pointer"
                      onClick={() => setShowAddClientModal(false)}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleAddClient} className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-600 block mb-1">Ad Soyad</label>
                      <input
                        type="text"
                        className="w-full text-xs p-3 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                        placeholder="Örn: Murat Demir"
                        value={newClientName}
                        onChange={e => setNewClientName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-600 block mb-1">Telefon Numarası</label>
                      <input
                        type="text"
                        className="w-full text-xs p-3 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                        placeholder="Örn: 0505 123 45 67"
                        value={newClientPhone}
                        onChange={e => setNewClientPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-zinc-600 block mb-1">Müşteri Tipi</label>
                        <select
                          className="w-full text-xs p-3 border-2 border-charcoal rounded-full bg-white focus:outline-none"
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
                        <label className="text-xs font-bold text-zinc-600 block mb-1">Tercih Ettiği Tip</label>
                        <select
                          className="w-full text-xs p-3 border-2 border-charcoal rounded-full bg-white focus:outline-none"
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
                        <label className="text-xs font-bold text-zinc-600 block mb-1">Maksimum Bütçe / Fiyat (TL)</label>
                        <input
                          type="number"
                          className="w-full text-xs p-3 border-2 border-charcoal rounded-full bg-white focus:outline-none"
                          placeholder="Örn: 3500000"
                          value={newClientBudget}
                          onChange={e => setNewClientBudget(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-charcoal text-white text-xs font-extrabold rounded-full hover:bg-black transition-colors border-none cursor-pointer"
                      >
                        Müşteriyi Kaydet
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddClientModal(false)}
                        className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-extrabold rounded-full transition-colors border-none cursor-pointer"
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Calculator Tab */}
        {activeTab === 'calculator' && (
          <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">

            {/* Unified Single Digital Screen Card */}
            <div className="bento-card bg-zinc-900 text-white border-4 border-zinc-800 p-6 md:p-8 rounded-3xl shadow-xl">

              {/* Header Bar */}
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-zinc-800 flex-wrap gap-3">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-wider text-zinc-100 uppercase flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10B981]" />
                  Komisyon Payı Hesap Makinesi
                </h2>

              </div>

              <div className="flex flex-col gap-6">

                {/* 1. GİRDİ ALANLARI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono font-bold text-zinc-400 block mb-2 uppercase tracking-wider">
                      Brüt Komisyon Bedeli (TL)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full text-base p-3.5 rounded-2xl pl-11 bg-zinc-800 border border-zinc-700 focus:outline-none focus:border-emerald-500 transition-colors font-mono font-bold text-emerald-400 shadow-inner"
                        value={grossCommission}
                        onChange={e => setGrossCommission(Number(e.target.value))}
                      />
                      <DollarSign size={20} className="absolute left-4 top-3.5 text-zinc-500" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono font-bold text-zinc-400 block mb-2 uppercase tracking-wider">
                      Çalışma Senaryosu
                    </label>
                    <select
                      className="w-full text-sm p-3.5 rounded-2xl bg-zinc-800 border border-zinc-700 focus:outline-none focus:border-emerald-500 transition-colors font-mono font-semibold text-zinc-200 cursor-pointer shadow-inner"
                      value={calcScenario}
                      onChange={e => setCalcScenario(e.target.value as any)}
                    >
                      <option value="A" className="bg-zinc-900 text-white">Senaryo A - Kendi Müşterisi</option>
                      <option value="B" className="bg-zinc-900 text-white">Senaryo B - Ortak Çalışma (Ofis İçi)</option>
                      <option value="C" className="bg-zinc-900 text-white">Senaryo C - Dış Ortaklı Paylaşım</option>
                    </select>
                  </div>
                </div>

                {/* Senaryo Detay Metni */}
                <div className="p-4 rounded-2xl bg-zinc-800 border border-zinc-800 text-xs font-mono flex flex-col gap-1.5 leading-relaxed text-zinc-300 shadow-inner">
                  {calcScenario === 'A' && (
                    <p>**Senaryo A:** Portföy de alıcı da size aittir. Brüt komisyondan Yetkili tarafından belirlenen <span className="text-emerald-400 font-bold">%{commSettings.aOfis} Ofis Payı</span> kesildikten sonra kalanın tamamı (<span className="text-emerald-400 font-bold">%{commSettings.aDanisman}</span>) sizin hakedişinizdir.</p>
                  )}
                  {calcScenario === 'B' && (
                    <p>**Senaryo B:** Ofis içi iş ortaklığı. Komisyon oranları: Ofis <span className="text-emerald-400 font-bold">%{commSettings.bOfis}</span>, Portföyü getiren danışman <span className="text-emerald-400 font-bold">%{commSettings.bPortfoySahibi}</span>, Müşteriyi getiren danışman <span className="text-emerald-400 font-bold">%{commSettings.bMusteriGetiren}</span>.</p>
                  )}
                  {calcScenario === 'C' && (
                    <p>**Senaryo C:** Dış emlakçıyla ortak çalışma. Toplam komisyonun <span className="text-emerald-400 font-bold">%{commSettings.cDisOrtak}</span>'ı doğrudan dış ortağa ödenir. Kalan %50 içinden ofis payı <span className="text-emerald-400 font-bold">%{commSettings.cOfis}</span> ve sizin payınız <span className="text-emerald-400 font-bold">%{commSettings.cDanisman}</span> hesaplanır.</p>
                  )}
                </div>

                {/* 2. DİJİTAL LCD PAYLAŞIM SONUÇLARI PANELLERİ */}
                <div className="pt-4 border-t border-zinc-800">
                  <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest mb-3">
                    HESAPLANAN PAYLAŞIM SONUÇLARI
                  </h3>

                  <div className="p-5 rounded-2xl bg-zinc-800 border border-zinc-800 shadow-inner flex flex-col gap-4 font-mono">
                    <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-800 text-zinc-400 flex-wrap gap-1">
                      <span>Toplam Komisyon Bedeli:</span>
                      <strong className="text-white text-base tracking-wider font-bold">{grossCommission.toLocaleString('tr-TR')} TL</strong>
                    </div>

                    {calcScenario === 'A' && (
                      <>
                        <div className="flex justify-between items-center text-xs text-zinc-400 flex-wrap gap-1">
                          <span>Ofis Payı (%{commSettings.aOfis}):</span>
                          <strong className="text-zinc-200">{calcResults.ofis.toLocaleString('tr-TR')} TL</strong>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-3 border-t border-zinc-800 flex-wrap gap-1">
                          <span className="font-bold text-emerald-400">Hakedişiniz (%{commSettings.aDanisman}):</span>
                          <strong className="text-emerald-400 text-lg sm:text-xl tracking-wider font-extrabold">{calcResults.danisman.toLocaleString('tr-TR')} TL</strong>
                        </div>
                      </>
                    )}

                    {calcScenario === 'B' && (
                      <>
                        <div className="flex justify-between items-center text-xs text-zinc-400 flex-wrap gap-1">
                          <span>Ofis Payı (%{commSettings.bOfis}):</span>
                          <strong className="text-zinc-200">{calcResults.ofis.toLocaleString('tr-TR')} TL</strong>
                        </div>
                        <div className="flex justify-between items-center text-xs text-zinc-400 flex-wrap gap-1">
                          <span>Portföy Getiren Danışman (%{commSettings.bPortfoySahibi}):</span>
                          <strong className="text-zinc-200">{calcResults.portfoySahibi.toLocaleString('tr-TR')} TL</strong>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-3 border-t border-zinc-800 flex-wrap gap-1">
                          <span className="font-bold text-emerald-400">Müşteri Getiren Danışman (%{commSettings.bMusteriGetiren}):</span>
                          <strong className="text-emerald-400 text-lg sm:text-xl tracking-wider font-extrabold">{calcResults.musteriGetiren.toLocaleString('tr-TR')} TL</strong>
                        </div>
                      </>
                    )}

                    {calcScenario === 'C' && (
                      <>
                        <div className="flex justify-between items-center text-xs text-zinc-400 flex-wrap gap-1">
                          <span>Dış Ortak Payı (%{commSettings.cDisOrtak}):</span>
                          <strong className="text-zinc-200">{calcResults.disOrtak.toLocaleString('tr-TR')} TL</strong>
                        </div>
                        <div className="flex justify-between items-center text-xs text-zinc-400 flex-wrap gap-1">
                          <span>Kalan Pay (İç Bölüşüm):</span>
                          <strong className="text-zinc-200">{(grossCommission - calcResults.disOrtak).toLocaleString('tr-TR')} TL</strong>
                        </div>
                        <div className="flex justify-between items-center text-xs text-zinc-400 flex-wrap gap-1">
                          <span>Ofis Payı (%{commSettings.cOfis} of remaining):</span>
                          <strong className="text-zinc-200">{calcResults.ofis.toLocaleString('tr-TR')} TL</strong>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-3 border-t border-zinc-800 flex-wrap gap-1">
                          <span className="font-bold text-emerald-400">Hakedişiniz (%{commSettings.cDanisman} of remaining):</span>
                          <strong className="text-emerald-400 text-lg sm:text-xl tracking-wider font-extrabold">{calcResults.danisman.toLocaleString('tr-TR')} TL</strong>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 font-mono leading-relaxed pt-2 border-t border-zinc-800/80">
                  * Bu oranlar Yetkili (Broker) tarafından belirlenen oranlar üzerinden dinamik hesaplanır.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 6: Office Analytics (YETKILI only) */}
        {activeTab === 'analytics' && user?.rol === 'YETKILI' && (
          <div className="flex flex-col gap-6 w-full">

            {/* Dashboard Header */}
            <div className="flex flex-wrap justify-between items-center md:items-start mb-2 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-charcoal">Ciro & Performans</h2>
                  <p className="text-xs text-zinc-500 font-medium mt-1">Ofis geneli finansal ve performans metriklerini detaylı analiz edin.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => token && fetchDashboardData(token)}
                  className="px-5 py-2 bg-white border border-zinc-200 text-charcoal rounded-full text-xs font-bold hover:bg-zinc-50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  ↻ Yenile
                </button>
              </div>
            </div>

            {dashboardLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-zinc-400" />
              </div>
            ) : dashboardData ? (
              <>
                {/* ═══ BÖLÜM 1: ÜST KPI KARTLARI (4 Kolon) ═══ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                  {/* KPI 1: Aylık Ofis Cirosu */}
                  <div className="bg-white rounded-3xl p-6 border-none shadow-none">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                        <Banknote size={20} className="text-emerald-700" />
                      </div>
                      {dashboardData.ciroDegisimYuzde !== 0 && (
                        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${dashboardData.ciroDegisimYuzde > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {dashboardData.ciroDegisimYuzde > 0 ? '↑' : '↓'} %{Math.abs(dashboardData.ciroDegisimYuzde)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-charcoal/50 uppercase tracking-wider mb-1">Aylık Ofis Cirosu</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-charcoal">
                      {dashboardData.aylikCiro.toLocaleString('tr-TR')} ₺
                    </p>
                  </div>

                  {/* KPI 2: Yeni Müşteri */}
                  <div className="bg-white rounded-3xl p-6 border-none shadow-none">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
                        <UserPlus size={20} className="text-blue-700" />
                      </div>
                      {dashboardData.musteriDegisimYuzde !== 0 && (
                        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${dashboardData.musteriDegisimYuzde > 0
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {dashboardData.musteriDegisimYuzde > 0 ? '↑' : '↓'} %{Math.abs(dashboardData.musteriDegisimYuzde)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-charcoal/50 uppercase tracking-wider mb-1">Yeni Müşteri</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-charcoal">
                      {dashboardData.yeniMusteriSayisi}
                    </p>
                  </div>

                  {/* KPI 3: Kapanan İşlem */}
                  <div className="bg-white rounded-3xl p-6 border-none shadow-none">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
                        <BadgeCheck size={20} className="text-amber-700" />
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-charcoal/50 uppercase tracking-wider mb-1">Kapanan İşlem</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-charcoal">
                      {dashboardData.kapananIslemSayisi}
                    </p>
                  </div>

                  {/* KPI 4: Aktif İlan Stoğu */}
                  <div className="bg-white rounded-3xl p-6 border-none shadow-none">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
                        <Building2 size={20} className="text-purple-700" />
                      </div>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 whitespace-nowrap">
                        {dashboardData.aktifIlanAdet} ilan
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-charcoal/50 uppercase tracking-wider mb-1">Aktif İlan Stoğu</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-charcoal">
                      {dashboardData.aktifIlanBedeli.toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                </div>

                {/* ═══ BÖLÜM 2: GRAFİKLER (2 Kolon) ═══ */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                  {/* Sol: Aylık Ciro Trend Grafiği (İnteraktif) */}
                  <div className="lg:col-span-3 bg-white rounded-3xl p-6 border-none shadow-none">
                    <p className="text-[11px] font-bold text-charcoal/50 uppercase tracking-wider mb-1">Aylık Ciro Trendi</p>
                    <p className="text-lg font-extrabold text-charcoal mb-4">Son 6 Ay</p>
                    {(() => {
                      const trend = dashboardData.aylikCiroTrend || [];
                      if (trend.length === 0) return <p className="text-xs text-zinc-400 italic">Veri yok</p>;
                      const maxCiro = Math.max(...trend.map((t: any) => t.ciro), 1);
                      const chartW = 100;
                      const chartH = 50;
                      const padX = 8;
                      const padY = 8;
                      const drawW = chartW - padX * 2;
                      const drawH = chartH - padY * 2;
                      const points = trend.map((t: any, i: number) => ({
                        x: padX + (i / Math.max(trend.length - 1, 1)) * drawW,
                        y: padY + drawH - (t.ciro / maxCiro) * drawH,
                        ciro: t.ciro,
                        ay: t.ay
                      }));
                      const linePoints = points.map((p: any) => `${p.x},${p.y}`).join(' ');
                      const areaPoints = `${points[0].x},${padY + drawH} ${linePoints} ${points[points.length - 1].x},${padY + drawH}`;

                      return (
                        <div className="relative">
                          <svg viewBox={`0 0 ${chartW} ${chartH + 10}`} className="w-full h-56">
                            <defs>
                              <linearGradient id="ciroGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                              </linearGradient>
                              <filter id="glow">
                                <feGaussianBlur stdDeviation="0.8" result="blur" />
                                <feMerge>
                                  <feMergeNode in="blur" />
                                  <feMergeNode in="SourceGraphic" />
                                </feMerge>
                              </filter>
                            </defs>

                            {/* Grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((frac, gi) => (
                              <g key={`grid-${gi}`}>
                                <line
                                  x1={padX} y1={padY + drawH - frac * drawH}
                                  x2={chartW - padX} y2={padY + drawH - frac * drawH}
                                  stroke="#e2e8f0" strokeWidth="0.2" strokeDasharray="0.8,0.8"
                                />
                                <text
                                  x={padX - 1} y={padY + drawH - frac * drawH + 0.8}
                                  textAnchor="end" className="text-[2px]" fill="#94a3b8"
                                >
                                  {(maxCiro * frac / 1000).toFixed(0)}K
                                </text>
                              </g>
                            ))}

                            {/* Area fill with animation */}
                            <polygon points={areaPoints} fill="url(#ciroGrad)" opacity="0.12">
                              <animate attributeName="opacity" from="0" to="0.12" dur="0.8s" fill="freeze" />
                            </polygon>

                            {/* Animated Line */}
                            <polyline
                              points={linePoints}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="0.7"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                              strokeDasharray="200"
                              strokeDashoffset="200"
                            >
                              <animate attributeName="stroke-dashoffset" from="200" to="0" dur="1.2s" fill="freeze" />
                            </polyline>

                            {/* Interactive Dots with hover zones */}
                            {points.map((p: any, i: number) => (
                              <g key={`dot-${i}`} className="chart-dot-group" style={{ cursor: 'pointer' }}>
                                {/* Vertical guide line (hidden, shown on hover via CSS) */}
                                <line
                                  x1={p.x} y1={padY} x2={p.x} y2={padY + drawH}
                                  stroke="#10b981" strokeWidth="0.15" opacity="0"
                                  className="chart-guideline"
                                />
                                {/* Invisible hover area */}
                                <rect
                                  x={p.x - 4} y={0} width={8} height={chartH + 10}
                                  fill="transparent"
                                  className="chart-hover-zone"
                                />
                                {/* Outer glow circle */}
                                <circle cx={p.x} cy={p.y} r="2.5" fill="#10b981" opacity="0" className="chart-dot-glow">
                                  <animate attributeName="r" from="0" to="2.5" dur="0.3s" fill="freeze" begin="0.8s" />
                                </circle>
                                {/* Main dot */}
                                <circle cx={p.x} cy={p.y} r="1" fill="white" stroke="#10b981" strokeWidth="0.5" className="chart-dot-main">
                                  <animate attributeName="r" from="0" to="1" dur="0.3s" fill="freeze" begin="0.8s" />
                                </circle>
                                {/* Tooltip background */}
                                <rect
                                  x={p.x - 10} y={p.y - 9} width={20} height={6}
                                  rx="1.5" fill="#1e293b" opacity="0"
                                  className="chart-tooltip-bg"
                                />
                                {/* Tooltip text */}
                                <text
                                  x={p.x} y={p.y - 5.2} textAnchor="middle"
                                  className="text-[2.2px] font-bold chart-tooltip-text"
                                  fill="white" opacity="0"
                                >
                                  {p.ciro.toLocaleString('tr-TR')} ₺
                                </text>
                                {/* Month label */}
                                <text x={p.x} y={chartH + 6} textAnchor="middle" className="text-[2.8px] font-bold" fill="#94a3b8">
                                  {p.ay}
                                </text>
                              </g>
                            ))}
                          </svg>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Sağ: Portföy Tipi Dağılımı - İnteraktif Donut */}
                  <div className="lg:col-span-2 bg-white rounded-3xl p-6 border-none shadow-none">
                    <p className="text-[11px] font-bold text-charcoal/50 uppercase tracking-wider mb-1">Portföy Dağılımı</p>
                    <p className="text-lg font-extrabold text-charcoal mb-4">Emlak Tipi</p>
                    {(() => {
                      const dist = dashboardData.portfoyTipDagilimi || [];
                      if (dist.length === 0) return <p className="text-xs text-zinc-400 italic">Veri yok</p>;
                      const total = dist.reduce((s: number, d: any) => s + d.adet, 0);
                      const colors = ['#f9a8d4', '#fde68a', '#93c5fd', '#c4b5fd', '#6ee7b7', '#fca5a5'];
                      let cumAngle = 0;
                      const cx = 50, cy = 50, r = 38, innerR = 24;

                      const slices = dist.map((d: any, i: number) => {
                        const sliceAngle = (d.adet / total) * 360;
                        const startAngle = cumAngle;
                        cumAngle += sliceAngle;
                        const endAngle = cumAngle;
                        const startRad = ((startAngle - 90) * Math.PI) / 180;
                        const endRad = ((endAngle - 90) * Math.PI) / 180;
                        const midRad = (((startAngle + endAngle) / 2 - 90) * Math.PI) / 180;
                        const x1o = cx + r * Math.cos(startRad);
                        const y1o = cy + r * Math.sin(startRad);
                        const x2o = cx + r * Math.cos(endRad);
                        const y2o = cy + r * Math.sin(endRad);
                        const ix1 = cx + innerR * Math.cos(endRad);
                        const iy1 = cy + innerR * Math.sin(endRad);
                        const ix2 = cx + innerR * Math.cos(startRad);
                        const iy2 = cy + innerR * Math.sin(startRad);
                        const largeArc = sliceAngle > 180 ? 1 : 0;
                        const path = `M ${x1o} ${y1o} A ${r} ${r} 0 ${largeArc} 1 ${x2o} ${y2o} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
                        const hoverTx = Math.cos(midRad) * 2;
                        const hoverTy = Math.sin(midRad) * 2;
                        return { ...d, path, color: colors[i % colors.length], hoverTx, hoverTy, pct: Math.round((d.adet / total) * 100) };
                      });

                      return (
                        <div className="flex flex-col items-center gap-4">
                          <svg viewBox="0 0 100 100" className="w-44 h-44">
                            {slices.map((s: any, i: number) => (
                              <path
                                key={`donut-${i}`}
                                d={s.path}
                                fill={s.color}
                                className="donut-slice"
                                style={{
                                  transformOrigin: `${cx}px ${cy}px`,
                                  transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                  const el = e.currentTarget;
                                  el.style.transform = `translate(${s.hoverTx}px, ${s.hoverTy}px)`;
                                  el.style.filter = 'brightness(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.15))';
                                  // Update center text
                                  const parent = el.closest('svg');
                                  const centerVal = parent?.querySelector('.donut-center-val') as SVGTextElement;
                                  const centerLabel = parent?.querySelector('.donut-center-label') as SVGTextElement;
                                  if (centerVal) centerVal.textContent = `${s.adet}`;
                                  if (centerLabel) centerLabel.textContent = `${s.tip} (${s.pct}%)`;
                                }}
                                onMouseLeave={(e) => {
                                  const el = e.currentTarget;
                                  el.style.transform = 'translate(0, 0)';
                                  el.style.filter = 'none';
                                  const parent = el.closest('svg');
                                  const centerVal = parent?.querySelector('.donut-center-val') as SVGTextElement;
                                  const centerLabel = parent?.querySelector('.donut-center-label') as SVGTextElement;
                                  if (centerVal) centerVal.textContent = `${total}`;
                                  if (centerLabel) centerLabel.textContent = 'Toplam';
                                }}
                              >
                                <animate attributeName="opacity" from="0" to="1" dur={`${0.3 + i * 0.15}s`} fill="freeze" />
                              </path>
                            ))}
                            <text x={cx} y={cy - 2} textAnchor="middle" className="text-[9px] font-extrabold donut-center-val text-charcoal" fill="currentColor" style={{ transition: 'all 0.2s' }}>{total}</text>
                            <text x={cx} y={cy + 5} textAnchor="middle" className="text-[3.5px] font-bold donut-center-label text-charcoal opacity-70" fill="currentColor" style={{ transition: 'all 0.2s' }}>Toplam</text>
                          </svg>
                          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                            {slices.map((s: any, i: number) => (
                              <div key={`legend-${i}`} className="flex items-center gap-1.5 cursor-default group">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125" style={{ background: s.color }}></span>
                                <span className="text-[11px] font-semibold text-charcoal/70 dark:text-zinc-300 group-hover:text-charcoal dark:group-hover:text-white transition-colors">{s.tip}</span>
                                <span className="text-[10px] text-charcoal/50 dark:text-zinc-400 font-bold">({s.pct}%)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* ═══ BÖLÜM 3: DANIŞMAN LİDERLİK TABLOSU ═══ */}
                <div className="bg-white rounded-3xl p-6 border-none shadow-none">
                  <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
                    <div>
                      <p className="text-[11px] font-bold text-charcoal/50 uppercase tracking-wider mb-1">EKİP PERFORMANSI</p>
                      <p className="text-lg font-extrabold text-charcoal">Danışman Liderlik Tablosu</p>
                    </div>
                    <Trophy size={22} className="text-amber-500" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-100 text-[11px] font-extrabold text-charcoal/50 uppercase">
                          <th className="pb-3 w-8">#</th>
                          <th className="pb-3 min-w-[160px]">Danışman</th>
                          <th className="pb-3 text-center min-w-[100px]">Aktif Portföy</th>
                          <th className="pb-3 text-center min-w-[100px]">Kapanan İşlem</th>
                          <th className="pb-3 text-center min-w-[100px]">Performans Puanı</th>
                          <th className="pb-3 text-right min-w-[140px]">Bu Ay Cirosu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(dashboardData.danismanPerformans || []).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-zinc-400 text-xs font-semibold italic">
                              Henüz danışman performans verisi bulunmamaktadır.
                            </td>
                          </tr>
                        ) : (
                          dashboardData.danismanPerformans.map((d: any, idx: number) => (
                            <tr
                              key={`lb-${d.id}`}
                              className="border-b border-slate-100 hover:bg-zinc-100 transition-colors cursor-pointer"
                            >
                              <td className="py-3.5 text-sm font-extrabold text-charcoal">
                                {idx === 0 ? (
                                  <span className="w-6 h-6 inline-flex items-center justify-center bg-amber-100 rounded-full">
                                    <Trophy size={13} className="text-amber-600" />
                                  </span>
                                ) : (
                                  <span className="text-charcoal/50">{idx + 1}</span>
                                )}
                              </td>
                              <td className="py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-charcoal/10 flex items-center justify-center text-xs font-extrabold text-charcoal/70">
                                    {d.ad?.charAt(0)}{d.soyad?.charAt(0)}
                                  </div>
                                  <span className="text-sm font-bold text-charcoal">{d.ad} {d.soyad}</span>
                                </div>
                              </td>
                              <td className="py-3.5 text-center">
                                <span className="text-sm font-extrabold text-charcoal/90">{d.aktifPortfoySayisi}</span>
                              </td>
                              <td className="py-3.5 text-center">
                                <span className="text-sm font-extrabold text-charcoal/90">{d.buAyKapananIslem}</span>
                              </td>
                              <td className="py-3.5 text-center">
                                <span className="text-sm font-extrabold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{Math.round(d.performansPuani || 0)}</span>
                              </td>
                              <td className="py-3.5 text-right">
                                <span className="text-sm font-extrabold text-emerald-600">
                                  {d.buAyCiro.toLocaleString('tr-TR')} ₺
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <TrendingUp size={40} className="text-zinc-300" />
                <p className="text-sm text-zinc-400 font-semibold">Dashboard verileri yüklenemedi.</p>
                <button
                  onClick={() => token && fetchDashboardData(token)}
                  className="px-4 py-2 bg-charcoal text-white text-xs font-bold rounded-full hover:bg-black transition-colors border-none cursor-pointer"
                >
                  Tekrar Dene
                </button>
              </div>
            )}

          </div>
        )}

        {/* Tab 7: Team / Consultant Management (YETKILI only) */}
        {activeTab === 'team' && user?.rol === 'YETKILI' && (
          <>
            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-charcoal">Ekip Yönetimi</h2>
                  <p className="text-xs text-zinc-500 font-medium mt-1">Ofisinizdeki gayrimenkul danışmanlarını ekleyin ve yönetin.</p>
                </div>
              </div>
              <span className={`px-4 py-1.5 border border-slate-900/50 shadow-sm rounded-full text-xs font-extrabold uppercase tracking-wide text-slate-900 ${packageType === 'BASIC' ? 'bg-pastelYellow' : 'bg-pastelGreen'
                }`}>
                {packageType} PAKET
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

              <div className="bento-card bg-white">

                {empError && (
                  <div className="p-4 rounded-2xl bg-red-100 text-red-900 text-xs font-semibold mb-4 flex items-center gap-2 border-none">
                    <AlertTriangle size={18} />
                    <span>{empError}</span>
                  </div>
                )}

                {/* Add Employee Form */}
                <form onSubmit={handleAddEmployee} className="flex flex-col gap-3 mb-6">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Ad Soyad"
                      className="flex-1 min-w-0 text-xs p-2 border-2 border-charcoal rounded-full bg-cream focus:outline-none"
                      value={newEmpName}
                      onChange={e => setNewEmpName(e.target.value)}
                      required
                    />
                    <input
                      type="email"
                      placeholder="E-posta"
                      className="flex-1 min-w-0 text-xs p-2 border-2 border-charcoal rounded-full bg-cream focus:outline-none"
                      value={newEmpEmail}
                      onChange={e => setNewEmpEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="py-2.5 bg-charcoal text-white text-xs font-bold rounded-full hover:bg-black transition-all shadow-none cursor-pointer">
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
                      className={`p-3 rounded-xl cursor-pointer transition-colors flex justify-between items-center text-xs border-none ${selectedEmployee?.id === emp.id ? 'bg-pastelYellow' : 'bg-cream hover:bg-zinc-100'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-[10px] shrink-0 overflow-hidden border border-transparent shadow-sm">
                          {emp.profilFoto ? (
                            <img src={emp.profilFoto} alt="Profil" className="w-full h-full object-cover" />
                          ) : (
                            <>{emp.ad ? emp.ad[0] : 'C'}{emp.soyad ? emp.soyad[0] : 'Y'}</>
                          )}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <strong>{emp.ad || ''} {emp.soyad || ''}</strong>
                            <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${emp.durum === 'Ofiste' ? 'bg-pastelGreen text-emerald-950' :
                              emp.durum === 'Sahada' ? 'bg-pastelYellow text-amber-950' :
                                'bg-zinc-200 text-zinc-700'
                              }`}>
                              {emp.durum === 'Ofiste' ? 'Ofiste' : emp.durum === 'Sahada' ? 'Sahada' : 'Pasif'}
                            </span>
                          </div>
                          <span className="block text-zinc-500 mt-0.5">{emp.eposta || ''}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <div>
                          <strong>{(emp.getirdigiPara || 0).toLocaleString('tr-TR')} TL</strong>
                          <span className="block text-[10px] text-zinc-400 mt-0.5">{emp.sozlesmeSayisi || 0} Sözleşme</span>
                        </div>
                        {user?.rol === 'YETKILI' && user.id !== emp.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserToDelete(emp);
                              setShowDeleteUserModal(true);
                            }}
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors mt-1 border-none cursor-pointer"
                            title="Çalışanı Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
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
                      <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xl shrink-0 overflow-hidden border border-transparent shadow-sm">
                          {selectedEmployee.profilFoto ? (
                            <img src={selectedEmployee.profilFoto} alt="Profil" className="w-full h-full object-cover" />
                          ) : (
                            <>{selectedEmployee.ad ? selectedEmployee.ad[0] : 'C'}{selectedEmployee.soyad ? selectedEmployee.soyad[0] : 'Y'}</>
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Danışman Detayı</span>
                          <h3 className="text-lg sm:text-xl font-extrabold text-charcoal mt-1">{selectedEmployee.ad} {selectedEmployee.soyad}</h3>
                        </div>
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
                      <div className="flex justify-between items-center py-2 border-b border-zinc-200 flex-wrap gap-3">
                        <span className="text-zinc-500">Durum:</span>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${selectedEmployee.durum === 'Ofiste'
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                          : selectedEmployee.durum === 'Sahada'
                            ? 'bg-amber-100 text-amber-950 border-amber-300'
                            : 'bg-zinc-100 text-zinc-700 border-zinc-300'
                          }`}>
                          {selectedEmployee.durum === 'Ofiste' ? 'Ofiste 🏢' : selectedEmployee.durum === 'Sahada' ? 'Sahada / Ofiste Değil 🏠' : (selectedEmployee.durum || 'Pasif')}
                        </span>
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
                      className="w-full py-2.5 bg-charcoal text-white text-xs font-bold rounded-full hover:bg-black transition-colors cursor-pointer border-none"
                    >
                      Şifreyi "Homey123!" Olarak Sıfırla
                    </button>
                    {user?.rol === 'YETKILI' && user.id !== selectedEmployee.id && (
                      <button
                        onClick={() => {
                          setUserToDelete(selectedEmployee);
                          setShowDeleteUserModal(true);
                        }}
                        className="w-full py-2.5 bg-red-50 text-red-600 text-xs font-bold rounded-full hover:bg-red-100 transition-colors border-none cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Trash2 size={14} /> Kullanıcıyı Sil
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedEmployee(null)}
                      className="w-full py-2 text-zinc-500 text-xs font-bold rounded-full hover:bg-zinc-100 transition-colors cursor-pointer border-none"
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
                        <h3 className="text-lg sm:text-xl font-extrabold text-charcoal mt-0.5">Ofis Ekip Özeti</h3>
                      </div>
                      <span className="px-3 py-1 bg-pastelYellow border border-slate-900/50 rounded-full text-xs font-extrabold text-slate-900 uppercase">
                        {employees.length} Aktif Uzman
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                      Sol taraftaki listeden bir danışman seçerek detaylarını inceleyebilir, şifresini sıfırlayabilir veya performansını takip edebilirsiniz.
                    </p>

                    <div className="p-4 rounded-2xl bg-cream flex flex-col gap-3 text-xs border-none mb-4">
                      <div className="flex justify-between items-center flex-wrap gap-3">
                        <span>Mevcut Danışman Sayısı:</span>
                        <strong className="font-extrabold">{employees.length} Kullanıcı</strong>
                      </div>
                      <div className="flex justify-between items-center flex-wrap gap-3">
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
          </>
        )}

        {/* Tab 8: Dedicated Subscription & License Management Page (YETKILI only) */}
        {activeTab === 'subscription' && user?.rol === 'YETKILI' && (
          <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-charcoal">Lisans & Abonelik</h2>
                  <p className="text-xs text-zinc-500 font-medium mt-1">Firmanızın lisans, paket ve abonelik ayarlarını yönetin.</p>
                </div>
              </div>
              <span className="px-4 py-1.5 bg-pastelYellow border-2 border-slate-900/50 rounded-full text-xs font-extrabold uppercase tracking-wide text-slate-900 shadow-sm">
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
                    <div className="flex justify-between items-center text-sm font-extrabold flex-wrap gap-3">
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

                    <div className="flex justify-between items-center text-xs text-zinc-500 font-semibold flex-wrap gap-3">
                      <span>Başlangıç: {subInfo?.mevcutPaket?.baslangicTarihi ? new Date(subInfo.mevcutPaket.baslangicTarihi).toLocaleDateString('tr-TR') : 'Bugün'}</span>
                      <span>Bitiş: {subInfo?.mevcutPaket?.bitisTarihi ? new Date(subInfo.mevcutPaket.bitisTarihi).toLocaleDateString('tr-TR') : '30 Gün Sonra'}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border-none flex flex-col gap-2 mt-2">
                      <div className="flex justify-between items-center text-xs flex-wrap gap-3">
                        <span className="text-zinc-500">Mevcut Ödeme Periyodu:</span>
                        <strong className="font-extrabold">{subInfo?.mevcutPaket?.periyot === 'Yillik' ? 'Yıllık Abonelik' : subInfo?.mevcutPaket?.periyot === 'Aylik' ? 'Aylık Abonelik' : 'Deneme Süreci'}</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-zinc-100 pt-2 flex-wrap gap-3">
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
                    <div className="p-5 rounded-2xl bg-pastelGreen/60 border-2 border-emerald-600 flex flex-col gap-3">
                      <div className="flex justify-between items-center flex-wrap gap-3">
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
                          className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all border-none ${schedPeriyot === 'AYLIK' ? 'bg-white text-charcoal shadow-sm' : 'text-zinc-500 bg-transparent'
                            }`}
                        >
                          Aylık Ödeme
                        </button>
                        <button
                          type="button"
                          onClick={() => setSchedPeriyot('YILLIK')}
                          className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all border-none ${schedPeriyot === 'YILLIK' ? 'bg-white text-charcoal shadow-sm' : 'text-zinc-500 bg-transparent'
                            }`}
                        >
                          Yıllık Ödeme (%20 İndirimli)
                        </button>
                      </div>

                      {/* Target Package Selection Cards */}
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          onClick={() => setSchedPaketTipi('BASIC')}
                          className={`p-3 rounded-2xl cursor-pointer border-2 transition-all flex flex-col justify-between ${schedPaketTipi === 'BASIC' ? 'border-slate-900/50 bg-pastelBlue text-slate-900' : 'border-zinc-200 bg-white text-charcoal hover:bg-zinc-100'
                            }`}
                        >
                          <span className="text-xs font-extrabold block">BASIC Paket</span>
                          <span className={`text-[10px] block mt-1 ${schedPaketTipi === 'BASIC' ? 'text-slate-800' : 'text-zinc-500'}`}>4 Danışman Kotası</span>
                        </div>

                        <div
                          onClick={() => setSchedPaketTipi('PREMIUM')}
                          className={`p-3 rounded-2xl cursor-pointer border-2 transition-all flex flex-col justify-between ${schedPaketTipi === 'PREMIUM' ? 'border-slate-900/50 bg-pastelGreen text-slate-900' : 'border-zinc-200 bg-white text-charcoal hover:bg-zinc-100'
                            }`}
                        >
                          <span className="text-xs font-extrabold block">PREMIUM Paket</span>
                          <span className={`text-[10px] block mt-1 ${schedPaketTipi === 'PREMIUM' ? 'text-slate-800' : 'text-zinc-500'}`}>Sınırsız Danışman</span>
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
          <div className="bento-card bg-zinc-900 text-white border-4 border-zinc-800 p-6 md:p-8 rounded-3xl shadow-xl">
            <div className="flex flex-wrap justify-between items-center mb-6 pb-4 border-b border-zinc-800 gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-wider text-zinc-100 uppercase flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10B981]" />
                  Komisyon Ayarları
                </h2>
                <p className="text-xs text-zinc-400 font-mono mt-1">Firmanıza özel satış, kiralama, ofis içi ve dışı komisyon paylaşımlarını yönetin.</p>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm rounded-full transition-colors flex items-center gap-2 shadow-lg cursor-pointer"
              >
                {isSavingSettings ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Değişiklikleri Kaydet
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800 mb-6 gap-6 overflow-x-auto">
              <button
                onClick={() => setSettingsActiveTab('standartlar')}
                className={`pb-3 text-sm font-bold font-mono transition-colors relative whitespace-nowrap ${settingsActiveTab === 'standartlar' ? 'text-emerald-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Satış & Kiralama Standartları
                {settingsActiveTab === 'standartlar' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400"></div>}
              </button>
              <button
                onClick={() => setSettingsActiveTab('disOfis')}
                className={`pb-3 text-sm font-bold font-mono transition-colors relative whitespace-nowrap ${settingsActiveTab === 'disOfis' ? 'text-emerald-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Ofis Dışı Paylaşım
                {settingsActiveTab === 'disOfis' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400"></div>}
              </button>
              <button
                onClick={() => setSettingsActiveTab('iciOfis')}
                className={`pb-3 text-sm font-bold font-mono transition-colors relative whitespace-nowrap ${settingsActiveTab === 'iciOfis' ? 'text-emerald-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Ofis İçi Prim & Hakediş
                {settingsActiveTab === 'iciOfis' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400"></div>}
              </button>
            </div>

            {/* Content Container */}
            <div className="flex flex-col gap-6">

              {settingsActiveTab === 'standartlar' && (
                <div className="flex flex-col gap-6">
                  {/* Sistem & Güvenlik Ayarları */}
                  <div>
                    <h3 className="text-sm font-mono font-bold mb-3 text-zinc-300 border-b border-zinc-800 pb-2 flex items-center justify-between uppercase tracking-wider flex-wrap gap-3">
                      <span>Sistem & Güvenlik Ayarları</span>
                    </h3>

                    <div className="border border-zinc-800 rounded-2xl bg-zinc-800 text-zinc-200 shadow-inner overflow-hidden font-mono mb-6">
                      <div className="flex items-center justify-between p-4 hover:bg-zinc-800/40 transition-colors flex-wrap gap-3">
                        <div>
                          <h4 className="font-bold text-white mb-1">Portföylerde Yetkilendirme Sözleşmesi Zorunlu Olsun Mu?</h4>
                          <p className="text-xs text-zinc-400">Aktif edildiğinde, sözleşmesi eksik olan portföylerin yayınlanması ve bu portföylere randevu oluşturulması engellenir.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={firmaSettings.YetkilendirmeSarti === true}
                            onChange={(e) => setFirmaSettings({ ...firmaSettings, YetkilendirmeSarti: e.target.checked })}
                          />
                          <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Kiralama Parametreleri Tablosu */}
                  <div>
                    <h3 className="text-sm font-mono font-bold mb-3 text-zinc-300 border-b border-zinc-800 pb-2 flex items-center justify-between uppercase tracking-wider flex-wrap gap-3">
                      <span>Kiralama Parametreleri</span>
                      <span className="text-[11px] text-zinc-500 font-normal">Yasal & Genel Standartlar</span>
                    </h3>

                    <div className="border border-zinc-800 rounded-2xl bg-zinc-800 text-zinc-200 shadow-inner overflow-x-auto overflow-y-hidden font-mono">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-800/80 border-b border-zinc-700 text-zinc-400 font-extrabold uppercase tracking-wider">
                            <th className="py-2.5 px-4 w-1/4">Parametre / Tanım</th>
                            <th className="py-2.5 px-4 w-1/4">Açıklama</th>
                            <th className="py-2.5 px-4 text-right w-1/2">Standart Değerler</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          <tr className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-white">
                              Emlak Komisyonu (Hizmet Bedeli)
                            </td>
                            <td className="py-3 px-4 text-zinc-400">
                              Yasal tavan 1 aylık kira bedelidir. Uygulamada tamamını kiracı öder.
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <input
                                  type="number"
                                  step="0.1"
                                  className="w-20 text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                                  value={firmaSettings.KiralamaKomisyonOrani}
                                  onChange={e => setFirmaSettings({ ...firmaSettings, KiralamaKomisyonOrani: Number(e.target.value) })}
                                />
                                <span className="text-zinc-300 font-semibold">Aylık Kira</span>
                              </div>
                            </td>
                          </tr>

                          <tr className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-white">
                              Depozito Üst Sınırı
                            </td>
                            <td className="py-3 px-4 text-zinc-400">
                              TBK m. 342 uyarınca üst sınır 3 kiradır. Piyasada 1-2 aylık kira uygulanır.
                            </td>
                            <td className="py-3 px-4 text-right">
                              <select
                                className="text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl font-bold text-zinc-200 font-mono focus:outline-none focus:border-emerald-500 shadow-inner cursor-pointer"
                                value={firmaSettings.KiralamaDepozitoSiniri}
                                onChange={e => setFirmaSettings({ ...firmaSettings, KiralamaDepozitoSiniri: Number(e.target.value) })}
                              >
                                <option value={1} className="bg-zinc-900 text-white">1 Aylık Kira</option>
                                <option value={2} className="bg-zinc-900 text-white">2 Aylık Kira</option>
                                <option value={3} className="bg-zinc-900 text-white">3 Aylık Kira</option>
                              </select>
                            </td>
                          </tr>

                          <tr className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-white">
                              Peşin Kira Tahsilatı
                            </td>
                            <td className="py-3 px-4 text-zinc-400">
                              Sözleşme imza ve teslim tarihinde peşin alınan kullanım bedeli.
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <input
                                  type="number"
                                  className="w-20 text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                                  value={firmaSettings.KiralamaPesinKira}
                                  onChange={e => setFirmaSettings({ ...firmaSettings, KiralamaPesinKira: Number(e.target.value) })}
                                />
                                <span className="text-zinc-300 font-semibold">Aylık Kira</span>
                              </div>
                            </td>
                          </tr>

                          <tr className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-white">
                              Kapora (Bağlanma Parası) Tipi
                            </td>
                            <td className="py-3 px-4 text-zinc-400">
                              Kiralama niyetini kesinleştirmek için alınan ön güvence bedeli.
                            </td>
                            <td className="py-3 px-4 text-right">
                              <select
                                className="text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl font-bold text-zinc-200 font-mono focus:outline-none focus:border-emerald-500 shadow-inner cursor-pointer"
                                value={firmaSettings.KiralamaKaporaTipi}
                                onChange={e => setFirmaSettings({ ...firmaSettings, KiralamaKaporaTipi: e.target.value })}
                              >
                                <option value="ESNEK" className="bg-zinc-900 text-white">Serbest Tutar (İşlem anında belirlenir)</option>
                                <option value="1_KIRA" className="bg-zinc-900 text-white">1 Aylık Kira Bedeli</option>
                              </select>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Satış Parametreleri Tablosu */}
                  <div>
                    <h3 className="text-sm font-mono font-bold mb-3 text-zinc-300 border-b border-zinc-800 pb-2 flex items-center justify-between uppercase tracking-wider flex-wrap gap-3">
                      <span>Satış Parametreleri</span>
                      <span className="text-[11px] text-zinc-500 font-normal">Yasal & Genel Standartlar</span>
                    </h3>

                    <div className="border border-zinc-800 rounded-2xl bg-zinc-800 text-zinc-200 shadow-inner overflow-x-auto overflow-y-hidden font-mono">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-800/80 border-b border-zinc-700 text-zinc-400 font-extrabold uppercase tracking-wider">
                            <th className="py-2.5 px-4 w-1/4">Parametre / Tanım</th>
                            <th className="py-2.5 px-4 w-1/4">Açıklama</th>
                            <th className="py-2.5 px-4 text-right w-1/2">Standart Değerler</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          <tr className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-white">
                              Satış Emlak Komisyonu (Hizmet Bedeli)
                            </td>
                            <td className="py-3 px-4 text-zinc-400">
                              Satış bedeli üzerinden hesaplanır. Yasal tavan %2 Alıcı + %2 Satıcı (KDV Dahil).
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex flex-col gap-2 items-end">
                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                  <span className="text-zinc-400 font-semibold">Alıcı: %</span>
                                  <input
                                    type="number"
                                    step="0.1"
                                    className="w-20 text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                                    value={firmaSettings.SatisAliciKomisyon}
                                    onChange={e => setFirmaSettings({ ...firmaSettings, SatisAliciKomisyon: Number(e.target.value) })}
                                  />
                                  <span className="text-zinc-500 font-bold px-1">+</span>
                                  <span className="text-zinc-400 font-semibold">Satıcı: %</span>
                                  <input
                                    type="number"
                                    step="0.1"
                                    className="w-20 text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                                    value={firmaSettings.SatisSaticiKomisyon}
                                    onChange={e => setFirmaSettings({ ...firmaSettings, SatisSaticiKomisyon: Number(e.target.value) })}
                                  />
                                </div>
                                <div className="text-emerald-400 font-extrabold text-xs bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-800 font-mono">
                                  = Toplam %{(Number(firmaSettings.SatisAliciKomisyon) + Number(firmaSettings.SatisSaticiKomisyon)).toFixed(1)} (KDV Dahil)
                                </div>
                              </div>
                            </td>
                          </tr>

                          <tr className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-white">
                              Tapu Harcı Oranı
                            </td>
                            <td className="py-3 px-4 text-zinc-400">
                              Beyan edilen satış bedeli üzerinden harç dökümü (%2 Alıcı + %2 Satıcı).
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                <span className="text-zinc-400 font-semibold">Alıcı: %</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="w-20 text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                                  value={firmaSettings.TapuHarciAlici}
                                  onChange={e => setFirmaSettings({ ...firmaSettings, TapuHarciAlici: Number(e.target.value) })}
                                />
                                <span className="text-zinc-500 font-bold px-1">+</span>
                                <span className="text-zinc-400 font-semibold">Satıcı: %</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="w-20 text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                                  value={firmaSettings.TapuHarciSatici}
                                  onChange={e => setFirmaSettings({ ...firmaSettings, TapuHarciSatici: Number(e.target.value) })}
                                />
                              </div>
                            </td>
                          </tr>

                          <tr className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-white">
                              Döner Sermaye Bedeli (Tapu Maktu)
                            </td>
                            <td className="py-3 px-4 text-zinc-400">
                              Tapu Müdürlüğü tarafından her yıl belirlenen işlem ücreti.
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <input
                                  type="number"
                                  className="w-28 text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                                  value={firmaSettings.DonerSermayeBedeli}
                                  onChange={e => setFirmaSettings({ ...firmaSettings, DonerSermayeBedeli: Number(e.target.value) })}
                                />
                                <span className="text-zinc-300 font-semibold">TL</span>
                              </div>
                            </td>
                          </tr>

                          <tr className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-white">
                              Satış Kapora / Ön Ödeme Yüzdesi
                            </td>
                            <td className="py-3 px-4 text-zinc-400">
                              Satış anlaşması sağlandığında cayma durumlarına karşı alınan cayma tazminatı kaporası.
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-zinc-400 font-semibold">Kapora Oranı: %</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="w-20 text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                                  value={firmaSettings.SatisKaporaOrani}
                                  onChange={e => setFirmaSettings({ ...firmaSettings, SatisKaporaOrani: Number(e.target.value) })}
                                />
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {settingsActiveTab === 'disOfis' && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-sm font-mono font-bold mb-3 text-zinc-300 border-b border-zinc-800 pb-2 flex items-center justify-between uppercase tracking-wider flex-wrap gap-3">
                      <span>Ofis Dışı Paylaşım Kuralları</span>
                      <span className="text-[11px] text-zinc-500 font-normal">Harici Emlak Ofisleri İle Paylaşım</span>
                    </h3>

                    <div className="border border-zinc-800 rounded-2xl bg-zinc-800 text-zinc-200 shadow-inner overflow-x-auto overflow-y-hidden font-mono">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-800/80 border-b border-zinc-700 text-zinc-400 font-extrabold uppercase tracking-wider">
                            <th className="py-2.5 px-4 w-1/4">Paylaşım Modeli</th>
                            <th className="py-2.5 px-4 w-1/4">Açıklama</th>
                            <th className="py-2.5 px-4 text-right w-1/2">Paylaşım Oranları</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          <tr className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-white">
                              Başka Emlak Ofisi ile Komisyon Bölüşümü
                            </td>
                            <td className="py-3.5 px-4 text-zinc-400">
                              Portföy sahibi ofis ile alıcı/kiracı getiren dış emlak ofisi arasındaki brüt komisyon paylaşımı.
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex flex-col gap-2 items-end">
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-400 font-semibold">Portföy Sahibi Ofis: %</span>
                                  <input
                                    type="number"
                                    className="w-20 text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                                    value={firmaSettings.DisOfisPortfoyPayi}
                                    onChange={e => setFirmaSettings({ ...firmaSettings, DisOfisPortfoyPayi: Number(e.target.value) })}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-400 font-semibold">Müşteri Getiren Ofis: %</span>
                                  <input
                                    type="number"
                                    className="w-20 text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                                    value={firmaSettings.DisOfisMusteriPayi}
                                    onChange={e => setFirmaSettings({ ...firmaSettings, DisOfisMusteriPayi: Number(e.target.value) })}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {settingsActiveTab === 'iciOfis' && (
                <div className="flex flex-col gap-6">
                  {/* Standart Bölüşüm Tablosu */}
                  <div>
                    <h3 className="text-sm font-mono font-bold mb-3 text-zinc-300 border-b border-zinc-800 pb-2 flex items-center justify-between uppercase tracking-wider flex-wrap gap-3">
                      <span>Standart Bölüşüm</span>
                      <span className="text-[11px] text-zinc-500 font-normal">Genel Ofis Kuralları</span>
                    </h3>

                    <div className="border border-zinc-800 rounded-2xl bg-zinc-800 text-zinc-200 shadow-inner overflow-x-auto overflow-y-hidden font-mono">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-800/80 border-b border-zinc-700 text-zinc-400 font-extrabold uppercase tracking-wider">
                            <th className="py-2.5 px-4 w-1/4">Model / Tanım</th>
                            <th className="py-2.5 px-4 w-1/4">Açıklama</th>
                            <th className="py-2.5 px-4 text-right w-1/2">Oranlar & Değerler</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          <tr className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-white">
                              Danışmanlar Arası (Portföy vs Müşteri)
                            </td>
                            <td className="py-3 px-4 text-zinc-400">
                              Portföy getiren ve müşteri bulan danışmanlar arası komisyon paylaşımı.
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                <span className="text-zinc-400 font-semibold">Portföy: %</span>
                                <input
                                  type="number"
                                  className="w-20 text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                                  value={firmaSettings.IciPortfoyPayi}
                                  onChange={e => setFirmaSettings({ ...firmaSettings, IciPortfoyPayi: Number(e.target.value) })}
                                />
                                <span className="text-zinc-500 font-bold px-1">/</span>
                                <span className="text-zinc-400 font-semibold">Müşteri: %</span>
                                <input
                                  type="number"
                                  className="w-20 text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                                  value={firmaSettings.IciMusteriPayi}
                                  onChange={e => setFirmaSettings({ ...firmaSettings, IciMusteriPayi: Number(e.target.value) })}
                                />
                              </div>
                            </td>
                          </tr>

                          <tr className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-white">
                              Danışman - Broker Paylaşımı
                            </td>
                            <td className="py-3 px-4 text-zinc-400">
                              Danışmanın elde ettiği hakedişin ofis (broker) ile bölüşüm oranı.
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                <span className="text-zinc-400 font-semibold">Danışman: %</span>
                                <input
                                  type="number"
                                  className="w-20 text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                                  value={firmaSettings.BrokerDanismanPayi}
                                  onChange={e => setFirmaSettings({ ...firmaSettings, BrokerDanismanPayi: Number(e.target.value) })}
                                />
                                <span className="text-zinc-500 font-bold px-1">/</span>
                                <span className="text-zinc-400 font-semibold">Ofis: %</span>
                                <input
                                  type="number"
                                  className="w-20 text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                                  value={firmaSettings.BrokerOfisPayi}
                                  onChange={e => setFirmaSettings({ ...firmaSettings, BrokerOfisPayi: Number(e.target.value) })}
                                />
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Özel Modeller Tablosu */}
                  <div>
                    <h3 className="text-sm font-mono font-bold mb-3 text-zinc-300 border-b border-zinc-800 pb-2 flex items-center justify-between uppercase tracking-wider flex-wrap gap-3">
                      <span>Özel Modeller</span>
                      <span className="text-[11px] text-zinc-500 font-normal">Opsiyonel Hakediş Modelleri</span>
                    </h3>

                    <div className="border border-zinc-800 rounded-2xl bg-zinc-800 text-zinc-200 shadow-inner overflow-x-auto overflow-y-hidden font-mono">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-800/80 border-b border-zinc-700 text-zinc-400 font-extrabold uppercase tracking-wider">
                            <th className="py-2.5 px-4 w-1/5">Model Adı</th>
                            <th className="py-2.5 px-4 w-1/4">Mantık & Çalışma Şekli</th>
                            <th className="py-2.5 px-4 text-right w-7/12">Model Parametreleri</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          <tr className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-white">
                              Kademeli Ciro Primi Modeli
                            </td>
                            <td className="py-3 px-4 text-zinc-400">
                              Danışman ciro barajını aştıkça kendisine ödenen prim oranı kademeli artar.
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                <span className="text-zinc-400 font-semibold">Danışman: %</span>
                                <input
                                  type="number"
                                  className="w-20 text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                                  value={firmaSettings.KademeliDanismanPayi}
                                  onChange={e => setFirmaSettings({ ...firmaSettings, KademeliDanismanPayi: Number(e.target.value) })}
                                />
                                <span className="text-zinc-500 font-bold px-1">/</span>
                                <span className="text-zinc-400 font-semibold">Ofis: %</span>
                                <input
                                  type="number"
                                  className="w-20 text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                                  value={firmaSettings.KademeliOfisPayi}
                                  onChange={e => setFirmaSettings({ ...firmaSettings, KademeliOfisPayi: Number(e.target.value) })}
                                />
                              </div>
                            </td>
                          </tr>

                          <tr className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-white">
                              Masa Ücreti (Desk Fee) Modeli
                            </td>
                            <td className="py-3 px-4 text-zinc-400">
                              Danışman sabit masa kira ücreti öder, işlemlerden yüksek oranda prim alır.
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-zinc-400 font-semibold">Sabit Ücret:</span>
                                  <input
                                    type="number"
                                    className="w-24 text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                                    value={firmaSettings.MasaUcretiTutar}
                                    onChange={e => setFirmaSettings({ ...firmaSettings, MasaUcretiTutar: Number(e.target.value) })}
                                  />
                                  <span className="text-zinc-300 font-semibold">TL</span>
                                </div>
                                <span className="text-zinc-600 font-bold">|</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-zinc-400 font-semibold">Danışman Prim: %</span>
                                  <input
                                    type="number"
                                    className="w-20 text-xs p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                                    value={firmaSettings.MasaDanismanPayi}
                                    onChange={e => setFirmaSettings({ ...firmaSettings, MasaDanismanPayi: Number(e.target.value) })}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
        {activeTab === 'firmDocuments' && user?.rol === 'YETKILI' && (
          <FirmDocumentsTab token={token} showToast={showToast} />
        )}
        {activeTab === 'documentOperations' && (
          <DocumentOperationsTab token={token} portfolios={portfolios} user={user} clientProcesses={clientProcesses} fetchClientProcesses={() => { if (token) fetchClientProcesses(token) }} showToast={showToast} />
        )}
      </main>

      {/* Spacer to reserve width for the collapsed right panel */}
      <div className="w-20 shrink-0 bg-cream z-0 border-l border-zinc-100 hidden sm:block"></div>

      {/* RIGHT PANEL (Widgets & Schedule / Ajanda) */}
      <aside className={`absolute right-0 top-0 bottom-0 bg-cream border-none flex flex-col transition-all duration-300 z-50 shrink-0 ${rightPanelCollapsed ? 'w-20 p-4 items-center gap-6 shadow-[-5px_0_15px_rgba(0,0,0,0.02)] hidden sm:flex' : 'w-80 p-6 gap-6 shadow-[-20px_0_50px_rgba(0,0,0,0.15)] flex'
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
              className="p-3 rounded-full bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-charcoal dark:border-zinc-600 shadow-none transition-all cursor-pointer text-charcoal dark:text-zinc-200"
            >
              <Calendar size={18} />
            </button>

            {/* Collapsed Add Portfolio Button */}
            <button
              onClick={() => { setActiveTab('portfolios'); setShowAddPortfolioModal(true); setRightPanelCollapsed(false); }}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-full shadow-none transition-all border-none cursor-pointer"
              title="Yeni Portföy Ekle"
            >
              <Plus size={18} />
            </button>
            {/* Collapsed Add Appointment Button */}
            <button
              onClick={() => { setShowAddAppointmentModal(true); setRightPanelCollapsed(false); }}
              className="p-3 bg-pastelYellow text-amber-950 dark:text-amber-950 rounded-full hover:bg-amber-200 shadow-sm transition-all border border-amber-300 dark:border-transparent cursor-pointer"
              title="Yeni Randevu Oluştur"
            >
              <Calendar size={18} />
            </button>
          </div>
        ) : (
          <>
            {/* Top: Skeuomorphic & Modern Masa Takvimi (Desk Calendar Card) */}
            <div className="relative bg-[#FFFBEB] dark:bg-zinc-100 p-4 rounded-3xl border-2 border-amber-900/10 dark:border-zinc-200 shadow-lg flex flex-col gap-3 overflow-hidden">

              {/* 1. Spiral Halkalar (Ring Binding Details) */}
              <div className="absolute -top-3 left-0 right-0 flex justify-around px-6 pointer-events-none z-20">
                {[...Array(6)].map((_, i) => (
                  <div key={`side-spiral-${i}`} className="w-3 h-6 bg-gradient-to-b from-zinc-300 via-zinc-100 to-zinc-400 dark:from-zinc-400 dark:via-zinc-300 dark:to-zinc-500 rounded-full border border-zinc-500 shadow-sm flex flex-col justify-between items-center py-0.5">
                    <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full shadow-inner"></div>
                    <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full shadow-inner"></div>
                  </div>
                ))}
              </div>

              {/* Takvim Yaprak Banner */}
              <div className="flex justify-center items-center mt-1 border-b border-amber-200/60 dark:border-zinc-200/50 pb-2">
                <h4 className="font-black text-xs text-charcoal flex items-center justify-center gap-1.5 w-full">
                  <Calendar size={14} className="text-amber-800 dark:text-zinc-500" />
                  <span>AJANDA TAKVİMİ</span>
                </h4>
              </div>

              {/* Fiziksel Takvim Yaprağı (Dev Gün Rakamı & Ay) */}
              <div className="bg-white p-3 rounded-2xl border border-amber-200/80 dark:border-zinc-200/50 shadow-sm flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  {/* Dev Rakam Yaprağı */}
                  <div className="w-14 h-14 rounded-xl bg-amber-50 dark:bg-zinc-200 border border-amber-200 dark:border-zinc-300 flex flex-col items-center justify-center p-1 shrink-0 shadow-inner">
                    <span className="text-2xl font-black text-charcoal leading-none">
                      {selectedCalendarDay}
                    </span>
                    <span className="text-[8px] font-extrabold text-amber-800 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                      {calendarMonthName.slice(0, 3)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">SEÇİLİ TARİH</span>
                    <strong className="text-xs font-black text-charcoal capitalize block">
                      {selectedCalendarDay} {calendarMonthName} {calendarYear}
                    </strong>
                  </div>
                </div>

                {/* Takvim Navigasyonu */}
                <div className="flex gap-1 items-center shrink-0">
                  <button
                    type="button"
                    onClick={handleToday}
                    className="px-1.5 py-0.5 text-[8px] font-extrabold border border-amber-300 dark:border-zinc-400 rounded bg-amber-50 dark:bg-zinc-200 hover:bg-amber-100 dark:hover:bg-zinc-300 text-amber-900 dark:text-zinc-600 cursor-pointer transition-colors"
                    title="Bugüne Git"
                  >
                    Bugün
                  </button>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 border border-zinc-200 dark:border-zinc-200/50 rounded hover:bg-zinc-100 dark:hover:bg-zinc-200 cursor-pointer text-zinc-700 dark:text-zinc-300 transition-colors"
                    title="Önceki Ay"
                  >
                    <ChevronLeft size={10} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 border border-zinc-200 dark:border-zinc-200/50 rounded hover:bg-zinc-100 dark:hover:bg-zinc-200 cursor-pointer text-zinc-700 dark:text-zinc-300 transition-colors"
                    title="Sonraki Ay"
                  >
                    <ChevronLeft className="rotate-180" size={10} />
                  </button>
                </div>
              </div>

              {/* Izgara Gün Seçici */}
              <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-200/50">
                <div className="grid grid-cols-7 gap-0.5 text-[8px] text-center font-black">
                  {['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].map((d, di) => (
                    <span key={di} className="text-zinc-400">{d}</span>
                  ))}
                  {blankLeadingDays.map((_, i) => (
                    <span key={`blank-${i}`} className="p-0.5"></span>
                  ))}
                  {daysInMonthArray.map(day => {
                    const hasAppointments = appointments.some((app: any) => {
                      if (app.gun && app.ay && app.yil) {
                        return Number(app.gun) === day && Number(app.ay) === (calendarMonth + 1) && Number(app.yil) === calendarYear && app.durum !== 'REJECTED' && app.durum !== 'CANCELLED';
                      }
                      return false;
                    });
                    const isPastDate = new Date(calendarYear, calendarMonth, day) < new Date(new Date().setHours(0, 0, 0, 0));
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => !isPastDate && setSelectedCalendarDay(day)}
                        disabled={isPastDate}
                        className={`p-1 rounded transition-all relative flex flex-col items-center justify-center ${isPastDate ? 'text-zinc-300 dark:text-zinc-400 line-through cursor-not-allowed' :
                          selectedCalendarDay === day ? 'bg-charcoal text-white font-black scale-105 shadow-sm cursor-pointer' : 'hover:bg-amber-50 dark:hover:bg-zinc-200 cursor-pointer'
                          }`}
                      >
                        <span>{day}</span>
                        {hasAppointments && (
                          <span className={`w-1 h-1 rounded-full absolute bottom-0.5 ${selectedCalendarDay === day ? 'bg-amber-300 dark:bg-amber-400' : 'bg-amber-600 dark:bg-amber-500'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Buttons: Separate Portfolio and Appointment Buttons */}
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => { setActiveTab('portfolios'); setShowAddPortfolioModal(true); }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-3 px-5 rounded-full font-extrabold text-xs flex items-center justify-center gap-2 transition-all border-none cursor-pointer"
              >
                <Plus size={15} /> Yeni Portföy Ekle
              </button>
              <button
                onClick={() => setShowAddAppointmentModal(true)}
                className="w-full bg-pastelYellow hover:bg-amber-200 text-amber-950 dark:text-amber-950 py-3 px-5 rounded-full font-extrabold text-xs flex items-center justify-center gap-2 transition-all border border-amber-300 dark:border-transparent cursor-pointer shadow-sm"
              >
                <Calendar size={15} /> Yeni Randevu Oluştur
              </button>
            </div>

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
                    {dayAppointments.map((app: any) => {
                      const canManageAppointment = compareIds(app.portfoySahibiId, user?.id);
                      const canCancelAppointment = compareIds(app.talepEdenId, user?.id);

                      return (
                        <div key={app.id} className="relative">
                          <span className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-none ${app.durum === 'APPROVED' ? 'bg-pastelGreen' :
                            app.durum === 'PENDING' ? 'bg-pastelYellow' :
                              app.durum === 'CANCELLED' ? 'bg-zinc-300' : 'bg-pastelPink'
                            }`} />
                          <div className="text-xs flex flex-col gap-0.5">
                            <span className="font-extrabold text-charcoal">
                              {app.zaman || '12:00'} - {app.portfoyTip || 'Portföy'} Gösterimi
                            </span>
                            <span className="text-zinc-500">Uzman: {app.talepEden}</span>
                            <span className="text-zinc-500">Müşteri: {app.musteri}</span>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border border-charcoal uppercase ${app.durum === 'APPROVED' ? 'bg-pastelGreen text-emerald-950 border-emerald-300' :
                                app.durum === 'PENDING' ? 'bg-pastelYellow text-amber-950 border-amber-300' :
                                  app.durum === 'CANCELLED' ? 'bg-zinc-200 text-zinc-700 border-zinc-300' :
                                    'bg-pastelPink text-red-950 border-red-300'
                                }`}>
                                {app.durum === 'APPROVED' ? 'Onaylandı ✅' :
                                  app.durum === 'PENDING' ? 'Onay Bekliyor ⏳' :
                                    app.durum === 'CANCELLED' ? 'İptal Edildi 🚫' : 'Reddedildi ❌'}
                              </span>

                              {app.durum === 'PENDING' && (
                                <>
                                  {canManageAppointment && (
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleUpdateAppStatus(app.id, 'APPROVED')}
                                        className="px-2 py-0.5 bg-pastelGreen border border-charcoal rounded-full text-[9px] font-extrabold hover:bg-emerald-300 transition-colors cursor-pointer whitespace-nowrap"
                                      >
                                        Onayla
                                      </button>
                                      <button
                                        onClick={() => handleUpdateAppStatus(app.id, 'REJECTED')}
                                        className="px-2 py-0.5 bg-pastelPink border border-charcoal rounded-full text-[9px] font-extrabold hover:bg-pink-300 transition-colors cursor-pointer whitespace-nowrap"
                                      >
                                        Reddet
                                      </button>
                                    </div>
                                  )}

                                  {!canManageAppointment && canCancelAppointment && (
                                    <button
                                      onClick={() => handleUpdateAppStatus(app.id, 'CANCELLED')}
                                      className="px-2 py-0.5 bg-zinc-100 hover:bg-red-100 text-zinc-600 hover:text-red-700 border border-zinc-300 rounded-full text-[9px] font-extrabold transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                      İptal Et 🚫
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </>
        )}

      </aside>

      {/* Add Appointment Modal */}
      {showAddAppointmentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAppointmentFromModal}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full relative border-none shadow-none flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-1">
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">RANDEVU YÖNETİMİ</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal mt-1 flex items-center gap-2">
                  <Calendar size={22} className="text-amber-500" /> Yeni Randevu Oluştur
                </h2>
              </div>
              <button
                type="button"
                className="p-1.5 border border-charcoal rounded-full hover:bg-zinc-100 text-charcoal cursor-pointer"
                onClick={() => setShowAddAppointmentModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-zinc-500 mb-2">
              Portföy seçerek doğrudan kendi takviminize randevu ekleyin veya başka uzmanın portföyü için gösterim talebi gönderin.
            </p>

            {/* Portföy Seçimi */}
            <div>
              <label className="text-xs text-zinc-600 font-semibold block mb-1">
                Hedef Portföy (İlan) <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full text-xs p-3 border-2 border-charcoal rounded-2xl bg-white focus:outline-none font-semibold text-charcoal"
                value={newAppPortfolioId}
                onChange={e => setNewAppPortfolioId(e.target.value)}
                required
              >
                <option value="">-- Portföy Seçiniz --</option>
                {portfolios.map(p => {
                  const isMine = compareIds(p.gorevliUzmanId, user?.id);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.tip} ({p.tur}) - {p.ilce}/{p.il} · {isMine ? '⭐ Sizin İlanınız' : `İlan Sahibi: ${p.gorevliUzman || 'Uzman'}`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Katılacak Müşteri Seçimi */}
            <div>
              <label className="text-xs text-zinc-600 font-semibold block mb-1">
                Katılacak Müşteri (Alıcı / Kiracı Adayı) <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full text-xs p-3 border-2 border-charcoal rounded-2xl bg-white focus:outline-none font-semibold text-charcoal"
                value={newAppMusteriId}
                onChange={e => setNewAppMusteriId(e.target.value)}
                required
              >
                <option value="">-- Müşteri Listesinden Seçiniz --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.ad} {c.soyad} ({c.musteriTipi || c.tip}) - Tel: {c.telefon}
                  </option>
                ))}
              </select>
            </div>

            {/* Randevu Tarihi ve Saati */}
            <div>
              <label className="text-xs text-zinc-600 font-semibold block mb-1">
                Randevu Tarihi & Saati <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className="w-full text-xs p-3 border-2 border-charcoal rounded-2xl bg-white focus:outline-none font-medium"
                value={newAppDate}
                min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                onChange={e => setNewAppDate(e.target.value)}
                required
              />
            </div>

            {/* Dynamic Action Button */}
            {(() => {
              const selPort = portfolios.find(p => compareIds(p.id, newAppPortfolioId));
              const isOwner = selPort ? compareIds(selPort.gorevliUzmanId, user?.id) : true;
              return (
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className={`flex-1 py-3 text-xs font-extrabold rounded-full transition-all border-none shadow-none cursor-pointer flex items-center justify-center gap-2 ${isOwner
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-charcoal hover:bg-black text-white'
                      }`}
                  >
                    {isOwner ? '➕ Randevu Oluştur (Doğrudan Ekle)' : '📤 Randevu Talebi Oluştur (İlan Sahibine Gönder)'}
                  </button>
                  <button
                    type="button"
                    className="px-5 py-3 text-xs font-extrabold rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-all border-none cursor-pointer"
                    onClick={() => setShowAddAppointmentModal(false)}
                  >
                    İptal
                  </button>
                </div>
              );
            })()}
          </form>
        </div>
      )}


      {/* Appointment Action (Satıldı/Kiralandı/Vazgeçildi) Modal */}
      {showAppointmentActionModal && selectedAppointmentToAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 bg-charcoal text-white flex justify-between items-center flex-wrap gap-3">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold mb-1">Randevu İşlemleri</h3>
                <p className="text-xs text-white/70 font-medium">Bu randevunun sonucunu belirleyin</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAppointmentActionModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer border-none text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAppointmentAction} className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 flex flex-col gap-2">
                <div className="text-xs">
                  <span className="text-zinc-500 font-bold block mb-0.5">Portföy:</span>
                  <span className="font-extrabold text-charcoal">{selectedAppointmentToAction.portfoyTip} - {selectedAppointmentToAction.portfoyTur} ({selectedAppointmentToAction.ilce}/{selectedAppointmentToAction.il})</span>
                </div>
                <div className="text-xs">
                  <span className="text-zinc-500 font-bold block mb-0.5">Müşteri:</span>
                  <span className="font-extrabold text-charcoal">{selectedAppointmentToAction.musteri} ({selectedAppointmentToAction.musteriTelefon})</span>
                </div>
              </div>

              {/* Dynamic Process Stages (Süreç Aşamaları Seçimi) */}
              <div>
                <label className="text-xs text-zinc-600 font-bold block mb-2">Süreç Aşaması Güncelle</label>
                <div className="grid grid-cols-1 gap-1.5 bg-zinc-50 p-2 rounded-2xl border border-zinc-200 max-h-44 overflow-y-auto custom-scrollbar">
                  {processStages.map((stage: any, idx: number) => {
                    const isSelected = selectedStageId === stage.id || (idx === 0 && !selectedStageId);
                    const isCompletedStage = stage.id === 4 || stage.sira === 3 || (stage.asamaAdi && (stage.asamaAdi.toLowerCase().includes('tamamland') || stage.asamaAdi.toLowerCase().includes('satıldı')));

                    return (
                      <button
                        key={`stage-opt-${stage.id || idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedStageId(stage.id);
                          if (isCompletedStage && appActionType === 'VAZGECILDI') {
                            setAppActionType(selectedAppointmentToAction.portfoyTur === 'KIRALIK' ? 'KIRALANDI' : 'SATILDI');
                          }
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${isSelected
                          ? 'bg-charcoal text-white border-charcoal shadow-sm'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                          }`}
                      >
                        <span className="truncate">{stage.sira || idx + 1}. {stage.asamaAdi}</span>
                        {isSelected && <span className="text-[10px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full whitespace-nowrap">Seçili</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Check if Selected Stage is Completed Stage (Aşama 6 - Tamamlandı) */}
              {(() => {
                const currentStage = processStages.find((s: any, idx: number) => s.id === selectedStageId || (idx === 0 && !selectedStageId));
                const isCompletedStageSelected = currentStage && (
                  currentStage.id === 4 ||
                  currentStage.sira === 3 ||
                  (currentStage.asamaAdi && (currentStage.asamaAdi.toLowerCase().includes('tamamland') || currentStage.asamaAdi.toLowerCase().includes('satıldı')))
                );

                return (
                  <>
                    {isCompletedStageSelected ? (
                      <>
                        <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center gap-2 text-xs text-emerald-950 font-bold animate-pulse">
                          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                          <span>Süreç Tamamlandı aşaması seçildi. Lütfen Kiralama/Satış tutarını ve detaylarını giriniz.</span>
                        </div>

                        <div>
                          <label className="text-xs text-zinc-600 font-bold block mb-2">Nihai İşlem Sonucu</label>
                          <div className="flex bg-zinc-100 p-1 rounded-full w-full">
                            {['SATILDI', 'KIRALANDI'].map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setAppActionType(t as any)}
                                className={`flex-1 py-2 text-[11px] font-extrabold rounded-full transition-all border-none cursor-pointer ${appActionType === t
                                  ? 'bg-charcoal text-white shadow-md'
                                  : 'bg-transparent text-zinc-500 hover:text-charcoal'
                                  }`}
                              >
                                {t === 'SATILDI' ? 'Satıldı' : 'Kiralandı'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-zinc-600 font-bold block mb-1">
                            Nihai İşlem Bedeli (TL) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            className="w-full text-sm p-3 border-2 border-charcoal rounded-2xl bg-white focus:outline-none font-bold"
                            placeholder="Satış veya Kiralama Tutarı"
                            value={appActionBedel}
                            onChange={e => setAppActionBedel(e.target.value)}
                            required
                          />
                        </div>

                        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex flex-col gap-1 mt-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">Dinamik Komisyon Hesaplaması</span>
                          <div className="flex justify-between items-center text-sm flex-wrap gap-3">
                            <span className="text-zinc-600 font-bold">Hesaplanan Toplam Ciro:</span>
                            <span className="font-extrabold text-charcoal">
                              {(Number(appActionBedel) * (appActionType === 'KIRALANDI' ? 1 : 0.02)).toLocaleString('tr-TR')} TL
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-t border-emerald-200/50 pt-2 mt-1 flex-wrap gap-3">
                            <span className="text-emerald-900 font-bold">Net Hakedişiniz (Senaryo A - %{commSettings.aDanisman}):</span>
                            <span className="font-extrabold text-emerald-700">
                              {((Number(appActionBedel) * (appActionType === 'KIRALANDI' ? 1 : 0.02)) * (commSettings.aDanisman / 100)).toLocaleString('tr-TR')} TL
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs text-zinc-600 font-medium">
                        💡 Seçilen süreç aşaması güncellenecektir. İşlem tamamlandığında (Satıldı/Kiralandı) miktar ve tutar bilgileri istenecektir.
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={appActionLoading}
                  className={`flex-1 py-3.5 text-xs font-extrabold rounded-full transition-all border-none shadow-none cursor-pointer ${appActionType === 'VAZGECILDI'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                >
                  {appActionLoading ? 'İşleniyor...' : (appActionType === 'VAZGECILDI' ? 'Randevuyu İptal Et' : 'İşlemi Tamamla & Kapat')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kullanıcı Silme Modalı */}
      {showDeleteUserModal && userToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full relative border-none shadow-none flex flex-col gap-4">
            <div className="flex justify-between items-start mb-1">
              <div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-widest">KULLANICI SİL</span>
                <h2 className="text-xl font-extrabold text-charcoal mt-1 flex items-center gap-2">
                  <Trash2 size={22} className="text-red-600" /> Çalışanı Sil
                </h2>
              </div>
              <button
                type="button"
                className="p-1.5 border border-charcoal rounded-full hover:bg-zinc-100 text-charcoal cursor-pointer"
                onClick={() => { setShowDeleteUserModal(false); setUserToDelete(null); setReassignedUserId(''); }}
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-zinc-600 font-medium">
              <strong className="text-charcoal">{userToDelete.ad} {userToDelete.soyad}</strong> isimli çalışanı silmek üzeresiniz. Bu kullanıcının geçmişteki ciro ve işlem verileri korunacaktır. Ancak <strong className="text-red-500">aktif olan (Satılık/Kiralık vb.)</strong> portföylerinin başka bir çalışana devredilmesi gerekmektedir.
            </p>

            <div>
              <label className="text-xs text-zinc-600 font-bold block mb-1">
                Aktif Portföylerin Aktarılacağı Kişi <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full text-sm p-3 border-2 border-charcoal rounded-2xl bg-white focus:outline-none font-bold"
                value={reassignedUserId}
                onChange={e => setReassignedUserId(e.target.value)}
              >
                <option value="">Lütfen seçin...</option>
                {employees.filter(emp => emp.id !== userToDelete.id).map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.ad} {emp.soyad}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { setShowDeleteUserModal(false); setUserToDelete(null); setReassignedUserId(''); }}
                className="flex-1 py-3 text-xs font-extrabold rounded-full transition-all border border-zinc-200 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={handleDeleteEmployee}
                disabled={!reassignedUserId}
                className="flex-1 py-3 text-xs font-extrabold rounded-full transition-all border-none shadow-none cursor-pointer bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sil ve Aktar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Transaction (Satıldı / Kiralandı Yap) Modal */}
      {showCloseTransactionModal && closePortPortfolio && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCloseTransactionSubmit}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full relative border-none shadow-none flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-1">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">İŞLEM KAPATMA</span>
                <h2 className="text-xl md:text-xl sm:text-2xl font-extrabold text-charcoal mt-1 flex items-center gap-2">
                  <Check size={22} className="text-emerald-600" /> İşlemi Kapat / Satıldı-Kiralandı Yap
                </h2>
              </div>
              <button
                type="button"
                className="p-1.5 border border-charcoal rounded-full hover:bg-zinc-100 text-charcoal cursor-pointer"
                onClick={() => setShowCloseTransactionModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-medium">
              <strong>Seçilen Portföy:</strong> {closePortPortfolio.tip} ({closePortPortfolio.tur}) - {closePortPortfolio.ilce}/{closePortPortfolio.il}
            </div>

            {/* 1. Transaction Type / İşlem Türü */}
            <div>
              <label className="text-xs text-zinc-600 font-semibold block mb-1">
                İşlem Türü <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full text-xs p-3 border-2 border-charcoal rounded-2xl bg-white focus:outline-none font-bold text-charcoal"
                value={closeIslemTuru}
                onChange={e => handleIslemTuruChange(e.target.value as 'SATIS' | 'KIRALAMA')}
                required
              >
                <option value="SATIS">SATIS (Satış İşlemi)</option>
                <option value="KIRALAMA">KIRALAMA (Kiralama İşlemi)</option>
              </select>
            </div>

            {/* 2. Final Transaction Amount / İşlem Bedeli */}
            <div>
              <label className="text-xs text-zinc-600 font-semibold block mb-1">
                Nihai İşlem Bedeli (TL) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                className="w-full text-xs p-3 border-2 border-charcoal rounded-2xl bg-white focus:outline-none font-extrabold text-charcoal"
                value={closeIslemBedeli}
                onChange={e => handleIslemBedeliChange(e.target.value)}
                placeholder="Örn: 4200000"
                required
              />
            </div>

            {/* 3. Earned Revenue / Hizmet Bedeli Ciro */}
            <div>
              <label className="text-xs text-zinc-600 font-semibold block mb-1 flex justify-between">
                <span>Kazanılan Hizmet Bedeli / Ciro (TL) <span className="text-red-500">*</span></span>
                <span className="text-[10px] text-zinc-400 font-normal">
                  ({closeIslemTuru === 'SATIS' ? 'Hesaplanan: %2 Komisyon' : 'Hesaplanan: 1 Ay Kira'})
                </span>
              </label>
              <input
                type="number"
                className="w-full text-xs p-3 border-2 border-emerald-600 rounded-2xl bg-emerald-50/30 focus:outline-none font-extrabold text-emerald-950"
                value={closeHizmetBedeliCiro}
                onChange={e => setCloseHizmetBedeliCiro(e.target.value)}
                placeholder="Örn: 84000"
                required
              />
            </div>

            {/* 4. Buyer/Tenant Client Selection / Alıcı - Kiracı Müşteri Seçimi */}
            <div>
              <label className="text-xs text-zinc-600 font-semibold block mb-1">
                Alıcı / Kiracı Müşteri (İsteğe Bağlı)
              </label>
              <select
                className="w-full text-xs p-3 border-2 border-charcoal rounded-2xl bg-white focus:outline-none font-bold text-charcoal cursor-pointer"
                value={closeAliciMusteriId}
                onChange={e => setCloseAliciMusteriId(e.target.value)}
              >
                <option value="">-- Müşteri Seçin (İsteğe Bağlı) --</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.ad} {c.soyad || ''} {c.musteriTipi ? `(${c.musteriTipi})` : ''} - {c.telefon}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Closing Date / İşlem Tarihi */}
            <div>
              <label className="text-xs text-zinc-600 font-semibold block mb-1">
                İşlem Kapatma Tarihi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full text-xs p-3 border-2 border-charcoal rounded-2xl bg-white focus:outline-none font-medium"
                value={closeIslemTarihi}
                onChange={e => setCloseIslemTarihi(e.target.value)}
                required
              />
            </div>

            {/* 6. Notes / Açıklama */}
            <div>
              <label className="text-xs text-zinc-600 font-semibold block mb-1">
                İşlem Notları / Açıklama (İsteğe Bağlı)
              </label>
              <textarea
                className="w-full text-xs p-3 border-2 border-charcoal rounded-2xl bg-white focus:outline-none font-medium resize-none"
                rows={3}
                value={closeAciklama}
                onChange={e => setCloseAciklama(e.target.value)}
                placeholder="Alıcı/kiracı bilgisi, özel notlar veya komisyon ayrıntıları..."
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={closeLoading}
                className="flex-1 py-3.5 text-xs font-extrabold rounded-full bg-emerald-600 hover:bg-emerald-700 text-white transition-all border-none shadow-none cursor-pointer flex items-center justify-center gap-2"
              >
                {closeLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {closeIslemTuru === 'SATIS' ? 'Satıldı Olarak İşlemi Kapat & Ciroya İşle' : 'Kiralandı Olarak İşlemi Kapat & Ciroya İşle'}
              </button>
              <button
                type="button"
                className="px-5 py-3.5 text-xs font-extrabold rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-all border-none cursor-pointer"
                onClick={() => setShowCloseTransactionModal(false)}
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
