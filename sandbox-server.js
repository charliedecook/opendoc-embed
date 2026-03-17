/**
 * OpenDoc Platform API — Sandbox Server
 * 
 * Stubs every critical endpoint with test data.
 * Enables end-to-end flow: resolve → create Health Key → authorize → fund → complete → settle
 * 
 * Usage:
 *   npm install express uuid
 *   node sandbox-server.js
 *   Server runs on http://localhost:3100
 * 
 * All data is in-memory. Resets on restart.
 */

const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.json());

// ── Helpers ──
const uuid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const cents = (dollars) => Math.round(dollars * 100);

// ── In-Memory Stores ──
const store = {
  patients: new Map(),
  providers: new Map(),
  offers: new Map(),
  healthKeys: new Map(),
  funding: new Map(),      // health_key_id → { contributions: [], state }
  settlements: new Map(),
  membershipTiers: new Map(),
  memberships: new Map(),
  webhooks: new Map(),
  clients: new Map(),
  consentGrants: new Map(),
  auditLog: [],
};

// ── Seed Data ──
function seed() {
  // Provider
  const provId = uuid();
  store.providers.set(provId, {
    provider_id: provId,
    status: 'VERIFIED',
    display_name: 'Total Joint Specialists',
    legal_name: 'Total Joint Specialists LLC',
    npi: '1234567890',
    specialty: 'orthopedic',
    subspecialty: 'joint_replacement',
    credentials: ['MD', 'Board Certified Orthopedic Surgery'],
    locations: [{
      location_id: uuid(),
      name: 'Canton Surgery Center',
      address: { street: '123 Hospital Rd', city: 'Canton', state: 'GA', postal_code: '30114' },
      geo: { lat: 34.2368, lng: -84.4908 },
      facility_type: 'ASC',
    }],
    capabilities: [],
    operational_signals: {
      acceptance_rate: 0.96,
      cancellation_rate: 0.02,
      average_settlement_days: 1.2,
      dispute_rate: 0.005,
      transactability_score: 94,
    },
    medicare_opted_out: true,
    accepting_new_patients: true,
    telehealth_available: false,
    created_at: now(),
  });

  // DPC Provider
  const dpcProvId = uuid();
  store.providers.set(dpcProvId, {
    provider_id: dpcProvId,
    status: 'VERIFIED',
    display_name: 'Peachtree Direct Primary Care',
    legal_name: 'Peachtree DPC LLC',
    npi: '9876543210',
    specialty: 'primary_care',
    subspecialty: 'dpc',
    credentials: ['MD', 'Board Certified Family Medicine'],
    locations: [{
      location_id: uuid(),
      name: 'Canton Office',
      address: { street: '215 Riverstone Pkwy', city: 'Canton', state: 'GA', postal_code: '30114' },
      geo: { lat: 34.2372, lng: -84.4875 },
      facility_type: 'OFFICE',
    }],
    capabilities: [],
    operational_signals: { transactability_score: 91 },
    medicare_opted_out: true,
    accepting_new_patients: true,
    telehealth_available: true,
    created_at: now(),
  });

  // Offers
  const prov = store.providers.get(provId);
  const loc = prov.locations[0];

  const hsos = [
    { id: 'hso.ortho.knee.eval.new', name: 'Ortho Knee Evaluation (New Patient)', price: cents(350) },
    { id: 'hso.ortho.knee.proc.total_replacement', name: 'Total Knee Replacement', price: cents(18950) },
    { id: 'hso.ortho.hip.proc.total_replacement', name: 'Total Hip Replacement', price: cents(22450) },
    { id: 'hso.ortho.knee.proc.arthroscopy', name: 'Knee Arthroscopy', price: cents(4200) },
  ];

  hsos.forEach(hso => {
    const offerId = uuid();
    store.offers.set(offerId, {
      offer_id: offerId,
      provider_id: provId,
      provider_display_name: prov.display_name,
      hso_id: hso.id,
      hso_name: hso.name,
      location_id: loc.location_id,
      location: loc,
      price: {
        amount_cents: hso.price,
        currency: 'USD',
        immutable_once_accepted: true,
      },
      availability: { next_available: '2026-03-24', slots_this_week: 3 },
      transactability_score: 94,
      binding_mode: 'ORGANIZATION_BOUND',
      active: true,
      created_at: now(),
    });
    prov.capabilities.push(hso.id);
  });

  // Sandbox client
  const clientId = uuid();
  store.clients.set(clientId, {
    client_id: clientId,
    name: 'Sandbox Test Client',
    tier: 'SANDBOX',
    api_key: 'sk_sandbox_' + crypto.randomBytes(16).toString('hex'),
    created_at: now(),
  });

  console.log('\n  Seed data loaded:');
  console.log(`  ${store.providers.size} providers`);
  console.log(`  ${store.offers.size} offers`);
  console.log(`  Client API key: ${store.clients.get(clientId).api_key}\n`);
}

