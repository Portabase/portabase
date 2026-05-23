"use client";

import {useEffect, useState} from "react";
import {Check, ChevronDown} from "lucide-react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {SidebarMenuButton} from "@/components/ui/sidebar";
import {Separator} from "@/components/ui/separator";

export type ComboBoxProps<T = string> = {
    values: Array<{ value: T; label: string }>;
    defaultValue?: T;
    onValueChangeAction?: (value: T) => void;
    searchField?: boolean;
    sideBar?: boolean;
    onAddItemAction?: () => void;
    addItemLabel?: string;
};

export function ComboBox<T = string>(props: ComboBoxProps<T>) {
    const {
        values: choices,
        defaultValue,
        onValueChangeAction,
        searchField = false,
        sideBar = false,
        onAddItemAction,
        addItemLabel = "Add item",
    } = props;

    const [value, setValue] = useState<T | undefined>(defaultValue);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    return (
        <div>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    {sideBar ? (
                        <SidebarMenuButton>
                            <label className="max-w-[170px] truncate">
                            {value ? choices.find((c) => c.value === value)?.label : "Select choice..."}
                            </label>
                                <ChevronDown className="ml-auto"/>
                        </SidebarMenuButton>
                    ) : (
                        <Button variant="outline" role="combobox" aria-expanded={open}
                                className="w-full justify-between">
                            <label className="max-w-[170px] truncate">
                                {value ? choices.find((c) => c.value === value)?.label : "Select choice..."}
                            </label>
                            <ChevronDown className="opacity-50"/>
                        </Button>
                    )}
                </PopoverTrigger>

                <PopoverContent
                    className="p-0"
                    align="start"
                    sideOffset={4}
                    style={{width: 'var(--radix-popover-trigger-width)'}}

                >
                    <Command>
                        {searchField && <CommandInput placeholder="Search choice..." className="h-9"/>}
                        <CommandList>
                            <CommandEmpty>No choice found.</CommandEmpty>
                            <CommandGroup>
                                {choices.map((choice) => (
                                    <CommandItem
                                        key={String(choice.value)}
                                        value={String(choice.value)}
                                        onSelect={(currentValue) => {
                                            const v = choices.find(c => String(c.value) === currentValue)?.value;
                                            if (v !== undefined) {
                                                setValue(v);
                                                onValueChangeAction?.(v);
                                                setOpen(false);
                                            }
                                        }}
                                    >
                                        <label className="max-w-[170px] truncate">
                                            {choice.label}
                                        </label>
                                        <Check
                                            className={cn("ml-auto", value === choice.value ? "opacity-100" : "opacity-0")}/>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                    {onAddItemAction && (
                        <>
                            <Separator/>
                            {sideBar ? (
                                <SidebarMenuButton onClick={() => {
                                    setOpen(false);
                                    onAddItemAction();
                                }}>
                                    + {addItemLabel}
                                </SidebarMenuButton>
                            ) : (
                                <Button variant="outline" className="w-full" onClick={onAddItemAction}>
                                    + {addItemLabel}
                                </Button>
                            )}
                        </>
                    )}
                </PopoverContent>
            </Popover>
        </div>
    );
}

