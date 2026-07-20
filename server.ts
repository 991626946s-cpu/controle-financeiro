import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to read database
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return {};
  }
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro lendo banco de dados:", err);
    return {};
  }
}

// Helper to write database
function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro salvando banco de dados:", err);
  }
}

// Simple function to generate a 6-character random sync code
function generateSyncCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'SYNC-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Default initial state template
function createDefaultState(syncCode: string) {
  return {
    syncCode,
    preferences: {
      baseCurrency: "BRL",
      userName: "Explorador",
    },
    banks: [
      {
        bankId: "manual",
        name: "Carteira / Manual",
        connected: true,
        balance: 450.0,
        currency: "BRL",
        lastSync: new Date().toISOString(),
      },
      {
        bankId: "nubank",
        name: "Nubank",
        connected: false,
        balance: 0,
        currency: "BRL",
        lastSync: null,
      },
      {
        bankId: "itau",
        name: "Itaú Unibanco",
        connected: false,
        balance: 0,
        currency: "BRL",
        lastSync: null,
      },
      {
        bankId: "bb",
        name: "Banco do Brasil",
        connected: false,
        balance: 0,
        currency: "BRL",
        lastSync: null,
      },
      {
        bankId: "bradesco",
        name: "Bradesco",
        connected: false,
        balance: 0,
        currency: "BRL",
        lastSync: null,
      },
    ],
    budgets: [
      { category: "Alimentação", limit: 1200, currency: "BRL" },
      { category: "Lazer", limit: 500, currency: "BRL" },
      { category: "Transporte", limit: 400, currency: "BRL" },
      { category: "Moradia", limit: 2500, currency: "BRL" },
    ],
    transactions: [
      {
        id: "t1",
        description: "Salário Mensal",
        amount: 5500.0,
        type: "income",
        category: "Salário",
        date: "2026-07-01",
        currency: "BRL",
        bankId: "manual",
      },
      {
        id: "t2",
        description: "Supermercado Pão de Açúcar",
        amount: 450.0,
        type: "expense",
        category: "Alimentação",
        date: "2026-07-05",
        currency: "BRL",
        bankId: "manual",
      },
      {
        id: "t3",
        description: "Aluguel Apartamento",
        amount: 2200.0,
        type: "expense",
        category: "Moradia",
        date: "2026-07-10",
        currency: "BRL",
        bankId: "manual",
      },
      {
        id: "t4",
        description: "Assinatura Netflix",
        amount: 14.99,
        type: "expense",
        category: "Lazer",
        date: "2026-07-12",
        currency: "USD",
        bankId: "manual",
      },
      {
        id: "t5",
        description: "Freelance Design UI",
        amount: 350.0,
        type: "income",
        category: "Salário",
        date: "2026-07-14",
        currency: "USD",
        bankId: "manual",
      },
      {
        id: "t6",
        description: "Uber Viagem Trabalho",
        amount: 32.5,
        type: "expense",
        category: "Transporte",
        date: "2026-07-15",
        currency: "BRL",
        bankId: "manual",
      },
      {
        id: "t7",
        description: "Jantar Restaurante Japonês",
        amount: 180.0,
        type: "expense",
        category: "Alimentação",
        date: "2026-07-16",
        currency: "BRL",
        bankId: "manual",
      },
    ],
    lastUpdated: Date.now(),
  };
}

// Lazy initializer for Google GenAI client to prevent crashes if key is missing
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY não configurada nas variáveis de ambiente.");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// 1. Sync routes
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, baseCurrency } = req.body;
  if (!name || !email || !password || !baseCurrency) {
    return res.status(400).json({ success: false, error: "Todos os campos são obrigatórios." });
  }

  const db = readDB();
  db.users = db.users || {};

  const emailLower = email.toLowerCase().trim();
  if (db.users[emailLower]) {
    return res.status(400).json({ success: false, error: "Este e-mail já está cadastrado." });
  }

  // Create a new unique syncCode for this user
  let code = generateSyncCode();
  while (db[code]) {
    code = generateSyncCode();
  }

  // Create user
  const userId = "usr_" + Math.random().toString(36).substr(2, 9);
  const newUser = {
    id: userId,
    name: name.trim(),
    email: emailLower,
    password, // For full simplicity and direct local storage, we store the password
    baseCurrency,
    syncCode: code,
    createdAt: Date.now(),
  };

  db.users[emailLower] = newUser;

  // Initialize their financial database with default state & custom preferences
  const initialState = createDefaultState(code);
  initialState.preferences.userName = name.trim();
  initialState.preferences.baseCurrency = baseCurrency;
  
  // Set budget currency to user's selected base currency
  initialState.budgets = initialState.budgets.map(b => ({
    ...b,
    currency: baseCurrency
  }));

  db[code] = initialState;
  writeDB(db);

  // Return session (excluding password)
  const { password: _, ...userWithoutPassword } = newUser;
  res.json({
    success: true,
    user: userWithoutPassword,
    token: "session_token_" + userId
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "E-mail e senha são obrigatórios." });
  }

  const db = readDB();
  db.users = db.users || {};

  const emailLower = email.toLowerCase().trim();
  const user = db.users[emailLower];

  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, error: "E-mail ou senha incorretos." });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    success: true,
    user: userWithoutPassword,
    token: "session_token_" + user.id
  });
});

