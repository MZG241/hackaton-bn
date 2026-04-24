/**
 * AKAZI PLATFORM — COMPREHENSIVE DATABASE SEED SCRIPT
 * Creates: 50 employers, 1200 candidates, 1000 jobs, ~60k applications
 * All users: African names, mostly Rwandan. Password: Test@1234
 */

const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const bcrypt = require('bcryptjs');

const MONGO_URL = 'mongodb+srv://MOUKALA:Motsu241@applicant-api.bkjta.mongodb.net/akazi';
const HASHED_PASS = bcrypt.hashSync('Test@1234', 10);

// ─── DATA POOLS ──────────────────────────────────────────────────────────────

const rwandanFirstNames = [
  'Amahoro','Amani','Amara','Andile','Asha','Ayasha','Aziz','Bienvenu',
  'Celestin','Chantal','Chisom','Claudine','Dieudonne','Diane','Emile',
  'Emmanuel','Esperance','Etienne','Faida','Fatuma','Felix','Fiona','Flora',
  'Francine','Gaetan','Gakuba','Gasana','Gatete','Giramata','Gloria','Grace',
  'Habimana','Habineza','Habyarimana','Honorine','Huguette','Immaculee',
  'Ingabire','Iradukunda','Isabelle','Jean','Jean-Pierre','Joselyne','Kalisa',
  'Kamali','Kamana','Karenzi','Kayitesi','Keza','Kibuka','Kirabo','Kwizera',
  'Lando','Lilian','Loise','Lucie','Malaika','Marie','Massamba','Mbabazi',
  'Mugisha','Mugiraneza','Muhire','Muhoza','Mukagatare','Mukantagara','Mukeshimana',
  'Munyaburanga','Mwangi','Mwiza','Ndayishimiye','Ndikumana','Ngabo','Ngarambe',
  'Niyibizi','Niyigena','Niyomugabo','Niyonzima','Ntakirutimana','Nyiraneza',
  'Pacifique','Patrick','Paul','Pauline','Peace','Philibert','Pierre',
  'Placide','Prosper','Rachel','Rebecca','Regine','Rose','Rosine','Rukundo',
  'Ruzigana','Rwema','Samuel','Sandrine','Segatashya','Serurekure','Sibomana',
  'Solange','Sosthene','Sylvain','Theophile','Thierry','Thomas','Umubyeyi',
  'Umuhoza','Umwali','Uwimana','Uwingabire','Vianney','Vincent','Violette',
  'Wanjiku','Xavier','Yannick','Yves','Zacharie','Zephyrine',
  // Uganda names
  'Apio','Atim','Ayebare','Babirye','Bagonza','Baluku','Birungi','Chebet',
  'Ejiku','Kabasomi','Kato','Kisakye','Mugabi','Muhanguzi','Musinguzi','Nabwire',
  'Naigaga','Namukasa','Nanteza','Nanyonga','Nekesa','Obua','Ocen','Odongo',
  'Opio','Ssali','Ssebagala','Tumukunde','Tusiime','Wanjala',
  // Kenya names
  'Chege','Gacheru','Gathu','Karanja','Kariuki','Kimani','Kipchoge','Kirui',
  'Koech','Kung\'u','Langat','Mahinda','Maina','Mugo','Muiru','Mwangi2',
  'Ndegwa','Njenga','Njoroge','Nyambura','Ochieng','Odinga','Oduya','Ogola',
  'Ogolla','Otieno','Owino','Wambui','Waweru','Were',
  // Tanzania names
  'Amina','Hassan','Juma','Khalid','Latifa','Mwalimu','Omary','Rashida',
  'Salim','Samir','Zanele','Zuberi',
  // Gabon names
  'Bongo','Essone','Mebiame','Mba','Ndong','Nguema','Ntoutoume','Ondo',
  'Oyono','Ropero'
];

const lastNames = [
  'Nkurunziza','Ndayisenga','Habimana','Mugisha','Kagame','Nsanzimana',
  'Uwimana','Bizimana','Niyonzima','Hakizimana','Ndikumana','Kaberuka',
  'Mugiraneza','Rutaganda','Sibomana','Ntamuhanga','Harerimana','Gashumba',
  'Niyibizi','Kanyarwanda','Mukamana','Rucyahana','Tuyisenge','Uwera',
  'Muyenzi','Butera','Ruzigana','Seburanga','Rwema','Giraneza',
  'Mwangi','Kamau','Njoroge','Kibaki','Waweru','Karanja','Ndegwa',
  'Oduya','Otieno','Ochieng','Museveni','Ssali','Nabwire','Kato','Ayebare',
  'Mkapa','Magufuli','Salim','Hassan','Juma','Amina',
  'Bongo','Ndong','Nguema','Ondo','Essone','Oyono',
  'Diop','Sy','Ba','Sow','Fall','Ndiaye','Beye','Diouf'
];

