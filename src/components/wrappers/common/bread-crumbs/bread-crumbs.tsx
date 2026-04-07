"use client"
import {
    Breadcrumb,
    BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {usePathname} from "next/navigation";
import Link from "next/link";
import {useIsMobile} from "@/hooks/use-mobile";
import {capitalizeFirstLetter, isUUID} from "@/utils/text";


export function useBreadCrumbs() {
    const pathname = usePathname();

    const route_history = pathname
        .split("/")
        .filter((x: any) => x && x.length > 0);

    const breadcrumb_routes = route_history.reduce(
        (acc: { name: string; path: string }[], route) => {
            const prev_path = acc[acc.length - 1]?.path ?? "";
            acc.push({name: route, path: `${prev_path}/${route}`});
            return acc;
        },
        [],
    );
    return {breadcrumb_routes};
}


interface BreadCrumbsProps {
}


export function BreadCrumbsWrapper() {
    const isMobile = useIsMobile()
    return (
        <>
            {!isMobile ? <BreadCrumbs/> : null}
        </>
    )
}

const FORBIDDEN_LINKS = ["organization", "dashboard", "database", "admin", "settings", "notifications", "storages"];


export function BreadCrumbs({}: BreadCrumbsProps) {
    const {breadcrumb_routes} = useBreadCrumbs();
    if (breadcrumb_routes.length < 2) return null;
    return (
        <div className="flex w-full flex-wrap px-3 md:justify-end">
            <Breadcrumb>
                <BreadcrumbList>
                    {breadcrumb_routes.map((crumb: any) => {
                        const label = isUUID(crumb.name) ? "details" : crumb.name;

                        const isLast = breadcrumb_routes.length - 1 === breadcrumb_routes.indexOf(crumb);
                        const isForbidden = FORBIDDEN_LINKS.includes(crumb.name.toLowerCase());

                        return (
                            <div className="flex items-center gap-2" key={crumb.path}>
                                <BreadcrumbItem key={crumb.path}>
                                    {isLast ? (
                                        <BreadcrumbPage>{capitalizeFirstLetter(label)}</BreadcrumbPage>
                                    ) : (
                                        <> {isForbidden ?
                                            <BreadcrumbLink asChild>
                                                <Link
                                                    href={crumb.path}
                                                    onClick={(e) => e.preventDefault()}
                                                    className="cursor-not-allowed "
                                                >
                                                    {capitalizeFirstLetter(label)}
                                                </Link>
                                            </BreadcrumbLink>
                                            :
                                            <BreadcrumbLink asChild>
                                                <Link href={crumb.path}>{capitalizeFirstLetter(label)}</Link>
                                            </BreadcrumbLink>
                                        }
                                        </>
                                    )}
                                </BreadcrumbItem>
                                {!isLast && <BreadcrumbSeparator className="hidden md:block"/>}
                            </div>
                        );
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    );
}