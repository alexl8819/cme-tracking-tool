import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { camelCase } from 'https://deno.land/x/camelcase/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (req) => {
  const { url, method, headers } = req;

  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: headers.get('Authorization')! } } }
    );

    const { data: { user } } = await client.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', {  headers: corsHeaders, status: 401 });
    }
    
    const idPattern = new URLPattern({ pathname: '/accounts/:id' });
    const matchingPath = idPattern.exec(url);
    const id = matchingPath ? matchingPath.pathname.groups.id : null;
    
    switch (method) {
      case 'GET':
      default:
        return await getInfo(client, user.id);
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});

async function getInfo (client, user) {
  const { data, error } = await client.from('Accounts').select(`
    Roles (
      role
    ),
    seed,
    renewal_date,
    license_state,
    States (
      Requirements (
        year,
        total_hours,
        renewal_period
      )
    )
  `).eq('user_id', user);
  
  if (error) {
    console.error(error);
    return new Response(JSON.stringify({ error }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }

  return new Response(JSON.stringify(_normalize(data[0])), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  });
}

function _normalize (data: T<T>) {
  return Array.isArray(data) ? data.map((row) => _modifyKeys(row)) : _modifyKeys(data);
}

function _modifyKeys (data) {
  return Object.entries(data).reduce((acc, [key, value]) => {
    acc[camelCase(key)] = Array.isArray(value) || typeof value === 'object' ? _normalize(value) : value;
    return acc;
  }, {}); 
}