app.post("/api/auth/supabase", (req, res) => {
  const { email, name, supabaseUid, supabaseProvider, baseCurrency } = req.body;
  if (!email || !supabaseUid || !supabaseProvider) {
    return res.status(400).json({ success: false, error: "Parâmetros do Supabase inválidos." });
  }

  const db = readDB();
  db.users = db.users || {};

  const emailLower = email.toLowerCase().trim();
  let user = db.users[emailLower];

  if (user) {
    // Exists, link to Supabase
    user.isSupabase = true;
    user.supabaseUid = supabaseUid;
    user.supabaseProvider = supabaseProvider;
    db.users[emailLower] = user;
    writeDB(db);
  } else {
    // Create new user linked to Supabase
    let code = generateSyncCode();
    while (db[code]) {
      code = generateSyncCode();
    }

    const userId = "usr_" + Math.random().toString(36).substr(2, 9);
    user = {
      id: userId,
      name: name ? name.trim() : emailLower.split('@')[0],
      email: emailLower,
      baseCurrency: baseCurrency || "BRL",
      syncCode: code,
      createdAt: Date.now(),
      isSupabase: true,
      supabaseUid,
      supabaseProvider,
    };

    db.users[emailLower] = user;

    // Initialize state
    const initialState = createDefaultState(code);
    initialState.preferences.userName = user.name;
    initialState.preferences.baseCurrency = user.baseCurrency;
    initialState.budgets = initialState.budgets.map(b => ({
      ...b,
      currency: user.baseCurrency
    }));

    db[code] = initialState;
    writeDB(db);
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    success: true,
    user: userWithoutPassword,
    token: "supabase_token_" + supabaseUid
  });
});

app.post("/api/auth/update-password", (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: "Campos obrigatórios ausentes." });
  }

  const db = readDB();
  db.users = db.users || {};

  const emailLower = email.toLowerCase().trim();
  const user = db.users[emailLower];

  if (!user || user.password !== currentPassword) {
    return res.status(401).json({ success: false, error: "Senha atual incorreta." });
  }

  user.password = newPassword;
  db.users[emailLower] = user;
  writeDB(db);

  res.json({ success: true });
});

app.get("/api/sync/:code", (req, res) => {
  const code = req.params.code.toUpperCase();
  const db = readDB();

  if (!db[code]) {
    // Generate and save default state if sync code is new
    const newState = createDefaultState(code);
    db[code] = newState;
    writeDB(db);
  }

  res.json(db[code]);
});

app.post("/api/sync/:code", (req, res) => {
  const code = req.params.code.toUpperCase();
  const newState = req.body;
  const db = readDB();

  db[code] = {
    ...newState,
    syncCode: code,
    lastUpdated: Date.now(),
  };
  writeDB(db);

  res.json({ success: true, lastUpdated: db[code].lastUpdated });
});