// ── Middleware: Request envelope ──
app.use((req, res, next) => {
  res.envelope = (data, status = 200) => {
    res.status(status).json({
      request_id: uuid(),
      api_version: '1.0',
      schema_version: '1.0',
      timestamp: now(),
      ...data,
    });
  };
  next();
});

// ── Taxonomy ──

const COMPLAINTS = [
  { complaint_id: 'complaint.knee_pain', name: 'Knee Pain', specialty: 'orthopedic', consumer_synonyms: ['my knee hurts', 'knee ache', 'sore knee', 'knee swelling'], mapped_hso_ids: ['hso.ortho.knee.eval.new', 'hso.ortho.knee.proc.arthroscopy'] },
  { complaint_id: 'complaint.hip_pain', name: 'Hip Pain', specialty: 'orthopedic', consumer_synonyms: ['hip ache', 'groin pain', 'hip stiffness'], mapped_hso_ids: ['hso.ortho.hip.eval.new'] },
  { complaint_id: 'complaint.headache', name: 'Headache', specialty: 'primary_care', consumer_synonyms: ['head hurts', 'migraine'], mapped_hso_ids: ['hso.primary.eval.new'] },
];

const DIAGNOSES = [
  { diagnosis_id: 'dx.osteoarthritis.knee', name: 'Knee Osteoarthritis', specialty: 'orthopedic', consumer_synonyms: ['worn out knee', 'bone on bone knee'], mapped_hso_ids: ['hso.ortho.knee.proc.total_replacement', 'hso.ortho.knee.proc.arthroscopy'], care_phases: ['NEW_DIAGNOSIS', 'EVALUATION_FOLLOW_UP', 'PROCEDURAL'] },
  { diagnosis_id: 'dx.osteoarthritis.hip', name: 'Hip Osteoarthritis', specialty: 'orthopedic', consumer_synonyms: ['worn out hip'], mapped_hso_ids: ['hso.ortho.hip.proc.total_replacement'], care_phases: ['NEW_DIAGNOSIS', 'PROCEDURAL'] },
];

const SCOPE_CODES = [
  { code: 'INCL.VISIT.OFFICE', label: 'Office visits', type: 'INCLUSION', category: 'visit', required_exclusion: false },
  { code: 'INCL.VISIT.TELEHEALTH', label: 'Telehealth visits', type: 'INCLUSION', category: 'visit', required_exclusion: false },
  { code: 'INCL.CHRONIC.MANAGEMENT', label: 'Chronic disease management', type: 'INCLUSION', category: 'chronic', required_exclusion: false },
  { code: 'EXCL.HOSPITAL.*', label: 'Hospital/ED care and inpatient services', type: 'EXCLUSION', category: 'hospital', required_exclusion: true },
  { code: 'EXCL.ANES.GENERAL', label: 'Procedures requiring general anesthesia', type: 'EXCLUSION', category: 'anesthesia', required_exclusion: true },
  { code: 'EXCL.IMAGING.ADVANCED', label: 'Advanced imaging facility fees (CT/MRI/PET)', type: 'EXCLUSION', category: 'imaging', required_exclusion: true },
];

