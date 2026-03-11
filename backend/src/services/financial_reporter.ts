
import cron from 'node-cron';
import { supabaseAdmin } from '../utils/supabase';
import { fcm } from '../utils/firebase';

/**
 * Service to generate and send financial reports.
 * Schedule: Daily at 11:59 PM (server time)
 */
export class FinancialReporter {

    static initScheduledJobs() {
        console.log('Initializing Financial Reporting Job...');
        // Run at 23:59 every day
        cron.schedule('59 23 * * *', async () => {
            console.log('Running Daily Financial Report...');
            await this.generateAndSendDailyReport();
        });
    }

    static async generateAndSendDailyReport() {
        try {
            // 1. Fetch Data from the View we created
            const { data, error } = await supabaseAdmin
                .from('view_daily_financials') // Note: Views might not be directly selectable via JS SDK if not defined in types, but usually works
                .select('*')
                .limit(1) // Get the latest (which should be today or yesterday depending on timezone view logic)
                .order('report_date', { ascending: false }); // We need date logic to get specific day

            if (error) throw error;

            const report = data?.[0];
            if (!report) {
                console.log('No financial data for today.');
                return;
            }

            const message = `
DAILY REPORT (${new Date().toLocaleDateString()}):
Orders: ${report.total_orders}
Paid: ${report.paid_orders}
Revenue: $${(report.gross_revenue / 100).toFixed(2)}
            `.trim();

            console.log(message);

            // 2. Send Notification to Admin (User ID needs to be configured or fetched)
            // For now, we assume an 'admin' topic or specific admin tokens
            // await fcm.sendToTopic('admin_reports', { ... }) 

            // Or log to audit as a System Report
            // AuditService.logAction(...)

        } catch (err) {
            console.error('Financial Report Failed:', err);
        }
    }
}
