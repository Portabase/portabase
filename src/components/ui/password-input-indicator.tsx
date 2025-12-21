"use client";

import {Ref, useEffect, useState} from "react";
import {Check, X} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion";
import {
    FormControl,
    FormDescription,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {PasswordInput} from "@/components/ui/password-input";

interface PasswordStrengthInputProps {
    field: {
        name: string;
        value: string;
        onChange: (value: string) => void;
        onBlur: () => void;
        ref: Ref<HTMLInputElement>;
    };
    label?: string;
    description?: string;
    disabled?: boolean;
    onValidChange?: (isValid: boolean) => void;

}

const passwordTextsFields = {
    label: "Password",
    placeholder: "Enter password",
    strength: {
        enter: "Enter a password",
        weak: "Weak password",
        medium: "Medium password",
        strong: "Strong password"
    },
    requirementsIntro: "Must contain:",
    requirements: {
        minLength: "At least 8 characters",
        number: "At least 1 number",
        lowercase: "At least 1 lowercase letter",
        uppercase: "At least 1 uppercase letter",
        specialChar: "At least 1 special character"
    }
}


export function PasswordStrengthInput({
                                          field,
                                          label,
                                          description,
                                          disabled, onValidChange
                                      }: PasswordStrengthInputProps) {
    const text = passwordTextsFields
    const [isVisible, setIsVisible] = useState(false);
    const password = field.value ?? "";

    const requirements = [
        {regex: /.{8,}/, text: text.requirements.minLength},
        {regex: /[0-9]/, text: text.requirements.number},
        {regex: /[a-z]/, text: text.requirements.lowercase},
        {regex: /[A-Z]/, text: text.requirements.uppercase},
        {regex: /[^a-zA-Z0-9]/, text: text.requirements.specialChar},
    ];

    const strength = requirements.map((req) => ({
        met: req.regex.test(password),
        text: req.text,
    }));

    const strengthScore = strength.filter((req) => req.met).length;

    const getStrengthColor = (score: number) => {
        if (score === 0) return "bg-border";
        if (score <= 2) return "bg-red-500";
        if (score === 3) return "bg-orange-500";
        if (score === 4) return "bg-amber-500";
        return "bg-emerald-500";
    };

    const getStrengthText = (score: number) => {
        if (score === 0) return text.strength.enter;
        if (score <= 2) return text.strength.weak;
        if (score === 3 || score === 4) return text.strength.medium;
        return text.strength.strong;
    };

    useEffect(() => {
        if (strengthScore === requirements.length) {
            onValidChange?.(true);
        } else {
            onValidChange?.(false);
        }
    }, [strengthScore, onValidChange]);

    return (
        <FormItem>
            <FormLabel>{label ?? text.label}</FormLabel>
            <div className="relative">
                <FormControl>
                    <PasswordInput
                        placeholder={text.placeholder}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        onFocus={() => setIsVisible(true)}
                        onBlur={(e) => {
                            field.onBlur();
                            setIsVisible(false);
                        }}
                        ref={field.ref}
                        name={field.name}
                        disabled={disabled}

                    />
                </FormControl>
            </div>

            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{opacity: 0, height: 0, y: -5}}
                        animate={{opacity: 1, height: "auto", y: 0}}
                        exit={{opacity: 0, height: 0, y: -5}}
                        transition={{duration: 0.35, ease: "easeInOut"}}
                        className="overflow-hidden"
                    >
                        <FormDescription>
                            {description ??
                                `${getStrengthText(strengthScore)}. ${text.requirementsIntro}`}
                        </FormDescription>
                        <FormMessage/>

                        <div
                            className="mb-2 h-1 w-full overflow-hidden rounded-full bg-border mt-2"
                            role="progressbar"
                            aria-valuenow={strengthScore}
                            aria-valuemin={0}
                            aria-valuemax={requirements.length}
                        >
                            <motion.div
                                key={strengthScore}
                                className={`h-full ${getStrengthColor(
                                    strengthScore
                                )}`}
                                initial={{width: 0}}
                                animate={{
                                    width: `${(strengthScore / requirements.length) * 100}%`,
                                }}
                                transition={{duration: 0.5}}
                            />
                        </div>

                        <ul className="space-y-1.5" aria-label="Password requirements">
                            {strength.map((req, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    {req.met ? (
                                        <Check className="h-4 w-4 text-emerald-500"/>
                                    ) : (
                                        <X className="h-4 w-4 text-muted-foreground"/>
                                    )}
                                    <span
                                        className={`text-xs ${
                                            req.met ? "text-emerald-600" : "text-muted-foreground"
                                        }`}
                                    >
                    {req.text}
                  </span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </FormItem>
    );
}
