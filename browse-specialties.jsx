import { useState, useRef, useEffect } from "react";

/* ════════════════════════════════════════════
   DATA — 43 specialties
   ════════════════════════════════════════════ */
const SPECIALTIES = [
  { id:"addiction-medicine", name:"Addiction Medicine", desc:"Diagnosis, treatment, and prevention of substance use disorders including alcohol, opioid, and stimulant dependence.", subs:[], adv:["Adolescent Addiction"], subDescs:{} },
  { id:"allergy-immunology", name:"Allergy & Immunology", desc:"Evaluation and treatment of allergic diseases, asthma, and immune system disorders. Includes allergy testing, immunotherapy, and management of anaphylaxis and autoimmune conditions.", subs:[], adv:[], subDescs:{} },
  { id:"audiology", name:"Audiology", desc:"Assessment and rehabilitation of hearing and balance disorders. Includes diagnostic audiometry, hearing aid fitting, tinnitus management, and vestibular evaluation.", subs:[], adv:["Hearing Aid Services"], subDescs:{} },
  { id:"bariatric-surgery", name:"Bariatric Surgery", desc:"Surgical treatment of obesity and obesity-related metabolic conditions. Includes gastric bypass, sleeve gastrectomy, and revisional procedures.", subs:[], adv:[], subDescs:{} },
  { id:"cardiology", name:"Cardiology", desc:"Diagnosis and treatment of diseases of the heart and blood vessels. Covers coronary artery disease, heart failure, arrhythmias, valvular disease, and preventive cardiovascular medicine.", subs:["Advanced Heart Failure & Transplant","Electrophysiology","Interventional Cardiology"], adv:["Preventive Cardiology","Structural Heart"], subDescs:{"Advanced Heart Failure & Transplant":"Management of end-stage heart failure including mechanical circulatory support, transplant evaluation, and post-transplant care.","Electrophysiology":"Diagnosis and treatment of cardiac arrhythmias using catheter ablation, pacemaker and defibrillator implantation, and rhythm monitoring.","Interventional Cardiology":"Catheter-based treatment of coronary artery disease and structural heart conditions including stenting, angioplasty, and transcatheter valve procedures."} },
  { id:"clinical-psychology", name:"Clinical Psychology", desc:"Assessment and treatment of mental health conditions through evidence-based psychotherapy, neuropsychological testing, and behavioral interventions.", subs:["Neuropsychology"], adv:[], subDescs:{"Neuropsychology":"Evaluation of cognitive and behavioral functioning related to brain conditions through standardized testing and clinical assessment."} },
  { id:"dermatology", name:"Dermatology", desc:"Skin, hair, and nail conditions. Select the subspecialty that matches your concern.", subs:["Mohs / Dermatologic Surgery","Pediatric Dermatology"], adv:[], subDescs:{"Mohs / Dermatologic Surgery":"Precise surgical removal of skin cancers with microscopic margin control, preserving maximum healthy tissue.","Pediatric Dermatology":"Skin conditions specific to infants, children, and adolescents including birthmarks, eczema, and genetic skin disorders."} },
  { id:"endocrinology", name:"Endocrinology", desc:"Diagnosis and management of hormonal and metabolic disorders including diabetes, thyroid disease, osteoporosis, adrenal conditions, and pituitary disorders.", subs:[], adv:[], subDescs:{} },
  { id:"ent", name:"ENT / Otolaryngology", desc:"Medical and surgical treatment of ear, nose, throat, head, and neck conditions. Includes sinus surgery, hearing restoration, voice disorders, and head and neck cancer.", subs:["Head & Neck Surgical Oncology","Otology / Neurotology","Pediatric Otolaryngology"], adv:["Laryngology","Rhinology / Skull Base","Sleep Medicine"], subDescs:{"Head & Neck Surgical Oncology":"Surgical treatment of cancers of the throat, mouth, salivary glands, and cervical lymph nodes.","Otology / Neurotology":"Surgical and medical treatment of ear diseases, hearing loss, and skull base tumors.","Pediatric Otolaryngology":"Ear, nose, and throat conditions in children including tonsillectomy, ear tubes, and airway disorders."} },
  { id:"family-medicine", name:"Family Medicine", desc:"Comprehensive primary care across all ages and organ systems. Includes preventive care, chronic disease management, acute illness treatment, and care coordination.", subs:["Geriatric Medicine","Sports Medicine"], adv:[], subDescs:{"Geriatric Medicine":"Primary care focused on adults over 65, addressing polypharmacy, cognitive decline, fall prevention, and complex multi-system conditions.","Sports Medicine":"Non-surgical treatment of musculoskeletal injuries and conditions related to physical activity."} },
  { id:"functional-medicine", name:"Functional Medicine", desc:"Systems-based approach identifying root causes of chronic disease through advanced diagnostics, nutrition optimization, and individualized treatment protocols.", subs:[], adv:[], subDescs:{} },
  { id:"gastroenterology", name:"Gastroenterology", desc:"Diagnosis and treatment of digestive system disorders including the esophagus, stomach, intestines, liver, and pancreas.", subs:["Transplant Hepatology"], adv:["Advanced Endoscopy / Therapeutic Endoscopy"], subDescs:{"Transplant Hepatology":"Management of end-stage liver disease, transplant evaluation, and post-transplant immunosuppression."} },
  { id:"general-surgery", name:"General Surgery", desc:"Operative treatment of abdominal, skin, breast, soft tissue, and endocrine conditions. Includes open and minimally invasive approaches.", subs:["Acute Care / Trauma","Bariatric Surgery","Breast Surgery","Colorectal Surgery","Surgical Oncology"], adv:[], subDescs:{"Acute Care / Trauma":"Emergency surgical management of traumatic injuries and acute abdominal conditions.","Bariatric Surgery":"Surgical weight loss procedures including gastric bypass, sleeve gastrectomy, and revisional surgery.","Breast Surgery":"Surgical treatment of breast cancer and benign breast conditions.","Colorectal Surgery":"Surgical treatment of colon, rectum, and anal diseases including cancer and IBD.","Surgical Oncology":"Operative treatment of solid tumors including complex resections and cytoreductive surgery."} },
  { id:"genetic-counseling", name:"Genetic Counseling", desc:"Risk assessment, education, and support regarding inherited conditions, genetic testing interpretation, and reproductive planning.", subs:["Cancer Genetics","Cardiovascular Genetics","Prenatal Genetics"], adv:[], subDescs:{"Cancer Genetics":"Assessment of hereditary cancer risk and personalized surveillance planning.","Cardiovascular Genetics":"Evaluation of inherited cardiac conditions including cardiomyopathies and arrhythmias.","Prenatal Genetics":"Genetic screening and diagnostic testing during pregnancy."} },
  { id:"hematology", name:"Hematology", desc:"Diagnosis and treatment of blood disorders including anemia, clotting disorders, blood cancers, and bone marrow conditions.", subs:[], adv:[], subDescs:{} },
  { id:"infectious-disease", name:"Infectious Disease", desc:"Diagnosis and treatment of complex bacterial, viral, fungal, and parasitic infections. Includes antibiotic stewardship, HIV management, and travel medicine.", subs:[], adv:[], subDescs:{} },
  { id:"internal-medicine", name:"Internal Medicine", desc:"Comprehensive care for adults encompassing prevention, diagnosis, and treatment of diseases affecting internal organ systems.", subs:[], adv:[], subDescs:{} },
  { id:"iv-therapy", name:"IV Therapy", desc:"Intravenous administration of fluids, vitamins, minerals, and medications for hydration, nutrient repletion, and therapeutic infusion.", subs:[], adv:[], subDescs:{} },
  { id:"ketamine-therapy", name:"Ketamine Therapy", desc:"Supervised ketamine-assisted treatment for treatment-resistant depression, chronic pain, PTSD, and other conditions under clinical protocols.", subs:[], adv:[], subDescs:{} },
  { id:"medical-aesthetics", name:"Medical Aesthetics", desc:"Non-surgical cosmetic procedures including injectables, laser treatments, chemical peels, and body contouring under medical supervision.", subs:[], adv:[], subDescs:{} },
  { id:"medical-oncology", name:"Medical Oncology", desc:"Non-surgical treatment of cancer through chemotherapy, immunotherapy, targeted therapy, and hormonal therapy.", subs:[], adv:[], subDescs:{} },
  { id:"nephrology", name:"Nephrology", desc:"Diagnosis and management of kidney diseases including chronic kidney disease, dialysis, electrolyte disorders, and hypertension.", subs:["Transplant Nephrology"], adv:[], subDescs:{"Transplant Nephrology":"Pre-transplant evaluation, post-transplant immunosuppression management, and long-term kidney transplant care."} },
  { id:"neurology", name:"Neurology", desc:"Diagnosis and treatment of disorders of the brain, spinal cord, peripheral nerves, and muscles.", subs:["Behavioral Neurology & Cognitive Disorders","Epilepsy","Movement Disorders","Neuro-Ophthalmology","Neuromuscular Medicine","Vascular Neurology"], adv:["Headache Medicine","Sleep Medicine"], subDescs:{"Behavioral Neurology & Cognitive Disorders":"Evaluation and management of cognitive decline, dementia, and behavioral changes.","Epilepsy":"Comprehensive seizure management including medication optimization and surgical candidacy evaluation.","Movement Disorders":"Treatment of Parkinson's disease, essential tremor, dystonia, and other motor control conditions.","Neuro-Ophthalmology":"Neurological conditions affecting vision and eye movement.","Neuromuscular Medicine":"Diagnosis and treatment of peripheral nerve and muscle diseases including neuropathy and ALS.","Vascular Neurology":"Acute stroke treatment and prevention, cerebrovascular disease management."} },
  { id:"neurosurgery", name:"Neurosurgery", desc:"Surgical treatment of conditions affecting the brain, spinal cord, and peripheral nerves.", subs:["Cerebrovascular / Endovascular","Functional Neurosurgery","Pediatric Neurosurgery","Peripheral Nerve","Skull Base / Brain Tumor","Spine Surgery"], adv:[], subDescs:{"Cerebrovascular / Endovascular":"Surgical and catheter-based treatment of brain aneurysms and AVMs.","Functional Neurosurgery":"Deep brain stimulation, epilepsy surgery, and procedures targeting circuit dysfunction.","Pediatric Neurosurgery":"Brain and spinal conditions in children including hydrocephalus and tumors.","Peripheral Nerve":"Surgical repair of injured or compressed peripheral nerves.","Skull Base / Brain Tumor":"Surgical removal of tumors at the skull base and within the brain.","Spine Surgery":"Surgical treatment of disc herniation, stenosis, deformity, and spinal cord tumors."} },
  { id:"nutrition", name:"Nutrition", desc:"Evidence-based dietary assessment, meal planning, and nutritional therapy for chronic disease management and metabolic health.", subs:[], adv:[], subDescs:{} },
  { id:"obgyn", name:"OB/GYN", desc:"Comprehensive women's reproductive health including prenatal care, labor and delivery, gynecologic surgery, and menopause management.", subs:["Gynecologic Oncology","Reproductive Endocrinology & Infertility","Urogynecology"], adv:["Minimally Invasive Gynecologic Surgery"], subDescs:{"Gynecologic Oncology":"Surgical and medical treatment of cancers of the female reproductive system.","Reproductive Endocrinology & Infertility":"Evaluation and treatment of infertility and assisted reproductive technologies including IVF.","Urogynecology":"Treatment of pelvic floor disorders including urinary incontinence and pelvic organ prolapse."} },
  { id:"ophthalmology", name:"Ophthalmology", desc:"Medical and surgical treatment of eye diseases and vision disorders. Includes cataract surgery, glaucoma management, and retinal treatment.", subs:["Cornea & External Disease","Glaucoma","Neuro-Ophthalmology","Oculoplastics","Pediatric Ophthalmology","Retina & Vitreous"], adv:["Refractive Surgery"], subDescs:{"Cornea & External Disease":"Treatment of corneal infections, dystrophies, and injuries including transplantation.","Glaucoma":"Medical and surgical management of elevated intraocular pressure to preserve vision.","Neuro-Ophthalmology":"Visual disturbances caused by neurological conditions.","Oculoplastics":"Surgical treatment of eyelid, orbital, and lacrimal system conditions.","Pediatric Ophthalmology":"Eye conditions in children including strabismus, amblyopia, and congenital cataracts.","Retina & Vitreous":"Treatment of retinal detachment, macular degeneration, and diabetic retinopathy."} },
  { id:"optometry", name:"Optometry", desc:"Comprehensive eye examination, vision correction, and detection and co-management of ocular diseases.", subs:[], adv:["Refractive Surgery (route-only)"], subDescs:{} },
  { id:"orthopedic-surgery", name:"Orthopedic Surgery", desc:"Surgical treatment of musculoskeletal conditions affecting bones, joints, ligaments, tendons, and muscles.", subs:["Adult Reconstruction","Foot & Ankle","Hand & Upper Extremity","Musculoskeletal Oncology","Pediatric Orthopedics","Spine Surgery","Sports Medicine","Trauma"], adv:["Shoulder & Elbow"], subDescs:{"Adult Reconstruction":"Total and partial joint replacement of the hip, knee, and shoulder.","Foot & Ankle":"Surgical treatment of foot and ankle deformities, fractures, and arthritis.","Hand & Upper Extremity":"Surgical treatment of hand, wrist, and elbow conditions.","Musculoskeletal Oncology":"Surgical treatment of bone and soft tissue tumors.","Pediatric Orthopedics":"Musculoskeletal conditions in children including scoliosis and hip dysplasia.","Spine Surgery":"Surgical treatment of disc herniation, stenosis, and spinal deformity.","Sports Medicine":"Arthroscopic surgery for ACL reconstruction, rotator cuff repair, and meniscus surgery.","Trauma":"Surgical treatment of acute fractures, dislocations, and complex injuries."} },
  { id:"pain-management", name:"Pain Management", desc:"Interventional and non-interventional treatment of acute and chronic pain. Includes nerve blocks, spinal injections, and neuromodulation.", subs:[], adv:[], subDescs:{} },
  { id:"palliative-care", name:"Palliative Care", desc:"Symptom management and quality-of-life support for patients with serious illness.", subs:[], adv:[], subDescs:{} },
  { id:"pediatrics", name:"Pediatrics", desc:"Comprehensive medical care for infants, children, and adolescents.", subs:["Adolescent Medicine","Developmental-Behavioral Pediatrics","Neonatal-Perinatal Medicine","Pediatric Cardiology","Pediatric Endocrinology","Pediatric Gastroenterology","Pediatric Hematology-Oncology","Pediatric Nephrology","Pediatric Pulmonology"], adv:[], subDescs:{"Adolescent Medicine":"Healthcare for teenagers addressing puberty, mental health, substance use, and reproductive health.","Developmental-Behavioral Pediatrics":"Evaluation and treatment of developmental delays, autism, ADHD, and learning disabilities.","Neonatal-Perinatal Medicine":"Intensive care for premature and critically ill newborns.","Pediatric Cardiology":"Diagnosis and non-surgical treatment of congenital and acquired heart disease in children.","Pediatric Endocrinology":"Hormonal and metabolic disorders in children including diabetes and growth disorders.","Pediatric Gastroenterology":"Digestive and liver disorders in children including IBD and celiac disease.","Pediatric Hematology-Oncology":"Treatment of childhood blood disorders and cancers.","Pediatric Nephrology":"Kidney diseases in children including nephrotic syndrome and congenital anomalies.","Pediatric Pulmonology":"Respiratory conditions in children including asthma and cystic fibrosis."} },
  { id:"physical-therapy", name:"Physical Therapy", desc:"Rehabilitation and movement restoration through therapeutic exercise, manual therapy, and functional training.", subs:["Cardiovascular & Pulmonary","Geriatrics","Neurology","Oncology","Orthopaedics","Pediatrics","Sports","Women's Health","Wound Management"], adv:["Spine"], subDescs:{"Cardiovascular & Pulmonary":"Rehabilitation for heart disease, post-cardiac surgery, and pulmonary conditions.","Geriatrics":"Mobility limitations, fall prevention, and functional independence in older adults.","Neurology":"Rehabilitation for stroke, TBI, spinal cord injury, and Parkinson's disease.","Oncology":"Cancer-related fatigue, lymphedema, and surgical recovery.","Orthopaedics":"Musculoskeletal injuries and post-surgical rehabilitation.","Pediatrics":"Children with developmental delays, cerebral palsy, and sports injuries.","Sports":"Injury prevention, rehabilitation, and return-to-sport protocols.","Women's Health":"Pelvic floor rehabilitation, prenatal and postpartum recovery.","Wound Management":"Chronic wounds including pressure ulcers and diabetic ulcers."} },
  { id:"plastic-surgery", name:"Plastic Surgery", desc:"Reconstructive and aesthetic surgery of the face, body, and extremities.", subs:["Craniofacial Surgery","Hand Surgery"], adv:["Aesthetic / Cosmetic","Breast Reconstruction","Burn Surgery","Microsurgery"], subDescs:{"Craniofacial Surgery":"Surgical correction of skull, face, and jaw deformities including cleft lip and palate.","Hand Surgery":"Surgical treatment of hand and wrist conditions including trauma and nerve compression."} },
  { id:"pmr", name:"PM&R", desc:"Physical medicine and rehabilitation focused on restoring function after injury, illness, or surgery.", subs:["Brain Injury Medicine","Neuromuscular Medicine","Spinal Cord Injury Medicine"], adv:["Cardiac Rehabilitation"], subDescs:{"Brain Injury Medicine":"Rehabilitation and long-term management of traumatic brain injury.","Neuromuscular Medicine":"Non-surgical management of peripheral nerve and muscle diseases.","Spinal Cord Injury Medicine":"Comprehensive rehabilitation and lifelong management of spinal cord injury."} },
  { id:"psychiatry", name:"Psychiatry", desc:"Diagnosis and treatment of mental health conditions through medication management, psychotherapy, and interventional psychiatry.", subs:["Addiction Psychiatry","Child & Adolescent Psychiatry","Geriatric Psychiatry"], adv:[], subDescs:{"Addiction Psychiatry":"Psychiatric treatment of substance use disorders including dual-diagnosis management.","Child & Adolescent Psychiatry":"Mental health assessment and treatment for children and teenagers.","Geriatric Psychiatry":"Psychiatric care for older adults addressing dementia-related symptoms and late-life depression."} },
  { id:"pulmonology", name:"Pulmonology", desc:"Diagnosis and treatment of lung and respiratory disorders including asthma, COPD, and interstitial lung disease.", subs:["Interventional Pulmonology","Pulmonary & Critical Care"], adv:["Sleep Medicine"], subDescs:{"Interventional Pulmonology":"Minimally invasive procedures for airway and pleural diseases.","Pulmonary & Critical Care":"Management of acute respiratory failure and multiorgan dysfunction in ICU settings."} },
  { id:"radiation-oncology", name:"Radiation Oncology", desc:"Treatment of cancer using targeted radiation therapy including external beam radiation, brachytherapy, and stereotactic radiosurgery.", subs:[], adv:[], subDescs:{} },
  { id:"radiology", name:"Radiology", desc:"Diagnostic imaging and image-guided procedures. Includes X-ray, CT, MRI, ultrasound, and PET interpretation.", subs:["Breast Imaging","Interventional Radiology","Nuclear Medicine"], adv:[], subDescs:{"Breast Imaging":"Specialized mammography, breast ultrasound, and breast MRI for screening and diagnosis.","Interventional Radiology":"Minimally invasive image-guided procedures including embolization and biopsy.","Nuclear Medicine":"Diagnostic imaging and therapy using radiopharmaceuticals."} },
  { id:"rheumatology", name:"Rheumatology", desc:"Diagnosis and treatment of autoimmune and inflammatory conditions affecting joints, muscles, and connective tissues.", subs:[], adv:[], subDescs:{} },
  { id:"thoracic-surgery", name:"Thoracic Surgery", desc:"Surgical treatment of conditions affecting the lungs, esophagus, and chest wall.", subs:[], adv:[], subDescs:{} },
  { id:"urgent-care", name:"Urgent Care", desc:"Walk-in evaluation and treatment of non-life-threatening acute conditions. Same-day care without appointment.", subs:[], adv:[], subDescs:{} },
  { id:"urology", name:"Urology", desc:"Medical and surgical treatment of urinary tract and male reproductive conditions.", subs:["Endourology & Stone Disease","Female Pelvic Medicine","Pediatric Urology","Reconstructive Urology","Urologic Oncology"], adv:["Male Infertility & Andrology","Sexual Medicine"], subDescs:{"Endourology & Stone Disease":"Minimally invasive treatment of kidney stones using ureteroscopy and percutaneous techniques.","Female Pelvic Medicine":"Treatment of female urinary incontinence, prolapse, and voiding dysfunction.","Pediatric Urology":"Urologic conditions in children including hypospadias and vesicoureteral reflux.","Reconstructive Urology":"Surgical reconstruction of the urinary tract.","Urologic Oncology":"Surgical treatment of cancers of the kidney, bladder, prostate, and testes."} },
  { id:"vascular-surgery", name:"Vascular Surgery", desc:"Surgical and endovascular treatment of arterial and venous diseases. Includes aneurysm repair, bypass grafting, and carotid surgery.", subs:[], adv:["Venous Disease"], subDescs:{} },
];

