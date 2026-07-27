const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'frontend', 'src', 'App.tsx');
let appCode = fs.readFileSync(appPath, 'utf8');

// 1. Replace the old commSettings state with new firmaSettings state
const oldStateBlock = `  const [commSettings, setCommSettings] = useState({
    aOfis: 40, aDanisman: 60,
    bOfis: 40, bPortfoySahibi: 30, bMusteriGetiren: 30,
    cDisOrtak: 50, cOfis: 20, cDanisman: 30
  });`;

const newStateBlock = `  const [firmaSettings, setFirmaSettings] = useState({
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
  
  // Fetch settings when tab changes to settings
  useEffect(() => {
    if (activeTab === 'settings' && user?.rol === 'YETKILI') {
      const fetchSettings = async () => {
        try {
          const res = await fetch('/api/firma/komisyon-ayarlari', {
            headers: { 'Authorization': \`Bearer \${token}\` }
          });
          if (res.ok) {
            const data = await res.json();
            setFirmaSettings(data);
          }
        } catch(e) {
          console.error(e);
        }
      };
      fetchSettings();
    }
  }, [activeTab, user, token]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/firma/komisyon-ayarlari', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify(firmaSettings)
      });
      if (res.ok) {
        alert('Ayarlar başarıyla kaydedildi.');
      } else {
        alert('Ayarlar kaydedilirken hata oluştu.');
      }
    } catch(e) {
      alert('Sunucu hatası.');
    } finally {
      setIsSavingSettings(false);
    }
  };
`;

appCode = appCode.replace(oldStateBlock, newStateBlock);

// Replace imports to include Info
appCode = appCode.replace('Bed, Ruler, Tag, Key, Image as ImageIcon, CheckCircle2, Filter\n} from \'lucide-react\';', 'Bed, Ruler, Tag, Key, Image as ImageIcon, CheckCircle2, Filter, Info, HelpCircle\n} from \'lucide-react\';');


// 2. Replace the UI block
const startMarker = "{activeTab === 'settings' && user?.rol === 'YETKILI' && (";
const endMarker = "        )}";
const startIndex = appCode.indexOf(startMarker);

// Find the matching closing brace for this block to be safe, or just find the exact next block
// In App.tsx it ends right before "</main>"
const mainEndIndex = appCode.indexOf("</main>", startIndex);
const blockToReplace = appCode.substring(startIndex, mainEndIndex);

