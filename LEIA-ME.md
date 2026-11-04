# Instituto Benegr — CRM de relacionamento v0.2

Pacote de implantação com interface minimalista, dashboard, login individual, cadastro manual, importações e banco PostgreSQL/Supabase. Desenvolvido em 04/11/2026. Sem dados reais ou credenciais. O repositório no GitHub, o projeto Supabase e a publicação na Vercel ainda precisam ser criados/conectados na sua conta.

## 1. O que vem neste pacote

- index.html e style.css: interface responsiva, clara, verde discreto, foco no trabalho.
- app.js: acesso, lista paginada, filtros, ficha e acompanhamento.
- extras.js: dashboard, categorias, cadastro manual e central de importações.
- import-utils.js: normalização e validação dos dados antes do envio.
- config.js: URL do Supabase e chave publicável, inicialmente vazias por meio de marcadores.
- supabase.sql: tabelas, índices, regras e funções do banco. Executar uma vez em projeto NOVO.
- vercel.json: configuração de publicação estática.
- package.json e tests.mjs: checagens de sintaxe e testes da normalização, opcionais para quem tem Node.js.
- LEIA-ME.md: este passo a passo.

## 2. Primeiro passo: GitHub

1. Descompacte o ZIP no computador.
2. Entre no seu GitHub. Crie um repositório PRIVADO com o nome benegr-crm.
3. Envie os arquivos descompactados para a raiz. index.html deve ficar diretamente na raiz, e não dentro de outra pasta. Não envie o ZIP.
4. Inclua .gitignore. Ele evita versionar planilhas, arquivos de ambiente e dados de importação. Os arquivos dos leads serão carregados pela interface, não enviados ao repositório.
5. O GitHub guarda código. O banco será criado separadamente no próximo passo.

## 3. Criar o projeto Supabase

1. Acesse https://supabase.com/dashboard e crie um projeto NOVO para o CRM.
2. Defina organização, nome e região. Se houver região próxima da operação no Brasil, prefira essa opção.
3. Crie uma senha forte para o banco e guarde-a no seu gerenciador de senhas. Não coloque essa senha no GitHub ou no chat.
4. Após o projeto ficar disponível, abra SQL Editor.
5. Abra supabase.sql deste pacote, copie todo o conteúdo, cole no editor e execute uma vez.
6. O script usa uma transação: uma falha impede a aplicação parcial. Se uma tentativa anterior já concluiu com sucesso, não execute novamente. Ele não é uma migração para bancos já existentes.
7. No Table Editor, confirme as tabelas members, clients, purchases, activities, categories, identities, import_runs, import_rows e source_records. client_queue é uma view, não uma tabela de cadastro.
8. O projeto precisa manter o schema public acessível pela Data API. O schema crm_private contém somente funções auxiliares e não precisa ser adicionado aos schemas expostos.

## 4. Configurar login e senha

1. Abra Authentication e as configurações de cadastro/acesso. Os nomes das seções podem variar conforme a versão do painel.
2. Mantenha autenticação por e-mail e senha. Desative a opção de cadastro público de novos usuários (Allow new users to sign up).
3. Defina o mínimo de senha em 12 caracteres e ative as proteções de senha disponíveis no seu plano.
4. Em Users, crie a conta de cada pessoa autorizada. Cada pessoa terá e-mail e senha próprios. Confirme o e-mail administrativamente no fluxo de criação autorizado do painel.
5. Copie o User UID da conta de John.
6. Execute no SQL Editor, substituindo o UUID pelo UID real:

~~~sql
insert into public.members(user_id,display_name,role,active)
values ('UUID-REAL-DO-JOHN','John','admin',true);
~~~

7. Para cada integrante da equipe, repita com UID e nome próprios, usando agent:

~~~sql
insert into public.members(user_id,display_name,role,active)
values ('UUID-REAL-DA-PESSOA','Nome da vendedora','agent',true);
~~~

