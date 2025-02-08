import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import OpenAI from 'npm:openai@4.24.1';

interface RequestBody {
  userPrompt: string;
  context?: string;
}

console.info('AI Agent Edge Function started');

// Log environment variables (without exposing sensitive values)
console.info('Environment check:', {
  OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY') ? 'set' : 'missing',
  EDGE_RUNTIME_SUPABASE_URL: Deno.env.get('EDGE_RUNTIME_SUPABASE_URL') ? 'set' : 'missing',
  EDGE_RUNTIME_SUPABASE_ROLE_KEY: Deno.env.get('EDGE_RUNTIME_SUPABASE_ROLE_KEY') ? 'set' : 'missing',
});

// Common headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

Deno.serve(async (req: Request) => {
  try {
    // Log request details
    console.info('Request received:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
    });

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          error: 'Method not allowed',
          details: `Expected POST but got ${req.method}`
        }), 
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get request body
    let body;
    try {
      const text = await req.text();
      console.info('Request body (raw):', text);
      body = JSON.parse(text) as RequestBody;
      console.info('Request body (parsed):', body);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: error instanceof Error ? error.message : 'Unknown parsing error'
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { userPrompt, context = '' } = body;

    if (!userPrompt) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing userPrompt',
          details: 'The userPrompt field is required in the request body'
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize OpenAI client
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key is missing');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          details: 'OpenAI API key is not configured'
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });
    console.info('OpenAI client initialized with available methods:', Object.keys(openai));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('EDGE_RUNTIME_SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('EDGE_RUNTIME_SUPABASE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Supabase configuration is missing:', {
        url: supabaseUrl ? 'exists' : 'missing',
        key: supabaseServiceRoleKey ? 'exists' : 'missing'
      });
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          details: 'Supabase configuration is incomplete'
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.info('Initializing Supabase client with URL:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Generate cache key
    const cacheKey = `${userPrompt}:${context}`.toLowerCase();
    console.info('Generated cache key:', cacheKey);

    // Check cache
    try {
      console.info('Checking cache for key:', cacheKey);
      const { data: cachedResponse, error: cacheError } = await supabase
        .from('ai_response_cache')
        .select('response')
        .eq('cache_key', cacheKey)
        .single();

      if (cacheError) {
        console.error('Cache error:', cacheError);
        if (cacheError.code !== 'PGRST116') { // Ignore "no rows returned" error
          throw cacheError;
        }
      }

      if (cachedResponse) {
        console.info('Cache hit! Returning cached response');
        return new Response(
          JSON.stringify({
            content: cachedResponse.response,
            cached: true,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      console.info('Cache miss, proceeding with OpenAI request');
    } catch (error) {
      console.error('Error checking cache:', error);
      // Continue without cache rather than failing
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant specializing in recipes and cooking advice.',
      },
    ];

    if (context) {
      messages.push({
        role: 'system',
        content: `Context: ${context}`,
      });
    }

    messages.push({
      role: 'user',
      content: userPrompt,
    });

    // Call OpenAI
    try {
      console.info('Calling OpenAI with messages:', JSON.stringify(messages));
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages as any[],
        temperature: 0.7,
        max_tokens: 500,
      });

      console.info('OpenAI response received:', JSON.stringify(completion));

      if (!completion.choices?.[0]?.message?.content) {
        throw new Error('No response content from OpenAI');
      }

      const response = completion.choices[0].message.content;

      // Cache the response
      try {
        console.info('Caching response');
        const { error: insertError } = await supabase
          .from('ai_response_cache')
          .insert([
            {
              cache_key: cacheKey,
              response,
            },
          ]);

        if (insertError) {
          console.error('Error caching response:', insertError);
          // Continue without caching rather than failing
        } else {
          console.info('Response cached successfully');
        }
      } catch (error) {
        console.error('Error inserting into cache:', error);
        // Continue without caching rather than failing
      }

      return new Response(
        JSON.stringify({
          content: response,
          cached: false,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('OpenAI API error:', error);
      return new Response(
        JSON.stringify({
          error: 'OpenAI API error',
          details: error instanceof Error ? error.message : 'Unknown error calling OpenAI API'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Unhandled error in edge function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'An unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 