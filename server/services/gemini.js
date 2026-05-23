import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Ensure the API Key is loaded
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment variables!");
}

// In the standard @google/generative-ai library, the package export is GoogleGenerativeAI
const genAI = new GoogleGenerativeAI(apiKey || '');

// Helper to clean and format text
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
    
    // Fallback normalization
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
    console.error("Error analyzing invoice with Gemini:", error);
    // Return sensible defaults in case of failure
    return {
      merchant: 'Parsing Error',
      amount: 0,
      date: new Date(),
      tax: 0,
      category: 'Others',
      items: [{ name: 'Failed to extract items', price: 0, quantity: 1 }]
    };
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

    // Reconstruct conversation history format for SDK
    const sdkHistory = chatHistory.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Insert the system/context prompt at the beginning of the chat or as a system instruction
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
    return "I'm sorry, I encountered an issue accessing my intelligence engine. Please try again in a moment.";
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
    console.error("Error generating report with Gemini:", error);
    return "Failed to generate financial report due to connection issues. Please check back later.";
  }
}

// 4. AI Budget Auto-Allocation based on 60 days spending history
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
    console.error("Error allocating budget with Gemini:", error);
    // Fallback: equal distribution with remaining as buffer
    const count = categoriesList.length;
    const limitPerCat = Math.floor((totalLimit * 0.9) / count);
    const allocations = {};
    categoriesList.forEach(c => allocations[c] = limitPerCat);
    return {
      allocations,
      rationale: "Encountered parsing error with AI engine. Equal split (90% total budget) applied across categories as a fallback."
    };
  }
}

// 5. AI Spend Pattern Auditor (Comparing current vs last month category spends)
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
    console.error("Error auditing savings:", error);
    return "AI Auditor is currently processing other requests. Please check back shortly.";
  }
}
