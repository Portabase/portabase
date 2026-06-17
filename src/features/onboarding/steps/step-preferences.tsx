"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Check, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

export const StepPreferences = () => {
    const { next, updateContext, state } = useOnboarding();
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(undefined);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file.");
            return;
        }
        if (file.size > MAX_AVATAR_SIZE_BYTES) {
            toast.error("Image is too large. Please select a file under 2MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setAvatarDataUrl(reader.result as string);
        reader.onerror = () => toast.error("Failed to read the selected image. Please try again.");
        reader.readAsDataURL(file);
    };

    const onContinue = async () => {
        await updateContext({ flowData: { ...state?.context.flowData, preferences: { theme, avatarDataUrl } } });
        await next();
    };

    const themeOptions: { value: "light" | "dark"; label: string; Icon: typeof Sun }[] = [
        { value: "light", label: "Light", Icon: Sun },
        { value: "dark", label: "Dark", Icon: Moon },
    ];

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Make yourself at home</h1>
                <p className="text-sm text-muted-foreground mt-1">Pick your theme and add a profile photo.</p>
            </div>
            <div className="flex items-center gap-4">
                <Avatar className="size-12">
                    <AvatarImage src={avatarDataUrl} alt="" />
                    <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <label className="text-sm underline cursor-pointer">
                    Upload image
                    <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                </label>
            </div>
            <div className="flex gap-2">
                {themeOptions.map(({ value, label, Icon }) => {
                    const isActive = theme === value;
                    return (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setTheme(value)}
                            className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors flex-1 ${
                                isActive
                                    ? "border-primary/20 bg-primary/10 text-primary"
                                    : "border-border hover:bg-accent/50 hover:border-primary/20"
                            }`}
                        >
                            <div className="size-7 rounded-md border bg-muted/50 flex items-center justify-center shrink-0">
                                <Icon className="size-4" />
                            </div>
                            <span className="flex-1 text-left">{label}</span>
                            {isActive && (
                                <div className="size-5 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="size-3 text-primary-foreground" strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            <Button type="button" onClick={onContinue}>
                Continue
            </Button>
        </div>
    );
};
