"use client";
import { cn, toPusherKey } from "@/lib/utils";
import { FC, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import Image from "next/image";
import { pusherClient } from "@/lib/pusher";

interface MessagesProps {
    initialMessages: Message[];
    sessionId: string;
    sessionImage: string | null | undefined;
    chatPartner: User;
    chatId: string;
}

const Messages: FC<MessagesProps> = ({
    initialMessages,
    sessionId,
    sessionImage,
    chatPartner,
    chatId,
}) => {
    const [messages, setMessages] = useState<Message[]>(initialMessages);

    useEffect(() => {
        pusherClient.subscribe(toPusherKey(`chat:${chatId}`));
        console.log("pusher client is subscribed");

        const messageHandler = (message: Message) => {
            console.log("message handler is called");
            setMessages((prev) => [message, ...prev]);
        };

        pusherClient.bind("incoming-message", messageHandler);

        return () => {
            pusherClient.unsubscribe(toPusherKey(`chat:${chatId}`));
            pusherClient.unbind("incoming-message", messageHandler);
        };
    }, [chatId]);

    const scrollDownRef = useRef<HTMLDivElement | null>(null);

    const formatTimestamp = (timestamp: number) => {
        return format(timestamp, "HH:mm");
    };

    return (
        <div
            id="message"
            className="flex h-full flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch"
        >
            <div ref={scrollDownRef} />
            {messages.map((message, idx) => {
                const isCurrentUser = message.senderId === sessionId;
                const hasNextMessageFromSameUser =
                    messages[idx - 1]?.senderId === messages[idx].senderId;
                return (
                    <div
                        className="chat-message"
                        key={`${message.id}-${message.timestamp}`}
                    >
                        <div
                            className={cn("flex items-end", {
                                "justify-end": isCurrentUser,
                            })}
                        >
                            <div
                                className={cn(
                                    "flex flex-col space-y-2 text-base max-w-xs mx-2",
                                    {
                                        "order-1 items-end": isCurrentUser,
                                        "order-2 items-start": !isCurrentUser,
                                    }
                                )}
                            >
                                <span
                                    className={cn(
                                        "px-4 py-2 rounded-lg inline-block",
                                        {
                                            "bg-indigo-600 text-white":
                                                isCurrentUser,
                                            "bg-gray-200 text-gray-900":
                                                !isCurrentUser,
                                            "rounded-br-none":
                                                !hasNextMessageFromSameUser &&
                                                isCurrentUser,
                                            "rounded-bl-none":
                                                !hasNextMessageFromSameUser &&
                                                !isCurrentUser,
                                        }
                                    )}
                                >
                                    {message.text}{" "}
                                    <span className="ml-2 text-gray-400 text-xs">
                                        {formatTimestamp(message.timestamp)}
                                    </span>
                                </span>
                            </div>
                            <div
                                className={cn("relative w-6 h-6", {
                                    "order-2": isCurrentUser,
                                    "order-1": !isCurrentUser,
                                    invisible: hasNextMessageFromSameUser,
                                })}
                            >
                                <Image
                                    fill
                                    src={
                                        isCurrentUser
                                            ? (sessionImage as string)
                                            : chatPartner.image
                                    }
                                    alt="Profile picture"
                                    referrerPolicy="no-referrer"
                                    className="rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default Messages;
