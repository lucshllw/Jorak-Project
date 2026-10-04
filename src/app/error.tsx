'use client';
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="error-page" id="conteudo"><h1>A coleção não carregou.</h1><p>Tente novamente para continuar explorando os trabalhos.</p><button className="pill primary" onClick={reset}>Tentar novamente</button></main>; }
