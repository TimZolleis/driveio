import z from 'zod';
import * as process from 'process';

const envSchema = z.object({
    APPLICATION_SECRET: z.string(),
    DATABASE_URL: z.string(),
    BING_MAPS_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