const SPEC_IMAGES = {
  "Addiction Medicine":"https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=280&fit=crop",
  "Allergy & Immunology":"https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=280&fit=crop",
  "Audiology":"https://images.unsplash.com/photo-1590935217281-8f102120d683?w=400&h=280&fit=crop",
  "Bariatric Surgery":"https://images.unsplash.com/photo-1551190822-a9ce113ac100?w=400&h=280&fit=crop",
  "Cardiology":"https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=400&h=280&fit=crop",
  "Clinical Psychology":"https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=400&h=280&fit=crop",
  "Dermatology":"https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=280&fit=crop",
  "Endocrinology":"https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=280&fit=crop",
  "ENT / Otolaryngology":"https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=400&h=280&fit=crop",
  "Family Medicine":"https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=400&h=280&fit=crop",
  "Functional Medicine":"https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=280&fit=crop",
  "Gastroenterology":"https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=400&h=280&fit=crop",
  "General Surgery":"https://images.unsplash.com/photo-1551076805-e1869033e561?w=400&h=280&fit=crop",
  "Genetic Counseling":"https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=280&fit=crop",
  "Hematology":"https://images.unsplash.com/photo-1615631648086-325025c9e51e?w=400&h=280&fit=crop",
  "Infectious Disease":"https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400&h=280&fit=crop",
  "Internal Medicine":"https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&h=280&fit=crop",
  "IV Therapy":"https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&h=280&fit=crop",
  "Ketamine Therapy":"https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=280&fit=crop",
  "Medical Aesthetics":"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=280&fit=crop",
  "Medical Oncology":"https://images.unsplash.com/photo-1576671081837-49000212a370?w=400&h=280&fit=crop",
  "Nephrology":"https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=400&h=280&fit=crop",
  "Neurology":"https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=400&h=280&fit=crop",
  "Neurosurgery":"https://images.unsplash.com/photo-1551076805-e1869033e561?w=400&h=280&fit=crop",
  "Nutrition":"https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=280&fit=crop",
  "OB/GYN":"https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=280&fit=crop",
  "Ophthalmology":"https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=400&h=280&fit=crop",
  "Optometry":"https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=280&fit=crop",
  "Orthopedic Surgery":"https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=280&fit=crop",
  "Pain Management":"https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=280&fit=crop",
  "Palliative Care":"https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=400&h=280&fit=crop",
  "Pediatrics":"https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=400&h=280&fit=crop",
  "Physical Therapy":"https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=280&fit=crop",
  "Plastic Surgery":"https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=280&fit=crop",
  "PM&R":"https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=280&fit=crop",
  "Psychiatry":"https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=400&h=280&fit=crop",
  "Pulmonology":"https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=400&h=280&fit=crop",
  "Radiation Oncology":"https://images.unsplash.com/photo-1576671081837-49000212a370?w=400&h=280&fit=crop",
  "Radiology":"https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&h=280&fit=crop",
  "Rheumatology":"https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=280&fit=crop",
  "Thoracic Surgery":"https://images.unsplash.com/photo-1551076805-e1869033e561?w=400&h=280&fit=crop",
  "Urgent Care":"https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=280&fit=crop",
  "Urology":"https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&h=280&fit=crop",
  "Vascular Surgery":"https://images.unsplash.com/photo-1551076805-e1869033e561?w=400&h=280&fit=crop",
};