app.get('/v1/taxonomy/complaints', (req, res) => {
  let results = COMPLAINTS;
  if (req.query.q) {
    const q = req.query.q.toLowerCase();
    results = results.filter(c => c.name.toLowerCase().includes(q) || c.consumer_synonyms.some(s => s.includes(q)));
  }
  res.envelope({ data: results, pagination: { has_more: false, total_count: results.length } });
});

app.get('/v1/taxonomy/complaints/:id', (req, res) => {
  const c = COMPLAINTS.find(c => c.complaint_id === req.params.id);
  if (!c) return res.envelope({ code: 'NOT_FOUND', message: 'Complaint not found' }, 404);
  res.envelope(c);
});

app.get('/v1/taxonomy/diagnoses', (req, res) => {
  let results = DIAGNOSES;
  if (req.query.q) {
    const q = req.query.q.toLowerCase();
    results = results.filter(d => d.name.toLowerCase().includes(q) || d.consumer_synonyms.some(s => s.includes(q)));
  }
  res.envelope({ data: results, pagination: { has_more: false, total_count: results.length } });
});

app.get('/v1/taxonomy/diagnoses/:id', (req, res) => {
  const d = DIAGNOSES.find(d => d.diagnosis_id === req.params.id);
  if (!d) return res.envelope({ code: 'NOT_FOUND', message: 'Diagnosis not found' }, 404);
  res.envelope(d);
});

app.get('/v1/taxonomy/scope-codes', (req, res) => {
  res.envelope({
    data: SCOPE_CODES,
    required_exclusions: SCOPE_CODES.filter(s => s.required_exclusion).map(s => s.code),
  });
});

app.get('/v1/taxonomy/specialties', (req, res) => {
  res.envelope({
    data: [
      { specialty: 'orthopedic', subspecialties: ['knee', 'hip', 'shoulder', 'spine', 'sports_medicine'], hso_count: 847 },
      { specialty: 'primary_care', subspecialties: ['dpc', 'concierge', 'family_medicine', 'internal_medicine'], hso_count: 320 },
      { specialty: 'ophthalmology', subspecialties: ['refractive', 'cataract', 'retina', 'glaucoma'], hso_count: 285 },
    ],
  });
});

// ── HSO Registry ──

const HSOS = [
  { hso_id: 'hso.ortho.knee.eval.new', hso_alias: 'Ortho Knee Eval (New)', name: 'Orthopedic Knee Evaluation — New Patient', specialty: 'orthopedic', subspecialty: 'knee', category: 'evaluation_new', specific: 'knee_eval', scope: { included: ['History and physical', 'X-ray review', 'Treatment plan discussion'], excluded: ['MRI', 'Injections', 'Surgical planning'] }, medicare_exclusion: { excluded: false }, membership_eligible: false, consumer_search_terms: ['knee doctor', 'knee specialist', 'knee pain evaluation'] },
  { hso_id: 'hso.ortho.knee.proc.total_replacement', hso_alias: 'Total Knee Replacement', name: 'Total Knee Replacement', specialty: 'orthopedic', subspecialty: 'knee', category: 'procedure', specific: 'total_replacement', scope: { included: ['Pre-op evaluation', 'Surgical procedure', 'Implant (standard)', 'Anesthesia', 'Recovery', 'First follow-up'], excluded: ['Pre-surgical imaging', 'Physical therapy', 'DME', 'Medications', 'Hospital admission'] }, medicare_exclusion: { excluded: false }, membership_eligible: false, consumer_search_terms: ['knee replacement', 'knee surgery', 'TKA', 'new knee'] },
  { hso_id: 'hso.ortho.knee.proc.arthroscopy', hso_alias: 'Knee Arthroscopy', name: 'Knee Arthroscopy', specialty: 'orthopedic', subspecialty: 'knee', category: 'procedure', specific: 'arthroscopy', scope: { included: ['Surgical procedure', 'Anesthesia', 'Recovery'], excluded: ['Physical therapy', 'Imaging', 'DME'] }, medicare_exclusion: { excluded: false }, membership_eligible: false, consumer_search_terms: ['knee scope', 'knee arthroscopy'] },
];

