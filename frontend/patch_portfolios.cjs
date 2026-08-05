const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add requireAuthAgreement prop to PortfolioCardItem
content = content.replace(
  "publishLoading: boolean; isOwner: boolean }) {",
  "publishLoading: boolean; isOwner: boolean; requireAuthAgreement?: boolean }) {"
);

// 2. Add badge to PortfolioCardItem
const oldBadgeHTML = `{portfolio.tur}
          </span>
          <div className="flex items-center gap-2 pointer-events-auto">`;
          
const newBadgeHTML = `{portfolio.tur}
          </span>
          {requireAuthAgreement && !portfolio.yetkilendirmeSozlesmesiYapildi && (
             <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full border border-red-500/80 bg-red-100 text-red-700 uppercase tracking-wider shadow-sm ml-1 truncate max-w-[120px]" title="Yetkilendirme Sözleşmesi Eksik">Eksik Evrak</span>
          )}
          <div className="flex items-center gap-2 pointer-events-auto">`;

content = content.replace(oldBadgeHTML, newBadgeHTML);

// 3. Update PortfolioCardItem usage in App.tsx
content = content.replace(
  /isOwner={isOwnPortfolio\(p\)}/g,
  "isOwner={isOwnPortfolio(p)} requireAuthAgreement={firmaSettings.YetkilendirmeSarti === true}"
);

// 4. Update handleTogglePortfolioPublish
const oldPublishLogic = `  const handleTogglePortfolioPublish = async (portfolio: any) => {
    if (!token) return;
    if (!isOwnPortfolio(portfolio)) return;

    const nextValue = !isPortfolioPublished(portfolio);`;

const newPublishLogic = `  const handleTogglePortfolioPublish = async (portfolio: any) => {
    if (!token) return;
    if (!isOwnPortfolio(portfolio)) return;

    if (firmaSettings.YetkilendirmeSarti && !portfolio.yetkilendirmeSozlesmesiYapildi) {
      showToast('Yetkilendirme sözleşmesi alınmadığı için bu portföy yayınlanamaz.', 'error');
      return;
    }

    const nextValue = !isPortfolioPublished(portfolio);`;

content = content.replace(oldPublishLogic, newPublishLogic);

// 5. Update handleCreateOrRequestAppointment
const oldAppt1 = `    if (portfolio.durum === 'KAPORA_ASAMASINDA' || portfolio.durum === 'KIRALANDI_SATILDI') {
      alert("Bu portföy kapora aşamasında veya satıldığı için randevu oluşturulamaz.");
      return;
    }`;

const newAppt1 = `    if (portfolio.durum === 'KAPORA_ASAMASINDA' || portfolio.durum === 'KIRALANDI_SATILDI') {
      alert("Bu portföy kapora aşamasında veya satıldığı için randevu oluşturulamaz.");
      return;
    }

    if (firmaSettings.YetkilendirmeSarti && !portfolio.yetkilendirmeSozlesmesiYapildi) {
      alert("Bu portföyün yetkilendirme sözleşmesi eksik olduğu için randevu oluşturulamaz.");
      return;
    }`;

content = content.replace(oldAppt1, newAppt1);

// 6. Update handleCreateAppointmentFromModal
const oldAppt2 = `    if (targetPortfolio.durum === 'KAPORA_ASAMASINDA' || targetPortfolio.durum === 'KIRALANDI_SATILDI') {
      alert("Bu portföy kapora aşamasında veya satıldığı için yeni randevu oluşturulamaz.");
      return;
    }`;

const newAppt2 = `    if (targetPortfolio.durum === 'KAPORA_ASAMASINDA' || targetPortfolio.durum === 'KIRALANDI_SATILDI') {
      alert("Bu portföy kapora aşamasında veya satıldığı için yeni randevu oluşturulamaz.");
      return;
    }

    if (firmaSettings.YetkilendirmeSarti && !targetPortfolio.yetkilendirmeSozlesmesiYapildi) {
      alert("Bu portföyün yetkilendirme sözleşmesi eksik olduğu için yeni randevu oluşturulamaz.");
      return;
    }`;

content = content.replace(oldAppt2, newAppt2);


fs.writeFileSync(filePath, content, 'utf8');
console.log('App.tsx patched for portfolio authorization logic');
