const form = document.getElementById('form-login');
const mensagem = document.getElementById('mensagem');
const botao = form.querySelector('button[type="submit"]');

document.getElementById('ver-senha').addEventListener('change', (e) => {
  document.getElementById('senha').type = e.target.checked ? 'text' : 'password';
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  mensagem.className = ''; mensagem.textContent = '';
  botao.disabled = true; botao.textContent = 'Entrando…';
  try {
    const user = await API.login(document.getElementById('email').value, document.getElementById('senha').value);
    Session.set(user);
    mensagem.className = 'ok'; mensagem.textContent = 'Login realizado com sucesso!';
    setTimeout(() => { location.href = '../index.html'; }, 600);
  } catch (e) {
    mensagem.className = 'erro'; mensagem.textContent = e.message;
    botao.disabled = false; botao.textContent = 'Entrar';
  }
});
