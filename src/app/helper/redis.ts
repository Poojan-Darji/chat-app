const upstashRedisRestUrl = process.env.UPSTASH_REDIS_REST_URL;
const authToken = process.env.UPSTASH_REDIS_REST_TOKEN;

type Command = "zrange" | "sismember" | "get" | "smembers";

export const fetchRedis = async (
    command: Command,
    ...args: (string | number)[]
) => {
    const commandUrl = `${upstashRedisRestUrl}/${command}/${args.join("/")}`;

    const res = await fetch(commandUrl, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
        cache: "no-cache",
    });
    if (!res.ok)
        throw new Error(`Error executing redis command : ${res.statusText}`);

    const data = (await res.json()) as { result: string | string[] };
    return data.result;
};
