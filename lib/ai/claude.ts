import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface GenerateDescriptionParams {
  productName: string
  category: string
  keyFeatures: string[]
  targetAudience?: string
  tone?: 'professional' | 'casual' | 'luxury' | 'playful'
}

/**
 * Generate a compelling product description using Claude API
 */
export async function generateProductDescription(
  params: GenerateDescriptionParams
): Promise<string> {
  const {
    productName,
    category,
    keyFeatures,
    targetAudience = 'general consumers',
    tone = 'professional',
  } = params

  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an expert e-commerce copywriter. Write a compelling product description.

Product Name: ${productName}
Category: ${category}
Key Features: ${keyFeatures.join(', ')}
Target Audience: ${targetAudience}
Tone: ${tone}

Requirements:
- 2-3 short paragraphs (2-3 sentences each)
- Start with a hook that grabs attention
- Highlight benefits, not just features
- End with a subtle call to action
- Do NOT use bullet points
- Do NOT include a title — just the description body
- Keep it under 300 words
- Make it engaging and persuasive`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  return content.text
}