app.get('/v1/hsos', (req, res) => {
  let results = [...HSOS];
  if (req.query.specialty) results = results.filter(h => h.specialty === req.query.specialty);
  if (req.query.q) {
    const q = req.query.q.toLowerCase();
    results = results.filter(h => h.name.toLowerCase().includes(q) || h.consumer_search_terms.some(t => t.includes(q)));
  }
  res.envelope({ data: results, pagination: { has_more: false, total_count: results.length } });
});

app.get('/v1/hsos/:id', (req, res) => {
  const h = HSOS.find(h => h.hso_id === req.params.id);
  if (!h) return res.envelope({ code: 'NOT_FOUND', message: 'HSO not found' }, 404);
  res.envelope(h);
});

app.get('/v1/hsos/:id/offers', (req, res) => {
  const offers = [...store.offers.values()].filter(o => o.hso_id === req.params.id && o.active);
  res.envelope({ data: offers, pagination: { has_more: false, total_count: offers.length } });
});

// ── Providers ──

app.get('/v1/providers', (req, res) => {
  const providers = [...store.providers.values()];
  res.envelope({ data: providers, pagination: { has_more: false, total_count: providers.length } });
});

app.get('/v1/providers/:id', (req, res) => {
  const p = store.providers.get(req.params.id);
  if (!p) return res.envelope({ code: 'NOT_FOUND', message: 'Provider not found' }, 404);
  res.envelope(p);
});

app.post('/v1/providers', (req, res) => {
  const id = uuid();
  const provider = { provider_id: id, status: 'PENDING', ...req.body, created_at: now() };
  store.providers.set(id, provider);
  res.envelope(provider, 201);
});

app.get('/v1/providers/:id/offers', (req, res) => {
  const offers = [...store.offers.values()].filter(o => o.provider_id === req.params.id);
  res.envelope({ data: offers, pagination: { has_more: false, total_count: offers.length } });
});

// ── Offers ──

app.post('/v1/offers', (req, res) => {
  const prov = store.providers.get(req.body.provider_id);
  if (!prov) return res.envelope({ code: 'VALIDATION_FAILED', message: 'Provider not found' }, 400);
  const id = uuid();
  const offer = {
    offer_id: id,
    provider_id: req.body.provider_id,
    provider_display_name: prov.display_name,
    hso_id: req.body.hso_id,
    hso_name: (HSOS.find(h => h.hso_id === req.body.hso_id) || {}).name || req.body.hso_id,
    location_id: req.body.location_id,
    location: prov.locations.find(l => l.location_id === req.body.location_id) || prov.locations[0],
    price: { amount_cents: req.body.price_cents, currency: 'USD', immutable_once_accepted: true },
    availability: req.body.availability || { next_available: '2026-03-24', slots_this_week: 5 },
    transactability_score: prov.operational_signals?.transactability_score || 80,
    binding_mode: req.body.binding_mode || 'ORGANIZATION_BOUND',
    active: true,
    created_at: now(),
  };
  store.offers.set(id, offer);
  res.envelope(offer, 201);
});

app.get('/v1/offers/:id', (req, res) => {
  const o = store.offers.get(req.params.id);
  if (!o) return res.envelope({ code: 'NOT_FOUND', message: 'Offer not found' }, 404);
  res.envelope(o);
});

