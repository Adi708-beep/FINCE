import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Ensure the API Key is loaded
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment variables!");
}

const genAI = new GoogleGenerativeAI(apiKey || '');

// ==========================================
// LOCAL FALLBACK PARSING & REPORT ALGORITHMS
// ==========================================

export function localParseInvoiceText(ocrText) {
  const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let merchant = 'Unknown';
  let amount = 0;
  let date = new Date();
  let tax = 0;
  let category = 'Others';
  const items = [];

  if (lines.length > 0) {
    // Infer merchant from the first line that looks like a store name (non-numeric, short)
    for (let i = 0; i < Math.min(lines.length, 3); i++) {
      if (lines[i] && !/\d{4,}/.test(lines[i]) && lines[i].length > 3 && lines[i].length < 40) {
        merchant = lines[i];
        break;
      }
    }
  }

  // Parse amount: look for total/subtotal/due
  let foundAmount = false;
  for (const line of lines) {
    const match = line.match(/(?:total|grand\s*total|amount\s*due|to\s*pay|total\s*amount|net\s*pay)\s*(?:₹|\$|rs\.?|usd)?\s*?(\d+(?:\.\d{2})?)/i);
    if (match) {
      amount = Number(match[1]);
      foundAmount = true;
      break;
    }
  }
  // Fallback amount: find the largest number on any line that has decimal places
  if (!foundAmount) {
    let maxNum = 0;
    for (const line of lines) {
      const numbers = line.match(/\b\d+\.\d{2}\b/g);
      if (numbers) {
        numbers.forEach(numStr => {
          const num = Number(numStr);
          if (num > maxNum) maxNum = num;
        });
      }
    }
    amount = maxNum;
  }

  // Parse Date: look for YYYY-MM-DD or DD/MM/YYYY or MM/DD/YYYY
  const dateRegex = /\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})|(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/;
  for (const line of lines) {
    const match = line.match(dateRegex);
    if (match) {
      const parsedDate = new Date(match[0]);
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate;
        break;
      }
    }
  }

  // Parse Tax: look for gst/tax/vat
  for (const line of lines) {
    const match = line.match(/(?:tax|gst|vat|cgst|sgst)\s*(?:@|\b)?\s*(\d+(?:\.\d{2})?%?)/i);
    if (match) {
      const taxVal = parseFloat(match[1]);
      if (!isNaN(taxVal)) {
        if (match[1].includes('%')) {
          tax = Number(((amount * taxVal) / 100).toFixed(2));
        } else {
          tax = taxVal;
        }
        break;
      }
    }
  }

  // Categorize based on keywords
  const textLower = ocrText.toLowerCase();
  if (/\b(food|dining|cafe|starbucks|restaurant|mcdonald|pizza|burger|eat|kitchen|canteen)\b/.test(textLower)) {
    category = 'Food & Dining';
  } else if (/\b(grocery|groceries|supermarket|mart|walmart|woolworths|tesco|whole\s*foods|milk|bread|fruit|veg)\b/.test(textLower)) {
    category = 'Groceries';
  } else if (/\b(electric|water|gas|utility|internet|power|wifi|telecom|phone|bill|recharge)\b/.test(textLower)) {
    category = 'Utilities';
  } else if (/\b(movie|cinema|netflix|spotify|game|steam|ticket|concert|show|play|event|fun|funzone)\b/.test(textLower)) {
    category = 'Entertainment';
  } else if (/\b(uber|ola|cab|taxi|train|bus|metro|flight|airline|fuel|petrol|diesel|gasoline|travel|transport|parking)\b/.test(textLower)) {
    category = 'Travel & Transport';
  } else if (/\b(rent|lease|mortgage|housing|apartment|maintenance|property)\b/.test(textLower)) {
    category = 'Housing';
  } else if (/\b(medicine|medical|doctor|hospital|pharmacy|health|supplement|care|shampoo|soap|dentist)\b/.test(textLower)) {
    category = 'Health & Personal Care';
  } else if (/\b(amazon|flipkart|myntra|clothe|shoe|shirt|pant|dress|mall|store|buy|purchase|shopping)\b/.test(textLower)) {
    category = 'Shopping';
  }

  // Generate basic item
  items.push({
    name: merchant !== 'Unknown' ? `Expense at ${merchant}` : 'Purchased Items',
    price: amount - tax,
    quantity: 1
  });

  return { merchant, amount, date, tax, category, items };
}

