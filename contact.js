(()=>{
 const form=document.getElementById('contact-form'),button=document.getElementById('contact-send'),status=document.getElementById('contact-status');
 let busy=false,state='';
 const messages={missing:['O formulário ainda não está disponível. Entre em contato pelo e-mail acima.','The form is not available yet. Please use the email link above.'],sending:['Enviando mensagem…','Sending message…'],success:['Mensagem enviada! Obrigado pelo contato.','Message sent! Thanks for getting in touch.'],error:['Não foi possível enviar. Tente novamente ou use o e-mail acima.','Unable to send. Try again or use the email link above.']};
 function refresh(){const en=document.documentElement.lang.startsWith('en');status.textContent=state?messages[state][en?1:0]:'';button.disabled=busy;button.textContent=busy?(en?'Sending…':'Enviando…'):(en?'Send message':'Enviar mensagem');}
 new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  for(const field of [form.elements.from_name,form.elements.message]){field.value=field.value.trim();}
  if(!form.reportValidity())return;
  const config=window.CONTACT_EMAILJS||{};
  if(!config.serviceId||!config.templateId||!config.publicKey){state='missing';refresh();return;}
  busy=true;state='sending';refresh();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch('https://api.emailjs.com/api/v1.0/email/send',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({service_id:config.serviceId,template_id:config.templateId,user_id:config.publicKey,template_params:{from_name:form.elements.from_name.value,reply_to:form.elements.reply_to.value.trim(),message:form.elements.message.value}})});
   if(!response.ok)throw new Error('Send failed');
   state='success';form.reset();
  }catch{state='error';}finally{clearTimeout(timer);busy=false;refresh();}
 });
})();
