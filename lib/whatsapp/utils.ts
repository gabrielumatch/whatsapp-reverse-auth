export function checkRLSError(error: { code?: string; message?: string } | null | undefined) {
    if (!error) return;
    
    // Postgres Error 42501: insufficient_privilege (RLS violation)
    // Supabase often returns this in 'code' or 'details'
    if (error.code === '42501' || (error.message && error.message.includes('row-level security'))) {
        console.error("CRITICAL: RLS Policy Violation Detected!");
        console.error("The bot cannot access the database. Please check RLS policies or Service Role Key.");
        console.error("Error Details:", error);
        process.exit(1); // Hard stop
    }
}
