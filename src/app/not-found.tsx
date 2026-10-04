import Link from 'next/link';
export default function NotFound() { return <main className="error-page" id="conteudo"><span className="error-number">404</span><h1>Esse disco não está na coleção.</h1><p>O projeto pode estar em revisão ou ter mudado de endereço.</p><Link className="pill primary" href="/">Voltar aos trabalhos ↗</Link></main>; }
