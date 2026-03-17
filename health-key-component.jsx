import { useState } from "react";

// ── QR Code Generator (self-contained, no external deps) ──
function generateQRMatrix(data) {
  // Simplified QR-like matrix for demo. In production, use a proper QR library.
  const size = 25;
  const matrix = [];
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  }
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      // Finder patterns (top-left, top-right, bottom-left)
      const inFinderTL = x < 7 && y < 7;
      const inFinderTR = x >= size - 7 && y < 7;
      const inFinderBL = x < 7 && y >= size - 7;
      if (inFinderTL || inFinderTR || inFinderBL) {
        const fx = inFinderTR ? x - (size - 7) : x;
        const fy = inFinderBL ? y - (size - 7) : y;
        const border = fx === 0 || fx === 6 || fy === 0 || fy === 6;
        const inner = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4;
        row.push(border || inner ? 1 : 0);
      } else {
        const seed = (hash + x * 31 + y * 17 + x * y * 7) & 0xffffffff;
        row.push(((seed >> (x % 16)) & 1) ^ ((seed >> (y % 8)) & 1));
      }
    }
    matrix.push(row);
  }
  return matrix;
}

function QRCode({ data, size = 140, state }) {
  const matrix = generateQRMatrix(data);
  const cellSize = size / matrix.length;
  const notAuthorized = state === "NOT_AUTHORIZED";

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect width={size} height={size} fill="white" rx="4" />
        {matrix.map((row, y) =>
          row.map((cell, x) =>
            cell ? (
              <rect
                key={`${x}-${y}`}
                x={x * cellSize + 0.5}
                y={y * cellSize + 0.5}
                width={cellSize - 0.3}
                height={cellSize - 0.3}
                fill={notAuthorized ? "#ccc" : "#1A1A1A"}
                rx={0.5}
              />
            ) : null
          )
        )}
      </svg>
      {notAuthorized && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 60 60">
            <line x1="8" y1="8" x2="52" y2="52" stroke="#DC2626" strokeWidth="5" strokeLinecap="round" />
            <line x1="52" y1="8" x2="8" y2="52" stroke="#DC2626" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ── State color system (from PRD §6) ──
const STATE_CONFIG = {
  ACTIVE: {
    color: "#2D6A4F",
    bg: "#D8F3DC",
    border: "#2D6A4F",
    label: "ACTIVE",
    priceBg: "rgba(45,106,79,0.06)",
  },
  DECISION_REQUIRED: {
    color: "#92400E",
    bg: "#FEF3C7",
    border: "#D97706",
    label: "DECISION REQUIRED",
    priceBg: "rgba(217,119,6,0.06)",
  },
  NOT_AUTHORIZED: {
    color: "#991B1B",
    bg: "#FEE2E2",
    border: "#DC2626",
    label: "NOT AUTHORIZED",
    priceBg: "rgba(220,38,38,0.06)",
  },
};

// ── Format currency ──
function formatCurrency(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return dateStr;
}

// ── The Health Key Component ──
function HealthKeyCard({ healthKey, onReveal }) {
  const [revealPanel, setRevealPanel] = useState(null);
  const sc = STATE_CONFIG[healthKey.state] || STATE_CONFIG.ACTIVE;
  const showQR = healthKey.state !== "NOT_AUTHORIZED";

  return (
    <div
      style={{
        width: 360,
        margin: "0 auto",
        background: "#FFFFFF",
        borderRadius: 16,
        border: `2px solid ${sc.border}`,
        overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        position: "relative",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* ── State Banner (§5.4) ── */}
      <div
        style={{
          background: sc.bg,
          color: sc.color,
          textAlign: "center",
          padding: "10px 16px",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 1.2,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {sc.label}
      </div>

      <div style={{ padding: "20px 24px 24px" }}>
        {/* ── Identity Block (§5.1) ── */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: 2,
              color: "#1A1A1A",
              lineHeight: 1.3,
            }}
          >
            {healthKey.patient.full_name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#777",
              marginTop: 3,
              fontFamily: "-apple-system, sans-serif",
            }}
          >
            DOB: {formatDate(healthKey.patient.date_of_birth)}
          </div>
        </div>

        {/* ── Thin divider ── */}
        <div
          style={{
            height: 1,
            background: "#E8E6E2",
            margin: "0 -24px 16px",
          }}
        />

        {/* ── Transaction Authority Block (§5.2) ── */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>
            PROVIDER
          </div>
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 14,
              fontWeight: 600,
              color: "#333",
            }}
          >
            {healthKey.provider.display_name}
          </div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 10, marginBottom: 2 }}>
            SERVICE
          </div>
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 14,
              fontWeight: 600,
              color: "#333",
            }}
          >
            {healthKey.service.hso_name}
          </div>
        </div>

        {/* ── Exposure Boundary Block (§5.3) — LARGEST TEXT ── */}
        <div
          style={{
            textAlign: "center",
            padding: "16px 0",
            margin: "8px -24px",
            background: sc.priceBg,
          }}
        >
          <div style={{ fontSize: 10, color: "#888", letterSpacing: 0.5, marginBottom: 4 }}>
            MAXIMUM PATIENT RESPONSIBILITY
          </div>
          <div
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 42,
              fontWeight: 700,
              color: sc.color,
              lineHeight: 1.1,
              letterSpacing: -0.5,
            }}
          >
            {formatCurrency(healthKey.exposure_boundary.max_patient_responsibility_cents)}
          </div>
        </div>

        {/* ── QR Code (§5.5) ── */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <QRCode
            data={`opendoc:hk:${healthKey.health_key_id}:${healthKey.state}`}
            size={140}
            state={healthKey.state}
          />
          {healthKey.state === "NOT_AUTHORIZED" && (
            <div style={{ fontSize: 11, color: "#991B1B", marginTop: 6, fontWeight: 600 }}>
              QR AUTHORIZATION REVOKED
            </div>
          )}
        </div>

        {/* ── Reveal Controls (§5.6) ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginTop: 16,
          }}
        >
          {["Included", "Excluded", "If this changes"].map((label) => (
            <button
              key={label}
              onClick={() => setRevealPanel(revealPanel === label ? null : label)}
              style={{
                background: revealPanel === label ? "#F0EFEC" : "transparent",
                border: "1px solid #E0DEDA",
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: 11,
                color: "#666",
                cursor: "pointer",
                fontFamily: "-apple-system, sans-serif",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Reveal Panel ── */}
        {revealPanel && (
          <div
            style={{
              marginTop: 10,
              padding: 14,
              background: "#FAFAF8",
              borderRadius: 8,
              fontSize: 12,
              color: "#555",
              lineHeight: 1.7,
              border: "1px solid #EFEDE9",
            }}
          >
            {revealPanel === "Included" && (
              <div>
                <div style={{ fontWeight: 700, color: "#333", marginBottom: 4 }}>
                  What is included
                </div>
                {(healthKey.service.scope?.included || []).map((item, i) => (
                  <div key={i}>· {item}</div>
                ))}
                {(!healthKey.service.scope?.included?.length) && (
                  <div style={{ color: "#999" }}>No inclusion details available.</div>
                )}
              </div>
            )}
            {revealPanel === "Excluded" && (
              <div>
                <div style={{ fontWeight: 700, color: "#333", marginBottom: 4 }}>
                  What is excluded
                </div>
                {(healthKey.service.scope?.excluded || []).map((item, i) => (
                  <div key={i}>· {item}</div>
                ))}
              </div>
            )}
            {revealPanel === "If this changes" && (
              <div>
                <div style={{ fontWeight: 700, color: "#333", marginBottom: 4 }}>
                  What happens if this changes
                </div>
                <div>
                  If the scope or price of this service changes after authorization,
                  your Health Key state will transition to DECISION REQUIRED. You will
                  need to re-authorize before care can proceed. Your maximum exposure
                  will not increase without your explicit consent.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Offline / sync indicator ── */}
        <div
          style={{
            textAlign: "center",
            marginTop: 14,
            fontSize: 10,
            color: "#BBB",
            fontFamily: "SFMono-Regular, 'Source Code Pro', monospace",
          }}
        >
          {healthKey.last_sync_at
            ? `Last sync: ${healthKey.last_sync_at}`
            : "OFFLINE — AUTHORIZATION VALID"}
        </div>
      </div>
    </div>
  );
}

// ── Demo Harness ──
const DEMO_KEYS = {
  ACTIVE: {
    health_key_id: "a8b3e2f1-3e4b-4f3b-9ef9-8c0f3d46b902",
    health_key_type: "EPISODIC",
    patient: {
      patient_id: "0c9a2c52-5c39-4b0c-8e7a-1b6a4f2c9e1d",
      full_name: "JAMES A. MARTINEZ",
      date_of_birth: "1988-03-14",
    },
    provider: {
      provider_id: "prov-456",
      display_name: "Total Joint Specialists",
      location: { name: "Canton Surgery Center", address: { city: "Canton", state: "GA" } },
    },
    service: {
      hso_id: "hso.ortho.knee.proc.total_replacement",
      hso_name: "Total Knee Replacement",
      offer_id: "offer-789",
      scope: {
        included: [
          "Pre-operative evaluation",
          "Surgical procedure (total knee arthroplasty)",
          "Implant (standard cemented)",
          "Anesthesia (spinal or general)",
          "Post-anesthesia recovery",
          "Same-day discharge coordination",
          "First post-operative follow-up visit",
        ],
        excluded: [
          "Pre-surgical imaging (MRI, X-ray)",
          "Physical therapy (separate HSO)",
          "Durable medical equipment",
          "Prescription medications post-discharge",
          "Hospital admission if complications require overnight stay",
        ],
      },
    },
    state: "ACTIVE",
    exposure_boundary: {
      max_patient_responsibility_cents: 1895000,
      currency: "USD",
    },
    last_sync_at: "2026-03-17T14:32:08Z",
  },
  DECISION_REQUIRED: {
    health_key_id: "b7c4d3e2-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
    health_key_type: "EPISODIC",
    patient: {
      patient_id: "1d2e3f4a-5b6c-7d8e-9f0a-1b2c3d4e5f6a",
      full_name: "SARAH L. THOMPSON",
      date_of_birth: "1975-09-22",
    },
    provider: {
      provider_id: "prov-123",
      display_name: "Advanced Center for Joint Replacement",
      location: { name: "Sandy Springs", address: { city: "Sandy Springs", state: "GA" } },
    },
    service: {
      hso_id: "hso.ortho.hip.proc.total_replacement",
      hso_name: "Total Hip Replacement",
      offer_id: "offer-456",
      scope: {
        included: [
          "Pre-operative evaluation",
          "Surgical procedure (total hip arthroplasty)",
          "Implant (standard uncemented)",
          "Anesthesia",
          "Post-anesthesia recovery",
          "Same-day discharge coordination",
        ],
        excluded: [
          "Pre-surgical imaging",
          "Physical therapy",
          "Durable medical equipment",
          "Prescription medications",
        ],
      },
    },
    state: "DECISION_REQUIRED",
    exposure_boundary: {
      max_patient_responsibility_cents: 2245000,
      currency: "USD",
    },
    last_sync_at: "2026-03-17T09:15:22Z",
  },
  NOT_AUTHORIZED: {
    health_key_id: "c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
    health_key_type: "MEMBERSHIP",
    patient: {
      patient_id: "2e3f4a5b-6c7d-8e9f-0a1b-2c3d4e5f6a7b",
      full_name: "ROBERT K. CHEN",
      date_of_birth: "1962-11-05",
    },
    provider: {
      provider_id: "prov-789",
      display_name: "Peachtree Direct Primary Care",
      location: { name: "Canton Office", address: { city: "Canton", state: "GA" } },
    },
    service: {
      hso_id: "hso.dpc.primary.membership.t1",
      hso_name: "Core Primary Care Membership (T1)",
      offer_id: "offer-101",
      scope: {
        included: ["Office visits (unlimited)", "Telehealth", "Chronic disease management", "Basic procedures"],
        excluded: ["Hospital/ED care", "Advanced imaging (CT/MRI/PET)", "Procedures requiring general anesthesia"],
      },
    },
    state: "NOT_AUTHORIZED",
    exposure_boundary: {
      max_patient_responsibility_cents: 0,
      currency: "USD",
    },
    last_sync_at: null,
  },
};

export default function HealthKeyDemo() {
  const [activeState, setActiveState] = useState("ACTIVE");
  const healthKey = DEMO_KEYS[activeState];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F4F1",
        padding: "32px 16px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* ── Header ── */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 14,
            fontWeight: 700,
            color: "#2D6A4F",
            letterSpacing: 1,
            marginBottom: 4,
          }}
        >
          OPENDOC
        </div>
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 22,
            fontWeight: 700,
            color: "#1A1A1A",
            letterSpacing: -0.3,
          }}
        >
          Health Key — Embeddable Component
        </div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
          Reference implementation for platform partners
        </div>
      </div>

      {/* ── State Selector ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          marginBottom: 28,
        }}
      >
        {Object.keys(STATE_CONFIG).map((state) => {
          const sc = STATE_CONFIG[state];
          const isActive = activeState === state;
          return (
            <button
              key={state}
              onClick={() => setActiveState(state)}
              style={{
                background: isActive ? sc.bg : "white",
                border: `1.5px solid ${isActive ? sc.border : "#ddd"}`,
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 11,
                fontWeight: 700,
                color: isActive ? sc.color : "#888",
                cursor: "pointer",
                letterSpacing: 0.5,
                transition: "all 0.15s",
                fontFamily: "-apple-system, sans-serif",
              }}
            >
              {sc.label}
            </button>
          );
        })}
      </div>

      {/* ── The Health Key ── */}
      <HealthKeyCard healthKey={healthKey} />

      {/* ── Integration code hint ── */}
      <div
        style={{
          maxWidth: 360,
          margin: "28px auto 0",
          background: "#1E2A24",
          borderRadius: 10,
          padding: "16px 20px",
          fontFamily: "SFMono-Regular, 'Source Code Pro', Consolas, monospace",
          fontSize: 11,
          lineHeight: 1.9,
          color: "#8FBFA8",
          overflow: "auto",
        }}
      >
        <div style={{ color: "#5A7A6A", marginBottom: 4 }}>
          {"// Platform partner integration"}
        </div>
        <div>
          <span style={{ color: "#D2A8FF" }}>import</span>{" "}
          <span style={{ color: "#C9D1D9" }}>{"{ HealthKey }"}</span>{" "}
          <span style={{ color: "#D2A8FF" }}>from</span>{" "}
          <span style={{ color: "#A5D6FF" }}>'@opendoc/health-key'</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <span style={{ color: "#C9D1D9" }}>{"<"}</span>
          <span style={{ color: "#7EE787" }}>HealthKey</span>
        </div>
        <div style={{ paddingLeft: 16 }}>
          <span style={{ color: "#79C0FF" }}>healthKeyId</span>
          <span style={{ color: "#C9D1D9" }}>=</span>
          <span style={{ color: "#A5D6FF" }}>
            {`"${healthKey.health_key_id.substring(0, 8)}..."`}
          </span>
        </div>
        <div style={{ paddingLeft: 16 }}>
          <span style={{ color: "#79C0FF" }}>apiKey</span>
          <span style={{ color: "#C9D1D9" }}>=</span>
          <span style={{ color: "#A5D6FF" }}>{`"{your_client_key}"`}</span>
        </div>
        <div>
          <span style={{ color: "#C9D1D9" }}>{"/>"}</span>
        </div>
      </div>

      {/* ── PRD compliance notes ── */}
      <div
        style={{
          maxWidth: 360,
          margin: "20px auto 0",
          fontSize: 11,
          color: "#AAA",
          lineHeight: 1.6,
          textAlign: "center",
        }}
      >
        Canonical Transaction Screen PRD v1 compliant.
        No tabs. No navigation. No scrolling in default state.
        Presented, not navigated.
      </div>
    </div>
  );
}
