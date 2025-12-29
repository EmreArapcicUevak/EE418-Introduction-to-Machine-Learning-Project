import { Platform } from "react-native";

type SelectPickerProps = {
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: { label: string; value: string }[];
  style?: any;
};

export function SelectPicker({
  selectedValue,
  onValueChange,
  items,
  style,
}: SelectPickerProps) {
  if (Platform.OS === "web") {
    return (
      <select
        value={selectedValue}
        onChange={(e) => onValueChange((e.target as HTMLSelectElement).value)}
        style={{
          width: "100%",
          height: 50,
          fontSize: 16,
          border: "none",
          backgroundColor: "transparent",
          ...style,
        }}
      >
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    );
  }

  // Native platforms
  const { Picker } = require("@react-native-picker/picker");
  return (
    <Picker selectedValue={selectedValue} onValueChange={onValueChange} style={style}>
      {items.map((item: any) => (
        <Picker.Item key={item.value} label={item.label} value={item.value} />
      ))}
    </Picker>
  );
}
