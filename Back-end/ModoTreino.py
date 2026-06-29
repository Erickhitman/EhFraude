import json
import os
import random
from groq import Groq, APIConnectionError, RateLimitError, APIStatusError
from dotenv import load_dotenv

load_dotenv()
os.getcwd()
os.getenv("IA_EhFraude")

MODELO = "llama-3.3-70b-versatile"
LIMITE_CRITICO = 85

EXEMPLOS_REAIS = (
    "Abaixo estão exemplos reais de golpes para você se basear no estilo, tom e estrutura. "
    "Nunca copie esses textos — use-os apenas como referência de como golpistas escrevem:\n\n"

    "EXEMPLO 1 (SMS/Correios):\n"
    "'CORREIOS: Rute, Seu pacote foi taxado e aguarda sua retirada. "
    "Para saber mais, acesse: http://entregaexpress-live.org'\n\n"

    "EXEMPLO 2 (SMS/Seguridade Social):\n"
    "'Caro contribuinte tem um pagamento em atraso evite e pague ate 24/02. "
    "Mais detalhes em: https://pt.seg-social.at/062915847'\n\n"

    "EXEMPLO 3 (SMS/Banco):\n"
    "'BB: Debito agendado para esta data no canal Celular. "
    "Responda com suas senhas para cancelar.'\n\n"

    "EXEMPLO 4 (WhatsApp/Falso Oficial de Justiça):\n"
    "'Boa tarde Sr., me chamo Marcos sou oficial de justiça. "
    "A perícia técnica junto com o juiz determinou que você recebe um valor de R$56.930,00. "
    "A decisão foi proferida em última instância. Me envie os dados da conta para depósito em sua titularidade.'\n\n"

    "EXEMPLO 5 (SMS/Pix Falso):\n"
    "'BRADESCO: Agendamento PIX no valor de 4.550,00 realizado com sucesso. "
    "Caso nao reconheca ligue imediatamente para 0800 400 8045'\n\n"

    "EXEMPLO 6 (WhatsApp/Atualização Falsa):\n"
    "'Você recebeu uma mensagem, mas sua versão do WhatsApp não é compatível. "
    "Atualizar o WhatsApp: [link]'\n\n"

    "EXEMPLO 7 (WhatsApp/Sindicato Falso):\n"
    "'COMUNICADO URGENTE — SINDICATO DOS TRABALHADORES DAS INSTITUIÇÕES FEDERAIS DE ENSINO: "
    "DE MATO GROSSO DO SUL CUMPRIMENTO DE SENTENÇA CONTRA A UNIÃO FEDERAL AGU.'\n\n"

    "EXEMPLO 8 (SMS/Bolsa Família):\n"
    "'Bolsa-Familia informa: Dados desatualizados, atualize e evite suspensao do programa social brasil-att.com'\n\n"

    "EXEMPLO 9 (SMS/CRAS):\n"
    "'ALERTA C R A S: Dados Desatualizados, atualize agora e evite perde seu beneflcio PRAZO 19/03/2024 bit.ly/cadattt'\n\n"

    "Use o estilo desses exemplos para criar desafios realistas e convincentes, "
    "respeitando os padrões de linguagem, urgência e links suspeitos encontrados nesses casos reais.\n\n"
)

