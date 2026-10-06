import { StandardTextList } from "./StandardTextList";

interface StandardTextPickerProps {
  onInsert: (text: string) => void;
}

export function StandardTextPicker({ onInsert }: StandardTextPickerProps) {
  return (
    <div className="h-80">
      <StandardTextList onInsert={onInsert} />
    </div>
  );
}