const locations = [
  // Rwanda (majority)
  'Kigali, Rwanda','Butare, Rwanda','Gitarama, Rwanda','Ruhengeri, Rwanda',
  'Gisenyi, Rwanda','Byumba, Rwanda','Cyangugu, Rwanda','Kibuye, Rwanda',
  'Kibungo, Rwanda','Rwamagana, Rwanda','Musanze, Rwanda','Muhanga, Rwanda',
  // Uganda
  'Kampala, Uganda','Entebbe, Uganda','Jinja, Uganda','Mbale, Uganda',
  'Gulu, Uganda','Mbarara, Uganda',
  // Kenya
  'Nairobi, Kenya','Mombasa, Kenya','Kisumu, Kenya','Nakuru, Kenya',
  // Tanzania
  'Dar es Salaam, Tanzania','Arusha, Tanzania','Mwanza, Tanzania',
  // Gabon
  'Libreville, Gabon','Port-Gentil, Gabon',
  // Others
  'Lagos, Nigeria','Accra, Ghana','Abidjan, Cote d\'Ivoire'
];

const rwandaLocations = locations.slice(0, 10);

const companies = [
  { name:'Kigali Tech Solutions', desc:'Leading technology solutions provider in East Africa, specializing in software development and digital transformation.', location:'Kigali, Rwanda', phone:'+250788100001' },
  { name:'Rwanda Digital Hub', desc:'Innovation center fostering digital entrepreneurship and tech talent across Rwanda and the region.', location:'Kigali, Rwanda', phone:'+250788100002' },
  { name:'East Africa Financial Group', desc:'Comprehensive financial services firm offering banking, insurance, and investment solutions.', location:'Kigali, Rwanda', phone:'+250788100003' },
  { name:'Telecom Rwanda', desc:'Leading telecommunications provider delivering connectivity solutions across Rwanda.', location:'Kigali, Rwanda', phone:'+250788100004' },
  { name:'Green Energy Africa', desc:'Pioneering renewable energy solutions for sustainable development in sub-Saharan Africa.', location:'Kigali, Rwanda', phone:'+250788100005' },
  { name:'AgriTech Rwanda', desc:'Technology-driven agricultural company improving farming productivity and food security.', location:'Musanze, Rwanda', phone:'+250788100006' },
  { name:'Kampala Software House', desc:'Uganda-based software development firm delivering enterprise solutions regionally.', location:'Kampala, Uganda', phone:'+256701100001' },
  { name:'Nairobi Innovation Labs', desc:"Kenya's premier technology innovation lab focused on AI and machine learning solutions.", location:'Nairobi, Kenya', phone:'+254700100001' },
  { name:'Pan-African Health Tech', desc:'Digital health solutions provider transforming healthcare delivery across Africa.', location:'Kigali, Rwanda', phone:'+250788100007' },
  { name:'Rwanda Construction Group', desc:'Premier construction and infrastructure development company in the Great Lakes region.', location:'Kigali, Rwanda', phone:'+250788100008' },
  { name:'Safari Logistics', desc:'Integrated logistics and supply chain management company serving East Africa.', location:'Mombasa, Kenya', phone:'+254700100002' },
  { name:'MTN Rwanda Business', desc:'Business solutions division of MTN Rwanda, delivering enterprise communication tools.', location:'Kigali, Rwanda', phone:'+250788100009' },
  { name:'Rwanda Air Cargo', desc:'Specialized air freight and cargo logistics company connecting Rwanda to global markets.', location:'Kigali, Rwanda', phone:'+250788100010' },
  { name:'Kigali Real Estate', desc:"Premier property development and management firm transforming Kigali's skyline.", location:'Kigali, Rwanda', phone:'+250788100011' },
  { name:'East Africa Media Group', desc:'Multimedia conglomerate providing news, entertainment, and digital media services.', location:'Nairobi, Kenya', phone:'+254700100003' },
  { name:'Horizon Mining', desc:'Responsible mining company extracting minerals with a focus on environmental sustainability.', location:'Kigali, Rwanda', phone:'+250788100012' },
  { name:'Savanna Insurance', desc:'Innovative insurance provider offering comprehensive coverage tailored for African markets.', location:'Kampala, Uganda', phone:'+256701100002' },
  { name:'Rwanda Coffee Export', desc:'Premium coffee sourcing, processing, and export company connecting Rwandan farmers to global markets.', location:'Ruhengeri, Rwanda', phone:'+250788100013' },
  { name:'Tanzania Digital Agency', desc:'Full-service digital marketing and technology agency based in Dar es Salaam.', location:'Dar es Salaam, Tanzania', phone:'+255700100001' },
  { name:'Africa EdTech', desc:'Educational technology platform providing quality learning solutions to students across Africa.', location:'Kigali, Rwanda', phone:'+250788100014' },
  { name:'Kigali Hospitality Group', desc:'Premium hotel and hospitality management group operating across East Africa.', location:'Kigali, Rwanda', phone:'+250788100015' },
  { name:'Rwanda Water Solutions', desc:'Water treatment and management company providing clean water solutions to communities.', location:'Gitarama, Rwanda', phone:'+250788100016' },
  { name:'Great Lakes Consulting', desc:'Strategy and management consulting firm serving government and private sector clients.', location:'Kigali, Rwanda', phone:'+250788100017' },
  { name:'Africa Fintech Ventures', desc:'Financial technology startup ecosystem accelerating digital payments and banking innovation.', location:'Nairobi, Kenya', phone:'+254700100004' },
  { name:'Kigali AI Research Institute', desc:'Research institution advancing artificial intelligence applications for African development.', location:'Kigali, Rwanda', phone:'+250788100018' },
  { name:'Rwanda Pharma', desc:'Pharmaceutical manufacturing and distribution company ensuring medicine access in Africa.', location:'Kigali, Rwanda', phone:'+250788100019' },
  { name:'EastLink Broadband', desc:'Internet service provider delivering high-speed connectivity to homes and businesses.', location:'Kampala, Uganda', phone:'+256701100003' },
  { name:'Africa Solar Systems', desc:'Solar panel installation and renewable energy systems company for homes and businesses.', location:'Kigali, Rwanda', phone:'+250788100020' },
  { name:'Rwanda Transport Corp', desc:'Mass transit and transportation solutions serving urban and rural communities.', location:'Kigali, Rwanda', phone:'+250788100021' },
  { name:'Sustainable Africa Foundation', desc:'NGO-adjacent social enterprise driving sustainable development programs across East Africa.', location:'Kigali, Rwanda', phone:'+250788100022' },
  { name:'Kigali Security Services', desc:'Professional security services company providing guards, technology, and risk management.', location:'Kigali, Rwanda', phone:'+250788100023' },
  { name:'Africa Print Media', desc:'Leading printing and publishing company producing books, magazines, and marketing materials.', location:'Kigali, Rwanda', phone:'+250788100024' },
  { name:'Rwanda Steel Industries', desc:'Steel production and fabrication company supplying construction and manufacturing sectors.', location:'Kigali, Rwanda', phone:'+250788100025' },
  { name:'East Africa Food Processing', desc:'Food manufacturing and processing company delivering quality products to regional markets.', location:'Kigali, Rwanda', phone:'+250788100026' },
  { name:'Kigali Data Center', desc:'Colocation and managed hosting provider offering enterprise-grade IT infrastructure.', location:'Kigali, Rwanda', phone:'+250788100027' },
  { name:'Rwanda Textile Group', desc:'Textile manufacturing company producing garments and fabrics for local and export markets.', location:'Kigali, Rwanda', phone:'+250788100028' },
  { name:'Africa Drone Solutions', desc:'UAV and drone technology company providing aerial surveys, delivery, and inspection services.', location:'Nairobi, Kenya', phone:'+254700100005' },
  { name:'Rwanda Bio-Agriculture', desc:'Organic farming and biotechnology company advancing sustainable agriculture practices.', location:'Rwamagana, Rwanda', phone:'+250788100029' },
  { name:'Kigali Automotive', desc:'Vehicle sales, maintenance, and fleet management company for corporate and personal clients.', location:'Kigali, Rwanda', phone:'+250788100030' },
  { name:'Africa Blockchain Institute', desc:'Blockchain technology research and development hub for financial and government applications.', location:'Nairobi, Kenya', phone:'+254700100006' },
  { name:'Rwanda E-Commerce Hub', desc:'Online marketplace and e-commerce infrastructure provider for Rwandan businesses.', location:'Kigali, Rwanda', phone:'+250788100031' },
  { name:'East Africa Legal Firm', desc:'Full-service law firm specializing in corporate law, contracts, and intellectual property.', location:'Kigali, Rwanda', phone:'+250788100032' },
  { name:'Kigali Architecture Studio', desc:`Award-winning architectural design and urban planning firm shaping Rwanda\'s modern landscape.`, location:'Kigali, Rwanda', phone:'+250788100033' },
  { name:'Rwanda Cybersecurity Agency', desc:'Information security consulting firm protecting government and corporate digital assets.', location:'Kigali, Rwanda', phone:'+250788100034' },
  { name:'Africa Event Management', desc:'Premier event planning and management company organizing conferences, concerts, and exhibitions.', location:'Kigali, Rwanda', phone:'+250788100035' },
  { name:'Rwanda Healthcare Network', desc:'Network of clinics and healthcare providers delivering quality medical care nationally.', location:'Kigali, Rwanda', phone:'+250788100036' },
  { name:'Great Lakes Media Productions', desc:'Film, video production, and content creation studio serving brands and broadcasters.', location:'Kigali, Rwanda', phone:'+250788100037' },
  { name:'Africa Investment Partners', desc:'Private equity and venture capital firm investing in high-growth African businesses.', location:'Nairobi, Kenya', phone:'+254700100007' },
  { name:'Rwanda Tourism Board', desc:`Tourism promotion and hospitality development organization boosting Rwanda\'s travel sector.`, location:'Kigali, Rwanda', phone:'+250788100038' },
  { name:'Kigali BPO Services', desc:'Business process outsourcing company providing customer support, data entry, and back-office operations.', location:'Kigali, Rwanda', phone:'+250788100039' }
];

