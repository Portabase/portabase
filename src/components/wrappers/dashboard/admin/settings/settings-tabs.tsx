"use client";

import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useEffect, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {Setting} from "@/db/schema/01_setting";
import {SettingsEmailSection} from "@/components/wrappers/dashboard/admin/settings/email/settings-email-section";
import {SettingsStorageSection} from "@/components/wrappers/dashboard/admin/settings/storage/settings-storage-section";
import {StorageChannelWith} from "@/db/schema/12_storage-channel";

export type SettingsTabsProps = {
    settings: Setting
    storageChannels: StorageChannelWith[]
};

export const SettingsTabs = ({settings, storageChannels}: SettingsTabsProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [tab, setTab] = useState<string>(() => searchParams.get("tab") ?? "email");


    useEffect(() => {
        const newTab = searchParams.get("tab") ?? "email";
        setTab(newTab);
    }, [searchParams]);

    const handleChangeTab = (value: string) => {
        router.push(`?tab=${value}`);
    };


    return (
        <div className="h-full mt-3">
            <Tabs className="h-full" value={tab} onValueChange={handleChangeTab}>
                <TabsList className='bg-background rounded-none border-b p-0 min-w-48'>
                    <TabsTrigger
                        value="email"
                        className='bg-background data-[state=active]:border-primary dark:data-[state=active]:border-primary h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none'
                    >
                        Email
                    </TabsTrigger>
                    <TabsTrigger
                        value="storage"
                        className='bg-background data-[state=active]:border-primary dark:data-[state=active]:border-primary h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none'
                    >
                        Default storage
                    </TabsTrigger>
                </TabsList>
                <TabsContent className="h-full" value="email">
                    <SettingsEmailSection settings={settings}/>
                </TabsContent>
                <TabsContent className="h-full" value="storage">
                    <SettingsStorageSection storageChannels={storageChannels} settings={settings}/>
                </TabsContent>
            </Tabs>
        </div>


    );
};
