import { Investment, Transaction } from '../types';
import { generateInvestmentYields, supabase } from '../hooks/useFinanceState';

export const saveInvestmentYields = async (investment: Investment) => {
  // Try to insert into Supabase "transactions" table if supabase is connected and user is logged in
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const yields = generateInvestmentYields(investment);
      const promises = yields.map(async (transaction) => {
        return await supabase
          .from('transacoes')
          .insert([{
            ...transaction,
            user_id: user.id,
            createdAt: new Date().toISOString()
          }]);
      });
      await Promise.all(promises);
      return { success: true };
    }
  } catch (err) {
    console.warn("Supabase saveInvestmentYields failed or not configured, using local simulation:", err);
  }

  // Fallback: Modo de Simulação Inteligente / Fallback
  console.log("Supabase SDK não configurado ou offline. Simulando persistência de rendimentos para:", investment);
  const yields = generateInvestmentYields(investment);
  console.log("Rendimentos gerados (Simulação):", yields);
  
  // Simular delay de rede para maior fidelidade visual
  await new Promise(resolve => setTimeout(resolve, 800));
  return { success: true, simulated: true };
};

/**
 * Consulta e retorna todas as transações persistidas no Supabase para o usuário logado
 */
export const getUserTransactions = async (): Promise<Transaction[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn("Usuário não autenticado.");
      return [];
    }

    const { data, error } = await supabase
      .from('transacoes')
      .select('*')
      .eq('user_id', user.id); // Certifique-se de que user.id está definido

    if (error) throw error;
    return (data || []) as Transaction[];
  } catch (err) {
    console.warn("Supabase getUserTransactions falhou:", err);
    return [];
  }
};