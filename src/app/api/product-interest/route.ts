import {z} from 'zod';
import {findProduct,productInquiry} from '@/lib/editing-products';
import {assertSameOrigin,HttpError} from '@/lib/server/config';
import {saveInquiry} from '@/lib/server/repository';
import {json,failure,readJson,rateLimit} from '@/lib/server/http';
import {parse} from '@/lib/server/validation';
export const runtime='nodejs';
const schema=z.object({productId:z.string().max(100),name:z.string().trim().min(2).max(120),email:z.email().max(200),message:z.string().trim().min(10).max(5000),website:z.string().max(200).optional()}).strict();
export async function POST(request:Request){try{
  assertSameOrigin(request);rateLimit(request,'contact',5,10*60*1000);
  const input=parse(schema,await readJson(request,16*1024));
  if(input.website)throw new HttpError(400,'Não foi possível validar o formulário. Tente novamente.');
  const product=findProduct(input.productId);
  if(!product||product.price===0)throw new HttpError(404,'Projeto pago não encontrado. Volte ao catálogo.');
  const saved=await saveInquiry(productInquiry(product,input));
  return json({saved:true,id:saved.id},201);
}catch(error){return failure(error);}}