8. Uma conta no Authentication sem registro ativo em members não tem acesso aos dados do CRM.
9. Forneça as credenciais iniciais individualmente por canal seguro. A pessoa pode usar Alterar senha depois de entrar. Não há conta ou senha padrão neste pacote.
10. Para recuperar a senha por e-mail em produção, configure seu provedor SMTP no Supabase e teste a entrega. Apenas o botão na interface não garante entrega de e-mail.

### O que cada perfil faz

| Ação | Gestão (admin) | Vendedora (agent) |
|---|---|---|
| Consultar a base e o dashboard | Sim | Sim |
| Filtrar clientes e leads | Sim | Sim |
| Assumir ficha sem responsável | Sim | Sim |
| Registrar feedback | Todas as fichas | Fichas sob sua responsabilidade |
| Alterar categoria e marcadores | Todas as fichas | Fichas sob sua responsabilidade |
| Cadastrar lead manual | Sim | Sim; novos ficam sob sua responsabilidade |
| Importar Kiwify/Manychat/PDF | Sim | Não |
| Criar categoria | Sim | Não |

A base é compartilhada entre a equipe autorizada. O controle impede a vendedora de gravar em uma ficha de outra responsável. Não há botão para trocar responsável nesta versão; a gestão faz a redistribuição no Table Editor, alterando assigned_to para o UID da integrante autorizada e incrementando revision.

## 5. Conectar a interface ao banco

1. No Supabase, copie a Project URL e a chave PUBLICÁVEL (sb_publishable_...). Elas podem aparecer no diálogo Connect ou na área API Keys.
2. Edite config.js no repositório:

~~~js
export const config = {
  supabaseUrl: 'https://SEU-PROJETO.supabase.co',
  supabaseKey: 'sb_publishable_SUA_CHAVE'
};
~~~

3. A chave publicável é apropriada para o navegador. A proteção dos dados é feita pelas regras e pelos usuários autorizados do banco.
4. NUNCA use senha de banco, secret key ou service_role nesse arquivo. Elas dão poderes administrativos e não pertencem ao navegador.
5. Salve a alteração no GitHub.

## 6. Publicar na Vercel

1. Entre na sua Vercel e importe benegr-crm como NOVO projeto, separado das páginas de vendas.
2. Selecione Framework Preset: Other. Root Directory: raiz do repositório.
3. Não há instalação ou compilação de dependências: este projeto usa módulos JavaScript no navegador. Deixe os comandos de instalação/build desativados e diretório de saída como raiz (.). O vercel.json já indica publicação estática sem build.
4. Publique e copie a URL HTTPS fornecida pela Vercel.
5. No Supabase, em Authentication > URL Configuration, configure essa URL em Site URL e adicione a URL exata, com caminho raiz quando aplicável, em Redirect URLs.
6. Teste login, alteração/recuperação de senha e logout. Se a proteção de deploy da Vercel solicitar acesso à conta Vercel, verifique o escopo da proteção para o endereço destinado à equipe; o CRM também tem seu login próprio.
7. Enquanto config.js contiver os marcadores de exemplo, o sistema mostra uma tela de configuração, não libera login fictício.

## 7. Usar seu domínio na GoDaddy

1. Adicione, no projeto da Vercel, o subdomínio desejado (por exemplo, crm.institutobenegr.com.br).
2. Na GoDaddy, crie o registro DNS exato indicado pelo painel da Vercel para esse subdomínio. Não copie um valor genérico de outro site.
3. Aguarde a verificação do domínio e do certificado HTTPS.
4. Atualize Site URL e Redirect URLs no Supabase para a URL definitiva e teste os links de recuperação novamente.
5. As páginas de vendas podem continuar em seus projetos atuais. Não é necessário adicionar Cloudflare ou trocar os nameservers para este fluxo.

## 8. Primeira validação com duas contas

