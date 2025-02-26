import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { z, ZodError } from "zod";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id: idToDeny } = z.object({ id: z.string() }).parse(body);
        const session = await getServerSession(authOptions);
        if (!session) return new Response("Unauthorized", { status: 401 });

        await db.srem(
            `user:${session.user.id}:incoming_friend_requests`,
            idToDeny
        );
        return new Response("OK", { status: 200 });
    } catch (error) {
        if (error instanceof ZodError) {
            return new Response(error.message, { status: 400 });
        }
        return new Response("Bad Request", { status: 400 });
    }
}
