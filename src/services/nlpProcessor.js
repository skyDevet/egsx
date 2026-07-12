// ============================================================
// nlpProcessor.js - Complete with IFMTS Sync Integration & Bilingual Support
// ============================================================

import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { vinDecoder } from './vindecoder.js';
import { getServiceConfigDB } from './serviceConfigDB.js';
import { loginApi } from './loginApi.js';

// ============================================================
// GET LANGUAGE
// ============================================================

function getLanguage() {
  try {
    const lang = localStorage.getItem('agig-language');
    return lang === 'am' ? 'am' : 'en';
  } catch (e) {
    return 'en';
  }
}

function getLocalized(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object' && obj !== null) {
    const lang = getLanguage();
    return obj[lang] !== undefined && obj[lang] !== '' ? obj[lang] : obj.en || '';
  }
  return obj;
}

function getLocalizedOptions(optionsObj) {
  if (!optionsObj) return [];
  if (Array.isArray(optionsObj)) return optionsObj;
  if (typeof optionsObj === 'object' && optionsObj !== null) {
    const lang = getLanguage();
    return optionsObj[lang] || optionsObj.en || [];
  }
  return optionsObj;
}

// ============================================================
// DEFAULT SERVICES
// ============================================================

const DEFAULT_SERVICES = {
  iftms: {
    id: 'iftms',
    name: { en: 'IFTMS - Freight Transport', am: 'IFTMS - የጭነት ትራንስፖርት' },
    description: { en: 'Register freight transport operators, vehicles, and drivers', am: 'የጭነት ትራንስፖርት ኦፕሬተሮችን፣ ተሽከርካሪዎችን እና አሽከርካሪዎችን ይመዝገቡ' },
    initStep: 1,
    collectedData: { operator: {}, vehicles: [], drivers: [] },
    steps: {
      1: {
        type: 'form',
        title: { en: 'Operator Registration', am: 'የኦፕሬተር ምዝገባ' },
        fields: [
          { 
            name: 'businessLicenseNumber', 
            question: { en: 'Business License Number? (Example: 12345678)', am: 'የንግድ ፈቃድ ቁጥር? (ምሳሌ: 12345678)' },
            validation: 'license', 
            regex: /^[0-9]{6,10}$/, 
            example: { en: '12345678', am: '12345678' },
            error: { en: 'Invalid. Use 6-10 digits.', am: 'ልክ ያልሆነ። 6-10 አሃዞችን ይጠቀሙ።' }
          },
          { 
            name: 'operatorName', 
            question: { en: 'Operator Name? (Example: Ethio Transport)', am: 'የኦፕሬተር ስም? (ምሳሌ: ኢትዮ ትራንስፖርት)' },
            validation: 'text', 
            regex: /^.+$/, 
            example: { en: 'Ethio Transport', am: 'ኢትዮ ትራንስፖርት' },
            error: { en: 'Cannot be empty.', am: 'ባዶ መሆን አይችልም።' }
          },
          { 
            name: 'phoneNumber', 
            question: { en: 'Phone Number? (Example: 0912345678 or +251912345678)', am: 'ስልክ ቁጥር? (ምሳሌ: 0912345678 ወይም +251912345678)' },
            validation: 'phone', 
            regex: /^(0?[79][0-9]{8}|\+251[79][0-9]{8})$/, 
            example: { en: '0912345678', am: '0912345678' },
            error: { en: 'Invalid phone number. Use: 0912345678 or +251912345678', am: 'ልክ ያልሆነ ስልክ ቁጥር። 0912345678 ወይም +251912345678 ይጠቀሙ' }
          },
          { 
            name: 'password', 
            question: { en: 'IFMTS Password?', am: 'IFMTS ይለፍ ቃል?' },
            validation: 'text', 
            example: { en: 'your_password', am: 'ይለፍ_ቃልዎ' },
            error: { en: 'Password is required.', am: 'ይለፍ ቃል ያስፈልጋል።' }
          }
        ],
        onValid: { nextStep: 2 }
      },
      2: {
        type: 'subprocess',
        title: { en: 'Vehicle Management', am: 'የተሽከርካሪ አስተዳደር' },
        subprocess: {
          itemName: { en: 'Vehicle', am: 'ተሽከርካሪ' },
          addPrompt: { en: 'Add a vehicle? (yes/no)', am: 'ተሽከርካሪ ማከል ይፈልጋሉ? (አዎ/አይ)' },
          continuePrompt: { en: 'Continue to drivers? (yes/no)', am: 'ወደ አሽከርካሪዎች መቀጠል? (አዎ/አይ)' },
          fields: [
            { 
              name: 'plateNumber', 
              question: { en: 'Plate Number? (Example: AA-1234)', am: 'የሰሌዳ ቁጥር? (ምሳሌ: AA-1234)' },
              validation: 'plate', 
              regex: /^[A-Z]{2,3}-?[0-9]{3,4}$/i, 
              example: { en: 'AA-1234', am: 'AA-1234' },
              error: { en: 'Invalid plate format.', am: 'ልክ ያልሆነ የሰሌዳ ቅርጸት።' }
            },
            { 
              name: 'plateCode', 
              question: { en: 'Plate Code? (Example: AA)', am: 'የሰሌዳ ኮድ? (ምሳሌ: AA)' },
              validation: 'text', 
              example: { en: 'AA', am: 'ኤኤ' },
              error: { en: 'Cannot be empty.', am: 'ባዶ መሆን አይችልም።' }
            },
            { 
              name: 'motorNumber', 
              question: { en: 'Motor Number? (Example: 1SG4001234567)', am: 'የሞተር ቁጥር? (ምሳሌ: 1SG4001234567)' },
              validation: 'text', 
              example: { en: '1SG4001234567', am: '1SG4001234567' },
              error: { en: 'Cannot be empty.', am: 'ባዶ መሆን አይችልም።' }
            },
            { 
              name: 'vinNumber', 
              question: { en: 'VIN or Chassis Number? (Example: LVBS6PE123456789)', am: 'VIN ወይም የቻሲስ ቁጥር? (ምሳሌ: LVBS6PE123456789)' },
              validation: 'vin', 
              regex: /^[A-HJ-NPR-Z0-9]{10,18}$/i, 
              example: { en: 'LVBS6PE123456789', am: 'LVBS6PE123456789' },
              error: { en: 'Invalid VIN/Chassis (10-17 characters).', am: 'ልክ ያልሆነ VIN/ቻሲስ (10-17 ቁምፊዎች)።' }
            },
            { 
              name: 'chassisNumber', 
              question: { en: 'Chassis Number?', am: 'የቻሲስ ቁጥር?' },
              validation: 'text', 
              example: { en: 'LVBS6PE123456789', am: 'LVBS6PE123456789' },
              error: { en: 'Cannot be empty.', am: 'ባዶ መሆን አይችልም።' },
              autoFill: true 
            },
            { 
              name: 'manufacturer', 
              question: { en: 'Manufacturer?', am: 'አምራች?' },
              validation: 'text', 
              example: { en: 'Toyota', am: 'ቶዮታ' },
              error: { en: 'Cannot be empty.', am: 'ባዶ መሆን አይችልም።' },
              autoFill: true 
            },
            { 
              name: 'vehicleModel', 
              question: { en: 'Vehicle Model?', am: 'የተሽከርካሪ ሞዴል?' },
              validation: 'text', 
              example: { en: 'Toyota Hilux', am: 'ቶዮታ ሃይሉክስ' },
              error: { en: 'Cannot be empty.', am: 'ባዶ መሆን አይችልም።' },
              autoFill: true 
            },
            { 
              name: 'manufactureYear', 
              question: { en: 'Year of Manufacture?', am: 'የምርት ዓመት?' },
              validation: 'year', 
              regex: /^(19|20)[0-9]{2}$/, 
              example: { en: '2020', am: '2020' },
              error: { en: 'Invalid year (e.g., 2020).', am: 'ልክ ያልሆነ ዓመት (ለምሳሌ: 2020)።' },
              autoFill: true 
            },
            { 
              name: 'vehicleType', 
              question: { en: 'Vehicle Type?', am: 'የተሽከርካሪ አይነት?' },
              validation: 'text', 
              example: { en: 'Truck', am: 'ጭነት መኪና' },
              error: { en: 'Cannot be empty.', am: 'ባዶ መሆን አይችልም።' },
              autoFill: true 
            },
            { 
              name: 'bodyPartType', 
              question: { en: 'Body Part Type?', am: 'የሰውነት ክፍል አይነት?' },
              validation: 'text', 
              example: { en: 'Crew Cab Truck', am: 'ክሩ ካብ መኪና' },
              error: { en: 'Cannot be empty.', am: 'ባዶ መሆን አይችልም።' },
              autoFill: true 
            },
            { 
              name: 'engineInfo', 
              question: { en: 'Engine Information?', am: 'የሞተር መረጃ?' },
              validation: 'text', 
              example: { en: '2.8L Diesel Turbo', am: '2.8L ናፍጣ ቱርቦ' },
              error: { en: 'Cannot be empty.', am: 'ባዶ መሆን አይችልም።' },
              autoFill: true 
            },
            { 
              name: 'engineCapacity', 
              question: { en: 'Engine Capacity (cc)?', am: 'የሞተር አቅም (ሲሲ)?' },
              validation: 'number', 
              regex: /^\d+$/, 
              example: { en: '2800', am: '2800' },
              error: { en: 'Please enter a number.', am: 'እባክዎ ቁጥር ያስገቡ።' },
              autoFill: true 
            },
            { 
              name: 'cylinderCount', 
              question: { en: 'Number of Cylinders?', am: 'የሲሊንደሮች ብዛት?' },
              validation: 'number', 
              regex: /^\d+$/, 
              example: { en: '4', am: '4' },
              error: { en: 'Please enter a number.', am: 'እባክዎ ቁጥር ያስገቡ።' },
              autoFill: true 
            },
            { 
              name: 'fuelType', 
              question: { en: 'Fuel Type?', am: 'የነዳጅ አይነት?' },
              validation: 'choice', 
              options: { en: ['Diesel', 'Petrol', 'Electric', 'Hybrid', 'LPG', 'CNG'], am: ['ናፍጣ', 'ቤንዚን', 'ኤሌክትሪክ', 'ሃይብሪድ', 'ኤልፒጂ', 'ሲኤንጂ'] },
              example: { en: 'Diesel', am: 'ናፍጣ' },
              error: { en: 'Please select a fuel type.', am: 'እባክዎ የነዳጅ አይነት ይምረጡ።' },
              autoFill: true 
            },
            { 
              name: 'serviceType', 
              question: { en: 'Service Type?', am: 'የአገልግሎት አይነት?' },
              validation: 'choice', 
              options: { en: ['Freight Transport', 'Passenger Transport', 'General Transport', 'Delivery Transport', 'Construction Transport', 'Liquid Transport', 'Cold Chain Transport'], am: ['የጭነት ትራንስፖርት', 'የተሳፋሪ ትራንስፖርት', 'አጠቃላይ ትራንስፖርት', 'የመላኪያ ትራንስፖርት', 'የግንባታ ትራንስፖርት', 'የፈሳሽ ትራንስፖርት', 'የቀዝቃዛ ሰንሰለት ትራንስፖርት'] },
              example: { en: 'Freight Transport', am: 'የጭነት ትራንስፖርት' },
              error: { en: 'Please select a service type.', am: 'እባክዎ የአገልግሎት አይነት ይምረጡ።' },
              autoFill: true 
            },
            { 
              name: 'totalWeight', 
              question: { en: 'Total Weight (kg)?', am: 'ጠቅላላ ክብደት (ኪግ)?' },
              validation: 'number', 
              regex: /^\d+$/, 
              example: { en: '3500', am: '3500' },
              error: { en: 'Please enter a number.', am: 'እባክዎ ቁጥር ያስገቡ።' },
              autoFill: true 
            },
            { 
              name: 'unladenWeight', 
              question: { en: 'Unladen Weight (kg)?', am: 'ባዶ ክብደት (ኪግ)?' },
              validation: 'number', 
              regex: /^\d+$/, 
              example: { en: '2500', am: '2500' },
              error: { en: 'Please enter a number.', am: 'እባክዎ ቁጥር ያስገቡ።' },
              autoFill: true 
            },
            { 
              name: 'loadCapacity', 
              question: { en: 'Load Capacity (kg)?', am: 'የጭነት አቅም (ኪግ)?' },
              validation: 'number', 
              regex: /^\d+$/, 
              example: { en: '1000', am: '1000' },
              error: { en: 'Please enter a number.', am: 'እባክዎ ቁጥር ያስገቡ።' },
              autoFill: true 
            },
            { 
              name: 'cargoVolume', 
              question: { en: 'Cargo Volume (kg)?', am: 'የጭነት መጠን (ኪግ)?' },
              validation: 'number', 
              regex: /^\d+$/, 
              example: { en: '5000', am: '5000' },
              error: { en: 'Please enter a number.', am: 'እባክዎ ቁጥር ያስገቡ።' },
              autoFill: true 
            },
            { 
              name: 'tonnage', 
              question: { en: 'Tonnage (T)?', am: 'ቶንነጅ (ቲ)?' },
              validation: 'number', 
              regex: /^\d+\.?\d*$/, 
              example: { en: '3.5', am: '3.5' },
              error: { en: 'Please enter a number.', am: 'እባክዎ ቁጥር ያስገቡ።' },
              autoFill: true 
            },
            { 
              name: 'gvw', 
              question: { en: 'Gross Vehicle Weight (kg)?', am: 'ጠቅላላ የተሽከርካሪ ክብደት (ኪግ)?' },
              validation: 'number', 
              regex: /^\d+$/, 
              example: { en: '3500', am: '3500' },
              error: { en: 'Please enter a number.', am: 'እባክዎ ቁጥር ያስገቡ።' },
              autoFill: true 
            },
            { 
              name: 'payload', 
              question: { en: 'Payload (kg)?', am: 'ጭነት (ኪግ)?' },
              validation: 'number', 
              regex: /^\d+$/, 
              example: { en: '1000', am: '1000' },
              error: { en: 'Please enter a number.', am: 'እባክዎ ቁጥር ያስገቡ።' },
              autoFill: true 
            },
            { 
              name: 'seatingCapacity', 
              question: { en: 'Seating Capacity?', am: 'የመቀመጫ አቅም?' },
              validation: 'number', 
              regex: /^\d+$/, 
              example: { en: '5', am: '5' },
              error: { en: 'Please enter a number.', am: 'እባክዎ ቁጥር ያስገቡ።' },
              autoFill: true 
            },
            { 
              name: 'wheelbase', 
              question: { en: 'Wheelbase (mm)?', am: 'የዊልቤዝ (ሚሜ)?' },
              validation: 'number', 
              regex: /^\d+$/, 
              example: { en: '3000', am: '3000' },
              error: { en: 'Please enter a number.', am: 'እባክዎ ቁጥር ያስገቡ።' },
              autoFill: true 
            },
            { 
              name: 'axelCount', 
              question: { en: 'Axel Count?', am: 'የአክሰል ብዛት?' },
              validation: 'number', 
              regex: /^\d+$/, 
              example: { en: '2', am: '2' },
              error: { en: 'Please enter a number.', am: 'እባክዎ ቁጥር ያስገቡ።' },
              autoFill: true 
            },
            { 
              name: 'color', 
              question: { en: 'Vehicle Color?', am: 'የተሽከርካሪ ቀለም?' },
              validation: 'text', 
              example: { en: 'White', am: 'ነጭ' },
              error: { en: 'Cannot be empty.', am: 'ባዶ መሆን አይችልም።' },
              autoFill: true 
            },
            { 
              name: 'bodyColor', 
              question: { en: 'Body Color?', am: 'የሰውነት ቀለም?' },
              validation: 'text', 
              example: { en: 'White', am: 'ነጭ' },
              error: { en: 'Cannot be empty.', am: 'ባዶ መሆን አይችልም።' },
              autoFill: true 
            },
            { 
              name: 'interiorColor', 
              question: { en: 'Interior Color?', am: 'የውስጥ ቀለም?' },
              validation: 'text', 
              example: { en: 'Black', am: 'ጥቁር' },
              error: { en: 'Cannot be empty.', am: 'ባዶ መሆን አይችልም።' },
              autoFill: true 
            },
            { 
              name: 'assemblyPlant', 
              question: { en: 'Assembly Plant?', am: 'የመሰብሰቢያ ፋብሪካ?' },
              validation: 'text', 
              example: { en: 'China - Beijing', am: 'ቻይና - ቤዪጂንግ' },
              error: { en: 'Cannot be empty.', am: 'ባዶ መሆን አይችልም።' },
              autoFill: true 
            },
            { 
              name: 'gpsInfo', 
              question: { en: 'GPS Info (lat, lon)?', am: 'GPS መረጃ (ላቲቱድ፣ ሎንጂቱድ)?' },
              validation: 'text', 
              example: { en: '39.9042, 116.4074', am: '39.9042, 116.4074' },
              error: { en: 'Invalid GPS format.', am: 'ልክ ያልሆነ የጂፒኤስ ቅርጸት።' },
              autoFill: true 
            }
          ],
          onValid: { nextStep: 3, collectionKey: 'vehicles' }
        }
      },
      3: {
        type: 'subprocess',
        title: { en: 'Driver Management', am: 'የአሽከርካሪ አስተዳደር' },
        subprocess: {
          itemName: { en: 'Driver', am: 'አሽከርካሪ' },
          addPrompt: { en: 'Add a driver? (yes/no)', am: 'አሽከርካሪ ማከል ይፈልጋሉ? (አዎ/አይ)' },
          continuePrompt: { en: 'Continue to completion? (yes/no)', am: 'ወደ መጨረሻ መቀጠል? (አዎ/አይ)' },
          fields: [
            { 
              name: 'driverName', 
              question: { en: 'Driver Name? (Example: Abebe Kebede)', am: 'የአሽከርካሪ ስም? (ምሳሌ: አበበ ከበደ)' },
              validation: 'text', 
              example: { en: 'Abebe Kebede', am: 'አበበ ከበደ' },
              error: { en: 'Cannot be empty.', am: 'ባዶ መሆን አይችልም።' }
            },
            { 
              name: 'driverLicense', 
              question: { en: 'Driver License Number? (Example: DL123456)', am: 'የመንጃ ፈቃድ ቁጥር? (ምሳሌ: DL123456)' },
              validation: 'text', 
              example: { en: 'DL123456', am: 'DL123456' },
              error: { en: 'Cannot be empty.', am: 'ባዶ መሆን አይችልም።' }
            }
          ],
          onValid: { nextStep: 4, collectionKey: 'drivers' }
        }
      },
      4: {
        type: 'summary',
        title: { en: 'Registration Complete', am: 'ምዝገባ ተጠናቀቀ' },
        isFinal: true,
        actions: { en: ['Download Certificate', 'Print Summary', 'Start New Registration'], am: ['የምስክር ወረቀት አውርድ', 'ማጠቃለያ አትም', 'አዲስ ምዝገባ ጀምር'] }
      }
    }
  },
  documentAnalysis: {
    id: 'documentAnalysis',
    name: { en: 'Document Analysis', am: 'የሰነድ ትንተና' },
    description: { en: 'Analyze research papers, legal documents, and financial statements', am: 'የምርምር ወረቀቶችን፣ የህግ ሰነዶችን እና የፋይናንስ ሪፖርቶችን ይተንትኑ' },
    initStep: 1,
    collectedData: { document: null, analysisType: null },
    steps: {
      1: {
        type: 'file_upload',
        title: { en: 'Upload Document', am: 'ሰነድ ስቀል' },
        prompt: { en: '📄 Please upload the document you want me to analyze:', am: '📄 እባክዎ መተንተን የሚፈልጉትን ሰነድ ያስገቡ:' },
        onValid: { nextStep: 2 }
      },
      2: {
        type: 'form',
        title: { en: 'Analysis Type', am: 'የትንተና አይነት' },
        fields: [
          { 
            name: 'analysisType', 
            question: { en: 'What type of analysis do you want? (Example: Summarize)', am: 'ምን አይነት ትንተና ይፈልጋሉ? (ምሳሌ: ማጠቃለል)' },
            validation: 'choice', 
            options: { en: ['Summarize', 'Extract Key Points', 'Find Keywords', 'Analyze Sentiment'], am: ['ማጠቃለል', 'ቁልፍ ነጥቦችን ማውጣት', 'ቁልፍ ቃላትን መፈለግ', 'ስሜትን መተንተን'] },
            example: { en: 'Summarize', am: 'ማጠቃለል' },
            error: { en: 'Please select an option.', am: 'እባክዎ አማራጭ ይምረጡ።' }
          }
        ],
        onValid: { nextStep: 3 }
      },
      3: {
        type: 'result',
        title: { en: 'Analysis Result', am: 'የትንተና ውጤት' },
        prompt: { en: '✅ Analysis complete!', am: '✅ ትንተና ተጠናቀቀ!' },
        isFinal: true,
        actions: { en: ['New Analysis', 'Export Results', 'Start Over'], am: ['አዲስ ትንተና', 'ውጤቶችን ወደ ውጭ ላክ', 'እንደገና ጀምር'] }
      }
    }
  },
  videoGeneration: {
    id: 'videoGeneration',
    name: { en: 'Video Generation', am: 'ቪዲዮ ማምረት' },
    description: { en: 'Create video clips, slideshows, and advertisements', am: 'የቪዲዮ ክሊፖችን፣ ስላይድሾዎችን እና ማስታወቂያዎችን ይፍጠሩ' },
    initStep: 1,
    collectedData: { videoType: null, duration: null },
    steps: {
      1: {
        type: 'form',
        title: { en: 'Video Details', am: 'የቪዲዮ ዝርዝሮች' },
        fields: [
          { 
            name: 'videoType', 
            question: { en: 'What type of video? (Example: Slideshow)', am: 'ምን አይነት ቪዲዮ? (ምሳሌ: ስላይድሾው)' },
            validation: 'choice', 
            options: { en: ['Slideshow', 'Video Clip', 'Advertisement'], am: ['ስላይድሾው', 'ቪዲዮ ክሊፕ', 'ማስታወቂያ'] },
            example: { en: 'Slideshow', am: 'ስላይድሾው' },
            error: { en: 'Please select a video type.', am: 'እባክዎ የቪዲዮ አይነት ይምረጡ።' }
          },
          { 
            name: 'duration', 
            question: { en: 'Duration (seconds)? (Example: 30)', am: 'ቆይታ (ሰከንዶች)? (ምሳሌ: 30)' },
            validation: 'number', 
            regex: /^\d+$/, 
            example: { en: '30', am: '30' },
            error: { en: 'Please enter a number.', am: 'እባክዎ ቁጥር ያስገቡ።' }
          }
        ],
        onValid: { nextStep: 2 }
      },
      2: {
        type: 'file_upload',
        title: { en: 'Upload Media', am: 'ሚዲያ ስቀል' },
        prompt: { en: '📷 Upload images or provide a script:', am: '📷 ምስሎችን ያስገቡ ወይም ስክሪፕት ያቅርቡ:' },
        onValid: { nextStep: 3 }
      },
      3: {
        type: 'summary',
        title: { en: 'Video Generation Complete', am: 'ቪዲዮ ማምረት ተጠናቀቀ' },
        prompt: { en: '✅ Your video is ready to generate!', am: '✅ ቪዲዮዎ ለማምረት ዝግጁ ነው!' },
        isFinal: true,
        actions: { en: ['Generate Video', 'Edit Script', 'Start Over'], am: ['ቪዲዮ አምርት', 'ስክሪፕት አርትዕ', 'እንደገና ጀምር'] }
      }
    }
  }
};

