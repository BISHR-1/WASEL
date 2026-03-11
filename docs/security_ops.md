# Security & Operations Manual

## 1. Security Checklist (OWASP Top 10 Hardening)

### Application Security
- [ ] **Injection (SQLi)**: Verify all DB calls use Prepared Statements (Supabase/Postgres defaults).
- [ ] **Auth**: Enforce JWT validation on EVERY API route. Check `role` claim.
- [ ] **Sensitive Data**: Verify `pgcrypto` is used for `chat_messages` and `payment_info`.
- [ ] **XSS**: Ensure Content-Security-Policy (CSP) headers are set. Disable inline scripts.
- [ ] **CSRF**: Verify `SameSite=Strict` on cookies. Use CSRF tokens for mutations.
- [ ] **Broken Access Control**: Test RLS policies (User cannot see other Users' orders).

### Infrastructure Security
- [ ] **TLS**: Ensure TLS 1.2+ is enforced. HSTS header `max-age=31536000`.
- [ ] **WAF**: Configure Cloudflare/AWS WAF Rules (Rate Limit, Bot Protect).
- [ ] **DDoS**: Rate limiting enabled on API Gateway / Edge.
- [ ] **Secrets**: NO secrets in git. Use `.env` or Secret Manager.

### Payment Integration
- [ ] **Webhook Signature**: Verify PayPal Webhook HMAC check is active and blocking invalid requests.
- [ ] **Total Check**: Verify server recalculates Cart Total before sending to PayPal.
- [ ] **Stock Lock**: Verify stock is checked/reserved before redirecting to payment.

## 2. Monitoring & Logging

### Recommended Stack
- **Metrics**: Prometheus (scrape Node.js `/metrics` endpoint).
- **Visualization**: Grafana Dashboards.
- **Logs**: ELK Stack or Datadog.

### Key Metrics to Monitor
| Metric | Threshold (Warning) | Threshold (Critical) |
|---|---|---|
| API Error Rate (5xx) | > 1% | > 5% |
| Payment Failures | > 5% | > 10% |
| AI Response Latency | > 5s | > 10s |
| DB CPU Usage | > 70% | > 90% |

### Alerts
- **Slack/Email**: Trigger on Critical Thresholds.
- **PagerDuty**: Trigger on Payment System Outage.

## 3. Incident Response Playbook

### Scenario A: Payment Double-Charge
1. **Identify**: User reports or Monitoring spikes.
2. **Contain**: Disable "Checkout" button via Feature Flag.
3. **Analyze**: Check `idempotency_keys` table and PayPal logs.
4. **Resovle**: Refund duplicate via PayPal Portal. Fix race condition code.

### Scenario B: AI Prompt Injection
1. **Identify**: Logs show detected malicious patterns.
2. **Contain**: Temporarily disable AI Chat endpoint.
3. **Analyze**: Update `isSafePrompt` regex/logic.
4. **Restore**: Re-enable chat after testing.

### Scenario C: Database Leak
1. **Identify**: Abnormal data export traffic.
2. **Contain**: Rotate DB passwords immediately. Revoke all active JWTs.
3. **Analyze**: Audit Postgres logs.
4. **Notify**: Inform users per GDPR/Compliance rules.
