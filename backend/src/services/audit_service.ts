import { supabaseAdmin } from '../utils/supabase';

export interface AuditLogEntry {
    actor_id?: string; // UUID of user or 'system'
    action_type: string;
    target_table: string;
    target_id: string;
    old_value?: any;
    new_value?: any;
}

export class AuditService {
    /**
     * Logs a critical action to the immutable audit_logs table.
     * @param entry The audit entry details
     */
    static async logAction(entry: AuditLogEntry): Promise<void> {
        try {
            const { error } = await supabaseAdmin
                .from('audit_logs')
                .insert({
                    actor_id: entry.actor_id || null, // If null, implies system or unauthenticated (should be rare)
                    action_type: entry.action_type,
                    target_table: entry.target_table,
                    target_id: entry.target_id,
                    old_value: entry.old_value,
                    new_value: entry.new_value,
                    timestamp: new Date().toISOString()
                });

            if (error) {
                console.error('FAILED TO WRITE AUDIT LOG:', error);
                // In a high-integrity system, you might want to throw here or write to a fallback file
                throw new Error(`Audit Log Failed: ${error.message}`);
            }
        } catch (err) {
            console.error('CRITICAL: Audit Service Exception:', err);
            // We do not want to crash the main flow if audit fails, BUT we must alert.
            // For now, we log to stderr.
        }
    }
}
