interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  { name: "Varsity Red", hex: "#E63946" },
  { name: "Electric Blue", hex: "#1D3557" },
  { name: "Royal Cyan", hex: "#457B9D" },
  { name: "Mint Foam", hex: "#A8DADC" },
  { name: "Volt Green", hex: "#10B981" },
  { name: "Solar Amber", hex: "#F59E0B" },
  { name: "Cyber Purple", hex: "#8B5CF6" },
  { name: "Blush Pink", hex: "#EC4899" },
  { name: "Matte Black", hex: "#111827" },
  { name: "Pure White", hex: "#FFFFFF" },
  { name: "Sail Cream", hex: "#F1EBE1" },
  { name: "Wolf Grey", hex: "#6B7280" },
];

export default function ColorPicker({
  label,
  value,
  onChange,
}: ColorPickerProps) {
  return (
    <div className="color-picker-widget" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              backgroundColor: value,
              border: "1.5px solid #cbd5e1",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: "monospace", color: "#0f172a" }}>
            {value.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Preset Swatches */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "8px",
        }}
      >
        {PRESET_COLORS.map((color) => (
          <button
            key={color.hex}
            type="button"
            title={color.name}
            onClick={() => onChange(color.hex)}
            style={{
              width: "100%",
              aspectRatio: "1",
              borderRadius: "8px",
              backgroundColor: color.hex,
              border:
                value.toLowerCase() === color.hex.toLowerCase()
                  ? "2.5px solid #4f46e5"
                  : "1.5px solid #e2e8f0",
              boxShadow:
                value.toLowerCase() === color.hex.toLowerCase()
                  ? "0 0 0 2px rgba(79, 70, 229, 0.25)"
                  : "0 1px 2px rgba(0,0,0,0.06)",
              cursor: "pointer",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        ))}
      </div>

      {/* Custom Color Native Picker */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginTop: "4px",
          background: "#f8fafc",
          padding: "8px 12px",
          borderRadius: "10px",
          border: "1.5px solid #e2e8f0",
        }}
      >
        <input
          type="color"
          id="custom-color-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          style={{
            width: "32px",
            height: "32px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            background: "none",
            padding: 0,
          }}
        />
        <label
          htmlFor="custom-color-input"
          style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155", cursor: "pointer", flex: 1 }}
        >
          Custom Hex Color
        </label>
      </div>
    </div>
  );
}