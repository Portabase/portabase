import { twx } from "@/lib/twx";
import { cn } from "@/lib/utils";

export const Page = twx.div((props) => [cn(`flex flex-col h-full px-5 md:px-10 py-6`, props.className)]);

export const PageHeader = twx.div((props) => [cn(`flex justify-between`, props.className)]);

export const PageTitle = twx.h1((props) => [cn(`text-3xl font-bold mb-6 flex gap-4 items-center`, props.className)]);

export const PageDescription = twx.h2((props) => [cn(`text-s mb-6 `, props.className)]);

export const PageActions = twx.h1((props) => [cn(`flex gap-4 h-fit`, props.className)]);

export const PageContent = twx.div((props) => [cn(`h-full`, props.className)]);
