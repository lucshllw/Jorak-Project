import ContactView from '@/components/ContactView';
import { getPublicPortfolio } from '@/lib/server/repository';
import { findProduct } from '@/lib/editing-products';
export const dynamic='force-dynamic';
export const metadata={title:'Contato & orçamento'};
export default async function ContactPage({searchParams}:{searchParams:Promise<{produto?:string|string[]}>}){ const [{settings},query]=await Promise.all([getPublicPortfolio(),searchParams]); const product=findProduct(typeof query.produto==='string'?query.produto:undefined);return <ContactView key={product?.id || 'custom'} settings={settings} product={product}/>; }
