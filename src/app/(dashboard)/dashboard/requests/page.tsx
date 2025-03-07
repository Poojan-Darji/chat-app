import { fetchRedis } from "@/app/helper/redis";
import FriendRequests from "@/components/FriendRequests";
import { authOptions } from "@/lib/auth";
import { User } from "@/types/db";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import React from "react";

const page = async () => {
    const session = await getServerSession(authOptions);
    if (!session) notFound();

    const incomingSenderIds = (await fetchRedis(
        "smembers",
        `user:${session.user.id}:incoming_friend_requests`
    )) as string[];

    const incomingFreiendRequests = (await Promise.all(
        incomingSenderIds.map(async (senderId) => {
            const sender = (await fetchRedis(
                "get",
                `user:${senderId}`
            )) as string;
            const senderParsed = JSON.parse(sender) as User;

            return {
                senderId,
                senderEmail: senderParsed.email,
            };
        })
    )) as IncomingFriendRequest[];

    return (
        <main className="pt-8">
            <h1 className="font-bold text-5xl mb-8">Friend Requests</h1>
            <div className="flex flex-col gap-4">
                <FriendRequests
                    incomingFriendRequest={incomingFreiendRequests}
                    sessionId={session.user.id}
                />
            </div>
        </main>
    );
};

export default page;