export function localGenerateSavingsAuditReport({ currentMonthData, lastMonthData, username }) {
  const currentTotal = Object.values(currentMonthData).reduce((sum, val) => sum + val, 0);
  const lastTotal = Object.values(lastMonthData).reduce((sum, val) => sum + val, 0);
  const delta = currentTotal - lastTotal;
  const percentage = lastTotal > 0 ? ((delta / lastTotal) * 100).toFixed(1) : '100.0';

  let mostIncreasedCat = 'None';
  let maxIncrease = 0;
  let mostDecreasedCat = 'None';
  let maxDecrease = 0;

  const allCategories = new Set([...Object.keys(currentMonthData), ...Object.keys(lastMonthData)]);

  allCategories.forEach(cat => {
    const currentVal = currentMonthData[cat] || 0;
    const lastVal = lastMonthData[cat] || 0;
    const change = currentVal - lastVal;
    if (change > maxIncrease) {
      maxIncrease = change;
      mostIncreasedCat = cat;
    }
    if (change < maxDecrease) {
      maxDecrease = change;
      mostDecreasedCat = cat;
    }
  });

  return `
# AI Spend Audit Report — comparative analysis for ${username}

## Executive Summary
This report analyzes and compares your spending patterns for the current calendar month versus the previous month.
- **This Month's Spending:** ₹${currentTotal.toLocaleString()}
- **Last Month's Spending:** ₹${lastTotal.toLocaleString()}
- **Net Shift:** ${delta >= 0 ? '+' : ''}₹${delta.toLocaleString()} (${delta >= 0 ? 'Increase' : 'Savings'} of ${Math.abs(percentage)}%)

${delta > 0 
  ? `> [!WARNING]\n> Your overall spending has **increased by ₹${delta.toLocaleString()}** compared to last month. Review your active categories below to re-align your budget limits.`
  : `> [!NOTE]\n> Excellent job! You managed to **save ₹${Math.abs(delta).toLocaleString()}** compared to last month. Keep up this disciplined spending pattern!`
}

## Key Trends
- 📈 **Highest Increase:** Spending in **${mostIncreasedCat}** grew the most, rising by **₹${maxIncrease.toLocaleString()}**.
- 📉 **Highest Decrease:** Spending in **${mostDecreasedCat}** dropped the most, saving you **₹${Math.abs(maxDecrease).toLocaleString()}**.

## Actionable Savings Strategies
1. **Target ${mostIncreasedCat} Expenses:** Since this category grew by ₹${maxIncrease.toLocaleString()}, consider setting a strict budget limit for it or auditing recent transactions to identify unnecessary subscriptions or impulse purchases.
2. **Track Recurring Subscriptions:** Utilities or recurring monthly charges can creep up. Check for unused memberships.
3. **Set Up Category Alerts:** Make sure your category alert thresholds are set to 80% to receive notifications before exceeding your target allowances.
  `;
}

export function localGenerateFinancialReport({ transactionsContext, budgetsContext, period }) {
  const totalSpent = transactionsContext.reduce((sum, t) => sum + t.amount, 0);
  const avgTrans = transactionsContext.length > 0 ? (totalSpent / transactionsContext.length).toFixed(2) : '0';
  
  return `
# Financial Report & Insights (Period: ${period})

## Executive Summary
Your financial report for this period is ready.
- **Total Expenditure:** ₹${totalSpent.toLocaleString()}
- **Average Spend per Transaction:** ₹${avgTrans}
- **Ledger Records Analyzed:** ${transactionsContext.length}

## Budget Performance
Review your category limits in the budgets tab. Track your spending daily to ensure you stay under your set thresholds.

## AI Saving Recommendations
1. **Impulse Purchase Control:** Review transactions above ₹1,000 and identify if they were essential or discretionary.
2. **Review High-Spend Outlets:** Check the "Top Spend Outlets" chart on the dashboard and negotiate recurring costs or look for cheaper alternatives.
3. **Collaborative Tracking:** If you have a family group synced, ensure all members log their receipts daily to prevent budget limit breaches.
  `;
}

