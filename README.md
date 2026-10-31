# Produção 360

Sistema estático de controle de produção e validade para caixas de 10 L, potes de açaí de 2 L, potes de sorvete e picolés.

## Recursos
- Cadastro de caixas de 10 L de açaí ou sorvete.
- Cadastro de potes de açaí de 2 L.
- Cadastro de potes de sorvete com três sabores diferentes no mesmo pote.
- Cadastro de picolés por sabor.
- Cálculo de validade com base em 180 dias corridos após a fabricação.
- Relatório em PDF com layout aprimorado e resumo da produção.
- Compartilhamento/abertura do WhatsApp e cópia do relatório.
- Dados armazenados no `localStorage` do navegador.

## Publicar no GitHub Pages
1. Envie `index.html`, `styles.css`, `app.js` e este README para a raiz do repositório.
2. No GitHub, acesse **Settings → Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**.
4. Selecione a branch principal e a pasta `/ (root)`, depois salve.

O gerador de PDF usa jsPDF via CDN, portanto a geração do PDF requer conexão com a internet.

## Observações
- O prazo de 180 dias é a configuração atual do projeto. Confirme e ajuste esse prazo conforme os critérios técnicos e sanitários aplicáveis à operação.
- Os registros ficam salvos apenas no navegador e dispositivo utilizados. Limpar os dados do navegador pode apagar os registros.
