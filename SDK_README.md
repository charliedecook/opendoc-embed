# OpenDoc Platform SDKs

Healthcare transaction infrastructure. Resolve intent to bounded, pre-priced healthcare transactions.

**API Version:** 1.1.0 | **Spec:** [opendoc-api-v1.1.yaml](./opendoc-api-v1.1.yaml) | **Docs:** [opendoc-api-docs.html](./opendoc-api-docs.html)

---

## Installation

```bash
# Python (zero dependencies — stdlib only)
pip install opendoc

# Node.js (zero dependencies)
npm install @opendoc/sdk

# Ruby (zero dependencies)
gem install opendoc
```

---

## Quickstart: Full Transaction in 10 Calls

### Python

```python
from opendoc import OpenDoc

client = OpenDoc("sk_sandbox_your_key_here")

# 1. Search symptoms
complaints = client.taxonomy.list_complaints(q="knee pain")
print(complaints.data[0].complaint_id)  # complaint.knee_pain

# 2. Resolve to care — returns cash-priced HSO and provider candidates
resolution = client.resolve.to_care(
    intent_type="COMPLAINT",
    intent_id="complaint.knee_pain",
    geo={"postal_code": "30114"},
)
offer_id = resolution.provider_candidates[0].offer_id
print(f"Cash price: ${resolution.pricing.cash_price_cents / 100:.2f}")

# 3. Create patient
patient = client.patients.create(
    full_name="James Martinez",
    date_of_birth="1988-03-14",
)

# 4. Create Health Key (READY state)
hk = client.health_keys.create(
    patient_id=patient.patient_id,
    offer_id=offer_id,
    resolution_id=resolution.resolution_id,
)

# 5. Fund the Health Key
client.funding.add(
    hk.health_key_id,
    source_type="PATIENT",
    amount_cents=hk.exposure_boundary.max_patient_responsibility_cents,
    payment_method_token="tok_visa",
)

# 6. Authorize (READY → ACTIVE)
hk = client.health_keys.authorize(hk.health_key_id)
assert hk.state == "ACTIVE"

# 7. Get QR for front desk scanning
qr = client.health_keys.get_qr(hk.health_key_id)

# 8. Scan (the boarding-pass moment)
scan = client.health_keys.scan(hk.qr_token)
assert scan.verification_status == "VERIFIED_ACTIVE"

# 9. Complete (Proof of Service)
hk = client.health_keys.complete(
    hk.health_key_id,
    pos_type="EMR_PLUS_ARTIFACT",
    pos_tier=3,
)

# 10. Check settlement
settlement = client.settlement.get(hk.health_key_id)
print(f"Released: ${settlement.release.released_cents / 100:.2f}")
```

### Node.js

```javascript
const { OpenDoc } = require('@opendoc/sdk');

const client = new OpenDoc('sk_sandbox_your_key_here');

// 1. Search symptoms
const complaints = await client.taxonomy.listComplaints({ q: 'knee pain' });

// 2. Resolve to care
const resolution = await client.resolve.toCare({
  intent_type: 'COMPLAINT',
  intent_id: 'complaint.knee_pain',
  geo: { postal_code: '30114' },
});

// 3. Create patient
const patient = await client.patients.create({
  full_name: 'James Martinez',
  date_of_birth: '1988-03-14',
});

// 4. Create Health Key
let hk = await client.healthKeys.create({
  patient_id: patient.patient_id,
  offer_id: resolution.provider_candidates[0].offer_id,
});

// 5. Fund
await client.funding.add(hk.health_key_id, {
  source_type: 'PATIENT',
  amount_cents: hk.exposure_boundary.max_patient_responsibility_cents,
  payment_method_token: 'tok_visa',
});

// 6. Authorize
hk = await client.healthKeys.authorize(hk.health_key_id);

// 7-8. QR + Scan
const scan = await client.healthKeys.scan(hk.qr_token);
console.log(scan.verification_status); // VERIFIED_ACTIVE

// 9. Complete
hk = await client.healthKeys.complete(hk.health_key_id, {
  pos_type: 'EMR_PLUS_ARTIFACT', pos_tier: 3,
});

// 10. Settlement
const settlement = await client.settlement.get(hk.health_key_id);
```

### Ruby

```ruby
require "opendoc"

client = OpenDoc::Client.new(api_key: "sk_sandbox_your_key_here")

# 1. Search symptoms
complaints = client.taxonomy.list_complaints(q: "knee pain")

# 2. Resolve to care
resolution = client.resolve.to_care(
  intent_type: "COMPLAINT",
  intent_id: "complaint.knee_pain",
  geo: { postal_code: "30114" }
)

# 3. Create patient
patient = client.patients.create(
  full_name: "James Martinez",
  date_of_birth: "1988-03-14"
)

# 4. Create Health Key
hk = client.health_keys.create(
  patient_id: patient["patient_id"],
  offer_id: resolution.dig("provider_candidates", 0, "offer_id")
)

# 5. Fund
client.funding.add(hk["health_key_id"],
  source_type: "PATIENT",
  amount_cents: hk.dig("exposure_boundary", "max_patient_responsibility_cents"),
  payment_method_token: "tok_visa"
)

# 6. Authorize
hk = client.health_keys.authorize(hk["health_key_id"])

# 7-8. QR + Scan
scan = client.health_keys.scan(hk["qr_token"])

# 9. Complete
hk = client.health_keys.complete(hk["health_key_id"],
  pos_type: "EMR_PLUS_ARTIFACT", pos_tier: 3
)

# 10. Settlement
settlement = client.settlement.get(hk["health_key_id"])
```

---

## Key Concepts

| Concept | Description |
|---------|-------------|
| **HSO** | Health Service Object — atomic unit binding service, scope, price |
| **Offer** | Provider × HSO × Location × Cash Price |
| **Health Key** | Patient transaction credential. States: READY → ACTIVE → COMPLETED → SETTLED |
| **resolve_to_care** | Clinical routing: intent → HSO candidates + providers + cash pricing |
| **Funding** | Multi-source escrow: PATIENT, INDIVIDUAL, CHARITY, EMPLOYER, BNPL |
| **Proof of Service** | Completion attestation. Triggers immediate settlement. |

## Cash Price Invariant

Every price on this platform is a cash price. Every price is final at acceptance. Insurance cannot exist inside the transaction loop. This is not a preference — it is a mathematical necessity.

## Error Handling

All SDKs provide typed exceptions:

| Error | HTTP | When |
|-------|------|------|
| `AuthenticationError` | 401 | Invalid API key |
| `NotFoundError` | 404 | Resource doesn't exist |
| `InvalidStateTransitionError` | 409 | e.g., authorize a COMPLETED Health Key |
| `ConsentRequiredError` | 403 | Higher consent tier needed |
| `RateLimitError` | 429 | Rate limit exceeded (includes `retry_after`) |
| `ValidationError` | 400 | Invalid input |

## Sandbox

```bash
# Start the sandbox server
npm install express
node sandbox-server.js
# → http://localhost:3100/v1

# Run the full flow
curl http://localhost:3100/v1/taxonomy/complaints?q=knee
```

All sandbox API keys start with `sk_sandbox_`. The SDK auto-detects sandbox vs production from the key prefix.