// ============================================================
// STATE
// ============================================================

let currentService = 'iftms';
let modelWorker = null;
let callbacks = new Map();
let callbackId = 0;
let workerReady = false;

// In-memory services
let services = {};
let servicesInitialized = false;
let db = null;

const serviceStates = {};

// ============================================================
// COMPLETION TRACKING - FIXED
// ============================================================

function isServiceComplete(serviceId) {
  const state = serviceStates[serviceId];
  if (!state) return false;
  return state.isComplete === true;
}

function markServiceComplete(serviceId) {
  if (!serviceStates[serviceId]) {
    const svc = services[serviceId];
    serviceStates[serviceId] = {
      currentStep: svc?.initStep || 1,
      currentFieldIndex: 0,
      waitingForAdd: false,
      waitingForContinue: false,
      currentItem: {},
      collectedData: JSON.parse(JSON.stringify(svc?.collectedData || {})),
      isComplete: true
    };
  } else {
    serviceStates[serviceId].isComplete = true;
  }
  saveGlobalState();
}

function resetService(serviceId) {
  const svc = services[serviceId];
  if (!svc) return;
  
  serviceStates[serviceId] = {
    currentStep: svc.initStep || 1,
    currentFieldIndex: 0,
    waitingForAdd: false,
    waitingForContinue: false,
    currentItem: {},
    collectedData: JSON.parse(JSON.stringify(svc.collectedData || {})),
    isComplete: false
  };
  saveGlobalState();
}

