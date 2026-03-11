// @ts-nocheck
// =====================================================
// WASEL SUPABASE EDGE FUNCTION - FINANCIAL REPORTS
// File: supabase/functions/financial-reports/index.ts
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get date range from query parameters
    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "daily"; // daily, weekly, monthly
    const days = period === "weekly" ? 7 : period === "monthly" ? 30 : 1;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get financial data
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        delivery_fee,
        discount,
        payment_status,
        created_at,
        user_id
      `)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch orders" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate metrics
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.payment_status === "succeeded");
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const totalDeliveryFees = completedOrders.reduce((sum, o) => sum + o.delivery_fee, 0);
    const totalDiscounts = completedOrders.reduce((sum, o) => sum + o.discount, 0);
    const netRevenue = totalRevenue - totalDeliveryFees - totalDiscounts;
    const uniqueCustomers = new Set(completedOrders.map(o => o.user_id)).size;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / completedOrders.length : 0;

    // Get payment provider breakdown
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("provider, amount, status")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    const paymentBreakdown = payments?.reduce((acc, payment) => {
      if (!acc[payment.provider]) {
        acc[payment.provider] = { total: 0, successful: 0 };
      }
      acc[payment.provider].total += payment.amount;
      if (payment.status === "succeeded") {
        acc[payment.provider].successful += payment.amount;
      }
      return acc;
    }, {} as Record<string, { total: number; successful: number }>) || {};

    // Generate report
    const report = {
      period: period,
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        total_orders: totalOrders,
        completed_orders: completedOrders.length,
        completion_rate: totalOrders > 0 ? (completedOrders.length / totalOrders * 100).toFixed(2) + "%" : "0%",
        total_revenue: totalRevenue,
        net_revenue: netRevenue,
        total_delivery_fees: totalDeliveryFees,
        total_discounts: totalDiscounts,
        unique_customers: uniqueCustomers,
        average_order_value: avgOrderValue
      },
      payment_methods: paymentBreakdown,
      generated_at: new Date().toISOString()
    };

    // Store report in database for history
    await supabase
      .from("financial_reports")
      .insert({
        period: period,
        report_data: report,
        created_at: new Date().toISOString()
      });

    // If this is a scheduled run (not manual), send email to admin
    if (req.method === "POST") {
      // TODO: Implement email sending
      console.log("Financial report generated:", report);
    }

    return new Response(
      JSON.stringify(report),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Financial reports error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
