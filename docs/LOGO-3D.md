# Geometria da marca JORAK

A geometria usa o lettering original fornecido pelo cliente, em `public/media/jorak-wordmark.png`. Não utiliza fonte para substituir o nome, nem textura ampliada para produzir a superfície principal. O arquivo de referência tem 594 × 223 pixels, incluindo a margem transparente.

`scripts/build-logo-shapes.py` converte os contornos em perfis vetoriais, usando Pillow e NumPy no processamento local. O resultado está salvo em `public/media/jorak-logo-shapes.json`; o site não precisa executar Python para apresentar a marca.

O JSON contém `width`, `height`, `materials` e `profiles`. Cada perfil possui uma lista de formas `{ outer, holes }`, com pontos `[x, y]` em coordenadas da imagem: x cresce para a direita e y cresce para baixo. Os polígonos são implicitamente fechados. A simplificação usa tolerância de 0,28 pixel.

A transparência do PNG de referência é binária, sem níveis intermediários de suavização. Para evitar que esses degraus de um pixel apareçam na peça, o processo aplica uma suavização subpixel à fronteira e verifica o desvio contra o contorno original, incluindo os furos. O limite é 0,75 pixel em qualquer ponto; o cálculo acrescenta uma margem conservadora de 0,125 pixel à distância medida em amostras espaçadas por no máximo 0,25 pixel. A quantidade de formas e furos permanece igual antes e depois da suavização.

| Perfil | Suavização σ | Desvio máximo conservador | Interseção/união a 4× |
| --- | ---: | ---: | ---: |
| `whiteBorder` | 0,60 px | 0,7252 px | 99,8641% |
| `body` | 0,55 px | 0,7490 px | 99,5527% |
| `greenFaces` | 0,60 px | 0,7252 px | 99,5850% |
| `highlights` | 0,60 px | 0,7252 px | 97,2969% |

A comparação usa os contornos extraídos após a separação de cor e a exclusão de ruídos muito pequenos. A menor área das formas de brilho torna a proporção de pixels alterados relativamente maior, mantendo o mesmo limite absoluto de desvio. O JSON registra essas métricas em `metrics`, para permitir conferência e reprodução.

| Perfil | Aplicação | Formas | Furos |
| --- | --- | ---: | ---: |
| `whiteBorder` | Base e contorno branco físico | 1 | 2 |
| `body` | Corpo e linhas do desenho em verde profundo | 4 | 3 |
| `greenFaces` | Faces verdes separadas, com possibilidade de relevo | 5 | 3 |
| `highlights` | Sete reflexos desenhados no lettering original | 7 | 0 |

As contraformas de O e R continham partes da ilustração do banner no PNG. O traçado remove somente as ilhas de fundo desses dois miolos para permitir furos físicos na peça. O pequeno interior branco do A permanece como acabamento branco, seguindo a referência. Os perfis do corpo e das faces mantêm as três contraformas do desenho.

As superfícies podem receber materiais físicos distintos, profundidade e chanfro. Ao converter para o espaço 3D, centralize x em `width / 2` e inverta y em torno de `height / 2`, usando a mesma escala nos dois eixos. Essa transformação mantém as proporções originais. A prévia plana em `research/verification/logo-vector-preview.png` permite conferir o desenho antes de avaliar luz e animação. `research/verification/logo-contour-audit-4x.png` compara, com antialias, o contorno inicial à esquerda e o resultado suavizado à direita, ambos ampliados a 4× apenas para auditoria; essa imagem não é usada como textura no site.

O limite de nitidez da referência determina os contornos recuperáveis: uma arte vetorial original permitiria reconstruir detalhes ainda menores. O arquivo atual já fornece os perfis para renderização geométrica independente da resolução da tela.
