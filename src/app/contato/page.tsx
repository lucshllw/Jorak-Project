import ContactView from '@/components/ContactView';
import {getPublicPortfolio} from '@/lib/server/repository';
export const dynamic='force-dynamic';
export const metadata={title:'Contato & orçamento'};
export default async function ContactPage(){const {settings}=await getPublicPortfolio();return <ContactView settings={settings}/>;}
