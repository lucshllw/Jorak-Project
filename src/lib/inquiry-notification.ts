import type { Inquiry } from './types';

export type NotificationStatus = 'submitted' | 'activation-required' | 'unavailable' | 'disabled';
type Configuration = { recipient: string; origin: string; onFailure?: (reason: string) => void };
export type NotificationRequest = {url:string;body:Record<string,string>};

export function prepareInquiryNotification(inquiry:Inquiry,config:Configuration):NotificationRequest {
  const origin=new URL(config.origin);
  if(origin.protocol!=='https:'||origin.username||origin.password||!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(config.recipient)) throw new Error('Configuração de envio inválida.');
  const product=Boolean(inquiry.productId);
  const formPath=product?`/projetos-de-edicao/${encodeURIComponent(inquiry.productId!)}/contato`:'/contato';
  return {url:`https://formsubmit.co/ajax/${encodeURIComponent(config.recipient)}`,body:{
    _subject:product?'JORAK — Arquivo de projeto: novo interesse':'JORAK — Orçamento: nova ideia',
    _template:'table',_url:origin.origin+formPath,_replyto:inquiry.email,email:inquiry.email,
    'Nome':inquiry.name,'Tipo de pedido':inquiry.type,'Duração':inquiry.duration,'Prazo':inquiry.deadline,
    'Orçamento':inquiry.budget,'Referências':inquiry.references,'Mensagem':inquiry.message,
    'Código do pedido':inquiry.id,'Recebido em':inquiry.createdAt,
  }};
}

// The browser supplies Origin/Referer automatically, as in FormSubmit's AJAX flow.
export async function sendPreparedNotification(request:NotificationRequest,fetcher:typeof fetch=fetch):Promise<NotificationStatus>{
  try {
    const endpoint=new URL(request.url);
    if(endpoint.origin!=='https://formsubmit.co'||!/^\/ajax\/[^/]+$/.test(endpoint.pathname)||endpoint.search||endpoint.hash) return 'unavailable';
    const response=await fetcher(request.url,{method:'POST',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(request.body)});
    if(!response.ok)return 'unavailable';
    const result=await response.json();
    if(typeof result.message==='string'&&/activat|ativação/i.test(result.message))return 'activation-required';
    return result.success===true||result.success==='true'?'submitted':'unavailable';
  } catch{return 'unavailable';}
}

// Transport only. Server callers supply the recipient from site settings, never
// from visitor input. A successful relay submission is not proof of inbox delivery.
export async function sendInquiryNotification(inquiry: Inquiry, config: Configuration, fetcher: typeof fetch = fetch): Promise<NotificationStatus> {
  const failed = (reason: string): NotificationStatus => { config.onFailure?.(reason); return 'unavailable'; };
  try {
    const prepared=prepareInquiryNotification(inquiry,config);
    const response = await fetcher(prepared.url, {
      method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Referer: prepared.body._url },
      body: JSON.stringify(prepared.body),
    });
    if (!response.ok) return failed(`http-${response.status}`);
    let result;
    try { result = await response.json(); } catch { return failed('non-json'); }
    if (typeof result.message === 'string' && /activat|ativação/i.test(result.message)) return 'activation-required';
    if (result.success === true || result.success === 'true') return 'submitted';
    return failed(typeof result.message === 'string' && /web server/i.test(result.message) ? 'source-missing' : 'provider-rejected');
  } catch (error) { return failed(error instanceof Error && /Timeout|Abort/.test(error.name) ? 'timeout' : 'network'); }
}