const jobCategories = [
  'Technology','Finance','Healthcare','Education','Marketing',
  'Engineering','Design','Customer Service','Administration',
  'Telecommunications','Agriculture','Tourism & Hospitality',
  'Logistics & Supply Chain','Legal','Construction','Media & Communications',
  'Energy','Research & Development','Sales','Human Resources'
];

const jobTitles = {
  Technology: ['Software Engineer','Full-Stack Developer','Backend Developer','Frontend Developer','DevOps Engineer','Data Scientist','Machine Learning Engineer','AI Engineer','Cloud Architect','Cybersecurity Analyst','Mobile App Developer','QA Engineer','System Administrator','Database Administrator','Network Engineer','IT Support Specialist','Technical Project Manager','Blockchain Developer','Product Manager','Data Analyst'],
  Finance: ['Financial Analyst','Accountant','Investment Manager','Risk Analyst','Audit Manager','Treasury Officer','Tax Consultant','Credit Analyst','Portfolio Manager','Finance Director','Budget Analyst','Cost Accountant','Internal Auditor','Compliance Officer','Banking Officer','Loan Officer','Financial Controller','Insurance Underwriter','Actuarial Analyst','Microfinance Officer'],
  Healthcare: ['Medical Doctor','Nurse','Pharmacist','Laboratory Technician','Public Health Officer','Radiologist','Medical Officer','Health Information Specialist','Community Health Worker','Clinical Officer','Nutritionist','Hospital Administrator','Mental Health Counselor','Midwife','Physical Therapist','Medical Researcher','Epidemiologist','Biomedical Engineer','Dentist','Optician'],
  Education: ['Teacher','University Lecturer','Education Coordinator','Curriculum Developer','School Principal','Academic Advisor','E-Learning Developer','Training Specialist','Education Researcher','Tutor','School Counselor','Career Development Officer','Librarian','Special Education Teacher','Language Instructor','STEM Educator','Education Policy Analyst','Student Affairs Officer','School Administrator','After-School Program Coordinator'],
  Marketing: ['Digital Marketing Manager','SEO Specialist','Content Creator','Brand Manager','Social Media Manager','Marketing Analyst','Campaign Manager','Growth Hacker','Email Marketing Specialist','Market Research Analyst','PR Specialist','Influencer Marketing Manager','Advertising Executive','Marketing Director','Product Marketing Manager','Event Marketing Coordinator','Marketing Automation Specialist','Copywriter','Creative Director','Performance Marketing Manager'],
  Engineering: ['Civil Engineer','Mechanical Engineer','Electrical Engineer','Structural Engineer','Environmental Engineer','Petroleum Engineer','Chemical Engineer','Geotechnical Engineer','Water Resources Engineer','Telecommunications Engineer','Materials Engineer','Manufacturing Engineer','Quality Control Engineer','Project Engineer','Senior Engineer'],
  Design: ['UI/UX Designer','Graphic Designer','Product Designer','Brand Designer','Motion Designer','3D Designer','Interior Designer','Architect','Web Designer','Visual Designer','Illustrations Artist','Design Lead','Creative Analyst','Design System Lead'],
  'Customer Service': ['Customer Service Representative','Call Centre Agent','Customer Success Manager','Client Relations Officer','Support Team Lead','Technical Support Engineer','Account Manager','Customer Experience Analyst','Help Desk Technician','Customer Retention Specialist'],
  Administration: ['Administrative Officer','Executive Assistant','Office Manager','Receptionist','Operations Manager','Project Coordinator','Administrative Director','Records Officer','Data Entry Clerk','Procurement Officer','Administrative Assistant','Facilities Manager'],
  Telecommunications: ['Telecom Engineer','Network Planner','RF Engineer','Fiber Optics Technician','Telecom Project Manager','Transmission Engineer','Mobile Network Engineer','VoIP Engineer','Telecom Sales Manager','Regulatory Affairs Officer'],
  Agriculture: ['Agronomist','Farm Manager','Agricultural Extension Officer','Crop Scientist','Soil Scientist','Irrigation Specialist','Agricultural Economist','Livestock Officer','Food Safety Inspector','Agricultural Data Analyst'],
  'Tourism & Hospitality': ['Hotel Manager','Tourism Officer','Chef','Hospitality Manager','Tour Guide','Event Coordinator','Front Desk Manager','Restaurant Manager','Travel Consultant','Hospitality Trainer'],
  'Logistics & Supply Chain': ['Logistics Manager','Supply Chain Analyst','Warehouse Manager','Fleet Manager','Procurement Specialist','Import/Export Coordinator','Freight Manager','Inventory Analyst','Distribution Manager','Operations Coordinator'],
  Legal: ['Corporate Lawyer','Legal Counsel','Contract Specialist','Compliance Manager','Paralegal','IP Lawyer','Employment Lawyer','Legal Researcher','Contract Administrator','Arbitration Specialist'],
  Construction: ['Site Engineer','Project Manager','Quantity Surveyor','Safety Officer','Construction Manager','Estimator','Surveyor','Building Inspector','Consultant Engineer','BIM Specialist'],
  'Media & Communications': ['Journalist','Video Producer','Content Writer','Broadcast Engineer','Communications Officer','Editor','Social Media Content Creator','Media Analyst','Podcast Producer','PR Consultant'],
  Energy: ['Energy Analyst','Solar Engineer','Power Systems Engineer','Energy Consultant','Utility Manager','Oil & Gas Engineer','Renewable Energy Officer','Grid Engineer','Energy Auditor','Wind Turbine Technician'],
  'Research & Development': ['Research Scientist','Data Researcher','R&D Engineer','Laboratory Manager','Clinical Researcher','Innovation Manager','Product Developer','Research Analyst','Science Officer','Material Scientist'],
  Sales: ['Sales Representative','Sales Manager','Business Development Manager','Account Executive','Regional Sales Director','Inside Sales Specialist','Sales Analyst','Key Account Manager','Partnership Manager','Sales Operations Manager'],
  'Human Resources': ['HR Manager','Talent Acquisition Specialist','Learning & Development Officer','HR Business Partner','Compensation & Benefits Analyst','Payroll Officer','HR Coordinator','Organizational Development Consultant','Employee Relations Officer','HR Director']
};