// ============================================================
// INITIALIZE - LOAD FROM DB OR POPULATE
// ============================================================

async function initializeServices() {
  if (servicesInitialized) return true;
  
  try {
    console.log('📂 Initializing services...');
    db = await getServiceConfigDB();
    
    const dbConfigs = await db.getAllServiceConfigs();
    
    if (dbConfigs && dbConfigs.length > 0) {
      console.log(`✅ Found ${dbConfigs.length} services in database`);
      
      for (const dbConfig of dbConfigs) {
        if (dbConfig.isActive !== false) {
          const service = {
            id: dbConfig.serviceId,
            name: dbConfig.name,
            description: dbConfig.description,
            initStep: dbConfig.initStep || 1,
            collectedData: dbConfig.collectedData || {},
            steps: dbConfig.steps || {}
          };
          if (service && service.id) {
            services[service.id] = service;
            console.log(`  ✅ Loaded: ${service.id} - ${getLocalized(service.name)}`);
          }
        }
      }
    }
    
    if (Object.keys(services).length === 0) {
      console.log('📂 Database empty, populating with default services...');
      
      for (const [id, service] of Object.entries(DEFAULT_SERVICES)) {
        const dbConfig = {
          id: `${id}_v1`,
          serviceId: id,
          name: service.name,
          description: service.description,
          initStep: service.initStep,
          collectedData: service.collectedData,
          steps: service.steps,
          isActive: true,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await db.saveServiceConfig(dbConfig);
        services[id] = service;
        console.log(`  ✅ Added default: ${id} - ${getLocalized(service.name)}`);
      }
      
      console.log('✅ Default services saved to database!');
    }
    
    // Initialize states for ALL services with isComplete: false
    for (const [id, svc] of Object.entries(services)) {
      if (!serviceStates[id]) {
        serviceStates[id] = {
          currentStep: svc.initStep || 1,
          currentFieldIndex: 0,
          waitingForAdd: false,
          waitingForContinue: false,
          currentItem: {},
          collectedData: JSON.parse(JSON.stringify(svc.collectedData || {})),
          isComplete: false
        };
      } else {
        // Ensure isComplete is explicitly false for all services on init
        serviceStates[id].isComplete = false;
      }
    }
    
    servicesInitialized = true;
    console.log(`📚 Services initialized: ${Object.keys(services).length} available`);
    return true;
    
  } catch (error) {
    console.error('❌ Error initializing services:', error);
    services = { ...DEFAULT_SERVICES };
    servicesInitialized = true;
    
    for (const [id, svc] of Object.entries(services)) {
      if (!serviceStates[id]) {
        serviceStates[id] = {
          currentStep: svc.initStep || 1,
          currentFieldIndex: 0,
          waitingForAdd: false,
          waitingForContinue: false,
          currentItem: {},
          collectedData: JSON.parse(JSON.stringify(svc.collectedData || {})),
          isComplete: false
        };
      } else {
        serviceStates[id].isComplete = false;
      }
    }
    return true;
  }
}

// ============================================================
// GET FUNCTIONS
// ============================================================

function getState() {
  if (!servicesInitialized) {
    initializeServices();
  }
  
  if (!serviceStates[currentService]) {
    const svc = getService();
    if (svc) {
      serviceStates[currentService] = {
        currentStep: svc.initStep || 1,
        currentFieldIndex: 0,
        waitingForAdd: false,
        waitingForContinue: false,
        currentItem: {},
        collectedData: JSON.parse(JSON.stringify(svc.collectedData || {})),
        isComplete: false
      };
    } else {
      serviceStates[currentService] = {
        currentStep: 1,
        currentFieldIndex: 0,
        waitingForAdd: false,
        waitingForContinue: false,
        currentItem: {},
        collectedData: {},
        isComplete: false
      };
    }
  }
  return serviceStates[currentService];
}

function getService() {
  if (!servicesInitialized) {
    initializeServices();
  }
  
  if (!services[currentService]) {
    const keys = Object.keys(services);
    if (keys.length > 0) {
      currentService = keys[0];
    } else {
      services = { ...DEFAULT_SERVICES };
      currentService = 'iftms';
    }
  }
  
  return services[currentService] || DEFAULT_SERVICES.iftms;
}

function getStep() {
  const svc = getService();
  if (!svc || !svc.steps) {
    console.error('Service or steps is undefined!');
    return null;
  }
  const state = getState();
  const step = svc.steps[state.currentStep];
  if (!step) {
    console.warn(`Step ${state.currentStep} not found, resetting to 1`);
    state.currentStep = 1;
    saveGlobalState();
    return svc.steps[1] || null;
  }
  return step;
}

function getCurrentField() {
  const step = getStep();
  if (!step) return null;
  const state = getState();
  const fields = step.subprocess?.fields || step.fields || [];
  return fields[state.currentFieldIndex] || null;
}

function saveGlobalState() {
  try {
    sessionStorage.setItem('app_state', JSON.stringify({ currentService, states: serviceStates }));
  } catch (e) {}
}

function loadGlobalState() {
  try {
    const saved = sessionStorage.getItem('app_state');
    if (saved) {
      const data = JSON.parse(saved);
      currentService = data.currentService || currentService;
      for (const [id, st] of Object.entries(data.states || {})) {
        if (serviceStates[id]) Object.assign(serviceStates[id], st);
      }
    }
  } catch (e) {}
}

loadGlobalState();

// ============================================================
// KEYWORD CHECKS
// ============================================================

const SERVICE_KEYWORDS = {
  videoGeneration: ['video', 'clip', 'slideshow', 'advertisement', 'promo', 'animation'],
  documentAnalysis: ['analyze', 'analysis', 'research', 'document', 'paper', 'academic', 'legal', 'contract', 'financial', 'invoice'],
  iftms: ['freight', 'transport', 'cargo', 'iftms', 'operator', 'vehicle', 'driver', 'truck', 'logistics']
};

function checkServiceSwitch(message) {
  if (!message) return null;
  const lower = message.toLowerCase();
  for (const [serviceId, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      return serviceId;
    }
  }
  return null;
}

const YES_WORDS = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'yup', 'of course', 'አዎ'];
const NO_WORDS = ['no', 'nope', 'nah', 'not yet', 'skip', 'አይ'];

