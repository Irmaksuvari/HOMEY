const fs = require('fs');
const schemaDump = require('./schema_dump.json');

const typeMapping = {
  'uniqueidentifier': 'String',
  'nvarchar': 'String',
  'varchar': 'String',
  'int': 'Number',
  'decimal': 'Number',
  'float': 'Number',
  'bit': 'Boolean',
  'datetime': 'Date',
  'varbinary': 'String'
};

const collectionMappings = {
  'Portfoyler': 'Portfolio',
  'PortfoyFotograflari': 'PortfolioPhoto',
  'KomisyonAyarlari': 'CommissionSetting',
  'Randevular': 'Appointment',
  'RandevularArsivi': 'AppointmentArchive',
  'AbonelikPaketleri': 'SubscriptionPackage',
  'PaketFiyatlari': 'PackagePrice',
  'SurecAsamalari': 'ProcessStage',
  'FirmaAbonelikleri': 'FirmSubscription',
  'MusteriSurecleri': 'ClientProcess',
  'SatisIslemleri': 'Sale',
  'Firmalar': 'Firm',
  'Kullanicilar': 'User',
  'FirmaEvraklari': 'FirmDocument',
  'FirmaKomisyonAyarlari': 'FirmCommissionSetting',
  'Musteriler': 'Client'
};

for (const [tableName, columns] of Object.entries(schemaDump)) {
  if (tableName === 'sysdiagrams') continue;
  
  const modelName = collectionMappings[tableName] || tableName;
  let schemaFields = '';
  let hasId = false;

  for (const col of columns) {
    let fieldName = col.COLUMN_NAME;
    const tsType = typeMapping[col.DATA_TYPE] || 'String';
    const isRequired = col.IS_NULLABLE === 'NO' ? 'true' : 'false';
    
    if (fieldName === 'Id' || fieldName === 'IslemID' || fieldName === 'PaketID' || fieldName === 'FiyatID' || fieldName === 'AbonelikID') {
      hasId = true;
      schemaFields += `  _id: { type: ${tsType} }, // Original ID field mapped to _id\n`;
    } else {
      schemaFields += `  ${fieldName}: { type: ${tsType} },\n`;
    }
  }

  let code = `import mongoose, { Schema } from 'mongoose';

const ${modelName}Schema = new Schema({
${schemaFields}}, { 
  collection: '${tableName}',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: false // Allow extra fields dynamically during migration
});

`;

  // Create virtuals for the original ID names
  const idFields = columns.filter(c => ['Id', 'IslemID', 'PaketID', 'FiyatID', 'AbonelikID'].includes(c.COLUMN_NAME)).map(c => c.COLUMN_NAME);
  for (const idf of idFields) {
    code += `${modelName}Schema.virtual('${idf}').get(function() { return this._id; });\n`;
  }

  code += `\nexport const ${modelName} = mongoose.models.${modelName} || mongoose.model('${modelName}', ${modelName}Schema);\n`;

  fs.writeFileSync(`./src/models/${modelName}.ts`, code);
}
console.log("All models generated.");
