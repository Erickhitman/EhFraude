const form = document.getElementById('form-login');
const mensagem = document.getElementById('mensagem');

form.addEventListener('submit', async (event) => {
  event.preventDefault(); 

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

      if (email === 'teste@ehfraude.com' && senha === '123456') {
    mensagem.textContent = 'Login realizado com sucesso!';
  } else {
    mensagem.textContent = 'E-mail ou senha incorretos.';
  }
});