function checkYesNo(message) {
  if (!message) return null;
  const lower = message.trim().toLowerCase();
  if (YES_WORDS.some(w => lower === w || lower.startsWith(w + ' '))) return 'yes';
  if (NO_WORDS.some(w => lower === w || lower.startsWith(w + ' '))) return 'no';
  return null;
}

// ============================================================
// IFMTS SYNC
// ============================================================

async function syncToIfmts(collectedData) {
  console.log('📋 ===== IFMTS SYNC START =====');
  console.log('📋 Collected Data:', JSON.stringify(collectedData, null, 2));
  
  let phoneNumber = '';
  let password = '';
  
  if (collectedData.operator) {
    phoneNumber = collectedData.operator.phoneNumber || '';
    password = collectedData.operator.password || '';
    console.log('📞 Phone from operator:', phoneNumber);
    console.log('🔑 Password from operator:', password ? '***provided***' : 'NOT provided');
  }
  
  if (!phoneNumber && collectedData.phoneNumber) {
    phoneNumber = collectedData.phoneNumber;
    console.log('📞 Phone from direct:', phoneNumber);
  }
  if (!password && collectedData.password) {
    password = collectedData.password;
    console.log('🔑 Password from direct:', password ? '***provided***' : 'NOT provided');
  }
  
  if (!phoneNumber || !password) {
    const state = getState();
    if (state && state.collectedData) {
      const op = state.collectedData.operator || {};
      if (!phoneNumber) phoneNumber = op.phoneNumber || '';
      if (!password) password = op.password || '';
      console.log('📞 Phone from state:', phoneNumber);
      console.log('🔑 Password from state:', password ? '***provided***' : 'NOT provided');
    }
  }
  
  if (!phoneNumber || phoneNumber.trim() === '') {
    console.error('❌ Phone number is missing or empty');
    return {
      success: false,
      error: { en: '⚠️ Phone number is required. Please provide your IFMTS phone number in operator registration.', am: '⚠️ ስልክ ቁጥር ያስፈልጋል። እባክዎ የIFMTS ስልክ ቁጥርዎን በኦፕሬተር ምዝገባ ያስገቡ።' },
      requiresCredentials: true
    };
  }
  
  if (!password || password.trim() === '') {
    console.error('❌ Password is missing or empty');
    return {
      success: false,
      error: { en: '⚠️ Password is required. Please provide your IFMTS password in operator registration.', am: '⚠️ ይለፍ ቃል ያስፈልጋል። እባክዎ የIFMTS ይለፍ ቃልዎን በኦፕሬተር ምዝገባ ያስገቡ።' },
      requiresCredentials: true
    };
  }

  console.log(`✅ Credentials found - Phone: ${phoneNumber}`);

  try {
    console.log('🔄 ===== CALLING IFMTS API =====');
    console.log(`📱 Phone: ${phoneNumber}`);
    console.log(`🔑 Password: ${password ? '***' : 'missing'}`);
    console.log('📋 Data being synced:', {
      operator: collectedData.operator ? '✅' : '❌',
      vehicles: collectedData.vehicles?.length || 0,
      drivers: collectedData.drivers?.length || 0
    });
    
    const result = await loginApi.processIfmtsData(
      collectedData,
      { username: phoneNumber.trim(), password: password.trim() }
    );
    
    console.log('📊 ===== IFMTS API RESPONSE =====');
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('❌ IFMTS sync error:', error);
    console.error('❌ Error stack:', error.stack);
    return {
      success: false,
      error: { en: error.message || 'Unknown error occurred during sync', am: 'የማመሳሰል ስህተት ተከስቷል' },
      requiresCredentials: false
    };
  }
}

