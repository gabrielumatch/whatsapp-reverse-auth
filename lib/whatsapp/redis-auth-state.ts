import { 
    AuthenticationState, 
    AuthenticationCreds, 
    SignalDataTypeMap, 
    initAuthCreds, 
    BufferJSON 
} from "@whiskeysockets/baileys";
import Redis from "ioredis";

export const getRedisAuthState = async (redis: Redis, sessionId: string): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> => {
    
    const CREDS_KEY = `whatsapp:${sessionId}:creds`;
    const KEYS_KEY = `whatsapp:${sessionId}:keys`;

    // 1. Load Creds
    const credsData = await redis.get(CREDS_KEY);
    let creds: AuthenticationCreds;
    if (credsData) {
        creds = JSON.parse(credsData, BufferJSON.reviver);
    } else {
        creds = initAuthCreds();
    }

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data: { [key: string]: SignalDataTypeMap[typeof type] } = {};
                    
                    // Pipeline for performance
                    const pipeline = redis.pipeline();
                    ids.forEach(id => {
                        pipeline.hget(KEYS_KEY, `${type}:${id}`);
                    });
                    
                    const results = await pipeline.exec();
                    
                    results?.forEach((result, index) => {
                        const [err, value] = result;
                        if (!err && value) {
                            const id = ids[index];
                            data[id] = JSON.parse(value as string, BufferJSON.reviver);
                        }
                    });

                    return data;
                },
                set: async (data) => {
                    const pipeline = redis.pipeline();
                    
                    for (const category in data) {
                        const type = category as keyof SignalDataTypeMap;
                        for (const id in data[type]) {
                            const value = data[type]?.[id];
                            const key = `${type}:${id}`;
                            if (value) {
                                pipeline.hset(KEYS_KEY, key, JSON.stringify(value, BufferJSON.replacer));
                            } else {
                                pipeline.hdel(KEYS_KEY, key);
                            }
                        }
                    }
                    
                    await pipeline.exec();
                },
            },
        },
        saveCreds: async () => {
            await redis.set(CREDS_KEY, JSON.stringify(creds, BufferJSON.replacer));
        },
    };
};