export function localAllocateBudgetWithAi({ totalLimit, categoryPercentages, categoriesList }) {
  const count = categoriesList.length;
  const targetTotal = totalLimit * 0.9;
  const allocations = {};
  
  let sumAllocated = 0;
  categoriesList.forEach((cat) => {
    const pct = parseFloat(categoryPercentages[cat]) || (100 / count);
    const calculatedLimit = Math.round((targetTotal * pct) / 100);
    allocations[cat] = calculatedLimit;
    sumAllocated += calculatedLimit;
  });
  
  const diff = Math.round(targetTotal) - sumAllocated;
  if (categoriesList.length > 0) {
    allocations[categoriesList[categoriesList.length - 1]] += diff;
  }

  return {
    allocations,
    rationale: "AI budget allocation is derived from your historical 60-day spending patterns. 10% of your total budget (₹" + Math.round(totalLimit * 0.1) + ") has been reserved as a savings buffer."
  };
}

// ==========================================
// GEMINI API INTEGRATIONS
// ==========================================

export async function analyzeInvoiceText(ocrText) {
  if (!ocrText || ocrText.trim() === '') {
    return {
      merchant: 'Unknown',
      amount: 0,
      date: new Date(),
      tax: 0,
      category: 'Uncategorized',
      items: []
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      You are an expert invoice parser. Parse the following OCR text extracted from an invoice or receipt into a structured JSON object.
      
      Here is the raw OCR text:
      """
      ${ocrText}
      """
      
      Analyze the text carefully. Extract or infer the following fields:
      - merchant: Name of the merchant/store. Default to "Unknown" if not found.
      - amount: Total amount paid. Default to 0 if not found. Must be a number.
      - date: Date of the transaction in YYYY-MM-DD format. Default to today's date if not found.
      - tax: Tax amount (like GST, VAT, Sales Tax) if specified. Default to 0. Must be a number.
      - category: Categorize the expense. Choose exactly one from: "Groceries", "Utilities", "Food & Dining", "Entertainment", "Travel & Transport", "Shopping", "Health & Personal Care", "Housing", "Others".
      - items: An array of items purchased, where each item has "name" (string), "price" (number), and "quantity" (number). If items are not listable, generate a single item representing the whole transaction.
      
      You must respond with ONLY a valid JSON object matching the schema. Do not write markdown tags or preambles.
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const responseTextObj = response.response;
    const resultText = typeof responseTextObj.text === 'function' ? responseTextObj.text() : responseTextObj.text;
    const parsedData = JSON.parse(resultText);
    
    return {
      merchant: parsedData.merchant || 'Unknown',
      amount: Number(parsedData.amount) || 0,
      date: parsedData.date ? new Date(parsedData.date) : new Date(),
      tax: Number(parsedData.tax) || 0,
      category: parsedData.category || 'Others',
      items: Array.isArray(parsedData.items) ? parsedData.items.map(item => ({
        name: item.name || 'Purchased Item',
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1
      })) : []
    };
  } catch (error) {
    console.warn("Gemini OCR parsing failed (possibly quota exceeded), executing local fallback parser:", error.message);
    return localParseInvoiceText(ocrText);
  }
}

// Chat with context (RAG)
export async function chatWithContext({ chatHistory, userMessage, transactionsContext, budgetsContext }) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const contextPrompt = `
      You are FINCE AI, a premium personal financial intelligence assistant.
      You help users analyze their spending, stick to their budgets, and save money.
      
      Here is the user's current transaction and expense history:
      ${JSON.stringify(transactionsContext, null, 2)}
      
      Here is the user's budget settings for this month:
      ${JSON.stringify(budgetsContext, null, 2)}
      
      Instructions:
      - Answer the user's questions based on their transaction and budget context.
      - Be encouraging, highly professional, and insightful.
      - Calculate totals, identify anomalies, and offer concrete saving tips.
      - Address the user with a friendly, expert persona.
      - If they ask about items not in their context, you can answer generally, but relate it back to their data if possible.
      
      Let's begin the chat. Keep your response brief, highly readable, and use bullet points where helpful.
    `;

    const sdkHistory = chatHistory.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: contextPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: "Understood. I am FINCE AI, your personal financial intelligence platform. I have loaded your transaction and budget records and stand ready to analyze your financial health and help you save money. How can I assist you today?" }]
        },
        ...sdkHistory
      ]
    });

    const response = await chat.sendMessage(userMessage);
    const responseTextObj = response.response;
    return typeof responseTextObj.text === 'function' ? responseTextObj.text() : responseTextObj.text;
  } catch (error) {
    console.error("Error in Gemini Chat assistant:", error);
    return "I am currently experiencing high demand on my cognitive processing network. Please review your active transaction list or try asking again in a moment.";
  }
}

