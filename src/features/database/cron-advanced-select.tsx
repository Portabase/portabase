import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { isValidCronPart } from "@/utils/cron";

export const AdvancedCronSelect = ({
    id,
    label,
    options,
    type,
    value,
    defaultValue,
    onValueChange,
}: {
    id: string;
    label: string;
    options: string[];
    type: string;
    value: string;
    defaultValue: string;
    onValueChange: (value: string) => void;
}) => {
    const [isAdvanced, setIsAdvanced] = useState(false);
    const [customValue, setCustomValue] = useState(defaultValue || value);
    const [error, setError] = useState<string | null>(null);

    const handleBlur = () => {
        if (customValue.trim() === "") {
            setIsAdvanced(false);
        } else if (!isValidCronPart(type, customValue)) {
            setError("Invalid cron part value.");
        } else {
            setError(null);
            onValueChange(customValue);
        }
    };

    return (
        <div className="grid grid-cols-2 items-center gap-2">
            <Label htmlFor={id} className="text-left">
                {label}
            </Label>
            {!isAdvanced ? (
                <Select
                    // @ts-ignore
                    id={id}
                    className="col-span-4"
                    value={defaultValue}
                    onValueChange={(value: string) => {
                        if (value === "advanced") {
                            setIsAdvanced(true);
                        } else {
                            setCustomValue(value);
                            onValueChange(value);
                        }
                    }}
                >
                    <SelectTrigger>
                        <SelectValue>
                            {value}
                            {/*{options.includes(value) ? value : "Custom value"}*/}
                        </SelectValue>
                        {/*<SelectValue placeholder="Select value" />*/}
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((opt: string) => (
                            <SelectItem key={opt} value={opt}>
                                {opt}
                            </SelectItem>
                        ))}
                        <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                </Select>
            ) : (
                <Input
                    id={id}
                    className="col-span-4"
                    type="text"
                    value={customValue}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        setCustomValue(newValue);
                        if (isValidCronPart(type, newValue)) {
                            setError(null);
                        } else {
                            setError("Invalid cron part value.");
                        }
                    }}
                    onBlur={handleBlur}
                    placeholder="e.g., *, 1-5, */5"
                />
            )}
            {error && <p className="text-sm text-red-500 col-span-4">{error}</p>}
        </div>
    );
};
