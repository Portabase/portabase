"use client";

import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useEffect, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {Setting} from "@/db/schema/01_setting";
import {SettingsEmailSection} from "@/components/wrappers/dashboard/admin/settings/email/settings-email-section";
import {SettingsStorageSection} from "@/components/wrappers/dashboard/admin/settings/storage/settings-storage-section";
import {StorageChannelWith} from "@/db/schema/12_storage-channel";
import {MailboxIcon, Save} from "lucide-react";

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


    const tabs = [
        {
            name: 'System Email',
            value: 'email',
            icon: MailboxIcon,
            content: (
                <SettingsEmailSection settings={settings}/>
            )
        },
        {
            name: 'Default Storage',
            value: 'storage',
            icon: Save,
            content: (
                <SettingsStorageSection storageChannels={storageChannels} settings={settings}/>

            )
        }
    ]


    return (
        <div className="h-full mt-3">
            <Tabs className="h-full gap-4" value={tab} onValueChange={handleChangeTab}>
                <TabsList>
                    {tabs.map(({icon: Icon, name, value}) => (
                        <TabsTrigger key={value} value={value} className='flex items-center gap-1 px-2.5 sm:px-3'>
                            <Icon/>
                            {name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {tabs.map(tab => (
                    <TabsContent key={tab.value} value={tab.value} className="h-full">
                        {tab.content}
                    </TabsContent>
                ))}
            </Tabs>
        </div>


    );
};