1. Antes de importar a base completa, cadastre um lead de teste pela interface. Use dados fictícios claramente identificados.
2. Entre como agente e assuma uma ficha sem responsável. Registre contato, feedback e retorno.
3. Saia, entre de outro navegador e confira o histórico salvo.
4. Com um segundo agente, confirme que a ficha do primeiro pode ser consultada, mas não alterada por ele.
5. Tente assumir a mesma ficha simultaneamente com as duas contas: somente uma deve conseguir.
6. Sem login, confirme que a API não retorna clientes. Com uma conta sem members ativo, confirme bloqueio.
7. Abra uma ficha em duas sessões. Salve na primeira e tente salvar a versão anterior na segunda: o sistema deve pedir para reabrir a ficha.
8. Somente após essas validações, libere as contas da equipe e a base real.

## 9. Dashboard, categorias e fila

O dashboard resume toda a base, não somente a página de 50 clientes visível na lista. Mostra total de cadastros, clientes com compra aprovada, leads sem compra aprovada, clientes com contato registrado, reuniões na etapa atual e retornos atrasados. As barras apresentam etapas, categorias e origens. Uma pessoa pode ter várias origens, por isso a soma por origem pode superar o número de cadastros.

Categorias iniciais: Sem categoria, Relacionamento, Potencial high ticket, Pós-venda e Suporte. A gestão pode criar novas categorias no dashboard. A categoria é uma classificação humana; o sistema não presume renda, perfil financeiro ou elegibilidade para a oferta.

Na ficha, categoria e marcadores são editáveis. Use marcadores para interesses e campanhas (por exemplo: vigilia, lech-lecha, empreendedora). O estágio registra o andamento do atendimento e é separado da categoria.

Prioridade comercial provisória: 50% posição percentual no total investido e 50% posição percentual no número de produtos diferentes, com última compra como desempate. Clientes sem compras ficam com investimento zero. Use também os filtros Já comprou/Sem compra aprovada e ordenação de retornos para separar reativação de prospecção.

A ordenação padrão não antecipa automaticamente os retornos atrasados. Para trabalhar retornos, selecione o filtro Atrasados e ordene por Próximo retorno. O botão de WhatsApp apenas abre o canal; não marca uma mensagem como enviada. Contato realizado deve ser usado depois da abordagem efetiva. A etapa Não deseja contato bloqueia o botão de WhatsApp e novas marcações de contato enquanto permanecer selecionada.

## 10. Importação contínua pela interface

1. Entre como admin e abra Importações.
2. Escolha Kiwify, Manychat ou Formulário PDF.
3. Informe a conta/escopo. Use sempre o mesmo valor ao atualizar a MESMA conta, para que IDs de origens diferentes não se misturem. Contas distintas devem usar escopos distintos.
4. Escolha uma categoria inicial. Cadastros já existentes preservam a categoria e a responsável atuais.
5. Selecione o arquivo. Planilhas aceitas: CSV, XLSX e XLS. Uma planilha por vez, com escolha da aba. Limites operacionais da interface: 25 MB por arquivo e 20 mil linhas por importação. Divida arquivos maiores.
6. Confira o mapeamento de cada coluna. A sugestão automática é apenas um ponto de partida. Colunas não mapeadas não são importadas.
7. Defina formato dos valores, datas/fuso e telefones. Uma coluna com 9700 pode significar R$ 9.700 ou 9700 centavos: escolha explicitamente o formato do arquivo. Valores em formato divergente geram pendência.
8. Use a opção de acrescentar 55 apenas quando souber que todo o arquivo é brasileiro e tem telefones nacionais. Telefones internacionais devem manter o código correto do país.
9. Clique Preparar revisão. Cada linha válida tem uma seleção. Linhas inválidas ficam desmarcadas.
10. Use Revisar para corrigir o registro antes de enviar. A correção dos valores usa reais com ponto e datas ISO ou dd/mm/aaaa; a tela mostra o registro já normalizado.
11. Confirme as linhas selecionadas. O envio ocorre em lotes de até 100 registros. Falha de uma linha não apaga as demais.
12. Confira quantos cadastros foram criados, atualizados e ficaram pendentes. Baixe o relatório de resultados.
13. O histórico de importações permite baixar os resultados novamente. Para corrigir erros já processados, prepare uma nova importação após revisar a causa. Uma retomada do mesmo envio não processa duas vezes a mesma linha.

