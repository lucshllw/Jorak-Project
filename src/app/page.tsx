import Portfolio from '@/components/Portfolio';
import { getPublicPortfolio } from '@/lib/server/repository';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const data = await getPublicPortfolio();
  return <Portfolio data={data}/>;
}
