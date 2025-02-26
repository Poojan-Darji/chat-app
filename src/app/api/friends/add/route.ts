import { fetchRedis } from "@/app/helper/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { addFriendValidater } from "@/lib/validations/add-friend";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email: emailToAdd } = addFriendValidater.parse(body.email);

        const idToAdd = (await fetchRedis(
            "get",
            `user:email:${emailToAdd}`
        )) as string;

        if (!idToAdd) return new Response("User not found", { status: 400 });

        const session = await getServerSession(authOptions);
        if (!session) return new Response("Unauthorized", { status: 401 });

        if (idToAdd === session.user.id)
            return new Response("You can't add yourself as a friend", {
                status: 400,
            });

        const isAlreadyAddedData = (await fetchRedis(
            "sismember",
            `user:${idToAdd}:incoming_friend_requests`,
            session.user.id
        )) as string;

        const isAlreadyAdded = JSON.parse(isAlreadyAddedData) as 0 | 1;

        if (isAlreadyAdded)
            return new Response("Already added this user", { status: 400 });

        const isAlreadyFriendsData = (await fetchRedis(
            "sismember",
            `user:${session.user.id}:friends`,
            idToAdd
        )) as string;

        const isAlreadyFriends = JSON.parse(isAlreadyFriendsData) as 0 | 1;

        if (isAlreadyFriends)
            return new Response("Already friends", { status: 400 });

        db.sadd(`user:${idToAdd}:incoming_friend_requests`, session.user.id);

        return new Response("OK", { status: 200 });
    } catch (error) {
        if (error instanceof ZodError) {
            return new Response("Invalid request payload", { status: 422 });
        }

        return new Response("Invalid request", { status: 400 });
    }
}
