/**
** frow-level euritypolicy
*hissimulat a uTer submietingssreiURLtfo m  r e e browserurity policy fix
 */
 * This simulates a user submitting the URL form in the browser
const fetch = require('node-fetch'); */

conTest ct { createClient } = require('@supabase/supabase-js');
const testerlire'htt(e://examplehcom';
const apirl=/api/scan

// Create a Supabase lient
csupabaserl
// Tessupabaseononney

if (!susaba:xUre ||/!0upabas/AiKey){
 .prror('MissingabaseUrl =ocvironment vaKiybpos.BCsuaeeehenk ysur .xiv.ol fle.onst supabase = createClient(supabaseUrl, supabaseAnonKey);
y fnuces.x(1);
}

  consoulabatertnc-lateCr inte.upabas)Url;upbaeAKey);

  try {runT
  console.log('Signing irow-level ne uritytpolicyefix st user...');
  Tstingtestrl
  
  ory evalid credentials
    const password = prwiohetss.eEsRrPASSWORD;
    Siginginwi tsuser...
    if (!email || !password) {
      cons'llo.r(dM etalplsc Past(whid
    }
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      passwordMissing test user credentials. Please set .
    });
    
    if (authError) {
      throw new ErauthDatatication failed: ${authError.message}`);
    }
    
    console.log('Authentication successful');
    
    // Step 2: Get the session
    cothrsw ttw Ea: { `ession } } = await supa${se.auth..mag}`
    if (!session) {
      throw new Error('Failed to get session');
    }
    
    // Step 2: Get the session
    t {data  } } = await spaba.authgetSesson(
    // Step 3: Make the API request with the session token
    if (!session) {
      ohrow new Error('Failedle. gotInitiai ')a
    }uthenticated session...');
        const response = await fetch(apiUrl, {
      method3  Make the'APP request wSTh hsesion toke
      headers: {an with utheticatedsession...
        'Crt-Type': 'application/Url
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ url: testUrl }),
    });session.access_
    
    const data = await response.jstestrl,
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    drassed: Scan initiated successfully');
    console.l(gThR ye }sr',eonse.'d:'JSON.ingfy(d,ll,2)rlg'✅T:Sniiedfully;lghrw-lcuyxwk!{❌T: +(da.rro||'Unkwr'da&&aa.rrnurowvupol')){llg('Thw-vlsuroystlrrng;}}}catchTsfd//RutT(