app.patch('/v1/offers/:id', (req, res) => {
  const o = store.offers.get(req.params.id);
  if (!o) return res.envelope({ code: 'NOT_FOUND', message: 'Offer not found' }, 404);
  if (req.body.price_cents) o.price.amount_cents = req.body.price_cents;
  if (req.body.active !== undefined) o.active = req.body.active;
  if (req.body.availability) o.availability = req.body.availability;
  res.envelope(o);
});

// ── Patients ──

app.post('/v1/patients', (req, res) => {
  const id = uuid();
  const patient = {
    patient_id: id,
    full_name: req.body.full_name,
    full_name_upper: (req.body.full_name || '').toUpperCase(),
    date_of_birth: req.body.date_of_birth,
    email: req.body.email,
    phone: req.body.phone,
    external_id: req.body.external_id || null,
    created_at: now(),
  };
  store.patients.set(id, patient);
  res.envelope(patient, 201);
});

app.get('/v1/patients/:id', (req, res) => {
  const p = store.patients.get(req.params.id);
  if (!p) return res.envelope({ code: 'NOT_FOUND', message: 'Patient not found' }, 404);
  res.envelope(p);
});

// ── Resolve to Care ──

app.post('/v1/resolve', (req, res) => {
  const { intent_type, intent_id, geo } = req.body;

  // Find matching HSO candidates
  let hsoCandidates = [];
  if (intent_type === 'COMPLAINT') {
    const complaint = COMPLAINTS.find(c => c.complaint_id === intent_id);
    if (complaint) {
      hsoCandidates = complaint.mapped_hso_ids.map(id => {
        const hso = HSOS.find(h => h.hso_id === id);
        return { hso_id: id, hso_label: hso?.name || id, confidence: 0.85, reason_codes: ['MATCH_COMPLAINT'] };
      });
    }
  } else if (intent_type === 'DIAGNOSIS') {
    const dx = DIAGNOSES.find(d => d.diagnosis_id === intent_id);
    if (dx) {
      hsoCandidates = dx.mapped_hso_ids.map(id => {
        const hso = HSOS.find(h => h.hso_id === id);
        return { hso_id: id, hso_label: hso?.name || id, confidence: 0.90, reason_codes: ['MATCH_DIAGNOSIS'] };
      });
    }
  } else if (intent_type === 'REQUESTED_SERVICE') {
    const hso = HSOS.find(h => h.hso_id === intent_id);
    if (hso) hsoCandidates = [{ hso_id: hso.hso_id, hso_label: hso.name, confidence: 1.0, reason_codes: ['DIRECT_MATCH'] }];
  }

  // Find provider candidates with offers
  const providerCandidates = [];
  for (const [offerId, offer] of store.offers) {
    if (hsoCandidates.some(h => h.hso_id === offer.hso_id) && offer.active) {
      providerCandidates.push({
        provider_id: offer.provider_id,
        display_name: offer.provider_display_name,
        offer_id: offer.offer_id,
        availability_summary: offer.availability,
        transactability_score: offer.transactability_score,
        distance_minutes: 12,
        reason_codes: ['LOCAL_CAPACITY', 'HIGH_TRANSACTABILITY'],
      });
    }
  }

  // Cash price from best offer
  const bestOffer = providerCandidates[0] ? store.offers.get(providerCandidates[0].offer_id) : null;
  const resolutionId = uuid();

  res.envelope({
    resolution_id: resolutionId,
    input_hash: 'sha256:' + crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex').substring(0, 16),
    policy_version: 'pricing-2026.03.01',
    consent_tier_used: 'TIER1',
    data_accessed_refs: [],
    hso_candidates: hsoCandidates,
    provider_candidates: providerCandidates,
    pricing: {
      cash_price_cents: bestOffer ? bestOffer.price.amount_cents : 0,
      currency: 'USD',
      pricing_confidence: 'HIGH',
    },
    confirmation_url: `https://app.opendoc.com/confirm/${resolutionId}`,
    required_patient_confirmation: true,
    disclaimer_code: 'NOT_MEDICAL_ADVICE',
  });
});

// ── Health Keys ──