// ============================================================
// MODEL WORKER
// ============================================================

export async function initModel() {
  if (modelWorker) return true;
  return new Promise((resolve) => {
    try {
      modelWorker = new Worker(new URL('./modelWorker.js', import.meta.url), { type: 'module' });
      modelWorker.onmessage = (e) => {
        const { type, data, id } = e.data;
        if (type === 'ready') { workerReady = true; resolve(true); }
        if (type === 'response' && callbacks.has(id)) {
          callbacks.get(id)(data);
          callbacks.delete(id);
        }
        if (type === 'error') { console.error('Worker error:', e.data.error); if (!workerReady) resolve(true); }
      };
      modelWorker.onerror = () => resolve(true);
      setTimeout(() => resolve(true), 5000);
    } catch (error) {
      resolve(true);
    }
  });
}

function callModel(data) {
  return new Promise((resolve) => {
    const id = callbackId++;
    callbacks.set(id, resolve);
    if (modelWorker && workerReady) {
      modelWorker.postMessage({ type: 'predict', data, id });
    } else {
      const msg = data.userMessage || '';
      const lowerMsg = msg.toLowerCase();
      let action = 'save';
      let value = msg;
      
      if (lowerMsg.includes('help') || lowerMsg.includes('what can you do') || lowerMsg.includes('እገዛ')) {
        action = 'help';
      } else if (lowerMsg.includes('status') || lowerMsg.includes('progress') || lowerMsg.includes('ሁኔታ')) {
        action = 'status';
      } else if (lowerMsg.includes('complete') || lowerMsg.includes('done') || lowerMsg.includes('finish') || lowerMsg.includes('ተጠናቀቀ')) {
        action = 'complete';
      }
      
      resolve({ action, value });
    }
  });
}

// ============================================================
// VALIDATION
// ============================================================

function validateField(input, field) {
  const value = input?.toString().trim();
  const errorMsg = getLocalized(field.error);
  const exampleMsg = getLocalized(field.example);
  
  if (!value) return { valid: false, message: errorMsg || 'Cannot be empty' };

  if (field.validation === 'choice' && field.options) {
    const options = getLocalizedOptions(field.options);
    const match = options.find(opt => opt.toLowerCase() === value.toLowerCase());
    if (match) return { valid: true, value: match };
    return { valid: false, message: `${errorMsg || 'Choose from:'} ${options.join(', ')}` };
  }

  if (field.regex && !field.regex.test(value)) {
    return { valid: false, message: errorMsg || `Invalid. Example: ${exampleMsg}` };
  }

  return { valid: true, value };
}

function saveToState(fieldName, value) {
  const state = getState();
  const step = getStep();
  if (!step) return;
  if (step.type === 'form') {
    if (!state.collectedData.operator) state.collectedData.operator = {};
    state.collectedData.operator[fieldName] = value;
  } else if (step.subprocess) {
    state.currentItem[fieldName] = value;
  }
  saveGlobalState();
}

// ============================================================
// VIN PROCESSING
// ============================================================

function processVIN(input) {
  try {
    if (!input) return null;
    
    if (!vinDecoder) {
      console.warn('vinDecoder not available');
      return null;
    }
    
    if (typeof vinDecoder.isVIN !== 'function') {
      console.warn('vinDecoder.isVIN is not a function');
      return null;
    }
    
    if (!vinDecoder.isVIN(input)) {
      return null;
    }
    
    let vin = input;
    if (typeof vinDecoder.extractVIN === 'function') {
      const extracted = vinDecoder.extractVIN(input);
      if (extracted) {
        vin = extracted;
      }
    }
    
    vin = vin.trim().toUpperCase();
    
    if (typeof vinDecoder.getCompleteVehicleData !== 'function') {
      console.warn('vinDecoder.getCompleteVehicleData is not a function');
      return {
        vinNumber: vin,
        manufacturer: 'Unknown',
        vehicleModel: 'Unknown',
        manufactureYear: 'Unknown',
        vehicleType: 'Unknown',
        bodyPartType: 'Unknown',
        engineInfo: 'Unknown',
        engineCapacity: 'Unknown',
        cylinderCount: 'Unknown',
        fuelType: 'Unknown',
        serviceType: 'Unknown',
        totalWeight: 'Unknown',
        unladenWeight: 'Unknown',
        loadCapacity: 'Unknown',
        cargoVolume: 'Unknown',
        tonnage: 'Unknown',
        gvw: 'Unknown',
        payload: 'Unknown',
        seatingCapacity: 'Unknown',
        wheelbase: 'Unknown',
        axelCount: 'Unknown',
        color: 'Unknown',
        bodyColor: 'Unknown',
        interiorColor: 'Unknown',
        assemblyPlant: 'Unknown',
        gpsInfo: 'Unknown'
      };
    }
    
    const data = vinDecoder.getCompleteVehicleData(vin);
    
    if (!data || typeof data !== 'object') {
      return {
        vinNumber: vin,
        manufacturer: 'Unknown',
        vehicleModel: 'Unknown',
        manufactureYear: 'Unknown',
        vehicleType: 'Unknown',
        bodyPartType: 'Unknown',
        engineInfo: 'Unknown',
        engineCapacity: 'Unknown',
        cylinderCount: 'Unknown',
        fuelType: 'Unknown',
        serviceType: 'Unknown',
        totalWeight: 'Unknown',
        unladenWeight: 'Unknown',
        loadCapacity: 'Unknown',
        cargoVolume: 'Unknown',
        tonnage: 'Unknown',
        gvw: 'Unknown',
        payload: 'Unknown',
        seatingCapacity: 'Unknown',
        wheelbase: 'Unknown',
        axelCount: 'Unknown',
        color: 'Unknown',
        bodyColor: 'Unknown',
        interiorColor: 'Unknown',
        assemblyPlant: 'Unknown',
        gpsInfo: 'Unknown'
      };
    }
    
    return data;
  } catch (error) {
    console.error('VIN processing error:', error);
    return {
      vinNumber: input.trim().toUpperCase(),
      manufacturer: 'Unknown',
      vehicleModel: 'Unknown',
      manufactureYear: 'Unknown',
      vehicleType: 'Unknown',
      bodyPartType: 'Unknown',
      engineInfo: 'Unknown',
      engineCapacity: 'Unknown',
      cylinderCount: 'Unknown',
      fuelType: 'Unknown',
      serviceType: 'Unknown',
      totalWeight: 'Unknown',
      unladenWeight: 'Unknown',
      loadCapacity: 'Unknown',
      cargoVolume: 'Unknown',
      tonnage: 'Unknown',
      gvw: 'Unknown',
      payload: 'Unknown',
      seatingCapacity: 'Unknown',
      wheelbase: 'Unknown',
      axelCount: 'Unknown',
      color: 'Unknown',
      bodyColor: 'Unknown',
      interiorColor: 'Unknown',
      assemblyPlant: 'Unknown',
      gpsInfo: 'Unknown'
    };
  }
}

function isAutoFillField(field) {
  return field && field.autoFill === true;
}

// ============================================================
// STEP INTRO & COMPLETE
// ============================================================