function mockProviders(specName){
  const data=[
    {first:"Sarah",last:"Chen",suffix:"MD",city:"Canton, GA",dist:"4.2 mi",tele:true},
    {first:"Marcus",last:"Webb",suffix:"DO",city:"Cumming, GA",dist:"8.7 mi",tele:true},
    {first:"Rachel",last:"Torres",suffix:"MD",city:"Sandy Springs, GA",dist:"11.3 mi",tele:false},
  ];
  const word=specName.split(/[\s/]+/)[0];
  return data.map(d=>({name:`Dr. ${d.first} ${d.last}, ${d.suffix}`,practice:`${d.city.split(",")[0]} ${word} Associates`,city:d.city,dist:d.dist,tele:d.tele}));
}

function hasSubPages(spec){return spec.subs.length+spec.adv.length>0;}

const G="'Georgia','Times New Roman',serif";
const U="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const GREEN="#2D6A4F";
const BG="#fafaf8";

function SearchIcon({size=18}){return <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round"><circle cx="7.5" cy="7.5" r="5.5"/><path d="M12 12l4 4"/></svg>;}
function ArrowRight({size=14}){return <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>;}
function ChevronRight({size=12}){return <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 2.5l3.5 3.5-3.5 3.5"/></svg>;}
function ChevronL({size=20}){return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4l-6 6 6 6"/></svg>;}
function ChevronR({size=20}){return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4l6 6-6 6"/></svg>;}
function QuestionIcon(){return <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="10" stroke={GREEN} strokeWidth="1.5"/><text x="11" y="15.5" textAnchor="middle" fill={GREEN} fontSize="13" fontWeight="600" fontFamily={U}>?</text></svg>;}

function Nav({onHome,showSearch=false}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 32px",borderBottom:"1px solid #e5e5e3",background:"#fff",position:"sticky",top:0,zIndex:100}}>
      <div onClick={onHome} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",flexShrink:0}}>
        <div style={{width:28,height:28,borderRadius:"50%",border:`2.5px solid ${GREEN}`,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:8,height:8,borderRadius:"50%",background:GREEN}}/></div>
        <span style={{fontFamily:G,fontSize:18,fontWeight:600}}><span style={{color:"#1a1a1a"}}>open</span><span style={{color:GREEN}}>doc</span></span>
      </div>
      {showSearch&&(
        <div style={{display:"flex",alignItems:"center",gap:6,border:"1px solid #e5e5e3",borderRadius:8,padding:"8px 16px",background:BG,width:400}}>
          <SearchIcon/>
          <input placeholder="Search for a service, provider, diagnosis, or symptom" style={{border:"none",outline:"none",background:"none",flex:1,fontSize:13,color:"#666",fontFamily:U}}/>
          <button style={{background:GREEN,color:"#fff",border:"none",borderRadius:6,padding:"5px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Search</button>
        </div>
      )}
      <div style={{display:"flex",alignItems:"center",gap:24,fontSize:14,color:"#555",fontFamily:U,flexShrink:0}}>
        <span style={{cursor:"pointer"}}>How It Works</span>
        <span style={{cursor:"pointer"}}>For Providers</span>
        <button style={{border:"1px solid #e5e5e3",borderRadius:8,padding:"7px 18px",background:"#fff",fontSize:13,cursor:"pointer",fontFamily:U}}>Sign in</button>
      </div>
    </div>
  );
}

function Breadcrumb({items}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#999",fontFamily:U,marginBottom:20,flexWrap:"wrap"}}>
      {items.map((item,i)=>(
        <span key={i} style={{display:"flex",alignItems:"center",gap:6}}>
          {i>0&&<ChevronRight/>}
          {item.onClick?<span onClick={item.onClick} style={{color:GREEN,cursor:"pointer",fontWeight:500}}>{item.label}</span>:<span style={{color:"#555",fontWeight:500}}>{item.label}</span>}
        </span>
      ))}
    </div>
  );
}

function HoverCard({children,onClick,style={}}){
  return(
    <div onClick={onClick} style={{background:"#fff",border:"1px solid #e5e5e3",borderRadius:10,cursor:onClick?"pointer":"default",transition:"all 0.2s",...style}}
      onMouseEnter={e=>{if(onClick){e.currentTarget.style.borderColor=GREEN;e.currentTarget.style.boxShadow="0 2px 12px rgba(45,106,79,0.07)";}}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="#e5e5e3";e.currentTarget.style.boxShadow="none";}}>
      {children}
    </div>
  );
}

/* Horizontal specialty pill nav for inner pages */
function SpecPillNav({current,onSelect}){
  const ref=useRef(null);
  const activeRef=useRef(null);
  useEffect(()=>{
    if(activeRef.current){activeRef.current.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});}
  },[current]);
  return(
    <div style={{borderBottom:"1px solid #e5e5e3",background:"#fff",padding:"10px 0",position:"sticky",top:58,zIndex:99}}>
      <div ref={ref} style={{display:"flex",gap:8,overflowX:"auto",padding:"0 32px",scrollbarWidth:"none",msOverflowStyle:"none"}}>
        <style>{`.pnav::-webkit-scrollbar{display:none}`}</style>
        {SPECIALTIES.filter(s=>hasSubPages(s)).map(s=>{
          const active=current&&current.id===s.id;
          return(
            <button key={s.id} ref={active?activeRef:null} onClick={()=>onSelect(s)} className="pnav" style={{
              padding:"7px 18px",borderRadius:20,fontSize:13,whiteSpace:"nowrap",border:active?`1.5px solid ${GREEN}`:"1px solid #e5e5e3",
              background:active?"rgba(45,106,79,0.06)":"#fff",color:active?GREEN:"#555",fontWeight:active?600:400,
              cursor:"pointer",transition:"all 0.15s",fontFamily:U,flexShrink:0,
            }}>{s.name}</button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════ APP ══════════════════════════ */
export default function App(){
  const [view,setView]=useState("home");
  const [selectedSpec,setSelectedSpec]=useState(null);
  const [selectedSub,setSelectedSub]=useState(null);
  const scrollRef=useRef(null);

  const goHome=()=>{setView("home");setSelectedSpec(null);setSelectedSub(null);window.scrollTo(0,0);};
  const goSpec=(spec)=>{
    if(!hasSubPages(spec)){
      setSelectedSpec(spec);setSelectedSub(spec.name);setView("providers");window.scrollTo(0,0);
    } else {
      setSelectedSpec(spec);setSelectedSub(null);setView("specialty");window.scrollTo(0,0);
    }
  };
  const goSub=(sub)=>{setSelectedSub(sub);setView("providers");window.scrollTo(0,0);};

  const scrollCards=(dir)=>{if(scrollRef.current)scrollRef.current.scrollBy({left:dir*600,behavior:"smooth"});};

  /* ──── HOME ──── */
  if(view==="home"){
    return(
      <div style={{fontFamily:U,background:BG,minHeight:"100vh"}}>
        <Nav onHome={goHome}/>
        {/* Hero */}
        <div style={{background:"linear-gradient(180deg,#f0f7f3 0%,#fafaf8 100%)",padding:"64px 32px 48px",textAlign:"center"}}>
          <div style={{fontFamily:G,fontSize:48,fontWeight:700,color:"#1a1a1a",letterSpacing:"-0.02em",lineHeight:1.1}}>Open<span style={{color:GREEN}}>Doc</span></div>
          <div style={{fontFamily:G,fontSize:18,color:"#666",marginTop:12}}>Healthcare you can price before you buy.</div>
          <div style={{display:"flex",alignItems:"center",gap:6,border:"1.5px solid #e5e5e3",borderRadius:12,padding:"12px 20px",background:"#fff",maxWidth:560,margin:"28px auto 0",boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
            <SearchIcon/>
            <input placeholder="Search for a service, provider, diagnosis, or symptom" style={{border:"none",outline:"none",background:"none",flex:1,fontSize:15,color:"#333",fontFamily:U}}/>
            <button style={{background:GREEN,color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",fontSize:14,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>See Prices</button>
          </div>
        </div>

        {/* Browse by Specialty — two-row horizontal scroll */}
        <div style={{padding:"48px 0 56px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"0 32px",marginBottom:20,maxWidth:1200,margin:"0 auto 20px"}}>
            <div>
              <div style={{fontFamily:G,fontSize:26,fontWeight:700,color:"#1a1a1a"}}>Browse by Specialty</div>
              <div style={{fontSize:14,color:"#888",marginTop:4}}>Explore specialties to find the right provider and service for your needs</div>
            </div>
            <button onClick={()=>{setView("specialty");setSelectedSpec(SPECIALTIES.find(s=>hasSubPages(s)));window.scrollTo(0,0);}} style={{background:"none",border:"none",color:GREEN,fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>View all specialties <ArrowRight/></button>
          </div>

          <div style={{position:"relative",maxWidth:1200,margin:"0 auto"}}>
            <button onClick={()=>scrollCards(-1)} style={{position:"absolute",left:4,top:"50%",transform:"translateY(-50%)",zIndex:10,width:40,height:40,borderRadius:"50%",border:"1px solid #e5e5e3",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",color:"#555"}}><ChevronL/></button>
            <button onClick={()=>scrollCards(1)} style={{position:"absolute",right:4,top:"50%",transform:"translateY(-50%)",zIndex:10,width:40,height:40,borderRadius:"50%",border:"1px solid #e5e5e3",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",color:"#555"}}><ChevronR/></button>

            <div ref={scrollRef} style={{overflowX:"auto",scrollbarWidth:"none",msOverflowStyle:"none",padding:"0 32px"}}>
              <style>{`div::-webkit-scrollbar{display:none}`}</style>
              <div style={{display:"grid",gridTemplateRows:"1fr 1fr",gridAutoFlow:"column",gridAutoColumns:"220px",gap:14}}>
                {SPECIALTIES.map((spec)=>(
                  <div key={spec.id} onClick={()=>goSpec(spec)}
                    style={{background:"#fff",border:"1px solid #e5e5e3",borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all 0.2s",width:220}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=GREEN;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.08)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#e5e5e3";e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                    <div style={{height:120,background:`url(${SPEC_IMAGES[spec.name]||"https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=280&fit=crop"}) center/cover`}}/>
                    <div style={{padding:"12px 14px 14px"}}>
                      <div style={{fontFamily:G,fontSize:14,fontWeight:600,color:"#1a1a1a",lineHeight:1.3}}>{spec.name}</div>
                      <div style={{display:"flex",alignItems:"center",gap:4,color:GREEN,fontSize:12,fontWeight:500,marginTop:8}}>View Providers <ArrowRight size={11}/></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ──── SPECIALTY PAGE (with pill nav) ──── */
  if(view==="specialty"&&selectedSpec){
    const allItems=[
      {name:`General ${selectedSpec.name}`,type:"General",desc:`General ${selectedSpec.name.toLowerCase()} consultation, evaluation, and treatment. Your provider will help determine the right next step.`},
      ...selectedSpec.subs.map(s=>({name:s,type:"Subspecialty",desc:selectedSpec.subDescs?.[s]||"Specialized area of focused clinical practice within this discipline."})),
      ...selectedSpec.adv.map(a=>({name:a,type:"Advanced Training",desc:selectedSpec.subDescs?.[a]||"Advanced clinical training and focused expertise within this specialty."})),
    ];
    return(
      <div style={{fontFamily:U,background:BG,minHeight:"100vh"}}>
        <Nav onHome={goHome} showSearch/>
        <SpecPillNav current={selectedSpec} onSelect={goSpec}/>
        <div style={{maxWidth:800,margin:"0 auto",padding:"32px 24px 80px"}}>
          <Breadcrumb items={[{label:"All Specialties",onClick:()=>{setSelectedSpec(SPECIALTIES.find(s=>hasSubPages(s)));window.scrollTo(0,0);}},{label:selectedSpec.name}]}/>
          <div style={{fontFamily:G,fontSize:32,fontWeight:700,color:"#1a1a1a",letterSpacing:"-0.02em"}}>{selectedSpec.name}</div>
          <div style={{fontSize:15,color:"#666",marginTop:10,lineHeight:1.65,maxWidth:680}}>{selectedSpec.desc}</div>

          <div style={{marginTop:24,borderTop:"1px solid #e5e5e3",paddingTop:24}}>
            {/* Helper callout */}
            <div style={{display:"flex",gap:14,alignItems:"flex-start",background:"rgba(45,106,79,0.04)",border:"1px solid rgba(45,106,79,0.12)",borderRadius:10,padding:"16px 20px",marginBottom:24}}>
              <div style={{flexShrink:0,marginTop:2}}><QuestionIcon/></div>
              <div>
                <div style={{fontSize:14,color:"#1a1a1a"}}><strong>Not sure which one?</strong> No problem — pick the "General {selectedSpec.name}" option. Your provider will help figure out the right next step, and you'll know the cost before anything happens.</div>
              </div>
            </div>

            <div style={{fontSize:11,fontWeight:600,color:"#999",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Subspecialties</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
              {allItems.map((item,i)=>(
                <HoverCard key={i} onClick={()=>goSub(item.name)} style={{padding:"18px 20px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontFamily:G,fontSize:15,fontWeight:600,color:"#1a1a1a"}}>{item.name}</div>
                    {item.type==="Advanced Training"&&<span style={{fontSize:10,fontWeight:600,color:GREEN,background:"rgba(45,106,79,0.08)",padding:"2px 8px",borderRadius:12}}>ADV</span>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:4,color:GREEN,fontSize:13,fontWeight:500,marginTop:10}}>Find providers <ArrowRight size={12}/></div>
                </HoverCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ──── PROVIDER PAGE ──── */
  if(view==="providers"&&selectedSpec&&selectedSub){
    const isDirectSpec=selectedSub===selectedSpec.name;
    const isGeneral=selectedSub.startsWith("General ");
    const subDesc=isDirectSpec?selectedSpec.desc:isGeneral?`General ${selectedSpec.name.toLowerCase()} consultation, evaluation, and treatment. Your provider will help determine the right next step.`:(selectedSpec.subDescs?.[selectedSub]||selectedSpec.desc);
    const providers=mockProviders(selectedSpec.name);

    const crumbs=[{label:"All Specialties",onClick:()=>{if(hasSubPages(selectedSpec)){goSpec(selectedSpec);}else{setView("specialty");setSelectedSpec(SPECIALTIES.find(s=>hasSubPages(s)));window.scrollTo(0,0);}}}];
    if(!isDirectSpec){
      crumbs.push({label:selectedSpec.name,onClick:()=>{setSelectedSub(null);setView("specialty");window.scrollTo(0,0);}});
      crumbs.push({label:selectedSub});
    } else {
      crumbs.push({label:selectedSpec.name});
    }

    return(
      <div style={{fontFamily:U,background:BG,minHeight:"100vh"}}>
        <Nav onHome={goHome} showSearch/>
        <div style={{maxWidth:800,margin:"0 auto",padding:"32px 24px 80px"}}>
          <Breadcrumb items={crumbs}/>
          {!isDirectSpec&&<div style={{fontSize:12,fontWeight:600,color:GREEN,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{selectedSpec.name}</div>}
          <div style={{fontFamily:G,fontSize:28,fontWeight:700,color:"#1a1a1a",letterSpacing:"-0.02em"}}>{selectedSub}</div>
          <div style={{fontSize:15,color:"#666",marginTop:10,lineHeight:1.65,maxWidth:680}}>{subDesc}</div>
          <div style={{marginTop:32,paddingTop:24,borderTop:"1px solid #e5e5e3"}}>
            <div style={{fontSize:12,fontWeight:600,color:"#999",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:16}}>Providers · {providers.length} near Canton, GA</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {providers.map((p,i)=>(
                <HoverCard key={i} style={{padding:"20px 22px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <div style={{fontFamily:G,fontSize:16,fontWeight:600,color:"#1a1a1a"}}>{p.name}</div>
                      <div style={{fontSize:13,color:"#666",marginTop:2}}>{p.practice}</div>
                      <div style={{fontSize:12,color:"#999",marginTop:4}}>{p.city}</div>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:"#555",flexShrink:0,marginLeft:16}}>{p.dist}</div>
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
                    <span style={{fontSize:11,fontWeight:500,color:"#155724",background:"#d4edda",padding:"3px 10px",borderRadius:20}}>Accepting patients</span>
                    {p.tele&&<span style={{fontSize:11,fontWeight:500,color:"#004085",background:"#cce5ff",padding:"3px 10px",borderRadius:20}}>Telehealth</span>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6,color:GREEN,fontSize:13,fontWeight:600,marginTop:14}}>View services & pricing <ArrowRight size={12}/></div>
                </HoverCard>
              ))}
            </div>
            <div style={{textAlign:"center",padding:"32px 0",color:"#999",fontSize:13}}>More providers available. Showing results near Canton, GA.</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
