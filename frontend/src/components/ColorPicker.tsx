interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

function ColorPicker({
  label,
  value,
  onChange,
}: ColorPickerProps) {
  return (
    <div>
      <label>
        {label}

        <input
          type="color"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
        />
      </label>

      <span>{value}</span>
    </div>
  );
}

export default ColorPicker;