const skills = {
  Technology: ['JavaScript','Python','React','Node.js','AWS','Docker','Kubernetes','TypeScript','Java','C++','SQL','MongoDB','Redis','GraphQL','REST APIs','Git','Linux','Agile','CI/CD','Microservices'],
  Finance: ['Financial Modeling','Excel','SAP','QuickBooks','Risk Management','Investment Analysis','IFRS','Tax Planning','Budgeting','Forecasting','Bloomberg Terminal','Power BI','Data Analysis','Compliance','Audit'],
  Healthcare: ['Patient Care','Medical Diagnosis','EMR/EHR','Clinical Research','Pharmacology','Public Health','Epidemiology','Medical Coding','Healthcare Management','Life Support','Surgical Assistance'],
  Education: ['Curriculum Design','E-Learning','Classroom Management','Student Assessment','Research Methods','Instructional Design','LMS Platforms','Educational Technology','Mentoring','Pedagogical Methods'],
  Marketing: ['SEO/SEM','Google Analytics','Meta Ads','Content Strategy','Email Marketing','CRM','A/B Testing','Copywriting','Brand Strategy','Market Research','Social Media','HubSpot','Salesforce'],
  Engineering: ['AutoCAD','SolidWorks','MATLAB','Project Management','Quality Control','Structural Analysis','Civil Design','Electrical Systems','Mechanical Design','Safety Management'],
  Design: ['Figma','Adobe XD','Photoshop','Illustrator','After Effects','Sketch','InVision','Typography','User Research','Prototyping','Design Systems','Brand Identity'],
  default: ['Communication','Leadership','Problem-Solving','Team Management','Microsoft Office','Project Management','Time Management','Data Analysis','Critical Thinking','Customer Service']
};

