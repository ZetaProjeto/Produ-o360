# Produção360 — Relatórios de fabricação

Aplicação estática (HTML, CSS e JavaScript) para publicar gratuitamente no GitHub Pages.

## Funcionalidades
- Caixa 10 L: **açaí** (sem sabor) ou **sorvete** (sabor obrigatório).
- Picolés: sabor e quantidade.
- Data de fabricação em cada registro; validade calculada como **fabricação + 180 dias corridos**.
- Lista de itens, totais separados para caixas e picolés.
- Relatório formatado para enviar no WhatsApp, copiar ou imprimir/salvar em PDF pelo navegador.
- Nome do estabelecimento e número WhatsApp configuráveis (em **Configurações**).
- Registros e configurações salvos em `localStorage` **apenas no aparelho/navegador usado**.

## Publicar no GitHub Pages
1. Crie um repositório no GitHub, por exemplo `relatorio-producao`.
2. Envie `index.html`, `styles.css` e `app.js` para a **raiz** da branch `main`.
3. Em **Settings → Pages → Build and deployment**, selecione **Deploy from a branch**, branch **main**, pasta **/(root)** e **Save**.
4. Abra a URL exibida pelo GitHub Pages quando a publicação estiver concluída.

## WhatsApp
O botão **Enviar pelo WhatsApp** abre um link `wa.me` com o texto preenchido, mas o usuário deve **confirmar o envio no WhatsApp**. Não há envio automático nem necessidade de servidor/API. Para enviar a um destinatário específico, informe o número internacional com DDI 55 + DDD + telefone, somente dígitos. Relatórios muito grandes podem ultrapassar o tamanho prático de links; nesse caso use **Copiar relatório**.

## Observações importantes
- **180 dias corridos** significa adicionar 180 dias ao dia de fabricação. O próprio dia de fabricação é o dia zero. Confirme que essa regra corresponde ao procedimento técnico e à rotulagem do produto.
- **O fechamento da aba não apaga os dados**, mas limpeza do navegador, troca de dispositivo ou modo anônimo podem apagá-los. Não é uma base compartilhada entre funcionários. Para isso, será preciso backend como Supabase.
- A aplicação não valida automaticamente se uma data de validade está de acordo com exigências sanitárias.
- Não armazena dados de clientes ou informações pessoais no servidor.
