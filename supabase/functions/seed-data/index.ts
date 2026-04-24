import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'admin@gmail.com')
      .maybeSingle();

    if (existingAdmin) {
      return new Response(JSON.stringify({ message: 'Seed data already exists' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create admin auth user
    const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: 'admin@gmail.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: { username: 'admin', first_name: 'Admin', last_name: '' },
    });

    if (adminAuthError) throw adminAuthError;

    // Wait for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update admin profile to active
    await supabase
      .from('profiles')
      .update({ registration_status: 'active' })
      .eq('user_id', adminAuth.user.id);

    // Add admin role
    await supabase
      .from('user_roles')
      .insert({ user_id: adminAuth.user.id, role: 'admin' });

    // Seed default tasks
    await supabase.from('tasks').insert([
      {
        title: 'Follow on Twitter',
        description: 'Follow our official Twitter account and like the pinned post.',
        reward_amount: 2.50,
        type: 'social',
        platform: 'Twitter',
        link: 'https://twitter.com/entrevault',
        category: 'Social Media',
        difficulty: 'Easy',
        max_completions: 100,
        created_by: adminAuth.user.id,
      },
      {
        title: 'Create Promotional Video',
        description: 'Create a 60-second promotional video about EntreVault and share on YouTube.',
        reward_amount: 15.00,
        type: 'video',
        platform: 'YouTube',
        link: '',
        category: 'Content Creation',
        difficulty: 'Hard',
        max_completions: 20,
        created_by: adminAuth.user.id,
      },
      {
        title: 'Join Telegram Group',
        description: 'Join our official Telegram group and introduce yourself.',
        reward_amount: 1.00,
        type: 'social',
        platform: 'Telegram',
        link: 'https://t.me/entrevault',
        category: 'Social Media',
        difficulty: 'Easy',
        max_completions: 500,
        created_by: adminAuth.user.id,
      },
    ]);

    // Seed admin settings
    await supabase.from('admin_settings').insert({
      registration_fee: 10,
      referral_bonus_percent: 10,
      admin_wallet_address: 'TRC20WalletAddressHere',
      payment_instructions: 'Send the registration fee to the wallet address below. After payment, upload a screenshot of your transaction.',
      minipay_number: '+1234567890',
    });

    return new Response(JSON.stringify({ message: 'Seed data created successfully', adminEmail: 'admin@gmail.com', adminPassword: 'admin123' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
