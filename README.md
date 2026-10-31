# Produção360 — Relatórios de fabricação em PDF

Projeto estático pronto para GitHub Pages (HTML, CSS e JavaScript).

## Funções
- Caixa de 10 litros: açaí sem sabor, ou sorvete com sabor obrigatório.
- Picolés: sabor e quantidade produzida.
- Data de fabricação em cada registro; validade calculada adicionando 180 dias corridos.
- Lista de produção, totais de caixas e picolés, remoção de registros.
- **Baixar PDF:** gera e baixa relatório A4.
- **Imprimir relatório:** abre uma visualização dedicada à impressão, com botão Imprimir / Salvar em PDF. Permita pop-ups para o site.
- **Copiar relatório:** copia os dados como texto.
- Configurações: apenas nome do estabelecimento.
- Dados salvos localmente no navegador (`localStorage`); não existe sincronização entre dispositivos.

## Como atualizar no GitHub Pages
1. Substitua os arquivos `index.html`, `styles.css`, `app.js` e `README.md` na raiz do repositório.
2. Confirme em **Settings → Pages** que está configurado: **Deploy from a branch** / **main** / **/(root)**.
3. Após publicar, atualize o navegador com Ctrl+F5 se ainda aparecer a interface antiga.

## Dependência
O PDF é gerado diretamente no navegador, sem bibliotecas externas e sem exigir conexão com CDN.

## Atenção
O cálculo usa **data de fabricação + 180 dias** (fabricação como dia zero). Confirme o prazo de validade conforme os critérios técnicos/sanitários de cada produto.
