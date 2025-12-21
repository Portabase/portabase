import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { currentUser } from "@/lib/auth/current-user";
import { notFound } from "next/navigation";

export type UserAvatarProps = {};

export const UserAvatar = async () => {
    const user = await currentUser();

    if (!user) {
        return notFound();
    }

    return (
        <div>
            <Avatar className="size-6">
                <AvatarFallback>{user.name[0]}</AvatarFallback>
                {user.image ? <AvatarImage src={user.image} alt={`${user.name ?? "-"}'s profile picture`} /> : null}
            </Avatar>
        </div>
    );
};
