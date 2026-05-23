"use client";

import * as React from "react";
import { format } from "date-fns";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
    name: string;
    label?: string;
}

export function DateTimePicker({ name }: DateTimePickerProps) {
    const form = useFormContext();
    const value: Date | null = form.watch(name);

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            const current = form.getValues(name) ?? new Date();
            date.setHours(current.getHours());
            date.setMinutes(current.getMinutes());
            form.setValue(name, date);
        }
    };

    const handleTimeChange = (type: "hour" | "minute" | "ampm", val: string) => {
        const currentDate = form.getValues(name) ?? new Date();
        const newDate = new Date(currentDate);

        if (type === "hour") {
            const hour = parseInt(val, 10);
            const isPM = newDate.getHours() >= 12;
            newDate.setHours((isPM ? 12 : 0) + (hour % 12));
        } else if (type === "minute") {
            newDate.setMinutes(parseInt(val, 10));
        } else if (type === "ampm") {
            const hours = newDate.getHours();
            if (val === "AM" && hours >= 12) {
                newDate.setHours(hours - 12);
            } else if (val === "PM" && hours < 12) {
                newDate.setHours(hours + 12);
            }
        }

        form.setValue(name, newDate);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !value && "text-muted-foreground")}>
                    {value ? format(value, "MM/dd/yyyy hh:mm aa") : <span>MM/DD/YYYY hh:mm aa</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <div className="sm:flex">
                    <Calendar mode="single" selected={value ?? undefined} onSelect={handleDateSelect} initialFocus />
                    <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                        {/* Hours */}
                        <ScrollArea className="w-64 sm:w-auto">
                            <div className="flex sm:flex-col p-2">
                                {Array.from({ length: 12 }, (_, i) => i + 1)
                                    .reverse()
                                    .map((hour) => (
                                        <Button
                                            key={hour}
                                            size="icon"
                                            variant={value && value.getHours() % 12 === hour % 12 ? "default" : "ghost"}
                                            className="sm:w-full shrink-0 aspect-square"
                                            onClick={() => handleTimeChange("hour", hour.toString())}
                                        >
                                            {hour}
                                        </Button>
                                    ))}
                            </div>
                            <ScrollBar orientation="horizontal" className="sm:hidden" />
                        </ScrollArea>

                        {/* Minutes */}
                        <ScrollArea className="w-64 sm:w-auto">
                            <div className="flex sm:flex-col p-2">
                                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                                    <Button
                                        key={minute}
                                        size="icon"
                                        variant={value && value.getMinutes() === minute ? "default" : "ghost"}
                                        className="sm:w-full shrink-0 aspect-square"
                                        onClick={() => handleTimeChange("minute", minute.toString())}
                                    >
                                        {minute.toString().padStart(2, "0")}
                                    </Button>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" className="sm:hidden" />
                        </ScrollArea>

                        {/* AM/PM */}
                        <ScrollArea>
                            <div className="flex sm:flex-col p-2">
                                {["AM", "PM"].map((ampm) => (
                                    <Button
                                        key={ampm}
                                        size="icon"
                                        variant={
                                            value && ((ampm === "AM" && value.getHours() < 12) || (ampm === "PM" && value.getHours() >= 12))
                                                ? "default"
                                                : "ghost"
                                        }
                                        className="sm:w-full shrink-0 aspect-square"
                                        onClick={() => handleTimeChange("ampm", ampm)}
                                    >
                                        {ampm}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