const newUIBlock = `{activeTab === 'settings' && user?.rol === 'YETKILI' && (
          <div className="bento-card bg-white p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-charcoal">Komisyon & Finansal Ayarlar</h2>
                <p className="text-xs text-zinc-500 mt-1">Firmanıza özel satış, kiralama, ofis içi ve dışı komisyon paylaşımlarını yönetin.</p>
              </div>
              <button 
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="px-6 py-2.5 bg-charcoal text-white text-sm font-bold rounded-full hover:bg-black transition-colors flex items-center gap-2"
              >
                {isSavingSettings ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Değişiklikleri Kaydet
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-200 mb-6 gap-6">
              <button 
                onClick={() => setSettingsActiveTab('standartlar')}
                className={\`pb-3 text-sm font-bold transition-colors relative \${settingsActiveTab === 'standartlar' ? 'text-charcoal' : 'text-zinc-400 hover:text-zinc-600'}\`}
              >
                Satış & Kiralama Standartları
                {settingsActiveTab === 'standartlar' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-charcoal"></div>}
              </button>
              <button 
                onClick={() => setSettingsActiveTab('disOfis')}
                className={\`pb-3 text-sm font-bold transition-colors relative \${settingsActiveTab === 'disOfis' ? 'text-charcoal' : 'text-zinc-400 hover:text-zinc-600'}\`}
              >
                Ofis Dışı Paylaşım
                {settingsActiveTab === 'disOfis' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-charcoal"></div>}
              </button>
              <button 
                onClick={() => setSettingsActiveTab('iciOfis')}
                className={\`pb-3 text-sm font-bold transition-colors relative \${settingsActiveTab === 'iciOfis' ? 'text-charcoal' : 'text-zinc-400 hover:text-zinc-600'}\`}
              >
                Ofis İçi Prim & Hakediş
                {settingsActiveTab === 'iciOfis' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-charcoal"></div>}
              </button>
            </div>

            {/* Content */}
            <div className="bg-[#FDF8F2] p-6 rounded-3xl border border-charcoal/5">
              
              {settingsActiveTab === 'standartlar' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Kiralama Parametreleri */}
                  <div>
                    <h3 className="text-lg font-extrabold mb-4 text-charcoal border-b border-zinc-200 pb-2">Kiralama Parametreleri</h3>
                    
                    <div className="mb-4">
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-xs font-bold text-zinc-700">Emlak Komisyonu (Hizmet Bedeli)</label>
                        <div className="relative group cursor-pointer">
                          <Info size={14} className="text-zinc-400" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-charcoal text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center">
                            Yasal tavan 1 aylık kiradır. Kanunen taraflarca eşit ödenebilse de uygulamada tamamını kiracı öder.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" step="0.1" className="w-24 text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.KiralamaKomisyonOrani} onChange={e => setFirmaSettings({...firmaSettings, KiralamaKomisyonOrani: Number(e.target.value)})} />
                        <span className="text-xs text-zinc-500 font-bold">Aylık Kira + %</span>
                        <input type="number" step="0.1" className="w-20 text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.KiralamaKdv} onChange={e => setFirmaSettings({...firmaSettings, KiralamaKdv: Number(e.target.value)})} />
                        <span className="text-xs text-zinc-500 font-bold">KDV</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-xs font-bold text-zinc-700">Depozito Üst Sınırı</label>
                        <div className="relative group cursor-pointer">
                          <Info size={14} className="text-zinc-400" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-charcoal text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center">
                            TBK m. 342 uyarınca üst sınır 3 kiradır. Piyasada yaygın olarak 1-2 aylık kira talep edilir.
                          </div>
                        </div>
                      </div>
                      <select className="w-full text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.KiralamaDepozitoSiniri} onChange={e => setFirmaSettings({...firmaSettings, KiralamaDepozitoSiniri: Number(e.target.value)})}>
                        <option value={1}>1 Aylık Kira</option>
                        <option value={2}>2 Aylık Kira</option>
                        <option value={3}>3 Aylık Kira</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-xs font-bold text-zinc-700">Peşin Kira</label>
                        <div className="relative group cursor-pointer">
                          <Info size={14} className="text-zinc-400" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-charcoal text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center">
                            İlgili ayın kullanım bedeli olarak sözleşme imza/giriş tarihinde peşin tahsil edilir.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" className="w-24 text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.KiralamaPesinKira} onChange={e => setFirmaSettings({...firmaSettings, KiralamaPesinKira: Number(e.target.value)})} />
                        <span className="text-xs text-zinc-500 font-bold">Aylık Kira</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-xs font-bold text-zinc-700">Kapora (Bağlanma Parası) Tipi</label>
                        <div className="relative group cursor-pointer">
                          <Info size={14} className="text-zinc-400" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-charcoal text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center">
                            Tutma niyetini kesinleştirmek için verilir. Miktarı taraflarca belirlenir.
                          </div>
                        </div>
                      </div>
                      <select className="w-full text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.KiralamaKaporaTipi} onChange={e => setFirmaSettings({...firmaSettings, KiralamaKaporaTipi: e.target.value})}>
                        <option value="ESNEK">Serbest Tutar (İşlem anında belirlenir)</option>
                        <option value="1_KIRA">1 Aylık Kira Bedeli</option>
                      </select>
                    </div>
                  </div>

                  {/* Satış Parametreleri */}
                  <div>
                    <h3 className="text-lg font-extrabold mb-4 text-charcoal border-b border-zinc-200 pb-2">Satış Parametreleri</h3>
                    
                    <div className="mb-4">
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-xs font-bold text-zinc-700">Satış Emlak Komisyonu (Hizmet Bedeli)</label>
                        <div className="relative group cursor-pointer">
                          <Info size={14} className="text-zinc-400" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-charcoal text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center">
                            Satış bedeli üzerinden hesaplanır. Yasal olarak %2 + KDV Alıcı, %2 + KDV Satıcı öder.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-bold">Alıcı %</span>
                        <input type="number" step="0.1" className="w-20 text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.SatisAliciKomisyon} onChange={e => setFirmaSettings({...firmaSettings, SatisAliciKomisyon: Number(e.target.value)})} />
                        <span className="text-xs text-zinc-500 font-bold">+ Satıcı %</span>
                        <input type="number" step="0.1" className="w-20 text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.SatisSaticiKomisyon} onChange={e => setFirmaSettings({...firmaSettings, SatisSaticiKomisyon: Number(e.target.value)})} />
                        <span className="text-xs text-zinc-500 font-bold">= Toplam %{(firmaSettings.SatisAliciKomisyon + firmaSettings.SatisSaticiKomisyon).toFixed(1)} + KDV</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-xs font-bold text-zinc-700">Tapu Harcı Oranı</label>
                        <div className="relative group cursor-pointer">
                          <Info size={14} className="text-zinc-400" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-charcoal text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center">
                            Beyan edilen satış bedeli üzerinden %2 Alıcı, %2 Satıcı öder.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-bold">Alıcı %</span>
                        <input type="number" step="0.1" className="w-20 text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.TapuHarciAlici} onChange={e => setFirmaSettings({...firmaSettings, TapuHarciAlici: Number(e.target.value)})} />
                        <span className="text-xs text-zinc-500 font-bold">+ Satıcı %</span>
                        <input type="number" step="0.1" className="w-20 text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.TapuHarciSatici} onChange={e => setFirmaSettings({...firmaSettings, TapuHarciSatici: Number(e.target.value)})} />
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-xs font-bold text-zinc-700">Döner Sermaye Bedeli (Maktu Tutarı)</label>
                        <div className="relative group cursor-pointer">
                          <Info size={14} className="text-zinc-400" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-charcoal text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center">
                            Tapu Müdürlüğü tarafından her yıl belirlenen işlem ücretidir.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" className="w-full text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.DonerSermayeBedeli} onChange={e => setFirmaSettings({...firmaSettings, DonerSermayeBedeli: Number(e.target.value)})} />
                        <span className="text-xs text-zinc-500 font-bold">TL</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-xs font-bold text-zinc-700">Satış Kapora / Ön Ödeme Yüzdesi</label>
                        <div className="relative group cursor-pointer">
                          <Info size={14} className="text-zinc-400" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-charcoal text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center">
                            Anlaşma sağlandığında cayma durumlarına karşı satıcıya veya emlakçıya güvence olarak verilir. (Genelde %1-5)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-bold">%</span>
                        <input type="number" step="0.1" className="w-24 text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.SatisKaporaOrani} onChange={e => setFirmaSettings({...firmaSettings, SatisKaporaOrani: Number(e.target.value)})} />
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {settingsActiveTab === 'disOfis' && (
                <div className="max-w-xl">
                  <h3 className="text-lg font-extrabold mb-4 text-charcoal border-b border-zinc-200 pb-2">Başka Emlak Ofisi ile Komisyon Bölüşümü</h3>
                  <div className="mb-4">
                    <div className="flex items-center gap-1 mb-1">
                      <label className="text-xs font-bold text-zinc-700">Paylaşım Oranları</label>
                      <div className="relative group cursor-pointer">
                        <Info size={14} className="text-zinc-400" />
                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-charcoal text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          Portföy sahibi ofis ile alıcı/kiracı getiren dış ofis toplam komisyonu nasıl paylaşır? (Genelde %50-%50)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <span className="text-[10px] text-zinc-500 font-bold block mb-1">Portföy Sahibi Ofis %</span>
                        <input type="number" className="w-full text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.DisOfisPortfoyPayi} onChange={e => setFirmaSettings({...firmaSettings, DisOfisPortfoyPayi: Number(e.target.value)})} />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] text-zinc-500 font-bold block mb-1">Müşteri Getiren Ofis %</span>
                        <input type="number" className="w-full text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.DisOfisMusteriPayi} onChange={e => setFirmaSettings({...firmaSettings, DisOfisMusteriPayi: Number(e.target.value)})} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsActiveTab === 'iciOfis' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-extrabold mb-4 text-charcoal border-b border-zinc-200 pb-2">Standart Bölüşüm</h3>
                    
                    <div className="mb-6">
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-xs font-bold text-zinc-700">Danışmanlar Arası (Portföy vs Müşteri)</label>
                        <div className="relative group cursor-pointer">
                          <Info size={14} className="text-zinc-400" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-charcoal text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center">
                            Ofis içinde portföyü getiren danışman ile alıcı/kiracı getiren danışman brüt komisyonu nasıl böler?
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-bold">Portföyü Getiren %</span>
                        <input type="number" className="w-20 text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.IciPortfoyPayi} onChange={e => setFirmaSettings({...firmaSettings, IciPortfoyPayi: Number(e.target.value)})} />
                        <span className="text-xs text-zinc-500 font-bold">/ Müşteri Bulan %</span>
                        <input type="number" className="w-20 text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.IciMusteriPayi} onChange={e => setFirmaSettings({...firmaSettings, IciMusteriPayi: Number(e.target.value)})} />
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-xs font-bold text-zinc-700">Danışman - Broker Paylaşımı</label>
                        <div className="relative group cursor-pointer">
                          <Info size={14} className="text-zinc-400" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-charcoal text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center">
                            Danışman, hakedişinin yüzde kaçını ofise bırakır?
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-bold">Danışman %</span>
                        <input type="number" className="w-20 text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.BrokerDanismanPayi} onChange={e => setFirmaSettings({...firmaSettings, BrokerDanismanPayi: Number(e.target.value)})} />
                        <span className="text-xs text-zinc-500 font-bold">/ Ofis (Broker) %</span>
                        <input type="number" className="w-20 text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.BrokerOfisPayi} onChange={e => setFirmaSettings({...firmaSettings, BrokerOfisPayi: Number(e.target.value)})} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold mb-4 text-charcoal border-b border-zinc-200 pb-2">Özel Modeller</h3>
                    
                    <div className="mb-6">
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-xs font-bold text-zinc-700">Kademeli Ciro Primi Modeli</label>
                        <div className="relative group cursor-pointer">
                          <Info size={14} className="text-zinc-400" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-charcoal text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center">
                            Danışman belirli bir ciro barajını aştıkça artan prim oranı uygulanır.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-bold">Danışman Primi %</span>
                        <input type="number" className="w-20 text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.KademeliDanismanPayi} onChange={e => setFirmaSettings({...firmaSettings, KademeliDanismanPayi: Number(e.target.value)})} />
                        <span className="text-xs text-zinc-500 font-bold">/ Ofis Payı %</span>
                        <input type="number" className="w-20 text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.KademeliOfisPayi} onChange={e => setFirmaSettings({...firmaSettings, KademeliOfisPayi: Number(e.target.value)})} />
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-xs font-bold text-zinc-700">Masa Ücreti (Desk Fee) Modeli</label>
                        <div className="relative group cursor-pointer">
                          <Info size={14} className="text-zinc-400" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-charcoal text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center">
                            Danışman sabit aylık masa ücreti öder, ancak işlemlerden çok yüksek oranda prim alır.
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500 font-bold">Sabit Aylık Ücret:</span>
                          <input type="number" className="w-24 text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.MasaUcretiTutar} onChange={e => setFirmaSettings({...firmaSettings, MasaUcretiTutar: Number(e.target.value)})} />
                          <span className="text-xs text-zinc-500 font-bold">TL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500 font-bold">Danışman İşlem Primi %</span>
                          <input type="number" className="w-20 text-sm p-2 border border-zinc-300 rounded-xl bg-white" value={firmaSettings.MasaDanismanPayi} onChange={e => setFirmaSettings({...firmaSettings, MasaDanismanPayi: Number(e.target.value)})} />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          </div>
        )}`;

appCode = appCode.replace(blockToReplace, newUIBlock + '\n');
fs.writeFileSync(appPath, appCode, 'utf8');
console.log("Success");
