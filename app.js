import { config } from './config.js';
import { initExtras, refreshClassification } from './extras.js';
const $ = (s) => document.querySelector(s);
const stages = {novo:'Não contatado',aguardando:'Aguardando resposta',conversa:'Em conversa',qualificado:'Qualificado',reuniao:'Reunião agendada',venda:'Venda concluída',depois:'Retomar depois',suporte:'Atendimento pendente',nao_contatar:'Não deseja contato'};
let db, user, profile, members = [], selected, page = 0, total = 0, queue = [], loadSeq = 0, writing = false, recovery = false;
const money = (v) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v || 0));
const date = (v) => v ? new Date(v).toLocaleString('pt-BR') : '—';
const el = (tag,text,className) => { const n=document.createElement(tag); if(text!==undefined)n.textContent=text; if(className)n.className=className; return n; };
function show(id){for(const s of ['setup','login','workspace','password-panel'])$('#'+s).hidden=s!==id;}
function notice(text){$('#notice').textContent=text;}
function requireOk(result){if(result.error)throw result.error;return result.data;}
function memberName(id){return members.find(m=>m.user_id===id)?.display_name || '—';}
function report(e){console.error(e);notice(e.message || 'Não foi possível concluir. Tente novamente.');}
for(const target of ['#stage','#detail-stage'])for(const [key,label] of Object.entries(stages)){const o=el('option',label);o.value=key;$(target).append(o);}
async function activate(session){
 user=session?.user; selected=null; if($('#detail').open)$('#detail').close(); $('#account').replaceChildren(); notice('');
 if(!user){queue=[];$('#rows').replaceChildren();show('login');return;}
 try{
  profile=requireOk(await db.from('members').select('*').eq('user_id',user.id).single());
  if(!profile?.active)throw new Error('Seu acesso não está autorizado. Fale com a gestão.');
  const account=$('#account');account.append(el('span',profile.display_name));const change=el('button','Alterar senha','secondary');change.onclick=()=>show('password-panel');const out=el('button','Sair','secondary');out.onclick=async()=>{try{requireOk(await db.auth.signOut());await activate(null);}catch(e){report(e);}};account.append(change,out);
  if(recovery){show('password-panel');return;}
  members=requireOk(await db.from('members').select('*').eq('active',true));show('workspace');await initExtras({db,user,profile,load,report,requireOk,stages,getSelected:()=>selected,openDetail});await load();
 }catch(e){await db.auth.signOut();show('login');notice('Acesso indisponível: confirme com a gestão se sua conta foi autorizada.');}
}
async function load(){
 const seq=++loadSeq;$('#rows').replaceChildren();$('#empty').hidden=true;notice('');
 let q=db.from('client_queue').select('*',{count:'exact'});
 if($('#search').value.trim())q=q.ilike('name','%'+$('#search').value.trim()+'%');
 if($('#product').value.trim())q=q.ilike('product_names','%'+$('#product').value.trim()+'%');
 if($('#category').value)q=q.eq('category',$('#category').value);
 if($('#source').value)q=q.contains('sources',[$('#source').value]);
 if($('#buyer').value==='yes')q=q.gt('purchase_count',0);
 if($('#buyer').value==='no')q=q.eq('purchase_count',0);
 if($('#overdue').value==='yes')q=q.lt('next_followup',new Date().toISOString()).not('stage','in','(venda,nao_contatar)');
 if($('#stage').value)q=q.eq('stage',$('#stage').value);
 if($('#owner').value==='mine')q=q.eq('assigned_to',user.id);
 if($('#owner').value==='none')q=q.is('assigned_to',null);
 const col={score:'priority',value:'total_spent',products:'product_count',return:'next_followup'}[$('#sort').value];
 q=q.order(col,{ascending:col==='next_followup',nullsFirst:false}).order('last_purchase',{ascending:false}).order('id').range(page*50,page*50+49);
 const result=await q;if(seq!==loadSeq)return;if(result.error)throw result.error;
 queue=result.data;total=result.count;$('#total').textContent=total.toLocaleString('pt-BR');$('#page').textContent='Página '+(page+1)+' de '+Math.max(1,Math.ceil(total/50));$('#prev').disabled=page===0;$('#next').disabled=(page+1)*50>=total;
 for(const c of queue){const tr=el('tr');const name=el('td');name.append(el('strong',c.name),el('small',c.email || c.phone || (c.instagram?'@'+c.instagram:'Sem contato disponível')));const history=el('td',c.product_count+' produtos · '+c.purchase_count+' compras');history.append(el('small','Última: '+date(c.last_purchase)));const status=el('td');status.append(el('span',stages[c.stage],'badge'));const action=el('td');const button=el('button','Abrir ficha','secondary');button.onclick=()=>openDetail(c).catch(report);action.append(button);tr.append(name,history,el('td',money(c.total_spent)),status,el('td',memberName(c.assigned_to)),el('td',date(c.next_followup)),action);$('#rows').append(tr);}
 $('#empty').hidden=queue.length>0;
}
async function openDetail(c){
 selected=c;refreshClassification(c);$('#client-name').textContent=c.name;$('#client-contact').textContent=[c.email,c.phone].filter(Boolean).join(' · ');$('#client-products').textContent=c.product_names+' · '+money(c.total_spent);
 $('#detail-stage').value=c.stage;$('#feedback').value='';$('#detail-notice').textContent='';const d=c.next_followup?new Date(c.next_followup):null;$('#due').value=d?new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16):'';
 const own=c.assigned_to===user.id||profile.role==='admin';$('#claim').hidden=!!c.assigned_to;$('#ownership').textContent=c.assigned_to?'Responsável: '+memberName(c.assigned_to):'Assuma este atendimento para registrar a conversa.';
 for(const item of $('#activity-form').elements)item.disabled=!own;
 const digits=(c.phone||'').replace(/\D/g,'');const wa=$('#whatsapp');wa.hidden=!/^\d{10,15}$/.test(digits)||c.stage==='nao_contatar';wa.removeAttribute('href');if(!wa.hidden)wa.href='https://wa.me/'+digits;
 $('#history').replaceChildren(el('li','Carregando…'));$('#purchases').replaceChildren();if(!$('#detail').open)$('#detail').showModal();
 const [a,p]=await Promise.all([db.from('activities').select('*').eq('client_id',c.id).order('created_at',{ascending:false}).limit(100),db.from('purchases').select('*').eq('client_id',c.id).eq('status','paid').order('purchased_at',{ascending:false}).limit(100)]);
 if(selected?.id!==c.id)return;$('#history').replaceChildren();for(const row of requireOk(a))$('#history').append(el('li',date(row.created_at)+' · '+memberName(row.actor_id)+' · '+(row.kind==='contact'?'Contato realizado':row.kind==='claim'?'Atendimento assumido':'Acompanhamento')+'\n'+(row.feedback||'')+(row.stage?'\nEtapa: '+stages[row.stage]:'')));if(!a.data.length)$('#history').append(el('li','Nenhum atendimento registrado.'));for(const row of requireOk(p))$('#purchases').append(el('li',row.product_name+' · '+money(row.amount)+' · '+date(row.purchased_at)));
}
$('#login-form').onsubmit=async(e)=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{const r=requireOk(await db.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value}));$('#password').value='';await activate(r.session);}catch{notice('Não foi possível entrar. Confira e-mail e senha.');}finally{b.disabled=false;}};
$('#recover').onclick=async()=>{try{if(!$('#email').reportValidity())return;requireOk(await db.auth.resetPasswordForEmail($('#email').value.trim(),{redirectTo:location.origin+location.pathname}));notice('Se a conta existir, você receberá as instruções para recuperar o acesso.');}catch{notice('Não foi possível solicitar a recuperação. Tente novamente.');}};
$('#password-form').onsubmit=async e=>{e.preventDefault();e.submitter.disabled=true;try{requireOk(await db.auth.updateUser({password:$('#new-password').value}));$('#new-password').value='';recovery=false;requireOk(await db.auth.signOut());await activate(null);notice('Senha atualizada. Entre com sua nova senha.');}catch(e){report(e);}finally{e.submitter.disabled=false;}};
$('#filters').onsubmit=e=>{e.preventDefault();page=0;load().catch(report);};$('#reload').onclick=()=>load().catch(report);$('#prev').onclick=()=>{page--;load().catch(report);};$('#next').onclick=()=>{page++;load().catch(report);};$('#close').onclick=()=>$('#detail').close();
$('#claim').onclick=async()=>{if(writing)return;writing=true;$('#claim').disabled=true;try{requireOk(await db.rpc('claim_client',{p_client:selected.id}));const fresh=requireOk(await db.from('client_queue').select('*').eq('id',selected.id).single());await openDetail(fresh);await load();}catch(e){$('#detail-notice').textContent=e.message;}finally{writing=false;$('#claim').disabled=false;}};
$('#activity-form').onsubmit=async(e)=>{e.preventDefault();if(writing)return;writing=true;const buttons=[...$('#activity-form').querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);try{const due=$('#due').value;requireOk(await db.rpc('record_activity',{p_client:selected.id,p_revision:selected.revision,p_kind:e.submitter.value,p_stage:$('#detail-stage').value,p_feedback:$('#feedback').value.trim(),p_followup:due?new Date(due).toISOString():null}));const fresh=requireOk(await db.from('client_queue').select('*').eq('id',selected.id).single());await openDetail(fresh);$('#detail-notice').textContent='Acompanhamento salvo.';await load();}catch(e){$('#detail-notice').textContent=e.message+' Feche e reabra a ficha se outra pessoa a atualizou.';}finally{writing=false;buttons.forEach(b=>b.disabled=false);}};
if(!/^https:\/\//.test(config.supabaseUrl)||!config.supabaseKey.startsWith('sb_publishable_'))show('setup');
else{
 try{const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');db=createClient(config.supabaseUrl,config.supabaseKey);db.auth.onAuthStateChange((event,session)=>{if(event==='PASSWORD_RECOVERY'){recovery=true;setTimeout(()=>activate(session),0);}if(event==='SIGNED_OUT')setTimeout(()=>activate(null),0);if(event==='TOKEN_REFRESHED'&&session)user=session.user;});const {data,error}=await db.auth.getSession();if(error)throw error;await activate(data.session);}catch(e){show('login');report(new Error('Não foi possível conectar ao serviço de acesso. Confira a configuração e sua conexão.'));}
}
