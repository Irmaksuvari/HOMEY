const mongoose = require('mongoose');
require('dotenv').config();
async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const user = await db.collection('Kullanicilar').findOne({ Ad: /Irmak/i });
  console.log('User found:', user);
  
  if (user) {
    const portfolios = await db.collection('Portfoyler').find({ GorevliUzmanId: user._id }).toArray();
    console.log(`Found ${portfolios.length} portfolios for this user.`);
    if (portfolios.length > 0) {
      console.log('Sample portfolio YetkilendirmeSozlesmesiYapildi:', portfolios[0].YetkilendirmeSozlesmesiYapildi);
      console.log('Sample portfolio ID:', portfolios[0]._id);
    }
  }
  
  process.exit(0);
}
check();