// 2. Gemini-powered Financial Advisor & Spend Analysis Route
app.post("/api/insights", async (req, res) => {
  const { transactions, budgets, preferences, systemInstruction: customSystemInstruction } = req.body;
  const baseCurrency = preferences?.baseCurrency || "BRL";
  const userName = preferences?.userName || "Usuário";

  // Formulate a compact financial summary to send to Gemini
  const summaryText = `
    Análise de Gastos Mensal para o usuário "${userName}".
    Moeda Principal de Exibição: ${baseCurrency}

    Orçamentos Definidos:
    ${budgets ? budgets.map((b: any) => `- Categoria: ${b.category}, Limite: ${b.limit} ${b.currency}`).join("\n") : "Nenhum orçamento configurado."}

    Transações Recentes:
    ${transactions ? transactions.map((t: any) => `- Descrição: ${t.description}, Valor: ${t.amount} ${t.currency}, Tipo: ${t.type}, Categoria: ${t.category}, Data: ${t.date}`).join("\n") : "Nenhuma transação cadastrada."}
  `;

  const systemInstruction = customSystemInstruction || `
    Você é um Consultor Financeiro Pessoal de Inteligência Artificial amigável, altamente capacitado e direto ao ponto.
    Seu objetivo é analisar os gastos mensais do usuário e fornecer um relatório estratégico formatado em Markdown rico, legível e profissional em PORTUGUÊS.
    
    A estrutura do seu relatório deve ser:
    1. **Resumo Executivo (Painel Geral)**: Um panorama rápido sobre as receitas e despesas. Calcule e cite o saldo líquido consolidado de forma estimativa se possível.
    2. **Análise por Categorias e Orçamentos**: Destaque se algum orçamento foi ultrapassado ou está próximo do limite. Dê feedback construtivo.
    3. **Padrões de Gastos Encontrados**: Comente sobre recorrência ou gastos impulsivos (ex: restaurantes, assinaturas em moedas estrangeiras como USD/EUR).
    4. **3 Recomendações Práticas**: Forneça três dicas curtas e acionáveis para o usuário economizar, investir ou reorganizar suas finanças este mês.
    
    Seja motivador, use tom amigável e focado em saúde financeira.
    Não mencione que você é um modelo de linguagem ou que simula nada. Aja como o consultor pessoal integrado ao aplicativo.
  `;

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { role: "user", parts: [{ text: `${systemInstruction}\n\nAqui estão os dados financeiros:\n${summaryText}` }] }
      ]
    });

    res.json({
      success: true,
      insight: response.text || "Não foi possível gerar a análise neste momento. Tente novamente mais tarde."
    });
  } catch (error: any) {
    console.error("Erro na API do Gemini:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Erro interno ao processar inteligência artificial."
    });
  }
});