### Identificação e duplicidades

O sistema compara e-mail, telefone internacional, usuário Instagram e IDs externos. Nunca une automaticamente somente pelo nome. Manychat Contact ID e IGSID são identificadores separados e vinculados ao escopo.

Se os identificadores apontarem para pessoas diferentes ou um contato novo divergir de um existente, a linha recebe CONFLITO. A gestão precisa conferir a pessoa correta. Não há fusão de clientes pela interface nesta versão. Para revisão técnica, as tabelas clients e identities precisam permanecer coerentes; não altere apenas um dos lados sem revisar os vínculos.

Reimportar pedidos usa o identificador de transação combinado com a conta/escopo. Uma transação já existente atualiza o status e não cria uma segunda compra. Transações com produto diferente ou tentativa de reativar compra reembolsada/contestada são sinalizadas. A importação preserva atendimentos, responsável e classificação existentes; completa dados de contato ausentes e acrescenta marcadores/origens.

## 11. Particularidades da Kiwify

Exporte Vendas com o período completo e os produtos corretos. Campos necessários para compras: nome/identificador do cliente, ID único de transação ou item, ID do produto, nome do produto, valor, moeda, status e data. Mapeie status de pagamento, não deposit_status (liberação do saldo).

A pontuação considera apenas paid. Os status waiting_payment, refused, refunded e chargedback podem ser importados para manter o histórico coerente, mas não somam ao investimento aprovado. Renovações somam compras e valor, e não produtos diferentes se tiverem o mesmo ID de produto.

O valor é o investimento do comprador atribuível à linha, não o líquido/comissão recebido pelo Instituto ou pela Wall. Não some valor total de um pedido e os mesmos itens novamente. Se o arquivo repetir um pedido em vários produtos, usar o identificador único de item/transação e validar o rateio antes da carga. O sistema sinaliza pedido repetido com produto diferente.

Somente BRL é aceito nesta versão. Outras moedas precisam de uma regra de conversão validada antes de entrar no ranking.

Antes da carga completa, importar uma amostra e reconciliar manualmente compradores, compras aprovadas, produtos diferentes, valores e reembolsos com a exportação original. Sem o arquivo real da conta, a correspondência específica dos cabeçalhos da Kiwify não foi validada.

## 12. Particularidades do Manychat e Instagram

É possível cadastrar um contato sem telefone. Traga e-mail, usuário Instagram, Manychat Contact ID ou IGSID quando disponível. O sistema aceita leads sem compras; apenas não inventa dados faltantes.

A exportação IG Custom Audience pode conter SOMENTE IGSIDs. Ela exige assinatura elegível e não traz automaticamente nomes, e-mails ou o histórico de posts. Mapeie a coluna explicitamente para IGSID. Esses cadastros podem aparecer como Contato + ID e não terão botão de contato se não houver telefone ou usuário Instagram.

Para uma base mais útil, exporte os dados e campos coletados nas automações, por exemplo por respostas do Data Collection ou integração com Google Sheets, conforme os recursos da conta. A integração do Google Sheets precisa ser configurada e acionada; conectar a conta não exporta retroativamente todos os campos por si só.

Para registrar post/campanha/interação, a exportação precisa conter esses campos. Mapeie o contexto em Interação e o identificador do evento em ID da interação quando existir. O CRM não consulta automaticamente quem curtiu, comentou ou visualizou todos os posts, e não envia DMs automaticamente.

Contatos apenas por ID não são automaticamente unidos a compradores da Kiwify sem um identificador em comum. Se depois chegar o mesmo ID acompanhado de e-mail/telefone/usuário já conhecido e os vínculos forem coerentes, a correspondência será encontrada; conflitos continuam para revisão humana.

## 13. Formulários em PDF