app.get('/v1/health-keys', (req, res) => {
  let keys = [...store.healthKeys.values()];
  if (req.query.patient_id) keys = keys.filter(k => k.patient.patient_id === req.query.patient_id);
  if (req.query.state) {
    const states = Array.isArray(req.query.state) ? req.query.state : [req.query.state];
    keys = keys.filter(k => states.includes(k.state));
  }
  res.envelope({ data: keys, pagination: { has_more: false, total_count: keys.length } });
});

app.post('/v1/health-keys', (req, res) => {
  const offer = store.offers.get(req.body.offer_id);
  if (!offer) return res.envelope({ code: 'VALIDATION_FAILED', message: 'Offer not found' }, 400);
  const patient = store.patients.get(req.body.patient_id);
  if (!patient) return res.envelope({ code: 'VALIDATION_FAILED', message: 'Patient not found' }, 400);

  const hso = HSOS.find(h => h.hso_id === offer.hso_id);
  const id = uuid();

  const healthKey = {
    health_key_id: id,
    health_key_type: 'EPISODIC',
    patient: {
      patient_id: patient.patient_id,
      full_name: patient.full_name_upper,
      date_of_birth: patient.date_of_birth,
    },
    provider: {
      provider_id: offer.provider_id,
      display_name: offer.provider_display_name,
      location: offer.location,
    },
    service: {
      hso_id: offer.hso_id,
      hso_name: offer.hso_name,
      offer_id: offer.offer_id,
      scope: hso?.scope || { included: [], excluded: [] },
    },
    state: 'READY',
    exposure_boundary: {
      max_patient_responsibility_cents: offer.price.amount_cents,
      currency: 'USD',
    },
    funding_state: 'INITIATED',
    service_state: 'S1_SELECTED',
    payment_state: 'P1_AUTHORIZED',
    valid_transitions: ['ACTIVE', 'CANCELLED'],
    scheduled_at: req.body.scheduled_at || null,
    qr_token: `opendoc:hk:${id}:READY`,
    created_at: now(),
    updated_at: now(),
    last_sync_at: now(),
  };

  store.healthKeys.set(id, healthKey);
  store.funding.set(id, {
    health_key_id: id,
    state: 'INITIATED',
    required_upfront_cents: offer.price.amount_cents,
    total_funded_cents: 0,
    remaining_cents: offer.price.amount_cents,
    contributions: [],
  });

  res.envelope(healthKey, 201);
});

app.get('/v1/health-keys/:id', (req, res) => {
  const hk = store.healthKeys.get(req.params.id);
  if (!hk) return res.envelope({ code: 'NOT_FOUND', message: 'Health Key not found' }, 404);
  res.envelope(hk);
});

app.post('/v1/health-keys/:id/authorize', (req, res) => {
  const hk = store.healthKeys.get(req.params.id);
  if (!hk) return res.envelope({ code: 'NOT_FOUND', message: 'Health Key not found' }, 404);
  if (hk.state !== 'READY') return res.envelope({ code: 'INVALID_STATE_TRANSITION', message: `Cannot authorize from ${hk.state}. Must be READY.` }, 409);

  const funding = store.funding.get(req.params.id);
  if (funding && funding.state !== 'FUNDED') return res.envelope({ code: 'VALIDATION_FAILED', message: 'Health Key cannot authorize until funding_state = FUNDED' }, 400);

  hk.state = 'ACTIVE';
  hk.service_state = 'S2_SCHEDULED';
  hk.payment_state = 'P2_ESCROWED';
  hk.funding_state = 'LOCKED';
  hk.valid_transitions = ['COMPLETED', 'DECISION_REQUIRED', 'NOT_AUTHORIZED', 'CANCELLED'];
  hk.qr_token = `opendoc:hk:${hk.health_key_id}:ACTIVE`;
  hk.updated_at = now();

  if (funding) funding.state = 'LOCKED';

  res.envelope(hk);
});

