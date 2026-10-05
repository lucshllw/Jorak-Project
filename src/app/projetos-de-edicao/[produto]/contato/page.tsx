import {notFound} from 'next/navigation';
import {findProduct} from '@/lib/editing-products';
import {getPublicPortfolio} from '@/lib/server/repository';
import ProductContactView from '@/components/ProductContactView';
export const dynamic='force-dynamic';
export const metadata={title:'Interesse no projeto'};
export default async function ProductContactPage({params}:{params:Promise<{produto:string}>}){
  const {produto}=await params,product=findProduct(produto);
  if(!product||product.price===0)notFound();
  const data=await getPublicPortfolio();
  return <ProductContactView key={product.id} product={product} project={data.projects.find(project=>project.slug===product.portfolioSlug)} settings={data.settings}/>;
}