- Aceita PDF com campos preenchíveis (AcroForm) ou texto extraível, com revisão dos campos antes de salvar.
- Sugestão para formulários futuros: nomear os campos name, email, phone, instagram, category, tags, interaction. Isso facilita mapear as respostas.
- Para PDF de texto, rótulos no formato Nome: resposta podem ser extraídos. A disposição do documento pode impedir uma extração fiel; confira o texto mostrado e corrija o cadastro na revisão.
- Um arquivo PDF corresponde a um cadastro. Você pode selecionar vários PDFs, respeitando 25 MB por arquivo. Um PDF com várias pessoas não vira uma lista automaticamente.
- PDF escaneado ou resposta manuscrita precisa passar por OCR ou cadastro manual. Esta versão não inclui OCR.
- Os PDFs são lidos no navegador. O arquivo original não é guardado no banco; somente os campos selecionados são enviados. Um hash do PDF identifica sua origem.
- Não há um parser universal de formulários: precisamos validar uma amostra do seu modelo antes de confiar em cargas em lote.

## 14. Rotina de trabalho

1. Abrir Dashboard e verificar retornos e reuniões.
2. Em Clientes e leads, filtrar Meus atendimentos, Atrasados ou clientes sem responsável.
3. Consultar o histórico de compras e o contexto antes da abordagem.
4. Assumir a ficha quando necessário.
5. Realizar o contato e salvar o feedback, etapa e próximo retorno.
6. Marcar reunião quando houver alinhamento com a oferta. Registrar o contexto e o horário em observação; calendário/convites não estão integrados nesta versão.
7. Atualizar a lista ou reabrir a ficha para ver novas informações de outros usuários. Não há atualização em tempo real nesta versão.

## 15. Manutenção e segurança operacional

Para revogar acesso aos dados de uma pessoa:

~~~sql
update public.members set active=false where user_id='UUID-DA-PESSOA';
~~~

Para bloquear login/sessões também, administrar a conta em Authentication. Uma sessão ainda aberta perde acesso aos dados por causa das regras de membership. Não exclua integrantes com histórico de atendimentos: desative-as.

Planeje backups e teste restauração do banco conforme o plano escolhido. GitHub é histórico do código, não backup dos clientes. Recursos, limites e custos de Vercel/Supabase devem ser avaliados na sua conta. Para operação comercial, confira um plano Vercel compatível com esse uso e seu volume.

A ficha mostra os 100 atendimentos/compras mais recentes; o dashboard usa toda a base. O histórico detalhado de eventos importados permanece em source_records quando houver identificador de origem. Não é uma cópia completa das conversas do WhatsApp/Instagram.

Os scripts Supabase, SheetJS e PDF.js são carregados de CDNs conhecidas. O navegador precisa acessar esses domínios e o seu projeto Supabase. A versão SheetJS e PDF.js está fixada; o SDK Supabase usa a série 2. Para maior controle de dependências, uma evolução pode migrar para build com lockfile.

## 16. Verificação desta entrega

Foram realizadas checagens de sintaxe JavaScript, testes de normalização de dinheiro/datas e identificadores, e revisão da interface no navegador com backend simulado e dados fictícios. Cadastro manual sem telefone e registro de feedback foram exercitados na simulação. Esses testes não validam políticas do banco real.

O SQL e os fluxos reais de autenticação/persistência ainda precisam ser executados e validados na sua conta Supabase. Não houve publicação na Vercel nem criação remota do repositório nesta entrega. A implantação requer as configurações das seções 2 a 8 e uma amostra de cada origem para validar o mapeamento.

Se houver Node.js instalado, executar na pasta do projeto: npm run check e npm test. Não é necessário instalar dependências para esses testes ou para o deploy estático.

## Fontes oficiais

- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://vercel.com/docs/git/vercel-for-github
- https://vercel.com/docs/domains/working-with-domains/add-a-domain
- https://help.manychat.com/en/articles/17742236-how-to-export-contacts-data
- https://help.manychat.com/en/articles/17742000-instagram-custom-audiences
- https://docs.sheetjs.com/docs/getting-started/installation/standalone/
- https://mozilla.github.io/pdf.js/