const universities = [
  'University of Rwanda','African Leadership University','Kigali Independent University',
  'University of Nairobi','Makerere University','University of Dar es Salaam',
  'Strathmore University','University of Cape Town','Addis Ababa University',
  'INES-Ruhengeri','Mount Kenya University','INES Rwamagana',
  'Kampala International University','United States International University Africa',
  'Jomo Kenyatta University','Moi University','Egerton University'
];

const certifications = [
  { name:'AWS Certified Solutions Architect', issuer:'Amazon Web Services' },
  { name:'Google Professional Cloud Architect', issuer:'Google Cloud' },
  { name:'Microsoft Azure Administrator', issuer:'Microsoft' },
  { name:'PMP Certification', issuer:'PMI' },
  { name:'Certified Financial Analyst (CFA)', issuer:'CFA Institute' },
  { name:'ACCA', issuer:'ACCA Global' },
  { name:'CISSP', issuer:'ISC2' },
  { name:'Cisco CCNA', issuer:'Cisco' },
  { name:'Scrum Master', issuer:'Scrum Alliance' },
  { name:'Google Analytics Certification', issuer:'Google' },
  { name:'HubSpot Marketing Certified', issuer:'HubSpot' },
  { name:'Oracle Database Certified', issuer:'Oracle' },
  { name:'CompTIA Security+', issuer:'CompTIA' },
  { name:'Six Sigma Green Belt', issuer:'ASQ' },
  { name:'PRINCE2 Practitioner', issuer:'AXELOS' }
];

