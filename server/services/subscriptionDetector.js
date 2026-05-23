import Transaction from '../models/Transaction.js';

/**
 * Analyzes transaction histories to detect recurring subscriptions
 * @param {string} userId - User ID
 * @returns {Promise<Array<{merchant: string, category: string, amount: number, interval: string, nextBillingDate: Date}>>}
 */
export async function detectSubscriptions(userId) {
  try {
    // Fetch all completed transactions for this user, sorted chronologically
    const transactions = await Transaction.find({ user: userId }).sort({ date: 1 });

    // Group transactions by merchant
    const merchantGroups = {};
    transactions.forEach(t => {
      const merchantKey = t.merchant.trim().toLowerCase();
      if (!merchantGroups[merchantKey]) {
        merchantGroups[merchantKey] = [];
      }
      merchantGroups[merchantKey].push(t);
    });

    const activeSubscriptions = [];

    // Core subscription names keywords
    const subscriptionSaaS = [
      'netflix', 'spotify', 'aws', 'gcp', 'google cloud', 'github', 'copilot', 'slack', 
      'zoom', 'adobe', 'canva', 'figma', 'notion', 'youtube premium', 'openai', 'chatgpt',
      'dropbox', 'microsoft 365', 'office 365', 'cursor', 'amazon prime', 'cloudflare', 'digitalocean'
    ];

    for (const [merchantName, items] of Object.entries(merchantGroups)) {
      if (items.length < 2) {
        // Must have at least 2 historical charges to calculate interval
        
        // Exceptional Rule: If it's a known popular SaaS brand and matches exactly, we can list it as suspected
        const isSaaSMerchant = subscriptionSaaS.some(kw => merchantName.includes(kw));
        if (isSaaSMerchant && items.length === 1) {
          const singleItem = items[0];
          const estNextBilling = new Date(singleItem.date);
          estNextBilling.setDate(estNextBilling.getDate() + 30);
          
          activeSubscriptions.push({
            merchant: singleItem.merchant,
            category: 'Subscriptions',
            amount: singleItem.amount,
            interval: 'Monthly (Suspected)',
            nextBillingDate: estNextBilling,
            confidence: 'Low'
          });
        }
        continue;
      }

      // Calculate the difference in days between successive charges
      const intervals = [];
      let totalAmount = 0;
      for (let i = 1; i < items.length; i++) {
        const diffDays = Math.abs(new Date(items[i].date) - new Date(items[i - 1].date)) / (1000 * 60 * 60 * 24);
        intervals.push(diffDays);
        totalAmount += items[i].amount;
      }
      totalAmount += items[0].amount;
      const averageAmount = totalAmount / items.length;

      // Find average interval
      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      
      // Determine interval type based on avgInterval variance
      let isSubscription = false;
      let intervalType = 'Monthly';
      let confidence = 'Medium';

      // 30 days cycle (Monthly ± 5 days)
      if (avgInterval >= 25 && avgInterval <= 35) {
        isSubscription = true;
        intervalType = 'Monthly';
      }
      // 7 days cycle (Weekly ± 2 days)
      else if (avgInterval >= 5 && avgInterval <= 9) {
        isSubscription = true;
        intervalType = 'Weekly';
      }
      // 365 days cycle (Yearly ± 15 days)
      else if (avgInterval >= 345 && avgInterval <= 385) {
        isSubscription = true;
        intervalType = 'Yearly';
      }
      // Exceptional: Also flag if merchant matches known subscriptions and interval is relatively uniform
      else {
        const isKnownSaaS = subscriptionSaaS.some(kw => merchantName.includes(kw));
        if (isKnownSaaS && avgInterval >= 15 && avgInterval <= 50) {
          isSubscription = true;
          intervalType = 'Monthly (Custom)';
          confidence = 'High';
        }
      }

      if (isSubscription) {
        const lastChargedItem = items[items.length - 1];
        const nextBillingDate = new Date(lastChargedItem.date);
        
        // Add interval days to last billing date to project next cycle
        const daysToAdd = avgInterval >= 25 && avgInterval <= 35 ? 30 : Math.round(avgInterval);
        nextBillingDate.setDate(nextBillingDate.getDate() + daysToAdd);

        activeSubscriptions.push({
          merchant: lastChargedItem.merchant,
          category: lastChargedItem.category || 'Subscriptions',
          amount: Number(averageAmount.toFixed(2)),
          interval: intervalType,
          nextBillingDate,
          confidence: items.length >= 3 ? 'High' : confidence
        });
      }
    }

    return activeSubscriptions.sort((a, b) => b.amount - a.amount);
  } catch (error) {
    console.error("Error in subscription detector:", error);
    return [];
  }
}