async function stepIntro() {
  const step = getStep();
  const state = getState();
  
  if (!step) {
    const defaultMsg = { en: 'How can I help?', am: 'እንዴት ልረዳ?' };
    const text = getLocalized(defaultMsg);
    return { text: text, html: `<div>${text}</div>`, isStructured: true };
  }

  // Check if THIS specific service is complete
  if (isServiceComplete(currentService)) {
    return await buildComplete();
  }

  // If this is a final/summary step but the service isn't marked complete yet,
  // mark it complete now
  if (step.isFinal || step.type === 'summary' || step.type === 'result') {
    markServiceComplete(currentService);
    return await buildComplete();
  }

  if (step.type === 'file_upload') {
    const prompt = getLocalized(step.prompt);
    return { text: prompt, html: `<div>${prompt}</div>`, isStructured: true };
  }

  if (step.subprocess && step.subprocess.fields) {
    const fields = step.subprocess.fields;
    let firstNonAutoFillIndex = -1;
    for (let i = 0; i < fields.length; i++) {
      if (!isAutoFillField(fields[i])) {
        firstNonAutoFillIndex = i;
        break;
      }
    }
    if (firstNonAutoFillIndex === -1) {
      state.waitingForAdd = true;
      state.currentFieldIndex = 0;
      saveGlobalState();
      const addPrompt = getLocalized(step.subprocess.addPrompt);
      const title = getLocalized(step.title);
      return {
        text: addPrompt,
        html: `<div><strong>${title}</strong><br>${addPrompt}</div>`,
        isStructured: true
      };
    }
    state.waitingForAdd = true;
    state.currentFieldIndex = firstNonAutoFillIndex;
    saveGlobalState();
    const firstField = fields[firstNonAutoFillIndex];
    const title = getLocalized(step.title);
    const question = getLocalized(firstField.question);
    return {
      text: question,
      html: `<div><strong>${title}</strong><br>${question}</div>`,
      isStructured: true
    };
  }

  const firstField = step.fields?.[0];
  if (firstField) {
    const title = getLocalized(step.title);
    const question = getLocalized(firstField.question);
    return {
      text: question,
      html: `<div><strong>${title}</strong><br>${question}</div>`,
      isStructured: true
    };
  }

  const prompt = getLocalized(step.prompt) || getLocalized({ en: 'How can I help?', am: 'እንዴት ልረዳ?' });
  return { text: prompt, html: `<div>${prompt}</div>`, isStructured: true };
}

