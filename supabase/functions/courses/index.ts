import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { camelCase } from 'https://deno.land/x/camelcase/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
};

Deno.serve(async (req: Request) => {
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
    
    const idPattern = new URLPattern({ pathname: '/courses/:id' });
    const matchingPath = idPattern.exec(url);
    const id = matchingPath ? matchingPath.pathname.groups.id : null;
    
    switch (method) {
      case 'DELETE':
        return await removeExisting(client, user.id, id);
      case 'PATCH':
        return await updateExisting(client, user.id, id);
      case 'POST': // Accepts multiparts and json
        let form = { fields: {} };
        const contentType = req.headers.get('content-type');
        // JSON submission
        if (contentType.startsWith('application/json')) {
          const jsonBody = await req.json();
          for (const [key, value] of Object.entries(jsonBody)) {
            if (key === 'cert') {
              const { content, mimeType } = jsonBody.cert;
              form.cert = new Blob([_hexToByteArray(atob(content))], { type: mimeType });
            } else {
              form.fields[key] = value;
            }
          }
        } else { // TODO: should check blob contents match content type
          // Multipart form
          const formBody = await req.formData();
          for (const [key, value] of formBody.entries()) {
            if (key === 'cert') {
              const f = formBody.get(key);
              if (!f.type.startsWith('image')) {
                return new Response(JSON.stringify({
                  error: 'contents must be a valid content type'
                }), {
                  headers: { ...corsHeaders },
                  status: 400
                });
              }
              const data = await f.text();
              form.cert = new Blob([_hexToByteArray(data)], { type: f.type });
            } else {
              form.fields[key] = value;
            }
          }
        }
        return await registerNew(client, user.id, form);
      case 'GET':
        return id ? await getRegistered(client, user.id, id) : await getRegistered(client, user.id);
      default:
        return await getRegistered(client, user.id);
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});

async function getRegistered (client, user, id = null): Response {
  let qb = client.from('Courses').select('id,created_at,name,attended,location,credit_hours');
  
  if (id) {
    qb = qb.eq('id', id);
  }
  
  const { data, error } = await qb.eq('user_id', user);

  if (error) {
    console.error(error);
    return new Response({ error: `Code ${error.code} - please try again later` }, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }

  let normalized = _normalize(data);

  if (id && data) {
    const { id: cid, createdAt } = normalized[0];
    const created = Date.parse(createdAt);
    const hashedFilename = await _hash(`${cid}:${created}`);
    const pathname = `${user}/${hashedFilename}.cme`;
    // 5 min usable url
    const uniqueSignedUrl = await client.storage.from('certs').createSignedUrl(pathname, 300, {
      download: true,
    });
    normalized[0].asset = uniqueSignedUrl.data;
  }

  return new Response(JSON.stringify(normalized), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  });
}

async function registerNew (client, user, form): Promise<Response> {
  const { fields, cert } = form;
  const { name, attended, location, creditHours } = fields;

  const { data, error } = await client.from('Courses').insert([
    { 'user_id': user, 'credit_hours': creditHours, location, attended, name },
  ]).select('id,created_at');

  if (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: `Code ${error.code} - please try again later` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }

  const { id, createdAt } = _normalize(data)[0];
  const created = Date.parse(createdAt);

  try {
    await uploadCert(client, user, cert, `${id}:${created}`);
  } catch (err) {
    console.error(err);
    // TODO: delete record since upload failed
    return new Response(JSON.stringify({ error: err.error }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }

  return new Response(JSON.stringify({ created: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 201
  });
}

async function updateExisting (client, user, id): Promise<Response> {
  return new Response('not implemented', {
    headers: { ...corsHeaders },
    status: 200
  });
}

async function removeExisting (client, user, id): Promise<Response> {
  const { data, error } = await client.from('Courses').select('created_at').eq('id', id);

  if (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: `Code ${error.code} - please try again later` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
  const { createdAt } = _normalize(data)[0];
  const created = Date.parse(createdAt);
  const computedFilename = await _hash(`${id}:${created}`);
  const storagePath = `${user}/${computedFilename}.cme`;

  const { data: storageData, error: storageError } = await client.storage.from('certs').remove([storagePath]);

  if (storageError) {
    console.error(storageError);
    return new Response(JSON.stringify({ error: `Code ${storageError.code}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }

  const { error: dbError } = await client.from('Courses').delete().eq('id', id);
  
  if (dbError) {
    console.error(dbError);
    return new Response(JSON.stringify({ error: `Code ${dbError.code} - please try again later` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
  
  return new Response(null, {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 204
  });
}

async function uploadCert (client, user, file, rehashableFilename): Promise<Response> {
  const filename = await _hash(rehashableFilename);
  // generate pathname based on uid
  const pathname = `${user}/${filename}.cme`;
  // create new asset in bucket
  const { error } = await client.storage.from('certs').upload(pathname, file);
  if (error) {
    console.error(error);
    return new Response(JSON.stringify({}), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

async function _hash (str, algo = 'SHA-256'): Promise<str> {
  if (typeof str !== 'string') {
    throw new Error('TypeError: data must be a string');
  }
  // Convert the data to a Uint8Array
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(str);
  // Use the Web Crypto API to hash the data
  const hashBuffer = await crypto.subtle.digest(algo, encodedData);
  // Convert the hash buffer to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

function _normalize (data: Array<T>): Array<T> {
  // Transform every object key into camelcase
  return data.map((row) => Object.entries(row).reduce((acc, [key, value]) => {
    acc[camelCase(key)] = value;
    return acc;
  }, {}));
}

function _hexToByteArray (hex: string): Uint8array {
  // Remove any non-hex characters
  const sanitizedHex = hex.replace(/[^0-9A-Fa-f]/g, '');
  // Create a Uint8Array of half the length of the hex string
  const byteLength = sanitizedHex.length / 2;
  const byteArray = new Uint8Array(byteLength);
  for (let i = 0; i < byteLength; i++) {
    // Get each pair of hex characters
    const hexPair = sanitizedHex.substr(i * 2, 2);
    // Convert hex pair to an integer and store in the byte array
    byteArray[i] = parseInt(hexPair, 16);
  }
  return byteArray;
}
