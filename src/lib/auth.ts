import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";
import { db } from "./db";
import GoogleProvider from "next-auth/providers/google";
import { Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import { NextAuthOptions } from "next-auth";
import { fetchRedis } from "@/app/helper/redis";

const getGoogleCredentials = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || clientId.length === 0)
        throw new Error("Missing GOOGLE_CLIENT_ID");
    if (!clientSecret || clientSecret.length === 0)
        throw new Error("Missing GOOGLE_CLIENT_SECRET");
    return { clientId, clientSecret };
};

export const authOptions: NextAuthOptions = {
    adapter: UpstashRedisAdapter(db),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        GoogleProvider({
            clientId: getGoogleCredentials().clientId,
            clientSecret: getGoogleCredentials().clientSecret,
        }),
    ],
    callbacks: {
        async jwt({ token, user }: { token: JWT; user: User }) {
            const dbUserData = (await fetchRedis("get", `user:${token.id}`)) as
                | string
                | null;
            if (!dbUserData) {
                token.id = user?.id ?? "";
                return token;
            }
            const dbUser = JSON.parse(dbUserData) as User;
            return {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                picture: dbUser.image,
            };
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            if (token) {
                session.user.id = token.id;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.image = token.picture;
            }
            return session;
        },
        redirect() {
            return "/dashboard";
        },
    },
};