SYSTEM_PROMPT = EXEMPLOS_REAIS +(
    "Você é um especialista em segurança digital, golpes virtuais e educação cibernética. "
    "Sua função é criar desafios educativos para treinar usuários a identificar fraudes digitais.\n\n"
    "Os desafios devem ser variados, realistas e baseados em situações comuns, como phishing, golpes via Pix, "
    "falsos boletos, promoções falsas, golpes de WhatsApp, falsas centrais bancárias, redes sociais e e-mails maliciosos.\n\n"
    "Cada desafio deve conter uma mensagem fictícia semelhante às utilizadas por golpistas, "
    "mas nunca copiar textos reais de empresas ou pessoas.\n\n"
    "Após a mensagem, gere quatro alternativas (A, B, C e D), contendo apenas UMA resposta correta.\n\n"
    "A resposta correta deve representar a atitude mais segura para o usuário.\n\n"
    "Além da resposta correta, gere uma explicação simples e educativa mostrando quais sinais indicam a fraude e como evitá-la.\n\n"
    "Defina também um nível de dificuldade utilizando apenas um destes valores:\n"
    "- FACIL\n"
    "- MEDIO\n"
    "- DIFICIL\n\n"
    "Sua resposta deve ser obrigatoriamente em JSON seguindo exatamente esta estrutura:\n\n"
    "{\n"
    '  "titulo": "Título curto do desafio",\n'
    '  "categoria": "Phishing | Pix | WhatsApp | E-mail | SMS | Redes Sociais | Outro",\n'
    '  "dificuldade": "FACIL | MEDIO | DIFICIL",\n'
    '  "mensagem": "Mensagem fictícia do desafio",\n'
    '  "alternativas": {\n'
    '      "A": "Alternativa A",\n'
    '      "B": "Alternativa B",\n'
    '      "C": "Alternativa C",\n'
    '      "D": "Alternativa D"\n'
    "  },\n"
    '  "resposta_correta": "A | B | C | D",\n'
    '  "explicacao": "Explicação educativa sobre a resposta correta.",\n'
    '  "dica": "Dica curta para evitar golpes semelhantes."\n'
    "}\n\n"
    "As alternativas devem ser plausíveis para estimular o pensamento crítico do usuário. "
    "Nunca deixe a resposta correta óbvia. "
    "A resposta correta deve ser distribuída aleatoriamente entre as alternativas A, B, C e D. "
    "Nunca coloque a resposta correta sempre na mesma posição. "
    '  "alternativas": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],\n'
    '  "resposta_correta": "Texto exato da alternativa correta",\n'
    "Em cada desafio, escolha uma letra diferente para ser a correta."
    "A explicação deve ensinar conceitos de segurança digital, e não apenas informar qual alternativa estava correta."
    "Além da resposta correta, gere uma explicação simples, clara e educativa, "
    "explicando por que a alternativa correta é a mais segura. "
    "A explicação deve ser de fácil entendimento, utilizando linguagem acessível para pessoas sem conhecimento técnico em segurança digital. "
    "Evite termos excessivamente técnicos ou, quando necessário, explique-os de forma simples.\n\n"
    "Você receberá o contexto de desempenho do jogador. "
    "Use a dificuldade informada obrigatoriamente. "
    "Evite as categorias recentes listadas para garantir variedade. "
    "Quanto maior o número de acertos consecutivos, mais elaborada e difícil deve ser a mensagem fictícia do desafio, "
    "mesmo que a dificuldade ainda seja FACIL."
)

sessao = {
    "acertos_totais": 0,
    "erros_totais": 0,
    "acertos_consecutivos": 0,
    "erros_consecutivos": 0,
    "dificuldade_atual": "FACIL",
    "categorias_vistas": []
}

def modo_gamificado(client: Groq, texto: str) -> dict | None:
    try:
        completion = client.chat.completions.create(
            model=MODELO,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": texto}
            ],
            temperature=0.7,
            max_completion_tokens=1024,
            top_p=1,
            stream=False,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)

    except RateLimitError:
        print("Limite de requisições atingido. Aguarde e tente novamente.")
    except APIConnectionError:
        print("Sem conexão com a API da Groq.")
    except APIStatusError as e:
        print(f"Erro da API ({e.status_code}): {e.message}")
    except json.JSONDecodeError as e:
        print(f"Resposta inválida da IA: {e}")
    return None