const bioTemplates = [
  'Passionate professional with over {years} years of experience in {field}. Proven track record of delivering impactful results in fast-paced environments. Committed to continuous learning and contributing to organizational growth.',
  'Results-driven {field} professional with {years} years of hands-on experience. Strong analytical skills combined with excellent communication abilities. Dedicated to driving innovation and excellence in every project undertaken.',
  'Dynamic and motivated {field} specialist with {years} years of industry experience. Adept at collaborating with cross-functional teams to solve complex challenges. Passionate about leveraging technology for African development.',
  'Experienced {field} professional based in East Africa with {years} years of expertise. Skilled at building relationships and delivering strategic value. Committed to the advancement of African economies through professional excellence.',
  'Creative and detail-oriented {field} expert with {years} years of experience. Track record of successful project delivery and client satisfaction. Enthusiastic about Rwanda\'s digital transformation journey.'
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
function pick(arr, n) { return shuffle(arr).slice(0, n); }

function generateName() {
  const fn = rnd(rwandanFirstNames);
  const ln = rnd(lastNames);
  return `${fn} ${ln}`;
}

function nameToEmail(fullname, idx) {
  const clean = fullname.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\s+/g, '');
  return `${clean}${idx}@akazi.rw`;
}

function generateBio(field, years) {
  const template = rnd(bioTemplates);
  return template.replace('{years}', years).replace('{field}', field).replace('{field}', field);
}

function generateExperience(category, yearsTotal) {
  const exp = [];
  let currentYear = 2024;
  let remaining = yearsTotal;
  
  while (remaining > 0) {
    const duration = Math.min(remaining, rndInt(1, 4));
    const startYear = currentYear - duration;
    exp.push({
      role: rnd(jobTitles[category] || jobTitles.Technology),
      company: rnd(companies).name,
      startDate: new Date(startYear, rndInt(0,11), 1),
      endDate: remaining > duration ? new Date(currentYear, rndInt(0,11), 1) : undefined,
      isCurrent: remaining <= duration,
      description: `Led key initiatives in ${category.toLowerCase()}, contributing to team performance and project success. Collaborated with stakeholders to deliver high-quality outcomes.`,
      technologies: pick(skills[category] || skills.default, rndInt(3, 5))
    });
    remaining -= duration;
    currentYear = startYear;
  }
  return exp;
}

function generateEducation() {
  const endYear = rndInt(2010, 2022);
  return [{
    institution: rnd(universities),
    degree: rnd(['Bachelor of Science','Bachelor of Arts','Master of Science','Master of Business Administration','Bachelor of Engineering','Bachelor of Commerce']),
    fieldOfStudy: rnd(['Computer Science','Business Administration','Information Technology','Engineering','Finance','Education','Healthcare Management','Marketing','Economics','Data Science']),
    startYear: endYear - rndInt(3, 5),
    endYear: endYear,
    graduationYear: endYear
  }];
}

function generateSkills(category) {
  const pool = skills[category] || skills.default;
  return pick([...pool, ...skills.default], rndInt(5, 12)).map(s => ({
    name: s,
    level: rnd(['Beginner','Intermediate','Advanced','Expert']),
    yearsOfExperience: rndInt(1, 8)
  }));
}

function generateLanguages() {
  const langs = [
    { name:'Kinyarwanda', proficiency:'Native' },
    { name:'English', proficiency: rnd(['Conversational','Fluent']) },
    { name:'French', proficiency: rnd(['Basic','Conversational','Fluent']) },
  ];
  if (Math.random() > 0.6) langs.push({ name:'Swahili', proficiency: rnd(['Basic','Conversational']) });
  return langs;
}

