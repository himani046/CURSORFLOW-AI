const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, init)
  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try { const body = await response.json(); detail = body.detail || detail } catch { /* retain status */ }
    throw new Error(detail)
  }
  return response.json() as Promise<T>
}

export type SimplifyResult = {
  extracted_source_text: string; simplified_text: string; english_parallel?: string | null
  bullet_points: string[]; original_grade: number | null; simplified_grade: number | null
  target_lang: string; provider: string
}
export const api = {
  simplify: (text: string, mode: string, target_lang: string) =>
    request<SimplifyResult>('/api/simplify', { method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({text, mode, target_lang}) }),
  simplifySource: (form: FormData) => request<SimplifyResult>('/api/simplify-source', {method:'POST', body:form}),
  refine: (transcript: string, target_lang: string, simplify: boolean) =>
    request<{refined_transcript:string;provider:string}>('/api/stt-refine', {method:'POST',
      headers:{'Content-Type':'application/json'}, body:JSON.stringify({transcript,target_lang,simplify})}),
  assistant: (message:string, history:{role:string;content:string}[], target_lang:string, bilingual:boolean) =>
    request<{reply:string;action_steps:string[];provider:string}>('/api/assistant', {method:'POST',
      headers:{'Content-Type':'application/json'}, body:JSON.stringify({message,history,target_lang,bilingual})}),
  vision: (form:FormData) => request<{
    description:string;extracted_text:string;spatial_zones:{left:string;center:string;right:string};
    safety_level:string;hazards:string[];answer:string|null;provider:string
  }>('/api/vision',{method:'POST',body:form}),
  tts: async (text:string, lang:string, rate:number) => {
    const response = await fetch(`${BASE}/api/tts`, {method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({text,lang,rate:`${Math.round((rate-1)*100)>=0?'+':''}${Math.round((rate-1)*100)}%`})})
    if (!response.ok) throw new Error('Audio generation failed')
    return URL.createObjectURL(await response.blob())
  }
}
