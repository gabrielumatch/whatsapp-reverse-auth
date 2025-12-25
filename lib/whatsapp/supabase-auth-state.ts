import { 
    AuthenticationState, 
    AuthenticationCreds, 
    SignalDataTypeMap, 
    initAuthCreds, 
    BufferJSON 
} from "@whiskeysockets/baileys";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";

export type SupabaseAuthState = {
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
};

/**
 * Custom Baileys authentication state that persists data to Supabase.
 * Optimized for Baileys v7.
 */
export const getSupabaseAuthState = async (supabase: SupabaseClient<Database>, sessionId: string) => {
    
    // 1. Load or Initialize Credentials
    const { data: credsData } = await supabase
        .from("whatsapp_auth_keys")
        .select("data")
        .eq("session_id", sessionId)
        .eq("type", "creds")
        .eq("key_id", "default")
        .single();

    let creds: AuthenticationCreds;
    if (credsData) {
        creds = JSON.parse(credsData.data, BufferJSON.reviver);
    } else {
        creds = initAuthCreds();
    }

    // 2. Helper to save data to Supabase
    const writeData = async (data: any, type: string, keyId: string) => {
        const str = JSON.stringify(data, BufferJSON.replacer);
        await supabase
            .from("whatsapp_auth_keys")
            .upsert({
                session_id: sessionId,
                type,
                key_id: keyId,
                data: str,
                updated_at: new Date().toISOString()
            }, { onConflict: "session_id,type,key_id" });
    };

    const removeData = async (type: string, keyId: string) => {
        await supabase
            .from("whatsapp_auth_keys")
            .delete()
            .eq("session_id", sessionId)
            .eq("type", type)
            .eq("key_id", keyId);
    };

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data: { [key: string]: SignalDataTypeMap[typeof type] } = {};
                    
                    const { data: dbData } = await supabase
                        .from("whatsapp_auth_keys")
                        .select("key_id, data")
                        .eq("session_id", sessionId)
                        .eq("type", type)
                        .in("key_id", ids);

                    if (dbData) {
                        for (const row of dbData) {
                            data[row.key_id] = JSON.parse(row.data, BufferJSON.reviver);
                        }
                    }

                    return data;
                },
                set: async (data) => {
                    const tasks: Promise<void>[] = [];
                    for (const category in data) {
                        const type = category as keyof SignalDataTypeMap;
                        for (const id in data[type]) {
                            const value = data[type]?.[id];
                            if (value) {
                                tasks.push(writeData(value, type, id));
                            } else {
                                tasks.push(removeData(type, id));
                            }
                        }
                    }
                    await Promise.all(tasks);
                },
            },
        },
        saveCreds: async () => {
            await writeData(creds, "creds", "default");
        },
    };
}