def calcular_dificuldade(sessao: dict) -> str:
  if sessao["acertos_consecutivos"] >=3:
    if sessao["dificuldade_atual"] == "FACIL":
      return "MEDIO"
    if sessao["dificuldade_atual"] == "MEDIO":
      return "DIFICIL"
    
  if sessao["erros_consecutivos"] >= 2:
    if sessao["dificuldade_atual"] == "DIFICIL":
      return "MEDIO"
    if sessao["dificuldade_atual"] == "MEDIO":
      return "FACIL"

  return sessao ["dificuldade_atual"]

def atualizar_sessao(sessao: dict, acertou: bool, categoria: str) -> None:
  if acertou:
    sessao["acertos_totais"] += 1
    sessao["acertos_consecutivos"] += 1
    sessao["erros_consecutivos"] = 0
  else:
    sessao["erros_totais"] += 1
    sessao["erros_consecutivos"] += 1
    sessao["acertos_consecutivos"] = 0

  sessao["categorias_vistas"].append(categoria)
  if len(sessao["categorias_vistas"]) > 3:
    sessao["categorias_vistas"].pop(0)
  
  sessao["dificuldade_atual"] = calcular_dificuldade(sessao)

def montar_contexto(sessao: dict) -> str:
    categorias_evitar = ", ".join(sessao["categorias_vistas"]) or "Nenhuma"
    
    return (
        f"Acertos consecutivos: {sessao['acertos_consecutivos']}\n"
        f"Erros consecutivos: {sessao['erros_consecutivos']}\n"
        f"Acertos totais: {sessao['acertos_totais']}\n"
        f"Erros totais: {sessao['erros_totais']}\n"
        f"Dificuldade atual: {sessao['dificuldade_atual']}\n"
        f"Categorias recentes a evitar: {categorias_evitar}\n\n"
        f"Gere um desafio de dificuldade {sessao['dificuldade_atual']} "
        f"que não seja das categorias: {categorias_evitar}."
    )

def main():
    api_key = os.getenv("IA_EhFraude")
    if not api_key:
        print("IA_EhFraude não encontrada. Configure o arquivo .env")
        return

    client = Groq(api_key=api_key)
    print("Modo Treino — Digite 'sair' para encerrar.\n")

    while True:
      contexto = montar_contexto(sessao)
      desafio = modo_gamificado(client, contexto)

      if not desafio:
          print("Erro ao gerar desafio. Tente novamente.\n")
          continue
      

      letra_original = desafio["resposta_correta"]
      texto_correto = desafio["alternativas"][letra_original]
      alternativas = list(desafio["alternativas"].values())
      random.shuffle(alternativas)
      letras = ["A", "B", "C", "D"]
      alternativas_mapeadas = dict(zip(letras, alternativas))
      resposta_correta = next(
          letra for letra, texto in alternativas_mapeadas.items()
          if texto == texto_correto
      )

      print(f"\n--- {desafio['titulo']} ---")
      print(f"Categoria: {desafio['categoria']} | Dificuldade: {desafio['dificuldade']}")
      print(f"\n{desafio['mensagem']}\n")

      for letra, alternativa in alternativas_mapeadas.items():
          print(f"{letra}) {alternativa}")

      resposta = input("\nSua resposta (A/B/C/D) ou 'sair': ").strip().upper()
      acertou = resposta == resposta_correta

      if resposta in ("SAIR", "EXIT", "Q"):
        print("Encerrando. Até mais!")
        break

      if resposta not in ("A", "B", "C", "D"):
        print("Resposta inválida. Digite A, B, C ou D.\n")
        continue

      if acertou:
          print("\nCorreto!")
      else:
          print(f"\nErrado! A resposta correta era: {resposta_correta}")

      print(f"{desafio['explicacao']}")
      print(f"Dica: {desafio['dica']}")
      print(f"\nAcertos: {sessao['acertos_totais']} | Erros: {sessao['erros_totais']} | Dificuldade: {sessao['dificuldade_atual']}")

      atualizar_sessao(sessao, acertou, desafio["categoria"])


if __name__ == "__main__":
    main()