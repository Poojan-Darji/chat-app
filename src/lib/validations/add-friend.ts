import { z } from "zod";

export const addFriendValidater = z.object({
    email: z.string().email(),
});
