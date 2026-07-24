        {/* Tab 3: Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="flex flex-col gap-6 w-full">
            
            {/* Top Card: Kendi Oluşturulan Randevular (My Appointments Card) */}
            <div className="bento-card bg-white">
              <div className="flex justify-between items-center mb-4 border-b border-zinc-100 pb-3">
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">MÜŞTERİ GÖSTERİMLERİM</span>
                  <h3 className="text-xl font-extrabold text-charcoal">Oluşturulan Randevular</h3>
                </div>
                <span className="px-3 py-1 bg-[#FEF08A] border border-charcoal rounded-full text-xs font-extrabold text-charcoal">
                  {appointments.filter(a => compareIds(a.talepEdenId, user?.id)).length} Oluşturulan
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-zinc-200 text-xs font-extrabold text-zinc-500 uppercase">
                      <th className="pb-3 min-w-[140px]">Portföy Tipi</th>
                      <th className="pb-3 min-w-[160px]">Lokasyon</th>
                      <th className="pb-3 min-w-[160px]">İlan Sahibi Uzman</th>
                      <th className="pb-3 min-w-[150px]">Katılan Müşteri</th>
                      <th className="pb-3 min-w-[140px]">Randevu Zamanı</th>
                      <th className="pb-3 text-center min-w-[110px]">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const myApps = appointments.filter(a => compareIds(a.talepEdenId, user?.id));
                      if (myApps.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-zinc-400 text-xs font-semibold">
                              Kendi tarafınızdan oluşturulan aktif randevu bulunmuyor. Portföyler sayfasından yeni randevu teklifi oluşturabilirsiniz.
                            </td>
                          </tr>
                        );
                      }

                      return myApps.map(app => (
                        <tr key={`my-app-${app.id}`} className="border-b border-zinc-100 text-sm hover:bg-zinc-50/50 transition-colors">
                          <td className="py-4">
                            <strong className="font-extrabold text-charcoal">{app.portfoyTip}</strong>
                            <span className="text-xs text-zinc-500 block">{app.portfoyTur}</span>
                          </td>
                          <td className="py-4 text-xs font-medium text-zinc-600">
                            {app.ilce} / {app.il}
                            {app.mahalle && <span className="block text-zinc-400 text-[11px]">{app.mahalle} Mah.</span>}
                          </td>
                          <td className="py-4 text-xs font-bold text-charcoal">
                            {app.portfoySahibi || 'Gayrimenkul Uzmanı'}
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
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase ${
                                app.durum === 'APPROVED' ? 'bg-[#BBF7D0] text-emerald-950 border-emerald-300' :
                                app.durum === 'PENDING' ? 'bg-[#FEF08A] text-amber-950 border-amber-300' :
                                app.durum === 'CANCELLED' ? 'bg-zinc-200 text-zinc-700 border-zinc-300' :
                                'bg-[#FBCFE8] text-red-950 border-red-300'
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

            {/* Bottom Wide Main Card Container: Randevu Talepleri Akışı */}
            <div className="bento-card bg-white mt-2">
              <div className="flex flex-wrap justify-between items-center mb-2 border-b border-zinc-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">RANDEVU TAKVİMİ & TALEP YÖNETİMİ</span>
                  <h2 className="text-2xl font-extrabold text-charcoal">Randevu Talepleri Akışı</h2>
                </div>
                <span className="px-3 py-1 bg-cream border border-charcoal/10 rounded-full text-xs font-bold text-zinc-600">
                  Toplam {appointments.length} Kayıt
                </span>
              </div>

              {/* 2-Split Grid: Left (Giden Talepler 📤) & Right (Gelen Talepler 📥) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                
                {/* Left Section: Giden Talepler 📤 */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600 font-bold text-lg">📤</span>
                      <div>
                        <h3 className="font-extrabold text-base text-charcoal">Giden Talepler</h3>
                        <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Sizin gönderdiğiniz gösterim istekleri</span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {appointments.filter(a => compareIds(a.talepEdenId, user?.id)).length}
                    </span>
                  </div>

                  {/* Outgoing List */}
                  <div className="flex flex-col max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {(() => {
                      const outgoingApps = appointments.filter(a => compareIds(a.talepEdenId, user?.id));
                      if (outgoingApps.length === 0) {
                        return (
                          <div className="py-6 text-center text-zinc-400 text-xs italic">
                            Henüz başka bir portföye gönderdiğiniz randevu bulunmuyor.
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
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase ${
                              app.durum === 'APPROVED' ? 'bg-[#BBF7D0] text-emerald-950 border-emerald-300' :
                              app.durum === 'PENDING' ? 'bg-[#FEF08A] text-amber-950 border-amber-300 animate-pulse' :
                              app.durum === 'CANCELLED' ? 'bg-zinc-200 text-zinc-700 border-zinc-300' :
                              'bg-[#FBCFE8] text-red-950 border-red-300'
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
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600 font-bold text-lg">📥</span>
                      <div>
                        <h3 className="font-extrabold text-base text-charcoal">Gelen Talepler</h3>
                        <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Size gelen gösterim istekleri</span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      {appointments.filter(a => user?.rol === 'YETKILI' ? !compareIds(a.talepEdenId, user?.id) : compareIds(a.portfoySahibiId, user?.id)).length}
                    </span>
                  </div>

                  {/* Incoming List */}
                  <div className="flex flex-col max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {(() => {
                      const incomingApps = appointments.filter(a => user?.rol === 'YETKILI' ? !compareIds(a.talepEdenId, user?.id) : compareIds(a.portfoySahibiId, user?.id));
                      if (incomingApps.length === 0) {
                        return (
                          <div className="py-6 text-center text-zinc-400 text-xs italic">
                            Henüz size gelen bir randevu talebi bulunmuyor.
                          </div>
                        );
                      }
                      return incomingApps.map((app, idx) => {
                        const canManageAppointment = compareIds(app.portfoySahibiId, user?.id) || user?.rol === 'YETKILI';

                        return (
                          <div key={app.id} className={`py-4 flex flex-col gap-2 ${idx !== incomingApps.length - 1 ? 'border-b border-zinc-100' : ''}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <strong className="text-sm font-extrabold text-charcoal block">{app.portfoyTip} ({app.portfoyTur})</strong>
                                <span className="text-xs text-zinc-500">{app.ilce} / {app.il}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase ${
                                app.durum === 'APPROVED' ? 'bg-[#BBF7D0] text-emerald-950 border-emerald-300' :
                                app.durum === 'PENDING' ? 'bg-[#FEF08A] text-amber-950 border-amber-300 animate-pulse' :
                                app.durum === 'CANCELLED' ? 'bg-zinc-200 text-zinc-700 border-zinc-300' :
                                'bg-[#FBCFE8] text-red-950 border-red-300'
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
                                    className="px-4 py-1.5 bg-[#BBF7D0] border border-emerald-400 rounded-md text-[10px] font-extrabold hover:bg-emerald-300 transition-all cursor-pointer text-emerald-950"
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