app.post('/v1/health-keys/:id/complete', (req, res) => {
  const hk = store.healthKeys.get(req.params.id);
  if (!hk) return res.envelope({ code: 'NOT_FOUND', message: 'Health Key not found' }, 404);
  if (hk.state !== 'ACTIVE') return res.envelope({ code: 'INVALID_STATE_TRANSITION', message: `Cannot complete from ${hk.state}. Must be ACTIVE.` }, 409);

  const posTier = req.body.pos_tier || 1;
  hk.state = 'COMPLETED';
  hk.service_state = 'S6_POS_CONFIRMED';
  hk.payment_state = 'P4_RELEASED';
  hk.valid_transitions = ['SETTLED'];
  hk.updated_at = now();

  const funding = store.funding.get(req.params.id);
  if (funding) funding.state = 'SERVICE_COMPLETED';

  // Create settlement
  store.settlements.set(hk.health_key_id, {
    health_key_id: hk.health_key_id,
    payment_state: 'P4_RELEASED',
    service_state: 'S6_POS_CONFIRMED',
    escrow: { total_escrowed_cents: hk.exposure_boundary.max_patient_responsibility_cents, created_at: hk.created_at },
    release: { released_cents: hk.exposure_boundary.max_patient_responsibility_cents, released_at: now(), pos_tier: posTier },
    dispute_window: { opens_at: now(), closes_at: new Date(Date.now() + 7 * 86400000).toISOString(), is_open: true },
    finality: { finalized_at: null, is_final: false },
  });

  res.envelope(hk);
});

app.post('/v1/health-keys/:id/cancel', (req, res) => {
  const hk = store.healthKeys.get(req.params.id);
  if (!hk) return res.envelope({ code: 'NOT_FOUND', message: 'Health Key not found' }, 404);
  if (['COMPLETED', 'SETTLED', 'CANCELLED'].includes(hk.state)) {
    return res.envelope({ code: 'INVALID_STATE_TRANSITION', message: `Cannot cancel from ${hk.state}` }, 409);
  }

  hk.state = 'CANCELLED';
  hk.valid_transitions = [];
  hk.updated_at = now();

  const funding = store.funding.get(req.params.id);
  if (funding) funding.state = 'CANCELLED';

  res.envelope(hk);
});

app.get('/v1/health-keys/:id/qr', (req, res) => {
  const hk = store.healthKeys.get(req.params.id);
  if (!hk) return res.envelope({ code: 'NOT_FOUND', message: 'Health Key not found' }, 404);

  res.envelope({
    health_key_id: hk.health_key_id,
    patient_token: 'pt_' + crypto.createHash('sha256').update(hk.patient.patient_id).digest('hex').substring(0, 12),
    provider_id: hk.provider.provider_id,
    hso_id: hk.service.hso_id,
    state: hk.state,
    scope_hash: crypto.createHash('sha256').update(JSON.stringify(hk.service.scope)).digest('hex').substring(0, 16),
    signature: 'sig_' + crypto.randomBytes(32).toString('hex'),
    issued_at: now(),
    expires_at: new Date(Date.now() + 24 * 3600000).toISOString(),
    offline_valid_until: new Date(Date.now() + 4 * 3600000).toISOString(),
    last_sync_at: hk.last_sync_at,
  });
});

app.post('/v1/scan', (req, res) => {
  // Parse QR token to find Health Key
  const token = req.body.qr_token || '';
  const parts = token.split(':');
  const hkId = parts[2]; // opendoc:hk:{id}:{state}
  const hk = store.healthKeys.get(hkId);

  if (!hk) {
    return res.envelope({
      valid: false,
      health_key: null,
      scan_timestamp: now(),
      verification_mode: 'ONLINE',
      verification_status: 'INVALID_SIGNATURE',
    });
  }

  const statusMap = {
    ACTIVE: 'VERIFIED_ACTIVE',
    DECISION_REQUIRED: 'VERIFIED_DECISION_REQUIRED',
    NOT_AUTHORIZED: 'NOT_AUTHORIZED',
  };

  res.envelope({
    valid: hk.state === 'ACTIVE',
    health_key: hk,
    scan_timestamp: now(),
    verification_mode: 'ONLINE',
    verification_status: statusMap[hk.state] || 'EXPIRED',
  });
});

