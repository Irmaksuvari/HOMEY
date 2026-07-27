const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.tsx', 'utf8');

const oldEffect = `  // Fetch settings when tab changes to settings
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
  }, [activeTab, user, token]);`;

const newEffect = `  // Fetch settings when user logs in
  useEffect(() => {
    if (user && token) {
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
  }, [user, token]);

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
  }, [showAddPortfolioModal, newPortFiyat, newPortTur, firmaSettings]);`;

if (code.includes(oldEffect)) {
  code = code.replace(oldEffect, newEffect);
  fs.writeFileSync('frontend/src/App.tsx', code, 'utf8');
  console.log("Replaced");
} else {
  console.log("Old effect not found. Exact match failed.");
}
