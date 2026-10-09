# Ativar envio com EmailJS

1. Na sua conta EmailJS, conecte um serviço de e-mail e copie o Service ID.
2. Crie um template. Configure To Email fixo como `lgmelo01@gmail.com`, Reply To como `{{reply_to}}` e Subject como `Contato pelo portfólio — {{from_name}}`. No corpo, inclua `{{from_name}}`, `{{reply_to}}` e `{{message}}`.
3. Copie o Template ID e a Public Key.
4. Preencha serviceId, templateId e publicKey em contact-config.js e envie o arquivo atualizado ao GitHub. Nunca inclua Private Key, senha ou token de login.
5. Envie uma mensagem de teste pelo site e confirme o recebimento, inclusive na pasta de spam.

O formulário mantém a mensagem em caso de falha e só mostra sucesso após a resposta positiva do EmailJS. Até a configuração ser preenchida, ele informa a indisponibilidade e sugere o e-mail direto.