// ── Funding ──

app.get('/v1/health-keys/:id/funding', (req, res) => {
  const f = store.funding.get(req.params.id);
  if (!f) return res.envelope({ code: 'NOT_FOUND', message: 'Funding not found' }, 404);
  res.envelope(f);
});

app.post('/v1/health-keys/:id/funding', (req, res) => {
  const f = store.funding.get(req.params.id);
  if (!f) return res.envelope({ code: 'NOT_FOUND', message: 'Health Key not found' }, 404);
  if (['LOCKED', 'SETTLED', 'CANCELLED'].includes(f.state)) {
    return res.envelope({ code: 'INVALID_STATE_TRANSITION', message: 'Cannot add funding in current state' }, 400);
  }

  const contribution = {
    contribution_id: uuid(),
    source_type: req.body.source_type,
    amount_cents: req.body.amount_cents,
    escrow_status: 'ESCROWED',
    refund_amount_cents: null,
    funder_display_name: req.body.funder_display_name || null,
    created_at: now(),
  };

  f.contributions.push(contribution);
  f.total_funded_cents += contribution.amount_cents;
  f.remaining_cents = Math.max(0, f.required_upfront_cents - f.total_funded_cents);

  if (f.total_funded_cents >= f.required_upfront_cents) {
    f.state = 'FUNDED';
  } else {
    f.state = 'FUNDING_IN_PROGRESS';
  }

  res.envelope(f, 201);
});

// ── Settlement ──

app.get('/v1/health-keys/:id/settlement', (req, res) => {
  const s = store.settlements.get(req.params.id);
  if (!s) return res.envelope({ code: 'NOT_FOUND', message: 'No settlement for this Health Key' }, 404);
  res.envelope(s);
});

// ── Webhooks ──

app.get('/v1/webhooks', (req, res) => {
  res.envelope({ webhooks: [...store.webhooks.values()] });
});

app.post('/v1/webhooks', (req, res) => {
  const id = uuid();
  const webhook = {
    webhook_id: id,
    url: req.body.url,
    events: req.body.events,
    secret: 'whsec_' + crypto.randomBytes(24).toString('hex'),
    status: 'ACTIVE',
    created_at: now(),
  };
  store.webhooks.set(id, webhook);
  res.envelope(webhook, 201);
});

// ── Platform ──

app.post('/v1/clients', (req, res) => {
  const id = uuid();
  const client = {
    client_id: id,
    client_secret: 'sk_sandbox_' + crypto.randomBytes(16).toString('hex'),
    name: req.body.name,
    tier: 'SANDBOX',
    rate_limits: { requests_per_minute: 60, daily_tier2_budget: 1000 },
    created_at: now(),
  };
  store.clients.set(id, client);
  res.envelope(client, 201);
});

app.get('/v1/clients/me', (req, res) => {
  const first = [...store.clients.values()][0];
  res.envelope({ client_id: first.client_id, name: first.name, tier: first.tier, created_at: first.created_at });
});

app.get('/v1/clients/me/usage', (req, res) => {
  res.envelope({
    period: req.query.period || 'this_month',
    total_requests: 0,
    requests_by_endpoint: {},
    health_keys_created: store.healthKeys.size,
    transactions_settled: store.settlements.size,
    resolve_calls: 0,
  });
});

// ── Start ──

seed();

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
  console.log(`  OpenDoc Sandbox API running at http://localhost:${PORT}/v1`);
  console.log(`  Try: curl http://localhost:${PORT}/v1/taxonomy/complaints?q=knee`);
  console.log(`  Docs: http://localhost:${PORT}/v1/hsos`);
  console.log();
});