function generateCertifications() {
  const count = rndInt(0, 3);
  return pick(certifications, count).map(c => ({
    ...c,
    issueDate: `${rndInt(2018,2023)}-${String(rndInt(1,12)).padStart(2,'0')}`,
    credentialUrl: `https://credential.example.com/${Math.random().toString(36).substr(2,10)}`
  }));
}

function generateJobDescription(title, category) {
  return `<p>We are looking for a talented <strong>${title}</strong> to join our growing team. This is an exciting opportunity to work with a dynamic organization at the forefront of ${category.toLowerCase()} in East Africa.</p>
<p><strong>Key Responsibilities:</strong></p>
<ul>
<li>Lead and execute key ${category.toLowerCase()} initiatives aligned with organizational goals</li>
<li>Collaborate with cross-functional teams to deliver high-quality results</li>
<li>Analyze data and provide strategic insights to drive decision-making</li>
<li>Mentor junior team members and contribute to knowledge sharing</li>
<li>Stay current with industry trends and best practices</li>
</ul>
<p><strong>What We Offer:</strong></p>
<ul>
<li>Competitive salary and performance bonuses</li>
<li>Professional development opportunities</li>
<li>Health insurance and other benefits</li>
<li>Flexible working arrangements</li>
<li>Vibrant and inclusive work environment</li>
</ul>`;
}

// ─── MONGOOSE SCHEMAS (minimal, for seeding) ─────────────────────────────────

const UserSchema = new mongoose.Schema({
  fullname: String, email: { type: String, unique: true }, password: String,
  role: String, isVerified: Boolean, headline: String, position: String,
  bio: String, location: String, phone: String, resume: String,
  companyName: String, companyDescription: String, companyPhone: String, companyLocation: String,
  skills: Array, languages: Array, experience: Array, education: Array,
  certifications: Array, projects: Array, availability: Object, socialLinks: Object,
  aiSummary: String
}, { timestamps: true });

const JobSchema = new mongoose.Schema({
  title: String, description: String, requirements: [String], location: String,
  category: String, type: String, postedBy: mongoose.Schema.Types.ObjectId,
  salaryMin: Number, salaryMax: Number, isClosed: Boolean,
  skillsRequired: [String], experienceLevel: String, educationLevel: String
}, { timestamps: true });

const ApplicantSchema = new mongoose.Schema({
  applicant: mongoose.Schema.Types.ObjectId,
  job: mongoose.Schema.Types.ObjectId,
  status: String
}, { timestamps: true });

// ─── MAIN SEED ───────────────────────────────────────────────────────────────

