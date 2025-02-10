const BFL_API_KEY = Deno.env.get('BFL_API_KEY')

// Helper function to format style instructions
function getStyleInstructions(style?: string): string {
  switch (style) {
    case 'photorealistic':
      return 'Create a photorealistic image with natural lighting and detailed textures';
    case 'minimalistic':
      return 'Create a clean, minimalistic image with simple shapes and limited color palette';
    case 'cartoon':
      return 'Create a cartoon-style illustration with bold colors and defined outlines';
    case 'line-art':
      return 'Create a black and white line art illustration with clean, continuous lines';
    case 'watercolor':
      return 'Create a soft watercolor style image with gentle color transitions';
    default:
      return 'Create a clear and appealing image';
  }
}

interface GenerateImageBody {
  prompt: string
  width?: number
  height?: number
  style?: string
}

console.info('Image generation service started')

Deno.serve(async (req: Request) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parse request body
    const body: GenerateImageBody = await req.json()
    const { prompt, width = 1024, height = 768, style } = body

    // Make initial request to BFL API
    const generateResponse = await fetch('https://api.us1.bfl.ai/v1/flux-pro-1.1', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'x-key': BFL_API_KEY ?? ''
      },
      body: JSON.stringify({ 
        prompt: style ? `${getStyleInstructions(style)}. ${prompt}` : prompt, 
        width, 
        height 
      })
    })

    if (!generateResponse.ok) {
      const error = await generateResponse.text()
      throw new Error(`Failed to generate image: ${generateResponse.status} ${error}`)
    }

    const { id } = await generateResponse.json()

    // Poll for result
    let result = null
    let attempts = 0
    const maxAttempts = 30

    while (attempts < maxAttempts) {
      const checkResponse = await fetch(`https://api.us1.bfl.ai/v1/get_result?id=${id}`, {
        headers: {
          'accept': 'application/json',
          'x-key': BFL_API_KEY ?? ''
        }
      })

      if (!checkResponse.ok) {
        const error = await checkResponse.text()
        throw new Error(`Failed to check result: ${checkResponse.status} ${error}`)
      }

      result = await checkResponse.json()

      if (result.status === 'Ready') {
        break
      }

      if (result.status === 'Failed') {
        throw new Error(result.error || 'Image generation failed')
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000))
      attempts++
    }

    if (!result || result.status !== 'Ready') {
      throw new Error('Image generation timed out')
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}) 