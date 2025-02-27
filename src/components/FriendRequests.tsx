"use client";
import { pusherClient } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import axios from "axios";
import { Check, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";

interface FriendRequest {
    incomingFriendRequest: IncomingFriendRequest[];
    sessionId: string;
}

const FriendRequests: FC<FriendRequest> = ({
    incomingFriendRequest,
    sessionId,
}) => {
    const router = useRouter();
    const [friendRequests, setFriendRequests] = useState<
        IncomingFriendRequest[]
    >(incomingFriendRequest);

    useEffect(() => {
        pusherClient.subscribe(
            toPusherKey(`user:${sessionId}:incoming_friend_requests`)
        );

        const friendRequestHandler = (req: IncomingFriendRequest) => {
            setFriendRequests((prev) => [...prev, req]);
        };

        pusherClient.bind("incoming_friend_requests", friendRequestHandler);

        return () => {
            pusherClient.unsubscribe(
                toPusherKey(`user:${sessionId}:incoming_friend_requests`)
            );
            pusherClient.unbind(
                "incoming_friend_requests",
                friendRequestHandler
            );
        };
    }, [sessionId]);

    const acceptFriend = async (senderId: string) => {
        await axios.post("/api/friends/accept", { id: senderId });
        setFriendRequests((prev) => {
            return prev.filter((request) => request.senderId !== senderId);
        });
        router.refresh();
    };

    const denyFriend = async (senderId: string) => {
        await axios.post("/api/friends/deny", { id: senderId });
        setFriendRequests((prev) => {
            return prev.filter((request) => request.senderId !== senderId);
        });
        router.refresh();
    };

    return (
        <>
            {friendRequests.length === 0 ? (
                <p className="text-sm text-gray-500">No friend requests</p>
            ) : (
                friendRequests.map((friendRequest) => (
                    <div
                        key={friendRequest.senderId}
                        className="flex gap-4 items-center"
                    >
                        <UserPlus className="text-black" />
                        <p className="font-medium text-lg">
                            {friendRequest.senderEmail}
                        </p>
                        <button
                            aria-label="accept friend"
                            onClick={() => {
                                acceptFriend(friendRequest.senderId);
                            }}
                            className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 grid place-items-center rounded-full transition hover:shadow-md"
                        >
                            <Check className="font-semibold text-white w-3/4 h-3/4" />
                        </button>
                        <button
                            aria-label="deny friend"
                            onClick={() => denyFriend(friendRequest.senderId)}
                            className="w-8 h-8 bg-red-600 hover:bg-red-700 grid place-items-center rounded-full transition hover:shadow-md"
                        >
                            <X className="font-semibold text-white w-3/4 h-3/4" />
                        </button>
                    </div>
                ))
            )}
        </>
    );
};

export default FriendRequests;