async function seed() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URL, {
    serverSelectionTimeoutMS: 5000,
    family: 4
  });
  console.log('✅ Connected!\n');

  const User = mongoose.model('User', UserSchema);
  const Job = mongoose.model('Job', JobSchema);
  const Applicant = mongoose.model('Applicant', ApplicantSchema);

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await Applicant.deleteMany({});
  await Job.deleteMany({});
  await User.deleteMany({ role: { $in: ['jobseeker', 'employer'] } });
  console.log('✅ Cleared\n');

  // ─── 1. CREATE EMPLOYERS ────────────────────────────────────────────────────
  console.log('🏢 Creating 50 employers...');
  const employerDocs = companies.map((c, i) => {
    const fullname = generateName();
    return {
      fullname,
      email: nameToEmail(fullname, `emp${i}`),
      password: HASHED_PASS,
      role: 'employer',
      isVerified: true,
      headline: `CEO & Founder at ${c.name}`,
      location: c.location,
      phone: c.phone,
      companyName: c.name,
      companyDescription: c.desc,
      companyPhone: c.phone,
      companyLocation: c.location
    };
  });
  const employers = await User.insertMany(employerDocs);
  console.log(`✅ Created ${employers.length} employers\n`);

  // ─── 2. CREATE CANDIDATES ────────────────────────────────────────────────────
  console.log('👤 Creating 1200 candidates...');
  const candidateBatch = [];
  const usedEmails = new Set();
  
  for (let i = 0; i < 1200; i++) {
    const cat = rnd(jobCategories);
    const yearsXp = rndInt(1, 12);
    let fullname, email;
    
    do {
      fullname = generateName();
      email = nameToEmail(fullname, i);
    } while (usedEmails.has(email));
    usedEmails.add(email);

    candidateBatch.push({
      fullname,
      email,
      password: HASHED_PASS,
      role: 'jobseeker',
      isVerified: true,
      headline: `${rnd(jobTitles[cat] || jobTitles.Technology)} | ${yearsXp}+ Years Experience`,
      position: rnd(jobTitles[cat] || jobTitles.Technology),
      bio: generateBio(cat, yearsXp),
      location: rnd(locations),
      phone: `+25078${String(rndInt(1000000, 9999999))}`,
      skills: generateSkills(cat),
      languages: generateLanguages(),
      experience: generateExperience(cat, yearsXp),
      education: generateEducation(),
      certifications: generateCertifications(),
      availability: {
        status: rnd(['Available','Open to Opportunities','Not Available']),
        type: rnd(['Full-time','Part-time','Contract','Freelance']),
        preferredLocations: pick(rwandaLocations, 3)
      },
      socialLinks: {
        linkedin: `https://linkedin.com/in/${fullname.toLowerCase().replace(/\s/g,'-')}`,
        github: Math.random() > 0.4 ? `https://github.com/${fullname.toLowerCase().replace(/\s/g,'')}` : undefined,
      },
      aiSummary: generateBio(cat, yearsXp)
    });
  }
  
  const candidates = await User.insertMany(candidateBatch);
  console.log(`✅ Created ${candidates.length} candidates\n`);

  // ─── 3. CREATE 1000 JOBS ─────────────────────────────────────────────────────
  console.log('💼 Creating 1000 jobs...');
  const jobBatch = [];
  const types = ['full-time','part-time','contract','internship','remote','hybrid'];
  const expLevels = ['entry','mid','senior','lead'];
  
  for (let i = 0; i < 1000; i++) {
    const cat = rnd(jobCategories);
    const title = rnd(jobTitles[cat] || jobTitles.Technology);
    const employer = rnd(employers);
    const minSal = rndInt(200, 2000) * 100;
    
    jobBatch.push({
      title,
      description: generateJobDescription(title, cat),
      requirements: pick(skills[cat] || skills.default, rndInt(3, 6)),
      location: rnd(locations),
      category: cat,
      type: rnd(types),
      postedBy: employer._id,
      salaryMin: minSal,
      salaryMax: minSal + rndInt(500, 3000) * 100,
      isClosed: Math.random() > 0.85,
      skillsRequired: pick(skills[cat] || skills.default, rndInt(4, 8)),
      experienceLevel: rnd(expLevels),
      educationLevel: rnd(['Bachelor\'s Degree','Master\'s Degree','High School','Diploma','PhD'])
    });
  }
  
  const jobs = await Job.insertMany(jobBatch);
  console.log(`✅ Created ${jobs.length} jobs\n`);

  // ─── 4. CREATE APPLICATIONS ──────────────────────────────────────────────────
  // 300 jobs each get 200 candidates = 60,000 applications
  console.log('📋 Creating applications (300 jobs × 200 candidates each)...');
  const selectedJobs = pick(jobs, 300);
  const statuses = ['Applied','In Review','Rejected','Accepted'];
  
  let totalApps = 0;
  const BATCH_SIZE = 5000;
  
  for (let jobBatchStart = 0; jobBatchStart < selectedJobs.length; jobBatchStart += 10) {
    const jobsChunk = selectedJobs.slice(jobBatchStart, jobBatchStart + 10);
    const appsBatch = [];
    
    for (const job of jobsChunk) {
      const selectedCandidates = pick(candidates, 200);
      for (const candidate of selectedCandidates) {
        appsBatch.push({
          applicant: candidate._id,
          job: job._id,
          status: rnd(statuses),
          createdAt: new Date(Date.now() - rndInt(0, 90) * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        });
      }
    }
    
    // Insert in smaller chunks to avoid timeout
    for (let i = 0; i < appsBatch.length; i += BATCH_SIZE) {
      await Applicant.insertMany(appsBatch.slice(i, i + BATCH_SIZE), { ordered: false });
    }
    
    totalApps += appsBatch.length;
    const progress = Math.min(100, Math.round((jobBatchStart + 10) / 300 * 100));
    process.stdout.write(`\r   Progress: ${progress}% (${totalApps.toLocaleString()} applications created)`);
  }
  
  console.log(`\n✅ Created ${totalApps.toLocaleString()} applications\n`);

  // ─── SUMMARY ────────────────────────────────────────────────────────────────
  console.log('═'.repeat(60));
  console.log('🎉 SEED COMPLETE!');
  console.log('═'.repeat(60));
  console.log(`  Employers:     ${employers.length}`);
  console.log(`  Candidates:    ${candidates.length}`);
  console.log(`  Jobs:          ${jobs.length}`);
  console.log(`  Applications:  ${totalApps.toLocaleString()}`);
  console.log('═'.repeat(60));
  console.log('  🔑 Login password for ALL users: Test@1234');
  console.log('  📧 Employer emails sample:');
  employers.slice(0, 5).forEach(e => console.log(`     ${e.email}`));
  console.log('  📧 Candidate emails sample:');
  candidates.slice(0, 5).forEach(c => console.log(`     ${c.email}`));
  console.log('═'.repeat(60));

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