// Generate weekly/monthly financial reports
export async function generateFinancialReport({ transactionsContext, budgetsContext, period = 'month' }) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      You are FINCE AI. Generate a comprehensive, beautiful financial report and saving insights document for the past ${period}.
      
      Transactions data:
      ${JSON.stringify(transactionsContext, null, 2)}
      
      Budgets data:
      ${JSON.stringify(budgetsContext, null, 2)}
      
      Generate a report with the following sections in markdown format:
      1. **Executive Summary**: General status of the user's finances.
      2. **Key Spending Metrics**: Highlight total spent, average transaction value, tax paid.
      3. **Budget Performance**: Analyze how they are doing against their budgets. Highlight categories where they exceeded or are approaching limits.
      4. **Top Merchants & Spending Drivers**: Where is the most money going?
      5. **AI Saving Recommendations**: Concrete, customized, actionable tips to save money next month.
      
      Make the report professional, readable, encouraging, and visually clear with bullet points and bold highlights.
    `;

    const response = await model.generateContent(prompt);
    const responseTextObj = response.response;
    return typeof responseTextObj.text === 'function' ? responseTextObj.text() : responseTextObj.text;
  } catch (error) {
    console.warn("Gemini report generation failed (possibly quota exceeded), using local report fallback:", error.message);
    return localGenerateFinancialReport({ transactionsContext, budgetsContext, period });
  }
}

// AI Budget Auto-Allocation based on 60 days spending history
export async function allocateBudgetWithAi({ totalLimit, categoryPercentages, categoriesList }) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      You are an expert AI Financial Allocator. The user wants to allocate a total budget of ₹${totalLimit} across their categories.
      Based on their historical spending pattern in the past 60 days (shown below as percentages), propose budget limits for each category.
      
      Historical Spending Distribution:
      ${JSON.stringify(categoryPercentages, null, 2)}
      
      Categories to allocate:
      ${JSON.stringify(categoriesList, null, 2)}
      
      Rules:
      1. Propose a budget limit for each of the categories listed above.
      2. The sum of all allocated category limits MUST be less than or equal to the total monthly budget of ₹${totalLimit}.
      3. Save some budget (at least 5-10% of totalLimit) as a buffer/savings target.
      4. Output a valid JSON response in the EXACT format:
      {
        "allocations": {
          "Groceries": limit_amount,
          "Utilities": limit_amount,
          ...
        },
        "rationale": "Briefly explain the allocation split and provide 2-3 specific savings tips based on their historical spend."
      }
      Do NOT write markdown code blocks or formatting preambles, just raw JSON.
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const responseTextObj = response.response;
    const resultText = typeof responseTextObj.text === 'function' ? responseTextObj.text() : responseTextObj.text;
    return JSON.parse(resultText);
  } catch (error) {
    console.warn("Gemini budget allocation failed (possibly quota exceeded), using local budget fallback:", error.message);
    return localAllocateBudgetWithAi({ totalLimit, categoryPercentages, categoriesList });
  }
}

// AI Spend Pattern Auditor (Comparing current vs last month category spends)
export async function generateSavingsAuditReport({ currentMonthData, lastMonthData, username }) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      You are FINCE AI, an advanced Personal Financial Auditor. 
      Compare the user's spending patterns for this month vs last month. Provide an audit report analyzing changes and giving actionable saving advice.
      
      User: ${username}
      
      This Month's Category Spends:
      ${JSON.stringify(currentMonthData, null, 2)}
      
      Last Month's Category Spends:
      ${JSON.stringify(lastMonthData, null, 2)}
      
      Instructions:
      1. Analyze the category spends and identify which category increased the most and which decreased the most.
      2. Calculate the total spending delta (difference in amount and percentage).
      3. Provide concrete saving strategies (3-4 bullet points) targeted at categories where spending grew.
      4. Write your response in clean markdown. Keep it engaging, highly professional, and easy to read. Relate advice to Indian Rupees (₹).
    `;

    const response = await model.generateContent(prompt);
    const responseTextObj = response.response;
    return typeof responseTextObj.text === 'function' ? responseTextObj.text() : responseTextObj.text;
  } catch (error) {
    console.warn("Gemini savings audit failed (possibly quota exceeded), executing local auditor fallback:", error.message);
    return localGenerateSavingsAuditReport({ currentMonthData, lastMonthData, username });
  }
}