async function buildComplete() {
  const state = getState();
  const svc = getService();
  const lang = getLanguage();
  const isAmharic = lang === 'am';
  
  // CRITICAL: Check if this service is actually complete
  if (!isServiceComplete(currentService)) {
    // This service isn't complete - show the current step instead
    const step = getStep();
    if (step) {
      const title = getLocalized(step.title);
      const prompt = getLocalized(step.prompt);
      const notCompleteMsg = getLocalized({ 
        en: 'This service is not yet complete. Please continue with the registration.', 
        am: 'ይህ አገልግሎት እስካሁን አልተጠናቀቀም። እባክዎ ምዝገባውን ይቀጥሉ።' 
      });
      return {
        text: `${notCompleteMsg}\n\n${title}: ${prompt || ''}`,
        html: `<div>${notCompleteMsg}<br><br><strong>${title}</strong><br>${prompt || ''}</div>`,
        isStructured: true
      };
    }
    return {
      text: getLocalized({ en: 'Service not complete. Please continue.', am: 'አገልግሎት አልተጠናቀቀም። እባክዎ ይቀጥሉ።' }),
      html: `<div>${getLocalized({ en: 'Service not complete. Please continue.', am: 'አገልግሎት አልተጠናቀቀም። እባክዎ ይቀጥሉ።' })}</div>`,
      isStructured: true
    };
  }
  
  // Build the summary ONLY for this service
  let summary = `${getLocalized(svc.name)} ${getLocalized({ en: 'Complete!', am: 'ተጠናቀቀ!' })}\n\n`;
  
  for (const [key, val] of Object.entries(state.collectedData)) {
    if (!val) continue;
    const label = isAmharic ? 
      { operator: 'ኦፕሬተር', vehicles: 'ተሽከርካሪዎች', drivers: 'አሽከርካሪዎች' }[key] || key.toUpperCase() :
      key.toUpperCase();
    summary += `📋 ${label}:\n`;
    if (Array.isArray(val)) {
      val.forEach((item, i) => {
        summary += `  ${i + 1}. ${Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(', ')}\n`;
      });
    } else if (typeof val === 'object') {
      Object.entries(val).forEach(([k, v]) => { summary += `  • ${k}: ${v}\n`; });
    }
  }
  
  // IFMTS sync only for this service
  if (currentService === 'iftms' || svc.id === 'iftms') {
    const collectedData = state.collectedData;
    const syncMsg = getLocalized({ en: '🔄 Syncing to IFMTS...', am: '🔄 ወደ IFMTS በማመሳሰል ላይ...' });
    summary += `\n${syncMsg}\n`;
    
    try {
      const syncResult = await syncToIfmts(collectedData);
      
      if (syncResult.success) {
        const successMsg = getLocalized({ en: '✅ Data synced to IFMTS successfully!', am: '✅ መረጃ ወደ IFMTS በተሳካ ሁኔታ ተመሳሰለ!' });
        summary += `\n${successMsg}\n`;
        const operatorLabel = getLocalized({ en: 'Operator', am: 'ኦፕሬተር' });
        const vehiclesLabel = getLocalized({ en: 'Vehicles', am: 'ተሽከርካሪዎች' });
        const driversLabel = getLocalized({ en: 'Drivers', am: 'አሽከርካሪዎች' });
        summary += `  • ${operatorLabel}: ${syncResult.operator?.success ? '✅ ' + getLocalized({ en: 'Registered', am: 'ተመዝግቧል' }) : '❌ ' + getLocalized({ en: 'Failed', am: 'አልተሳካም' })}\n`;
        summary += `  • ${vehiclesLabel}: ${syncResult.vehicles?.filter(v => v.success).length || 0}/${syncResult.vehicles?.length || 0} ${getLocalized({ en: 'added', am: 'ተጨምሯል' })}\n`;
        summary += `  • ${driversLabel}: ${syncResult.drivers?.filter(d => d.success).length || 0}/${syncResult.drivers?.length || 0} ${getLocalized({ en: 'added', am: 'ተጨምሯል' })}\n`;
        if (syncResult.errors && syncResult.errors.length > 0) {
          const errorMsg = getLocalized({ en: '⚠️ Errors occurred during sync.', am: '⚠️ በማመሳሰል ወቅት ስህተቶች ተከስተዋል።' });
          summary += `\n${errorMsg}`;
        }
      } else if (syncResult.requiresCredentials) {
        const errorText = getLocalized(syncResult.error);
        summary += `\n⚠️ ${errorText}`;
        const updateMsg = getLocalized({ en: 'Please update your operator information with IFMTS credentials.', am: 'እባክዎ የኦፕሬተር መረጃዎን በIFMTS ምስክርነቶች ያዘምኑ።' });
        summary += `\n${updateMsg}`;
      } else {
        const errorText = getLocalized(syncResult.error) || getLocalized({ en: 'Unknown error', am: 'ያልታወቀ ስህተት' });
        summary += `\n❌ ${getLocalized({ en: 'Failed to sync to IFMTS:', am: 'ወደ IFMTS ማመሳሰል አልተሳካም:' })} ${errorText}`;
        const checkMsg = getLocalized({ en: 'Please check your credentials and try again.', am: 'እባክዎ ምስክርነቶችዎን ያረጋግጡ እና እንደገና ይሞክሩ።' });
        summary += `\n${checkMsg}`;
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
      summary += `\n❌ ${getLocalized({ en: 'Sync error:', am: 'የማመሳሰል ስህተት:' })} ${error.message}`;
    }
  }
  
  return {
    text: summary,
    html: `<div><pre style="white-space:pre-wrap">${summary}</pre></div>`,
    isStructured: true,
    isComplete: true,
    serviceId: currentService
  };
}

// ============================================================
// ACTION EXECUTOR
// ============================================================

async function executeAction(action, rawValue, originalMessage) {
  try {
    const state = getState();
    const step = getStep();
    const currentField = getCurrentField();

    if (!step) {
      const errorMsg = getLocalized({ en: 'System error', am: 'የስርዓት ስህተት' });
      return { text: errorMsg, html: `<div>${errorMsg}</div>`, isStructured: true };
    }

    if (!originalMessage || originalMessage.trim() === '') {
      if (currentField) {
        const question = getLocalized(currentField.question);
        return { text: question, html: `<div>${question}</div>`, isStructured: true };
      }
      const prompt = getLocalized({ en: 'Please enter a value.', am: 'እባክዎ እሴት ያስገቡ።' });
      return { text: prompt, html: `<div>${prompt}</div>`, isStructured: true };
    }

    switch (action) {
      case 'save': {
        if (!currentField) {
          const received = getLocalized({ en: 'I received:', am: 'ተቀብያለሁ:' });
          return { text: `${received} ${originalMessage}`, html: `<div>${received} ${originalMessage}</div>`, isStructured: true };
        }

        if (currentField.name === 'vinNumber' || currentField.name === 'chassisNumber') {
          console.log('🔍 Processing VIN field with input:', originalMessage);
          
          const vinResult = processVIN(originalMessage);
          
          if (vinResult) {
            console.log('✅ VIN processed successfully:', vinResult);
            
            const fields = step.subprocess?.fields || [];
            
            saveToState('vinNumber', vinResult.vinNumber || originalMessage.trim().toUpperCase());
            state.currentFieldIndex++;
            
            let autoFilledCount = 0;
            for (const field of fields) {
              if (isAutoFillField(field)) {
                const fieldName = field.name;
                const fieldValue = vinResult[fieldName];
                
                if (fieldValue && fieldValue !== 'Unknown' && fieldValue !== '' && fieldValue !== null && fieldValue !== undefined) {
                  saveToState(fieldName, fieldValue);
                  state.currentFieldIndex++;
                  autoFilledCount++;
                  console.log(`  ✅ Auto-filled ${fieldName}: ${fieldValue}`);
                }
              }
            }
            
            while (state.currentFieldIndex < fields.length && isAutoFillField(fields[state.currentFieldIndex])) {
              state.currentFieldIndex++;
            }
            
            saveGlobalState();
            
            if (state.currentFieldIndex >= fields.length) {
              if (step.subprocess) {
                const key = step.subprocess.onValid.collectionKey;
                state.collectedData[key].push({ ...state.currentItem });
                state.currentItem = {};
                state.currentFieldIndex = 0;
                state.waitingForAdd = true;
                saveGlobalState();
                
                const addPrompt = getLocalized(step.subprocess.addPrompt);
                const savedMsg = getLocalized({ en: '✅ Vehicle saved!', am: '✅ ተሽከርካሪ ተቀመጠ!' });
                const autoFillMsg = getLocalized({ en: 'fields auto-filled from VIN', am: 'መስኮች ከVIN በራስ-ሰር ተሞልተዋል' });
                return {
                  text: addPrompt,
                  html: `<div>${savedMsg} (${autoFilledCount} ${autoFillMsg})<br>${addPrompt}</div>`,
                  isStructured: true
                };
              }
            }
            
            const nextField = getCurrentField();
            const nextQuestion = nextField ? getLocalized(nextField.question) : getLocalized({ en: 'Next:', am: 'ቀጣይ:' });
            const processedMsg = getLocalized({ en: '✅ VIN processed!', am: '✅ VIN ተሰራ!' });
            const autoFillMsg = getLocalized({ en: 'fields auto-filled', am: 'መስኮች በራስ-ሰር ተሞልተዋል' });
            return {
              text: nextQuestion,
              html: `<div>${processedMsg} ${autoFilledCount} ${autoFillMsg}.<br>${nextQuestion}</div>`,
              isStructured: true
            };
          } else {
            console.log('⚠️ Not a valid VIN, treating as regular input');
          }
        }

        const valueToTry = rawValue || originalMessage;
        const validation = validateField(valueToTry, currentField);
        
        if (!validation.valid) {
          const errorMsg = validation.message;
          const question = getLocalized(currentField.question);
          return {
            text: errorMsg,
            html: `<div class="error">❌ ${errorMsg}<br>${question}</div>`,
            isStructured: true
          };
        }
        
        saveToState(currentField.name, validation.value);
        state.currentFieldIndex++;

        const fields = step.subprocess?.fields || step.fields || [];
        
        while (state.currentFieldIndex < fields.length && isAutoFillField(fields[state.currentFieldIndex])) {
          state.currentFieldIndex++;
        }

        if (state.currentFieldIndex >= fields.length) {
          if (step.subprocess) {
            if (Object.keys(state.currentItem).length > 0) {
              const key = step.subprocess.onValid.collectionKey;
              state.collectedData[key].push({ ...state.currentItem });
              state.currentItem = {};
            }
            state.currentFieldIndex = 0;
            state.waitingForAdd = true;
            saveGlobalState();
            const addPrompt = getLocalized(step.subprocess.addPrompt);
            const itemName = getLocalized(step.subprocess.itemName);
            const savedMsg = getLocalized({ en: '✅ Saved!', am: '✅ ተቀመጠ!' });
            return {
              text: addPrompt,
              html: `<div>${savedMsg} ${itemName} ${getLocalized({ en: 'saved!', am: 'ተቀመጠ!' })}<br>${addPrompt}</div>`,
              isStructured: true
            };
          } else {
            state.currentStep = step.onValid?.nextStep || state.currentStep + 1;
            state.currentFieldIndex = 0;
            saveGlobalState();
            return await stepIntro();
          }
        }

        saveGlobalState();
        const nextField = getCurrentField();
        const nextQuestion = nextField ? getLocalized(nextField.question) : getLocalized({ en: 'Next:', am: 'ቀጣይ:' });
        const savedMsg = getLocalized({ en: '✅ Saved!', am: '✅ ተቀመጠ!' });
        return {
          text: nextQuestion,
          html: `<div>${savedMsg}<br>${nextQuestion}</div>`,
          isStructured: true
        };
      }

      case 'yes': {
        if (state.waitingForAdd) {
          state.waitingForAdd = false;
          state.currentItem = {};
          state.currentFieldIndex = 0;
          saveGlobalState();
          const firstField = step.subprocess.fields[0];
          const question = getLocalized(firstField.question);
          return { text: question, html: `<div>${question}</div>`, isStructured: true };
        }
        if (state.waitingForContinue) {
          state.waitingForContinue = false;
          state.currentStep = step.subprocess.onValid.nextStep;
          state.currentFieldIndex = 0;
          saveGlobalState();
          return await stepIntro();
        }
        break;
      }

      case 'no': {
        if (state.waitingForAdd) {
          state.waitingForAdd = false;
          state.waitingForContinue = true;
          saveGlobalState();
          if (step.subprocess && step.subprocess.continuePrompt) {
            const continuePrompt = getLocalized(step.subprocess.continuePrompt);
            return {
              text: continuePrompt,
              html: `<div>${continuePrompt}</div>`,
              isStructured: true
            };
          } else {
            state.waitingForContinue = false;
            state.currentStep = step.subprocess?.onValid?.nextStep || state.currentStep + 1;
            state.currentFieldIndex = 0;
            saveGlobalState();
            return await stepIntro();
          }
        }
        if (state.waitingForContinue) {
          state.waitingForContinue = false;
          state.currentStep = step.subprocess?.onValid?.nextStep || state.currentStep + 1;
          state.currentFieldIndex = 0;
          saveGlobalState();
          return await stepIntro();
        }
        break;
      }

      case 'switch_service': {
        const target = rawValue;
        if (target && services[target]) {
          // SWITCH TO THE NEW SERVICE
          currentService = target;
          
          // CRITICAL: If this service doesn't have a state, create one with isComplete: false
          if (!serviceStates[target]) {
            serviceStates[target] = {
              currentStep: services[target].initStep || 1,
              currentFieldIndex: 0,
              waitingForAdd: false,
              waitingForContinue: false,
              currentItem: {},
              collectedData: JSON.parse(JSON.stringify(services[target].collectedData || {})),
              isComplete: false
            };
          } else {
            // CRITICAL: Ensure isComplete is explicitly false when switching to a service
            serviceStates[target].isComplete = false;
          }
          saveGlobalState();
          
          const serviceName = getLocalized(services[target].name);
          const serviceDesc = getLocalized(services[target].description);
          const welcomeMsg = getLocalized({ en: 'Welcome to', am: 'እንኳን ወደ' });
          
          return {
            text: `${welcomeMsg} ${serviceName}`,
            html: `<div>🔄 ${welcomeMsg} <strong>${serviceName}</strong><br>${serviceDesc}</div>`,
            isStructured: true
          };
        }
        break;
      }

      case 'help': {
        const list = Object.values(services).map(s => `• ${getLocalized(s.name)}: ${getLocalized(s.description)}`).join('\n');
        const helpTitle = getLocalized({ en: 'Available services:', am: 'የሚገኙ አገልግሎቶች:' });
        return {
          text: `${helpTitle}\n${list}`,
          html: `<div>📚 ${helpTitle}<br>${list.replace(/\n/g, '<br>')}</div>`,
          isStructured: true
        };
      }

      case 'status': {
        const collected = Object.entries(state.collectedData)
          .filter(([, v]) => v && (Array.isArray(v) ? v.length > 0 : Object.keys(v).length > 0))
          .map(([k, v]) => {
            const label = getLanguage() === 'am' ?
              { operator: 'ኦፕሬተር', vehicles: 'ተሽከርካሪዎች', drivers: 'አሽከርካሪዎች' }[k] || k :
              k;
            return `${label}: ${Array.isArray(v) ? v.length + ' ' + getLocalized({ en: 'item(s)', am: 'ንጥል(ዎች)' }) : '✓'}`;
          })
          .join(', ') || getLocalized({ en: 'nothing yet', am: 'እስካሁን ምንም' });
        const svc = getService();
        const serviceName = getLocalized(svc?.name || { en: 'Unknown', am: 'ያልታወቀ' });
        const serviceLabel = getLocalized({ en: 'Service', am: 'አገልግሎት' });
        const stepLabel = getLocalized({ en: 'Step', am: 'ደረጃ' });
        const collectedLabel = getLocalized({ en: 'Collected', am: 'የተሰበሰበ' });
        const completeStatus = isServiceComplete(currentService) ? '✅ ' + getLocalized({ en: 'Complete', am: 'ተጠናቋል' }) : '⏳ ' + getLocalized({ en: 'In Progress', am: 'በመቀጠል ላይ' });
        return {
          text: `${serviceLabel}: ${serviceName} | ${stepLabel}: ${state.currentStep} | ${collectedLabel}: ${collected} | ${completeStatus}`,
          html: `<div>📊 <strong>${serviceName}</strong><br>${stepLabel}: ${state.currentStep}<br>${collectedLabel}: ${collected}<br>${completeStatus}</div>`,
          isStructured: true
        };
      }

      case 'complete': {
        return await buildComplete();
      }

      default: {
        const understood = getLocalized({ en: 'I understood:', am: 'ተረድቻለሁ:' });
        return { text: `${understood} "${originalMessage}"`, html: `<div>${understood} "${originalMessage}"</div>`, isStructured: true };
      }
    }

    if (currentField) {
      const question = getLocalized(currentField.question);
      return { text: question, html: `<div>${question}</div>`, isStructured: true };
    }
    const defaultPrompt = getLocalized(getStep()?.prompt) || getLocalized({ en: 'How can I help?', am: 'እንዴት ልረዳ?' });
    return { text: defaultPrompt, html: `<div>${defaultPrompt}</div>`, isStructured: true };
  } catch (error) {
    console.error('❌ Error in executeAction:', error);
    const errorLabel = getLocalized({ en: 'Error:', am: 'ስህተት:' });
    const unknownError = getLocalized({ en: 'Unknown error', am: 'ያልታወቀ ስህተት' });
    return {
      text: `${errorLabel} ${error.message || unknownError}`,
      html: `<div class="error">❌ ${errorLabel} ${error.message || unknownError}</div>`,
      isStructured: true
    };
  }
}

// ============================================================
// CORE PROCESS MESSAGE
// ============================================================

export async function processMessage(message, file) {
  try {
    console.log('📨 Processing:', message || '[file]');

    await initializeServices();
    await initModel();
    loadGlobalState();

    if (file) {
      const step = getStep();
      if (step?.type === 'file_upload') {
        const state = getState();
        state.collectedData.document = { name: file.name, size: file.size };
        state.currentStep = step.onValid.nextStep;
        state.currentFieldIndex = 0;
        saveGlobalState();
        const fileReceived = getLocalized({ en: 'File received:', am: 'ፋይል ተቀብሏል:' });
        const nextPrompt = getLocalized(step?.prompt) || getLocalized({ en: 'What next?', am: 'ምን ቀጥሎ?' });
        return {
          text: `${fileReceived} "${file.name}". ${nextPrompt}`,
          html: `<div>📄 ${fileReceived} <strong>${file.name}</strong><br>${nextPrompt}</div>`,
          isStructured: true
        };
      }
      const fileReceived = getLocalized({ en: 'File received', am: 'ፋይል ተቀብሏል' });
      return { text: fileReceived, html: `<div>📎 ${fileReceived}</div>`, isStructured: false };
    }

    if (!message) return await stepIntro();

    const switchTarget = checkServiceSwitch(message);
    if (switchTarget && switchTarget !== currentService && services[switchTarget]) {
      currentService = switchTarget;
      
      // CRITICAL: When switching to a new service, ensure isComplete is false
      if (!serviceStates[switchTarget]) {
        serviceStates[switchTarget] = {
          currentStep: services[switchTarget].initStep || 1,
          currentFieldIndex: 0,
          waitingForAdd: false,
          waitingForContinue: false,
          currentItem: {},
          collectedData: JSON.parse(JSON.stringify(services[switchTarget].collectedData || {})),
          isComplete: false
        };
      } else {
        // CRITICAL: Explicitly set isComplete to false when switching
        serviceStates[switchTarget].isComplete = false;
      }
      saveGlobalState();
      
      const serviceName = getLocalized(services[switchTarget].name);
      const serviceDesc = getLocalized(services[switchTarget].description);
      const welcomeMsg = getLocalized({ en: 'Welcome to', am: 'እንኳን ወደ' });
      
      return {
        text: `${welcomeMsg} ${serviceName}`,
        html: `<div>🔄 ${welcomeMsg} <strong>${serviceName}</strong><br>${serviceDesc}</div>`,
        isStructured: true
      };
    }

    const state = getState();
    if (state.waitingForAdd || state.waitingForContinue) {
      const yesno = checkYesNo(message);
      if (yesno) {
        return await executeAction(yesno, null, message);
      }
    }

    const vinPattern = /^[A-HJ-NPR-Z0-9]{10,18}$/i;
    if (message && vinPattern.test(message.trim())) {
      console.log('🔍 Input looks like a VIN:', message);
      const currentField = getCurrentField();
      if (currentField && (currentField.name === 'vinNumber' || currentField.name === 'chassisNumber')) {
        return await executeAction('save', message, message);
      }
    }

    const msgLower = message.toLowerCase();
    
    if (msgLower.includes('help') || msgLower.includes('what can you do') || msgLower.includes('እገዛ')) {
      return await executeAction('help', null, message);
    }
    if (msgLower.includes('status') || msgLower.includes('progress') || msgLower.includes('ሁኔታ')) {
      return await executeAction('status', null, message);
    }
    if (msgLower.includes('complete') || msgLower.includes('done') || msgLower.includes('finish') || msgLower.includes('ተጠናቀቀ')) {
      return await executeAction('complete', null, message);
    }

    const prediction = await callModel({
      serviceConfig: getService(),
      currentState: getState(),
      userMessage: message
    });

    console.log('🤖 Prediction:', prediction);

    if (prediction && prediction.action) {
      return await executeAction(prediction.action, prediction.value, message);
    }

    const currentField = getCurrentField();
    if (currentField) {
      const validation = validateField(message, currentField);
      if (validation.valid) {
        return await executeAction('save', validation.value, message);
      }
      const errorMsg = validation.message;
      const question = getLocalized(currentField.question);
      return {
        text: errorMsg,
        html: `<div class="error">❌ ${errorMsg}<br>${question}</div>`,
        isStructured: true
      };
    }

    const received = getLocalized({ en: 'I received:', am: 'ተቀብያለሁ:' });
    const serviceList = Object.values(services).map(s => `• ${getLocalized(s.name)}`).join('\n');
    const availableServices = getLocalized({ en: 'Available services:', am: 'የሚገኙ አገልግሎቶች:' });
    return { 
      text: `${received} "${message}"\n\n${availableServices}\n${serviceList}`,
      html: `<div>${received} "${message}"<br><br>📚 ${availableServices}<br>${serviceList.replace(/\n/g, '<br>')}</div>`,
      isStructured: true 
    };

  } catch (error) {
    console.error('❌ Error:', error);
    const errorLabel = getLocalized({ en: 'Error:', am: 'ስህተት:' });
    const unknownError = getLocalized({ en: 'Unknown error', am: 'ያልታወቀ ስህተት' });
    return {
      text: `${errorLabel} ${error.message || unknownError}`,
      html: `<div class="error">❌ ${errorLabel} ${error.message || unknownError}</div>`,
      isStructured: true
    };
  }
}

// ============================================================
// PUBLIC API
// ============================================================

export async function chat(msg, file) {
  try {
    await initializeServices();
    await initModel();
    loadGlobalState();
    return await processMessage(msg, file);
  } catch (error) {
    console.error('❌ Chat error:', error);
    const errorLabel = getLocalized({ en: 'Error:', am: 'ስህተት:' });
    const unknownError = getLocalized({ en: 'Unknown error', am: 'ያልታወቀ ስህተት' });
    return {
      text: `${errorLabel} ${error.message || unknownError}`,
      html: `<div class="error">❌ ${errorLabel} ${error.message || unknownError}</div>`,
      isStructured: true
    };
  }
}

export async function init() {
  try {
    await initializeServices();
    await initModel();
    loadGlobalState();
    
    const serviceList = Object.keys(services);
    console.log(`✅ NLP Processor initialized with ${serviceList.length} services`);
    console.log('📚 Services:', serviceList);
    
    return true;
  } catch (error) {
    console.error('❌ Init error:', error);
    return false;
  }
}

export async function getAvailableServices() {
  await initializeServices();
  return Object.values(services);
}

export const nlpProcessor = {
  chat,
  processMessage,
  init,
  getAvailableServices,
  resetService,
  isServiceComplete,
  markServiceComplete
};

// Auto-init
init().catch(console.error);