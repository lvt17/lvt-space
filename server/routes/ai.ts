import { Router } from 'express'

const router = Router()

// HuggingFace new router API (OpenAI-compatible)
const HF_URL = 'https://router.huggingface.co/together/v1/chat/completions'
const HF_MODEL = 'meta-llama/Llama-3.3-70B-Instruct-Turbo'

router.post('/generate-checklist', async (req, res) => {
    const { prompt } = req.body
    if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt is required' })

    const apiToken = process.env.HF_API_TOKEN
    if (!apiToken) return res.status(500).json({ error: 'HF_API_TOKEN not configured' })

    const systemPrompt = [
        'You are a task planning assistant.',
        'Create a detailed, actionable checklist for the user request.',
        'Return ONLY a valid JSON array, absolutely no other text, no markdown fences, no explanation.',
        'Format: [{"text": "task description", "indent": 0}]',
        'indent 0 = main item, indent 1 = sub-item under the previous main item.',
        'Create 5-15 items total. Keep items concise and actionable.',
        'If user writes Vietnamese, respond in Vietnamese.',
    ].join(' ')

    try {
        const hfRes = await fetch(HF_URL, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: HF_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
                max_tokens: 1024,
                temperature: 0.3,
            }),
        })

        if (!hfRes.ok) {
            const err = await hfRes.text()
            console.error('HF API error:', hfRes.status, err)
            return res.status(502).json({ error: 'AI service error', details: err })
        }

        const data = await hfRes.json() as {
            choices: Array<{ message: { content: string } }>
        }
        const raw = data.choices?.[0]?.message?.content || ''

        // Extract JSON array from response
        const jsonMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/)
        if (!jsonMatch) {
            console.error('Could not parse AI response:', raw)
            return res.status(422).json({ error: 'Could not parse AI response', raw })
        }

        const items = JSON.parse(jsonMatch[0])
        const formatted = items.map((item: { text: string; indent?: number }, i: number) => ({
            id: 'ai-' + Date.now() + '-' + i,
            text: item.text,
            is_checked: false,
            indent_level: item.indent || 0,
        }))

        res.json({ items: formatted, raw_prompt: prompt })
    } catch (err) {
        console.error('AI generation error:', err)
        res.status(500).json({ error: 'Failed to generate checklist' })
    }
})

export default router
