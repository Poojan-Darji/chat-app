import { fetchRedis } from "@/app/helper/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { z, ZodError } from "zod";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id: idToAdd } = z.object({ id: z.string() }).parse(body);
        const session = await getServerSession(authOptions);
        if (!session) return new Response("Unauthorized", { status: 401 });

        const isAlreadyFriendsData = (await fetchRedis(
            "sismember",
            `user:${session.user.id}:friends`,
            idToAdd
        )) as string;
        const isAlreadyFriends = JSON.parse(isAlreadyFriendsData) as 0 | 1;
        if (isAlreadyFriends)
            return new Response("Already friends", { status: 400 });

        const hasFriendRequestData = (await fetchRedis(
            "sismember",
            `user:${session.user.id}:incoming_friend_requests`,
            idToAdd
        )) as string;
        const hasFriendRequest = JSON.parse(hasFriendRequestData) as 0 | 1;
        if (!hasFriendRequest)
            return new Response("No friend request", { status: 400 });

        await db.sadd(`user:${session.user.id}:friends`, idToAdd);
        await db.sadd(`user:${idToAdd}:friends`, session.user.id);
        await db.srem(
            `user:${session.user.id}:incoming_friend_requests`,
            idToAdd
        );

        return new Response("OK", { status: 200 });
    } catch (error) {
        if (error instanceof ZodError) {
            return new Response(error.message, { status: 400 });
        }
        return new Response("Internal Server Error", { status: 500 });
    }
}