// 2b. Teste de Estresse Financeiro ("E se eu perder o emprego?")
app.post("/api/stress-test", async (req, res) => {
  const { transactions, banks, investments, targetMonths = 6, customReserves, preferences } = req.body;
  const baseCurrency = preferences?.baseCurrency || "BRL";
  const userName = preferences?.userName || "Usuário";

  try {
    // 1. Calculate liquid reserves
    let calculatedReserves = 0;
    if (customReserves !== undefined && customReserves !== null && customReserves !== "") {
      calculatedReserves = Number(customReserves);
    } else {
      // Sum of all connected bank accounts
      const bankSum = (banks || []).reduce((acc: number, b: any) => acc + (b.connected ? Number(b.balance || 0) : 0), 0);
      // Sum of all investments
      const investSum = (investments || []).reduce((acc: number, i: any) => acc + Number(i.amount || 0), 0);
      calculatedReserves = bankSum + investSum;
    }

    // 2. Identify monthly expense average
    // Group transactions by YYYY-MM
    const expenses = (transactions || []).filter((t: any) => t.type === 'expense');
    const expenseByMonth: { [key: string]: number } = {};
    const expenseByCategory: { [key: string]: number } = {};

    expenses.forEach((t: any) => {
      const amt = Number(t.amount || 0);
      // Group by category
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + amt;
      
      // Group by month
      if (t.date) {
        const monthKey = t.date.substring(0, 7); // YYYY-MM
        expenseByMonth[monthKey] = (expenseByMonth[monthKey] || 0) + amt;
      }
    });

    const monthCount = Math.max(Object.keys(expenseByMonth).length, 1);
    const totalExpenseSum = expenses.reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
    const monthlyBurnRate = totalExpenseSum / monthCount;

    // Let's also classify essential vs variable categories
    let essentialMonthly = 0;
    let variableMonthly = 0;

    Object.entries(expenseByCategory).forEach(([category, total]) => {
      const avg = total / monthCount;
      if (["Moradia", "Saúde", "Educação", "Transporte"].includes(category)) {
        essentialMonthly += avg;
      } else {
        variableMonthly += avg;
      }
    });

    // If there are no expenses, default to 1 to avoid division by zero
    const finalBurnRate = Math.max(monthlyBurnRate, 1);
    
    // Calculate survival duration mathematically
    const rawMonths = calculatedReserves / finalBurnRate;
    const survivalMonths = Math.floor(rawMonths);
    const survivalDays = Math.round((rawMonths - survivalMonths) * 30);

    // Required monthly reduction to make current reserves survive targetMonths
    const requiredMonthlyReduction = Math.max(0, finalBurnRate - (calculatedReserves / targetMonths));

    const promptText = `
      Realize um Teste de Estresse Financeiro ("E se eu perder o emprego?") para o usuário "${userName}".
      Ele quer saber quanto tempo as suas reservas financeiras durariam se sua renda zerar hoje e quais cortes devem ser priorizados.

      Dados Consolidados das Contas do Usuário:
      - Reservas Totais (Saldo Bancário + Investimentos): ${calculatedReserves.toFixed(2)} ${baseCurrency}
      - Ritmo de Gasto Mensal Atual (Burn Rate): ${finalBurnRate.toFixed(2)} ${baseCurrency}
      - Despesas Essenciais Mensais Estimadas: ${essentialMonthly.toFixed(2)} ${baseCurrency}
      - Despesas Variáveis/Supérfluas Mensais Estimadas: ${variableMonthly.toFixed(2)} ${baseCurrency}
      - Objetivo de Sobrevivência Sem Renda: ${targetMonths} meses
      - Necessidade Matemática de Redução Mensal para atingir o objetivo: ${requiredMonthlyReduction.toFixed(2)} ${baseCurrency}

      Histórico detalhado de despesas por categoria:
      ${Object.entries(expenseByCategory).map(([cat, val]) => `- ${cat}: ${(val / monthCount).toFixed(2)} ${baseCurrency}/mês`).join("\n")}

      Transações mais frequentes ou caras:
      ${expenses.slice(0, 15).map((t: any) => `- ${t.description}: ${t.amount} ${t.currency} (${t.category}) em ${t.date}`).join("\n")}

      INSTRUÇÕES PARA O RELATÓRIO DA IA:
      1. O cálculo matemático prévio indica exatamente ${survivalMonths} meses e ${survivalDays} dias de sobrevivência. Retorne exatamente isso nos campos de inteiros correspondentes do JSON.
      2. Apresente um relatório em formato Markdown realista, empático, sério e focado em segurança familiar no campo "detailedMarkdownReport". Use subtítulos claros.
      3. Identifique na lista de transações e categorias onde exatamente o usuário pode cortar custos imediatamente (ex: assinaturas específicas, compras excessivas, refeições fora de casa, lazer). Sugira cortes reais baseados nas transações fornecidas!
      4. No campo "cutSuggestions" do JSON, fornecer uma lista detalhada de sugestões de cortes específicas para as categorias de gastos variáveis do usuário, indicando o valor atual estimado gasto nelas por mês, o valor de corte recomendado e uma justificativa acionável em português.
    `;

    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            survivalMonths: { type: Type.INTEGER },
            survivalDays: { type: Type.INTEGER },
            totalReserves: { type: Type.NUMBER },
            monthlyBurnRate: { type: Type.NUMBER },
            essentialMonthlyExpenses: { type: Type.NUMBER },
            variableMonthlyExpenses: { type: Type.NUMBER },
            requiredMonthlyReduction: { type: Type.NUMBER },
            cutSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  currentSpent: { type: Type.NUMBER },
                  recommendedCut: { type: Type.NUMBER },
                  description: { type: Type.STRING }
                },
                required: ["category", "currentSpent", "recommendedCut", "description"]
              }
            },
            detailedMarkdownReport: { type: Type.STRING }
          },
          required: [
            "survivalMonths",
            "survivalDays",
            "totalReserves",
            "monthlyBurnRate",
            "essentialMonthlyExpenses",
            "variableMonthlyExpenses",
            "requiredMonthlyReduction",
            "cutSuggestions",
            "detailedMarkdownReport"
          ]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");

    res.json({
      success: true,
      data: parsedData
    });
  } catch (error: any) {
    console.error("Erro na API de Teste de Estresse:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Erro interno ao processar teste de estresse financeiro."
    });
  }
});

// 3. Vite development middleware / Static production serve
async function boot() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

boot();
