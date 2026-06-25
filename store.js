// Configurações do Supabase (O usuário deve preencher com seus dados do painel do Supabase)
const SUPABASE_URL = 'https://afqxeabdvcareydozorb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Dco6rqqi69oNqy2aky2FYQ_Lew4LJuQ';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const Store = {
    ADMIN_EMAIL: 'master@desafio.com',

    async registerUser(name, email, initialWeight) {
        const targetWeight = parseFloat(initialWeight) * 0.96;
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30);

        // 1. Inserir usuário
        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .insert([{ 
                name, 
                email, 
                initial_weight: parseFloat(initialWeight), 
                target_weight: targetWeight,
                goal_start_weight: parseFloat(initialWeight),
                goal_deadline: deadline.toISOString()
            }])
            .select()
            .single();

        if (userError) throw new Error('Erro ao cadastrar: ' + userError.message);

        // 2. Inserir primeiro peso no histórico
        const { error: weightError } = await supabaseClient
            .from('weights')
            .insert([{ 
                user_email: email, 
                weight: parseFloat(initialWeight) 
            }]);

        if (weightError) throw weightError;

        return await this.getUserByEmail(email);
    },

    async getUserByEmail(email) {
        // Busca usuário e seu histórico de pesos
        const { data: user, error } = await supabaseClient
            .from('users')
            .select(`
                *,
                weights (
                    weight,
                    recorded_at
                )
            `)
            .eq('email', email)
            .maybeSingle();

        if (error || !user) return null;

        // Mapear para o formato que o app já usa
        return {
            name: user.name,
            email: user.email,
            initialWeight: user.initial_weight,
            targetWeight: user.target_weight,
            goalStartWeight: user.goal_start_weight !== null && user.goal_start_weight !== undefined ? user.goal_start_weight : user.initial_weight,
            goalDeadline: user.goal_deadline || null,
            history: (user.weights || []).map(w => ({
                date: w.recorded_at,
                weight: w.weight
            })).sort((a, b) => new Date(a.date) - new Date(b.date))
        };
    },

    async addWeightEntry(email, weight) {
        const { error } = await supabaseClient
            .from('weights')
            .insert([{ 
                user_email: email, 
                weight: parseFloat(weight) 
            }]);

        if (error) throw error;
        return await this.getUserByEmail(email);
    },

    async getAllUsers() {
        const { data: users, error } = await supabaseClient
            .from('users')
            .select(`
                *,
                weights (
                    weight,
                    recorded_at
                )
            `);

        if (error) throw error;

        return users.map(user => ({
            name: user.name,
            email: user.email,
            initialWeight: user.initial_weight,
            targetWeight: user.target_weight,
            goalStartWeight: user.goal_start_weight !== null && user.goal_start_weight !== undefined ? user.goal_start_weight : user.initial_weight,
            goalDeadline: user.goal_deadline || null,
            history: (user.weights || []).map(w => ({
                date: w.recorded_at,
                weight: w.weight
            })).sort((a, b) => new Date(a.date) - new Date(b.date))
        }));
    },

    async deleteUser(email) {
        const { error } = await supabaseClient
            .from('users')
            .delete()
            .eq('email', email);
        
        if (error) throw error;
    },

    async updateInitialWeight(email, newWeight) {
        const targetWeight = parseFloat(newWeight) * 0.96;

        // 1. Atualizar cadastro
        const { error: userError } = await supabaseClient
            .from('users')
            .update({ 
                initial_weight: parseFloat(newWeight),
                target_weight: targetWeight,
                goal_start_weight: parseFloat(newWeight)
            })
            .eq('email', email);

        if (userError) throw userError;

        // 2. Opcional: O fiscal pode querer apenas ajustar, mas o histórico permanece.
        // Aqui vamos apenas atualizar o cadastro e a meta.
    },

    async updateUserGoal(email, targetWeight, goalStartWeight, goalDeadline) {
        const { error } = await supabaseClient
            .from('users')
            .update({
                target_weight: parseFloat(targetWeight),
                goal_start_weight: parseFloat(goalStartWeight),
                goal_deadline: goalDeadline ? new Date(goalDeadline).toISOString() : null
            })
            .eq('email', email);

        if (error) throw error;
        return await this.getUserByEmail(email);
    },

    isAdmin(email) {
        return email === this.ADMIN_EMAIL;
    }
};
